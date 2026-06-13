export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import {
  createWalletClient,
  createPublicClient,
  defineChain,
  http,
  parseAbi,
  type Address,
  type Hash,
  maxUint256,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// ---------------------------------------------------------------------------
// Chain + contract constants
// ---------------------------------------------------------------------------

const QIE_TESTNET = defineChain({
  id: 1983,
  name: 'QIE Testnet',
  nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc1testnet.qie.digital/'] } },
})

const TRUSTFLOW_ADDRESS = (process.env.NEXT_PUBLIC_TRUSTFLOW_ADDRESS ||
  '0xcD0915cb3423F6665C636d723648F78d88B81e52') as Address

const QUSDC_ADDRESS = (process.env.NEXT_PUBLIC_QUSDC_ADDRESS ||
  '0x1850d2a31CB8669Ba757159B638DE19Af532ba5e') as Address

const TRUSTFLOW_ABI = parseAbi([
  'function getAgreement(uint256) view returns ((uint256 id, address creator, address client, string title, string description, string creatorDomain, uint8 status, uint256 totalAmount, uint256 paidAmount, uint256 createdAt, uint256 completedAt, uint256 milestoneCount))',
  'function fundAgreement(uint256)',
  'function approveMilestone(uint256, uint256)',
])

const ERC20_ABI = parseAbi([
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
])

// ---------------------------------------------------------------------------
// In-memory rate limiter (resets on cold start, fine for demo)
// ---------------------------------------------------------------------------

const rateLimits = new Map<string, number[]>()
const MAX_ACTIONS_PER_HOUR = 3

function checkRateLimit(userAddress: string): boolean {
  const key = userAddress.toLowerCase()
  const now = Date.now()
  const hourAgo = now - 3600_000
  const timestamps = (rateLimits.get(key) || []).filter((t) => t > hourAgo)
  if (timestamps.length >= MAX_ACTIONS_PER_HOUR) return false
  timestamps.push(now)
  rateLimits.set(key, timestamps)
  return true
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

type RelayerAction = 'fund' | 'approve'

interface RelayerRequest {
  action: RelayerAction
  agreementId: string
  milestoneIndex?: number
  userAddress: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RelayerRequest
    const { action, agreementId, milestoneIndex, userAddress } = body

    // 1. Validate inputs
    if (!action || !agreementId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields', fallback: true },
        { status: 400 }
      )
    }
    if (action !== 'fund' && action !== 'approve') {
      return NextResponse.json(
        { success: false, error: 'Invalid action', fallback: true },
        { status: 400 }
      )
    }
    if (action === 'approve' && (milestoneIndex === undefined || milestoneIndex < 0)) {
      return NextResponse.json(
        { success: false, error: 'milestoneIndex required for approve', fallback: true },
        { status: 400 }
      )
    }

    // 2. Rate limit
    if (!checkRateLimit(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit: max 3 relayer actions per hour', fallback: true },
        { status: 429 }
      )
    }

    // 3. Load relayer wallet
    const relayerKey = process.env.RELAYER_PRIVATE_KEY
    if (!relayerKey) {
      return NextResponse.json(
        { success: false, error: 'Relayer not configured', fallback: true },
        { status: 503 }
      )
    }

    const account = privateKeyToAccount(relayerKey as `0x${string}`)
    const transport = http('https://rpc1testnet.qie.digital/')

    const publicClient = createPublicClient({
      chain: QIE_TESTNET,
      transport,
    })

    const walletClient = createWalletClient({
      account,
      chain: QIE_TESTNET,
      transport,
    })

    // 4. Verify the agreement's client == relayer address
    const agreement = await publicClient.readContract({
      address: TRUSTFLOW_ADDRESS,
      abi: TRUSTFLOW_ABI,
      functionName: 'getAgreement',
      args: [BigInt(agreementId)],
    })

    if (agreement.client.toLowerCase() !== account.address.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Relayer is not the client for this agreement',
          fallback: true,
        },
        { status: 403 }
      )
    }

    // 5. Balance pre-checks
    const MIN_GAS_QIE = 50_000_000_000_000_000n // 0.05 QIE
    const relayerQIE = await publicClient.getBalance({ address: account.address })

    if (relayerQIE < MIN_GAS_QIE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Relayer wallet low on gas (QIE). Try again later.',
          fallback: true,
        },
        { status: 503 }
      )
    }

    if (action === 'fund') {
      const relayerQUSDC = await publicClient.readContract({
        address: QUSDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account.address],
      })
      if (relayerQUSDC < agreement.totalAmount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Relayer wallet has insufficient QUSDC to fund this agreement.',
            fallback: true,
          },
          { status: 503 }
        )
      }
    }

    let txHash: Hash

    // 6. Execute allowed actions
    if (action === 'fund') {
      // Agreement must be in Draft status (0)
      if (agreement.status !== 0) {
        return NextResponse.json(
          { success: false, error: 'Agreement is not in draft status', fallback: true },
          { status: 400 }
        )
      }

      // Check + set allowance
      const currentAllowance = await publicClient.readContract({
        address: QUSDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account.address, TRUSTFLOW_ADDRESS],
      })

      if (currentAllowance < agreement.totalAmount) {
        const approveHash = await walletClient.writeContract({
          address: QUSDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [TRUSTFLOW_ADDRESS, maxUint256],
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      // Fund
      txHash = await walletClient.writeContract({
        address: TRUSTFLOW_ADDRESS,
        abi: TRUSTFLOW_ABI,
        functionName: 'fundAgreement',
        args: [BigInt(agreementId)],
      })
      await publicClient.waitForTransactionReceipt({ hash: txHash })
    } else {
      // approve action
      // Agreement must be Active (1)
      if (agreement.status !== 1) {
        return NextResponse.json(
          { success: false, error: 'Agreement is not active', fallback: true },
          { status: 400 }
        )
      }

      txHash = await walletClient.writeContract({
        address: TRUSTFLOW_ADDRESS,
        abi: TRUSTFLOW_ABI,
        functionName: 'approveMilestone',
        args: [BigInt(agreementId), BigInt(milestoneIndex!)],
      })
      await publicClient.waitForTransactionReceipt({ hash: txHash })
    }

    return NextResponse.json({ success: true, txHash })
  } catch (error: any) {
    console.error('Relayer error:', error?.message || error)
    return NextResponse.json(
      {
        success: false,
        error: 'Relayer transaction failed. You can complete this manually with a second wallet.',
        fallback: true,
      },
      { status: 500 }
    )
  }
}

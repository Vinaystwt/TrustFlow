'use client'

import { useCallback, useState } from 'react'
import {
  useReadContract,
  useWriteContract,
  useConfig,
  type UseReadContractParameters,
} from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { decodeEventLog, maxUint256, type Address, type Hash } from 'viem'
import { TRUSTFLOW_ABI, ERC20_ABI } from '@/lib/contracts'
import { useContracts } from '@/lib/useContracts'
import type { Agreement, Milestone, TrustProfile, EnforcedTerms } from '@/lib/utils'

const READ_OPTS = { staleTime: 10_000 }

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export function useGetAgreement(agreementId?: bigint) {
  const { trustFlowAddress, chainId } = useContracts()
  const q = useReadContract({
    abi: TRUSTFLOW_ABI,
    address: trustFlowAddress,
    chainId,
    functionName: 'getAgreement',
    args: agreementId !== undefined ? [agreementId] : undefined,
    query: { enabled: agreementId !== undefined, ...READ_OPTS },
  } as UseReadContractParameters)
  return { ...q, agreement: q.data as Agreement | undefined }
}

export function useGetMilestones(agreementId?: bigint) {
  const { trustFlowAddress, chainId } = useContracts()
  const q = useReadContract({
    abi: TRUSTFLOW_ABI,
    address: trustFlowAddress,
    chainId,
    functionName: 'getMilestones',
    args: agreementId !== undefined ? [agreementId] : undefined,
    query: { enabled: agreementId !== undefined, ...READ_OPTS },
  } as UseReadContractParameters)
  return { ...q, milestones: q.data as Milestone[] | undefined }
}

export function useGetUserAgreements(userAddress?: Address) {
  const { trustFlowAddress, chainId } = useContracts()
  const q = useReadContract({
    abi: TRUSTFLOW_ABI,
    address: trustFlowAddress,
    chainId,
    functionName: 'getUserAgreements',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, ...READ_OPTS },
  } as UseReadContractParameters)
  return { ...q, ids: q.data as bigint[] | undefined }
}

export function useGetTrustProfile(userAddress?: Address) {
  const { trustFlowAddress, chainId } = useContracts()
  const q = useReadContract({
    abi: TRUSTFLOW_ABI,
    address: trustFlowAddress,
    chainId,
    functionName: 'getTrustProfile',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, ...READ_OPTS },
  } as UseReadContractParameters)
  return { ...q, profile: q.data as TrustProfile | undefined }
}

export function useGetEnforcedTerms(userAddress?: Address) {
  const { trustFlowAddress, chainId } = useContracts()
  const q = useReadContract({
    abi: TRUSTFLOW_ABI,
    address: trustFlowAddress,
    chainId,
    functionName: 'getEnforcedTerms',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, ...READ_OPTS },
  } as UseReadContractParameters)

  const raw = q.data as
    | readonly [number, string, bigint, boolean, bigint]
    | undefined
  const terms: EnforcedTerms | undefined = raw
    ? {
        tier: Number(raw[0]),
        tierName: raw[1],
        upfrontBps: raw[2],
        hasAutoClaim: raw[3],
        claimWindowHours: raw[4],
      }
    : undefined

  return { ...q, terms }
}

// ---------------------------------------------------------------------------
// QUSDC hooks
// ---------------------------------------------------------------------------

export function useQUSDCBalance(address?: Address) {
  const { qusdcAddress, chainId } = useContracts()
  const q = useReadContract({
    abi: ERC20_ABI,
    address: qusdcAddress,
    chainId,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, ...READ_OPTS },
  } as UseReadContractParameters)
  return { ...q, balance: q.data as bigint | undefined }
}

export function useQUSDCAllowance(owner?: Address) {
  const { trustFlowAddress, qusdcAddress, chainId } = useContracts()
  const q = useReadContract({
    abi: ERC20_ABI,
    address: qusdcAddress,
    chainId,
    functionName: 'allowance',
    args: owner ? [owner, trustFlowAddress] : undefined,
    query: { enabled: !!owner, ...READ_OPTS },
  } as UseReadContractParameters)
  return { ...q, allowance: q.data as bigint | undefined }
}

// ---------------------------------------------------------------------------
// Generic write hook
// ---------------------------------------------------------------------------

export type WriteStatus = 'idle' | 'loading' | 'success' | 'error'

interface WriteResult {
  status: WriteStatus
  hash?: Hash
  error?: unknown
  reset: () => void
}

function useTrustFlowWrite() {
  const config = useConfig()
  const { trustFlowAddress, chainId } = useContracts()
  const { writeContractAsync } = useWriteContract()
  const [status, setStatus] = useState<WriteStatus>('idle')
  const [hash, setHash] = useState<Hash>()
  const [error, setError] = useState<unknown>()

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(undefined)
    setError(undefined)
  }, [])

  const run = useCallback(
    async (functionName: string, args: unknown[]): Promise<Hash> => {
      setStatus('loading')
      setError(undefined)
      try {
        const txHash = await writeContractAsync({
          abi: TRUSTFLOW_ABI,
          address: trustFlowAddress,
          chainId,
          functionName: functionName as never,
          args: args as never,
        })
        setHash(txHash)
        await waitForTransactionReceipt(config, { hash: txHash, chainId })
        setStatus('success')
        return txHash
      } catch (e) {
        setError(e)
        setStatus('error')
        throw e
      }
    },
    [config, writeContractAsync, trustFlowAddress, chainId]
  )

  return { run, status, hash, error, reset }
}

// ---------------------------------------------------------------------------
// Create agreement (returns new agreement id parsed from event)
// ---------------------------------------------------------------------------

export function useCreateAgreement() {
  const config = useConfig()
  const { trustFlowAddress, chainId } = useContracts()
  const { writeContractAsync } = useWriteContract()
  const [status, setStatus] = useState<WriteStatus>('idle')
  const [hash, setHash] = useState<Hash>()
  const [error, setError] = useState<unknown>()

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(undefined)
    setError(undefined)
  }, [])

  const create = useCallback(
    async (params: {
      title: string
      description: string
      client: Address
      names: string[]
      amounts: bigint[]
      domain: string
    }): Promise<{ hash: Hash; agreementId?: bigint }> => {
      setStatus('loading')
      setError(undefined)
      try {
        const txHash = await writeContractAsync({
          abi: TRUSTFLOW_ABI,
          address: trustFlowAddress,
          chainId,
          functionName: 'createAgreement',
          args: [
            params.title,
            params.description,
            params.client,
            params.names,
            params.amounts,
            params.domain,
          ],
        })
        setHash(txHash)
        const receipt = await waitForTransactionReceipt(config, { hash: txHash, chainId })

        let agreementId: bigint | undefined
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: TRUSTFLOW_ABI,
              data: log.data,
              topics: log.topics,
            })
            if (decoded.eventName === 'AgreementCreated') {
              agreementId = (decoded.args as { agreementId: bigint }).agreementId
              break
            }
          } catch {
            /* not our event */
          }
        }

        setStatus('success')
        return { hash: txHash, agreementId }
      } catch (e) {
        setError(e)
        setStatus('error')
        throw e
      }
    },
    [config, writeContractAsync, trustFlowAddress, chainId]
  )

  return { create, status, hash, error, reset }
}

// ---------------------------------------------------------------------------
// Fund flow: approve QUSDC (if needed) then fundAgreement
// ---------------------------------------------------------------------------

export type FundStep = 'idle' | 'approving' | 'funding' | 'success' | 'error'

export function useFundAgreement() {
  const config = useConfig()
  const { trustFlowAddress, qusdcAddress, chainId } = useContracts()
  const { writeContractAsync } = useWriteContract()
  const [step, setStep] = useState<FundStep>('idle')
  const [hash, setHash] = useState<Hash>()
  const [error, setError] = useState<unknown>()

  const reset = useCallback(() => {
    setStep('idle')
    setHash(undefined)
    setError(undefined)
  }, [])

  const fund = useCallback(
    async (agreementId: bigint, amount: bigint, currentAllowance: bigint) => {
      setError(undefined)
      try {
        if (currentAllowance < amount) {
          setStep('approving')
          const approveHash = await writeContractAsync({
            abi: ERC20_ABI,
            address: qusdcAddress,
            chainId,
            functionName: 'approve',
            args: [trustFlowAddress, maxUint256],
          })
          await waitForTransactionReceipt(config, { hash: approveHash, chainId })
        }

        setStep('funding')
        const fundHash = await writeContractAsync({
          abi: TRUSTFLOW_ABI,
          address: trustFlowAddress,
          chainId,
          functionName: 'fundAgreement',
          args: [agreementId],
        })
        setHash(fundHash)
        await waitForTransactionReceipt(config, { hash: fundHash, chainId })
        setStep('success')
        return fundHash
      } catch (e) {
        setError(e)
        setStep('error')
        throw e
      }
    },
    [config, writeContractAsync, trustFlowAddress, qusdcAddress, chainId]
  )

  return { fund, step, hash, error, reset }
}

// ---------------------------------------------------------------------------
// Milestone + cancel writes
// ---------------------------------------------------------------------------

export function useCompleteMilestone() {
  const { run, ...rest } = useTrustFlowWrite()
  const completeMilestone = useCallback(
    (agreementId: bigint, index: number, proofURI: string) =>
      run('completeMilestone', [agreementId, BigInt(index), proofURI]),
    [run]
  )
  return { completeMilestone, ...rest }
}

export function useApproveMilestone() {
  const { run, ...rest } = useTrustFlowWrite()
  const approveMilestone = useCallback(
    (agreementId: bigint, index: number) =>
      run('approveMilestone', [agreementId, BigInt(index)]),
    [run]
  )
  return { approveMilestone, ...rest }
}

export function useCancelAgreement() {
  const { run, ...rest } = useTrustFlowWrite()
  const cancelAgreement = useCallback(
    (agreementId: bigint) => run('cancelAgreement', [agreementId]),
    [run]
  )
  return { cancelAgreement, ...rest }
}

// V2: Tier 3 creator auto-claim after the dispute window elapses.
export function useClaimMilestone() {
  const { run, ...rest } = useTrustFlowWrite()
  const claimMilestone = useCallback(
    (agreementId: bigint, index: number) =>
      run('claimMilestone', [agreementId, BigInt(index)]),
    [run]
  )
  return { claimMilestone, ...rest }
}

// ---------------------------------------------------------------------------
// QUSDC faucet: mint 1,000 test QUSDC to connected wallet
// ---------------------------------------------------------------------------

export function useMintQUSDC() {
  const config = useConfig()
  const { qusdcAddress, chainId } = useContracts()
  const { writeContractAsync } = useWriteContract()
  const [status, setStatus] = useState<WriteStatus>('idle')
  const [hash, setHash] = useState<Hash>()
  const [error, setError] = useState<unknown>()

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(undefined)
    setError(undefined)
  }, [])

  const mint = useCallback(
    async (to: Address, amount: bigint = 1_000_000_000n): Promise<Hash> => {
      setStatus('loading')
      setError(undefined)
      try {
        const txHash = await writeContractAsync({
          abi: ERC20_ABI,
          address: qusdcAddress,
          chainId,
          functionName: 'mint',
          args: [to, amount],
        })
        setHash(txHash)
        await waitForTransactionReceipt(config, { hash: txHash, chainId })
        setStatus('success')
        return txHash
      } catch (e) {
        setError(e)
        setStatus('error')
        throw e
      }
    },
    [config, writeContractAsync, qusdcAddress, chainId]
  )

  return { mint, status, hash, error, reset }
}

// V2: client disputes a completed milestone, cancelling auto-claim eligibility.
export function useDisputeMilestone() {
  const { run, ...rest } = useTrustFlowWrite()
  const disputeMilestone = useCallback(
    (agreementId: bigint, index: number) =>
      run('disputeMilestone', [agreementId, BigInt(index)]),
    [run]
  )
  return { disputeMilestone, ...rest }
}

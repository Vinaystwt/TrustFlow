import { formatUnits, parseUnits, type Address } from 'viem'
import { QUSDC_DECIMALS } from './contracts'

// ---------------------------------------------------------------------------
// On-chain data types (mirror the Solidity structs)
// ---------------------------------------------------------------------------

export type AgreementStatus = 0 | 1 | 2 | 3 // Draft | Active | Completed | Cancelled
export type MilestoneStatus = 0 | 1 | 2 | 3 | 4 // Pending | Funded | Completed | Approved | Disputed

export interface Agreement {
  id: bigint
  creator: Address
  client: Address
  title: string
  description: string
  creatorDomain: string
  status: AgreementStatus
  totalAmount: bigint
  paidAmount: bigint
  createdAt: bigint
  completedAt: bigint
  milestoneCount: bigint
}

export interface Milestone {
  name: string
  amount: bigint
  status: MilestoneStatus
  proofURI: string
  completedAt: bigint
  approvedAt: bigint
}

export interface TrustProfile {
  completedAgreements: bigint
  totalVolumeUSDC: bigint
  disputeCount: bigint
  trustScore: bigint
  tier: number
  qiePassVerified: boolean
  lastUpdated: bigint
}

// ---------------------------------------------------------------------------
// QUSDC formatting (6 decimals)
// ---------------------------------------------------------------------------

export function formatQUSDC(amount: bigint | undefined, withSuffix = true): string {
  if (amount === undefined) return withSuffix ? '0.00 QUSDC' : '0.00'
  const raw = formatUnits(amount, QUSDC_DECIMALS)
  const num = Number(raw)
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return withSuffix ? `${formatted} QUSDC` : formatted
}

export function parseQUSDC(value: string): bigint {
  return parseUnits(value || '0', QUSDC_DECIMALS)
}

export function qusdcToNumber(amount: bigint | undefined): number {
  if (amount === undefined) return 0
  return Number(formatUnits(amount, QUSDC_DECIMALS))
}

// ---------------------------------------------------------------------------
// Address helpers
// ---------------------------------------------------------------------------

export function truncateAddress(address?: string, lead = 6, trail = 4): string {
  if (!address) return ''
  if (address.length <= lead + trail) return address
  return `${address.slice(0, lead)}...${address.slice(-trail)}`
}

export function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}

// ---------------------------------------------------------------------------
// Status maps
// ---------------------------------------------------------------------------

export const AGREEMENT_STATUS_LABEL: Record<AgreementStatus, string> = {
  0: 'Draft',
  1: 'Active',
  2: 'Completed',
  3: 'Cancelled',
}

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  0: 'Pending',
  1: 'Funded',
  2: 'Completed',
  3: 'Approved',
  4: 'Disputed',
}

// ---------------------------------------------------------------------------
// Trust tiers
// ---------------------------------------------------------------------------

export interface Tier {
  id: number
  name: string
  color: string
  range: string
  benefits: string
}

export const TIERS: Tier[] = [
  { id: 0, name: 'Newcomer', color: '#64748B', range: '0-199', benefits: 'Escrow-only' },
  { id: 1, name: 'Verified', color: '#3B82F6', range: '200-499', benefits: 'Standard terms, 48h dispute' },
  { id: 2, name: 'Trusted', color: '#10B981', range: '500-799', benefits: '24h dispute, priority' },
  { id: 3, name: 'Elite', color: '#F59E0B', range: '800-1000', benefits: 'Instant settlement, advances' },
]

export function tierInfo(tier: number): Tier {
  return TIERS[Math.min(Math.max(tier, 0), 3)]
}

const TIER_THRESHOLDS = [200, 500, 800, 1001]

/** Returns the score required for the next tier, or null at max tier. */
export function nextTierAt(score: number): number | null {
  if (score >= 800) return null
  if (score < 200) return 200
  if (score < 500) return 500
  return 800
}

export { TIER_THRESHOLDS }

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function formatDate(timestamp: bigint | undefined): string {
  if (!timestamp || timestamp === 0n) return '—'
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Contract error → friendly message
// ---------------------------------------------------------------------------

const ERROR_MAP: { match: string; message: string }[] = [
  { match: 'caller is not client', message: 'Only the client can perform this action' },
  { match: 'caller is not creator', message: 'Only the freelancer can perform this action' },
  { match: 'caller is not party', message: 'Only a party to this agreement can do this' },
  { match: 'agreement is not active', message: 'This agreement is not currently active' },
  { match: 'agreement is not draft', message: 'This agreement is no longer a draft' },
  { match: 'milestone is not funded', message: "This milestone hasn't been funded yet" },
  { match: 'milestone is not completed', message: "Freelancer hasn't marked this complete yet" },
  { match: 'client cannot be creator', message: 'Client and freelancer must be different addresses' },
  { match: 'invalid milestone count', message: 'You need between 1 and 10 milestones' },
  { match: 'transfer amount exceeds balance', message: 'Insufficient QUSDC balance' },
  { match: 'insufficient allowance', message: 'QUSDC approval required before funding' },
]

export function friendlyError(error: unknown): string {
  if (!error) return 'Something went wrong'
  const raw =
    (typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)) || ''

  const lower = raw.toLowerCase()

  if (
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('rejected the request')
  ) {
    return 'Transaction rejected in your wallet'
  }

  for (const { match, message } of ERROR_MAP) {
    if (lower.includes(match.toLowerCase())) return message
  }

  if (lower.includes('insufficient funds')) {
    return 'Insufficient QIE for gas fees'
  }

  // Trim very long viem messages to first line
  const firstLine = raw.split('\n')[0]
  return firstLine.length > 120 ? 'Transaction failed. Please try again.' : firstLine
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

import { AGREEMENT_STATUS_LABEL, type AgreementStatus } from '@/lib/utils'

const STYLES: Record<AgreementStatus, { bg: string; color: string }> = {
  0: { bg: 'rgba(100,116,139,0.2)', color: '#94A3B8' },
  1: { bg: 'rgba(59,130,246,0.2)', color: '#60A5FA' },
  2: { bg: 'rgba(16,185,129,0.2)', color: '#34D399' },
  3: { bg: 'rgba(239,68,68,0.2)', color: '#F87171' },
}

export function StatusBadge({ status }: { status: AgreementStatus }) {
  const s = STYLES[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {AGREEMENT_STATUS_LABEL[status]}
    </span>
  )
}

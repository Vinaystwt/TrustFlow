import { tierInfo, cx } from '@/lib/utils'

export function TierBadge({
  tier,
  size = 'md',
}: {
  tier: number
  size?: 'sm' | 'md'
}) {
  const info = tierInfo(tier)
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-display font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
      style={{
        backgroundColor: `${info.color}22`,
        color: info.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: info.color }}
      />
      Tier {info.id} · {info.name}
    </span>
  )
}

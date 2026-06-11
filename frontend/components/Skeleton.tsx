import { cx } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-32" />
      <Skeleton className="mt-5 h-2 w-full rounded-full" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function SkeletonRing() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-[200px] w-[200px] rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="card p-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-7 w-24" />
    </div>
  )
}

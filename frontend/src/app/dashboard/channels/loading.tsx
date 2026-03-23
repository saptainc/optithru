import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </div>
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

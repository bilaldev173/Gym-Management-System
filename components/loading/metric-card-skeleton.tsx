import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardSkeletonProps {
  className?: string;
}

export function MetricCardSkeleton({ className }: MetricCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 p-7 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-12 w-24" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-4" />
        </div>
      </div>
    </div>
  );
}

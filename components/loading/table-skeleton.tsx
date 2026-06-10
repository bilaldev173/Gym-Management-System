import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 px-5 py-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`header-${i}`}
            className="h-4 w-20 flex-shrink-0"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-3 rounded-xl border border-slate-800/40 bg-slate-950/20 px-5 py-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                "h-4 flex-shrink-0",
                colIndex === 0 ? "w-32" : colIndex === 1 ? "w-24" : "w-20"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GlassmorphicSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function GlassmorphicSkeleton({
  className,
  children,
}: GlassmorphicSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-lg",
        className
      )}
    >
      {children || <Skeleton className="h-32 w-full" />}
    </div>
  );
}

interface GlassmorphicCardSkeletonProps {
  className?: string;
  hasIcon?: boolean;
  children?: React.ReactNode;
}

export function GlassmorphicCardSkeleton({
  className,
  hasIcon = true,
  children,
}: GlassmorphicCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-lg",
        className
      )}
    >
      {children ?? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            {hasIcon && <Skeleton className="size-10 rounded-full" />}
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </>
      )}
    </div>
  );
}

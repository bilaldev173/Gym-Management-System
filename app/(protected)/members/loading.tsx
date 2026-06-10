// Loading placeholder for Members page
import { TableSkeleton } from "@/components/loading/table-skeleton";

export default function Loading() {
  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-lg">
      <TableSkeleton columns={5} rows={5} />
    </div>
  );
}

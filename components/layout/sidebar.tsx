import { Dumbbell } from "lucide-react";

import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25">
          <Dumbbell className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-white">
            Sports Salle
          </p>
          <p className="mt-1 text-xs text-zinc-500">Management</p>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>

      <SidebarFooter />
    </aside>
  );
}

"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getUserDisplayName,
  getUserGymName,
  getUserInitials,
  type UserMetadata,
} from "@/lib/auth";
import { createClient } from "@/utils/supabase/client";

export function SidebarFooter() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [displayName, setDisplayName] = useState("Manager");
  const [gymName, setGymName] = useState("Sports Salle");
  const [initials, setInitials] = useState("M");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const metadata = data.user?.user_metadata as UserMetadata | undefined;

      setDisplayName(getUserDisplayName(metadata));
      setGymName(getUserGymName(metadata));
      setInitials(getUserInitials(metadata));
    }

    void loadUser();
  }, [supabase]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/20">
          {initials || <User className="size-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-zinc-500">{gymName}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          title="Sign out"
          className="rounded-lg border border-zinc-700/80 bg-zinc-800/50 p-2 text-zinc-300 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 disabled:opacity-50"
      >
        {isSigningOut ? "Signing out..." : "Sign Out"}
      </button>
    </div>
  );
}

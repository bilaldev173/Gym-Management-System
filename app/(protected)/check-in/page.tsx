"use client";

import {
  CheckCircle2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { GlassmorphicCardSkeleton } from "@/components/loading/glassmorphic-skeleton";

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
};

type Subscription = {
  id: string;
  member_id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  price: number;
  status: string;
};

type VerificationResult = {
  member: Member;
  subscription: Subscription | null;
  granted: boolean;
};

type Toast = {
  message: string;
  type: "success" | "error";
};

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isSubscriptionActive(endDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  return end >= today;
}

function getExpirationCountdown(endDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  const diffDays = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "1 day remaining";
  return `${diffDays} days remaining`;
}

export default function CheckInPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("members")
      .select("id, first_name, last_name, phone")
      .order("last_name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setMembers([]);
    } else {
      setMembers((data as Member[]) ?? []);
    }

    setIsLoadingMembers(false);
  }, [supabase]);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(async () => {
      if (isActive) {
        await fetchMembers();
      }
    });

    return () => {
      isActive = false;
    };
  }, [fetchMembers]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchingMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return members.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const phone = (member.phone ?? "").toLowerCase();

      return (
        member.first_name.toLowerCase().includes(query) ||
        member.last_name.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        phone.includes(query)
      );
    });
  }, [members, searchQuery]);

  function resetDesk() {
    setSearchQuery("");
    setVerification(null);
    setIsDropdownOpen(false);
    setError(null);
  }

  async function handleMemberSelect(member: Member) {
    setIsVerifying(true);
    setError(null);
    setVerification(null);
    setIsDropdownOpen(false);
    setSearchQuery(`${member.first_name} ${member.last_name}`);

    const { data, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      setError(subscriptionError.message);
      setIsVerifying(false);
      return;
    }

    const subscription = (data as Subscription | null) ?? null;
    const granted =
      subscription !== null && isSubscriptionActive(subscription.end_date);

    setVerification({ member, subscription, granted });
    setIsVerifying(false);
  }

  async function handleLogEntry() {
    if (!verification?.granted) return;

    setIsLogging(true);
    setError(null);

    const { error: insertError } = await supabase.from("check_ins").insert({
      member_id: verification.member.id,
    });

    if (insertError) {
      setError(insertError.message);
      setToast({ message: "Failed to log check-in.", type: "error" });
      setIsLogging(false);
      return;
    }

    setToast({
      message: `${verification.member.first_name} checked in successfully.`,
      type: "success",
    });
    setIsLogging(false);
    resetDesk();
  }

  return (
    <>
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-[60] flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md",
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border-red-500/30 bg-red-500/15 text-red-300"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <ShieldAlert className="size-4" />
          )}
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-lg">
        <div className="mb-8 space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Check-in Desk
          </h1>
          <p className="text-slate-400">
            Search a member to verify subscription access in real time.
          </p>
        </div>

        <div ref={searchContainerRef} className="relative mx-auto mb-10 max-w-2xl">
          <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsDropdownOpen(true);
              setVerification(null);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search by member name or phone number..."
            className="w-full rounded-2xl border border-slate-700/60 bg-slate-950/50 py-5 pr-12 pl-14 text-lg text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={resetDesk}
              className="absolute top-1/2 right-4 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}

          {isDropdownOpen && searchQuery.trim() && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {isLoadingMembers ? (
                <div className="px-5 py-8">
                  <GlassmorphicCardSkeleton className="border-0 bg-transparent p-0" hasIcon={false} />
                </div>
              ) : matchingMembers.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-400">
                  No members found matching &quot;{searchQuery}&quot;
                </p>
              ) : (
                <ul className="max-h-72 overflow-y-auto py-2">
                  {matchingMembers.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => void handleMemberSelect(member)}
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-slate-800/60"
                      >
                        <span className="font-medium text-slate-100">
                          {member.first_name} {member.last_name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {member.phone ?? "No phone"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {isVerifying && (
          <div className="mx-auto max-w-2xl">
            <GlassmorphicCardSkeleton className="border border-slate-800/60 bg-slate-950/40 px-6 py-16" hasIcon={false}>
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="size-8 animate-spin text-emerald-400" />
                <span>Verifying subscription access...</span>
              </div>
            </GlassmorphicCardSkeleton>
          </div>
        )}

        {!isVerifying && verification?.granted && (
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-xl md:p-12">
            <div className="mb-4 flex justify-center">
              <ShieldCheck className="size-14 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-emerald-400 md:text-5xl">
              ✅ ACCESS GRANTED
            </h2>
            <p className="mt-4 text-2xl font-semibold text-slate-100">
              {verification.member.first_name} {verification.member.last_name}
            </p>

            {verification.subscription && (
              <div className="mx-auto mt-8 grid max-w-lg gap-4 rounded-2xl border border-emerald-500/20 bg-slate-950/30 p-6 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Plan</span>
                  <span className="font-semibold text-slate-100">
                    {verification.subscription.plan_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Valid Until</span>
                  <span className="font-semibold text-slate-100">
                    {formatDate(verification.subscription.end_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Expiration</span>
                  <span className="font-semibold text-emerald-300">
                    {getExpirationCountdown(verification.subscription.end_date)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleLogEntry()}
              disabled={isLogging}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {isLogging ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Logging Entry...
                </>
              ) : (
                "Log Entry"
              )}
            </button>
          </div>
        )}

        {!isVerifying && verification && !verification.granted && (
          <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-2xl shadow-red-500/10 backdrop-blur-xl md:p-12">
            <div className="mb-4 flex justify-center">
              <ShieldAlert className="size-14 text-red-400" />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-red-400 md:text-5xl">
              ❌ ACCESS DENIED / EXPIRED
            </h2>
            <p className="mt-4 text-2xl font-semibold text-slate-100">
              {verification.member.first_name} {verification.member.last_name}
            </p>
            <p className="mx-auto mt-6 max-w-md text-slate-400">
              {verification.subscription
                ? `Latest plan (${verification.subscription.plan_type}) expired on ${formatDate(verification.subscription.end_date)}.`
                : "No active subscription found for this member."}
            </p>
          </div>
        )}

        {!isVerifying && !verification && !searchQuery && (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/20 px-6 py-12 text-center">
            <Search className="mx-auto mb-4 size-10 text-slate-600" />
            <p className="font-medium text-slate-300">Ready for check-in</p>
            <p className="mt-2 text-sm text-slate-500">
              Start typing a member name or phone number above.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { CalendarDays, Loader2, Plus, X } from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/loading/table-skeleton";
import { createClient } from "@/utils/supabase/client";

type PlanType = "1 Month" | "3 Months" | "1 Year";

type Member = {
  id: string;
  first_name: string;
  last_name: string;
};

type Subscription = {
  id: string;
  member_id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  price: number;
  status: string;
  created_at: string;
};

type SubscriptionRow = Subscription & {
  memberName: string;
};

type SubscriptionForm = {
  member_id: string;
  plan_type: PlanType;
  price: string;
  start_date: string;
  end_date: string;
};

const PLAN_OPTIONS: PlanType[] = ["1 Month", "3 Months", "1 Year"];

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

function calculateEndDate(startDate: string, planType: PlanType): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);

  switch (planType) {
    case "1 Month":
      end.setMonth(end.getMonth() + 1);
      break;
    case "3 Months":
      end.setMonth(end.getMonth() + 3);
      break;
    case "1 Year":
      end.setFullYear(end.getFullYear() + 1);
      break;
  }

  return end.toISOString().split("T")[0];
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function isSubscriptionExpired(endDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  return end < today;
}

function SubscriptionStatusBadge({ endDate }: { endDate: string }) {
  const expired = isSubscriptionExpired(endDate);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        expired
          ? "border-red-500/20 bg-red-500/10 text-red-400"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      )}
    >
      {expired ? "Expired" : "Active"}
    </span>
  );
}

function createEmptyForm(): SubscriptionForm {
  const startDate = todayIsoDate();
  return {
    member_id: "",
    plan_type: "1 Month",
    price: "",
    start_date: startDate,
    end_date: calculateEndDate(startDate, "1 Month"),
  };
}

const inputStyles =
  "w-full rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20";

export default function SubscriptionsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SubscriptionForm>(createEmptyForm);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [subscriptionsResult, membersResult] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("members")
        .select("id, first_name, last_name")
        .order("last_name", { ascending: true }),
    ]);

    if (subscriptionsResult.error) {
      setError(subscriptionsResult.error.message);
      setSubscriptions([]);
      setIsLoading(false);
      return;
    }

    if (membersResult.error) {
      setError(membersResult.error.message);
      setSubscriptions([]);
      setIsLoading(false);
      return;
    }

    const memberMap = new Map(
      (membersResult.data as Member[]).map((member) => [
        member.id,
        `${member.first_name} ${member.last_name}`,
      ])
    );

    const rows: SubscriptionRow[] = ((subscriptionsResult.data as Subscription[]) ?? []).map(
      (subscription) => ({
        ...subscription,
        memberName: memberMap.get(subscription.member_id) ?? "Unknown Member",
      })
    );

    setMembers((membersResult.data as Member[]) ?? []);
    setSubscriptions(rows);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(async () => {
      if (isActive) {
        await fetchData();
      }
    });

    return () => {
      isActive = false;
    };
  }, [fetchData]);

  function openModal() {
    setForm(createEmptyForm());
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setForm(createEmptyForm());
  }

  function handlePlanTypeChange(planType: PlanType) {
    setForm((prev) => ({
      ...prev,
      plan_type: planType,
      end_date: calculateEndDate(prev.start_date, planType),
    }));
  }

  function handleStartDateChange(startDate: string) {
    setForm((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: calculateEndDate(startDate, prev.plan_type),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.member_id) {
      setError("Please select a member.");
      return;
    }

    const price = Number.parseFloat(form.price);
    if (Number.isNaN(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("subscriptions").insert({
      member_id: form.member_id,
      plan_type: form.plan_type,
      start_date: form.start_date,
      end_date: form.end_date,
      price,
      status: "active",
    });

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("members")
      .update({ status: "active" })
      .eq("id", form.member_id);

    if (updateError) {
      setError(
        `Subscription created, but member status update failed: ${updateError.message}`
      );
      setIsSubmitting(false);
      await fetchData();
      return;
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
    setForm(createEmptyForm());
    await fetchData();
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-lg">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              Subscriptions
            </h1>
            <p className="text-slate-400">
              Track membership plans, billing periods, and renewal status.
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600"
          >
            <Plus className="size-4" />
            New Subscription
          </button>
        </div>

        {error && !isModalOpen && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-800/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40">
                  <th className="px-5 py-4 font-semibold text-slate-300">
                    Member Name
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-300">
                    Plan Type
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-300">
                    Start Date
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-300">
                    End Date
                  </th>
                  <th className="px-5 py-4 font-semibold text-slate-300">Price</th>
                  <th className="px-5 py-4 font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8">
                      <TableSkeleton columns={6} rows={5} />
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <CalendarDays className="size-8 text-slate-600" />
                        <p className="font-medium text-slate-300">
                          No subscriptions yet.
                        </p>
                        <p className="text-sm">
                          Create a subscription to activate a member plan.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription) => (
                    <tr
                      key={subscription.id}
                      className="border-b border-slate-800/40 transition-colors last:border-b-0 hover:bg-slate-800/20"
                    >
                      <td className="px-5 py-4 font-medium text-slate-100">
                        {subscription.memberName}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {subscription.plan_type}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {formatDate(subscription.start_date)}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {formatDate(subscription.end_date)}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-100">
                        {formatPrice(subscription.price)}
                      </td>
                      <td className="px-5 py-4">
                        <SubscriptionStatusBadge endDate={subscription.end_date} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isLoading && subscriptions.length > 0 && (
          <p className="mt-4 text-sm text-slate-500">
            {subscriptions.length} subscription
            {subscriptions.length === 1 ? "" : "s"} total
          </p>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800/50 bg-slate-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-subscription-title"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2
                  id="new-subscription-title"
                  className="text-xl font-bold text-slate-100"
                >
                  New Subscription
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Assign a plan to an existing member.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="member_id" className="text-sm font-medium text-slate-300">
                  Member
                </label>
                <select
                  id="member_id"
                  required
                  value={form.member_id}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, member_id: event.target.value }))
                  }
                  className={inputStyles}
                >
                  <option value="">Select a member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="plan_type" className="text-sm font-medium text-slate-300">
                  Plan Type
                </label>
                <select
                  id="plan_type"
                  value={form.plan_type}
                  onChange={(event) =>
                    handlePlanTypeChange(event.target.value as PlanType)
                  }
                  className={inputStyles}
                >
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-slate-300">
                  Price
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, price: event.target.value }))
                  }
                  placeholder="0.00"
                  className={inputStyles}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="start_date" className="text-sm font-medium text-slate-300">
                    Start Date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                  required
                  value={form.start_date}
                  onChange={(event) => handleStartDateChange(event.target.value)}
                    className={inputStyles}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="end_date" className="text-sm font-medium text-slate-300">
                    End Date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    required
                  value={form.end_date}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      end_date: event.target.value,
                      }));
                    }}
                    className={inputStyles}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                End date auto-calculates from the plan type. You can override it
                manually if needed.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || members.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Subscription"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

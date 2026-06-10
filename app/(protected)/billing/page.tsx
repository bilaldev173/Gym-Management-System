"use client";

import { CreditCard, Loader2, Plus, Receipt, X } from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PrintableReceipt } from "@/components/billing/printable-receipt";
import {
  buildLatestSubscriptionPlanMap,
  formatAmountDh,
  PLAN_OPTIONS,
  resolvePlanType,
  type PaymentRow,
  type PlanType,
} from "@/lib/billing";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/loading/table-skeleton";
import { createClient } from "@/utils/supabase/client";

type PaymentMethod = "Cash" | "Card";
type PaymentStatus = "paid" | "pending";

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
};

type Payment = {
  id: string;
  member_id: string;
  amount: number;
  plan_type?: string | null;
  payment_method: string | null;
  payment_date: string;
  status: string;
};

type Subscription = {
  member_id: string;
  plan_type: string;
  created_at: string;
};

type PaymentForm = {
  member_id: string;
  plan_type: PlanType;
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
};

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card"];
const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
];

const emptyForm: PaymentForm = {
  member_id: "",
  plan_type: "1 Month",
  amount: "",
  payment_method: "Cash",
  status: "paid",
};

const inputStyles =
  "w-full rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20";

const printButtonStyles =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-700/50";

function formatPaymentDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PaymentStatusBadge({ status }: { status: string }) {
  const isPaid = status.toLowerCase() === "paid";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        isPaid
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-400"
      )}
    >
      {status}
    </span>
  );
}

export default function BillingPage() {
  const supabase = useMemo(() => createClient(), []);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [subscriptionPlanMap, setSubscriptionPlanMap] = useState<
    Map<string, string>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [printReceipt, setPrintReceipt] = useState<PaymentRow | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [paymentsResult, membersResult, subscriptionsResult] =
      await Promise.all([
        supabase
          .from("payments")
          .select("*")
          .order("payment_date", { ascending: false }),
        supabase
          .from("members")
          .select("id, first_name, last_name, phone")
          .order("last_name", { ascending: true }),
        supabase
          .from("subscriptions")
          .select("member_id, plan_type, created_at")
          .order("created_at", { ascending: false }),
      ]);

    if (paymentsResult.error) {
      setError(paymentsResult.error.message);
      setPayments([]);
      setIsLoading(false);
      return;
    }

    if (membersResult.error) {
      setError(membersResult.error.message);
      setPayments([]);
      setIsLoading(false);
      return;
    }

    if (subscriptionsResult.error) {
      setError(subscriptionsResult.error.message);
      setPayments([]);
      setIsLoading(false);
      return;
    }

    const memberRecords = (membersResult.data as Member[]) ?? [];
    const memberNameMap = new Map(
      memberRecords.map((member) => [
        member.id,
        `${member.first_name} ${member.last_name}`,
      ])
    );
    const memberPhoneMap = new Map(
      memberRecords.map((member) => [member.id, member.phone])
    );

    const planMap = buildLatestSubscriptionPlanMap(
      (subscriptionsResult.data as Subscription[]) ?? []
    );
    setSubscriptionPlanMap(planMap);

    const rows: PaymentRow[] = ((paymentsResult.data as Payment[]) ?? []).map(
      (payment) => ({
        id: payment.id,
        member_id: payment.member_id,
        memberName: memberNameMap.get(payment.member_id) ?? "Unknown Member",
        memberPhone: memberPhoneMap.get(payment.member_id) ?? null,
        amount: payment.amount,
        planType: resolvePlanType(
          payment.plan_type,
          payment.member_id,
          planMap
        ),
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        status: payment.status,
      })
    );

    setMembers(memberRecords);
    setPayments(rows);
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

  useEffect(() => {
    if (!printReceipt) return;

    const timer = window.setTimeout(() => window.print(), 50);

    const handleAfterPrint = () => setPrintReceipt(null);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printReceipt]);

  const totalIncomeDh = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  function openModal() {
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setForm(emptyForm);
  }

  function handleMemberChange(memberId: string) {
    const latestPlan = subscriptionPlanMap.get(memberId);
    setForm((prev) => ({
      ...prev,
      member_id: memberId,
      plan_type:
        latestPlan && PLAN_OPTIONS.includes(latestPlan as PlanType)
          ? (latestPlan as PlanType)
          : prev.plan_type,
    }));
  }

  function handlePrintReceipt(payment: PaymentRow) {
    setPrintReceipt(payment);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.member_id) {
      setError("Please select a member.");
      return;
    }

    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("payments").insert({
      member_id: form.member_id,
      amount,
      plan_type: form.plan_type,
      payment_method: form.payment_method,
      status: form.status,
    });

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
    setForm(emptyForm);
    await fetchData();
  }

  return (
    <>
      {printReceipt && <PrintableReceipt payment={printReceipt} />}

      <div className="print:hidden">
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-lg">
          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                Payments Management
              </h1>
              <p className="text-slate-400">
                Track income, payment methods, and transaction status.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600"
            >
              <Plus className="size-4" />
              Record Payment
            </button>
          </div>

          {error && !isModalOpen && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-800/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40">
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Member Name
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Amount
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Plan Type
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Payment Method
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Date
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8">
                        <TableSkeleton columns={7} rows={5} />
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Receipt className="size-8 text-slate-600" />
                          <p className="font-medium text-slate-300">
                            No payments recorded yet.
                          </p>
                          <p className="text-sm">
                            Record your first payment to start tracking income.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-800/40 transition-colors last:border-b-0 hover:bg-slate-800/20"
                      >
                        <td className="px-5 py-4 font-medium text-slate-100">
                          {payment.memberName}
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-400">
                          {formatAmountDh(payment.amount)}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {payment.planType}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          <span className="inline-flex items-center gap-2">
                            <CreditCard className="size-3.5 text-slate-500" />
                            {payment.payment_method ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {formatPaymentDate(payment.payment_date)}
                        </td>
                        <td className="px-5 py-4">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(payment)}
                            className={printButtonStyles}
                          >
                            🧾 Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!isLoading && payments.length > 0 && (
            <div className="mt-4 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {payments.length} transaction{payments.length === 1 ? "" : "s"}{" "}
                total
              </p>
              <p className="font-medium text-slate-300">
                Total income:{" "}
                <span className="text-emerald-400">
                  {formatAmountDh(totalIncomeDh)}
                </span>
              </p>
            </div>
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
              aria-labelledby="record-payment-title"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2
                    id="record-payment-title"
                    className="text-xl font-bold text-slate-100"
                  >
                    Record Payment
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Log a new income transaction for a member.
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
                  <label
                    htmlFor="member_id"
                    className="text-sm font-medium text-slate-300"
                  >
                    Member
                  </label>
                  <select
                    id="member_id"
                    required
                    value={form.member_id}
                    onChange={(event) => handleMemberChange(event.target.value)}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="plan_type"
                      className="text-sm font-medium text-slate-300"
                    >
                      Plan Type
                    </label>
                    <select
                      id="plan_type"
                      value={form.plan_type}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          plan_type: event.target.value as PlanType,
                        }))
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
                    <label
                      htmlFor="amount"
                      className="text-sm font-medium text-slate-300"
                    >
                      Amount (DH)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={form.amount}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className={inputStyles}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="payment_method"
                      className="text-sm font-medium text-slate-300"
                    >
                      Payment Method
                    </label>
                    <select
                      id="payment_method"
                      value={form.payment_method}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          payment_method: event.target.value as PaymentMethod,
                        }))
                      }
                      className={inputStyles}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="status"
                      className="text-sm font-medium text-slate-300"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          status: event.target.value as PaymentStatus,
                        }))
                      }
                      className={inputStyles}
                    >
                      {PAYMENT_STATUSES.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
                      "Save Payment"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

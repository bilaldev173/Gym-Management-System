export type PlanType = "1 Month" | "3 Months" | "1 Year";

export type PaymentRow = {
  id: string;
  member_id: string;
  memberName: string;
  memberPhone: string | null;
  amount: number;
  planType: string;
  payment_method: string | null;
  payment_date: string;
  status: string;
};

export const PLAN_OPTIONS: PlanType[] = ["1 Month", "3 Months", "1 Year"];

export function formatAmountDh(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} DH`;
}

export function formatPlanLabel(planType: string): string {
  if (!planType || planType === "—") return "Membership Plan";
  return `${planType} Membership`;
}

export function shortReceiptId(paymentId: string): string {
  return paymentId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function resolvePlanType(
  storedPlanType: string | null | undefined,
  memberId: string,
  subscriptionPlanMap: Map<string, string>
): string {
  if (storedPlanType) return storedPlanType;
  return subscriptionPlanMap.get(memberId) ?? "—";
}

export function buildLatestSubscriptionPlanMap(
  subscriptions: { member_id: string; plan_type: string; created_at: string }[]
): Map<string, string> {
  const planMap = new Map<string, string>();

  const sorted = [...subscriptions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  for (const subscription of sorted) {
    if (!planMap.has(subscription.member_id)) {
      planMap.set(subscription.member_id, subscription.plan_type);
    }
  }

  return planMap;
}

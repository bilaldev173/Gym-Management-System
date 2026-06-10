import { createClient } from "@/utils/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // Fetch total members count
  const { count: totalMembers } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true });

  // Fetch active subscriptions count
  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .gte("end_date", new Date().toISOString().split("T")[0])
    .eq("status", "active");

  // Fetch today's check-ins count
  const today = new Date().toISOString().split("T")[0];
  const { count: todayCheckIns } = await supabase
    .from("check_ins")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`);

  // Fetch new members this month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { count: newMembersThisMonth } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${currentMonth}-01`)
    .lt("created_at", `${currentMonth}-32`);

  return {
    totalMembers: totalMembers ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    todayCheckIns: todayCheckIns ?? 0,
    newMembersThisMonth: newMembersThisMonth ?? 0,
  };
}

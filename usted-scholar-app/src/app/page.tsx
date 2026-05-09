import { supabase } from "@/lib/supabase";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch recent courses for the dashboard
  const { data: recentCourses } = await supabase
    .from("courses")
    .select("*")
    .order('created_at', { ascending: false })
    .limit(3);

  return <DashboardClient recentCourses={recentCourses || []} />;
}

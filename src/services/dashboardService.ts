import apiClient from "@/lib/apiClient";
import {
  DashboardPeriod,
  DashboardSummary,
} from "@/types/dashboard";

export async function getDashboardSummary(
  period: DashboardPeriod
): Promise<DashboardSummary> {
  const res = await apiClient.get(
    `/dashboard/summary?period=${period}`
  );

  console.log("🔥 RAW DASHBOARD:", res.data);

  // Kalau backend response:
  // { data: {...} }
  if (res.data?.data) {
    return res.data.data;
  }

  // Kalau backend langsung:
  // {...}
  return res.data;
}
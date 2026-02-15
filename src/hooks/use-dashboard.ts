import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { SeverityLevel, IncidentStatus, ResourceStatus } from "@/types/enums";

const REFETCH_INTERVAL = 30_000; // 30 seconds

// ─── Dashboard Stats ─────────────────────────────────────────────
export interface DashboardStats {
  activeIncidents: number;
  totalResources: number;
  availableResources: number;
  activeSOS: number;
  pendingTasks: number;
}

export function useDashboardStats() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const [incidents, totalRes, availableRes, sos, tasks] =
        await Promise.all([
          supabase
            .from("incidents")
            .select("*", { count: "exact", head: true })
            .in("status", ["reported", "verified", "in_progress"]),
          supabase
            .from("resources")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("resources")
            .select("*", { count: "exact", head: true })
            .eq("status", "available"),
          supabase
            .from("sos_broadcasts")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .in("status", ["pending", "in_progress"])
            .eq("assigned_to", userId!),
        ]);

      return {
        activeIncidents: incidents.count ?? 0,
        totalResources: totalRes.count ?? 0,
        availableResources: availableRes.count ?? 0,
        activeSOS: sos.count ?? 0,
        pendingTasks: tasks.count ?? 0,
      };
    },
    enabled: !!userId,
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ─── Incidents for Map & Charts ──────────────────────────────────
export interface MapIncident {
  id: string;
  title: string;
  type: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  created_at: string;
}

export function useActiveIncidents() {
  return useQuery({
    queryKey: ["dashboard", "incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select(
          "id, title, type, severity, status, latitude, longitude, location_name, created_at"
        )
        .in("status", ["reported", "verified", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as MapIncident[];
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ─── Resources for Map ───────────────────────────────────────────
export interface MapResource {
  id: string;
  name: string;
  type: string;
  status: ResourceStatus;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
}

export function useActiveResources() {
  return useQuery({
    queryKey: ["dashboard", "resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id, name, type, status, latitude, longitude, location_name")
        .neq("status", "unavailable")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as MapResource[];
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ─── Severity Breakdown (for donut chart) ────────────────────────
export interface SeverityCount {
  severity: SeverityLevel;
  count: number;
}

export function useIncidentsBySeverity() {
  return useQuery({
    queryKey: ["dashboard", "incidents-by-severity"],
    queryFn: async (): Promise<SeverityCount[]> => {
      const { data, error } = await supabase
        .from("incidents")
        .select("severity")
        .in("status", ["reported", "verified", "in_progress"]);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.severity] = (counts[row.severity] || 0) + 1;
      }

      return (["critical", "high", "medium", "low"] as SeverityLevel[]).map(
        (severity) => ({
          severity,
          count: counts[severity] || 0,
        })
      );
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ─── Resource Status Breakdown (for bar chart) ───────────────────
export interface ResourceStatusCount {
  status: ResourceStatus;
  count: number;
}

export function useResourcesByStatus() {
  return useQuery({
    queryKey: ["dashboard", "resources-by-status"],
    queryFn: async (): Promise<ResourceStatusCount[]> => {
      const { data, error } = await supabase
        .from("resources")
        .select("status");

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.status] = (counts[row.status] || 0) + 1;
      }

      return (
        [
          "available",
          "assigned",
          "reserved",
          "unavailable",
          "maintenance",
        ] as ResourceStatus[]
      ).map((status) => ({
        status,
        count: counts[status] || 0,
      }));
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ─── Recent Activity (recent incidents + updates) ────────────────
export interface ActivityItem {
  id: string;
  type: "incident_created" | "incident_updated" | "resource_created" | "alert_created";
  title: string;
  description: string;
  severity?: SeverityLevel;
  created_at: string;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async (): Promise<ActivityItem[]> => {
      // Fetch recent incidents with creator profiles
      const { data: incidents } = await supabase
        .from("incidents")
        .select("id, title, severity, status, created_at, profiles!incidents_created_by_fkey(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(10);

      const items: ActivityItem[] = (incidents ?? []).map((inc) => {
        const profile = inc.profiles as unknown as { first_name: string; last_name: string } | null;
        const name = profile
          ? `${profile.first_name} ${profile.last_name}`
          : "Unknown";
        return {
          id: inc.id,
          type: "incident_created" as const,
          title: inc.title,
          description: `${name} reported: ${inc.title}`,
          severity: inc.severity as SeverityLevel,
          created_at: inc.created_at,
        };
      });

      return items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ─── Aggregate Query Hooks ──────────────────────────────────────

export interface IncidentSummary {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
}

export interface ResourceSummary {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    assigned: number;
}

export interface TaskSummary {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
}

export interface DonationSummary {
    totalMonetary: number;
    totalItems: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
}

export interface ReportData {
    incidents: IncidentSummary;
    resources: ResourceSummary;
    tasks: TaskSummary;
    donations: DonationSummary;
    generatedAt: string;
}

function countBy<T>(items: T[], key: keyof T): Record<string, number> {
    const map: Record<string, number> = {};
    for (const item of items) {
        const v = String(item[key] ?? "unknown");
        map[v] = (map[v] || 0) + 1;
    }
    return map;
}

export function useReportData(dateRange?: { from: string; to: string }) {
    return useQuery({
        queryKey: ["report-data", dateRange?.from, dateRange?.to],
        queryFn: async (): Promise<ReportData> => {
            // Incidents
            let incQ = supabase.from("incidents").select("id, status, severity, type, created_at");
            if (dateRange?.from) incQ = incQ.gte("created_at", dateRange.from);
            if (dateRange?.to) incQ = incQ.lte("created_at", dateRange.to);
            const { data: incidents = [] } = await incQ;

            // Resources
            const { data: resources = [] } = await supabase
                .from("resources")
                .select("id, status, type");

            // Tasks
            let taskQ = supabase.from("tasks").select("id, status, priority, due_date, completed_at, created_at");
            if (dateRange?.from) taskQ = taskQ.gte("created_at", dateRange.from);
            if (dateRange?.to) taskQ = taskQ.lte("created_at", dateRange.to);
            const { data: tasks = [] } = await taskQ;

            const now = new Date().toISOString();
            const overdue = (tasks ?? []).filter(
                (t) => t.due_date && t.due_date < now && !["completed", "cancelled"].includes(t.status)
            ).length;

            // Donations
            let donQ = supabase.from("donations").select("id, type, status, amount, quantity, created_at");
            if (dateRange?.from) donQ = donQ.gte("created_at", dateRange.from);
            if (dateRange?.to) donQ = donQ.lte("created_at", dateRange.to);
            const { data: donations = [] } = await donQ;

            const totalMonetary = (donations ?? [])
                .filter((d) => d.type === "monetary")
                .reduce((s, d) => s + (Number(d.amount) || 0), 0);
            const totalItems = (donations ?? [])
                .filter((d) => d.type !== "monetary")
                .reduce((s, d) => s + (d.quantity || 0), 0);

            return {
                incidents: {
                    total: (incidents ?? []).length,
                    byStatus: countBy(incidents ?? [], "status"),
                    bySeverity: countBy(incidents ?? [], "severity"),
                    byType: countBy(incidents ?? [], "type"),
                },
                resources: {
                    total: (resources ?? []).length,
                    byStatus: countBy(resources ?? [], "status"),
                    byType: countBy(resources ?? [], "type"),
                    assigned: (resources ?? []).filter((r) => r.status === "assigned").length,
                },
                tasks: {
                    total: (tasks ?? []).length,
                    byStatus: countBy(tasks ?? [], "status"),
                    byPriority: countBy(tasks ?? [], "priority"),
                    overdue,
                },
                donations: {
                    totalMonetary,
                    totalItems,
                    byStatus: countBy(donations ?? [], "status"),
                    byType: countBy(donations ?? [], "type"),
                },
                generatedAt: new Date().toISOString(),
            };
        },
    });
}

// ─── Recent Incidents for detail report ─────────────────────────

export function useRecentIncidents(limit = 50, dateRange?: { from: string; to: string }) {
    return useQuery({
        queryKey: ["report-incidents", limit, dateRange?.from, dateRange?.to],
        queryFn: async () => {
            let q = supabase
                .from("incidents")
                .select("id, title, type, severity, status, location_name, created_at, profiles!incidents_created_by_fkey(first_name, last_name)")
                .order("created_at", { ascending: false })
                .limit(limit);
            if (dateRange?.from) q = q.gte("created_at", dateRange.from);
            if (dateRange?.to) q = q.lte("created_at", dateRange.to);
            const { data, error } = await q;
            if (error) throw error;
            return data ?? [];
        },
    });
}

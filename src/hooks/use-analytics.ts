import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ─── Analytics Hooks ────────────────────────────────────────────

export interface TimeSeriesPoint {
    date: string;
    count: number;
}

export interface AnalyticsData {
    incidentsByDay: TimeSeriesPoint[];
    incidentsByType: { name: string; value: number }[];
    severityDistribution: { name: string; value: number }[];
    resourceUtilization: { name: string; available: number; assigned: number }[];
    taskVelocity: { name: string; created: number; completed: number }[];
    donationFlow: { name: string; value: number }[];
    topMetrics: {
        totalIncidents: number;
        activeIncidents: number;
        totalResources: number;
        assignedResources: number;
        totalTasks: number;
        completedTasks: number;
        overdueTasks: number;
        totalDonations: number;
    };
}

function formatLabel(s: string): string {
    return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getLast30Days(): string[] {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

export function useAnalytics() {
    return useQuery({
        queryKey: ["analytics"],
        queryFn: async (): Promise<AnalyticsData> => {
            // Parallel fetch
            const [incRes, resRes, taskRes, donRes] = await Promise.all([
                supabase.from("incidents").select("id, type, severity, status, created_at"),
                supabase.from("resources").select("id, type, status"),
                supabase.from("tasks").select("id, status, priority, due_date, completed_at, created_at"),
                supabase.from("donations").select("id, type, status, amount, quantity, created_at"),
            ]);

            const incidents = incRes.data ?? [];
            const resources = resRes.data ?? [];
            const tasks = taskRes.data ?? [];
            const donations = donRes.data ?? [];
            const now = new Date().toISOString();

            // Incidents by day (last 30 days)
            const days = getLast30Days();
            const incByDay: Record<string, number> = {};
            for (const d of days) incByDay[d] = 0;
            for (const inc of incidents) {
                const day = inc.created_at.slice(0, 10);
                if (incByDay[day] !== undefined) incByDay[day]++;
            }
            const incidentsByDay = days.map((d) => ({ date: d, count: incByDay[d] || 0 }));

            // Incidents by type
            const typeMap: Record<string, number> = {};
            for (const inc of incidents) typeMap[inc.type] = (typeMap[inc.type] || 0) + 1;
            const incidentsByType = Object.entries(typeMap).map(([name, value]) => ({ name: formatLabel(name), value }));

            // Severity distribution
            const sevMap: Record<string, number> = {};
            for (const inc of incidents) sevMap[inc.severity] = (sevMap[inc.severity] || 0) + 1;
            const severityDistribution = Object.entries(sevMap).map(([name, value]) => ({ name: formatLabel(name), value }));

            // Resource utilization by type
            const resTypeMap: Record<string, { available: number; assigned: number }> = {};
            for (const r of resources) {
                const t = formatLabel(r.type);
                if (!resTypeMap[t]) resTypeMap[t] = { available: 0, assigned: 0 };
                if (r.status === "assigned") resTypeMap[t].assigned++;
                else resTypeMap[t].available++;
            }
            const resourceUtilization = Object.entries(resTypeMap).map(([name, v]) => ({ name, ...v }));

            // Task velocity: by week (last 4 weeks)
            const taskVelocity: { name: string; created: number; completed: number }[] = [];
            for (let w = 3; w >= 0; w--) {
                const start = new Date();
                start.setDate(start.getDate() - (w + 1) * 7);
                const end = new Date();
                end.setDate(end.getDate() - w * 7);
                const label = `Week ${4 - w}`;
                const created = tasks.filter((t) => {
                    const d = new Date(t.created_at);
                    return d >= start && d < end;
                }).length;
                const completed = tasks.filter((t) => {
                    if (!t.completed_at) return false;
                    const d = new Date(t.completed_at);
                    return d >= start && d < end;
                }).length;
                taskVelocity.push({ name: label, created, completed });
            }

            // Donation flow by type
            const donTypeMap: Record<string, number> = {};
            for (const d of donations) donTypeMap[d.type] = (donTypeMap[d.type] || 0) + 1;
            const donationFlow = Object.entries(donTypeMap).map(([name, value]) => ({ name: formatLabel(name), value }));

            // Top metrics
            const activeIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status)).length;
            const assignedResources = resources.filter((r) => r.status === "assigned").length;
            const completedTasks = tasks.filter((t) => t.status === "completed").length;
            const overdueTasks = tasks.filter(
                (t) => t.due_date && t.due_date < now && !["completed", "cancelled"].includes(t.status)
            ).length;
            const totalDonations = donations
                .filter((d) => d.type === "monetary")
                .reduce((s, d) => s + (Number(d.amount) || 0), 0);

            return {
                incidentsByDay,
                incidentsByType,
                severityDistribution,
                resourceUtilization,
                taskVelocity,
                donationFlow,
                topMetrics: {
                    totalIncidents: incidents.length,
                    activeIncidents,
                    totalResources: resources.length,
                    assignedResources,
                    totalTasks: tasks.length,
                    completedTasks,
                    overdueTasks,
                    totalDonations,
                },
            };
        },
        staleTime: 60_000,
    });
}

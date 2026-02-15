import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AuditLogEntry } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────

export interface AuditLogFilters {
    search?: string;
    action?: string;
    entityType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface AuditLogWithProfile extends AuditLogEntry {
    profiles?: {
        first_name: string;
        last_name: string;
        email: string;
    } | null;
}

// ─── Fetch Audit Log ────────────────────────────────────────────

export function useAuditLog(filters: AuditLogFilters = {}, page = 0, pageSize = 25) {
    return useQuery({
        queryKey: ["audit-log", filters, page, pageSize],
        queryFn: async (): Promise<{ data: AuditLogWithProfile[]; count: number }> => {
            let query = supabase
                .from("audit_log")
                .select(
                    "*, profiles!audit_log_user_id_fkey(first_name, last_name, email)",
                    { count: "exact" }
                )
                .order("created_at", { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (filters.search) {
                query = query.or(
                    `action.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%`
                );
            }
            if (filters.action) {
                query = query.eq("action", filters.action);
            }
            if (filters.entityType) {
                query = query.eq("entity_type", filters.entityType);
            }
            if (filters.userId) {
                query = query.eq("user_id", filters.userId);
            }
            if (filters.dateFrom) {
                query = query.gte("created_at", filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
            }

            const { data, error, count } = await query;
            if (error) throw error;
            return {
                data: (data ?? []) as AuditLogWithProfile[],
                count: count ?? 0,
            };
        },
    });
}

// ─── Fetch distinct actions (for filter dropdown) ───────────────

export function useAuditActions() {
    return useQuery({
        queryKey: ["audit-log-actions"],
        queryFn: async (): Promise<string[]> => {
            const { data, error } = await supabase
                .from("audit_log")
                .select("action")
                .order("action");

            if (error) throw error;
            const unique = [...new Set((data ?? []).map((r) => r.action))];
            return unique;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// ─── Fetch distinct entity types (for filter dropdown) ──────────

export function useAuditEntityTypes() {
    return useQuery({
        queryKey: ["audit-log-entity-types"],
        queryFn: async (): Promise<string[]> => {
            const { data, error } = await supabase
                .from("audit_log")
                .select("entity_type")
                .not("entity_type", "is", null)
                .order("entity_type");

            if (error) throw error;
            const unique = [...new Set((data ?? []).map((r) => r.entity_type as string))];
            return unique;
        },
        staleTime: 5 * 60 * 1000,
    });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { EvacuationRoute } from "@/types/database";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────

export interface EvacRouteFilters {
    search?: string;
    incidentId?: string;
    activeOnly?: boolean;
}

export interface EvacRouteFormData {
    name: string;
    description?: string;
    waypoints: Array<{ lat: number; lng: number }>;
    distance_km?: number;
    estimated_time_minutes?: number;
    capacity?: number;
    incident_id?: string;
    is_active?: boolean;
}

// ─── List Evacuation Routes ─────────────────────────────────────

export function useEvacuationRoutes(filters: EvacRouteFilters = {}) {
    return useQuery({
        queryKey: ["evacuation-routes", filters],
        queryFn: async () => {
            let q = supabase
                .from("evacuation_routes")
                .select("*, profiles!evacuation_routes_created_by_fkey(first_name, last_name)")
                .order("created_at", { ascending: false });

            if (filters.incidentId) q = q.eq("incident_id", filters.incidentId);
            if (filters.activeOnly) q = q.eq("is_active", true);
            if (filters.search) q = q.ilike("name", `%${filters.search}%`);

            const { data, error } = await q;
            if (error) throw error;
            return (data ?? []) as (EvacuationRoute & { profiles: { first_name: string; last_name: string } | null })[];
        },
    });
}

// ─── Create ─────────────────────────────────────────────────────

export function useCreateEvacRoute() {
    const session = useAuthStore((s) => s.session);
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (form: EvacRouteFormData) => {
            const { data, error } = await supabase
                .from("evacuation_routes")
                .insert({
                    name: form.name,
                    description: form.description || null,
                    waypoints: form.waypoints,
                    distance_km: form.distance_km ?? null,
                    estimated_time_minutes: form.estimated_time_minutes ?? null,
                    capacity: form.capacity ?? null,
                    incident_id: form.incident_id || null,
                    is_active: form.is_active ?? true,
                    created_by: session!.user.id,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["evacuation-routes"] });
            toast.success("Evacuation route created");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

// ─── Update ─────────────────────────────────────────────────────

export function useUpdateEvacRoute() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...form }: EvacRouteFormData & { id: string }) => {
            const { data, error } = await supabase
                .from("evacuation_routes")
                .update({
                    name: form.name,
                    description: form.description || null,
                    waypoints: form.waypoints,
                    distance_km: form.distance_km ?? null,
                    estimated_time_minutes: form.estimated_time_minutes ?? null,
                    capacity: form.capacity ?? null,
                    incident_id: form.incident_id || null,
                    is_active: form.is_active ?? true,
                })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["evacuation-routes"] });
            toast.success("Evacuation route updated");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

// ─── Delete ─────────────────────────────────────────────────────

export function useDeleteEvacRoute() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("evacuation_routes").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["evacuation-routes"] });
            toast.success("Evacuation route deleted");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

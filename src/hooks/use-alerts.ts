import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { AlertType, SeverityLevel } from "@/types/enums";

// ─── Types ───────────────────────────────────────────────────────

export interface AlertRow {
  id: string;
  title: string;
  type: AlertType;
  severity: SeverityLevel;
  message: string;
  affected_area: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_km: number | null;
  incident_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: { first_name: string; last_name: string } | null;
}

export interface AlertFilters {
  search?: string;
  type?: AlertType | "";
  severity?: SeverityLevel | "";
  active?: "all" | "active" | "inactive";
}

export interface CreateAlertInput {
  title: string;
  type: AlertType;
  severity: SeverityLevel;
  message: string;
  affected_area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number | null;
  incident_id?: string | null;
  expires_at?: string | null;
}

export interface UpdateAlertInput extends Partial<CreateAlertInput> {
  is_active?: boolean;
}

// ─── List Alerts ─────────────────────────────────────────────────

export function useAlerts(filters: AlertFilters = {}) {
  return useQuery({
    queryKey: ["alerts", filters],
    queryFn: async (): Promise<AlertRow[]> => {
      let query = supabase
        .from("alerts")
        .select("*, profiles!alerts_created_by_fkey(first_name, last_name)")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,message.ilike.%${filters.search}%,affected_area.ilike.%${filters.search}%`
        );
      }
      if (filters.type) query = query.eq("type", filters.type);
      if (filters.severity) query = query.eq("severity", filters.severity);
      if (filters.active === "active") query = query.eq("is_active", true);
      else if (filters.active === "inactive") query = query.eq("is_active", false);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AlertRow[];
    },
  });
}

// ─── Create Alert ────────────────────────────────────────────────

export function useCreateAlert() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: CreateAlertInput) => {
      const { data, error } = await supabase
        .from("alerts")
        .insert({ ...input, created_by: userId! })
        .select()
        .single();
      if (error) throw error;
      return data as AlertRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

// ─── Update Alert ────────────────────────────────────────────────

export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAlertInput & { id: string }) => {
      const { data, error } = await supabase
        .from("alerts")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AlertRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

// ─── Delete Alert ────────────────────────────────────────────────

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

// ─── Toggle Active ───────────────────────────────────────────────

export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

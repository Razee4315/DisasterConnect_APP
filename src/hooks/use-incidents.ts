import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Incident } from "@/types/database";
import type {
  IncidentType,
  SeverityLevel,
  IncidentStatus,
} from "@/types/enums";

// ─── Types ───────────────────────────────────────────────────────

export interface IncidentFilters {
  search?: string;
  type?: IncidentType | "";
  severity?: SeverityLevel | "";
  status?: IncidentStatus | "";
}

export interface IncidentWithProfile extends Incident {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  coordinator?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface CreateIncidentInput {
  title: string;
  type: IncidentType;
  severity: SeverityLevel;
  description?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  affected_radius_km?: number | null;
  estimated_affected_people?: number | null;
}

export interface UpdateIncidentInput extends Partial<CreateIncidentInput> {
  status?: IncidentStatus;
  assigned_coordinator?: string | null;
  resolution_notes?: string;
}

// ─── Fetch Incidents List ────────────────────────────────────────

export function useIncidents(filters: IncidentFilters = {}) {
  return useQuery({
    queryKey: ["incidents", filters],
    queryFn: async (): Promise<IncidentWithProfile[]> => {
      let query = supabase
        .from("incidents")
        .select(
          "*, profiles!incidents_created_by_fkey(first_name, last_name)"
        )
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`
        );
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.severity) {
        query = query.eq("severity", filters.severity);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as IncidentWithProfile[];
    },
  });
}

// ─── Fetch Single Incident ───────────────────────────────────────

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: ["incidents", id],
    queryFn: async (): Promise<IncidentWithProfile> => {
      const { data, error } = await supabase
        .from("incidents")
        .select(
          "*, profiles!incidents_created_by_fkey(first_name, last_name)"
        )
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as IncidentWithProfile;
    },
    enabled: !!id,
  });
}

// ─── Create Incident ────────────────────────────────────────────

export function useCreateIncident() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: CreateIncidentInput) => {
      const { data, error } = await supabase
        .from("incidents")
        .insert({
          ...input,
          created_by: userId!,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Incident;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Update Incident ────────────────────────────────────────────

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateIncidentInput & { id: string }) => {
      const updateData: Record<string, unknown> = { ...input };

      // Auto-set closed_at when closing
      if (input.status === "closed" || input.status === "resolved") {
        updateData.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("incidents")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Incident;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incidents", data.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Delete Incident ────────────────────────────────────────────

export function useDeleteIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incidents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Incident Timeline / Updates ─────────────────────────────────

export interface IncidentUpdateWithProfile {
  id: string;
  incident_id: string;
  user_id: string;
  message: string;
  update_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

export function useIncidentUpdates(incidentId: string | undefined) {
  return useQuery({
    queryKey: ["incident-updates", incidentId],
    queryFn: async (): Promise<IncidentUpdateWithProfile[]> => {
      const { data, error } = await supabase
        .from("incident_updates")
        .select("*, profiles!incident_updates_user_id_fkey(first_name, last_name)")
        .eq("incident_id", incidentId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as IncidentUpdateWithProfile[];
    },
    enabled: !!incidentId,
  });
}

export function useAddIncidentUpdate() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      incidentId,
      message,
      updateType = "note",
    }: {
      incidentId: string;
      message: string;
      updateType?: string;
    }) => {
      const { data, error } = await supabase
        .from("incident_updates")
        .insert({
          incident_id: incidentId,
          user_id: userId!,
          message,
          update_type: updateType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incident-updates", variables.incidentId],
      });
    },
  });
}

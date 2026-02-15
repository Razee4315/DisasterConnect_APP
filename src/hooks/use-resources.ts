import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Resource, ResourceAssignment } from "@/types/database";
import type { ResourceType, ResourceStatus } from "@/types/enums";

// ─── Types ───────────────────────────────────────────────────────

export interface ResourceFilters {
  search?: string;
  type?: ResourceType | "";
  status?: ResourceStatus | "";
  maintenance?: string; // "operational" | "under_maintenance" | ""
}

export interface ResourceWithProfile extends Resource {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  incidents?: {
    id: string;
    title: string;
  } | null;
}

export interface CreateResourceInput {
  name: string;
  type: ResourceType;
  status?: ResourceStatus;
  capacity?: number | null;
  description?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contact_info?: string | null;
}

export interface UpdateResourceInput extends Partial<CreateResourceInput> {
  maintenance_status?: string | null;
  maintenance_notes?: string | null;
  maintenance_start?: string | null;
  maintenance_end?: string | null;
  current_incident_id?: string | null;
}

// ─── Fetch Resources List ────────────────────────────────────────

export function useResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: ["resources", filters],
    queryFn: async (): Promise<ResourceWithProfile[]> => {
      let query = supabase
        .from("resources")
        .select(
          "*, profiles!resources_created_by_fkey(first_name, last_name), incidents!resources_current_incident_id_fkey(id, title)"
        )
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`
        );
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.maintenance === "operational") {
        query = query.eq("maintenance_status", "operational");
      } else if (filters.maintenance === "under_maintenance") {
        query = query.eq("maintenance_status", "under_maintenance");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ResourceWithProfile[];
    },
  });
}

// ─── Fetch Single Resource ───────────────────────────────────────

export function useResource(id: string | undefined) {
  return useQuery({
    queryKey: ["resources", id],
    queryFn: async (): Promise<ResourceWithProfile> => {
      const { data, error } = await supabase
        .from("resources")
        .select(
          "*, profiles!resources_created_by_fkey(first_name, last_name), incidents!resources_current_incident_id_fkey(id, title)"
        )
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as ResourceWithProfile;
    },
    enabled: !!id,
  });
}

// ─── Create Resource ────────────────────────────────────────────

export function useCreateResource() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: CreateResourceInput) => {
      const { data, error } = await supabase
        .from("resources")
        .insert({
          ...input,
          created_by: userId!,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Resource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Update Resource ────────────────────────────────────────────

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateResourceInput & { id: string }) => {
      const { data, error } = await supabase
        .from("resources")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Resource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["resources", data.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Delete Resource ────────────────────────────────────────────

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Resource Assignment History ─────────────────────────────────

export interface AssignmentWithDetails extends ResourceAssignment {
  incidents?: {
    id: string;
    title: string;
  } | null;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

export function useResourceAssignments(resourceId: string | undefined) {
  return useQuery({
    queryKey: ["resource-assignments", resourceId],
    queryFn: async (): Promise<AssignmentWithDetails[]> => {
      const { data, error } = await supabase
        .from("resource_assignments")
        .select(
          "*, incidents!resource_assignments_incident_id_fkey(id, title), profiles!resource_assignments_assigned_by_fkey(first_name, last_name)"
        )
        .eq("resource_id", resourceId!)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AssignmentWithDetails[];
    },
    enabled: !!resourceId,
  });
}

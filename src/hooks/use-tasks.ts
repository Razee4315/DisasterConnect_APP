import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Task, Profile } from "@/types/database";
import type { TaskPriority, TaskStatus } from "@/types/enums";

// ─── Types ───────────────────────────────────────────────────────

export interface TaskFilters {
    search?: string;
    priority?: TaskPriority | "";
    status?: TaskStatus | "";
    assignedTo?: string | "";
    incidentId?: string | "";
}

export interface TaskWithProfiles extends Task {
    assignee?: { first_name: string; last_name: string } | null;
    assigner?: { first_name: string; last_name: string } | null;
    incident?: { title: string } | null;
}

export interface CreateTaskInput {
    title: string;
    description?: string | null;
    priority: TaskPriority;
    incident_id?: string | null;
    assigned_to?: string | null;
    due_date?: string | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
    status?: TaskStatus;
}

// ─── Fetch Tasks List ────────────────────────────────────────────

export function useTasks(filters: TaskFilters = {}) {
    return useQuery({
        queryKey: ["tasks", filters],
        queryFn: async (): Promise<TaskWithProfiles[]> => {
            let query = supabase
                .from("tasks")
                .select(
                    "*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name), assigner:profiles!tasks_assigned_by_fkey(first_name, last_name), incident:incidents!tasks_incident_id_fkey(title)"
                )
                .order("created_at", { ascending: false });

            if (filters.search) {
                query = query.or(
                    `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
                );
            }
            if (filters.priority) {
                query = query.eq("priority", filters.priority);
            }
            if (filters.status) {
                query = query.eq("status", filters.status);
            }
            if (filters.assignedTo) {
                query = query.eq("assigned_to", filters.assignedTo);
            }
            if (filters.incidentId) {
                query = query.eq("incident_id", filters.incidentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data ?? []) as TaskWithProfiles[];
        },
    });
}

// ─── Fetch Single Task ───────────────────────────────────────────

export function useTask(id: string | undefined) {
    return useQuery({
        queryKey: ["tasks", id],
        queryFn: async (): Promise<TaskWithProfiles> => {
            const { data, error } = await supabase
                .from("tasks")
                .select(
                    "*, assignee:profiles!tasks_assigned_to_fkey(first_name, last_name), assigner:profiles!tasks_assigned_by_fkey(first_name, last_name), incident:incidents!tasks_incident_id_fkey(title)"
                )
                .eq("id", id!)
                .single();

            if (error) throw error;
            return data as TaskWithProfiles;
        },
        enabled: !!id,
    });
}

// ─── Create Task ─────────────────────────────────────────────────

export function useCreateTask() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);

    return useMutation({
        mutationFn: async (input: CreateTaskInput) => {
            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    ...input,
                    assigned_by: userId!,
                    status: "pending" as TaskStatus,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Task;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

// ─── Update Task ─────────────────────────────────────────────────

export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            ...input
        }: UpdateTaskInput & { id: string }) => {
            const updateData: Record<string, unknown> = { ...input };

            if (input.status === "completed") {
                updateData.completed_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from("tasks")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Task;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["tasks", data.id] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

// ─── Delete Task ─────────────────────────────────────────────────

export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("tasks").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

// ─── Profiles for Assignee Picker ────────────────────────────────

export function useProfiles() {
    return useQuery({
        queryKey: ["profiles"],
        queryFn: async (): Promise<Profile[]> => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("first_name", { ascending: true });

            if (error) throw error;
            return (data ?? []) as Profile[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { SOSBroadcast } from "@/types/database";
import type { SeverityLevel } from "@/types/enums";

// ─── List Active SOS Broadcasts ──────────────────────────────────

export function useActiveSOS() {
    return useQuery({
        queryKey: ["sos", "active"],
        queryFn: async (): Promise<SOSBroadcast[]> => {
            const { data, error } = await supabase
                .from("sos_broadcasts")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as SOSBroadcast[];
        },
        refetchInterval: 15000,
    });
}

// ─── Create SOS Broadcast ────────────────────────────────────────

export interface CreateSOSInput {
    message: string;
    severity: SeverityLevel;
    latitude?: number | null;
    longitude?: number | null;
    location_name?: string | null;
}

export function useCreateSOS() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);
    const profile = useAuthStore((s) => s.profile);

    return useMutation({
        mutationFn: async (input: CreateSOSInput) => {
            // 1. Create the SOS broadcast
            const { data: sos, error: sosError } = await supabase
                .from("sos_broadcasts")
                .insert({
                    sender_id: userId!,
                    message: input.message,
                    severity: input.severity,
                    latitude: input.latitude ?? null,
                    longitude: input.longitude ?? null,
                    location_name: input.location_name ?? null,
                })
                .select()
                .single();

            if (sosError) throw sosError;

            // 2. Auto-create a critical incident from the SOS
            const { data: incident, error: incidentError } = await supabase
                .from("incidents")
                .insert({
                    title: `🚨 SOS: ${input.message.slice(0, 60)}`,
                    type: "other",
                    severity: input.severity,
                    description: `Emergency SOS broadcast from ${profile?.first_name ?? "Unknown"} ${profile?.last_name ?? "User"}.\n\n${input.message}`,
                    location_name: input.location_name ?? null,
                    latitude: input.latitude ?? null,
                    longitude: input.longitude ?? null,
                    created_by: userId!,
                    status: "active",
                })
                .select()
                .single();

            if (incidentError) throw incidentError;

            // 3. Link the SOS to the incident
            await supabase
                .from("sos_broadcasts")
                .update({ incident_id: incident.id })
                .eq("id", sos.id);

            return { sos, incident };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sos"] });
            queryClient.invalidateQueries({ queryKey: ["incidents"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

// ─── Resolve SOS Broadcast ───────────────────────────────────────

export function useResolveSOS() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("sos_broadcasts")
                .update({
                    is_active: false,
                    resolved_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sos"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

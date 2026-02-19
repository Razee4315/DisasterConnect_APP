import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Team, TeamMember } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────

export interface TeamWithMembers extends Team {
    member_count?: number;
    members?: TeamMemberWithProfile[];
}

export interface TeamMemberWithProfile extends TeamMember {
    profile?: { first_name: string; last_name: string; role: string } | null;
}

export interface CreateTeamInput {
    name: string;
    description?: string | null;
    incident_id?: string | null;
}

// ─── Fetch Teams ─────────────────────────────────────────────────

export function useTeams() {
    return useQuery({
        queryKey: ["teams"],
        queryFn: async (): Promise<TeamWithMembers[]> => {
            const { data, error } = await supabase
                .from("teams")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as TeamWithMembers[];
        },
    });
}

// ─── Fetch Single Team ───────────────────────────────────────────

export function useTeam(id: string | undefined) {
    return useQuery({
        queryKey: ["teams", id],
        queryFn: async (): Promise<TeamWithMembers> => {
            const { data: team, error: tErr } = await supabase
                .from("teams")
                .select("*")
                .eq("id", id!)
                .single();

            if (tErr) throw tErr;

            // Fetch members with profiles
            const { data: members, error: mErr } = await supabase
                .from("team_members")
                .select("*, profile:profiles!team_members_user_id_fkey(first_name, last_name, role)")
                .eq("team_id", id!);

            if (mErr) throw mErr;

            return {
                ...team,
                members: (members ?? []) as TeamMemberWithProfile[],
                member_count: members?.length ?? 0,
            } as TeamWithMembers;
        },
        enabled: !!id,
    });
}

// ─── Create Team ─────────────────────────────────────────────────

export function useCreateTeam() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);

    return useMutation({
        mutationFn: async (input: CreateTeamInput) => {
            const { data: team, error: tErr } = await supabase
                .from("teams")
                .insert({
                    name: input.name,
                    description: input.description ?? null,
                    current_incident_id: input.incident_id ?? null,
                    lead_id: userId!,
                })
                .select()
                .single();

            if (tErr) throw tErr;

            // Add creator as lead
            const { error: mErr } = await supabase
                .from("team_members")
                .insert({
                    team_id: team.id,
                    user_id: userId!,
                    role: "lead",
                });

            if (mErr) throw mErr;

            return team as Team;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
}

// ─── Add Team Member ─────────────────────────────────────────────

export function useAddTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            teamId,
            userId,
            role = "member",
        }: {
            teamId: string;
            userId: string;
            role?: string;
        }) => {
            const { data, error } = await supabase
                .from("team_members")
                .insert({
                    team_id: teamId,
                    user_id: userId,
                    role,
                })
                .select()
                .single();

            if (error) throw error;
            return data as TeamMember;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ["teams", vars.teamId] });
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
}

// ─── Update Team Member Role ─────────────────────────────────────

export function useUpdateTeamMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            teamId,
            userId,
            role,
        }: {
            teamId: string;
            userId: string;
            role: string;
        }) => {
            const { error } = await supabase
                .from("team_members")
                .update({ role })
                .eq("team_id", teamId)
                .eq("user_id", userId);

            if (error) throw error;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ["teams", vars.teamId] });
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
}

// ─── Remove Team Member ──────────────────────────────────────────

export function useRemoveTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            teamId,
            userId,
        }: {
            teamId: string;
            userId: string;
        }) => {
            const { error } = await supabase
                .from("team_members")
                .delete()
                .eq("team_id", teamId)
                .eq("user_id", userId);

            if (error) throw error;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ["teams", vars.teamId] });
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
}

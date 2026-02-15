import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Channel, Message } from "@/types/database";
import type { ChannelType } from "@/types/enums";

// ─── Types ───────────────────────────────────────────────────────

export interface ChannelWithMeta extends Channel {
    last_message?: { content: string; created_at: string } | null;
    unread_count?: number;
    member_count?: number;
}

export interface MessageWithSender extends Message {
    sender?: { first_name: string; last_name: string } | null;
}

export interface CreateChannelInput {
    name: string;
    type: ChannelType;
    incident_id?: string | null;
    team_id?: string | null;
    member_ids?: string[];
}

// ─── Fetch User's Channels ───────────────────────────────────────

export function useChannels() {
    const userId = useAuthStore((s) => s.user?.id);

    return useQuery({
        queryKey: ["channels", userId],
        queryFn: async (): Promise<ChannelWithMeta[]> => {
            // Get channels user is member of
            const { data: memberships, error: memError } = await supabase
                .from("channel_members")
                .select("channel_id")
                .eq("user_id", userId!);

            if (memError) throw memError;
            if (!memberships?.length) return [];

            const channelIds = memberships.map((m) => m.channel_id);

            const { data: channels, error: chError } = await supabase
                .from("channels")
                .select("*")
                .in("id", channelIds)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (chError) throw chError;
            return (channels ?? []) as ChannelWithMeta[];
        },
        enabled: !!userId,
    });
}

// ─── Fetch Messages for a Channel ────────────────────────────────

export function useMessages(channelId: string | undefined) {
    return useQuery({
        queryKey: ["messages", channelId],
        queryFn: async (): Promise<MessageWithSender[]> => {
            const { data, error } = await supabase
                .from("messages")
                .select(
                    "*, sender:profiles!messages_sender_id_fkey(first_name, last_name)"
                )
                .eq("channel_id", channelId!)
                .order("created_at", { ascending: true })
                .limit(200);

            if (error) throw error;
            return (data ?? []) as MessageWithSender[];
        },
        enabled: !!channelId,
    });
}

// ─── Send Message ────────────────────────────────────────────────

export function useSendMessage() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);

    return useMutation({
        mutationFn: async ({
            channelId,
            content,
        }: {
            channelId: string;
            content: string;
        }) => {
            const { data, error } = await supabase
                .from("messages")
                .insert({
                    channel_id: channelId,
                    sender_id: userId!,
                    content,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Message;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({
                queryKey: ["messages", vars.channelId],
            });
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
    });
}

// ─── Create Channel ──────────────────────────────────────────────

export function useCreateChannel() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);

    return useMutation({
        mutationFn: async (input: CreateChannelInput) => {
            // 1. Create channel
            const { data: channel, error: chError } = await supabase
                .from("channels")
                .insert({
                    name: input.name,
                    type: input.type,
                    incident_id: input.incident_id ?? null,
                    team_id: input.team_id ?? null,
                    created_by: userId!,
                })
                .select()
                .single();

            if (chError) throw chError;

            // 2. Add creator as member
            const members = [userId!, ...(input.member_ids ?? [])];
            const uniqueMembers = [...new Set(members)];

            const { error: memError } = await supabase
                .from("channel_members")
                .insert(
                    uniqueMembers.map((uid) => ({
                        channel_id: channel.id,
                        user_id: uid,
                    }))
                );

            if (memError) throw memError;

            return channel as Channel;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
    });
}

// ─── Realtime Messages Subscription ──────────────────────────────

export function useChannelRealtime(channelId: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!channelId) return;

        const channel = supabase
            .channel(`messages-${channelId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `channel_id=eq.${channelId}`,
                },
                () => {
                    queryClient.invalidateQueries({
                        queryKey: ["messages", channelId],
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, queryClient]);
}

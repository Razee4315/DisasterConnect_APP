import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Notification } from "@/types/database";

// ─── Fetch Notifications ─────────────────────────────────────────

export function useNotifications() {
    const userId = useAuthStore((s) => s.user?.id);

    return useQuery({
        queryKey: ["notifications", userId],
        queryFn: async (): Promise<Notification[]> => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId!)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) throw error;
            return (data ?? []) as Notification[];
        },
        enabled: !!userId,
    });
}

// ─── Unread Count ────────────────────────────────────────────────

export function useUnreadCount() {
    const userId = useAuthStore((s) => s.user?.id);

    return useQuery({
        queryKey: ["notifications-unread-count", userId],
        queryFn: async (): Promise<number> => {
            const { count, error } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId!)
                .eq("is_read", false);

            if (error) throw error;
            return count ?? 0;
        },
        enabled: !!userId,
        refetchInterval: 30000,
    });
}

// ─── Mark Single as Read ─────────────────────────────────────────

export function useMarkRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({
                queryKey: ["notifications-unread-count"],
            });
        },
    });
}

// ─── Mark All as Read ────────────────────────────────────────────

export function useMarkAllRead() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId!)
                .eq("is_read", false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({
                queryKey: ["notifications-unread-count"],
            });
        },
    });
}

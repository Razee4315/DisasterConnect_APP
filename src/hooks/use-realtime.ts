import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import type { Notification } from "@/types/database";

/**
 * Global Supabase Realtime subscriptions.
 * Call once inside the protected layout scope.
 */
export function useRealtime() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;

        // 1. Notifications — filtered to current user
        const notificationsChannel = supabase
            .channel("notifications-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const n = payload.new as Notification;
                    // Invalidate caches
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                    queryClient.invalidateQueries({
                        queryKey: ["notifications-unread-count"],
                    });
                    // Show toast
                    toast(n.title, {
                        description: n.body ?? undefined,
                    });
                }
            )
            .subscribe();

        // 2. Incidents — all changes
        const incidentsChannel = supabase
            .channel("incidents-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "incidents" },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["incidents"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                }
            )
            .subscribe();

        // 3. SOS Broadcasts — all inserts
        const sosChannel = supabase
            .channel("sos-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "sos_broadcasts" },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ["sos"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                    const sos = payload.new as { message?: string };
                    toast.error("🚨 SOS BROADCAST", {
                        description: sos.message || "Emergency SOS broadcast received!",
                        duration: 10000,
                    });
                }
            )
            .subscribe();

        // 4. Resources — status changes
        const resourcesChannel = supabase
            .channel("resources-realtime")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "resources" },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["resources"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                }
            )
            .subscribe();

        // 5. Tasks — all changes
        const tasksChannel = supabase
            .channel("tasks-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks" },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                }
            )
            .subscribe();

        return () => {
            notificationsChannel.unsubscribe();
            incidentsChannel.unsubscribe();
            sosChannel.unsubscribe();
            resourcesChannel.unsubscribe();
            tasksChannel.unsubscribe();
            supabase.removeChannel(notificationsChannel);
            supabase.removeChannel(incidentsChannel);
            supabase.removeChannel(sosChannel);
            supabase.removeChannel(resourcesChannel);
            supabase.removeChannel(tasksChannel);
        };
    }, [userId, queryClient]);
}

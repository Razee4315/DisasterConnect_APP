import { useEffect, useCallback } from "react";
import { useOfflineStore, type QueuedMutation } from "@/stores/offline-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const MAX_RETRIES = 3;

// ─── Online/Offline detection ───────────────────────────────────

export function useOfflineDetection() {
    const setOnline = useOfflineStore((s) => s.setOnline);

    useEffect(() => {
        const handleOnline = () => {
            setOnline(true);
            toast.success("Back online", { description: "Syncing pending changes..." });
        };

        const handleOffline = () => {
            setOnline(false);
            toast.warning("You are offline", {
                description: "Changes will be queued and synced when reconnected.",
                duration: 5000,
            });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Set initial state
        setOnline(navigator.onLine);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [setOnline]);
}

// ─── Sync engine — replays queued mutations ─────────────────────

export function useOfflineSync() {
    const queryClient = useQueryClient();
    const {
        isOnline,
        queue,
        isSyncing,
        dequeue,
        incrementRetries,
        setSyncing,
        setLastSynced,
    } = useOfflineStore();

    const replayMutation = useCallback(
        async (mutation: QueuedMutation): Promise<boolean> => {
            try {
                if (mutation.operation === "insert") {
                    const { error } = await supabase
                        .from(mutation.table)
                        .insert(mutation.payload);
                    if (error) throw error;
                } else if (mutation.operation === "update") {
                    const { id: recordId, ...rest } = mutation.payload;
                    const { error } = await supabase
                        .from(mutation.table)
                        .update(rest)
                        .eq("id", recordId as string);
                    if (error) throw error;
                } else if (mutation.operation === "delete") {
                    const { error } = await supabase
                        .from(mutation.table)
                        .delete()
                        .eq("id", mutation.payload.id as string);
                    if (error) throw error;
                }
                return true;
            } catch {
                return false;
            }
        },
        []
    );

    useEffect(() => {
        if (!isOnline || isSyncing || queue.length === 0) return;

        const sync = async () => {
            setSyncing(true);
            let successCount = 0;
            let failCount = 0;

            for (const mutation of queue) {
                if (mutation.retries >= MAX_RETRIES) {
                    // Give up after max retries
                    dequeue(mutation.id);
                    failCount++;
                    continue;
                }

                const ok = await replayMutation(mutation);
                if (ok) {
                    dequeue(mutation.id);
                    successCount++;
                } else {
                    incrementRetries(mutation.id);
                    failCount++;
                }
            }

            if (successCount > 0) {
                // Invalidate all queries to refresh data
                queryClient.invalidateQueries();
                setLastSynced(new Date().toISOString());
                toast.success(`Synced ${successCount} pending change${successCount > 1 ? "s" : ""}`);
            }

            if (failCount > 0) {
                toast.error(`${failCount} change${failCount > 1 ? "s" : ""} failed to sync`);
            }

            setSyncing(false);
        };

        sync();
    }, [
        isOnline,
        queue,
        isSyncing,
        dequeue,
        incrementRetries,
        setSyncing,
        setLastSynced,
        replayMutation,
        queryClient,
    ]);
}

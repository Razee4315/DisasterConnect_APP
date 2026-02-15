import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Queued mutation shape ──────────────────────────────────────

export interface QueuedMutation {
    id: string;
    table: string;
    operation: "insert" | "update" | "delete";
    payload: Record<string, unknown>;
    /** ISO timestamp when queued */
    queuedAt: string;
    /** Number of times we tried to replay this mutation */
    retries: number;
}

// ─── Store ──────────────────────────────────────────────────────

interface OfflineState {
    isOnline: boolean;
    queue: QueuedMutation[];
    isSyncing: boolean;
    lastSyncedAt: string | null;

    setOnline: (online: boolean) => void;
    enqueue: (mutation: Omit<QueuedMutation, "id" | "queuedAt" | "retries">) => void;
    dequeue: (id: string) => void;
    incrementRetries: (id: string) => void;
    clearQueue: () => void;
    setSyncing: (syncing: boolean) => void;
    setLastSynced: (iso: string) => void;
}

export const useOfflineStore = create<OfflineState>()(
    persist(
        (set) => ({
            isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
            queue: [],
            isSyncing: false,
            lastSyncedAt: null,

            setOnline: (online) => set({ isOnline: online }),

            enqueue: (mutation) =>
                set((state) => ({
                    queue: [
                        ...state.queue,
                        {
                            ...mutation,
                            id: crypto.randomUUID(),
                            queuedAt: new Date().toISOString(),
                            retries: 0,
                        },
                    ],
                })),

            dequeue: (id) =>
                set((state) => ({
                    queue: state.queue.filter((m) => m.id !== id),
                })),

            incrementRetries: (id) =>
                set((state) => ({
                    queue: state.queue.map((m) =>
                        m.id === id ? { ...m, retries: m.retries + 1 } : m
                    ),
                })),

            clearQueue: () => set({ queue: [] }),

            setSyncing: (syncing) => set({ isSyncing: syncing }),

            setLastSynced: (iso) => set({ lastSyncedAt: iso }),
        }),
        {
            name: "offline-queue",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                queue: state.queue,
                lastSyncedAt: state.lastSyncedAt,
            }),
        }
    )
);

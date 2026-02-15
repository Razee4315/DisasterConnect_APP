import { createClient } from "@supabase/supabase-js";
import { load, type Store } from "@tauri-apps/plugin-store";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Lazy-init Tauri store
let store: Store | null = null;
async function getStore(): Promise<Store> {
    if (!store) {
        store = await load("auth.json", { autoSave: true, defaults: {} });
    }
    return store;
}

// Custom storage adapter using tauri-plugin-store for desktop persistence
const tauriStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            const s = await getStore();
            return (await s.get<string>(key)) ?? null;
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            const s = await getStore();
            await s.set(key, value);
            await s.save();
        } catch {
            // Silent fail — app can still work without persistence
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            const s = await getStore();
            await s.delete(key);
            await s.save();
        } catch {
            // Silent fail
        }
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: tauriStorage,
    },
});

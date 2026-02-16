import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    signUp: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        organization?: string;
        role?: string;
    }) => Promise<{ error: string | null }>;
    signIn: (
        email: string,
        password: string
    ) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    updatePassword: (password: string) => Promise<{ error: string | null }>;
    fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isInitialized: false,

    initialize: async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                set({ user: session.user, session });
                await get().fetchProfile();
            }
        } catch (err) {
            console.error("[auth] Failed to initialize session:", err);
        } finally {
            set({ isLoading: false, isInitialized: true });
        }

        // Listen for auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            set({ user: session?.user ?? null, session });

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                await get().fetchProfile();
            }

            if (event === "SIGNED_OUT") {
                set({ profile: null });
            }
        });
    },

    signUp: async ({ email, password, firstName, lastName, organization, role }) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    organization: organization || "",
                    role: role || "volunteer",
                },
                emailRedirectTo: "disasterconnect://auth/callback",
            },
        });
        set({ isLoading: false });
        return { error: error?.message ?? null };
    },

    signIn: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (data.session) {
            set({ user: data.user, session: data.session });
            await get().fetchProfile();
        }
        set({ isLoading: false });
        return { error: error?.message ?? null };
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
    },

    resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "disasterconnect://auth/callback",
        });
        return { error: error?.message ?? null };
    },

    updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error?.message ?? null };
    },

    fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("[auth] Failed to fetch profile:", error.message);
            return;
        }

        if (data) {
            set({ profile: data as Profile });
        }
    },
}));

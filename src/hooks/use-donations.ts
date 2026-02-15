import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Donation } from "@/types/database";
import type { DonationType, DonationStatus } from "@/types/enums";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────

export interface DonationFilters {
    search?: string;
    type?: DonationType | "";
    status?: DonationStatus | "";
    incidentId?: string;
}

export interface DonationFormData {
    donor_name: string;
    donor_contact?: string;
    type: DonationType;
    description?: string;
    amount?: number;
    quantity?: number;
    unit?: string;
    status: DonationStatus;
    incident_id?: string;
    notes?: string;
}

// ─── List Donations ─────────────────────────────────────────────

export function useDonations(filters: DonationFilters = {}) {
    return useQuery({
        queryKey: ["donations", filters],
        queryFn: async () => {
            let q = supabase
                .from("donations")
                .select("*, profiles!donations_created_by_fkey(first_name, last_name)")
                .order("created_at", { ascending: false });

            if (filters.type) q = q.eq("type", filters.type);
            if (filters.status) q = q.eq("status", filters.status);
            if (filters.incidentId) q = q.eq("incident_id", filters.incidentId);
            if (filters.search) q = q.ilike("donor_name", `%${filters.search}%`);

            const { data, error } = await q;
            if (error) throw error;
            return (data ?? []) as (Donation & { profiles: { first_name: string; last_name: string } | null })[];
        },
    });
}

// ─── Donation Stats ─────────────────────────────────────────────

export interface DonationStats {
    totalMonetary: number;
    totalItems: number;
    pledged: number;
    received: number;
    distributed: number;
    count: number;
}

export function useDonationStats() {
    return useQuery({
        queryKey: ["donation-stats"],
        queryFn: async (): Promise<DonationStats> => {
            const { data, error } = await supabase.from("donations").select("type, amount, quantity, status");
            if (error) throw error;
            const items = data ?? [];
            return {
                count: items.length,
                totalMonetary: items.filter((d) => d.type === "monetary").reduce((s, d) => s + (Number(d.amount) || 0), 0),
                totalItems: items.filter((d) => d.type !== "monetary").reduce((s, d) => s + (d.quantity || 0), 0),
                pledged: items.filter((d) => d.status === "pledged").length,
                received: items.filter((d) => d.status === "received").length,
                distributed: items.filter((d) => d.status === "distributed").length,
            };
        },
    });
}

// ─── Create Donation ────────────────────────────────────────────

export function useCreateDonation() {
    const session = useAuthStore((s) => s.session);
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (form: DonationFormData) => {
            const { data, error } = await supabase
                .from("donations")
                .insert({
                    donor_name: form.donor_name,
                    donor_contact: form.donor_contact || null,
                    type: form.type,
                    description: form.description || null,
                    amount: form.amount ?? null,
                    quantity: form.quantity ?? null,
                    unit: form.unit || null,
                    status: form.status,
                    incident_id: form.incident_id || null,
                    notes: form.notes || null,
                    created_by: session!.user.id,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["donations"] });
            qc.invalidateQueries({ queryKey: ["donation-stats"] });
            toast.success("Donation recorded");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

// ─── Update Donation ────────────────────────────────────────────

export function useUpdateDonation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...form }: DonationFormData & { id: string }) => {
            const updates: Record<string, unknown> = {
                donor_name: form.donor_name,
                donor_contact: form.donor_contact || null,
                type: form.type,
                description: form.description || null,
                amount: form.amount ?? null,
                quantity: form.quantity ?? null,
                unit: form.unit || null,
                status: form.status,
                incident_id: form.incident_id || null,
                notes: form.notes || null,
            };
            if (form.status === "received") updates.received_at = new Date().toISOString();
            if (form.status === "distributed") updates.distributed_at = new Date().toISOString();

            const { data, error } = await supabase.from("donations").update(updates).eq("id", id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["donations"] });
            qc.invalidateQueries({ queryKey: ["donation-stats"] });
            toast.success("Donation updated");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

// ─── Delete Donation ────────────────────────────────────────────

export function useDeleteDonation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("donations").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["donations"] });
            qc.invalidateQueries({ queryKey: ["donation-stats"] });
            toast.success("Donation deleted");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

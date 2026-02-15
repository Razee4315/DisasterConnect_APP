import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Document } from "@/types/database";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────

export interface DocumentFilters {
    search?: string;
    incidentId?: string;
}

// ─── List Documents ─────────────────────────────────────────────

export function useDocuments(filters: DocumentFilters = {}) {
    return useQuery({
        queryKey: ["documents", filters],
        queryFn: async () => {
            let q = supabase
                .from("documents")
                .select("*, profiles!documents_uploaded_by_fkey(first_name, last_name)")
                .order("created_at", { ascending: false });

            if (filters.incidentId) q = q.eq("incident_id", filters.incidentId);
            if (filters.search) q = q.ilike("name", `%${filters.search}%`);

            const { data, error } = await q;
            if (error) throw error;
            return (data ?? []) as (Document & { profiles: { first_name: string; last_name: string } | null })[];
        },
    });
}

// ─── Upload Document ────────────────────────────────────────────

export function useUploadDocument() {
    const session = useAuthStore((s) => s.session);
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ file, incidentId }: { file: File; incidentId?: string }) => {
            const userId = session!.user.id;
            const timestamp = Date.now();
            const filePath = `${userId}/${timestamp}_${file.name}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, file, { cacheControl: "3600", upsert: false });
            if (uploadError) throw uploadError;

            // Insert DB row
            const { data, error: dbError } = await supabase
                .from("documents")
                .insert({
                    name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type || null,
                    incident_id: incidentId || null,
                    uploaded_by: userId,
                })
                .select()
                .single();
            if (dbError) throw dbError;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            toast.success("Document uploaded");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

// ─── Download Document ──────────────────────────────────────────

export function useDownloadUrl() {
    return async (filePath: string) => {
        const { data, error } = await supabase.storage
            .from("documents")
            .createSignedUrl(filePath, 3600); // 1hr
        if (error) throw error;
        return data.signedUrl;
    };
}

// ─── Delete Document ────────────────────────────────────────────

export function useDeleteDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
            // Delete from storage
            await supabase.storage.from("documents").remove([filePath]);
            // Delete DB row
            const { error } = await supabase.from("documents").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            toast.success("Document deleted");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

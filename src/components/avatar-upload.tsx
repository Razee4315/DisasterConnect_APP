import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Trash2, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

/** Crop a source image and return a Blob */
async function getCroppedBlob(
    src: string,
    crop: Area,
    outputSize = 256
): Promise<Blob> {
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = src;
    });

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outputSize,
        outputSize
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
            "image/jpeg",
            0.9
        );
    });
}

export function AvatarUpload() {
    const { profile, session, fetchProfile } = useAuthStore();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);

    const initials = profile
        ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()
        : "?";

    const avatarUrl = profile?.avatar_url || null;

    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedArea(croppedAreaPixels);
    }, []);

    const handleFileSelect = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/webp";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be under 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => setImageSrc(reader.result as string);
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const handleUpload = async () => {
        if (!imageSrc || !croppedArea || !session) return;
        setUploading(true);

        try {
            const blob = await getCroppedBlob(imageSrc, croppedArea);
            const userId = session.user.id;
            const filePath = `${userId}/avatar.jpg`;

            // Upload (upsert to replace existing)
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, blob, {
                    contentType: "image/jpeg",
                    cacheControl: "3600",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            // Add cache-buster to force refresh
            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            // Update profile
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", userId);

            if (updateError) throw updateError;

            await fetchProfile();
            setImageSrc(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            toast.success("Profile picture updated");
        } catch (err: any) {
            console.error("[avatar] Upload failed:", err);
            toast.error(err?.message || "Failed to upload avatar");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!session || !avatarUrl) return;
        setRemoving(true);

        try {
            const userId = session.user.id;

            // Remove file from storage
            await supabase.storage
                .from("avatars")
                .remove([`${userId}/avatar.jpg`]);

            // Clear avatar_url in profile
            const { error } = await supabase
                .from("profiles")
                .update({ avatar_url: null })
                .eq("id", userId);

            if (error) throw error;

            await fetchProfile();
            toast.success("Profile picture removed");
        } catch (err: any) {
            console.error("[avatar] Remove failed:", err);
            toast.error(err?.message || "Failed to remove avatar");
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <Avatar className="h-16 w-16">
                        {avatarUrl && (
                            <AvatarImage src={avatarUrl} alt="Profile picture" />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <button
                        type="button"
                        onClick={handleFileSelect}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <Camera className="h-5 w-5 text-white" />
                    </button>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleFileSelect}
                    >
                        <Camera className="h-3.5 w-3.5" />
                        {avatarUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {avatarUrl && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={handleRemove}
                            disabled={removing}
                        >
                            {removing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Remove
                        </Button>
                    )}
                </div>
            </div>

            {/* Crop Dialog */}
            <Dialog open={!!imageSrc} onOpenChange={(open) => !open && setImageSrc(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crop Profile Picture</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-3 px-1">
                        <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-1.5 accent-primary cursor-pointer"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImageSrc(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={uploading} className="gap-1.5">
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Photo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

import { useEffect, useState, useCallback } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type UpdateState = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export function UpdateChecker() {
    const [state, setState] = useState<UpdateState>("idle");
    const [update, setUpdate] = useState<Update | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [progress, setProgress] = useState(0);

    // Check for updates on mount and every 30 minutes
    const checkForUpdate = useCallback(async () => {
        try {
            setState("checking");
            const result = await check();
            if (result) {
                setUpdate(result);
                setState("available");
                setDialogOpen(true);
            } else {
                setState("idle");
            }
        } catch {
            setState("idle");
            // Silently fail — update server may not be configured yet
        }
    }, []);

    useEffect(() => {
        // Initial check after 5 seconds
        const initial = setTimeout(checkForUpdate, 5000);
        // Periodic check every 30 minutes
        const interval = setInterval(checkForUpdate, 30 * 60 * 1000);

        return () => {
            clearTimeout(initial);
            clearInterval(interval);
        };
    }, [checkForUpdate]);

    const handleDownload = async () => {
        if (!update) return;

        try {
            setState("downloading");
            let downloaded = 0;
            let contentLength = 0;

            await update.downloadAndInstall((event) => {
                switch (event.event) {
                    case "Started":
                        contentLength = event.data.contentLength ?? 0;
                        break;
                    case "Progress":
                        downloaded += event.data.chunkLength;
                        if (contentLength > 0) {
                            setProgress(Math.round((downloaded / contentLength) * 100));
                        }
                        break;
                    case "Finished":
                        break;
                }
            });

            setState("ready");
            toast.success("Update installed! Restart to apply.");
        } catch {
            setState("error");
            toast.error("Failed to download update");
        }
    };

    const handleRelaunch = async () => {
        try {
            await relaunch();
        } catch {
            toast.error("Failed to restart. Please close and reopen the app.");
        }
    };

    // Don't render anything if no update
    if (state === "idle" || state === "checking") return null;

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {state === "ready" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <Download className="h-5 w-5" />
                        )}
                        {state === "ready" ? "Update Ready" : "Update Available"}
                    </DialogTitle>
                    <DialogDescription>
                        {state === "ready"
                            ? "The update has been installed. Restart the app to apply changes."
                            : `A new version of DisasterConnect is available (${update?.version ?? "unknown"}).`}
                    </DialogDescription>
                </DialogHeader>

                {state === "downloading" && (
                    <div className="space-y-2 py-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>Downloading...</span>
                            <span className="text-muted-foreground">{progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {state === "available" && (
                        <>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Later
                            </Button>
                            <Button onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download & Install
                            </Button>
                        </>
                    )}
                    {state === "downloading" && (
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
                        </Button>
                    )}
                    {state === "ready" && (
                        <>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Later
                            </Button>
                            <Button onClick={handleRelaunch}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Restart Now
                            </Button>
                        </>
                    )}
                    {state === "error" && (
                        <>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Dismiss
                            </Button>
                            <Button onClick={handleDownload}>
                                Retry
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

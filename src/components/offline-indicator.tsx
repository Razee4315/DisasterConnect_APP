import { useOfflineStore } from "@/stores/offline-store";
import { WifiOff, Loader2, CloudUpload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function OfflineIndicator() {
    const isOnline = useOfflineStore((s) => s.isOnline);
    const queueLength = useOfflineStore((s) => s.queue.length);
    const isSyncing = useOfflineStore((s) => s.isSyncing);

    // Show nothing when online and no pending items
    if (isOnline && queueLength === 0 && !isSyncing) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center">
                    {!isOnline ? (
                        <Badge variant="destructive" className="gap-1.5 text-xs">
                            <WifiOff className="h-3 w-3" />
                            Offline
                            {queueLength > 0 && (
                                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] leading-none">
                                    {queueLength}
                                </span>
                            )}
                        </Badge>
                    ) : isSyncing ? (
                        <Badge variant="secondary" className="gap-1.5 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Syncing...
                        </Badge>
                    ) : queueLength > 0 ? (
                        <Badge variant="secondary" className="gap-1.5 text-xs">
                            <CloudUpload className="h-3 w-3" />
                            {queueLength} pending
                        </Badge>
                    ) : null}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {!isOnline
                    ? `Offline — ${queueLength} change${queueLength !== 1 ? "s" : ""} queued`
                    : isSyncing
                      ? "Syncing pending changes..."
                      : `${queueLength} change${queueLength !== 1 ? "s" : ""} pending sync`}
            </TooltipContent>
        </Tooltip>
    );
}

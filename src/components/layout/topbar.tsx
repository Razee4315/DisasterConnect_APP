import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Search,
    AlertOctagon,
    User,
    Settings,
    LogOut,
    Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateSOS } from "@/hooks/use-sos";
import { toast } from "sonner";
import type { SeverityLevel } from "@/types/enums";
import { CommandPalette } from "@/components/command-palette";

export function TopBar() {
    const { profile, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [sosOpen, setSOSOpen] = useState(false);
    const [sosMessage, setSOSMessage] = useState("");
    const [sosSeverity, setSOSSeverity] = useState<SeverityLevel>("critical");
    const [cmdOpen, setCmdOpen] = useState(false);
    const createSOS = useCreateSOS();

    const initials = profile
        ? `${profile.first_name[0] || ""}${profile.last_name[0] || ""}`.toUpperCase()
        : "?";

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const handleSOS = async () => {
        if (!sosMessage.trim()) {
            toast.error("Please describe the emergency");
            return;
        }

        try {
            const result = await createSOS.mutateAsync({
                message: sosMessage.trim(),
                severity: sosSeverity,
            });
            toast.success("SOS broadcast sent!", {
                description: `Incident #${result.incident.id.slice(0, 8)} created`,
            });
            setSOSOpen(false);
            setSOSMessage("");
            setSOSSeverity("critical");
        } catch {
            toast.error("Failed to send SOS broadcast");
        }
    };

    return (
        <>
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
                {/* Search trigger — opens Command Palette */}
                <button
                    type="button"
                    onClick={() => setCmdOpen(true)}
                    className="relative flex h-9 flex-1 max-w-md items-center gap-2 rounded-md bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">Search incidents, resources, tasks...</span>
                    <kbd className="pointer-events-none hidden rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline-block">
                        Ctrl+K
                    </kbd>
                </button>

                <div className="flex-1" />

                {/* SOS Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1.5 font-semibold shadow-sm"
                            onClick={() => setSOSOpen(true)}
                        >
                            <AlertOctagon className="h-4 w-4" />
                            SOS
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send emergency SOS broadcast</TooltipContent>
                </Tooltip>

                {/* Notifications */}
                <NotificationPanel />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 gap-2 px-2">
                            <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium hidden sm:inline-block">
                                {profile?.first_name}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="font-normal">
                            <p className="text-sm font-medium">
                                {profile?.first_name} {profile?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/settings")}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/settings")}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="text-destructive focus:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* Command Palette */}
            <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

            {/* SOS Dialog */}
            <Dialog open={sosOpen} onOpenChange={setSOSOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertOctagon className="h-5 w-5" />
                            Emergency SOS Broadcast
                        </DialogTitle>
                        <DialogDescription>
                            This will send an emergency alert to all coordinators and
                            responders, and automatically create a critical incident.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Severity</label>
                            <Select
                                value={sosSeverity}
                                onValueChange={(v) => setSOSSeverity(v as SeverityLevel)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="critical">🔴 Critical</SelectItem>
                                    <SelectItem value="high">🟠 High</SelectItem>
                                    <SelectItem value="medium">🟡 Medium</SelectItem>
                                    <SelectItem value="low">🟢 Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Emergency Description</label>
                            <Textarea
                                placeholder="Describe the emergency situation..."
                                value={sosMessage}
                                onChange={(e) => setSOSMessage(e.target.value)}
                                rows={3}
                                data-selectable
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your location will be shared automatically with the broadcast.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSOSOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSOS}
                            disabled={createSOS.isPending}
                        >
                            {createSOS.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Send SOS
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

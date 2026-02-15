import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    Search,
    AlertOctagon,
    Bell,
    User,
    Settings,
    LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
    const { profile, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [sosOpen, setSOSOpen] = useState(false);

    const initials = profile
        ? `${profile.first_name[0] || ""}${profile.last_name[0] || ""}`.toUpperCase()
        : "?";

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    return (
        <>
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search incidents, resources, people..."
                        className="pl-9 h-9 bg-muted/50 border-none"
                        data-selectable
                    />
                </div>

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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-9 w-9"
                            onClick={() => navigate("/alerts")}
                        >
                            <Bell className="h-4 w-4" />
                            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                                3
                            </Badge>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Notifications</TooltipContent>
                </Tooltip>

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
                            responders. Only use in genuine emergencies.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder="Brief description of the emergency..."
                            data-selectable
                        />
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
                            onClick={() => {
                                // TODO: Implement SOS broadcast
                                setSOSOpen(false);
                            }}
                        >
                            Send SOS
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

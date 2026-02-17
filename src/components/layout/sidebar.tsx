import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    LayoutDashboard,
    AlertTriangle,
    Package,
    Map,
    ListTodo,
    MessageSquare,
    Bell,
    Users,
    HandCoins,
    FileBarChart,
    BarChart3,
    Route,
    FileText,
    Settings,
    ShieldCheck,
    ScrollText,
    LogOut,
    PanelLeftClose,
    PanelLeft,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { formatRole } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Incidents", icon: AlertTriangle, href: "/incidents" },
    { label: "Resources", icon: Package, href: "/resources" },
    { label: "Map", icon: Map, href: "/map" },
    { label: "Tasks", icon: ListTodo, href: "/tasks" },
    { label: "Messaging", icon: MessageSquare, href: "/messaging" },
    { label: "Alerts", icon: Bell, href: "/alerts" },
    { label: "Teams", icon: Users, href: "/teams" },
    { label: "Donations", icon: HandCoins, href: "/donations" },
    { label: "Reports", icon: FileBarChart, href: "/reports" },
    { label: "Analytics", icon: BarChart3, href: "/analytics" },
    { label: "Evacuation", icon: Route, href: "/evacuation" },
    { label: "Documents", icon: FileText, href: "/documents" },
] as const;

const BOTTOM_ITEMS = [
    { label: "Settings", icon: Settings, href: "/settings" },
    { label: "Audit Log", icon: ScrollText, href: "/audit-log", adminOnly: true },
    { label: "Admin", icon: ShieldCheck, href: "/admin", adminOnly: true },
] as const;

export function Sidebar() {
    const { profile, signOut } = useAuthStore();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const navigate = useNavigate();

    const isAdmin = profile?.role === "administrator";
    const initials = profile
        ? `${profile.first_name[0] || ""}${profile.last_name[0] || ""}`.toUpperCase()
        : "?";

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
                sidebarCollapsed ? "w-16" : "w-60"
            )}
        >
            {/* Logo + collapse toggle */}
            <div className={cn("flex h-14 items-center px-3", sidebarCollapsed ? "justify-center" : "justify-between")}>
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <AppLogo className="h-6 w-6" />
                        <span className="text-sm font-bold tracking-tight">
                            Disaster<span className="text-primary">Connect</span>
                        </span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={toggleSidebar}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {sidebarCollapsed ? (
                        <PanelLeft className="h-4 w-4" />
                    ) : (
                        <PanelLeftClose className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <Separator className="bg-sidebar-border" />

            {/* Main navigation */}
            <nav className={cn("flex-1 overflow-y-auto py-2 scrollable", sidebarCollapsed ? "px-1" : "px-2")}>
                <div className={cn(sidebarCollapsed ? "flex flex-col items-center gap-1" : "space-y-0.5")}>
                    {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
                        <SidebarLink
                            key={href}
                            label={label}
                            icon={<Icon className={cn("shrink-0", sidebarCollapsed ? "h-5 w-5" : "h-4 w-4")} />}
                            href={href}
                            collapsed={sidebarCollapsed}
                        />
                    ))}
                </div>
            </nav>

            <Separator className="bg-sidebar-border" />

            {/* Bottom section */}
            <div className={cn("py-2", sidebarCollapsed ? "px-1 flex flex-col items-center gap-1" : "px-2 space-y-0.5")}>
                {BOTTOM_ITEMS.filter((item) => !("adminOnly" in item) || isAdmin).map(
                    ({ label, icon: Icon, href }) => (
                        <SidebarLink
                            key={href}
                            label={label}
                            icon={<Icon className={cn(sidebarCollapsed ? "h-5 w-5" : "h-4 w-4")} />}
                            href={href}
                            collapsed={sidebarCollapsed}
                        />
                    )
                )}
            </div>

            <Separator className="bg-sidebar-border" />

            {/* User footer */}
            <div className={cn("p-2", sidebarCollapsed && "flex flex-col items-center")}>
                {sidebarCollapsed ? (
                    <div className="flex flex-col items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Avatar className="h-9 w-9 cursor-default">
                                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Avatar" />}
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {profile?.first_name} {profile?.last_name}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
                                    onClick={handleSignOut}
                                    aria-label="Sign out"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Sign out</TooltipContent>
                        </Tooltip>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-lg p-2">
                        <Avatar className="h-8 w-8 shrink-0">
                            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Avatar" />}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                                {profile?.first_name} {profile?.last_name}
                            </p>
                            <p className="truncate text-xs text-sidebar-foreground">
                                {profile?.role ? formatRole(profile.role) : ""}
                            </p>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Sign out</TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </div>
        </aside>
    );
}

function SidebarLink({
    label,
    icon,
    href,
    collapsed,
}: {
    label: string;
    icon: React.ReactNode;
    href: string;
    collapsed: boolean;
}) {
    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <NavLink
                        to={href}
                        className={({ isActive }) =>
                            cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )
                        }
                    >
                        {icon}
                    </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <NavLink
            to={href}
            className={({ isActive }) =>
                cn(
                    "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                    isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )
            }
        >
            {icon}
            {label}
        </NavLink>
    );
}

import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    Shield,
} from "lucide-react";

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
            <div className="flex h-14 items-center justify-between px-3">
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
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
            <nav className="flex-1 overflow-y-auto py-2 px-2 scrollable">
                <div className="space-y-1">
                    {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
                        <SidebarLink
                            key={href}
                            label={label}
                            icon={<Icon className="h-4 w-4" />}
                            href={href}
                            collapsed={sidebarCollapsed}
                        />
                    ))}
                </div>
            </nav>

            <Separator className="bg-sidebar-border" />

            {/* Bottom section */}
            <div className="py-2 px-2 space-y-1">
                {BOTTOM_ITEMS.filter((item) => !("adminOnly" in item) || isAdmin).map(
                    ({ label, icon: Icon, href }) => (
                        <SidebarLink
                            key={href}
                            label={label}
                            icon={<Icon className="h-4 w-4" />}
                            href={href}
                            collapsed={sidebarCollapsed}
                        />
                    )
                )}
            </div>

            <Separator className="bg-sidebar-border" />

            {/* User footer */}
            <div className="p-2">
                <div
                    className={cn(
                        "flex items-center gap-3 rounded-lg p-2",
                        sidebarCollapsed && "justify-center"
                    )}
                >
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {!sidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                                {profile?.first_name} {profile?.last_name}
                            </p>
                            <p className="truncate text-xs text-sidebar-foreground capitalize">
                                {profile?.role?.replace("_", " ")}
                            </p>
                        </div>
                    )}

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
                                "flex h-9 w-full items-center justify-center rounded-md transition-colors",
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

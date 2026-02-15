import { useNavigate } from "react-router-dom";
import {
    useNotifications,
    useUnreadCount,
    useMarkRead,
    useMarkAllRead,
} from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Bell,
    AlertTriangle,
    Package,
    ListTodo,
    MessageSquare,
    Radio,
    Info,
    Users,
    CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NotificationType } from "@/types/enums";
import type { Notification } from "@/types/database";

const typeConfig: Record<
    NotificationType,
    { icon: typeof Bell; color: string }
> = {
    incident_created: { icon: AlertTriangle, color: "text-orange-500" },
    incident_updated: { icon: AlertTriangle, color: "text-yellow-500" },
    incident_resolved: { icon: AlertTriangle, color: "text-green-500" },
    resource_assigned: { icon: Package, color: "text-blue-500" },
    resource_released: { icon: Package, color: "text-gray-500" },
    task_assigned: { icon: ListTodo, color: "text-indigo-500" },
    task_completed: { icon: ListTodo, color: "text-green-500" },
    sos_broadcast: { icon: Radio, color: "text-red-500" },
    alert_issued: { icon: AlertTriangle, color: "text-red-500" },
    message_received: { icon: MessageSquare, color: "text-gray-500" },
    team_assigned: { icon: Users, color: "text-teal-500" },
    system: { icon: Info, color: "text-gray-400" },
};

function getEntityRoute(n: Notification): string | null {
    if (!n.entity_type || !n.entity_id) return null;
    switch (n.entity_type) {
        case "incident":
            return `/incidents/${n.entity_id}`;
        case "resource":
            return `/resources/${n.entity_id}`;
        case "task":
            return "/tasks";
        case "sos_broadcast":
            return "/map";
        case "alert":
            return "/alerts";
        case "message":
            return "/messaging";
        default:
            return null;
    }
}

export function NotificationPanel() {
    const navigate = useNavigate();
    const { data: notifications = [] } = useNotifications();
    const { data: unreadCount = 0 } = useUnreadCount();
    const markRead = useMarkRead();
    const markAllRead = useMarkAllRead();

    const handleClick = (n: Notification) => {
        if (!n.is_read) markRead.mutate(n.id);
        const route = getEntityRoute(n);
        if (route) navigate(route);
    };

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-9 w-9">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markAllRead.mutate()}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* List */}
                <ScrollArea className="max-h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((n) => {
                            const cfg = typeConfig[n.type] ?? typeConfig.system;
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${!n.is_read ? "bg-primary/5" : ""
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm leading-tight ${!n.is_read ? "font-medium" : "text-muted-foreground"
                                                }`}
                                        >
                                            {n.title}
                                        </p>
                                        {n.body && (
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                {n.body}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(n.created_at), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                    {!n.is_read && (
                                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

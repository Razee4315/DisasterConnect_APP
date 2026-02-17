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
import { Separator } from "@/components/ui/separator";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
    BellOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NotificationType } from "@/types/enums";
import type { Notification } from "@/types/database";

const typeConfig: Record<
    NotificationType,
    { icon: typeof Bell; color: string; bg: string }
> = {
    incident_created: { icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
    incident_updated: { icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/20" },
    incident_resolved: { icon: AlertTriangle, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-500/20" },
    resource_assigned: { icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20" },
    resource_released: { icon: Package, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-500/20" },
    task_assigned: { icon: ListTodo, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/20" },
    task_completed: { icon: ListTodo, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-500/20" },
    sos_broadcast: { icon: Radio, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/20" },
    alert_issued: { icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/20" },
    message_received: { icon: MessageSquare, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-500/20" },
    team_assigned: { icon: Users, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100 dark:bg-teal-500/20" },
    system: { icon: Info, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-500/20" },
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
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-9 w-9">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <PopoverContent align="end" className="w-[360px] p-0" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markAllRead.mutate()}
                        >
                            <CheckCheck className="h-3 w-3" />
                            Read all
                        </Button>
                    )}
                </div>

                <Separator />

                {/* List */}
                <ScrollArea className="max-h-[380px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                                <BellOff className="h-6 w-6 opacity-50" />
                            </div>
                            <p className="text-sm font-medium">All caught up</p>
                            <p className="text-xs mt-0.5">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {notifications.map((n) => {
                                const cfg = typeConfig[n.type] ?? typeConfig.system;
                                const Icon = cfg.icon;
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleClick(n)}
                                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/50 ${!n.is_read ? "bg-primary/5" : ""}`}
                                    >
                                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                                            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-tight ${!n.is_read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                                {n.title}
                                            </p>
                                            {n.body && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                    {n.body}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-muted-foreground/70 mt-1">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!n.is_read && (
                                            <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

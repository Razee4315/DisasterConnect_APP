import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { format } from "date-fns";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/enums";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    ShieldCheck,
    Users,
    AlertTriangle,
    Package,
    ListTodo,
    MessageSquare,
    Search,
    Loader2,
    Edit,
} from "lucide-react";
import { toast } from "sonner";

// ─── System stats hook ──────────────────────────────────────────

interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalIncidents: number;
    totalResources: number;
    totalTasks: number;
    totalMessages: number;
}

function useSystemStats() {
    return useQuery({
        queryKey: ["admin", "system-stats"],
        queryFn: async (): Promise<SystemStats> => {
            const [users, activeUsers, incidents, resources, tasks, messages] = await Promise.all([
                supabase.from("profiles").select("*", { count: "exact", head: true }),
                supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
                supabase.from("incidents").select("*", { count: "exact", head: true }),
                supabase.from("resources").select("*", { count: "exact", head: true }),
                supabase.from("tasks").select("*", { count: "exact", head: true }),
                supabase.from("messages").select("*", { count: "exact", head: true }),
            ]);

            return {
                totalUsers: users.count ?? 0,
                activeUsers: activeUsers.count ?? 0,
                totalIncidents: incidents.count ?? 0,
                totalResources: resources.count ?? 0,
                totalTasks: tasks.count ?? 0,
                totalMessages: messages.count ?? 0,
            };
        },
        staleTime: 30_000,
    });
}

// ─── All users hook ─────────────────────────────────────────────

function useAllUsers() {
    return useQuery({
        queryKey: ["admin", "users"],
        queryFn: async (): Promise<Profile[]> => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as Profile[];
        },
    });
}

// ─── Update user mutation with audit logging ────────────────────

function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            changes,
            targetName,
        }: {
            id: string;
            changes: { role?: UserRole; is_active?: boolean };
            targetName: string;
        }) => {
            const { error } = await supabase
                .from("profiles")
                .update(changes)
                .eq("id", id);

            if (error) throw error;

            // Log the action to audit_log
            const details: string[] = [];
            if (changes.role !== undefined) details.push(`role → ${changes.role}`);
            if (changes.is_active !== undefined) details.push(changes.is_active ? "reactivated" : "deactivated");

            await supabase.from("audit_log").insert({
                action: "user_updated",
                entity_type: "profile",
                entity_id: id,
                details: `Admin updated ${targetName}: ${details.join(", ")}`,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin"] });
        },
    });
}

// ─── Role badge ─────────────────────────────────────────────────

const ROLE_COLORS: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
    administrator: "destructive",
    coordinator: "default",
    emergency_responder: "default",
    medical_staff: "secondary",
    logistics: "secondary",
    volunteer: "outline",
    other: "outline",
};

// ─── Stats card ─────────────────────────────────────────────────

function StatCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Admin Page ────────────────────────────────────────────

export default function AdminPage() {
    const currentUser = useAuthStore((s) => s.profile);
    const { data: stats, isLoading: statsLoading } = useSystemStats();
    const { data: users, isLoading: usersLoading } = useAllUsers();
    const updateUser = useUpdateUser();

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [editUser, setEditUser] = useState<Profile | null>(null);
    const [editRole, setEditRole] = useState<UserRole>("volunteer");
    const [editActive, setEditActive] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // Check admin access
    if (currentUser?.role !== "administrator") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <ShieldCheck className="h-12 w-12 text-muted-foreground opacity-40" />
                <div>
                    <h1 className="text-xl font-bold">Access Denied</h1>
                    <p className="text-sm text-muted-foreground">
                        Only administrators can access this page.
                    </p>
                </div>
            </div>
        );
    }

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter((u) => {
            const matchesSearch =
                !search ||
                `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                u.organization?.toLowerCase().includes(search.toLowerCase());
            const matchesRole = !roleFilter || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    const openEditDialog = (user: Profile) => {
        setEditUser(user);
        setEditRole(user.role);
        setEditActive(user.is_active);
    };

    const isSelf = editUser?.id === currentUser?.id;

    const executeSave = async () => {
        if (!editUser) return;

        const changes: { role?: UserRole; is_active?: boolean } = {};
        if (editRole !== editUser.role) changes.role = editRole;
        if (editActive !== editUser.is_active) changes.is_active = editActive;

        if (Object.keys(changes).length === 0) {
            setEditUser(null);
            return;
        }

        try {
            await updateUser.mutateAsync({
                id: editUser.id,
                changes,
                targetName: `${editUser.first_name} ${editUser.last_name}`,
            });
            toast.success("User updated", {
                description: `${editUser.first_name} ${editUser.last_name} has been updated.`,
            });
            setEditUser(null);
        } catch {
            toast.error("Failed to update user");
        }
    };

    const handleSave = () => {
        if (!editUser) return;

        // Self-protection: prevent admin from removing their own admin role
        if (isSelf && editRole !== "administrator") {
            toast.error("Cannot change your own role", {
                description: "You cannot remove your own administrator role. Ask another admin to do this.",
            });
            return;
        }

        // Self-protection: prevent admin from deactivating themselves
        if (isSelf && !editActive) {
            toast.error("Cannot deactivate yourself", {
                description: "You cannot deactivate your own account. Ask another admin to do this.",
            });
            return;
        }

        // Confirmation for dangerous actions
        const isDangerousRoleChange = editRole === "administrator" && editUser.role !== "administrator";
        const isDeactivation = !editActive && editUser.is_active;

        if (isDangerousRoleChange) {
            setConfirmAction({
                message: `You are about to grant administrator privileges to ${editUser.first_name} ${editUser.last_name}. This will give them full access to manage all users and system settings. Continue?`,
                onConfirm: executeSave,
            });
            setConfirmOpen(true);
            return;
        }

        if (isDeactivation) {
            setConfirmAction({
                message: `You are about to deactivate ${editUser.first_name} ${editUser.last_name}'s account. They will lose access to all data and features immediately. Continue?`,
                onConfirm: executeSave,
            });
            setConfirmOpen(true);
            return;
        }

        executeSave();
    };

    const handleConfirm = () => {
        confirmAction?.onConfirm();
        setConfirmOpen(false);
        setConfirmAction(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6" />
                    Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage users, view system statistics, and monitor platform health.
                </p>
            </div>

            {/* System Stats */}
            {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
                    <StatCard title="Active Users" value={stats.activeUsers} icon={Users} />
                    <StatCard title="Incidents" value={stats.totalIncidents} icon={AlertTriangle} />
                    <StatCard title="Resources" value={stats.totalResources} icon={Package} />
                    <StatCard title="Tasks" value={stats.totalTasks} icon={ListTodo} />
                    <StatCard title="Messages" value={stats.totalMessages} icon={MessageSquare} />
                </div>
            ) : null}

            {/* User Management */}
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                        View and manage all registered users. Change roles or deactivate accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9"
                                data-selectable
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All roles</SelectItem>
                                <SelectItem value="administrator">Administrator</SelectItem>
                                <SelectItem value="coordinator">Coordinator</SelectItem>
                                <SelectItem value="emergency_responder">Emergency Responder</SelectItem>
                                <SelectItem value="medical_staff">Medical Staff</SelectItem>
                                <SelectItem value="logistics">Logistics</SelectItem>
                                <SelectItem value="volunteer">Volunteer</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {usersLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="w-[60px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const initials = `${user.first_name[0] || ""}${user.last_name[0] || ""}`.toUpperCase();
                                            const isCurrentUser = user.id === currentUser?.id;
                                            return (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                    {initials}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {user.first_name} {user.last_name}
                                                                    {isCurrentUser && (
                                                                        <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={ROLE_COLORS[user.role]} className="capitalize text-xs">
                                                            {user.role.replace("_", " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {user.organization || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                                                            {user.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {format(new Date(user.created_at), "MMM d, yyyy")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => openEditDialog(user)}
                                                            aria-label="Edit user"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} shown
                    </p>
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Modify role or status for {editUser?.first_name} {editUser?.last_name}.
                            {isSelf && (
                                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                                    You cannot change your own role or deactivate yourself.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Role</label>
                            <Select
                                value={editRole}
                                onValueChange={(v) => setEditRole(v as UserRole)}
                                disabled={isSelf}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="administrator">Administrator</SelectItem>
                                    <SelectItem value="coordinator">Coordinator</SelectItem>
                                    <SelectItem value="emergency_responder">Emergency Responder</SelectItem>
                                    <SelectItem value="medical_staff">Medical Staff</SelectItem>
                                    <SelectItem value="logistics">Logistics</SelectItem>
                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Account Active</label>
                            <Switch
                                checked={editActive}
                                onCheckedChange={setEditActive}
                                disabled={isSelf}
                            />
                        </div>
                        {isSelf && (
                            <p className="text-xs text-muted-foreground">
                                Self-modification is disabled to prevent accidental lockout.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUser(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateUser.isPending || isSelf}>
                            {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for dangerous actions */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Action
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction?.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirm} disabled={updateUser.isPending}>
                            {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

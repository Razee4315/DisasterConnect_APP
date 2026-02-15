import { useState } from "react";
import {
    useTeams,
    useTeam,
    useCreateTeam,
    useAddTeamMember,
    useRemoveTeamMember,
    type TeamWithMembers,
    type TeamMemberWithProfile,
} from "@/hooks/use-teams";
import { useProfiles } from "@/hooks/use-tasks";
import { useIncidents } from "@/hooks/use-incidents";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Plus,
    Search,
    Users,
    UserPlus,
    UserMinus,
    ArrowLeft,
    Loader2,
    Shield,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Team Card ───────────────────────────────────────────────────

function TeamCard({
    team,
    onClick,
}: {
    team: TeamWithMembers;
    onClick: () => void;
}) {
    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-all group"
            onClick={onClick}
        >
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">{team.name}</h3>
                            <p className="text-[10px] text-muted-foreground">
                                Created {format(new Date(team.created_at), "MMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                        {team.member_count ?? 0} members
                    </Badge>
                </div>
                {team.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {team.description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Team Detail View ────────────────────────────────────────────

function TeamDetail({
    teamId,
    onBack,
}: {
    teamId: string;
    onBack: () => void;
}) {
    const userId = useAuthStore((s) => s.user?.id);
    const { data: team, isLoading } = useTeam(teamId);
    const { data: allProfiles = [] } = useProfiles();
    const addMember = useAddTeamMember();
    const removeMember = useRemoveTeamMember();
    const [addOpen, setAddOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [memberRole, setMemberRole] = useState("member");

    if (isLoading || !team) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const memberIds = new Set(team.members?.map((m) => m.user_id) ?? []);
    const availableProfiles = allProfiles.filter((p) => !memberIds.has(p.id));

    const handleAddMember = async () => {
        if (!selectedUser) return;
        try {
            await addMember.mutateAsync({
                teamId,
                userId: selectedUser,
                role: memberRole,
            });
            toast.success("Member added");
            setAddOpen(false);
            setSelectedUser("");
        } catch {
            toast.error("Failed to add member");
        }
    };

    const handleRemove = async (memberId: string) => {
        try {
            await removeMember.mutateAsync({ teamId, userId: memberId });
            toast.success("Member removed");
        } catch {
            toast.error("Failed to remove member");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">{team.name}</h2>
                    {team.description && (
                        <p className="text-sm text-muted-foreground">{team.description}</p>
                    )}
                </div>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Add Member
                </Button>
            </div>

            {/* Members List */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                    Members ({team.members?.length ?? 0})
                </h3>
                {team.members?.map((m: TeamMemberWithProfile) => {
                    const name = m.profile
                        ? `${m.profile.first_name} ${m.profile.last_name}`
                        : "Unknown";
                    const initials = m.profile
                        ? `${m.profile.first_name[0]}${m.profile.last_name[0]}`.toUpperCase()
                        : "?";
                    const isLead = m.role === "lead";
                    const isSelf = m.user_id === userId;

                    return (
                        <div
                            key={m.user_id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-muted">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{name}</span>
                                    {isLead && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] gap-0.5 border-amber-500/30 text-amber-600 bg-amber-500/10"
                                        >
                                            <Shield className="h-2.5 w-2.5" />
                                            Lead
                                        </Badge>
                                    )}
                                    {isSelf && (
                                        <Badge variant="secondary" className="text-[10px]">
                                            You
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                    {m.profile?.role?.replace("_", " ") ?? m.role}
                                </p>
                            </div>
                            {!isSelf && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemove(m.user_id)}
                                >
                                    <UserMinus className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Member Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">User</label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProfiles.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.first_name} {p.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={memberRole} onValueChange={setMemberRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddMember} disabled={addMember.isPending}>
                            {addMember.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Create Team Dialog ──────────────────────────────────────────

function CreateTeamDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [incidentId, setIncidentId] = useState("");
    const createTeam = useCreateTeam();
    const { data: incidents = [] } = useIncidents();

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Team name is required");
            return;
        }
        try {
            await createTeam.mutateAsync({
                name: name.trim(),
                description: description.trim() || null,
                incident_id: incidentId || null,
            });
            toast.success("Team created");
            onOpenChange(false);
            setName("");
            setDescription("");
        } catch {
            toast.error("Failed to create team");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Team Name *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Medical Response Unit"
                            data-selectable
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Team purpose and responsibilities..."
                            rows={2}
                            data-selectable
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Linked Incident</label>
                        <Select value={incidentId} onValueChange={setIncidentId}>
                            <SelectTrigger>
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {incidents.map((inc) => (
                                    <SelectItem key={inc.id} value={inc.id}>
                                        {inc.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={createTeam.isPending}>
                        {createTeam.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Team
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Teams Page ──────────────────────────────────────────────────

export default function TeamsPage() {
    const { data: teams = [], isLoading } = useTeams();
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

    const filtered = teams.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    if (activeTeamId) {
        return (
            <div className="p-6">
                <TeamDetail teamId={activeTeamId} onBack={() => setActiveTeamId(null)} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {teams.length} teams
                    </p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Team
                </Button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-border bg-muted/30">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams..."
                        className="pl-9 h-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        data-selectable
                    />
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Users className="h-12 w-12 mb-3 opacity-40" />
                            <p className="text-lg font-medium">No teams found</p>
                            <p className="text-sm mt-1">Create a team to coordinate response</p>
                            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                                <Plus className="h-4 w-4 mr-1.5" />
                                Create Team
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((team) => (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                    onClick={() => setActiveTeamId(team.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}

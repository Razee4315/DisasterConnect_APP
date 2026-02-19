import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTasks, type TaskWithProfiles } from "@/hooks/use-tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  SeverityBadge,
  StatusBadge,
} from "@/components/incidents/severity-badge";
import { IncidentForm } from "@/components/incidents/incident-form";
import { DashboardMap } from "@/components/map/map-view";
import { AssignmentDialog } from "@/components/resources/assignment-dialog";
import {
  ResourceStatusBadge,
  formatResourceType,
} from "@/components/resources/resource-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useIncident,
  useUpdateIncident,
  useDeleteIncident,
  useIncidentUpdates,
  useAddIncidentUpdate,
} from "@/hooks/use-incidents";
import { useAuthStore } from "@/stores/auth-store";
import {
  useIncidentResources,
  useReleaseResource,
} from "@/hooks/use-resources";
import type { MapIncident } from "@/hooks/use-dashboard";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  MapPin,
  Calendar,
  User,
  Users,
  Radio,
  Clock,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
  Package,
  Plus,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

function formatType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: incident, isLoading, error } = useIncident(id);
  const { data: updates, isLoading: updatesLoading } = useIncidentUpdates(id);
  const { data: assignedResources, isLoading: resourcesLoading } = useIncidentResources(id);
  const isAdmin = useAuthStore((s) => s.profile?.role === "administrator");
  const updateMutation = useUpdateIncident();
  const deleteMutation = useDeleteIncident();
  const addUpdateMutation = useAddIncidentUpdate();
  const releaseMutation = useReleaseResource();

  const [formOpen, setFormOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newUpdate, setNewUpdate] = useState("");

  // Loading / Error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Incident not found</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate("/incidents")}
        >
          Back to Incidents
        </Button>
      </div>
    );
  }

  const profile = incident.profiles as {
    first_name: string;
    last_name: string;
  } | null;

  const isActive = !["resolved", "closed"].includes(incident.status);

  // Build map marker for mini-map
  const mapIncident: MapIncident[] =
    incident.latitude && incident.longitude
      ? [
        {
          id: incident.id,
          title: incident.title,
          type: incident.type,
          severity: incident.severity,
          status: incident.status,
          latitude: incident.latitude,
          longitude: incident.longitude,
          location_name: incident.location_name,
          created_at: incident.created_at,
        },
      ]
      : [];

  const handleClose = async () => {
    try {
      await updateMutation.mutateAsync({
        id: incident.id,
        status: "resolved",
        resolution_notes: resolutionNotes || undefined,
      });
      toast.success("Incident resolved");
      setCloseDialogOpen(false);
    } catch {
      toast.error("Failed to resolve incident");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(incident.id);
      toast.success("Incident deleted");
      navigate("/incidents");
    } catch {
      toast.error("Failed to delete incident");
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    try {
      await addUpdateMutation.mutateAsync({
        incidentId: incident.id,
        message: newUpdate.trim(),
      });
      setNewUpdate("");
      toast.success("Update added");
    } catch {
      toast.error("Failed to add update");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate("/incidents")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {incident.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setFormOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setCloseDialogOpen(true)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolve
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Content: Info + Mini Map */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Info Panel */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-4 space-y-4">
            {/* Top row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="Type"
                value={formatType(incident.type)}
              />
              <InfoItem
                icon={<User className="h-3.5 w-3.5" />}
                label="Reported By"
                value={
                  profile
                    ? `${profile.first_name} ${profile.last_name}`
                    : "—"
                }
              />
              <InfoItem
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Created"
                value={format(new Date(incident.created_at), "MMM d, yyyy h:mm a")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {incident.location_name && (
                <InfoItem
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Location"
                  value={incident.location_name}
                />
              )}
              {incident.estimated_affected_people != null && (
                <InfoItem
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Est. Affected"
                  value={incident.estimated_affected_people.toLocaleString() + " people"}
                />
              )}
              {incident.affected_radius_km != null && (
                <InfoItem
                  icon={<Radio className="h-3.5 w-3.5" />}
                  label="Affected Radius"
                  value={`${incident.affected_radius_km} km`}
                />
              )}
            </div>

            {incident.latitude && incident.longitude && (
              <div className="text-xs text-muted-foreground font-mono">
                Coordinates: {incident.latitude.toFixed(6)},{" "}
                {incident.longitude.toFixed(6)}
              </div>
            )}

            {/* Description */}
            {incident.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap" data-selectable>
                  {incident.description}
                </p>
              </div>
            )}

            {/* Resolution Notes */}
            {incident.resolution_notes && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                  Resolution Notes
                </p>
                <p className="text-sm" data-selectable>
                  {incident.resolution_notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated{" "}
                {formatDistanceToNow(new Date(incident.updated_at), {
                  addSuffix: true,
                })}
              </span>
              {incident.closed_at && (
                <span>
                  Closed {format(new Date(incident.closed_at), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mini Map */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {incident.latitude && incident.longitude ? (
              <div className="h-[240px]">
                <DashboardMap
                  incidents={mapIncident}
                  resources={[]}
                  showResources={false}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[240px] bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  No location set
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Timeline, Resources, Tasks */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline" className="gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1">
            Resources
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1">
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-4 space-y-4">
              {/* Add Update */}
              <div className="flex items-start gap-2">
                <Input
                  data-selectable
                  placeholder="Add an update or note..."
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddUpdate();
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={!newUpdate.trim() || addUpdateMutation.isPending}
                  onClick={handleAddUpdate}
                >
                  {addUpdateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Enhanced Timeline */}
              {updatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !updates || updates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No updates yet. Add the first one above.
                </p>
              ) : (
                <div className="relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-[13px] top-3 bottom-3 w-px bg-border" />

                  <div className="space-y-0">
                    {updates.map((update, idx) => {
                      const uProfile = update.profiles as {
                        first_name: string;
                        last_name: string;
                      } | null;

                      // Detect update type from message content
                      const msg = update.message.toLowerCase();
                      let iconNode = <MessageSquare className="h-3 w-3" />;
                      let iconBg = "bg-muted text-muted-foreground";
                      let eventLabel = "";

                      if (msg.includes("status changed") || msg.includes("marked as") || msg.includes("resolved")) {
                        iconNode = <CheckCircle2 className="h-3 w-3" />;
                        iconBg = "bg-green-500/15 text-green-600 dark:text-green-400";
                        eventLabel = "Status Change";
                      } else if (msg.includes("resource") && (msg.includes("assigned") || msg.includes("released"))) {
                        iconNode = <Package className="h-3 w-3" />;
                        iconBg = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
                        eventLabel = "Resource";
                      } else if (msg.includes("severity") || msg.includes("escalat")) {
                        iconNode = <AlertTriangle className="h-3 w-3" />;
                        iconBg = "bg-orange-500/15 text-orange-600 dark:text-orange-400";
                        eventLabel = "Severity";
                      } else if (msg.includes("team") || msg.includes("assigned to")) {
                        iconNode = <Users className="h-3 w-3" />;
                        iconBg = "bg-purple-500/15 text-purple-600 dark:text-purple-400";
                        eventLabel = "Assignment";
                      } else if (msg.includes("sos") || msg.includes("emergency")) {
                        iconNode = <Radio className="h-3 w-3" />;
                        iconBg = "bg-red-500/15 text-red-600 dark:text-red-400";
                        eventLabel = "Emergency";
                      }

                      const isLast = idx === updates.length - 1;

                      return (
                        <div
                          key={update.id}
                          className={`flex items-start gap-3 text-sm relative ${isLast ? "" : "pb-4"}`}
                        >
                          {/* Icon dot */}
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ring-2 ring-background ${iconBg}`}
                          >
                            {iconNode}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {uProfile
                                  ? `${uProfile.first_name} ${uProfile.last_name}`
                                  : "System"}
                              </span>
                              {eventLabel && (
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                                  {eventLabel}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                                {format(new Date(update.created_at), "MMM d, h:mm a")}
                                {" · "}
                                {formatDistanceToNow(
                                  new Date(update.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                            <p className="text-sm mt-0.5 text-muted-foreground" data-selectable>
                              {update.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Assigned Resources
              </CardTitle>
              {isActive && (
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Assign Resource
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {resourcesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !assignedResources || assignedResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No resources assigned yet.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Assigned At</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedResources.map((ar) => {
                      const res = ar.resources as {
                        id: string;
                        name: string;
                        type: string;
                        status: string;
                        capacity: number | null;
                        location_name: string | null;
                      } | null;
                      const assignedBy = ar.profiles as {
                        first_name: string;
                        last_name: string;
                      } | null;

                      if (!res) return null;

                      return (
                        <TableRow key={ar.id}>
                          <TableCell
                            className="font-medium text-primary hover:underline cursor-pointer"
                            onClick={() => navigate(`/resources/${res.id}`)}
                          >
                            {res.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatResourceType(res.type as any)}
                          </TableCell>
                          <TableCell>
                            <ResourceStatusBadge status={res.status as any} />
                          </TableCell>
                          <TableCell className="text-sm">
                            {res.capacity ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {assignedBy
                              ? `${assignedBy.first_name} ${assignedBy.last_name}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(ar.assigned_at), "MMM d, h:mm a")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Release resource"
                              disabled={releaseMutation.isPending}
                              onClick={() => {
                                releaseMutation.mutate(
                                  {
                                    assignmentId: ar.id,
                                    resourceId: ar.resource_id,
                                    incidentId: ar.incident_id,
                                  },
                                  {
                                    onSuccess: () => toast.success("Resource released"),
                                    onError: () => toast.error("Failed to release"),
                                  }
                                );
                              }}
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab — linked tasks for this incident */}
        <TabsContent value="tasks">
          <IncidentTasks incidentId={incident.id} /></TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        incidentId={incident.id}
        incidentTitle={incident.title}
      />

      {/* Edit Form Dialog */}
      <IncidentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        incident={incident}
      />

      {/* Close/Resolve Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Incident</DialogTitle>
            <DialogDescription>
              Mark this incident as resolved. You can optionally add resolution
              notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Resolution Notes</Label>
            <Textarea
              data-selectable
              placeholder="Describe how the incident was resolved..."
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClose}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Resolve Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{incident.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Incident Tasks ──────────────────────────────────────────────

const TASK_PRIORITY_STYLE: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-green-500/10 text-green-500 border-green-500/20",
};

const TASK_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function IncidentTasks({ incidentId }: { incidentId: string }) {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks({ incidentId });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Linked Tasks ({tasks.length})
        </CardTitle>
        <Button size="sm" className="gap-1" onClick={() => navigate("/tasks")}>
          <Plus className="h-3.5 w-3.5" />
          Manage Tasks
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No tasks linked to this incident yet.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task: TaskWithProfiles) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate("/tasks")}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  {task.assignee && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {task.assignee.first_name} {task.assignee.last_name}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border shrink-0 ${TASK_PRIORITY_STYLE[task.priority] ?? ""}`}
                >
                  {task.priority}
                </Badge>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {TASK_STATUS_LABEL[task.status] ?? task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helper Component ────────────────────────────────────────────

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

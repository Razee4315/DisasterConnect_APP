import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  useIncident,
  useUpdateIncident,
  useDeleteIncident,
  useIncidentUpdates,
  useAddIncidentUpdate,
} from "@/hooks/use-incidents";
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
  const updateMutation = useUpdateIncident();
  const deleteMutation = useDeleteIncident();
  const addUpdateMutation = useAddIncidentUpdate();

  const [formOpen, setFormOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
            <h1 className="text-xl font-bold tracking-tight">
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
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
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

              {/* Updates List */}
              {updatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !updates || updates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No updates yet. Add the first one above.
                </p>
              ) : (
                <div className="space-y-3">
                  {updates.map((update) => {
                    const uProfile = update.profiles as {
                      first_name: string;
                      last_name: string;
                    } | null;
                    return (
                      <div
                        key={update.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {uProfile
                                ? `${uProfile.first_name} ${uProfile.last_name}`
                                : "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(update.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5" data-selectable>
                            {update.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab (placeholder for Step 10) */}
        <TabsContent value="resources">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                Resource assignments will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab (placeholder for Step 15) */}
        <TabsContent value="tasks">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                Task management will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

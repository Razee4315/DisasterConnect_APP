import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ResourceStatusBadge,
  formatResourceType,
} from "@/components/resources/resource-badges";
import { ResourceForm } from "@/components/resources/resource-form";
import { DashboardMap } from "@/components/map/map-view";
import {
  useResource,
  useUpdateResource,
  useDeleteResource,
  useResourceAssignments,
} from "@/hooks/use-resources";
import type { MapResource } from "@/hooks/use-dashboard";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  User,
  Package,
  Phone,
  Wrench,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: resource, isLoading, error } = useResource(id);
  const { data: assignments, isLoading: assignmentsLoading } =
    useResourceAssignments(id);
  const updateMutation = useUpdateResource();
  const deleteMutation = useDeleteResource();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Resource not found</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate("/resources")}
        >
          Back to Resources
        </Button>
      </div>
    );
  }

  const profile = resource.profiles as {
    first_name: string;
    last_name: string;
  } | null;

  const incident = resource.incidents as {
    id: string;
    title: string;
  } | null;

  const mapResource: MapResource[] =
    resource.latitude && resource.longitude
      ? [
          {
            id: resource.id,
            name: resource.name,
            type: resource.type,
            status: resource.status,
            latitude: resource.latitude,
            longitude: resource.longitude,
            location_name: resource.location_name,
          },
        ]
      : [];

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(resource.id);
      toast.success("Resource deleted");
      navigate("/resources");
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const handleMaintenanceToggle = async () => {
    const isOperational = resource.maintenance_status !== "under_maintenance";
    try {
      await updateMutation.mutateAsync({
        id: resource.id,
        maintenance_status: isOperational ? "under_maintenance" : "operational",
        maintenance_start: isOperational ? new Date().toISOString() : null,
        maintenance_end: isOperational ? null : new Date().toISOString(),
        status: isOperational ? "maintenance" : "available",
      });
      toast.success(
        isOperational ? "Maintenance started" : "Maintenance completed"
      );
    } catch {
      toast.error("Failed to update maintenance status");
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
            onClick={() => navigate("/resources")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {resource.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <ResourceStatusBadge status={resource.status} />
              <span className="text-sm text-muted-foreground">
                {formatResourceType(resource.type)}
              </span>
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
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleMaintenanceToggle}
            disabled={updateMutation.isPending}
          >
            <Wrench className="h-3.5 w-3.5" />
            {resource.maintenance_status === "under_maintenance"
              ? "Complete Maintenance"
              : "Start Maintenance"}
          </Button>
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

      {/* Info + Mini Map */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem
                icon={<Package className="h-3.5 w-3.5" />}
                label="Type"
                value={formatResourceType(resource.type)}
              />
              {resource.capacity != null && (
                <InfoItem
                  icon={<Package className="h-3.5 w-3.5" />}
                  label="Capacity"
                  value={resource.capacity.toString()}
                />
              )}
              <InfoItem
                icon={<User className="h-3.5 w-3.5" />}
                label="Added By"
                value={
                  profile
                    ? `${profile.first_name} ${profile.last_name}`
                    : "—"
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {resource.location_name && (
                <InfoItem
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Location"
                  value={resource.location_name}
                />
              )}
              {resource.contact_info && (
                <InfoItem
                  icon={<Phone className="h-3.5 w-3.5" />}
                  label="Contact"
                  value={resource.contact_info}
                />
              )}
              <InfoItem
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Created"
                value={format(new Date(resource.created_at), "MMM d, yyyy")}
              />
            </div>

            {/* Current Incident */}
            {incident && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                  Currently Assigned To
                </p>
                <span
                  className="text-sm text-primary hover:underline cursor-pointer"
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                >
                  {incident.title}
                </span>
              </div>
            )}

            {/* Description */}
            {resource.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap" data-selectable>
                  {resource.description}
                </p>
              </div>
            )}

            {/* Maintenance Info */}
            {resource.maintenance_status === "under_maintenance" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  Under Maintenance
                </p>
                {resource.maintenance_notes && (
                  <p className="text-sm" data-selectable>
                    {resource.maintenance_notes}
                  </p>
                )}
                {resource.maintenance_start && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    Started:{" "}
                    {format(new Date(resource.maintenance_start), "MMM d, yyyy h:mm a")}
                  </p>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated{" "}
                {formatDistanceToNow(new Date(resource.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mini Map */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {resource.latitude && resource.longitude ? (
              <div className="h-[240px]">
                <DashboardMap
                  incidents={[]}
                  resources={mapResource}
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

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assignmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !assignments || assignments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                No assignment history yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Released At</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const aIncident = a.incidents as {
                    id: string;
                    title: string;
                  } | null;
                  const aProfile = a.profiles as {
                    first_name: string;
                    last_name: string;
                  } | null;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        {aIncident ? (
                          <span
                            className="text-primary hover:underline cursor-pointer"
                            onClick={() =>
                              navigate(`/incidents/${aIncident.id}`)
                            }
                          >
                            {aIncident.title}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {aProfile
                          ? `${aProfile.first_name} ${aProfile.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(a.assigned_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {a.released_at
                          ? format(
                              new Date(a.released_at),
                              "MMM d, yyyy h:mm a"
                            )
                          : "Active"}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {a.notes || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <ResourceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={resource}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{resource.name}"? This action
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

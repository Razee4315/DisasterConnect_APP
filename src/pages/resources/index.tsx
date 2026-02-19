import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useResources,
  useDeleteResource,
  type ResourceFilters,
} from "@/hooks/use-resources";
import { useAuthStore } from "@/stores/auth-store";
import type { Resource } from "@/types/database";
import type { ResourceType, ResourceStatus } from "@/types/enums";
import {
  Plus,
  Search,
  X,
  Package,
  Pencil,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/data-table-pagination";
import { exportToCSV } from "@/lib/csv-export";

// ─── Constants ───────────────────────────────────────────────────

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "medical", label: "Medical" },
  { value: "food", label: "Food" },
  { value: "water", label: "Water" },
  { value: "shelter", label: "Shelter" },
  { value: "transportation", label: "Transportation" },
  { value: "vehicle", label: "Vehicle" },
  { value: "medical_equipment", label: "Medical Equipment" },
  { value: "personnel", label: "Personnel" },
  { value: "emergency_supplies", label: "Emergency Supplies" },
  { value: "communication_equipment", label: "Comm. Equipment" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: { value: ResourceStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "reserved", label: "Reserved" },
  { value: "unavailable", label: "Unavailable" },
  { value: "maintenance", label: "Maintenance" },
];

// ─── Page ────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "">("");
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "">("");
  const [maintenanceFilter, setMaintenanceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const isAdmin = useAuthStore((s) => s.profile?.role === "administrator");
  const deleteMutation = useDeleteResource();

  const filters: ResourceFilters = {
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    maintenance: maintenanceFilter || undefined,
  };

  const { data: allResources, isLoading } = useResources(filters);

  const paginatedResources = useMemo(() => {
    if (!allResources) return [];
    const start = (page - 1) * pageSize;
    return allResources.slice(start, start + pageSize);
  }, [allResources, page, pageSize]);
  const hasFilters = search || typeFilter || statusFilter || maintenanceFilter;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setMaintenanceFilter("");
    setPage(1);
  };

  const handleEdit = (e: React.MouseEvent, resource: Resource) => {
    e.stopPropagation();
    setEditingResource(resource);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Resource deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-sm text-muted-foreground">
            Manage personnel, equipment, and supplies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!allResources?.length}
            onClick={() =>
              exportToCSV(
                allResources ?? [],
                [
                  { key: "name", label: "Name" },
                  { key: "type", label: "Type" },
                  { key: "status", label: "Status" },
                  { key: "capacity", label: "Capacity" },
                  { key: "location_name", label: "Location" },
                  { key: "maintenance_status", label: "Maintenance" },
                  { key: "created_at", label: "Created" },
                ],
                "resources"
              )
            }
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingResource(null);
              setFormOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-selectable
                placeholder="Search resources..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={typeFilter || "__all__"}
              onValueChange={(v) => {
                setTypeFilter(v === "__all__" ? "" : v as ResourceType);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter || "__all__"}
              onValueChange={(v) => {
                setStatusFilter(v === "__all__" ? "" : v as ResourceStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={maintenanceFilter || "__all__"}
              onValueChange={(v) => {
                setMaintenanceFilter(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Maintenance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No resources found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasFilters
                  ? "Try adjusting your filters."
                  : "Add the first resource to get started."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Incident</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResources.map((res) => {
                  const incident = res.incidents as { id: string; title: string } | null;
                  return (
                    <TableRow
                      key={res.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/resources/${res.id}`)}
                    >
                      <TableCell className="font-medium max-w-[240px] truncate">
                        {res.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatResourceType(res.type)}
                      </TableCell>
                      <TableCell>
                        <ResourceStatusBadge status={res.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {res.capacity ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {res.location_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {incident ? (
                          <span
                            className="text-primary hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/incidents/${incident.id}`);
                            }}
                          >
                            {incident.title}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">
                        {res.maintenance_status?.replace("_", " ") ?? "operational"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => handleEdit(e, res)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(res);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}

          {(allResources?.length ?? 0) > 0 && (
            <div className="border-t px-4 py-2">
              <DataTablePagination
                page={page}
                pageSize={pageSize}
                totalCount={allResources?.length ?? 0}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Form Dialog */}
      <ResourceForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingResource(null);
        }}
        resource={editingResource}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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

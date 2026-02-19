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
  SeverityBadge,
  StatusBadge,
} from "@/components/incidents/severity-badge";
import { IncidentForm } from "@/components/incidents/incident-form";
import {
  useIncidents,
  useDeleteIncident,
  type IncidentFilters,
} from "@/hooks/use-incidents";
import type { Incident } from "@/types/database";
import type { IncidentType, SeverityLevel, IncidentStatus } from "@/types/enums";
import {
  Plus,
  Search,
  X,
  AlertTriangle,
  Pencil,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DataTablePagination } from "@/components/data-table-pagination";
import { exportToCSV } from "@/lib/csv-export";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "natural_disaster", label: "Natural Disaster" },
  { value: "medical_emergency", label: "Medical Emergency" },
  { value: "infrastructure_failure", label: "Infrastructure Failure" },
  { value: "industrial_accident", label: "Industrial Accident" },
  { value: "security_incident", label: "Security Incident" },
  { value: "fire", label: "Fire" },
  { value: "flood", label: "Flood" },
  { value: "earthquake", label: "Earthquake" },
  { value: "other", label: "Other" },
];

const SEVERITY_LEVELS: { value: SeverityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: "reported", label: "Reported" },
  { value: "verified", label: "Verified" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function formatType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Page ────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "">("");
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "">("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null);

  const deleteMutation = useDeleteIncident();

  const filters: IncidentFilters = {
    search: search || undefined,
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
    status: statusFilter || undefined,
  };

  const { data: allIncidents, isLoading } = useIncidents(filters);

  // Client-side pagination
  const paginatedIncidents = useMemo(() => {
    if (!allIncidents) return [];
    const start = (page - 1) * pageSize;
    return allIncidents.slice(start, start + pageSize);
  }, [allIncidents, page, pageSize]);

  const hasFilters = search || typeFilter || severityFilter || statusFilter;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setSeverityFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const handleEdit = (e: React.MouseEvent, incident: Incident) => {
    e.stopPropagation();
    setEditingIncident(incident);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Incident deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete incident");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage disaster incidents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!allIncidents?.length}
            onClick={() =>
              exportToCSV(
                allIncidents ?? [],
                [
                  { key: "title", label: "Title" },
                  { key: "type", label: "Type" },
                  { key: "severity", label: "Severity" },
                  { key: "status", label: "Status" },
                  { key: "location_name", label: "Location" },
                  { key: "created_at", label: "Created" },
                ],
                "incidents"
              )
            }
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingIncident(null);
              setFormOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Report Incident
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-selectable
                placeholder="Search incidents..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Type filter */}
            <Select
              value={typeFilter || "__all__"}
              onValueChange={(v) => {
                setTypeFilter(v === "__all__" ? "" : v as IncidentType);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {INCIDENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Severity filter */}
            <Select
              value={severityFilter || "__all__"}
              onValueChange={(v) => {
                setSeverityFilter(v === "__all__" ? "" : v as SeverityLevel);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Severity</SelectItem>
                {SEVERITY_LEVELS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={statusFilter || "__all__"}
              onValueChange={(v) => {
                setStatusFilter(v === "__all__" ? "" : v as IncidentStatus);
                setPage(0);
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

            {/* Clear filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={clearFilters}
              >
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
          ) : paginatedIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No incidents found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasFilters
                  ? "Try adjusting your filters."
                  : "Report the first incident to get started."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIncidents.map((inc) => {
                  const profile = inc.profiles as { first_name: string; last_name: string } | null;
                  return (
                    <TableRow
                      key={inc.id}
                      className={`cursor-pointer ${inc.severity === "critical" ? "bg-red-500/5 hover:bg-red-500/10" : inc.severity === "high" ? "bg-orange-500/5 hover:bg-orange-500/10" : ""}`}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                    >
                      <TableCell className="font-medium max-w-[280px] truncate">
                        <span className="flex items-center gap-2">
                          {inc.severity === "critical" && inc.status !== "resolved" && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                          )}
                          {inc.title}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatType(inc.type)}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={inc.severity} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inc.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                        {inc.location_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {profile
                          ? `${profile.first_name} ${profile.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(inc.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => handleEdit(e, inc)}
                            aria-label="Edit incident"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(inc);
                            }}
                            aria-label="Delete incident"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination */}
          {(allIncidents?.length ?? 0) > 0 && (
            <div className="border-t px-4 py-2">
              <DataTablePagination
                page={page}
                pageSize={pageSize}
                totalCount={allIncidents?.length ?? 0}
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

      {/* Incident Form Dialog */}
      <IncidentForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingIncident(null);
        }}
        incident={editingIncident}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This
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

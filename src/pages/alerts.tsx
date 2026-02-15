import { useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { SeverityBadge } from "@/components/incidents/severity-badge";
import { AlertTypeBadge } from "@/components/alerts/alert-badges";
import { AlertForm } from "@/components/alerts/alert-form";
import {
  useAlerts,
  useDeleteAlert,
  useToggleAlert,
  type AlertRow,
  type AlertFilters,
} from "@/hooks/use-alerts";
import type { AlertType, SeverityLevel } from "@/types/enums";
import {
  Plus,
  Search,
  X,
  Bell,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────

const ALERT_TYPES: { value: AlertType; label: string }[] = [
  { value: "emergency", label: "Emergency" },
  { value: "warning", label: "Warning" },
  { value: "advisory", label: "Advisory" },
  { value: "information", label: "Information" },
];

const SEVERITY_LEVELS: { value: SeverityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const ACTIVE_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

const PAGE_SIZE = 25;

// ─── Page ────────────────────────────────────────────────────────

export default function AlertsPage() {
  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AlertType | "">("");
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "">("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination
  const [page, setPage] = useState(0);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AlertRow | null>(null);

  const deleteMutation = useDeleteAlert();
  const toggleMutation = useToggleAlert();

  const filters: AlertFilters = {
    search: search || undefined,
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
    active: activeFilter,
  };

  const { data: allAlerts, isLoading } = useAlerts(filters);

  // Active critical/emergency alerts for banner
  const criticalAlerts = useMemo(
    () =>
      (allAlerts ?? []).filter(
        (a) =>
          a.is_active &&
          (a.severity === "critical" || a.type === "emergency")
      ),
    [allAlerts]
  );

  // Client-side pagination
  const paginatedAlerts = useMemo(() => {
    if (!allAlerts) return [];
    const start = page * PAGE_SIZE;
    return allAlerts.slice(start, start + PAGE_SIZE);
  }, [allAlerts, page]);

  const totalPages = Math.ceil((allAlerts?.length ?? 0) / PAGE_SIZE);

  const hasFilters = search || typeFilter || severityFilter || activeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setSeverityFilter("");
    setActiveFilter("all");
    setPage(0);
  };

  const handleEdit = (e: React.MouseEvent, alert: AlertRow) => {
    e.stopPropagation();
    setEditingAlert(alert);
    setFormOpen(true);
  };

  const handleToggle = async (alert: AlertRow) => {
    try {
      await toggleMutation.mutateAsync({
        id: alert.id,
        is_active: !alert.is_active,
      });
      toast.success(
        alert.is_active ? "Alert deactivated" : "Alert activated"
      );
    } catch {
      toast.error("Failed to toggle alert status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Alert deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete alert");
    }
  };

  return (
    <div className="space-y-4">
      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? "s" : ""} Active
                </p>
                {criticalAlerts.slice(0, 3).map((a) => (
                  <p key={a.id} className="text-xs text-red-600 dark:text-red-400/80">
                    <span className="font-medium">{a.title}</span>
                    {a.affected_area && (
                      <span className="ml-1 text-red-500 dark:text-red-500/70">
                        — {a.affected_area}
                      </span>
                    )}
                  </p>
                ))}
                {criticalAlerts.length > 3 && (
                  <p className="text-xs text-red-500">
                    +{criticalAlerts.length - 3} more
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Manage emergency alerts and notifications for affected areas.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAlert(null);
            setFormOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
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
                placeholder="Search alerts..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Type filter */}
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v as AlertType | "");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {ALERT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Severity filter */}
            <Select
              value={severityFilter}
              onValueChange={(v) => {
                setSeverityFilter(v as SeverityLevel | "");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severity</SelectItem>
                {SEVERITY_LEVELS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active filter */}
            <Select
              value={activeFilter}
              onValueChange={(v) => {
                setActiveFilter(v as "all" | "active" | "inactive");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
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
          ) : paginatedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No alerts found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasFilters
                  ? "Try adjusting your filters."
                  : "Create the first alert to get started."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Active</TableHead>
                  <TableHead className="w-[250px]">Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAlerts.map((alert) => {
                  const profile = alert.profiles;
                  const isExpired =
                    alert.expires_at && new Date(alert.expires_at) < new Date();

                  return (
                    <TableRow
                      key={alert.id}
                      className={
                        !alert.is_active ? "opacity-60" : undefined
                      }
                    >
                      <TableCell>
                        <Switch
                          checked={alert.is_active}
                          onCheckedChange={() => handleToggle(alert)}
                          disabled={toggleMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px]">
                        <div className="truncate">{alert.title}</div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {alert.message.length > 80
                            ? alert.message.slice(0, 80) + "..."
                            : alert.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        <AlertTypeBadge type={alert.type} />
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[140px]">
                        {alert.affected_area ? (
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{alert.affected_area}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {alert.expires_at ? (
                          <span className={isExpired ? "text-destructive" : ""}>
                            {isExpired
                              ? "Expired"
                              : format(new Date(alert.expires_at), "MMM d, HH:mm")}
                          </span>
                        ) : (
                          "Never"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {profile
                          ? `${profile.first_name} ${profile.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => handleEdit(e, alert)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(alert);
                            }}
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-2">
              <p className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, allAlerts?.length ?? 0)} of{" "}
                {allAlerts?.length ?? 0}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs px-2">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Form Dialog */}
      <AlertForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingAlert(null);
        }}
        alert={editingAlert}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Alert</DialogTitle>
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

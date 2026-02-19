import { useState } from "react";
import { format } from "date-fns";
import { useAuditLog, useAuditActions, useAuditEntityTypes } from "@/hooks/use-audit-log";
import { useProfiles } from "@/hooks/use-tasks";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Search,
    ScrollText,
    Loader2,
    X,
} from "lucide-react";
import { DataTablePagination } from "@/components/data-table-pagination";

const DEFAULT_PAGE_SIZE = 25;

// ─── Action badge colors ────────────────────────────────────────

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
    if (action.startsWith("create") || action.startsWith("insert")) return "default";
    if (action.startsWith("update") || action.startsWith("modify")) return "secondary";
    if (action.startsWith("delete") || action.startsWith("remove")) return "destructive";
    return "outline";
}

// ─── Entity type label ─────────────────────────────────────────

function entityLabel(entityType: string | null): string {
    if (!entityType) return "-";
    return entityType.replace(/_/g, " ");
}

// ─── Component ──────────────────────────────────────────────────

export default function AuditLogPage() {
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [entityType, setEntityType] = useState("");
    const [userId, setUserId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const filters = {
        search: search || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        userId: userId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    };

    const { data: result, isLoading } = useAuditLog(filters, page, pageSize);
    const { data: actions } = useAuditActions();
    const { data: entityTypes } = useAuditEntityTypes();
    const { data: profiles } = useProfiles();

    const entries = result?.data ?? [];
    const totalCount = result?.count ?? 0;

    const hasFilters = search || action || entityType || userId || dateFrom || dateTo;

    const clearFilters = () => {
        setSearch("");
        setAction("");
        setEntityType("");
        setUserId("");
        setDateFrom("");
        setDateTo("");
        setPage(0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <ScrollText className="h-6 w-6" />
                    Audit Log
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Track all system actions and changes across the platform.
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Filters</CardTitle>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs">
                                <X className="h-3 w-3" />
                                Clear
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search actions..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                className="pl-9 h-9"
                                data-selectable
                            />
                        </div>

                        {/* Action */}
                        <Select value={action} onValueChange={(v) => { setAction(v === "all" ? "" : v); setPage(0); }}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All actions</SelectItem>
                                {(actions ?? []).map((a) => (
                                    <SelectItem key={a} value={a}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Entity type */}
                        <Select value={entityType} onValueChange={(v) => { setEntityType(v === "all" ? "" : v); setPage(0); }}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All entities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All entities</SelectItem>
                                {(entityTypes ?? []).map((et) => (
                                    <SelectItem key={et} value={et}>{entityLabel(et)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* User */}
                        <Select value={userId} onValueChange={(v) => { setUserId(v === "all" ? "" : v); setPage(0); }}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All users" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All users</SelectItem>
                                {(profiles ?? []).map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date from */}
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                            className="h-9"
                            placeholder="From"
                            data-selectable
                        />

                        {/* Date to */}
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                            className="h-9"
                            placeholder="To"
                            data-selectable
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <ScrollText className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">No audit log entries found.</p>
                            {hasFilters && (
                                <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[160px]">Timestamp</TableHead>
                                    <TableHead className="w-[160px]">User</TableHead>
                                    <TableHead className="w-[140px]">Action</TableHead>
                                    <TableHead className="w-[120px]">Entity Type</TableHead>
                                    <TableHead className="w-[100px]">Entity ID</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="text-xs whitespace-nowrap">
                                            {format(new Date(entry.created_at), "MMM d, yyyy HH:mm:ss")}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {entry.profiles
                                                ? `${entry.profiles.first_name} ${entry.profiles.last_name}`
                                                : <span className="text-muted-foreground italic">system</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={actionVariant(entry.action)} className="capitalize text-xs">
                                                {entry.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm capitalize">
                                            {entityLabel(entry.entity_type)}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {entry.entity_id?.slice(0, 8) ?? "-"}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                                            {entry.details
                                                ? JSON.stringify(entry.details).slice(0, 120)
                                                : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>

                {/* Pagination */}
                {totalCount > 0 && (
                    <div className="border-t px-4 py-2">
                        <DataTablePagination
                            page={page + 1}
                            pageSize={pageSize}
                            totalCount={totalCount}
                            onPageChange={(p) => setPage(p - 1)}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(0);
                            }}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}

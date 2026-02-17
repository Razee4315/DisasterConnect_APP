import { useState, useMemo } from "react";
import {
    useEvacuationRoutes,
    useCreateEvacRoute,
    useUpdateEvacRoute,
    useDeleteEvacRoute,
    type EvacRouteFormData,
    type EvacRouteFilters,
} from "@/hooks/use-evacuation";
import { useIncidents } from "@/hooks/use-incidents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Route,
    Plus,
    Search,
    Loader2,
    Pencil,
    Trash2,
    MapPin,
    Clock,
    Users,
    Navigation,
    Eye,
    EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import type { EvacuationRoute } from "@/types/database";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

/* ── Lazy Leaflet (only loaded when map is shown) ──────────────── */
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// ─── Page ───────────────────────────────────────────────────────

export default function EvacuationPage() {
    const [filters, setFilters] = useState<EvacRouteFilters>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<(EvacuationRoute & { profiles: { first_name: string; last_name: string } | null }) | null>(null);
    const [showMap, setShowMap] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const { data: routes = [], isLoading } = useEvacuationRoutes(filters);
    const { data: incidents = [] } = useIncidents();
    const createMut = useCreateEvacRoute();
    const updateMut = useUpdateEvacRoute();
    const deleteMut = useDeleteEvacRoute();

    const openCreate = () => { setEditing(null); setDialogOpen(true); };
    const openEdit = (r: typeof routes[0]) => { setEditing(r); setDialogOpen(true); };

    const handleSubmit = (form: EvacRouteFormData) => {
        if (editing) {
            updateMut.mutate({ id: editing.id, ...form }, { onSuccess: () => setDialogOpen(false) });
        } else {
            createMut.mutate(form, { onSuccess: () => setDialogOpen(false) });
        }
    };

    // Map center: average of all waypoints or default
    const center = useMemo(() => {
        const pts = routes.flatMap((r) => r.waypoints ?? []);
        if (pts.length === 0) return [33.6844, 73.0479] as [number, number]; // Default: Islamabad
        const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
        const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
        return [lat, lng] as [number, number];
    }, [routes]);

    const ROUTE_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Evacuation Routes</h1>
                    <p className="text-sm text-muted-foreground">Plan and visualize evacuation paths</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowMap((v) => !v)}>
                        {showMap ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showMap ? "Hide Map" : "Show Map"}
                    </Button>
                    <Button className="gap-1.5" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        New Route
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search routes..."
                        value={filters.search ?? ""}
                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                        className="pl-8"
                        data-selectable
                    />
                </div>
                <Select value={filters.incidentId || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, incidentId: v === "__all__" ? "" : v }))}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="All Incidents" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Incidents</SelectItem>
                        {incidents.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={filters.activeOnly ?? false}
                        onCheckedChange={(v) => setFilters((f) => ({ ...f, activeOnly: v }))}
                    />
                    <span className="text-xs text-muted-foreground">Active only</span>
                </div>
            </div>

            {/* Map */}
            {showMap && (
                <Card className="overflow-hidden">
                    <CardContent className="p-0 h-[350px]">
                        <MapContainer center={center} zoom={12} className="h-full w-full" style={{ zIndex: 0 }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {routes.map((route, idx) => {
                                const positions = (route.waypoints ?? []).map((w) => [w.lat, w.lng] as [number, number]);
                                if (positions.length < 2) return null;
                                const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
                                return (
                                    <Polyline
                                        key={route.id}
                                        positions={positions}
                                        pathOptions={{
                                            color,
                                            weight: 4,
                                            opacity: route.is_active ? 0.9 : 0.3,
                                            dashArray: route.is_active ? undefined : "8 6",
                                        }}
                                    >
                                        <Popup>
                                            <strong>{route.name}</strong>
                                            {route.distance_km && <p>{route.distance_km} km</p>}
                                        </Popup>
                                    </Polyline>
                                );
                            })}
                            {/* Start/end markers for each route */}
                            {routes.map((route) => {
                                const wps = route.waypoints ?? [];
                                if (wps.length === 0) return null;
                                return (
                                    <Marker key={`start-${route.id}`} position={[wps[0].lat, wps[0].lng]}>
                                        <Popup>{route.name} — Start</Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    </CardContent>
                </Card>
            )}

            {/* Route List */}
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : routes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Route className="h-10 w-10 mb-2" />
                    <p className="text-sm">No evacuation routes found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {routes.map((r, idx) => (
                        <Card key={r.id} className="group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: ROUTE_COLORS[idx % ROUTE_COLORS.length] }}
                                        />
                                        <CardTitle className="text-sm font-medium">{r.name}</CardTitle>
                                    </div>
                                    <Badge variant={r.is_active ? "default" : "secondary"} className="text-[10px] px-1.5">
                                        {r.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {r.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{r.description}</p>}
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                                    {r.distance_km != null && (
                                        <span className="flex items-center gap-1">
                                            <Navigation className="h-3 w-3" /> {r.distance_km} km
                                        </span>
                                    )}
                                    {r.estimated_time_minutes != null && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {r.estimated_time_minutes} min
                                        </span>
                                    )}
                                    {r.capacity != null && (
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" /> {r.capacity} ppl
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {(r.waypoints ?? []).length} points
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">
                                        {format(new Date(r.created_at), "MMM d, yyyy")}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: r.id, name: r.name })}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
                    }
                }}
                title={`Delete route "${deleteTarget?.name}"?`}
                description="This action cannot be undone. This will permanently delete this evacuation route and all its waypoints."
                isPending={deleteMut.isPending}
            />

            {/* Create / Edit Dialog */}
            <EvacRouteDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                isPending={createMut.isPending || updateMut.isPending}
                editing={editing}
                incidents={incidents}
            />
        </div>
    );
}

// ─── Route Dialog ───────────────────────────────────────────────

function ClickToAddWaypoint({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onAdd(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function EvacRouteDialog({
    open,
    onOpenChange,
    onSubmit,
    isPending,
    editing,
    incidents,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSubmit: (form: EvacRouteFormData) => void;
    isPending: boolean;
    editing: EvacuationRoute | null;
    incidents: { id: string; title: string }[];
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [waypoints, setWaypoints] = useState<Array<{ lat: number; lng: number }>>([]);
    const [distanceKm, setDistanceKm] = useState("");
    const [estMinutes, setEstMinutes] = useState("");
    const [capacity, setCapacity] = useState("");
    const [incidentId, setIncidentId] = useState("");
    const [isActive, setIsActive] = useState(true);

    const handleOpenChange = (v: boolean) => {
        if (v && editing) {
            setName(editing.name);
            setDescription(editing.description ?? "");
            setWaypoints(editing.waypoints ?? []);
            setDistanceKm(editing.distance_km?.toString() ?? "");
            setEstMinutes(editing.estimated_time_minutes?.toString() ?? "");
            setCapacity(editing.capacity?.toString() ?? "");
            setIncidentId(editing.incident_id ?? "");
            setIsActive(editing.is_active);
        } else if (v) {
            setName(""); setDescription(""); setWaypoints([]); setDistanceKm("");
            setEstMinutes(""); setCapacity(""); setIncidentId(""); setIsActive(true);
        }
        onOpenChange(v);
    };

    const addWaypoint = (lat: number, lng: number) => {
        setWaypoints((w) => [...w, { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 }]);
    };

    const removeWaypoint = (idx: number) => {
        setWaypoints((w) => w.filter((_, i) => i !== idx));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            description: description || undefined,
            waypoints,
            distance_km: Number(distanceKm) || undefined,
            estimated_time_minutes: Number(estMinutes) || undefined,
            capacity: Number(capacity) || undefined,
            incident_id: incidentId || undefined,
            is_active: isActive,
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Route" : "New Evacuation Route"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <Label className="text-xs">Route Name *</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} required data-selectable />
                    </div>
                    <div>
                        <Label className="text-xs">Description</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} data-selectable />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-xs">Distance (km)</Label>
                            <Input type="number" min="0" step="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} data-selectable />
                        </div>
                        <div>
                            <Label className="text-xs">Est. Time (min)</Label>
                            <Input type="number" min="0" value={estMinutes} onChange={(e) => setEstMinutes(e.target.value)} data-selectable />
                        </div>
                        <div>
                            <Label className="text-xs">Capacity</Label>
                            <Input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} data-selectable />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Linked Incident</Label>
                            <Select value={incidentId || "__none__"} onValueChange={(v) => setIncidentId(v === "__none__" ? "" : v)}>
                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {incidents.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2 pb-1">
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                            <span className="text-xs text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
                        </div>
                    </div>

                    {/* Waypoints Map */}
                    <div>
                        <Label className="text-xs mb-1 block">Waypoints — click map to add ({waypoints.length} points)</Label>
                        <div className="h-[200px] rounded-md overflow-hidden border">
                            <MapContainer
                                center={waypoints.length > 0 ? [waypoints[0].lat, waypoints[0].lng] : [33.6844, 73.0479]}
                                zoom={12}
                                className="h-full w-full"
                                style={{ zIndex: 0 }}
                            >
                                <TileLayer
                                    attribution='&copy; OSM'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <ClickToAddWaypoint onAdd={addWaypoint} />
                                {waypoints.length >= 2 && (
                                    <Polyline
                                        positions={waypoints.map((w) => [w.lat, w.lng] as [number, number])}
                                        pathOptions={{ color: "#3b82f6", weight: 3 }}
                                    />
                                )}
                                {waypoints.map((w, i) => (
                                    <Marker key={i} position={[w.lat, w.lng]}>
                                        <Popup>Point {i + 1}</Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                        {waypoints.length > 0 && (
                            <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                {waypoints.map((w, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs p-1 rounded bg-muted/50">
                                        <span>#{i + 1} — {w.lat}, {w.lng}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeWaypoint(i)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending || !name} className="gap-1.5">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

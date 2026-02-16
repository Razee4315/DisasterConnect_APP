import { useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MarkerClusterGroup } from "leaflet.markercluster";
import "leaflet.heat";
import { useNavigate } from "react-router-dom";
import { useMapStore } from "@/stores/map-store";
import {
  useActiveIncidents,
  useActiveResources,
  type MapIncident,
  type MapResource,
} from "@/hooks/use-dashboard";
import type { SeverityLevel } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Package,
  Flame,
  CircleDot,
  Layers,
  Loader2,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────

/** Escape HTML entities to prevent injection in Leaflet popups. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Constants ───────────────────────────────────────────────────

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const SEVERITY_RADIUS: Record<SeverityLevel, number> = {
  critical: 10,
  high: 8,
  medium: 7,
  low: 6,
};

const RESOURCE_COLOR = "#3b82f6";

// ─── Map State Sync ──────────────────────────────────────────────

function MapStateSync() {
  const map = useMap();
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);

  useEffect(() => {
    const onMoveEnd = () => {
      const c = map.getCenter();
      setCenter([c.lat, c.lng]);
      setZoom(map.getZoom());
    };
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map, setCenter, setZoom]);

  return null;
}

// ─── Auto-fit bounds ─────────────────────────────────────────────

function FitBounds({
  incidents,
  resources,
}: {
  incidents: MapIncident[];
  resources: MapResource[];
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current) return;
    const points: [number, number][] = [];
    for (const inc of incidents) {
      if (inc.latitude != null && inc.longitude != null)
        points.push([inc.latitude, inc.longitude]);
    }
    for (const res of resources) {
      if (res.latitude != null && res.longitude != null)
        points.push([res.latitude, res.longitude]);
    }
    if (points.length > 0) {
      hasFitted.current = true;
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, incidents, resources]);

  return null;
}

// ─── Heatmap Layer ───────────────────────────────────────────────

function HeatmapLayer({ incidents }: { incidents: MapIncident[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number, number][] = incidents
      .filter((i) => i.latitude != null && i.longitude != null)
      .map((i) => {
        const intensity =
          i.severity === "critical"
            ? 1.0
            : i.severity === "high"
            ? 0.7
            : i.severity === "medium"
            ? 0.4
            : 0.2;
        return [i.latitude!, i.longitude!, intensity];
      });

    const heat = (L as any).heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 14,
      gradient: { 0.2: "#22c55e", 0.4: "#eab308", 0.7: "#f97316", 1.0: "#dc2626" },
    });

    map.addLayer(heat);
    return () => {
      map.removeLayer(heat);
    };
  }, [map, incidents]);

  return null;
}

// ─── Clustering Layer ────────────────────────────────────────────

function ClusteredIncidentMarkers({
  incidents,
  navigate,
}: {
  incidents: MapIncident[];
  navigate: (path: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const cluster = new MarkerClusterGroup({
      maxClusterRadius: 50,
      chunkedLoading: true,
      showCoverageOnHover: false,
    });

    for (const inc of incidents) {
      if (inc.latitude == null || inc.longitude == null) continue;
      const color = SEVERITY_COLORS[inc.severity] ?? "#eab308";
      const marker = L.circleMarker([inc.latitude, inc.longitude], {
        radius: SEVERITY_RADIUS[inc.severity] ?? 7,
        color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 2,
      });

      marker.bindPopup(
        `<div style="min-width:180px">
          <p style="font-weight:600;margin:0 0 4px">${escapeHtml(inc.title)}</p>
          <p style="font-size:12px;margin:0"><span style="color:#888">Severity:</span> <span style="color:${color};font-weight:500">${escapeHtml(inc.severity)}</span></p>
          <p style="font-size:12px;margin:0"><span style="color:#888">Status:</span> ${escapeHtml(inc.status.replace("_", " "))}</p>
          ${inc.location_name ? `<p style="font-size:11px;margin:4px 0 0;color:#888">${escapeHtml(inc.location_name)}</p>` : ""}
          <p style="margin:6px 0 0"><a href="#" class="incident-link" data-id="${escapeHtml(inc.id)}" style="font-size:12px;color:#0f766e">View Details &rarr;</a></p>
        </div>`
      );

      cluster.addLayer(marker);
    }

    map.addLayer(cluster);

    // Handle popup link clicks
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("incident-link")) {
        e.preventDefault();
        const id = target.getAttribute("data-id");
        if (id) navigate(`/incidents/${id}`);
      }
    };
    map.getContainer().addEventListener("click", handleClick);

    return () => {
      map.removeLayer(cluster);
      map.getContainer().removeEventListener("click", handleClick);
    };
  }, [map, incidents, navigate]);

  return null;
}

// ─── Resource Markers (simple, no clustering) ────────────────────

function ResourceMarkers({
  resources,
  navigate,
}: {
  resources: MapResource[];
  navigate: (path: string) => void;
}) {
  return (
    <>
      {resources
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((res) => (
          <CircleMarker
            key={res.id}
            center={[res.latitude!, res.longitude!]}
            radius={6}
            pathOptions={{
              color: RESOURCE_COLOR,
              fillColor: RESOURCE_COLOR,
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-semibold mb-1">{res.name}</p>
                <p className="text-xs capitalize">
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {res.type.replace(/_/g, " ")}
                </p>
                <p className="text-xs capitalize">
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {res.status}
                </p>
                {res.location_name && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    {res.location_name}
                  </p>
                )}
                <p className="mt-1.5">
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => navigate(`/resources/${res.id}`)}
                  >
                    View Details &rarr;
                  </button>
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </>
  );
}

// ─── Alert Radius Circles ────────────────────────────────────────

function AlertRadiusCircles({ incidents }: { incidents: MapIncident[] }) {
  // We need the full incident data for radius — re-fetch or use what we have
  // For now, show a generic radius for incidents that have coordinates
  return (
    <>
      {incidents
        .filter((i) => i.latitude != null && i.longitude != null)
        .map((inc) => (
          <Circle
            key={`radius-${inc.id}`}
            center={[inc.latitude!, inc.longitude!]}
            radius={5000} // 5km default radius
            pathOptions={{
              color: SEVERITY_COLORS[inc.severity] ?? "#eab308",
              fillColor: SEVERITY_COLORS[inc.severity] ?? "#eab308",
              fillOpacity: 0.08,
              weight: 1,
              dashArray: "6 4",
            }}
          />
        ))}
    </>
  );
}

// ─── Main Map Page ───────────────────────────────────────────────

export default function MapPage() {
  const navigate = useNavigate();
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const layers = useMapStore((s) => s.layers);
  const toggleLayer = useMapStore((s) => s.toggleLayer);

  const { data: incidents, isLoading: incLoading } = useActiveIncidents();
  const { data: resources, isLoading: resLoading } = useActiveResources();

  const geoIncidents = useMemo(
    () =>
      (incidents ?? []).filter(
        (i) => i.latitude != null && i.longitude != null
      ),
    [incidents]
  );

  const isLoading = incLoading || resLoading;

  return (
    <div className="map-page-container relative h-full -m-4 sm:-m-6">
      {/* Full-screen map */}
      {isLoading ? (
        <div className="flex items-center justify-center h-full bg-muted/30">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Loading map data...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapStateSync />
          <FitBounds
            incidents={incidents ?? []}
            resources={resources ?? []}
          />

          {/* Incident markers (clustered) */}
          {layers.incidents && (
            <ClusteredIncidentMarkers
              incidents={geoIncidents}
              navigate={navigate}
            />
          )}

          {/* Resource markers */}
          {layers.resources && (
            <ResourceMarkers
              resources={resources ?? []}
              navigate={navigate}
            />
          )}

          {/* Heatmap overlay */}
          {layers.heatmap && <HeatmapLayer incidents={geoIncidents} />}

          {/* Alert radius circles */}
          {layers.alertRadius && (
            <AlertRadiusCircles incidents={geoIncidents} />
          )}
        </MapContainer>
      )}

      {/* Layer Control Panel (top-right) */}
      <Card className="absolute top-3 right-3 z-10 p-3 space-y-1.5 shadow-lg">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
          <Layers className="h-3.5 w-3.5" />
          Layers
        </div>

        <LayerToggle
          active={layers.incidents}
          onClick={() => toggleLayer("incidents")}
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Incidents"
        />
        <LayerToggle
          active={layers.resources}
          onClick={() => toggleLayer("resources")}
          icon={<Package className="h-3.5 w-3.5" />}
          label="Resources"
        />
        <LayerToggle
          active={layers.heatmap}
          onClick={() => toggleLayer("heatmap")}
          icon={<Flame className="h-3.5 w-3.5" />}
          label="Heatmap"
        />
        <LayerToggle
          active={layers.alertRadius}
          onClick={() => toggleLayer("alertRadius")}
          icon={<CircleDot className="h-3.5 w-3.5" />}
          label="Alert Radius"
        />
      </Card>

      {/* Legend (bottom-left) */}
      <Card className="absolute bottom-3 left-3 z-10 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <LegendItem color="#dc2626" label="Critical" />
          <LegendItem color="#f97316" label="High" />
          <LegendItem color="#eab308" label="Medium" />
          <LegendItem color="#22c55e" label="Low" />
          <Separator orientation="vertical" className="h-3" />
          <LegendItem color="#3b82f6" label="Resource" />
        </div>
      </Card>

      {/* Stats overlay (bottom-right) */}
      <Card className="absolute bottom-3 right-3 z-10 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{geoIncidents.length} incidents</span>
          <Separator orientation="vertical" className="h-3" />
          <span>
            {(resources ?? []).filter((r) => r.latitude && r.longitude).length}{" "}
            resources
          </span>
        </div>
      </Card>
    </div>
  );
}

// ─── Layer Toggle Button ─────────────────────────────────────────

function LayerToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className="w-full justify-start gap-1.5"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}

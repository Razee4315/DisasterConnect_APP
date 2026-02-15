import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapStore } from "@/stores/map-store";
import type { MapIncident, MapResource } from "@/hooks/use-dashboard";
import type { SeverityLevel } from "@/types/enums";

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
const RESOURCE_RADIUS = 6;

// ─── Sync Zustand map store with Leaflet ─────────────────────────
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

// ─── Auto-fit bounds when markers first appear ───────────────────
function FitBoundsOnData({
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
      if (inc.latitude != null && inc.longitude != null) {
        points.push([inc.latitude, inc.longitude]);
      }
    }
    for (const res of resources) {
      if (res.latitude != null && res.longitude != null) {
        points.push([res.latitude, res.longitude]);
      }
    }

    if (points.length > 0) {
      hasFitted.current = true;
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, incidents, resources]);

  return null;
}

// ─── Incident Markers ────────────────────────────────────────────
function IncidentMarkers({ incidents }: { incidents: MapIncident[] }) {
  return (
    <>
      {incidents
        .filter((inc) => inc.latitude != null && inc.longitude != null)
        .map((inc) => (
          <CircleMarker
            key={inc.id}
            center={[inc.latitude!, inc.longitude!]}
            radius={SEVERITY_RADIUS[inc.severity] ?? 7}
            pathOptions={{
              color: SEVERITY_COLORS[inc.severity] ?? "#eab308",
              fillColor: SEVERITY_COLORS[inc.severity] ?? "#eab308",
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <p className="font-semibold mb-1">{inc.title}</p>
                <p className="text-xs capitalize">
                  <span className="text-muted-foreground">Severity:</span>{" "}
                  <span
                    style={{ color: SEVERITY_COLORS[inc.severity] }}
                    className="font-medium"
                  >
                    {inc.severity}
                  </span>
                </p>
                <p className="text-xs capitalize">
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {inc.status.replace("_", " ")}
                </p>
                {inc.location_name && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    {inc.location_name}
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </>
  );
}

// ─── Resource Markers ────────────────────────────────────────────
function ResourceMarkers({ resources }: { resources: MapResource[] }) {
  return (
    <>
      {resources
        .filter((res) => res.latitude != null && res.longitude != null)
        .map((res) => (
          <CircleMarker
            key={res.id}
            center={[res.latitude!, res.longitude!]}
            radius={RESOURCE_RADIUS}
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
                  {res.type.replace("_", " ")}
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
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </>
  );
}

// ─── Main Map Component ──────────────────────────────────────────
interface DashboardMapProps {
  incidents: MapIncident[];
  resources: MapResource[];
  showResources?: boolean;
  className?: string;
}

export function DashboardMap({
  incidents,
  resources,
  showResources = true,
  className = "",
}: DashboardMapProps) {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const layers = useMapStore((s) => s.layers);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`rounded-lg border ${className}`}
      style={{ height: "100%", width: "100%", minHeight: 300 }}
      scrollWheelZoom
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapStateSync />
      <FitBoundsOnData incidents={incidents} resources={resources} />
      {layers.incidents && <IncidentMarkers incidents={incidents} />}
      {layers.resources && showResources && (
        <ResourceMarkers resources={resources} />
      )}
    </MapContainer>
  );
}

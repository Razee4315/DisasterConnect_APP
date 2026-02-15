import { useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

// Fix default marker icon for Leaflet in bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ─── Click handler component ─────────────────────────────────────

function ClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Location Picker Dialog ──────────────────────────────────────

export interface LocationPickerValue {
  latitude: number;
  longitude: number;
  location_name?: string;
}

interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: LocationPickerValue | null;
  onConfirm: (value: LocationPickerValue) => void;
}

export function LocationPicker({
  open,
  onOpenChange,
  value,
  onConfirm,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    value?.latitude && value?.longitude
      ? [value.latitude, value.longitude]
      : null
  );
  const [locationName, setLocationName] = useState(
    value?.location_name ?? ""
  );

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
  }, []);

  const handleConfirm = () => {
    if (!position) return;
    onConfirm({
      latitude: position[0],
      longitude: position[1],
      location_name: locationName || undefined,
    });
    onOpenChange(false);
  };

  // Default center: Karachi, Pakistan (project context)
  const defaultCenter: [number, number] = value?.latitude && value?.longitude
    ? [value.latitude, value.longitude]
    : [24.86, 67.01];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Select Location
          </DialogTitle>
        </DialogHeader>

        {/* Location name input */}
        <div>
          <Input
            data-selectable
            placeholder="Location name (e.g. City Hall, Sector 5)"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>

        {/* Map */}
        <div className="h-[400px] rounded-lg overflow-hidden border">
          <MapContainer
            center={defaultCenter}
            zoom={value?.latitude ? 13 : 6}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onLocationSelect={handleLocationSelect} />
            {position && (
              <Marker position={position} icon={defaultIcon} />
            )}
          </MapContainer>
        </div>

        {/* Coordinates display */}
        {position && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
            <span>Lat: {position[0].toFixed(6)}</span>
            <span>Lng: {position[1].toFixed(6)}</span>
          </div>
        )}
        {!position && (
          <p className="text-sm text-muted-foreground">
            Click on the map to place a marker.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!position}>
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

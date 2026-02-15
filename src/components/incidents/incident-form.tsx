import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPicker, type LocationPickerValue } from "@/components/map/location-picker";
import { useCreateIncident, useUpdateIncident } from "@/hooks/use-incidents";
import type { Incident } from "@/types/database";
import type { IncidentType, SeverityLevel, IncidentStatus } from "@/types/enums";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Schema ──────────────────────────────────────────────────────

const incidentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum([
    "natural_disaster",
    "medical_emergency",
    "infrastructure_failure",
    "industrial_accident",
    "security_incident",
    "fire",
    "flood",
    "earthquake",
    "other",
  ] as const),
  severity: z.enum(["low", "medium", "high", "critical"] as const),
  status: z
    .enum(["reported", "verified", "in_progress", "resolved", "closed"] as const)
    .optional(),
  description: z.string().optional(),
  affected_radius_km: z.coerce.number().min(0).optional().or(z.literal("")),
  estimated_affected_people: z.coerce.number().int().min(0).optional().or(z.literal("")),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

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

// ─── Component ───────────────────────────────────────────────────

interface IncidentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: Incident | null; // null = create mode
}

export function IncidentForm({
  open,
  onOpenChange,
  incident,
}: IncidentFormProps) {
  const isEdit = !!incident;
  const createMutation = useCreateIncident();
  const updateMutation = useUpdateIncident();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [location, setLocation] = useState<LocationPickerValue | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: "",
      type: "other",
      severity: "medium",
      description: "",
      affected_radius_km: "",
      estimated_affected_people: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (incident && open) {
      reset({
        title: incident.title,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        description: incident.description ?? "",
        affected_radius_km: incident.affected_radius_km ?? "",
        estimated_affected_people: incident.estimated_affected_people ?? "",
      });
      if (incident.latitude && incident.longitude) {
        setLocation({
          latitude: incident.latitude,
          longitude: incident.longitude,
          location_name: incident.location_name ?? undefined,
        });
      } else {
        setLocation(null);
      }
    } else if (!incident && open) {
      reset({
        title: "",
        type: "other",
        severity: "medium",
        description: "",
        affected_radius_km: "",
        estimated_affected_people: "",
      });
      setLocation(null);
    }
  }, [incident, open, reset]);

  const onSubmit = async (values: IncidentFormValues) => {
    try {
      const payload = {
        title: values.title,
        type: values.type,
        severity: values.severity,
        description: values.description || undefined,
        location_name: location?.location_name ?? null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        affected_radius_km:
          values.affected_radius_km !== "" && values.affected_radius_km !== undefined
            ? Number(values.affected_radius_km)
            : null,
        estimated_affected_people:
          values.estimated_affected_people !== "" && values.estimated_affected_people !== undefined
            ? Number(values.estimated_affected_people)
            : null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: incident.id,
          ...payload,
          status: values.status,
        });
        toast.success("Incident updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Incident reported successfully");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        isEdit ? "Failed to update incident" : "Failed to report incident"
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Incident" : "Report Incident"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                data-selectable
                id="title"
                placeholder="Brief incident title"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Type & Severity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(v) =>
                    setValue("type", v as IncidentType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Severity *</Label>
                <Select
                  value={watch("severity")}
                  onValueChange={(v) =>
                    setValue("severity", v as SeverityLevel)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status (edit mode only) */}
            {isEdit && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) =>
                    setValue("status", v as IncidentStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                data-selectable
                id="description"
                placeholder="Describe the incident..."
                rows={3}
                {...register("description")}
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setLocationPickerOpen(true)}
              >
                <MapPin className="h-4 w-4" />
                {location
                  ? location.location_name ||
                    `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : "Pick Location on Map"}
              </Button>
              {location && (
                <p className="text-xs text-muted-foreground font-mono">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Affected Radius & People */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="radius">Affected Radius (km)</Label>
                <Input
                  data-selectable
                  id="radius"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 5"
                  {...register("affected_radius_km")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="people">Est. Affected People</Label>
                <Input
                  data-selectable
                  id="people"
                  type="number"
                  min="0"
                  placeholder="e.g. 1000"
                  {...register("estimated_affected_people")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Report Incident"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Location picker (separate dialog) */}
      <LocationPicker
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        value={location}
        onConfirm={setLocation}
      />
    </>
  );
}

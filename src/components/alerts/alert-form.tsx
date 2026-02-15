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
import {
  useCreateAlert,
  useUpdateAlert,
  type AlertRow,
} from "@/hooks/use-alerts";
import type { AlertType, SeverityLevel } from "@/types/enums";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Schema ──────────────────────────────────────────────────────

const alertSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["emergency", "warning", "advisory", "information"] as const),
  severity: z.enum(["low", "medium", "high", "critical"] as const),
  message: z.string().min(1, "Message is required"),
  affected_area: z.string().optional(),
  radius_km: z.coerce.number().min(0).optional().or(z.literal("")),
  incident_id: z.string().optional(),
  expires_at: z.string().optional(),
});

type AlertFormValues = z.infer<typeof alertSchema>;

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

// ─── Component ───────────────────────────────────────────────────

interface AlertFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert?: AlertRow | null;
}

export function AlertForm({ open, onOpenChange, alert }: AlertFormProps) {
  const isEdit = !!alert;
  const createMutation = useCreateAlert();
  const updateMutation = useUpdateAlert();
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
  } = useForm<AlertFormValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      title: "",
      type: "warning",
      severity: "medium",
      message: "",
      affected_area: "",
      radius_km: "",
      incident_id: "",
      expires_at: "",
    },
  });

  useEffect(() => {
    if (alert && open) {
      reset({
        title: alert.title,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        affected_area: alert.affected_area ?? "",
        radius_km: alert.radius_km ?? "",
        incident_id: alert.incident_id ?? "",
        expires_at: alert.expires_at
          ? alert.expires_at.slice(0, 16) // format for datetime-local
          : "",
      });
      if (alert.latitude && alert.longitude) {
        setLocation({
          latitude: alert.latitude,
          longitude: alert.longitude,
          location_name: alert.affected_area ?? undefined,
        });
      } else {
        setLocation(null);
      }
    } else if (!alert && open) {
      reset({
        title: "",
        type: "warning",
        severity: "medium",
        message: "",
        affected_area: "",
        radius_km: "",
        incident_id: "",
        expires_at: "",
      });
      setLocation(null);
    }
  }, [alert, open, reset]);

  const onSubmit = async (values: AlertFormValues) => {
    try {
      const payload = {
        title: values.title,
        type: values.type,
        severity: values.severity,
        message: values.message,
        affected_area: values.affected_area || null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        radius_km:
          values.radius_km !== "" && values.radius_km !== undefined
            ? Number(values.radius_km)
            : null,
        incident_id: values.incident_id || null,
        expires_at: values.expires_at || null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: alert.id, ...payload });
        toast.success("Alert updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Alert created successfully");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "Failed to update alert" : "Failed to create alert");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Alert" : "Create Alert"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="alert-title">Title *</Label>
              <Input
                data-selectable
                id="alert-title"
                placeholder="Brief alert title"
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
                  onValueChange={(v) => setValue("type", v as AlertType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TYPES.map((t) => (
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
                  onValueChange={(v) => setValue("severity", v as SeverityLevel)}
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

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="alert-message">Message *</Label>
              <Textarea
                data-selectable
                id="alert-message"
                placeholder="Describe the alert in detail..."
                rows={3}
                {...register("message")}
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message.message}</p>
              )}
            </div>

            {/* Affected Area */}
            <div className="space-y-1.5">
              <Label htmlFor="affected-area">Affected Area</Label>
              <Input
                data-selectable
                id="affected-area"
                placeholder="e.g. Downtown District, North Sector"
                {...register("affected_area")}
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

            {/* Radius & Expiry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="alert-radius">Alert Radius (km)</Label>
                <Input
                  data-selectable
                  id="alert-radius"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 10"
                  {...register("radius_km")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alert-expires">Expires At</Label>
                <Input
                  data-selectable
                  id="alert-expires"
                  type="datetime-local"
                  {...register("expires_at")}
                />
              </div>
            </div>

            {/* Incident ID (optional link) */}
            <div className="space-y-1.5">
              <Label htmlFor="alert-incident">Linked Incident ID (optional)</Label>
              <Input
                data-selectable
                id="alert-incident"
                placeholder="UUID of related incident"
                {...register("incident_id")}
              />
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
                {isEdit ? "Save Changes" : "Create Alert"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LocationPicker
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        value={location}
        onConfirm={setLocation}
      />
    </>
  );
}

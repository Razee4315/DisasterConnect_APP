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
import {
  LocationPicker,
  type LocationPickerValue,
} from "@/components/map/location-picker";
import {
  useCreateResource,
  useUpdateResource,
} from "@/hooks/use-resources";
import type { Resource } from "@/types/database";
import type { ResourceType, ResourceStatus } from "@/types/enums";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Schema ──────────────────────────────────────────────────────

const resourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum([
    "medical",
    "food",
    "water",
    "shelter",
    "transportation",
    "vehicle",
    "medical_equipment",
    "personnel",
    "emergency_supplies",
    "communication_equipment",
    "other",
  ] as const),
  status: z.enum([
    "available",
    "assigned",
    "reserved",
    "unavailable",
    "maintenance",
  ] as const),
  capacity: z.coerce.number().int().min(0).optional().or(z.literal("")),
  description: z.string().optional(),
  contact_info: z.string().optional(),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

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
  { value: "communication_equipment", label: "Communication Equipment" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: { value: ResourceStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "reserved", label: "Reserved" },
  { value: "unavailable", label: "Unavailable" },
  { value: "maintenance", label: "Maintenance" },
];

// ─── Component ───────────────────────────────────────────────────

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: Resource | null;
}

export function ResourceForm({
  open,
  onOpenChange,
  resource,
}: ResourceFormProps) {
  const isEdit = !!resource;
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
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
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: "",
      type: "other",
      status: "available",
      capacity: "",
      description: "",
      contact_info: "",
    },
  });

  useEffect(() => {
    if (resource && open) {
      reset({
        name: resource.name,
        type: resource.type,
        status: resource.status,
        capacity: resource.capacity ?? "",
        description: resource.description ?? "",
        contact_info: resource.contact_info ?? "",
      });
      if (resource.latitude && resource.longitude) {
        setLocation({
          latitude: resource.latitude,
          longitude: resource.longitude,
          location_name: resource.location_name ?? undefined,
        });
      } else {
        setLocation(null);
      }
    } else if (!resource && open) {
      reset({
        name: "",
        type: "other",
        status: "available",
        capacity: "",
        description: "",
        contact_info: "",
      });
      setLocation(null);
    }
  }, [resource, open, reset]);

  const onSubmit = async (values: ResourceFormValues) => {
    try {
      const payload = {
        name: values.name,
        type: values.type,
        status: values.status,
        capacity:
          values.capacity !== "" && values.capacity !== undefined
            ? Number(values.capacity)
            : null,
        description: values.description || null,
        contact_info: values.contact_info || null,
        location_name: location?.location_name ?? null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: resource.id, ...payload });
        toast.success("Resource updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Resource added successfully");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "Failed to update resource" : "Failed to add resource");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Resource" : "Add Resource"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                data-selectable
                id="name"
                placeholder="Resource name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(v) => setValue("type", v as ResourceType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as ResourceStatus)}
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
            </div>

            {/* Capacity */}
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                data-selectable
                id="capacity"
                type="number"
                min="0"
                placeholder="e.g. 50"
                {...register("capacity")}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                data-selectable
                id="description"
                placeholder="Describe the resource..."
                rows={3}
                {...register("description")}
              />
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5">
              <Label htmlFor="contact_info">Contact Info</Label>
              <Input
                data-selectable
                id="contact_info"
                placeholder="Phone, email, or contact person"
                {...register("contact_info")}
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
                {isEdit ? "Save Changes" : "Add Resource"}
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

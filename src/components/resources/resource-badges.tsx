import { cn } from "@/lib/utils";
import type { ResourceStatus, ResourceType } from "@/types/enums";

// ─── Resource Status Badge ───────────────────────────────────────

const statusConfig: Record<ResourceStatus, { label: string; className: string }> = {
  available: {
    label: "Available",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  reserved: {
    label: "Reserved",
    className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  },
  unavailable: {
    label: "Unavailable",
    className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
};

export function ResourceStatusBadge({
  status,
  className,
}: {
  status: ResourceStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Format resource type for display ────────────────────────────

export function formatResourceType(type: ResourceType): string {
  const labels: Record<ResourceType, string> = {
    medical: "Medical",
    food: "Food",
    water: "Water",
    shelter: "Shelter",
    transportation: "Transportation",
    vehicle: "Vehicle",
    medical_equipment: "Medical Equipment",
    personnel: "Personnel",
    emergency_supplies: "Emergency Supplies",
    communication_equipment: "Communication Equipment",
    other: "Other",
  };
  return labels[type] ?? type;
}

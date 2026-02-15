import { cn } from "@/lib/utils";
import type { AlertType } from "@/types/enums";

// ─── Alert Type Badge ────────────────────────────────────────────

const alertTypeConfig: Record<
  AlertType,
  { label: string; className: string }
> = {
  emergency: {
    label: "Emergency",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  warning: {
    label: "Warning",
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  },
  advisory: {
    label: "Advisory",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  information: {
    label: "Information",
    className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
  },
};

export function AlertTypeBadge({
  type,
  className,
}: {
  type: AlertType;
  className?: string;
}) {
  const config = alertTypeConfig[type];
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

// ─── Active Status Badge ─────────────────────────────────────────

export function ActiveBadge({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
        className
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

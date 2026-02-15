import { cn } from "@/lib/utils";
import type { SeverityLevel, IncidentStatus } from "@/types/enums";

// ─── Severity Badge ──────────────────────────────────────────────

const severityConfig: Record<
  SeverityLevel,
  { label: string; className: string }
> = {
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  },
  low: {
    label: "Low",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: SeverityLevel;
  className?: string;
}) {
  const config = severityConfig[severity];
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

// ─── Status Badge ────────────────────────────────────────────────

const statusConfig: Record<
  IncidentStatus,
  { label: string; className: string }
> = {
  reported: {
    label: "Reported",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  verified: {
    label: "Verified",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: IncidentStatus;
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

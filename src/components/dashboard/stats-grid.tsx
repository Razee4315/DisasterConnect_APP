import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Package,
  ListTodo,
  Radio,
  type LucideIcon,
} from "lucide-react";
import type { DashboardStats } from "@/hooks/use-dashboard";

interface StatCardProps {
  label: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  accent?: boolean;
  href?: string;
}

const ICON_BG: Record<string, string> = {
  "text-severity-high": "bg-orange-500/10 dark:bg-orange-400/10",
  "text-success": "bg-emerald-500/10 dark:bg-emerald-400/10",
  "text-destructive": "bg-red-500/10 dark:bg-red-400/10",
  "text-primary": "bg-primary/10",
};

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  accent,
  href,
}: StatCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={`card-hover ${accent && value > 0 ? "border-destructive/50 bg-destructive/5" : ""} ${href ? "cursor-pointer" : ""}`}
      onClick={href ? () => navigate(href) : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`stat-icon-container ${ICON_BG[iconColor] ?? "bg-muted"}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Active Incidents"
        value={stats.activeIncidents}
        icon={AlertTriangle}
        iconColor="text-severity-high"
        href="/incidents"
      />
      <StatCard
        label="Total Resources"
        value={stats.totalResources}
        subtitle={`${stats.availableResources} available`}
        icon={Package}
        iconColor="text-success"
        href="/resources"
      />
      <StatCard
        label="Active SOS"
        value={stats.activeSOS}
        icon={Radio}
        iconColor="text-destructive"
        accent
        href="/map"
      />
      <StatCard
        label="My Pending Tasks"
        value={stats.pendingTasks}
        icon={ListTodo}
        iconColor="text-primary"
        href="/tasks"
      />
    </div>
  );
}

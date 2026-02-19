import { useAuthStore } from "@/stores/auth-store";
import { useMapStore } from "@/stores/map-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Layers, MapPin, Package } from "lucide-react";
import { formatRole } from "@/lib/utils";

import { StatsGrid } from "@/components/dashboard/stats-grid";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  SeverityChart,
  ResourceStatusChart,
} from "@/components/dashboard/dashboard-charts";
import { DashboardMap } from "@/components/map/map-view";

import {
  useDashboardStats,
  useActiveIncidents,
  useActiveResources,
  useIncidentsBySeverity,
  useResourcesByStatus,
  useRecentActivity,
} from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  const layers = useMapStore((s) => s.layers);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: incidents, isLoading: incidentsLoading } =
    useActiveIncidents();
  const { data: resources, isLoading: resourcesLoading } =
    useActiveResources();
  const { data: severityData, isLoading: severityLoading } =
    useIncidentsBySeverity();
  const { data: resourceStatusData, isLoading: resourceStatusLoading } =
    useResourcesByStatus();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name ?? "User"}.{" "}
            <Badge variant="outline" className="ml-1">
              {profile?.role ? formatRole(profile.role) : "—"}
            </Badge>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} isLoading={statsLoading} />

      {/* Map + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Map Section */}
        <Card className="lg:col-span-3 overflow-hidden page-header-gradient">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Incident & Resource Map
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant={layers.incidents ? "default" : "outline"}
                size="xs"
                className="gap-1"
                onClick={() => toggleLayer("incidents")}
              >
                <MapPin className="h-3 w-3" />
                Incidents
              </Button>
              <Button
                variant={layers.resources ? "default" : "outline"}
                size="xs"
                className="gap-1"
                onClick={() => toggleLayer("resources")}
              >
                <Package className="h-3 w-3" />
                Resources
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {incidentsLoading || resourcesLoading ? (
              <div className="flex items-center justify-center h-[400px] bg-muted/30">
                <div className="flex flex-col items-center gap-2">
                  <Layers className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    Loading map data...
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[400px]">
                <DashboardMap
                  incidents={incidents ?? []}
                  resources={resources ?? []}
                />
              </div>
            )}
          </CardContent>
          {/* Map Legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
              Critical
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f97316]" />
              High
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#eab308]" />
              Medium
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              Low
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
              Resource
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Activity Feed + Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ActivityFeed items={activity} isLoading={activityLoading} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SeverityChart data={severityData} isLoading={severityLoading} />
          <ResourceStatusChart
            data={resourceStatusData}
            isLoading={resourceStatusLoading}
          />
        </div>
      </div>
    </div>
  );
}

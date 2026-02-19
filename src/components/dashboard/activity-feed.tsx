import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Package,
  Bell,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/hooks/use-dashboard";
import type { SeverityLevel } from "@/types/enums";

const SEVERITY_VARIANT: Record<SeverityLevel, "destructive" | "outline" | "secondary"> = {
  critical: "destructive",
  high: "destructive",
  medium: "outline",
  low: "secondary",
};

const TYPE_ICON = {
  incident_created: AlertTriangle,
  incident_updated: AlertTriangle,
  resource_created: Package,
  alert_created: Bell,
} as const;

const TYPE_ICON_COLOR: Record<string, { bg: string; fg: string }> = {
  incident_created: { bg: "bg-orange-500/10 dark:bg-orange-400/10", fg: "text-orange-600 dark:text-orange-400" },
  incident_updated: { bg: "bg-blue-500/10 dark:bg-blue-400/10", fg: "text-blue-600 dark:text-blue-400" },
  resource_created: { bg: "bg-emerald-500/10 dark:bg-emerald-400/10", fg: "text-emerald-600 dark:text-emerald-400" },
  alert_created: { bg: "bg-amber-500/10 dark:bg-amber-400/10", fg: "text-amber-600 dark:text-amber-400" },
};

interface ActivityFeedProps {
  items: ActivityItem[] | undefined;
  isLoading: boolean;
}

export function ActivityFeed({ items, isLoading }: ActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent activity yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Activity will appear here as incidents are created
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto scrollable">
            {items.map((item) => {
              const Icon = TYPE_ICON[item.type] ?? AlertTriangle;
              const colors = TYPE_ICON_COLOR[item.type] ?? { bg: "bg-muted", fg: "text-muted-foreground" };
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors.bg}`}>
                    <Icon className={`h-4 w-4 ${colors.fg}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug truncate" data-selectable>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.severity && (
                        <Badge
                          variant={SEVERITY_VARIANT[item.severity]}
                          className="text-[10px] px-1.5 py-0 h-4 capitalize"
                        >
                          {item.severity}
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

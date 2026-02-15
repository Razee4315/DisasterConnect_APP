import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SeverityCount, ResourceStatusCount } from "@/hooks/use-dashboard";
import { BarChart3 } from "lucide-react";

// ─── Severity Colors ─────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// ─── Resource Status Colors ──────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  assigned: "#3b82f6",
  reserved: "#f59e0b",
  unavailable: "#94a3b8",
  maintenance: "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  assigned: "Assigned",
  reserved: "Reserved",
  unavailable: "Unavailable",
  maintenance: "Maintenance",
};

// ─── Severity Donut Chart ────────────────────────────────────────
interface SeverityChartProps {
  data: SeverityCount[] | undefined;
  isLoading: boolean;
}

export function SeverityChart({ data, isLoading }: SeverityChartProps) {
  const total = data?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const hasData = total > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Incidents by Severity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[180px]">
            <div className="h-32 w-32 bg-muted animate-pulse rounded-full" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-[180px] text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No incident data</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data?.map((entry) => (
                    <Cell
                      key={entry.severity}
                      fill={SEVERITY_COLORS[entry.severity]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value,
                    SEVERITY_LABELS[name] ?? name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {data
                ?.filter((d) => d.count > 0)
                .map((d) => (
                  <div key={d.severity} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: SEVERITY_COLORS[d.severity] }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {d.severity}
                    </span>
                    <span className="text-xs font-medium ml-auto">
                      {d.count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Resource Status Bar Chart ───────────────────────────────────
interface ResourceChartProps {
  data: ResourceStatusCount[] | undefined;
  isLoading: boolean;
}

export function ResourceStatusChart({ data, isLoading }: ResourceChartProps) {
  const total = data?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const hasData = total > 0;

  const chartData = data?.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    count: d.count,
    fill: STATUS_COLORS[d.status] ?? "#94a3b8",
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Resources by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-end gap-2 justify-center h-[180px] pb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-10 bg-muted animate-pulse rounded-t"
                style={{ height: `${40 + Math.random() * 80}px` }}
              />
            ))}
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-[180px] text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No resource data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData?.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

import { useAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertTriangle,
    Package,
    ListTodo,
    HandCoins,
    TrendingUp,
    Clock,
    Activity,
    Loader2,
    ShieldAlert,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    Legend,
} from "recharts";

const COLORS_SEV = ["#22c55e", "#eab308", "#f97316", "#ef4444"];
const COLORS_PIE = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", "#f43f5e", "#6366f1", "#14b8a6"];

export default function AnalyticsPage() {
    const { data, isLoading } = useAnalytics();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return null;

    const { topMetrics: m } = data;
    const completionRate = m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;
    const utilizationRate = m.totalResources > 0 ? Math.round((m.assignedResources / m.totalResources) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
                <p className="text-sm text-muted-foreground">
                    Operational metrics and trend analysis
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <MetricCard icon={<AlertTriangle className="h-4 w-4" />} color="text-red-500" label="Total Incidents" value={m.totalIncidents} />
                <MetricCard icon={<Activity className="h-4 w-4" />} color="text-orange-500" label="Active" value={m.activeIncidents} />
                <MetricCard icon={<Package className="h-4 w-4" />} color="text-green-500" label="Resources" value={m.totalResources} />
                <MetricCard icon={<TrendingUp className="h-4 w-4" />} color="text-blue-500" label="Utilization" value={`${utilizationRate}%`} />
                <MetricCard icon={<ListTodo className="h-4 w-4" />} color="text-purple-500" label="Tasks" value={m.totalTasks} />
                <MetricCard icon={<ShieldAlert className="h-4 w-4" />} color="text-emerald-500" label="Completed" value={`${completionRate}%`} />
                <MetricCard icon={<Clock className="h-4 w-4" />} color="text-red-400" label="Overdue" value={m.overdueTasks} />
                <MetricCard icon={<HandCoins className="h-4 w-4" />} color="text-amber-500" label="Donations" value={`$${m.totalDonations.toLocaleString()}`} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Incident Trend (Area) */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium">Incident Trend (30 days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.incidentsByDay}>
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v: string) => v.slice(5)}
                                    tick={{ fontSize: 10 }}
                                    className="fill-muted-foreground"
                                />
                                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                                    labelFormatter={(v: string) => v}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Severity Distribution (Pie) */}
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium">Severity Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px] flex items-center justify-center">
                        {data.severityDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.severityDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {data.severityDistribution.map((_, idx) => (
                                            <Cell key={idx} fill={COLORS_SEV[idx % COLORS_SEV.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                                    />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-xs text-muted-foreground">No data</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Incidents by Type (Bar) */}
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium">Incidents by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.incidentsByType} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} className="fill-muted-foreground" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Resource Utilization (Stacked Bar) */}
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.resourceUtilization}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                                />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="available" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="assigned" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Task Velocity */}
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium">Task Velocity (4 Weeks)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.taskVelocity}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                                />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="created" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Donation Flow (Pie) */}
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium">Donations by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px] flex items-center justify-center">
                        {data.donationFlow.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.donationFlow}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {data.donationFlow.map((_, idx) => (
                                            <Cell key={idx} fill={COLORS_PIE[idx % COLORS_PIE.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                                    />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-xs text-muted-foreground">No data</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="pt-3 pb-2 px-3">
                <div className={`${color} mb-1`}>{icon}</div>
                <p className="text-lg font-bold leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
        </Card>
    );
}

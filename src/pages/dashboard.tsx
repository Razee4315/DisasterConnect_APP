import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertTriangle,
    Package,
    ListTodo,
    Users,
    Bell,
    Activity,
} from "lucide-react";

const STAT_CARDS = [
    { label: "Active Incidents", value: "—", icon: AlertTriangle, color: "text-severity-high" },
    { label: "Available Resources", value: "—", icon: Package, color: "text-success" },
    { label: "Open Tasks", value: "—", icon: ListTodo, color: "text-primary" },
    { label: "Active Teams", value: "—", icon: Users, color: "text-warning" },
    { label: "Pending Alerts", value: "—", icon: Bell, color: "text-destructive" },
    { label: "System Status", value: "Online", icon: Activity, color: "text-success" },
];

export default function DashboardPage() {
    const { profile } = useAuthStore();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {profile?.first_name}.{" "}
                    <Badge variant="outline" className="ml-1 capitalize">
                        {profile?.role?.replace("_", " ")}
                    </Badge>
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {label}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${color}`} />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Placeholder sections */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            No incidents to display yet. Incident data will appear here once created.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Active Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            No active alerts. Alerts will appear here when broadcast.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

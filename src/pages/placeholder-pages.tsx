import { PlaceholderPage } from "@/components/placeholder-page";
import {
    ListTodo,
    MessageSquare,
    Bell,
    Users,
    HandCoins,
    FileBarChart,
    Route,
    FileText,
    Settings,
    ShieldCheck,
} from "lucide-react";

export function TasksPage() {
    return <PlaceholderPage title="Tasks" description="Assign, track, and manage response tasks across teams." icon={ListTodo} />;
}

export function MessagingPage() {
    return <PlaceholderPage title="Messaging" description="Real-time communication channels for teams and incidents." icon={MessageSquare} />;
}

export function AlertsPage() {
    return <PlaceholderPage title="Alerts" description="Emergency alerts and notifications for affected areas." icon={Bell} />;
}

export function TeamsPage() {
    return <PlaceholderPage title="Teams" description="Organize and manage response teams and volunteers." icon={Users} />;
}

export function DonationsPage() {
    return <PlaceholderPage title="Donations" description="Track monetary and physical donations for disaster relief." icon={HandCoins} />;
}

export function ReportsPage() {
    return <PlaceholderPage title="Reports" description="Generate PDF reports and analytics for incidents and operations." icon={FileBarChart} />;
}

export function EvacuationPage() {
    return <PlaceholderPage title="Evacuation Routes" description="Plan and manage safe evacuation pathways." icon={Route} />;
}

export function DocumentsPage() {
    return <PlaceholderPage title="Documents" description="Upload and manage incident-related documents and files." icon={FileText} />;
}

export function SettingsPage() {
    return <PlaceholderPage title="Settings" description="Configure your profile, notifications, and app preferences." icon={Settings} />;
}

export function AdminPage() {
    return <PlaceholderPage title="Admin Panel" description="System administration, user management, and audit log." icon={ShieldCheck} />;
}

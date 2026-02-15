import { PlaceholderPage } from "@/components/placeholder-page";
import {
    Settings,
    ShieldCheck,
} from "lucide-react";

export function SettingsPage() {
    return <PlaceholderPage title="Settings" description="Configure your profile, notifications, and app preferences." icon={Settings} />;
}

export function AdminPage() {
    return <PlaceholderPage title="Admin Panel" description="System administration, user management, and audit log." icon={ShieldCheck} />;
}

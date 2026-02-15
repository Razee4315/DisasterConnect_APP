import type { UserRole } from "./enums";

export interface Profile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar_url: string | null;
    organization: string | null;
    role: UserRole;
    is_active: boolean;
    last_seen_at: string | null;
    notification_preferences: {
        incidents: boolean;
        alerts: boolean;
        messages: boolean;
        tasks: boolean;
        sos: boolean;
        email_notifications: boolean;
    };
    created_at: string;
    updated_at: string;
}

import type {
    UserRole,
    IncidentType,
    SeverityLevel,
    IncidentStatus,
    ResourceType,
    ResourceStatus,
    TaskPriority,
    TaskStatus,
    AlertType,
    ChannelType,
    DonationType,
    DonationStatus,
    NotificationType,
} from "./enums";

// ─── Profiles ────────────────────────────────────────────────────
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

// ─── Incidents ───────────────────────────────────────────────────
export interface Incident {
    id: string;
    title: string;
    type: IncidentType;
    severity: SeverityLevel;
    status: IncidentStatus;
    description: string | null;
    location_name: string | null;
    latitude: number | null;
    longitude: number | null;
    affected_radius_km: number | null;
    estimated_affected_people: number | null;
    created_by: string;
    assigned_coordinator: string | null;
    resolution_notes: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Incident Updates ────────────────────────────────────────────
export interface IncidentUpdate {
    id: string;
    incident_id: string;
    updated_by: string;
    content: string;
    update_type: string;
    created_at: string;
}

// ─── Resources ───────────────────────────────────────────────────
export interface Resource {
    id: string;
    name: string;
    type: ResourceType;
    status: ResourceStatus;
    capacity: number | null;
    description: string | null;
    location_name: string | null;
    latitude: number | null;
    longitude: number | null;
    contact_info: string | null;
    current_incident_id: string | null;
    maintenance_status: string | null;
    maintenance_notes: string | null;
    maintenance_start: string | null;
    maintenance_end: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// ─── Resource Assignments ────────────────────────────────────────
export interface ResourceAssignment {
    id: string;
    resource_id: string;
    incident_id: string;
    assigned_by: string;
    assigned_at: string;
    released_at: string | null;
    notes: string | null;
}

// ─── Tasks ───────────────────────────────────────────────────────
export interface Task {
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    incident_id: string | null;
    assigned_to: string | null;
    assigned_by: string | null;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Teams ───────────────────────────────────────────────────────
export interface Team {
    id: string;
    name: string;
    description: string | null;
    lead_id: string | null;
    current_incident_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: string | null;
    joined_at: string;
}

// ─── Channels & Messages ─────────────────────────────────────────
export interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    incident_id: string | null;
    team_id: string | null;
    created_by: string;
    is_active: boolean;
    created_at: string;
}

export interface ChannelMember {
    id: string;
    channel_id: string;
    user_id: string;
    last_read_at: string | null;
    joined_at: string;
}

export interface Message {
    id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    attachment_url: string | null;
    attachment_name: string | null;
    created_at: string;
}

// ─── Alerts ──────────────────────────────────────────────────────
export interface Alert {
    id: string;
    title: string;
    type: AlertType;
    severity: SeverityLevel;
    message: string;
    incident_id: string | null;
    issued_by: string;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

// ─── SOS Broadcasts ─────────────────────────────────────────────
export interface SOSBroadcast {
    id: string;
    sender_id: string;
    message: string | null;
    severity: SeverityLevel;
    latitude: number | null;
    longitude: number | null;
    location_name: string | null;
    incident_id: string | null;
    is_active: boolean;
    resolved_at: string | null;
    created_at: string;
}

// ─── Donations ───────────────────────────────────────────────────
export interface Donation {
    id: string;
    donor_name: string;
    donor_email: string | null;
    donor_phone: string | null;
    type: DonationType;
    status: DonationStatus;
    amount: number | null;
    description: string | null;
    incident_id: string | null;
    received_by: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Notifications ───────────────────────────────────────────────
export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    entity_type: string | null;
    entity_id: string | null;
    is_read: boolean;
    created_at: string;
}

// ─── Evacuation Routes ──────────────────────────────────────────
export interface EvacuationRoute {
    id: string;
    name: string;
    description: string | null;
    incident_id: string | null;
    waypoints: Array<{ lat: number; lng: number }>;
    status: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// ─── Documents ───────────────────────────────────────────────────
export interface Document {
    id: string;
    name: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    incident_id: string | null;
    uploaded_by: string;
    created_at: string;
}

// ─── Audit Log ───────────────────────────────────────────────────
export interface AuditLogEntry {
    id: string;
    user_id: string | null;
    action: string;
    table_name: string | null;
    record_id: string | null;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    created_at: string;
}

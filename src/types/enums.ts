// Enum types matching Supabase schema

export type UserRole =
    | "administrator"
    | "coordinator"
    | "emergency_responder"
    | "medical_staff"
    | "logistics"
    | "volunteer"
    | "other";

export type IncidentType =
    | "natural_disaster"
    | "medical_emergency"
    | "infrastructure_failure"
    | "industrial_accident"
    | "security_incident"
    | "fire"
    | "flood"
    | "earthquake"
    | "other";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
    | "reported"
    | "verified"
    | "in_progress"
    | "resolved"
    | "closed";

export type ResourceType =
    | "medical"
    | "food"
    | "water"
    | "shelter"
    | "transportation"
    | "vehicle"
    | "medical_equipment"
    | "personnel"
    | "emergency_supplies"
    | "communication_equipment"
    | "other";

export type ResourceStatus =
    | "available"
    | "assigned"
    | "reserved"
    | "unavailable"
    | "maintenance";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type AlertType = "emergency" | "warning" | "advisory" | "information";

export type ChannelType = "incident" | "team" | "direct" | "broadcast";

export type DonationType =
    | "monetary"
    | "medical_supplies"
    | "food"
    | "water"
    | "clothing"
    | "shelter_materials"
    | "equipment"
    | "other";

export type DonationStatus = "pledged" | "received" | "distributed";

export type NotificationType =
    | "incident_created"
    | "incident_updated"
    | "incident_resolved"
    | "resource_assigned"
    | "resource_released"
    | "task_assigned"
    | "task_completed"
    | "sos_broadcast"
    | "alert_issued"
    | "message_received"
    | "team_assigned"
    | "system";

import { z } from "zod";

export const notificationTypeEnum = [
  "New Lead Assigned",
  "New Enquiry Received",
  "Follow-up Due",
  "Follow-up Overdue",
  "New Admission",
  "Payment Received",
  "Pending Payment",
  "Counselling Appointment",
  "Upcoming Batch",
  "Attendance Alert",
  "Placement Update",
  "Staff Activity",
] as const;
export type NotificationType = (typeof notificationTypeEnum)[number];

export const notificationPriorityEnum = [
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const;
export type NotificationPriority = (typeof notificationPriorityEnum)[number];

export const notificationStatusEnum = [
  "Unread",
  "Read",
  "Archived",
] as const;
export type NotificationStatus = (typeof notificationStatusEnum)[number];

export const relatedModuleEnum = [
  "leads",
  "enquiries",
  "follow-ups",
  "admissions",
  "payments",
  "counselling",
  "batches",
  "attendance",
  "placements",
  "staff",
  "students",
] as const;
export type RelatedModule = (typeof relatedModuleEnum)[number];

export const notificationSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  type: z.enum(notificationTypeEnum),
  priority: z.enum(notificationPriorityEnum).default("Medium"),
  status: z.enum(notificationStatusEnum).default("Unread"),
  isImportant: z.boolean().default(false),
  recipientRole: z.string().default("All"),
  recipientName: z.string().optional().nullable(),
  relatedModule: z.enum(relatedModuleEnum),
  relatedId: z.string().min(1, "Related record ID is required"),
  linkUrl: z.string().min(1, "Link URL is required"),
});

export type NotificationFormData = z.infer<typeof notificationSchema>;

export interface NotificationRecord extends NotificationFormData {
  id: string; // e.g. "NTF-2026-101"
  createdAt: string;
  readAt?: string | null;
  archivedAt?: string | null;
}

export interface NotificationKPIStats {
  total: number;
  unread: number;
  read: number;
  important: number;
  archived: number;
  urgent: number;
  typeBreakdown: Record<string, number>;
}

export interface NotificationSettings {
  inAppAlerts: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
  emailDigest: boolean;
  reminderMinutesBefore: number;
  categoryPreferences: Record<NotificationType, boolean>;
}

export const defaultNotificationSettings: NotificationSettings = {
  inAppAlerts: true,
  desktopNotifications: true,
  soundEnabled: false,
  emailDigest: false,
  reminderMinutesBefore: 15,
  categoryPreferences: {
    "New Lead Assigned": true,
    "New Enquiry Received": true,
    "Follow-up Due": true,
    "Follow-up Overdue": true,
    "New Admission": true,
    "Payment Received": true,
    "Pending Payment": true,
    "Counselling Appointment": true,
    "Upcoming Batch": true,
    "Attendance Alert": true,
    "Placement Update": true,
    "Staff Activity": true,
  },
};

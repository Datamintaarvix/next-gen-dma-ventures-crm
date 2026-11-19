import fs from "fs";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  NotificationRecord,
  NotificationFormData,
  NotificationKPIStats,
  NotificationSettings,
  defaultNotificationSettings,
  NotificationStatus,
  NotificationType,
} from "@/lib/validations/notification";

const NOTIFICATIONS_FILE = path.join(process.cwd(), "data", "notifications.json");
const SETTINGS_FILE = path.join(process.cwd(), "data", "notification-settings.json");

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    throw err;
  }
}

function rowToNotification(row: any): NotificationRecord {
  return {
    id: row.id,
    title: row.title || "",
    message: row.message || "",
    type: row.type as any,
    priority: row.priority as any,
    status: row.status as any,
    isImportant: Boolean(row.is_important),
    recipientRole: row.recipient_role || undefined,
    recipientName: row.recipient_name || undefined,
    relatedModule: row.related_module as any,
    relatedId: row.related_id || "",
    linkUrl: row.link_url || undefined,
    createdAt: row.created_at,
    readAt: row.read_at || null,
  };
}

function notificationToRow(n: NotificationRecord): any {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    priority: n.priority,
    status: n.status,
    is_important: Boolean(n.isImportant),
    recipient_role: n.recipientRole || null,
    recipient_name: n.recipientName || null,
    related_module: n.relatedModule || null,
    related_id: n.relatedId || null,
    link_url: n.linkUrl || null,
    created_at: n.createdAt,
    read_at: n.readAt || null,
  };
}

export function readNotificationsFromDisk(): NotificationRecord[] {
  return readJsonFile<NotificationRecord[]>(NOTIFICATIONS_FILE, []);
}

export function writeNotificationsToDisk(data: NotificationRecord[]): void {
  writeJsonFile(NOTIFICATIONS_FILE, data);
}

export async function getAllNotifications(filters?: {
  status?: string;
  type?: string;
  priority?: string;
  search?: string;
  isImportant?: boolean;
}): Promise<NotificationRecord[]> {
  let list: NotificationRecord[] = [];

  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications from Supabase:", error);
      throw new Error(`Failed to fetch notifications from Supabase: ${error.message}`);
    }

    list = (data || []).map(rowToNotification);
  } else {
    list = readNotificationsFromDisk();
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (!filters) return list;

  if (filters.status && filters.status !== "All") {
    if (filters.status === "Important") {
      list = list.filter((n) => n.isImportant && n.status !== "Archived");
    } else {
      list = list.filter((n) => n.status === filters.status);
    }
  } else if (!filters.status || filters.status === "All") {
    // Default "All" excludes archived unless specifically requested
    list = list.filter((n) => n.status !== "Archived");
  }

  if (filters.type && filters.type !== "All") {
    list = list.filter((n) => n.type === filters.type);
  }

  if (filters.priority && filters.priority !== "All") {
    list = list.filter((n) => n.priority === filters.priority);
  }

  if (filters.isImportant !== undefined) {
    list = list.filter((n) => n.isImportant === filters.isImportant);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.relatedId.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        (n.recipientName && n.recipientName.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getNotificationById(id: string): Promise<NotificationRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching notification ${id} from Supabase:`, error);
      throw new Error(`Failed to fetch notification ${id} from Supabase: ${error.message}`);
    }

    return data ? rowToNotification(data) : null;
  }
  const list = readNotificationsFromDisk();
  return list.find((n) => n.id === id) || null;
}

export async function getNotificationKPIs(): Promise<NotificationKPIStats> {
  let list: NotificationRecord[] = [];

  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*");

    if (error) {
      console.error("Error fetching notification KPIs from Supabase:", error);
      throw new Error(`Failed to fetch notification KPIs from Supabase: ${error.message}`);
    }
    list = (data || []).map(rowToNotification);
  } else {
    list = readNotificationsFromDisk();
  }

  let unread = 0;
  let read = 0;
  let important = 0;
  let archived = 0;
  let urgent = 0;
  const typeBreakdown: Record<string, number> = {};

  list.forEach((n) => {
    if (n.status === "Unread") unread++;
    if (n.status === "Read") read++;
    if (n.status === "Archived") archived++;
    if (n.isImportant && n.status !== "Archived") important++;
    if (n.priority === "Urgent" && n.status === "Unread") urgent++;

    typeBreakdown[n.type] = (typeBreakdown[n.type] || 0) + 1;
  });

  return {
    total: list.filter((n) => n.status !== "Archived").length,
    unread,
    read,
    important,
    archived,
    urgent,
    typeBreakdown,
  };
}

export async function markAsRead(id: string): Promise<NotificationRecord | null> {
  const now = new Date().toISOString();

  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "Read", read_at: now })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error marking notification ${id} read in Supabase:`, error);
      throw new Error(`Failed to mark notification as read in Supabase: ${error.message}`);
    }

    const updated = rowToNotification(data);
    const diskList = readNotificationsFromDisk();
    const idx = diskList.findIndex((n) => n.id === id);
    if (idx !== -1) {
      diskList[idx] = updated;
      writeNotificationsToDisk(diskList);
    }
    return updated;
  }

  const list = readNotificationsFromDisk();
  const index = list.findIndex((n) => n.id === id);
  if (index === -1) return null;

  list[index].status = "Read";
  list[index].readAt = now;
  writeJsonFile(NOTIFICATIONS_FILE, list);
  return list[index];
}

export async function markAsUnread(id: string): Promise<NotificationRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "Unread", read_at: null })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error marking notification ${id} unread in Supabase:`, error);
      throw new Error(`Failed to mark notification as unread in Supabase: ${error.message}`);
    }

    const updated = rowToNotification(data);
    const diskList = readNotificationsFromDisk();
    const idx = diskList.findIndex((n) => n.id === id);
    if (idx !== -1) {
      diskList[idx] = updated;
      writeNotificationsToDisk(diskList);
    }
    return updated;
  }

  const list = readNotificationsFromDisk();
  const index = list.findIndex((n) => n.id === id);
  if (index === -1) return null;

  list[index].status = "Unread";
  list[index].readAt = null;
  writeJsonFile(NOTIFICATIONS_FILE, list);
  return list[index];
}

export async function markAllAsRead(): Promise<number> {
  const now = new Date().toISOString();

  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "Read", read_at: now })
      .eq("status", "Unread")
      .select();

    if (error) {
      console.error("Error marking all notifications read in Supabase:", error);
      throw new Error(`Failed to mark all notifications as read in Supabase: ${error.message}`);
    }

    const count = (data || []).length;
    const diskList = readNotificationsFromDisk();
    diskList.forEach((n) => {
      if (n.status === "Unread") {
        n.status = "Read";
        n.readAt = now;
      }
    });
    writeNotificationsToDisk(diskList);
    return count;
  }

  const list = readNotificationsFromDisk();
  let count = 0;
  list.forEach((n) => {
    if (n.status === "Unread") {
      n.status = "Read";
      n.readAt = now;
      count++;
    }
  });

  if (count > 0) {
    writeJsonFile(NOTIFICATIONS_FILE, list);
  }
  return count;
}

export async function archiveNotification(id: string): Promise<NotificationRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "Archived" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error archiving notification ${id} in Supabase:`, error);
      throw new Error(`Failed to archive notification in Supabase: ${error.message}`);
    }

    const updated = rowToNotification(data);
    const diskList = readNotificationsFromDisk();
    const idx = diskList.findIndex((n) => n.id === id);
    if (idx !== -1) {
      diskList[idx] = updated;
      writeNotificationsToDisk(diskList);
    }
    return updated;
  }

  const list = readNotificationsFromDisk();
  const index = list.findIndex((n) => n.id === id);
  if (index === -1) return null;

  list[index].status = "Archived";
  writeJsonFile(NOTIFICATIONS_FILE, list);
  return list[index];
}

export async function deleteNotification(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error(`Error deleting notification ${id} in Supabase:`, error);
      throw new Error(`Failed to delete notification in Supabase: ${error.message}`);
    }

    const diskList = readNotificationsFromDisk();
    const filtered = diskList.filter((n) => n.id !== id);
    writeNotificationsToDisk(filtered);
    return (data || []).length > 0;
  }

  const list = readNotificationsFromDisk();
  const filtered = list.filter((n) => n.id !== id);
  if (filtered.length === list.length) return false;

  writeJsonFile(NOTIFICATIONS_FILE, filtered);
  return true;
}

export async function toggleImportant(id: string): Promise<NotificationRecord | null> {
  const current = await getNotificationById(id);
  if (!current) return null;

  const newImportant = !current.isImportant;

  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_important: newImportant })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error toggling important for notification ${id} in Supabase:`, error);
      throw new Error(`Failed to update notification in Supabase: ${error.message}`);
    }

    const updated = rowToNotification(data);
    const diskList = readNotificationsFromDisk();
    const idx = diskList.findIndex((n) => n.id === id);
    if (idx !== -1) {
      diskList[idx] = updated;
      writeNotificationsToDisk(diskList);
    }
    return updated;
  }

  const list = readNotificationsFromDisk();
  const index = list.findIndex((n) => n.id === id);
  if (index === -1) return null;

  list[index].isImportant = newImportant;
  writeJsonFile(NOTIFICATIONS_FILE, list);
  return list[index];
}

export async function createNotification(data: NotificationFormData): Promise<NotificationRecord> {
  const list = await getAllNotifications({ status: "All" });

  // Generate ID: NTF-2026-XXX
  let maxId = 100;
  list.forEach((n) => {
    const match = n.id.match(/NTF-2026-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) maxId = num;
    }
  });

  const newId = `NTF-2026-${maxId + 1}`;
  const now = new Date().toISOString();

  const newNotification: NotificationRecord = {
    ...data,
    id: newId,
    createdAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const row = notificationToRow(newNotification);
    const { data: inserted, error } = await supabaseAdmin
      .from("notifications")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification in Supabase:", error);
      throw new Error(`Failed to create notification in Supabase: ${error.message}`);
    }

    const created = rowToNotification(inserted);
    const diskList = readNotificationsFromDisk();
    diskList.unshift(created);
    writeNotificationsToDisk(diskList);
    return created;
  }

  const diskList = readNotificationsFromDisk();
  diskList.unshift(newNotification);
  writeJsonFile(NOTIFICATIONS_FILE, diskList);
  return newNotification;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("notification_settings")
      .select("*")
      .eq("id", "current")
      .maybeSingle();

    if (error) {
      console.error("Error fetching notification settings from Supabase:", error);
      throw new Error(`Failed to fetch notification settings from Supabase: ${error.message}`);
    }

    if (data && data.settings) {
      const settings = typeof data.settings === "string" ? JSON.parse(data.settings) : data.settings;
      try {
        writeJsonFile(SETTINGS_FILE, settings);
      } catch (e) {
        console.error("Failed to sync notification settings to fallback disk:", e);
      }
      return settings;
    }
  }
  return readJsonFile<NotificationSettings>(SETTINGS_FILE, defaultNotificationSettings);
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  const updated: NotificationSettings = {
    ...current,
    ...settings,
    categoryPreferences: {
      ...current.categoryPreferences,
      ...(settings.categoryPreferences || {}),
    },
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("notification_settings")
      .upsert({
        id: "current",
        settings: updated,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error updating notification settings in Supabase:", error);
      throw new Error(`Failed to update notification settings in Supabase: ${error.message}`);
    }
  }

  writeJsonFile(SETTINGS_FILE, updated);
  return updated;
}

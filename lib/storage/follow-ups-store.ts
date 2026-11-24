import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  FollowUpRecord,
  FollowUpFormData,
  FollowUpType,
} from "@/lib/validations/follow-up";
import { getLeadById, updateLead } from "./leads-store";
import { getEnquiryById, addCommunicationInteraction, updateEnquiry } from "./enquiries-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "follow-ups.json");

function rowToFollowUp(row: any): FollowUpRecord {
  return {
    id: row.id,
    followUpCode: row.follow_up_code || row.id,
    studentName: row.student_name || "",
    relatedType: row.related_type as any,
    relatedId: row.related_id || undefined,
    relatedCode: row.related_code || undefined,
    contactNumber: row.contact_number || "",
    followUpDate: row.follow_up_date || "",
    followUpTime: row.follow_up_time || "",
    type: row.type as any,
    assignedCounsellor: row.assigned_counsellor || "",
    priority: row.priority as any,
    status: row.status as any,
    notes: row.notes || undefined,
    completionNotes: row.completion_notes || undefined,
    completedAt: row.completed_at || null,
    rescheduledToDate: row.rescheduled_to_date || null,
    rescheduledToTime: row.rescheduled_to_time || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function followUpToRow(f: FollowUpRecord): any {
  return {
    id: f.id,
    follow_up_code: f.followUpCode,
    student_name: f.studentName,
    related_type: f.relatedType,
    related_id: f.relatedId || null,
    related_code: f.relatedCode || null,
    contact_number: f.contactNumber,
    follow_up_date: f.followUpDate,
    follow_up_time: f.followUpTime,
    type: f.type,
    assigned_counsellor: f.assignedCounsellor,
    priority: f.priority,
    status: f.status,
    notes: f.notes || null,
    completion_notes: f.completionNotes || null,
    completed_at: f.completedAt || null,
    rescheduled_to_date: f.rescheduledToDate || null,
    rescheduled_to_time: f.rescheduledToTime || null,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  };
}

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readFollowUpsFromDisk(): Promise<FollowUpRecord[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading follow-ups file:", error);
    return [];
  }
}

export async function writeFollowUpsToDisk(records: FollowUpRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function getFollowUps(): Promise<FollowUpRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching follow_ups from Supabase:", error);
      throw new Error(`Failed to fetch follow-ups from Supabase: ${error.message}`);
    }

    const records = (data || []).map(rowToFollowUp);
    return records;
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return await readFollowUpsFromDisk();
}

export async function getFollowUpById(id: string): Promise<FollowUpRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .select("*")
      .or(`id.eq.${id},follow_up_code.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching follow-up ${id} from Supabase:`, error);
      throw new Error(`Failed to fetch follow-up ${id} from Supabase: ${error.message}`);
    }

    return data ? rowToFollowUp(data) : null;
  }
  const followUps = await readFollowUpsFromDisk();
  return followUps.find((f) => f.id === id || f.followUpCode === id) || null;
}

export async function getFollowUpsByRelated(
  relatedType: "Lead" | "Enquiry",
  relatedId: string
): Promise<FollowUpRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .select("*")
      .eq("related_type", relatedType)
      .or(`related_id.eq.${relatedId},related_code.eq.${relatedId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error querying follow-ups by related from Supabase:", error);
      throw new Error(`Failed to fetch related follow-ups from Supabase: ${error.message}`);
    }

    return (data || []).map(rowToFollowUp);
  }
  const followUps = await readFollowUpsFromDisk();
  return followUps.filter(
    (f) =>
      f.relatedType === relatedType &&
      (f.relatedId === relatedId || f.relatedCode === relatedId)
  );
}

export async function createFollowUp(input: FollowUpFormData): Promise<FollowUpRecord> {
  // Generate next Follow-up Code
  let nextNum = 3001;

  if (isSupabaseServerConfigured()) {
    const { data: latest } = await supabaseAdmin
      .from("follow_ups")
      .select("follow_up_code")
      .order("created_at", { ascending: false })
      .limit(10);

    (latest || []).forEach((f) => {
      const match = f.follow_up_code?.match(/FLW-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) nextNum = num + 1;
      }
    });
  } else {
    const followUps = await readFollowUpsFromDisk();
    followUps.forEach((f) => {
      const match = f.followUpCode?.match(/FLW-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) nextNum = num + 1;
      }
    });
  }

  let relatedCode = input.relatedCode || null;

  // Sync related codes if needed
  if (input.relatedType === "Lead" && input.relatedId && !relatedCode) {
    const lead = await getLeadById(input.relatedId);
    if (lead) {
      relatedCode = lead.leadCode;
      await updateLead(lead.id, { followUpDate: input.followUpDate });
    }
  } else if (input.relatedType === "Enquiry" && input.relatedId && !relatedCode) {
    const enquiry = await getEnquiryById(input.relatedId);
    if (enquiry) {
      relatedCode = enquiry.enquiryCode;
      await updateEnquiry(enquiry.id, { nextFollowUpDate: input.followUpDate });
      await addCommunicationInteraction(enquiry.id, {
        type: input.type === "Phone Call" ? "Phone Call" : input.type === "WhatsApp" ? "WhatsApp" : input.type === "Email" ? "Email" : "Note",
        staffName: input.assignedCounsellor,
        summary: `Follow-up scheduled for ${input.followUpDate} at ${input.followUpTime} (${input.type}). Priority: ${input.priority}.`,
      });
    }
  }

  const now = new Date().toISOString();
  const newFollowUp: FollowUpRecord = {
    ...input,
    id: Date.now().toString(),
    followUpCode: `FLW-${nextNum}`,
    relatedCode,
    completedAt: null,
    rescheduledToDate: null,
    rescheduledToTime: null,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const row = followUpToRow(newFollowUp);
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Error creating follow-up in Supabase:", error);
      throw new Error(`Failed to create follow-up in Supabase: ${error.message}`);
    }

    const created = rowToFollowUp(data);
    const diskRecords = await readFollowUpsFromDisk();
    diskRecords.unshift(created);
    writeFollowUpsToDisk(diskRecords).catch((e) =>
      console.error("Failed to sync follow-up to disk:", e)
    );
    return created;
  }

  const diskRecords = await readFollowUpsFromDisk();
  diskRecords.unshift(newFollowUp);
  await writeFollowUpsToDisk(diskRecords);
  return newFollowUp;
}

export async function updateFollowUp(
  id: string,
  input: Partial<FollowUpFormData>
): Promise<FollowUpRecord | null> {
  const current = await getFollowUpById(id);
  if (!current) return null;

  const updated: FollowUpRecord = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseServerConfigured()) {
    const row = followUpToRow(updated);
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .update(row)
      .eq("id", current.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating follow-up ${id} in Supabase:`, error);
      throw new Error(`Failed to update follow-up in Supabase: ${error.message}`);
    }

    const result = rowToFollowUp(data);
    const diskRecords = await readFollowUpsFromDisk();
    const idx = diskRecords.findIndex((f) => f.id === current.id || f.followUpCode === current.followUpCode);
    if (idx !== -1) {
      diskRecords[idx] = result;
      writeFollowUpsToDisk(diskRecords).catch((e) =>
        console.error("Failed to sync updated follow-up to disk:", e)
      );
    }
    return result;
  }

  const followUps = await readFollowUpsFromDisk();
  const index = followUps.findIndex((f) => f.id === id || f.followUpCode === id);
  if (index === -1) return null;

  followUps[index] = updated;
  await writeFollowUpsToDisk(followUps);
  return updated;
}

export async function deleteFollowUp(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .delete()
      .or(`id.eq.${id},follow_up_code.eq.${id}`)
      .select();

    if (error) {
      console.error(`Error deleting follow-up ${id} in Supabase:`, error);
      throw new Error(`Failed to delete follow-up in Supabase: ${error.message}`);
    }

    const diskRecords = await readFollowUpsFromDisk();
    const filtered = diskRecords.filter((f) => f.id !== id && f.followUpCode !== id);
    writeFollowUpsToDisk(filtered).catch((e) =>
      console.error("Failed to sync deleted follow-up from disk:", e)
    );
    return (data || []).length > 0;
  }

  const followUps = await readFollowUpsFromDisk();
  const filtered = followUps.filter((f) => f.id !== id && f.followUpCode !== id);
  if (filtered.length === followUps.length) return false;

  await writeFollowUpsToDisk(filtered);
  return true;
}

export async function completeFollowUpRecord(
  id: string,
  completionNotes: string,
  scheduleNext?: {
    date: string;
    time: string;
    type: FollowUpType;
    notes?: string;
  }
): Promise<{ completed: FollowUpRecord; nextFollowUp?: FollowUpRecord }> {
  const current = await getFollowUpById(id);
  if (!current) throw new Error("Follow-up not found");

  const now = new Date().toISOString();
  current.status = "Completed";
  current.completionNotes = completionNotes;
  current.completedAt = now;
  current.updatedAt = now;

  let completedRecord: FollowUpRecord;
  if (isSupabaseServerConfigured()) {
    const row = followUpToRow(current);
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .update(row)
      .eq("id", current.id)
      .select()
      .single();

    if (error) {
      console.error(`Error marking follow-up ${id} completed in Supabase:`, error);
      throw new Error(`Failed to mark follow-up completed in Supabase: ${error.message}`);
    }
    completedRecord = rowToFollowUp(data);

    const diskRecords = await readFollowUpsFromDisk();
    const idx = diskRecords.findIndex((f) => f.id === current.id || f.followUpCode === current.followUpCode);
    if (idx !== -1) {
      diskRecords[idx] = completedRecord;
      writeFollowUpsToDisk(diskRecords).catch((e) =>
        console.error("Failed to sync completed follow-up to disk:", e)
      );
    }
  } else {
    const followUps = await readFollowUpsFromDisk();
    const index = followUps.findIndex((f) => f.id === id || f.followUpCode === id);
    if (index !== -1) {
      followUps[index] = current;
      await writeFollowUpsToDisk(followUps);
    }
    completedRecord = current;
  }

  // Two-way status synchronization to source record
  if (completedRecord.relatedType === "Lead" && completedRecord.relatedId) {
    try {
      const lead = await getLeadById(completedRecord.relatedId);
      if (lead) {
        if (scheduleNext && scheduleNext.date) {
          await updateLead(lead.id, {
            followUpDate: scheduleNext.date,
            status: "Follow-up",
            notes: lead.notes
              ? `${lead.notes}\n[Follow-up completed: ${completionNotes}. Next scheduled: ${scheduleNext.date}]`
              : `[Follow-up completed: ${completionNotes}. Next scheduled: ${scheduleNext.date}]`,
          });
        } else {
          await updateLead(lead.id, {
            status: lead.status === "Follow-up" ? "Contacted" : lead.status,
            notes: lead.notes
              ? `${lead.notes}\n[Follow-up completed: ${completionNotes}]`
              : `[Follow-up completed: ${completionNotes}]`,
          });
        }
      }
    } catch (e) {
      console.error("Failed to sync completed follow-up to lead:", e);
    }
  } else if (completedRecord.relatedType === "Enquiry" && completedRecord.relatedId) {
    try {
      const enquiry = await getEnquiryById(completedRecord.relatedId);
      if (enquiry) {
        if (scheduleNext && scheduleNext.date) {
          await updateEnquiry(enquiry.id, {
            nextFollowUpDate: scheduleNext.date,
            status: "Follow-up",
          });
          await addCommunicationInteraction(enquiry.id, {
            type: "Follow-up",
            staffName: completedRecord.assignedCounsellor,
            summary: `Follow-up completed: ${completionNotes}. Next scheduled: ${scheduleNext.date}`,
          });
        } else {
          await addCommunicationInteraction(enquiry.id, {
            type: "Follow-up",
            staffName: completedRecord.assignedCounsellor,
            summary: `Follow-up completed: ${completionNotes}`,
          });
          if (enquiry.status === "Follow-up") {
            await updateEnquiry(enquiry.id, { status: "Responded" });
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync completed follow-up to enquiry:", e);
    }
  }

  // Create next follow-up if requested
  let nextFollowUp: FollowUpRecord | undefined;
  if (scheduleNext && scheduleNext.date) {
    nextFollowUp = await createFollowUp({
      studentName: completedRecord.studentName,
      relatedType: completedRecord.relatedType,
      relatedId: completedRecord.relatedId,
      relatedCode: completedRecord.relatedCode,
      contactNumber: completedRecord.contactNumber,
      followUpDate: scheduleNext.date,
      followUpTime: scheduleNext.time || "11:00",
      type: scheduleNext.type || completedRecord.type,
      assignedCounsellor: completedRecord.assignedCounsellor,
      priority: completedRecord.priority,
      status: "Pending",
      notes: scheduleNext.notes || `Next follow-up following ${completedRecord.followUpCode}: ${completionNotes}`,
    });
  }

  return { completed: completedRecord, nextFollowUp };
}

export async function rescheduleFollowUpRecord(
  id: string,
  newDate: string,
  newTime: string,
  reason: string
): Promise<FollowUpRecord> {
  const current = await getFollowUpById(id);
  if (!current) throw new Error("Follow-up not found");

  const now = new Date().toISOString();
  current.rescheduledToDate = newDate;
  current.rescheduledToTime = newTime;
  current.followUpDate = newDate;
  current.followUpTime = newTime;
  current.status = "Rescheduled";
  current.notes = current.notes
    ? `${current.notes}\n[Rescheduled: ${reason}]`
    : `[Rescheduled: ${reason}]`;
  current.updatedAt = now;

  let finalResult: FollowUpRecord;

  if (isSupabaseServerConfigured()) {
    const row = followUpToRow(current);
    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .update(row)
      .eq("id", current.id)
      .select()
      .single();

    if (error) {
      console.error(`Error rescheduling follow-up ${id} in Supabase:`, error);
      throw new Error(`Failed to reschedule follow-up in Supabase: ${error.message}`);
    }

    const result = rowToFollowUp(data);
    const diskRecords = await readFollowUpsFromDisk();
    const idx = diskRecords.findIndex((f) => f.id === current.id || f.followUpCode === current.followUpCode);
    if (idx !== -1) {
      diskRecords[idx] = result;
      writeFollowUpsToDisk(diskRecords).catch((e) =>
        console.error("Failed to sync rescheduled follow-up to disk:", e)
      );
    }
    finalResult = result;
  } else {
    const followUps = await readFollowUpsFromDisk();
    const index = followUps.findIndex((f) => f.id === id || f.followUpCode === id);
    if (index === -1) throw new Error("Follow-up not found");

    followUps[index] = current;
    await writeFollowUpsToDisk(followUps);
    finalResult = current;
  }

  // Two-way status synchronization to source record
  if (finalResult.relatedType === "Lead" && finalResult.relatedId) {
    try {
      const lead = await getLeadById(finalResult.relatedId);
      if (lead) {
        await updateLead(lead.id, {
          followUpDate: newDate,
          status: "Follow-up",
          notes: lead.notes
            ? `${lead.notes}\n[Follow-up rescheduled to ${newDate} at ${newTime}: ${reason}]`
            : `[Follow-up rescheduled to ${newDate} at ${newTime}: ${reason}]`,
        });
      }
    } catch (e) {
      console.error("Failed to sync rescheduled follow-up to lead:", e);
    }
  } else if (finalResult.relatedType === "Enquiry" && finalResult.relatedId) {
    try {
      const enquiry = await getEnquiryById(finalResult.relatedId);
      if (enquiry) {
        await updateEnquiry(enquiry.id, {
          nextFollowUpDate: newDate,
          status: "Follow-up",
        });
        await addCommunicationInteraction(enquiry.id, {
          type: "Follow-up",
          staffName: finalResult.assignedCounsellor,
          summary: `Follow-up rescheduled to ${newDate} at ${newTime}. Reason: ${reason}`,
        });
      }
    } catch (e) {
      console.error("Failed to sync rescheduled follow-up to enquiry:", e);
    }
  }

  return finalResult;
}

import fs from "fs/promises";
import path from "path";
import { LeadRecord, LeadFormData } from "@/lib/validations/lead";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readLeadsFromDisk(): Promise<LeadRecord[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading leads file:", error);
    return [];
  }
}

export async function writeLeadsToDisk(leads: LeadRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export async function getLeads(): Promise<LeadRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getLeads error:", error);
      throw new Error(`Failed to fetch leads from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      leadCode: row.lead_code,
      studentName: row.student_name,
      phoneNumber: row.phone_number,
      email: row.email || undefined,
      interestedCourse: row.interested_course,
      leadSource: row.lead_source,
      status: row.status as any,
      assignedCounselor: row.assigned_counselor,
      followUpDate: row.follow_up_date,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return await readLeadsFromDisk();
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .or(`id.eq.${id},lead_code.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error("Supabase getLeadById query error:", error);
      throw new Error(`Failed to fetch lead from Supabase: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      leadCode: data.lead_code,
      studentName: data.student_name,
      phoneNumber: data.phone_number,
      email: data.email || undefined,
      interestedCourse: data.interested_course,
      leadSource: data.lead_source,
      status: data.status as any,
      assignedCounselor: data.assigned_counselor,
      followUpDate: data.follow_up_date,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const leads = await readLeadsFromDisk();
  return leads.find((l) => l.id === id || l.leadCode === id) || null;
}

export async function createLead(input: LeadFormData): Promise<LeadRecord> {
  let nextNum = 2401;

  if (isSupabaseServerConfigured()) {
    const { data: latest } = await supabaseAdmin
      .from("leads")
      .select("lead_code")
      .order("created_at", { ascending: false })
      .limit(10);

    (latest || []).forEach((l) => {
      const match = l.lead_code?.match(/LD-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) nextNum = num + 1;
      }
    });

    const now = new Date().toISOString();
    const newLead: LeadRecord = {
      ...input,
      id: Date.now().toString(),
      leadCode: `LD-${nextNum}`,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabaseAdmin.from("leads").insert({
      id: newLead.id,
      lead_code: newLead.leadCode,
      student_name: newLead.studentName,
      phone_number: newLead.phoneNumber,
      email: newLead.email || null,
      interested_course: newLead.interestedCourse,
      lead_source: newLead.leadSource,
      status: newLead.status,
      assigned_counselor: newLead.assignedCounselor,
      follow_up_date: newLead.followUpDate,
      notes: newLead.notes || null,
      created_at: newLead.createdAt,
      updated_at: newLead.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createLead failed: ${error.message}`);
    }
    return newLead;
  }

  const leads = await readLeadsFromDisk();
  leads.forEach((l) => {
    const match = l.leadCode?.match(/LD-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextNum) nextNum = num + 1;
    }
  });

  const now = new Date().toISOString();
  const newLead: LeadRecord = {
    ...input,
    id: Date.now().toString(),
    leadCode: `LD-${nextNum}`,
    createdAt: now,
    updatedAt: now,
  };

  leads.unshift(newLead);
  await writeLeadsToDisk(leads);
  return newLead;
}

export async function updateLead(
  id: string,
  input: Partial<LeadFormData>
): Promise<LeadRecord | null> {
  if (isSupabaseServerConfigured()) {
    const existing = await getLeadById(id);
    if (!existing) return null;

    const updated: LeadRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        student_name: updated.studentName,
        phone_number: updated.phoneNumber,
        email: updated.email || null,
        interested_course: updated.interestedCourse,
        lead_source: updated.leadSource,
        status: updated.status,
        assigned_counselor: updated.assignedCounselor,
        follow_up_date: updated.followUpDate,
        notes: updated.notes || null,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},lead_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateLead failed: ${error.message}`);
    }
    return updated;
  }

  const leads = await readLeadsFromDisk();
  const index = leads.findIndex((l) => l.id === id || l.leadCode === id);
  if (index === -1) return null;

  const updated: LeadRecord = {
    ...leads[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  leads[index] = updated;
  await writeLeadsToDisk(leads);
  return updated;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("leads")
      .delete()
      .or(`id.eq.${id},lead_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase deleteLead failed: ${error.message}`);
    }
    return true;
  }

  const leads = await readLeadsFromDisk();
  const filtered = leads.filter((l) => l.id !== id && l.leadCode !== id);
  if (filtered.length === leads.length) return false;

  await writeLeadsToDisk(filtered);
  return true;
}

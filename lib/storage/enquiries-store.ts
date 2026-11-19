import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  EnquiryRecord,
  EnquiryFormData,
  InteractionFormData,
  CommunicationRecord,
} from "@/lib/validations/enquiry";
import { LeadRecord } from "@/lib/validations/lead";
import { createLead } from "./leads-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "enquiries.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readEnquiriesFromDisk(): Promise<EnquiryRecord[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading enquiries file:", error);
    return [];
  }
}

export async function writeEnquiriesToDisk(enquiries: EnquiryRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(enquiries, null, 2), "utf-8");
}

export async function getEnquiries(): Promise<EnquiryRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getEnquiries error:", error);
      throw new Error(`Failed to fetch enquiries from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      enquiryCode: row.enquiry_code,
      studentName: row.student_name,
      phoneNumber: row.phone_number,
      email: row.email || undefined,
      interestedCourse: row.interested_course,
      enquirySource: row.enquiry_source,
      enquiryDate: row.enquiry_date,
      enquiryMessage: row.enquiry_message,
      assignedCounsellor: row.assigned_counsellor,
      status: row.status as any,
      nextFollowUpDate: row.next_follow_up_date || undefined,
      convertedToLeadId: row.converted_to_lead_id || null,
      convertedLeadCode: row.converted_lead_code || null,
      convertedAt: row.converted_at || null,
      interactions: (row.interactions as any) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return await readEnquiriesFromDisk();
}

export async function getEnquiryById(id: string): Promise<EnquiryRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select("*")
      .or(`id.eq.${id},enquiry_code.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error("Supabase getEnquiryById error:", error);
      throw new Error(`Failed to fetch enquiry from Supabase: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      enquiryCode: data.enquiry_code,
      studentName: data.student_name,
      phoneNumber: data.phone_number,
      email: data.email || undefined,
      interestedCourse: data.interested_course,
      enquirySource: data.enquiry_source,
      enquiryDate: data.enquiry_date,
      enquiryMessage: data.enquiry_message,
      assignedCounsellor: data.assigned_counsellor,
      status: data.status as any,
      nextFollowUpDate: data.next_follow_up_date || undefined,
      convertedToLeadId: data.converted_to_lead_id || null,
      convertedLeadCode: data.converted_lead_code || null,
      convertedAt: data.converted_at || null,
      interactions: (data.interactions as any) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const enquiries = await readEnquiriesFromDisk();
  return enquiries.find((e) => e.id === id || e.enquiryCode === id) || null;
}

export async function createEnquiry(input: EnquiryFormData): Promise<EnquiryRecord> {
  const enquiries = await getEnquiries();

  // Generate sequential Enquiry Code
  let nextNum = 1001;
  enquiries.forEach((e) => {
    const match = e.enquiryCode?.match(/ENQ-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextNum) nextNum = num + 1;
    }
  });

  const now = new Date().toISOString();
  const initialInteraction: CommunicationRecord = {
    id: `int-${Date.now()}`,
    type: "Note",
    staffName: input.assignedCounsellor,
    date: now,
    summary: `Enquiry logged via ${input.enquirySource}: "${input.enquiryMessage}"`,
  };

  const newEnquiry: EnquiryRecord = {
    ...input,
    id: Date.now().toString(),
    enquiryCode: `ENQ-${nextNum}`,
    convertedToLeadId: null,
    convertedLeadCode: null,
    convertedAt: null,
    interactions: [initialInteraction],
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("enquiries").insert({
      id: newEnquiry.id,
      enquiry_code: newEnquiry.enquiryCode,
      student_name: newEnquiry.studentName,
      phone_number: newEnquiry.phoneNumber,
      email: newEnquiry.email || null,
      interested_course: newEnquiry.interestedCourse,
      enquiry_source: newEnquiry.enquirySource,
      enquiry_date: newEnquiry.enquiryDate,
      enquiry_message: newEnquiry.enquiryMessage,
      assigned_counsellor: newEnquiry.assignedCounsellor,
      status: newEnquiry.status,
      next_follow_up_date: newEnquiry.nextFollowUpDate || null,
      converted_to_lead_id: null,
      converted_lead_code: null,
      converted_at: null,
      interactions: newEnquiry.interactions as any,
      created_at: newEnquiry.createdAt,
      updated_at: newEnquiry.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createEnquiry failed: ${error.message}`);
    }
    return newEnquiry;
  }

  const diskEnquiries = await readEnquiriesFromDisk();
  diskEnquiries.unshift(newEnquiry);
  await writeEnquiriesToDisk(diskEnquiries);
  return newEnquiry;
}

export async function updateEnquiry(
  id: string,
  input: Partial<EnquiryFormData>
): Promise<EnquiryRecord | null> {
  if (isSupabaseServerConfigured()) {
    const current = await getEnquiryById(id);
    if (!current) return null;

    const interactions = [...current.interactions];
    if (
      input.assignedCounsellor &&
      input.assignedCounsellor !== current.assignedCounsellor
    ) {
      interactions.unshift({
        id: `int-${Date.now()}`,
        type: "Note",
        staffName: input.assignedCounsellor,
        date: new Date().toISOString(),
        summary: `Reassigned from ${current.assignedCounsellor} to ${input.assignedCounsellor}.`,
      });
    }

    const updated: EnquiryRecord = {
      ...current,
      ...input,
      interactions,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("enquiries")
      .update({
        student_name: updated.studentName,
        phone_number: updated.phoneNumber,
        email: updated.email || null,
        interested_course: updated.interestedCourse,
        enquiry_source: updated.enquirySource,
        enquiry_date: updated.enquiryDate,
        enquiry_message: updated.enquiryMessage,
        assigned_counsellor: updated.assignedCounsellor,
        status: updated.status,
        next_follow_up_date: updated.nextFollowUpDate || null,
        interactions: updated.interactions as any,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},enquiry_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateEnquiry failed: ${error.message}`);
    }
    return updated;
  }

  const enquiries = await readEnquiriesFromDisk();
  const index = enquiries.findIndex((e) => e.id === id || e.enquiryCode === id);
  if (index === -1) return null;

  const current = enquiries[index];

  // If counsellor changed, record communication note
  const interactions = [...current.interactions];
  if (
    input.assignedCounsellor &&
    input.assignedCounsellor !== current.assignedCounsellor
  ) {
    interactions.unshift({
      id: `int-${Date.now()}`,
      type: "Note",
      staffName: input.assignedCounsellor,
      date: new Date().toISOString(),
      summary: `Reassigned from ${current.assignedCounsellor} to ${input.assignedCounsellor}.`,
    });
  }

  const updated: EnquiryRecord = {
    ...current,
    ...input,
    interactions,
    updatedAt: new Date().toISOString(),
  };

  enquiries[index] = updated;
  await writeEnquiriesToDisk(enquiries);
  return updated;
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("enquiries")
      .delete()
      .or(`id.eq.${id},enquiry_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase deleteEnquiry failed: ${error.message}`);
    }
    return true;
  }

  const enquiries = await readEnquiriesFromDisk();
  const filtered = enquiries.filter((e) => e.id !== id && e.enquiryCode !== id);
  if (filtered.length === enquiries.length) return false;

  await writeEnquiriesToDisk(filtered);
  return true;
}

export async function addCommunicationInteraction(
  enquiryId: string,
  data: InteractionFormData
): Promise<EnquiryRecord | null> {
  if (isSupabaseServerConfigured()) {
    const current = await getEnquiryById(enquiryId);
    if (!current) return null;

    const newInteraction: CommunicationRecord = {
      id: `int-${Date.now()}`,
      type: data.type,
      staffName: data.staffName,
      date: new Date().toISOString(),
      summary: data.summary,
    };

    const interactions = [newInteraction, ...current.interactions];
    let status = current.status;
    if (status === "New" || status === "Pending") {
      status = "In Progress";
    }
    const updatedAt = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("enquiries")
      .update({
        status,
        interactions: interactions as any,
        updated_at: updatedAt,
      })
      .or(`id.eq.${enquiryId},enquiry_code.eq.${enquiryId}`);
    if (error) {
      throw new Error(`Supabase addCommunicationInteraction failed: ${error.message}`);
    }

    return {
      ...current,
      status,
      interactions,
      updatedAt,
    };
  }

  const enquiries = await readEnquiriesFromDisk();
  const index = enquiries.findIndex((e) => e.id === enquiryId || e.enquiryCode === enquiryId);
  if (index === -1) return null;

  const current = enquiries[index];
  const newInteraction: CommunicationRecord = {
    id: `int-${Date.now()}`,
    type: data.type,
    staffName: data.staffName,
    date: new Date().toISOString(),
    summary: data.summary,
  };

  current.interactions.unshift(newInteraction);
  current.updatedAt = new Date().toISOString();

  // If status is still New or Pending, automatically advance to Responded/In Progress
  if (current.status === "New" || current.status === "Pending") {
    current.status = "In Progress";
  }

  enquiries[index] = current;
  await writeEnquiriesToDisk(enquiries);
  return current;
}

export async function convertEnquiryToLead(enquiryId: string): Promise<{
  enquiry: EnquiryRecord;
  lead: LeadRecord;
}> {
  if (isSupabaseServerConfigured()) {
    const enquiry = await getEnquiryById(enquiryId);
    if (!enquiry) {
      throw new Error("Enquiry not found");
    }
    if (enquiry.convertedToLeadId) {
      throw new Error(
        `Enquiry already converted to Lead (${enquiry.convertedLeadCode || enquiry.convertedToLeadId})`
      );
    }

    const leadData = {
      studentName: enquiry.studentName,
      phoneNumber: enquiry.phoneNumber,
      email: enquiry.email || "",
      interestedCourse: enquiry.interestedCourse,
      leadSource: enquiry.enquirySource,
      status: "New" as const,
      assignedCounselor: enquiry.assignedCounsellor,
      followUpDate: enquiry.nextFollowUpDate || new Date().toISOString().split("T")[0],
      notes: `Converted from Enquiry ${enquiry.enquiryCode}: "${enquiry.enquiryMessage}"`,
    };

    const createdLead = await createLead(leadData);
    const now = new Date().toISOString();
    const updatedStatus = "Converted";
    const convertedToLeadId = createdLead.id;
    const convertedLeadCode = createdLead.leadCode;
    const interactions = [
      {
        id: `int-${Date.now()}`,
        type: "Note" as const,
        staffName: enquiry.assignedCounsellor,
        date: now,
        summary: `Enquiry converted into Lead record ${createdLead.leadCode}.`,
      },
      ...enquiry.interactions,
    ];

    const { error } = await supabaseAdmin
      .from("enquiries")
      .update({
        status: updatedStatus,
        converted_to_lead_id: convertedToLeadId,
        converted_lead_code: convertedLeadCode,
        converted_at: now,
        interactions: interactions as any,
        updated_at: now,
      })
      .or(`id.eq.${enquiryId},enquiry_code.eq.${enquiryId}`);
    if (error) {
      throw new Error(`Supabase convertEnquiryToLead failed: ${error.message}`);
    }

    const updatedEnquiry: EnquiryRecord = {
      ...enquiry,
      status: updatedStatus,
      convertedToLeadId,
      convertedLeadCode,
      convertedAt: now,
      interactions,
      updatedAt: now,
    };

    return { enquiry: updatedEnquiry, lead: createdLead };
  }

  const enquiries = await readEnquiriesFromDisk();
  const index = enquiries.findIndex((e) => e.id === enquiryId || e.enquiryCode === enquiryId);
  if (index === -1) {
    throw new Error("Enquiry not found");
  }

  const enquiry = enquiries[index];
  if (enquiry.convertedToLeadId) {
    throw new Error(
      `Enquiry already converted to Lead (${enquiry.convertedLeadCode || enquiry.convertedToLeadId})`
    );
  }

  // Create lead in Leads Management store
  const leadData = {
    studentName: enquiry.studentName,
    phoneNumber: enquiry.phoneNumber,
    email: enquiry.email || "",
    interestedCourse: enquiry.interestedCourse,
    leadSource: enquiry.enquirySource,
    status: "New" as const,
    assignedCounselor: enquiry.assignedCounsellor,
    followUpDate: enquiry.nextFollowUpDate || new Date().toISOString().split("T")[0],
    notes: `Converted from Enquiry ${enquiry.enquiryCode}: "${enquiry.enquiryMessage}"`,
  };

  const createdLead = await createLead(leadData);

  const now = new Date().toISOString();
  enquiry.status = "Converted";
  enquiry.convertedToLeadId = createdLead.id;
  enquiry.convertedLeadCode = createdLead.leadCode;
  enquiry.convertedAt = now;
  enquiry.updatedAt = now;

  enquiry.interactions.unshift({
    id: `int-${Date.now()}`,
    type: "Note",
    staffName: enquiry.assignedCounsellor,
    date: now,
    summary: `Enquiry converted into Lead record ${createdLead.leadCode}.`,
  });

  enquiries[index] = enquiry;
  await writeEnquiriesToDisk(enquiries);

  return { enquiry, lead: createdLead };
}

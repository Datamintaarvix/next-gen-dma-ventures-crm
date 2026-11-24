import { LeadRecord } from "@/lib/validations/lead";
import { EnquiryRecord } from "@/lib/validations/enquiry";
import { FollowUpRecord } from "@/lib/validations/follow-up";
import {
  getFollowUpsByRelated,
  createFollowUp,
  updateFollowUp,
} from "@/lib/storage/follow-ups-store";
import { getIndiaTodayStr } from "@/lib/utils";

/**
 * ============================================================================
 * NEXT GEN DMA VENTURES CRM - AUTOMATIC FOLLOW-UP SYNCHRONIZATION SERVICE
 * Handles automatic, idempotent two-way synchronization between:
 * 1. Leads Management <--> Follow-up Management
 * 2. Enquiries Management <--> Follow-up Management
 * ============================================================================
 */

/**
 * Synchronizes a Lead with Follow-up Management.
 * - When lead.status is 'Follow-up', ensures a linked active follow-up exists or is updated.
 * - If lead.status changes away from 'Follow-up', marks any active pending follow-up as Cancelled.
 * - Preserves completed follow-up history at all times.
 */
export async function syncLeadFollowUp(lead: LeadRecord): Promise<FollowUpRecord | null> {
  if (!lead || !lead.id) return null;

  try {
    const existingFollowUps = await getFollowUpsByRelated("Lead", lead.id);

    // Identify active pending/rescheduled follow-up task
    const activeFollowUp = existingFollowUps.find(
      (f) => f.status === "Pending" || f.status === "Rescheduled"
    );

    if (lead.status === "Follow-up") {
      const targetDate = lead.followUpDate || getIndiaTodayStr();
      const targetStaff = lead.assignedCounselor || "Unassigned";
      const targetNotes = lead.notes || `Follow-up scheduled from Lead ${lead.leadCode}`;

      if (activeFollowUp) {
        // Prevent unnecessary duplicate writes if data matches
        const needsUpdate =
          activeFollowUp.followUpDate !== targetDate ||
          activeFollowUp.assignedCounsellor !== targetStaff ||
          activeFollowUp.studentName !== lead.studentName ||
          activeFollowUp.contactNumber !== lead.phoneNumber ||
          activeFollowUp.notes !== targetNotes;

        if (needsUpdate) {
          const updated = await updateFollowUp(activeFollowUp.id, {
            followUpDate: targetDate,
            assignedCounsellor: targetStaff,
            studentName: lead.studentName,
            contactNumber: lead.phoneNumber,
            notes: targetNotes,
          });
          return updated;
        }
        return activeFollowUp;
      }

      // Create new linked follow-up task
      const created = await createFollowUp({
        studentName: lead.studentName,
        relatedType: "Lead",
        relatedId: lead.id,
        relatedCode: lead.leadCode,
        contactNumber: lead.phoneNumber,
        followUpDate: targetDate,
        followUpTime: "11:00",
        type: "Phone Call",
        assignedCounsellor: targetStaff,
        priority: "Medium",
        status: "Pending",
        notes: targetNotes,
      });

      return created;
    } else {
      // Lead status is not 'Follow-up' (e.g. Contacted, Converted, Lost)
      // Cancel active pending task while strictly preserving history of completed ones
      if (activeFollowUp && activeFollowUp.status === "Pending") {
        const updated = await updateFollowUp(activeFollowUp.id, {
          status: "Cancelled",
          notes: activeFollowUp.notes
            ? `${activeFollowUp.notes}\n[System: Cancelled as Lead status changed to ${lead.status}]`
            : `[System: Cancelled as Lead status changed to ${lead.status}]`,
        });
        return updated;
      }
      return null;
    }
  } catch (error) {
    console.error(`syncLeadFollowUp error for lead ${lead.leadCode || lead.id}:`, error);
    return null;
  }
}

/**
 * Synchronizes an Enquiry with Follow-up Management.
 * - When enquiry.status is 'Follow-up' or a Follow-up interaction is logged,
 *   creates or updates the linked follow-up.
 * - If status changes away from 'Follow-up' (or becomes Converted/Closed), marks active pending task as Cancelled.
 */
export async function syncEnquiryFollowUp(
  enquiry: EnquiryRecord,
  options?: {
    isFollowUpInteraction?: boolean;
    followUpDate?: string;
    staffName?: string;
    interactionSummary?: string;
  }
): Promise<FollowUpRecord | null> {
  if (!enquiry || !enquiry.id) return null;

  try {
    const existingFollowUps = await getFollowUpsByRelated("Enquiry", enquiry.id);

    // Identify active pending/rescheduled follow-up task
    const activeFollowUp = existingFollowUps.find(
      (f) => f.status === "Pending" || f.status === "Rescheduled"
    );

    const isFollowUpActive =
      enquiry.status === "Follow-up" ||
      Boolean(options?.isFollowUpInteraction) ||
      Boolean(
        enquiry.nextFollowUpDate &&
          enquiry.status !== "Converted" &&
          enquiry.status !== "Closed"
      );

    if (isFollowUpActive) {
      const targetDate =
        options?.followUpDate || enquiry.nextFollowUpDate || getIndiaTodayStr();
      const targetStaff =
        options?.staffName || enquiry.assignedCounsellor || "Unassigned";
      const targetNotes =
        options?.interactionSummary ||
        enquiry.enquiryMessage ||
        `Follow-up scheduled from Enquiry ${enquiry.enquiryCode}`;

      if (activeFollowUp) {
        // Prevent unnecessary duplicate writes if data matches
        const needsUpdate =
          activeFollowUp.followUpDate !== targetDate ||
          activeFollowUp.assignedCounsellor !== targetStaff ||
          activeFollowUp.studentName !== enquiry.studentName ||
          activeFollowUp.contactNumber !== enquiry.phoneNumber ||
          activeFollowUp.notes !== targetNotes;

        if (needsUpdate) {
          const updated = await updateFollowUp(activeFollowUp.id, {
            followUpDate: targetDate,
            assignedCounsellor: targetStaff,
            studentName: enquiry.studentName,
            contactNumber: enquiry.phoneNumber,
            notes: targetNotes,
          });
          return updated;
        }
        return activeFollowUp;
      }

      // Create new linked follow-up task
      const created = await createFollowUp({
        studentName: enquiry.studentName,
        relatedType: "Enquiry",
        relatedId: enquiry.id,
        relatedCode: enquiry.enquiryCode,
        contactNumber: enquiry.phoneNumber,
        followUpDate: targetDate,
        followUpTime: "11:00",
        type: "Phone Call",
        assignedCounsellor: targetStaff,
        priority: "Medium",
        status: "Pending",
        notes: targetNotes,
      });

      return created;
    } else {
      // Enquiry status changed away from Follow-up or closed/converted
      if (activeFollowUp && activeFollowUp.status === "Pending") {
        const updated = await updateFollowUp(activeFollowUp.id, {
          status: "Cancelled",
          notes: activeFollowUp.notes
            ? `${activeFollowUp.notes}\n[System: Cancelled as Enquiry status changed to ${enquiry.status}]`
            : `[System: Cancelled as Enquiry status changed to ${enquiry.status}]`,
        });
        return updated;
      }
      return null;
    }
  } catch (error) {
    console.error(`syncEnquiryFollowUp error for enquiry ${enquiry.enquiryCode || enquiry.id}:`, error);
    return null;
  }
}

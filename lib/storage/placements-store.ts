import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  CompanyRecord,
  CompanyFormData,
  JobOpportunityRecord,
  JobOpportunityFormData,
  StudentPlacementProfile,
  StudentPlacementProfileFormData,
  PlacementApplicationRecord,
  PlacementInterviewRecord,
  ScheduleInterviewFormData,
  PlacementOfferRecord,
  RecordOfferFormData,
  PlacementKPIStats,
  CoursePlacementReportItem,
  CompanyHiringReportItem,
  ApplicationStatus,
} from "@/lib/validations/placement";
import { readStudentsFromDisk } from "@/lib/storage/students-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "placements.json");

export interface PlacementStorageShape {
  companies: CompanyRecord[];
  jobs: JobOpportunityRecord[];
  profiles: StudentPlacementProfile[];
  applications: PlacementApplicationRecord[];
  offers: PlacementOfferRecord[];
}

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    const empty: PlacementStorageShape = {
      companies: [],
      jobs: [],
      profiles: [],
      applications: [],
      offers: [],
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2), "utf-8");
  }
}

export async function readPlacementsFromDisk(): Promise<PlacementStorageShape> {
  if (isSupabaseServerConfigured()) {
    const [compRes, jobRes, profRes, appRes, offRes] = await Promise.all([
      supabaseAdmin.from("placement_companies").select("*").order("name"),
      supabaseAdmin.from("placement_jobs").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("placement_profiles").select("*"),
      supabaseAdmin.from("placement_applications").select("*").order("applied_date", { ascending: false }),
      supabaseAdmin.from("placement_offers").select("*").order("offer_date", { ascending: false }),
    ]);

    if (compRes.error) {
      console.error("Supabase placement_companies error:", compRes.error);
      throw new Error(`Failed to fetch companies from Supabase: ${compRes.error.message}`);
    }
    if (jobRes.error) {
      console.error("Supabase placement_jobs error:", jobRes.error);
      throw new Error(`Failed to fetch jobs from Supabase: ${jobRes.error.message}`);
    }
    if (profRes.error) {
      console.error("Supabase placement_profiles error:", profRes.error);
      throw new Error(`Failed to fetch profiles from Supabase: ${profRes.error.message}`);
    }
    if (appRes.error) {
      console.error("Supabase placement_applications error:", appRes.error);
      throw new Error(`Failed to fetch applications from Supabase: ${appRes.error.message}`);
    }
    if (offRes.error) {
      console.error("Supabase placement_offers error:", offRes.error);
      throw new Error(`Failed to fetch offers from Supabase: ${offRes.error.message}`);
    }

    const companies: CompanyRecord[] = (compRes.data || []).map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      website: c.website || undefined,
      contactPerson: c.contact_person,
      contactEmail: c.contact_email,
      contactNumber: c.contact_number,
      address: c.address,
      partnershipStatus: c.partnership_status as any,
      notes: c.notes || undefined,
      activeOpportunitiesCount: c.active_opportunities_count,
      totalHiredCount: c.total_hired_count,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    const jobs: JobOpportunityRecord[] = (jobRes.data || []).map((j) => ({
      id: j.id,
      companyId: j.company_id,
      companyName: j.company_name,
      jobTitle: j.job_title,
      jobDescription: j.job_description,
      requiredSkills: (j.required_skills as any) || [],
      minAttendancePercentage: j.min_attendance_percentage ? Number(j.min_attendance_percentage) : 75,
      targetCourses: (j.target_courses as any) || ["Digital Marketing", "Data Analytics"],
      targetBatches: (j.target_batches as any) || [],
      openings: j.openings || 1,
      filledOpenings: j.filled_openings || 0,
      salaryMinLPA: j.salary_min_lpa ? Number(j.salary_min_lpa) : 3,
      salaryMaxLPA: j.salary_max_lpa ? Number(j.salary_max_lpa) : 6,
      salaryRangeDisplay: j.salary_range_display || "₹3 - 6 LPA",
      jobLocation: j.job_location || "Bengaluru",
      jobType: (j.job_type as any) || "Full-time",
      applicationDeadline: j.application_deadline || "2026-12-31",
      status: (j.status as any) || "Open",
      totalApplications: j.total_applications || 0,
      shortlistedCount: j.shortlisted_count || 0,
      selectedCount: j.selected_count || 0,
      createdAt: j.created_at,
      updatedAt: j.updated_at,
    }));

    const profiles: StudentPlacementProfile[] = (profRes.data || []).map((p) => ({
      studentId: p.student_id,
      studentCode: p.student_code,
      studentName: p.student_name,
      email: p.email,
      phoneNumber: p.phone_number,
      courseName: p.course_name,
      batchCode: p.batch_code,
      batchName: p.batch_name,
      attendancePercentage: Number(p.attendance_percentage),
      skills: (p.skills as any) || [],
      resumeUrl: p.resume_url || undefined,
      portfolioUrl: p.portfolio_url || undefined,
      linkedinUrl: p.linkedin_url || undefined,
      githubUrl: p.github_url || undefined,
      expectedSalaryLPA: p.expected_salary_lpa ? Number(p.expected_salary_lpa) : undefined,
      placementEligibility: p.placement_eligibility as any,
      placementStatus: p.placement_status as any,
      totalApplications: p.total_applications,
      totalInterviews: p.total_interviews,
      activeOffersCount: p.active_offers_count,
      placedCompany: p.placed_company || undefined,
      placedJobTitle: p.placed_job_title || undefined,
      placedSalaryLPA: p.placed_salary_lpa ? Number(p.placed_salary_lpa) : undefined,
      placedDate: p.placed_date || undefined,
      notes: p.notes || undefined,
      updatedAt: p.updated_at,
    }));

    const applications: PlacementApplicationRecord[] = (appRes.data || []).map((a) => ({
      id: a.id,
      jobId: a.job_id,
      jobTitle: a.job_title,
      companyId: a.company_id,
      companyName: a.company_name,
      studentId: a.student_id,
      studentCode: a.student_code,
      studentName: a.student_name,
      studentEmail: a.student_email,
      studentPhone: a.student_phone,
      courseName: a.course_name,
      batchCode: a.batch_code,
      appliedDate: a.applied_date,
      status: a.status as any,
      resumeUrl: a.resume_url || undefined,
      portfolioUrl: a.portfolio_url || undefined,
      interviews: (a.interviews as any) || [],
      notes: a.notes || undefined,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));

    const offers: PlacementOfferRecord[] = (offRes.data || []).map((o) => ({
      id: o.id,
      applicationId: o.application_id || undefined,
      jobId: o.job_id || undefined,
      studentId: o.student_id,
      studentCode: o.student_code,
      studentName: o.student_name,
      courseName: o.course_name,
      batchCode: o.batch_code,
      companyName: o.company_name,
      jobTitle: o.job_title,
      offeredSalaryLPA: Number(o.offered_salary_lpa),
      offeredSalaryDisplay: o.offered_salary_display || undefined,
      offerDate: o.offer_date,
      joiningDate: o.joining_date,
      offerLetterRef: o.offer_letter_ref || undefined,
      status: o.status as any,
      acceptanceDate: o.acceptance_date || undefined,
      notes: o.notes || undefined,
      recordedBy: o.recorded_by,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return { companies, jobs, profiles, applications, offers };
  }

  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      companies: [],
      jobs: [],
      profiles: [],
      applications: [],
      offers: [],
    };
  }

  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    const store: PlacementStorageShape = {
      companies: Array.isArray(data.companies) ? data.companies : [],
      jobs: Array.isArray(data.jobs) ? data.jobs : [],
      profiles: Array.isArray(data.profiles) ? data.profiles : [],
      applications: Array.isArray(data.applications) ? data.applications : [],
      offers: Array.isArray(data.offers) ? data.offers : [],
    };

    // Auto-sync any student from students.json who might not be in profiles
    await autoSyncStudentProfiles(store);

    return store;
  } catch (error) {
    console.error("Error reading placements file:", error);
    return {
      companies: [],
      jobs: [],
      profiles: [],
      applications: [],
      offers: [],
    };
  }
}

export async function writePlacementsToDisk(store: PlacementStorageShape): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

/**
 * Auto-syncs student placement profiles with data/students.json
 */
async function autoSyncStudentProfiles(store: PlacementStorageShape): Promise<void> {
  try {
    const students = await readStudentsFromDisk();
    let hasChanged = false;

    students.forEach((s) => {
      const existingProfile = store.profiles.find(
        (p) => p.studentId === s.id || p.studentCode === s.studentCode
      );

      const attendance = s.attendancePercentage || 0;
      const isEligible = attendance >= 75;

      if (!existingProfile) {
        // Create initial placement profile
        const newProfile: StudentPlacementProfile = {
          studentId: s.id,
          studentCode: s.studentCode,
          studentName: s.fullName,
          email: s.email,
          phoneNumber: s.phoneNumber,
          courseName: s.course,
          batchCode: s.batchCode,
          batchName: s.batchName,
          attendancePercentage: attendance,
          skills: [],
          resumeUrl: null,
          portfolioUrl: null,
          linkedinUrl: null,
          githubUrl: null,
          expectedSalaryLPA: 5.0,
          placementEligibility: isEligible ? "Eligible" : "In Training",
          placementStatus: "Seeking Placement",
          totalApplications: 0,
          totalInterviews: 0,
          activeOffersCount: 0,
          placedCompany: null,
          placedJobTitle: null,
          placedSalaryLPA: null,
          placedDate: null,
          notes: !isEligible ? `Attendance is ${attendance}% (<75% required)` : null,
          updatedAt: new Date().toISOString(),
        };

        store.profiles.push(newProfile);
        hasChanged = true;
      } else {
        // Update attendance percentage & eligibility if not placed
        if (existingProfile.attendancePercentage !== attendance) {
          existingProfile.attendancePercentage = attendance;
          if (existingProfile.placementStatus !== "Placed") {
            existingProfile.placementEligibility = isEligible ? "Eligible" : "In Training";
          }
          hasChanged = true;
        }
      }
    });

    if (hasChanged) {
      await writePlacementsToDisk(store);
    }
  } catch (err) {
    console.error("Error syncing student placement profiles:", err);
  }
}

// ---------------------------------------------------------------------------
// 1. COMPANIES MANAGEMENT
// ---------------------------------------------------------------------------

export async function getCompanies(search?: string, status?: string): Promise<CompanyRecord[]> {
  const { companies } = await readPlacementsFromDisk();
  let result = [...companies];

  if (status && status !== "All") {
    result = result.filter((c) => c.partnershipStatus === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCompanyById(id: string): Promise<CompanyRecord | null> {
  const { companies } = await readPlacementsFromDisk();
  return companies.find((c) => c.id === id) || null;
}

export async function createCompany(input: CompanyFormData): Promise<CompanyRecord> {
  const store = await readPlacementsFromDisk();

  // Next ID
  let maxNum = 100;
  store.companies.forEach((c) => {
    const match = c.id.match(/CMP-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  const id = `CMP-${maxNum + 1}`;
  const now = new Date().toISOString();

  const newCompany: CompanyRecord = {
    ...input,
    id,
    activeOpportunitiesCount: 0,
    totalHiredCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("placement_companies").insert({
      id: newCompany.id,
      name: newCompany.name,
      industry: newCompany.industry,
      website: newCompany.website || null,
      contact_person: newCompany.contactPerson,
      contact_email: newCompany.contactEmail,
      contact_number: newCompany.contactNumber,
      address: newCompany.address,
      partnership_status: newCompany.partnershipStatus,
      notes: newCompany.notes || null,
      active_opportunities_count: 0,
      total_hired_count: 0,
      created_at: newCompany.createdAt,
      updated_at: newCompany.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createCompany failed: ${error.message}`);
    }
  }

  store.companies.unshift(newCompany);
  await writePlacementsToDisk(store);
  return newCompany;
}

export async function updateCompany(
  id: string,
  input: Partial<CompanyFormData>
): Promise<CompanyRecord | null> {
  const store = await readPlacementsFromDisk();
  const index = store.companies.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = store.companies[index];
  const now = new Date().toISOString();

  const updated: CompanyRecord = {
    ...current,
    ...input,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("placement_companies")
      .update({
        name: updated.name,
        industry: updated.industry,
        website: updated.website || null,
        contact_person: updated.contactPerson,
        contact_email: updated.contactEmail,
        contact_number: updated.contactNumber,
        address: updated.address,
        partnership_status: updated.partnershipStatus,
        notes: updated.notes || null,
        updated_at: updated.updatedAt,
      })
      .eq("id", id);
    if (error) {
      throw new Error(`Supabase updateCompany failed: ${error.message}`);
    }
  }

  store.companies[index] = updated;

  // If company name updated, also cascade update job records
  if (input.name && input.name !== current.name) {
    store.jobs.forEach((j) => {
      if (j.companyId === id) j.companyName = input.name!;
    });
    store.applications.forEach((a) => {
      if (a.companyId === id) a.companyName = input.name!;
    });
    store.offers.forEach((o) => {
      if (o.companyName === current.name) o.companyName = input.name!;
    });

    if (isSupabaseServerConfigured()) {
      await supabaseAdmin.from("placement_jobs").update({ company_name: input.name! }).eq("company_id", id);
      await supabaseAdmin.from("placement_applications").update({ company_name: input.name! }).eq("company_id", id);
      await supabaseAdmin.from("placement_offers").update({ company_name: input.name! }).eq("company_name", current.name);
    }
  }

  await writePlacementsToDisk(store);
  return updated;
}

export async function deleteCompany(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("placement_companies").delete().eq("id", id);
    if (error) {
      throw new Error(`Supabase deleteCompany failed: ${error.message}`);
    }
  }

  const store = await readPlacementsFromDisk();
  const filtered = store.companies.filter((c) => c.id !== id);
  if (filtered.length === store.companies.length) return false;

  store.companies = filtered;
  await writePlacementsToDisk(store);
  return true;
}

// ---------------------------------------------------------------------------
// 2. JOB OPPORTUNITIES MANAGEMENT
// ---------------------------------------------------------------------------

export async function getJobs(params?: {
  search?: string;
  companyId?: string;
  course?: string;
  status?: string;
}): Promise<JobOpportunityRecord[]> {
  const { jobs } = await readPlacementsFromDisk();
  let result = [...jobs];

  if (!params) {
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { search, companyId, course, status } = params;

  if (companyId && companyId !== "All") {
    result = result.filter((j) => j.companyId === companyId);
  }

  if (status && status !== "All") {
    result = result.filter((j) => j.status === status);
  }

  if (course && course !== "All") {
    result = result.filter((j) => j.targetCourses.includes(course));
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (j) =>
        j.jobTitle.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.jobLocation.toLowerCase().includes(q) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(q))
    );
  }

  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJobById(id: string): Promise<JobOpportunityRecord | null> {
  const { jobs } = await readPlacementsFromDisk();
  return jobs.find((j) => j.id === id) || null;
}

export async function createJob(input: JobOpportunityFormData): Promise<JobOpportunityRecord> {
  const store = await readPlacementsFromDisk();

  let maxNum = 100;
  store.jobs.forEach((j) => {
    const match = j.id.match(/JOB-2026-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  const id = `JOB-2026-${maxNum + 1}`;
  const now = new Date().toISOString();
  const salaryRangeDisplay = `₹${input.salaryMinLPA.toFixed(1)} - ₹${input.salaryMaxLPA.toFixed(1)} LPA`;

  const newJob: JobOpportunityRecord = {
    ...input,
    id,
    filledOpenings: 0,
    salaryRangeDisplay,
    totalApplications: 0,
    shortlistedCount: 0,
    selectedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error: jobErr } = await supabaseAdmin.from("placement_jobs").insert({
      id: newJob.id,
      company_id: newJob.companyId,
      company_name: newJob.companyName,
      job_title: newJob.jobTitle,
      job_description: newJob.jobDescription,
      required_skills: newJob.requiredSkills as any,
      eligibility_criteria: (newJob as any).eligibilityCriteria || "",
      openings: newJob.openings,
      filled_openings: 0,
      salary_min_lpa: newJob.salaryMinLPA,
      salary_max_lpa: newJob.salaryMaxLPA,
      salary_range_display: newJob.salaryRangeDisplay,
      job_location: newJob.jobLocation,
      job_type: newJob.jobType,
      application_deadline: newJob.applicationDeadline,
      status: newJob.status,
      total_applications: 0,
      shortlisted_count: 0,
      selected_count: 0,
      created_at: newJob.createdAt,
      updated_at: newJob.updatedAt,
    });
    if (jobErr) throw new Error(`Supabase createJob failed: ${jobErr.message}`);
  }

  store.jobs.unshift(newJob);

  // Update company active opportunities count
  const comp = store.companies.find((c) => c.id === input.companyId);
  if (comp) {
    comp.activeOpportunitiesCount++;
    if (isSupabaseServerConfigured()) {
      await supabaseAdmin.from("placement_companies").update({
        active_opportunities_count: comp.activeOpportunitiesCount,
      }).eq("id", comp.id);
    }
  }

  await writePlacementsToDisk(store);
  return newJob;
}

export async function updateJob(
  id: string,
  input: Partial<JobOpportunityFormData>
): Promise<JobOpportunityRecord | null> {
  const store = await readPlacementsFromDisk();
  const index = store.jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  const current = store.jobs[index];
  const now = new Date().toISOString();

  let salaryRangeDisplay = current.salaryRangeDisplay;
  if (input.salaryMinLPA !== undefined || input.salaryMaxLPA !== undefined) {
    const min = input.salaryMinLPA !== undefined ? input.salaryMinLPA : current.salaryMinLPA;
    const max = input.salaryMaxLPA !== undefined ? input.salaryMaxLPA : current.salaryMaxLPA;
    salaryRangeDisplay = `₹${min.toFixed(1)} - ₹${max.toFixed(1)} LPA`;
  }

  const updated: JobOpportunityRecord = {
    ...current,
    ...input,
    salaryRangeDisplay,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const updatePayload: Record<string, any> = {
      updated_at: now,
    };
    if (input.jobTitle !== undefined) updatePayload.job_title = updated.jobTitle;
    if (input.jobDescription !== undefined) updatePayload.job_description = updated.jobDescription;
    if (input.requiredSkills !== undefined) updatePayload.required_skills = updated.requiredSkills;
    if ((input as any).eligibilityCriteria !== undefined) updatePayload.eligibility_criteria = (input as any).eligibilityCriteria;
    if (input.openings !== undefined) updatePayload.openings = updated.openings;
    if (input.salaryMinLPA !== undefined) updatePayload.salary_min_lpa = updated.salaryMinLPA;
    if (input.salaryMaxLPA !== undefined) updatePayload.salary_max_lpa = updated.salaryMaxLPA;
    if (salaryRangeDisplay !== current.salaryRangeDisplay) updatePayload.salary_range_display = salaryRangeDisplay;
    if (input.jobLocation !== undefined) updatePayload.job_location = updated.jobLocation;
    if (input.jobType !== undefined) updatePayload.job_type = updated.jobType;
    if (input.applicationDeadline !== undefined) updatePayload.application_deadline = updated.applicationDeadline;
    if (input.status !== undefined) updatePayload.status = updated.status;

    const { error: updErr } = await supabaseAdmin.from("placement_jobs").update(updatePayload).eq("id", id);
    if (updErr) throw new Error(`Supabase updateJob failed: ${updErr.message}`);
  }

  store.jobs[index] = updated;
  await writePlacementsToDisk(store);
  return updated;
}

export async function deleteJob(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { error: delErr } = await supabaseAdmin.from("placement_jobs").delete().eq("id", id);
    if (delErr) throw new Error(`Supabase deleteJob failed: ${delErr.message}`);
  }

  const store = await readPlacementsFromDisk();
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return false;

  store.jobs = store.jobs.filter((j) => j.id !== id);

  // Decrement company active opportunities
  const comp = store.companies.find((c) => c.id === job.companyId);
  if (comp && comp.activeOpportunitiesCount > 0) {
    comp.activeOpportunitiesCount--;
    if (isSupabaseServerConfigured()) {
      await supabaseAdmin.from("placement_companies").update({
        active_opportunities_count: comp.activeOpportunitiesCount,
      }).eq("id", comp.id);
    }
  }

  await writePlacementsToDisk(store);
  return true;
}

// ---------------------------------------------------------------------------
// 3. STUDENT PLACEMENT PROFILES
// ---------------------------------------------------------------------------

export async function getPlacementProfiles(params?: {
  search?: string;
  course?: string;
  batch?: string;
  status?: string;
  eligibility?: string;
}): Promise<StudentPlacementProfile[]> {
  const { profiles } = await readPlacementsFromDisk();
  let result = [...profiles];

  if (!params) return result;

  const { search, course, batch, status, eligibility } = params;

  if (course && course !== "All") {
    result = result.filter((p) => p.courseName === course);
  }

  if (batch && batch !== "All") {
    result = result.filter((p) => p.batchCode === batch);
  }

  if (status && status !== "All") {
    result = result.filter((p) => p.placementStatus === status);
  }

  if (eligibility && eligibility !== "All") {
    result = result.filter((p) => p.placementEligibility === eligibility);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.studentName.toLowerCase().includes(q) ||
        p.studentCode.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phoneNumber.includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  return result.sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export async function getPlacementProfileByStudentId(
  studentIdentifier: string
): Promise<StudentPlacementProfile | null> {
  const { profiles } = await readPlacementsFromDisk();
  return (
    profiles.find(
      (p) =>
        p.studentId === studentIdentifier ||
        p.studentCode.toLowerCase() === studentIdentifier.toLowerCase()
    ) || null
  );
}

export async function updateStudentPlacementProfile(
  studentIdentifier: string,
  input: Partial<StudentPlacementProfileFormData>
): Promise<StudentPlacementProfile | null> {
  const store = await readPlacementsFromDisk();
  const index = store.profiles.findIndex(
    (p) =>
      p.studentId === studentIdentifier ||
      p.studentCode.toLowerCase() === studentIdentifier.toLowerCase()
  );
  if (index === -1) return null;

  const current = store.profiles[index];
  const now = new Date().toISOString();

  const updated: StudentPlacementProfile = {
    ...current,
    ...input,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error: profErr } = await supabaseAdmin
      .from("placement_profiles")
      .update({
        resume_url: updated.resumeUrl,
        portfolio_url: updated.portfolioUrl,
        linkedin_url: updated.linkedinUrl,
        github_url: updated.githubUrl,
        skills: updated.skills as any,
        expected_salary_lpa: updated.expectedSalaryLPA,
        placement_eligibility: updated.placementEligibility,
        placement_status: updated.placementStatus,
        notes: updated.notes || null,
        updated_at: updated.updatedAt,
      })
      .or(`student_id.eq.${studentIdentifier},student_code.eq.${studentIdentifier}`);
    if (profErr) {
      throw new Error(`Supabase updateStudentPlacementProfile failed: ${profErr.message}`);
    }
  }

  store.profiles[index] = updated;
  await writePlacementsToDisk(store);
  return updated;
}

// ---------------------------------------------------------------------------
// 4. JOB APPLICATIONS & INTERVIEWS
// ---------------------------------------------------------------------------

export async function getApplications(params?: {
  jobId?: string;
  studentId?: string;
  status?: string;
  search?: string;
}): Promise<PlacementApplicationRecord[]> {
  const { applications } = await readPlacementsFromDisk();
  let result = [...applications];

  if (!params) {
    return result.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
  }

  const { jobId, studentId, status, search } = params;

  if (jobId && jobId !== "All") {
    result = result.filter((a) => a.jobId === jobId);
  }

  if (studentId) {
    result = result.filter((a) => a.studentId === studentId || a.studentCode === studentId);
  }

  if (status && status !== "All") {
    result = result.filter((a) => a.status === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (a) =>
        a.studentName.toLowerCase().includes(q) ||
        a.studentCode.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
}

/**
 * Apply an eligible student to a job opportunity
 */
export async function applyStudentToJob(
  jobId: string,
  studentId: string,
  notes?: string | null
): Promise<PlacementApplicationRecord> {
  const store = await readPlacementsFromDisk();

  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job opportunity not found");
  if (job.status === "Closed") throw new Error("This job opportunity is closed");

  const profile = store.profiles.find(
    (p) => p.studentId === studentId || p.studentCode === studentId
  );
  if (!profile) throw new Error("Student placement profile not found");

  // Prevent duplicate application
  const existingApp = store.applications.find(
    (a) => a.jobId === jobId && (a.studentId === profile.studentId || a.studentCode === profile.studentCode)
  );
  if (existingApp) {
    throw new Error(
      `${profile.studentName} (${profile.studentCode}) has already applied for this role on ${existingApp.appliedDate}`
    );
  }

  // Attendance eligibility validation check
  if (profile.attendancePercentage < job.minAttendancePercentage) {
    throw new Error(
      `Candidate attendance (${profile.attendancePercentage}%) does not meet the minimum requirement (${job.minAttendancePercentage}%) for this drive`
    );
  }

  let maxNum = 100;
  store.applications.forEach((a) => {
    const match = a.id.match(/APP-2026-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  const id = `APP-2026-${maxNum + 1}`;
  const now = new Date().toISOString();
  const todayStr = now.split("T")[0];

  const newApp: PlacementApplicationRecord = {
    id,
    jobId: job.id,
    jobTitle: job.jobTitle,
    companyId: job.companyId,
    companyName: job.companyName,
    studentId: profile.studentId,
    studentCode: profile.studentCode,
    studentName: profile.studentName,
    studentEmail: profile.email,
    studentPhone: profile.phoneNumber,
    courseName: profile.courseName,
    batchCode: profile.batchCode,
    appliedDate: todayStr,
    status: "Applied",
    resumeUrl: profile.resumeUrl,
    portfolioUrl: profile.portfolioUrl,
    interviews: [],
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  };

  store.applications.unshift(newApp);

  // Update counts
  job.totalApplications++;
  profile.totalApplications++;
  if (profile.placementStatus === "Seeking Placement") {
    profile.placementStatus = "Seeking Placement";
  }

  if (isSupabaseServerConfigured()) {
    const { error: appErr } = await supabaseAdmin.from("placement_applications").insert({
      id: newApp.id,
      job_id: newApp.jobId,
      job_title: newApp.jobTitle,
      company_id: newApp.companyId,
      company_name: newApp.companyName,
      student_id: newApp.studentId,
      student_code: newApp.studentCode,
      student_name: newApp.studentName,
      student_email: newApp.studentEmail,
      student_phone: newApp.studentPhone,
      course_name: newApp.courseName,
      batch_code: newApp.batchCode,
      applied_date: newApp.appliedDate,
      status: newApp.status,
      resume_url: newApp.resumeUrl,
      portfolio_url: newApp.portfolioUrl,
      interviews: [] as any,
      notes: newApp.notes || null,
      created_at: newApp.createdAt,
      updated_at: newApp.updatedAt,
    });
    if (appErr) throw new Error(`Supabase applyStudentToJob failed: ${appErr.message}`);

    await supabaseAdmin.from("placement_jobs").update({
      total_applications: job.totalApplications,
    }).eq("id", job.id);

    await supabaseAdmin.from("placement_profiles").update({
      total_applications: profile.totalApplications,
      updated_at: now,
    }).eq("student_id", profile.studentId);
  }

  await writePlacementsToDisk(store);
  return newApp;
}

/**
 * Schedule an interview round for an application
 */
export async function scheduleInterview(
  input: ScheduleInterviewFormData
): Promise<PlacementInterviewRecord> {
  const store = await readPlacementsFromDisk();

  const app = store.applications.find((a) => a.id === input.applicationId);
  if (!app) throw new Error("Application not found");

  const job = store.jobs.find((j) => j.id === app.jobId);
  const profile = store.profiles.find((p) => p.studentId === app.studentId);

  let maxNum = 100;
  store.applications.forEach((a) => {
    a.interviews.forEach((i) => {
      const match = i.id.match(/INT-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
  });

  const id = `INT-2026-${maxNum + 1}`;
  const now = new Date().toISOString();

  const newInterview: PlacementInterviewRecord = {
    ...input,
    id,
    jobId: app.jobId,
    jobTitle: app.jobTitle,
    companyName: app.companyName,
    studentId: app.studentId,
    studentCode: app.studentCode,
    studentName: app.studentName,
    result: "Scheduled",
    createdAt: now,
    updatedAt: now,
  };

  app.interviews.push(newInterview);
  app.status = "Interview Scheduled";
  app.updatedAt = now;

  if (profile) {
    profile.totalInterviews++;
    profile.placementStatus = "In Interview Process";
    profile.updatedAt = now;
  }

  if (job) {
    job.shortlistedCount = Math.max(job.shortlistedCount, 1);
  }

  if (isSupabaseServerConfigured()) {
    await supabaseAdmin.from("placement_applications").update({
      status: app.status,
      interviews: app.interviews as any,
      updated_at: now,
    }).eq("id", app.id);

    if (profile) {
      await supabaseAdmin.from("placement_profiles").update({
        total_interviews: profile.totalInterviews,
        placement_status: profile.placementStatus,
        updated_at: now,
      }).eq("student_id", profile.studentId);
    }
  }

  await writePlacementsToDisk(store);
  return newInterview;
}

/**
 * Record feedback and result for an interview
 */
export async function recordInterviewFeedback(
  interviewId: string,
  feedback: string,
  rating: number,
  result: "Passed" | "Pending Feedback" | "Failed"
): Promise<PlacementInterviewRecord | null> {
  const store = await readPlacementsFromDisk();
  let foundInterview: PlacementInterviewRecord | null = null;
  const now = new Date().toISOString();

  for (const app of store.applications) {
    const interview = app.interviews.find((i) => i.id === interviewId);
    if (interview) {
      interview.feedback = feedback;
      interview.rating = rating;
      interview.result = result;
      interview.updatedAt = now;
      foundInterview = interview;

      if (result === "Failed") {
        app.status = "Not Selected";
      } else if (result === "Passed") {
        app.status = "Shortlisted";
      }
      app.updatedAt = now;
      break;
    }
  }

  if (foundInterview) {
    if (isSupabaseServerConfigured()) {
      for (const app of store.applications) {
        if (app.interviews.some((i) => i.id === interviewId)) {
          await supabaseAdmin.from("placement_applications").update({
            status: app.status,
            interviews: app.interviews as any,
            updated_at: now,
          }).eq("id", app.id);
          break;
        }
      }
    }
    await writePlacementsToDisk(store);
  }

  return foundInterview;
}

// ---------------------------------------------------------------------------
// 5. PLACEMENT OFFERS
// ---------------------------------------------------------------------------

export async function getOffers(): Promise<PlacementOfferRecord[]> {
  const { offers } = await readPlacementsFromDisk();
  return offers.sort((a, b) => b.offerDate.localeCompare(a.offerDate));
}

/**
 * Record a placement offer
 */
export async function recordPlacementOffer(
  input: RecordOfferFormData
): Promise<PlacementOfferRecord> {
  const store = await readPlacementsFromDisk();

  const app = store.applications.find((a) => a.id === input.applicationId);
  if (!app) throw new Error("Application record not found");

  const job = store.jobs.find((j) => j.id === app.jobId);
  const profile = store.profiles.find((p) => p.studentId === app.studentId);

  // Check duplicate offer for this student and job
  const existingOffer = store.offers.find(
    (o) => o.studentId === app.studentId && o.jobId === app.jobId
  );
  if (existingOffer) {
    throw new Error(
      `An offer has already been recorded for ${app.studentName} with ${app.companyName}`
    );
  }

  let maxNum = 100;
  store.offers.forEach((o) => {
    const match = o.id.match(/OFR-2026-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  const id = `OFR-2026-${maxNum + 1}`;
  const now = new Date().toISOString();
  const offeredSalaryDisplay = `₹${(input.offeredSalaryLPA * 100000).toLocaleString("en-IN")} PA (${input.offeredSalaryLPA.toFixed(1)} LPA)`;

  const newOffer: PlacementOfferRecord = {
    ...input,
    id,
    jobId: app.jobId,
    studentId: app.studentId,
    studentCode: app.studentCode,
    studentName: app.studentName,
    courseName: app.courseName,
    batchCode: app.batchCode,
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    offeredSalaryDisplay,
    acceptanceDate: input.status === "Accepted" ? now.split("T")[0] : null,
    createdAt: now,
    updatedAt: now,
  };

  store.offers.unshift(newOffer);

  // Update profile
  if (profile) {
    profile.activeOffersCount++;
    if (input.status === "Accepted") {
      profile.placementStatus = "Placed";
      profile.placementEligibility = "Placed";
      profile.placedCompany = app.companyName;
      profile.placedJobTitle = app.jobTitle;
      profile.placedSalaryLPA = input.offeredSalaryLPA;
      profile.placedDate = input.offerDate;
    } else {
      profile.placementStatus = "Offer Received";
    }
    profile.updatedAt = now;
  }

  // Update application and job
  if (input.status === "Accepted") {
    app.status = "Selected";
    if (job) {
      job.filledOpenings++;
      job.selectedCount++;
    }
    const comp = store.companies.find((c) => c.name === app.companyName);
    if (comp) {
      comp.totalHiredCount++;
    }
  }

  if (isSupabaseServerConfigured()) {
    const { error: ofrErr } = await supabaseAdmin.from("placement_offers").insert({
      id: newOffer.id,
      application_id: newOffer.applicationId,
      job_id: newOffer.jobId,
      student_id: newOffer.studentId,
      student_code: newOffer.studentCode,
      student_name: newOffer.studentName,
      course_name: newOffer.courseName,
      batch_code: newOffer.batchCode,
      company_name: newOffer.companyName,
      job_title: newOffer.jobTitle,
      offered_salary_lpa: newOffer.offeredSalaryLPA,
      offered_salary_display: newOffer.offeredSalaryDisplay,
      offer_date: newOffer.offerDate,
      joining_date: newOffer.joiningDate || null,
      offer_letter_ref: newOffer.offerLetterRef || null,
      status: newOffer.status,
      acceptance_date: newOffer.acceptanceDate || null,
      notes: newOffer.notes || null,
      recorded_by: newOffer.recordedBy,
      created_at: newOffer.createdAt,
      updated_at: newOffer.updatedAt,
    });
    if (ofrErr) throw new Error(`Supabase recordPlacementOffer failed: ${ofrErr.message}`);

    if (profile) {
      await supabaseAdmin.from("placement_profiles").update({
        active_offers_count: profile.activeOffersCount,
        placement_status: profile.placementStatus,
        placement_eligibility: profile.placementEligibility,
        placed_company: profile.placedCompany || null,
        placed_job_title: profile.placedJobTitle || null,
        placed_salary_lpa: profile.placedSalaryLPA || null,
        placed_date: profile.placedDate || null,
        updated_at: now,
      }).eq("student_id", profile.studentId);
    }

    if (input.status === "Accepted") {
      await supabaseAdmin.from("placement_applications").update({
        status: "Selected",
        updated_at: now,
      }).eq("id", app.id);
      if (job) {
        await supabaseAdmin.from("placement_jobs").update({
          filled_openings: job.filledOpenings,
          selected_count: job.selectedCount,
          updated_at: now,
        }).eq("id", job.id);
      }
      const comp = store.companies.find((c) => c.name === app.companyName);
      if (comp) {
        await supabaseAdmin.from("placement_companies").update({
          total_hired_count: comp.totalHiredCount,
          updated_at: now,
        }).eq("id", comp.id);
      }
    }
  }

  await writePlacementsToDisk(store);
  return newOffer;
}

/**
 * Accept a placement offer
 */
export async function acceptPlacementOffer(offerId: string): Promise<PlacementOfferRecord | null> {
  const store = await readPlacementsFromDisk();
  const offer = store.offers.find((o) => o.id === offerId);
  if (!offer) return null;

  const now = new Date().toISOString();
  offer.status = "Accepted";
  offer.acceptanceDate = now.split("T")[0];
  offer.updatedAt = now;

  // Update student profile
  const profile = store.profiles.find((p) => p.studentId === offer.studentId);
  if (profile) {
    profile.placementStatus = "Placed";
    profile.placementEligibility = "Placed";
    profile.placedCompany = offer.companyName;
    profile.placedJobTitle = offer.jobTitle;
    profile.placedSalaryLPA = offer.offeredSalaryLPA;
    profile.placedDate = offer.offerDate;
    profile.updatedAt = now;
  }

  // Update application
  const app = store.applications.find((a) => a.id === offer.applicationId);
  if (app) {
    app.status = "Selected";
    app.updatedAt = now;
  }

  // Update job openings and company count
  const job = store.jobs.find((j) => j.id === offer.jobId);
  if (job) {
    job.filledOpenings++;
    job.selectedCount++;
  }

  const comp = store.companies.find((c) => c.name === offer.companyName);
  if (comp) {
    comp.totalHiredCount++;
  }

  if (isSupabaseServerConfigured()) {
    await supabaseAdmin.from("placement_offers").update({
      status: "Accepted",
      acceptance_date: offer.acceptanceDate,
      updated_at: now,
    }).eq("id", offerId);

    if (profile) {
      await supabaseAdmin.from("placement_profiles").update({
        placement_status: "Placed",
        placement_eligibility: "Placed",
        placed_company: offer.companyName,
        placed_job_title: offer.jobTitle,
        placed_salary_lpa: offer.offeredSalaryLPA,
        placed_date: offer.offerDate,
        updated_at: now,
      }).eq("student_id", profile.studentId);
    }

    if (app) {
      await supabaseAdmin.from("placement_applications").update({
        status: "Selected",
        updated_at: now,
      }).eq("id", app.id);
    }

    if (job) {
      await supabaseAdmin.from("placement_jobs").update({
        filled_openings: job.filledOpenings,
        selected_count: job.selectedCount,
        updated_at: now,
      }).eq("id", job.id);
    }

    if (comp) {
      await supabaseAdmin.from("placement_companies").update({
        total_hired_count: comp.totalHiredCount,
        updated_at: now,
      }).eq("id", comp.id);
    }
  }

  await writePlacementsToDisk(store);
  return offer;
}

// ---------------------------------------------------------------------------
// 6. KPIS AND REPORTS AGGREGATION
// ---------------------------------------------------------------------------

export async function getPlacementKPIs(filters?: {
  course?: string;
  batch?: string;
}): Promise<PlacementKPIStats> {
  const store = await readPlacementsFromDisk();

  let profiles = store.profiles;
  if (filters?.course && filters.course !== "All") {
    profiles = profiles.filter((p) => p.courseName === filters.course);
  }
  if (filters?.batch && filters.batch !== "All") {
    profiles = profiles.filter((p) => p.batchCode === filters.batch);
  }

  const totalEligibleStudents = profiles.filter(
    (p) => p.placementEligibility === "Eligible" || p.placementEligibility === "Placed"
  ).length;

  const studentsPlaced = profiles.filter((p) => p.placementStatus === "Placed").length;
  const studentsSeekingPlacement = profiles.filter(
    (p) => p.placementStatus === "Seeking Placement" || p.placementStatus === "In Interview Process"
  ).length;

  const companiesRegistered = store.companies.filter(
    (c) => c.partnershipStatus === "Active" || c.partnershipStatus === "MOU Signed"
  ).length;

  const activeJobOpportunities = store.jobs.filter((j) => j.status === "Open").length;

  let interviewsScheduled = 0;
  store.applications.forEach((a) => {
    interviewsScheduled += a.interviews.filter((i) => i.result === "Scheduled").length;
  });

  const placementSuccessRate =
    totalEligibleStudents > 0
      ? Math.round((studentsPlaced / totalEligibleStudents) * 100)
      : 0;

  // Salary distribution analytics
  let highestSalaryLPA = 0;
  let totalSalary = 0;
  let countPlaced = 0;

  store.offers
    .filter((o) => o.status === "Accepted")
    .forEach((o) => {
      countPlaced++;
      totalSalary += o.offeredSalaryLPA;
      if (o.offeredSalaryLPA > highestSalaryLPA) {
        highestSalaryLPA = o.offeredSalaryLPA;
      }
    });

  const averageSalaryLPA = countPlaced > 0 ? Number((totalSalary / countPlaced).toFixed(1)) : 0;

  return {
    totalEligibleStudents,
    studentsPlaced,
    studentsSeekingPlacement,
    companiesRegistered,
    activeJobOpportunities,
    interviewsScheduled,
    placementSuccessRate,
    highestSalaryLPA,
    averageSalaryLPA,
    totalOffersExtended: store.offers.length,
  };
}

export async function getPlacementAnalytics(): Promise<{
  courseReport: CoursePlacementReportItem[];
  companyReport: CompanyHiringReportItem[];
}> {
  const store = await readPlacementsFromDisk();

  // Course-wise report
  const courseMap = new Map<string, CoursePlacementReportItem>();

  store.profiles.forEach((p) => {
    const course = p.courseName;
    const curr = courseMap.get(course) || {
      courseName: course,
      totalStudents: 0,
      eligibleStudents: 0,
      placedStudents: 0,
      placementRate: 0,
      avgPackageLPA: 0,
      highestPackageLPA: 0,
    };

    curr.totalStudents++;
    if (p.placementEligibility === "Eligible" || p.placementEligibility === "Placed") {
      curr.eligibleStudents++;
    }
    if (p.placementStatus === "Placed") {
      curr.placedStudents++;
      if (p.placedSalaryLPA) {
        if (p.placedSalaryLPA > curr.highestPackageLPA) {
          curr.highestPackageLPA = p.placedSalaryLPA;
        }
      }
    }

    courseMap.set(course, curr);
  });

  const courseReport = Array.from(courseMap.values()).map((c) => ({
    ...c,
    placementRate:
      c.eligibleStudents > 0 ? Math.round((c.placedStudents / c.eligibleStudents) * 100) : 0,
  }));

  // Company-wise hiring report
  const companyReport: CompanyHiringReportItem[] = store.companies.map((comp) => {
    const compJobs = store.jobs.filter((j) => j.companyId === comp.id);
    const totalOpenings = compJobs.reduce((sum, j) => sum + j.openings, 0);

    const compOffers = store.offers.filter(
      (o) => o.companyName === comp.name && o.status === "Accepted"
    );

    const totalSalary = compOffers.reduce((sum, o) => sum + o.offeredSalaryLPA, 0);
    const avgOfferedLPA = compOffers.length > 0 ? Number((totalSalary / compOffers.length).toFixed(1)) : 0;

    const hiredStudents = compOffers.map((o) => ({
      studentCode: o.studentCode,
      studentName: o.studentName,
      courseName: o.courseName,
      jobTitle: o.jobTitle,
      salaryLPA: o.offeredSalaryLPA,
      joiningDate: o.joiningDate,
    }));

    return {
      companyId: comp.id,
      companyName: comp.name,
      industry: comp.industry,
      totalOpenings,
      hiredCount: compOffers.length,
      avgOfferedLPA,
      hiredStudents,
    };
  });

  return { courseReport, companyReport };
}

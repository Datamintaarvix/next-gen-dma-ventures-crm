import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  CourseRecord,
  CourseFormData,
  CourseStatus,
} from "@/lib/validations/course";
import { getStudents } from "./students-store";
import { studentBatchList, BatchInfo } from "@/lib/validations/student";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "courses.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readCoursesFromDisk(): Promise<CourseRecord[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading courses file:", error);
    return [];
  }
}

export async function writeCoursesToDisk(records: CourseRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function getCourses(): Promise<CourseRecord[]> {
  let courses: CourseRecord[] = [];
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase getCourses error:", error);
      throw new Error(`Failed to fetch courses from Supabase: ${error.message}`);
    }

    courses = (data || []).map((row) => ({
      id: row.id,
      courseCode: row.course_code,
      courseName: row.course_name,
      category: row.category as any,
      description: row.description || "",
      duration: row.duration || `${row.duration_weeks} Weeks`,
      durationWeeks: row.duration_weeks,
      fees: Number(row.total_fee),
      syllabus: (row.syllabus as any) || [],
      instructor: row.instructor || "",
      instructorBio: row.instructor_bio || "",
      status: row.status as any,
      level: (row.level as any) || "Intermediate",
      mode: (row.mode as any) || "Hybrid",
      maxBatchCapacity: row.max_capacity,
      imageUrl: row.image_url || undefined,
      enrolledStudentsCount: row.enrolled_students_count || 0,
      activeBatchesCount: row.active_batches_count || 0,
      activeBatchesList: (row.active_batches_list as any) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } else if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    courses = [];
  } else {
    courses = await readCoursesFromDisk();
  }

  const students = await getStudents();

  // Dynamically enrich courses with actual enrolled student count and active batches
  return courses.map((course) => {
    const matchingStudents = students.filter(
      (s) => s.course.toLowerCase() === course.courseName.toLowerCase()
    );
    const matchingBatches = studentBatchList.filter(
      (b) => b.course.toLowerCase() === course.courseName.toLowerCase()
    );

    return {
      ...course,
      enrolledStudentsCount: matchingStudents.length,
      activeBatchesCount: matchingBatches.length,
      activeBatchesList: matchingBatches.map((b) => b.code),
    };
  });
}

export async function getCourseById(id: string): Promise<{
  course: CourseRecord | null;
  enrolledStudents: any[];
  associatedBatches: BatchInfo[];
}> {
  const courses = await getCourses();
  const course =
    courses.find((c) => c.id === id || c.courseCode.toLowerCase() === id.toLowerCase()) ||
    null;

  if (!course) {
    return { course: null, enrolledStudents: [], associatedBatches: [] };
  }

  const allStudents = await getStudents();
  const enrolledStudents = allStudents.filter(
    (s) => s.course.toLowerCase() === course.courseName.toLowerCase()
  );

  const associatedBatches = studentBatchList.filter(
    (b) => b.course.toLowerCase() === course.courseName.toLowerCase()
  );

  return { course, enrolledStudents, associatedBatches };
}

export async function createCourse(input: CourseFormData): Promise<CourseRecord> {
  const courses = await readCoursesFromDisk();

  // Check duplicate course name
  const existing = courses.find(
    (c) => c.courseName.toLowerCase().trim() === input.courseName.toLowerCase().trim()
  );
  if (existing) {
    throw new Error(`A course named "${input.courseName}" already exists (${existing.courseCode})`);
  }

  // Generate next Course Code: CRS-101, CRS-102...
  let nextNum = 101;
  courses.forEach((c) => {
    const match = c.courseCode?.match(/CRS-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextNum) nextNum = num + 1;
    }
  });

  const courseCode = `CRS-${nextNum}`;
  const now = new Date().toISOString();

  const newCourse: CourseRecord = {
    ...input,
    id: Date.now().toString(),
    courseCode,
    enrolledStudentsCount: 0,
    activeBatchesCount: 0,
    activeBatchesList: [],
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("courses").insert({
      id: newCourse.id,
      course_code: newCourse.courseCode,
      course_name: newCourse.courseName,
      category: newCourse.category,
      description: newCourse.description || "",
      duration: newCourse.duration || `${newCourse.durationWeeks} Weeks`,
      duration_weeks: newCourse.durationWeeks,
      total_fee: newCourse.fees,
      syllabus: (newCourse.syllabus as any) || [],
      instructor: newCourse.instructor || "",
      instructor_bio: newCourse.instructorBio || "",
      status: newCourse.status,
      level: newCourse.level || "Intermediate",
      mode: newCourse.mode || "Hybrid",
      max_capacity: newCourse.maxBatchCapacity,
      image_url: newCourse.imageUrl || null,
      enrolled_students_count: 0,
      active_batches_count: 0,
      active_batches_list: [],
      created_at: newCourse.createdAt,
      updated_at: newCourse.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createCourse failed: ${error.message}`);
    }
    return newCourse;
  }

  courses.push(newCourse);
  await writeCoursesToDisk(courses);
  return newCourse;
}

export async function updateCourse(
  id: string,
  input: Partial<CourseFormData>
): Promise<CourseRecord | null> {
  const courses = await readCoursesFromDisk();
  const index = courses.findIndex((c) => c.id === id || c.courseCode === id);
  if (index === -1) return null;

  const current = courses[index];

  // If renaming, check duplicates
  if (
    input.courseName &&
    input.courseName.toLowerCase().trim() !== current.courseName.toLowerCase().trim()
  ) {
    const duplicate = courses.find(
      (c) =>
        c.id !== current.id &&
        c.courseName.toLowerCase().trim() === input.courseName!.toLowerCase().trim()
    );
    if (duplicate) {
      throw new Error(`Another course with name "${input.courseName}" already exists`);
    }
  }

  const updated: CourseRecord = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseServerConfigured()) {
    const updatePayload: Record<string, any> = {
      updated_at: updated.updatedAt,
    };
    if (input.courseName !== undefined) updatePayload.course_name = updated.courseName;
    if (input.category !== undefined) updatePayload.category = updated.category;
    if (input.description !== undefined) updatePayload.description = updated.description;
    if (input.duration !== undefined) updatePayload.duration = updated.duration;
    if (input.durationWeeks !== undefined) updatePayload.duration_weeks = updated.durationWeeks;
    if (input.fees !== undefined) updatePayload.total_fee = updated.fees;
    if (input.syllabus !== undefined) updatePayload.syllabus = updated.syllabus;
    if (input.instructor !== undefined) updatePayload.instructor = updated.instructor;
    if (input.instructorBio !== undefined) updatePayload.instructor_bio = updated.instructorBio;
    if (input.status !== undefined) updatePayload.status = updated.status;
    if (input.level !== undefined) updatePayload.level = updated.level;
    if (input.mode !== undefined) updatePayload.mode = updated.mode;
    if (input.maxBatchCapacity !== undefined) updatePayload.max_capacity = updated.maxBatchCapacity;
    if (input.imageUrl !== undefined) updatePayload.image_url = updated.imageUrl || null;

    const { error } = await supabaseAdmin
      .from("courses")
      .update(updatePayload)
      .or(`id.eq.${id},course_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateCourse failed: ${error.message}`);
    }
    return updated;
  }

  courses[index] = updated;
  await writeCoursesToDisk(courses);
  return updated;
}

export async function updateCourseStatus(
  id: string,
  status: CourseStatus
): Promise<CourseRecord | null> {
  const courses = await readCoursesFromDisk();
  const index = courses.findIndex((c) => c.id === id || c.courseCode === id);
  if (index === -1) return null;

  courses[index].status = status;
  courses[index].updatedAt = new Date().toISOString();

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("courses")
      .update({
        status,
        updated_at: courses[index].updatedAt,
      })
      .or(`id.eq.${id},course_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateCourseStatus failed: ${error.message}`);
    }
    return courses[index];
  }

  await writeCoursesToDisk(courses);
  return courses[index];
}

export async function deleteCourse(
  id: string,
  force: boolean = false
): Promise<{ success: boolean; message?: string; blockedByStudents?: number }> {
  const courses = await readCoursesFromDisk();
  const index = courses.findIndex((c) => c.id === id || c.courseCode === id);
  if (index === -1) {
    return { success: false, message: "Course not found" };
  }

  const targetCourse = courses[index];

  // Integration rule: Check active enrolled students
  const students = await getStudents();
  const activeEnrolled = students.filter(
    (s) =>
      s.course.toLowerCase() === targetCourse.courseName.toLowerCase() &&
      s.status === "Active"
  );

  if (activeEnrolled.length > 0 && !force) {
    return {
      success: false,
      blockedByStudents: activeEnrolled.length,
      message: `Cannot delete "${targetCourse.courseName}": ${activeEnrolled.length} active student(s) are currently enrolled. Archive the course or transfer students before deletion.`,
    };
  }

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .or(`id.eq.${targetCourse.id},course_code.eq.${targetCourse.courseCode}`);
    if (error) {
      throw new Error(`Supabase deleteCourse failed: ${error.message}`);
    }
    return { success: true, message: `Course "${targetCourse.courseName}" deleted successfully.` };
  }

  const filtered = courses.filter((c) => c.id !== targetCourse.id);
  await writeCoursesToDisk(filtered);
  return { success: true, message: `Course "${targetCourse.courseName}" deleted successfully.` };
}

export async function getCourseStats(): Promise<{
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
  totalEnrolledStudents: number;
  courseEnrolmentStats: {
    courseName: string;
    courseCode: string;
    enrolledCount: number;
    fees: number;
    status: string;
  }[];
}> {
  const courses = await getCourses();
  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.status === "Active").length;
  const inactiveCourses = courses.filter((c) => c.status !== "Active").length;

  let totalEnrolledStudents = 0;
  const courseEnrolmentStats = courses.map((c) => {
    totalEnrolledStudents += c.enrolledStudentsCount || 0;
    return {
      courseName: c.courseName,
      courseCode: c.courseCode,
      enrolledCount: c.enrolledStudentsCount || 0,
      fees: c.fees,
      status: c.status,
    };
  });

  return {
    totalCourses,
    activeCourses,
    inactiveCourses,
    totalEnrolledStudents,
    courseEnrolmentStats,
  };
}

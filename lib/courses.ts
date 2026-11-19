/**
 * =========================================================================
 * NEXT GEN DMA VENTURES CRM - CENTRALIZED COURSE CATALOGUE
 * Complete 44-Course Master Directory across 3 Disciplines:
 * 1. IT & Software Courses (17)
 * 2. Mechanical Design & Engineering Courses (8)
 * 3. Electric Vehicle & Automotive Courses (19)
 * =========================================================================
 */

export const COURSE_CATEGORIES = [
  "IT & Software",
  "Mechanical Design & Engineering",
  "Electric Vehicle & Automotive",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export interface CourseDefinition {
  code: string;
  name: string;
  category: CourseCategory;
}

export const IT_SOFTWARE_COURSES = [
  "Artificial Intelligence",
  "Machine Learning",
  "Data Analytics & Science",
  "Python",
  "Advanced Excel, SQL & Power BI",
  "Web Development",
  "App Development",
  "Software Development",
  "Full Stack Development",
  "Java Programming",
  "Django Development",
  "Cyber Security",
  "Cloud Computing",
  "DevOps Engineering",
  "UI & UX Design",
  "Digital Marketing",
  "Software Testing & Automation",
] as const;

export const MECHANICAL_ENGINEERING_COURSES = [
  "AutoCAD Mechanical",
  "Computer-Aided Design (CAD)",
  "CATIA Design & Modeling",
  "SolidWorks Design & Simulation",
  "ANSYS Engineering Simulation",
  "CNC Programming & Manufacturing",
  "3D Printing & Additive Manufacturing",
  "Industrial Automation & Robotics",
] as const;

export const EV_AUTOMOTIVE_COURSES = [
  "EV Technology for Mechanical Engineers",
  "Manufacturing Process & Quality Control",
  "Electric Vehicle Technology",
  "Automotive Design Using CATIA",
  "Automotive CAD Using SolidWorks",
  "Hybrid Vehicle Technology",
  "Automotive Diagnostics & Troubleshooting",
  "Battery Management System",
  "Automotive Quality Control",
  "Vehicle Dynamics & Simulation",
  "ADAS — Advanced Driver Assistance Systems",
  "AI in Automotive Engineering",
  "Robotics & Industrial Automation",
  "Digital Twin Technology",
  "IoT for Smart Manufacturing",
  "Industry 4.0 & Smart Factory",
  "Python for Mechanical Engineers",
  "MATLAB & Simulink for Automotive Applications",
  "EV Battery Analytics",
] as const;

export const ALL_COURSES: readonly string[] = [
  ...IT_SOFTWARE_COURSES,
  ...MECHANICAL_ENGINEERING_COURSES,
  ...EV_AUTOMOTIVE_COURSES,
] as const;

export type CourseName = (typeof ALL_COURSES)[number];

export const COURSE_CATALOGUE_BY_CATEGORY: Record<CourseCategory, readonly string[]> = {
  "IT & Software": IT_SOFTWARE_COURSES,
  "Mechanical Design & Engineering": MECHANICAL_ENGINEERING_COURSES,
  "Electric Vehicle & Automotive": EV_AUTOMOTIVE_COURSES,
};

export const COURSE_DEFINITIONS: CourseDefinition[] = [
  // IT & Software (CRS-IT-101 to CRS-IT-117)
  { code: "CRS-IT-101", name: "Artificial Intelligence", category: "IT & Software" },
  { code: "CRS-IT-102", name: "Machine Learning", category: "IT & Software" },
  { code: "CRS-IT-103", name: "Data Analytics & Science", category: "IT & Software" },
  { code: "CRS-IT-104", name: "Python", category: "IT & Software" },
  { code: "CRS-IT-105", name: "Advanced Excel, SQL & Power BI", category: "IT & Software" },
  { code: "CRS-IT-106", name: "Web Development", category: "IT & Software" },
  { code: "CRS-IT-107", name: "App Development", category: "IT & Software" },
  { code: "CRS-IT-108", name: "Software Development", category: "IT & Software" },
  { code: "CRS-IT-109", name: "Full Stack Development", category: "IT & Software" },
  { code: "CRS-IT-110", name: "Java Programming", category: "IT & Software" },
  { code: "CRS-IT-111", name: "Django Development", category: "IT & Software" },
  { code: "CRS-IT-112", name: "Cyber Security", category: "IT & Software" },
  { code: "CRS-IT-113", name: "Cloud Computing", category: "IT & Software" },
  { code: "CRS-IT-114", name: "DevOps Engineering", category: "IT & Software" },
  { code: "CRS-IT-115", name: "UI & UX Design", category: "IT & Software" },
  { code: "CRS-IT-116", name: "Digital Marketing", category: "IT & Software" },
  { code: "CRS-IT-117", name: "Software Testing & Automation", category: "IT & Software" },

  // Mechanical Design & Engineering (CRS-ME-201 to CRS-ME-208)
  { code: "CRS-ME-201", name: "AutoCAD Mechanical", category: "Mechanical Design & Engineering" },
  { code: "CRS-ME-202", name: "Computer-Aided Design (CAD)", category: "Mechanical Design & Engineering" },
  { code: "CRS-ME-203", name: "CATIA Design & Modeling", category: "Mechanical Design & Engineering" },
  { code: "CRS-ME-204", name: "SolidWorks Design & Simulation", category: "Mechanical Design & Engineering" },
  { code: "CRS-ME-205", name: "ANSYS Engineering Simulation", category: "Mechanical Design & Engineering" },
  { code: "CRS-ME-206", name: "CNC Programming & Manufacturing", category: "Mechanical Design & Engineering" },
  { code: "CRS-ME-207", name: "3D Printing & Additive Manufacturing", category: "Mechanical Design & Engineering" },
  { code: "CRS-ME-208", name: "Industrial Automation & Robotics", category: "Mechanical Design & Engineering" },

  // Electric Vehicle & Automotive (CRS-EV-301 to CRS-EV-319)
  { code: "CRS-EV-301", name: "EV Technology for Mechanical Engineers", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-302", name: "Manufacturing Process & Quality Control", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-303", name: "Electric Vehicle Technology", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-304", name: "Automotive Design Using CATIA", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-305", name: "Automotive CAD Using SolidWorks", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-306", name: "Hybrid Vehicle Technology", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-307", name: "Automotive Diagnostics & Troubleshooting", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-308", name: "Battery Management System", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-309", name: "Automotive Quality Control", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-310", name: "Vehicle Dynamics & Simulation", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-311", name: "ADAS — Advanced Driver Assistance Systems", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-312", name: "AI in Automotive Engineering", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-313", name: "Robotics & Industrial Automation", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-314", name: "Digital Twin Technology", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-315", name: "IoT for Smart Manufacturing", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-316", name: "Industry 4.0 & Smart Factory", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-317", name: "Python for Mechanical Engineers", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-318", name: "MATLAB & Simulink for Automotive Applications", category: "Electric Vehicle & Automotive" },
  { code: "CRS-EV-319", name: "EV Battery Analytics", category: "Electric Vehicle & Automotive" },
];

/**
 * Returns the category for a given course name.
 */
export function getCourseCategory(courseName: string): CourseCategory | "Other" {
  for (const [cat, list] of Object.entries(COURSE_CATALOGUE_BY_CATEGORY)) {
    if (list.includes(courseName as any)) {
      return cat as CourseCategory;
    }
  }
  return "Other";
}

/**
 * Returns the course code for a given course name.
 */
export function getCourseCode(courseName: string): string {
  const match = COURSE_DEFINITIONS.find(
    (c) => c.name.toLowerCase() === courseName.toLowerCase()
  );
  return match ? match.code : "CRS-GEN";
}

/**
 * Checks whether a course name is valid in the catalogue.
 */
export function isCourseInCatalogue(courseName: string): boolean {
  return ALL_COURSES.some(
    (c) => c.toLowerCase() === courseName.toLowerCase().trim()
  );
}

export interface StatMetric {
  title: string;
  value: string;
  subtext: string;
  iconName: "leads" | "enquiries" | "followups" | "converted" | "students" | "courses" | "payments" | "conversionRate";
}

export const DASHBOARD_STATS: StatMetric[] = [
  {
    title: "Total Leads",
    value: "1,284",
    subtext: "+12.4% vs last month",
    iconName: "leads",
  },
  {
    title: "New Enquiries",
    value: "86",
    subtext: "+8.2% vs last month",
    iconName: "enquiries",
  },
  {
    title: "Follow-ups Today",
    value: "24",
    subtext: "6 still scheduled",
    iconName: "followups",
  },
  {
    title: "Converted Leads",
    value: "312",
    subtext: "+5.1% vs last month",
    iconName: "converted",
  },
  {
    title: "Total Students",
    value: "946",
    subtext: "+42 this month",
    iconName: "students",
  },
  {
    title: "Active Courses",
    value: "18",
    subtext: "2 new this quarter",
    iconName: "courses",
  },
  {
    title: "Pending Payments",
    value: "₹4.8L",
    subtext: "Across 28 invoices",
    iconName: "payments",
  },
  {
    title: "Conversion Rate",
    value: "24.3%",
    subtext: "+1.8 pts vs last month",
    iconName: "conversionRate",
  },
];

export const LEADS_CONVERSION_DATA = [
  { month: "Jun", leads: 260, converted: 75, label: "START" },
  { month: "Jul", leads: 340, converted: 98 },
  { month: "Aug", leads: 290, converted: 85 },
  { month: "Sep", leads: 410, converted: 130, label: "MIDPOINT" },
  { month: "Oct", leads: 370, converted: 118 },
  { month: "Nov", leads: 470, converted: 155, label: "RECENT" },
];

export const MONTHLY_ADMISSION_DATA = [
  { month: "Jun", admissions: 22, target: 28, label: "START" },
  { month: "Jul", admissions: 30, target: 34 },
  { month: "Aug", admissions: 32, target: 38 },
  { month: "Sep", admissions: 42, target: 46, label: "MIDPOINT" },
  { month: "Oct", admissions: 48, target: 52 },
  { month: "Nov", admissions: 58, target: 54, label: "RECENT" },
];

export const ENQUIRY_SOURCE_DATA = [
  { month: "Jun", website: 68, referrals: 32, label: "START" },
  { month: "Jul", website: 54, referrals: 36 },
  { month: "Aug", website: 48, referrals: 40 },
  { month: "Sep", website: 72, referrals: 46, label: "MIDPOINT" },
  { month: "Oct", website: 64, referrals: 48 },
  { month: "Nov", website: 88, referrals: 54, label: "RECENT" },
];

export const COURSE_ENROLLMENT_DATA = [
  { course: "Digital Marketing", enrolled: 184, capacity: 200, label: "START" },
  { course: "Data Analytics", enrolled: 156, capacity: 180 },
  { course: "UI/UX Design", enrolled: 128, capacity: 150 },
  { course: "Full Stack Dev", enrolled: 142, capacity: 160, label: "MIDPOINT" },
  { course: "AI & ML", enrolled: 175, capacity: 200 },
  { course: "Cybersecurity", enrolled: 110, capacity: 140, label: "RECENT" },
];

export const REVENUE_DATA = [
  { month: "Jun", collected: 8.5, projected: 10.2, label: "START" },
  { month: "Jul", collected: 11.0, projected: 12.5 },
  { month: "Aug", collected: 12.8, projected: 14.0 },
  { month: "Sep", collected: 15.6, projected: 16.5, label: "MIDPOINT" },
  { month: "Oct", collected: 14.8, projected: 17.0 },
  { month: "Nov", collected: 19.2, projected: 21.0, label: "RECENT" },
];

export const FOLLOWUP_PERFORMANCE_DATA = [
  { month: "Jun", completed: 85, planned: 95, label: "START" },
  { month: "Jul", completed: 110, planned: 118 },
  { month: "Aug", completed: 125, planned: 130 },
  { month: "Sep", completed: 140, planned: 150, label: "MIDPOINT" },
  { month: "Oct", completed: 152, planned: 160 },
  { month: "Nov", completed: 168, planned: 175, label: "RECENT" },
];

export interface LeadItem {
  id: string;
  leadCode: string;
  studentName: string;
  phoneNumber: string;
  interestedCourse: string;
  leadSource: string;
  assignedCounselor: string;
  followUpDate: string;
  status: "New" | "Contacted" | "Interested" | "Follow-up" | "Converted";
}

export const SAMPLE_LEADS: LeadItem[] = [
  {
    id: "1",
    leadCode: "LD-2401",
    studentName: "Aarav Sharma",
    phoneNumber: "+91 98765 43210",
    interestedCourse: "Digital Marketing",
    leadSource: "Website",
    assignedCounselor: "Priya Nair",
    followUpDate: "18 Nov 2026",
    status: "New",
  },
  {
    id: "2",
    leadCode: "LD-2402",
    studentName: "Ananya Rao",
    phoneNumber: "+91 98450 32198",
    interestedCourse: "Data Analytics",
    leadSource: "Referral",
    assignedCounselor: "Rahul Mehta",
    followUpDate: "19 Nov 2026",
    status: "Contacted",
  },
  {
    id: "3",
    leadCode: "LD-2403",
    studentName: "Rohan Patel",
    phoneNumber: "+91 98220 65431",
    interestedCourse: "UI/UX Design",
    leadSource: "Social media",
    assignedCounselor: "Sneha Iyer",
    followUpDate: "20 Nov 2026",
    status: "Interested",
  },
  {
    id: "4",
    leadCode: "LD-2404",
    studentName: "Meera Krishnan",
    phoneNumber: "+91 99001 45678",
    interestedCourse: "Full-stack Development",
    leadSource: "Website",
    assignedCounselor: "Priya Nair",
    followUpDate: "21 Nov 2026",
    status: "Follow-up",
  },
  {
    id: "5",
    leadCode: "LD-2405",
    studentName: "Kabir Sethi",
    phoneNumber: "+91 98111 78342",
    interestedCourse: "Digital Marketing",
    leadSource: "Event",
    assignedCounselor: "Rahul Mehta",
    followUpDate: "16 Nov 2026",
    status: "Converted",
  },
  {
    id: "6",
    leadCode: "LD-2406",
    studentName: "Tanvi Verma",
    phoneNumber: "+91 98334 11223",
    interestedCourse: "Data Analytics",
    leadSource: "Website",
    assignedCounselor: "Sneha Iyer",
    followUpDate: "22 Nov 2026",
    status: "Contacted",
  },
  {
    id: "7",
    leadCode: "LD-2407",
    studentName: "Aditya Deshmukh",
    phoneNumber: "+91 97665 44332",
    interestedCourse: "UI/UX Design",
    leadSource: "Direct Walk-in",
    assignedCounselor: "Priya Nair",
    followUpDate: "23 Nov 2026",
    status: "New",
  },
];

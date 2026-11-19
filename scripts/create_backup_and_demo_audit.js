/**
 * NEXT GEN DMA VENTURES CRM — FRESH-START BACKUP & DEMO-DATA AUDIT SCRIPT
 * 
 * Performs:
 * 1. Live extraction and verification of a fresh backup for all 22 Supabase tables.
 * 2. Manifest generation with SHA-256 checksums and record counts.
 * 3. Deep audit of demo records across all 16 CRM modules.
 * 4. Staff identification: STF-101 (Rajesh Khanna) preservation vs demo staff.
 * 5. Course, Batch, and Settings identification for review.
 * 6. Foreign-key dependency graph and topological deletion order.
 * 7. Before vs. after record count calculations.
 * 
 * CRITICAL SAFETY: READ-ONLY AUDIT & BACKUP. NO WRITES/DELETES TO DATABASE.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] ? match[2].trim() : '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[match[1]] = val;
      }
    });
  }
}
loadEnv();

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('FATAL: Supabase credentials missing in .env.local');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ALL_22_TABLES = [
  'courses',
  'batches',
  'staff',
  'leads',
  'enquiries',
  'follow_ups',
  'students',
  'admissions',
  'payments',
  'installments',
  'attendance_sessions',
  'attendance_records',
  'counselling_sessions',
  'placement_companies',
  'placement_jobs',
  'placement_profiles',
  'placement_applications',
  'placement_offers',
  'notifications',
  'notification_settings',
  'audit_logs',
  'system_settings',
];

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function runBackupAndAudit() {
  console.log('='.repeat(80));
  console.log(' NEXT GEN DMA VENTURES CRM — FRESH-START BACKUP & DEMO-DATA AUDIT');
  console.log('='.repeat(80));
  console.log(`Connected to Supabase Project: ${supabaseUrl.replace(/https?:\/\//, '')}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const timestamp = Date.now();
  const backupDirName = `fresh_start_backup_${timestamp}`;
  const backupDirPath = path.join(process.cwd(), 'data', 'backups', backupDirName);

  if (!fs.existsSync(backupDirPath)) {
    fs.mkdirSync(backupDirPath, { recursive: true });
  }

  console.log(`\n--- STEP 1: Creating Verified Backup in ${backupDirPath} ---`);

  const manifest = {
    backupTimestamp: new Date().toISOString(),
    backupEpoch: timestamp,
    supabaseUrl: supabaseUrl,
    tables: {},
    totalTables: 22,
    totalRecords: 0
  };

  const tableDataMap = {};
  let totalRecordsBackedUp = 0;

  for (const table of ALL_22_TABLES) {
    const { data, error, count } = await client
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`FAILED to fetch table "${table}":`, error.message);
      process.exit(1);
    }

    const rows = data || [];
    tableDataMap[table] = rows;
    totalRecordsBackedUp += rows.length;

    const jsonContent = JSON.stringify(rows, null, 2);
    const filePath = path.join(backupDirPath, `${table}.json`);
    fs.writeFileSync(filePath, jsonContent, 'utf8');

    const checksum = sha256(jsonContent);

    // Verify written file
    const readBack = fs.readFileSync(filePath, 'utf8');
    const readBackCheck = sha256(readBack);
    if (checksum !== readBackCheck) {
      console.error(`Verification checksum mismatch for ${table}!`);
      process.exit(1);
    }

    manifest.tables[table] = {
      recordCount: rows.length,
      file: `${table}.json`,
      bytes: Buffer.byteLength(jsonContent, 'utf8'),
      sha256: checksum
    };

    console.log(`  [OK] Table ${table.padEnd(24)} -> ${rows.length.toString().padStart(4)} records saved (SHA-256: ${checksum.substring(0, 12)}...)`);
  }

  manifest.totalRecords = totalRecordsBackedUp;
  const manifestPath = path.join(backupDirPath, 'backup_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\nBackup Complete: ${totalRecordsBackedUp} records across 22 tables backed up & checksum-verified.`);
  console.log(`Manifest written to: ${manifestPath}`);

  // --- STEP 2: Current Table Record Counts ---
  console.log('\n--- STEP 2: Current Record Counts Across All 22 Tables ---');
  console.log('-'.repeat(60));
  console.log(`| ${'Table Name'.padEnd(26)} | ${'Record Count'.padStart(14)} | Status      |`);
  console.log('-'.repeat(60));
  for (const table of ALL_22_TABLES) {
    const count = tableDataMap[table].length;
    console.log(`| ${table.padEnd(26)} | ${count.toString().padStart(14)} | ${'Active'.padEnd(11)} |`);
  }
  console.log('-'.repeat(60));
  console.log(`| ${'TOTAL RECORDS'.padEnd(26)} | ${totalRecordsBackedUp.toString().padStart(14)} |             |`);
  console.log('-'.repeat(60));

  // --- STEP 3: Demo Business Records Audit ---
  console.log('\n--- STEP 3: Demo Business Records Audit ---');

  // Leads
  const leads = tableDataMap['leads'];
  console.log(`\n• Leads (${leads.length} records):`);
  leads.forEach(l => console.log(`   - [${l.id}] ${l.student_name || l.full_name || 'N/A'} | Phone: ${l.phone_number} | Course: ${l.interested_course || l.course_interested || 'N/A'} | Status: ${l.status}`));

  // Enquiries
  const enquiries = tableDataMap['enquiries'];
  console.log(`\n• Enquiries (${enquiries.length} records):`);
  enquiries.forEach(e => console.log(`   - [${e.id}] ${e.student_name || e.candidate_name || 'N/A'} | Program: ${e.interested_course || 'N/A'} | Status: ${e.status || e.enquiry_status}`));

  // Follow-ups
  const followUps = tableDataMap['follow_ups'];
  console.log(`\n• Follow-ups (${followUps.length} records):`);
  followUps.forEach(f => console.log(`   - [${f.id}] Student: ${f.student_name || 'N/A'} | Status: ${f.status} | Scheduled: ${f.follow_up_date || f.scheduled_date}`));

  // Students
  const students = tableDataMap['students'];
  console.log(`\n• Students (${students.length} records):`);
  students.forEach(s => console.log(`   - [${s.id}] ${s.full_name || s.student_name} | Email: ${s.email} | Course: ${s.course} | Status: ${s.status || s.enrollment_status}`));

  // Admissions
  const admissions = tableDataMap['admissions'];
  console.log(`\n• Admissions (${admissions.length} records):`);
  admissions.forEach(a => console.log(`   - [${a.id}] Student: ${a.student_name} (${a.student_id}) | Course: ${a.course_name} | Batch: ${a.batch_code} | Total Fee: ₹${a.total_fee || a.total_fees}`));

  // Payments & Installments
  const payments = tableDataMap['payments'];
  const installments = tableDataMap['installments'];
  console.log(`\n• Payments (${payments.length} records) & Installments (${installments.length} records):`);
  payments.forEach(p => console.log(`   - Payment [${p.id}] Receipt: ${p.receipt_no} | Student: ${p.student_name} | Amount: ₹${p.amount} | Method: ${p.payment_method}`));
  installments.forEach(i => console.log(`   - Installment [${i.id}] Student: ${i.student_name} | Course: ${i.course_name} | Paid: ₹${i.paid_amount} | Pending: ₹${i.pending_amount}`));

  // Attendance
  const attSessions = tableDataMap['attendance_sessions'];
  const attRecords = tableDataMap['attendance_records'];
  console.log(`\n• Attendance Sessions (${attSessions.length} records) & Records (${attRecords.length} records):`);
  attSessions.forEach(as => console.log(`   - Session [${as.id}] Batch: ${as.batch_code} | Date: ${as.date || as.session_date} | Trainer: ${as.trainer || as.trainer_name}`));

  // Counselling
  const counselling = tableDataMap['counselling_sessions'];
  console.log(`\n• Counselling Sessions (${counselling.length} records):`);
  counselling.forEach(c => console.log(`   - [${c.id}] Candidate: ${c.person_name || c.candidate_name} | Counsellor: ${c.assigned_counsellor || c.counsellor_name} | Status: ${c.status}`));

  // Placements
  const pCompanies = tableDataMap['placement_companies'];
  const pJobs = tableDataMap['placement_jobs'];
  const pProfiles = tableDataMap['placement_profiles'];
  const pApps = tableDataMap['placement_applications'];
  const pOffers = tableDataMap['placement_offers'];
  console.log(`\n• Placements Module (${pCompanies.length + pJobs.length + pProfiles.length + pApps.length + pOffers.length} records total):`);
  console.log(`   - Companies (${pCompanies.length}): ${pCompanies.map(c => `${c.id} (${c.name})`).join(', ')}`);
  console.log(`   - Jobs (${pJobs.length}): ${pJobs.map(j => `${j.id} (${j.job_title || j.title || 'N/A'})`).join(', ')}`);
  console.log(`   - Profiles (${pProfiles.length}): ${pProfiles.map(p => `${p.student_id}`).join(', ')}`);
  console.log(`   - Applications (${pApps.length}): ${pApps.map(a => `${a.id} (Job: ${a.job_id}, Student: ${a.student_id})`).join(', ')}`);
  console.log(`   - Offers (${pOffers.length}): ${pOffers.map(o => `${o.id} (Pkg: ₹${o.package_lpa || o.package_ctc || 'N/A'} LPA, Student: ${o.student_name || o.student_id})`).join(', ')}`);

  // Notifications
  const notifications = tableDataMap['notifications'];
  console.log(`\n• Notifications (${notifications.length} records): Sample: ${notifications.slice(0, 3).map(n => `[${n.id}] ${n.title}`).join('; ')}...`);

  // --- STEP 4: Staff Accounts Audit (STF-101 vs Demo Staff) ---
  console.log('\n--- STEP 4: Staff Accounts Audit ---');
  const staff = tableDataMap['staff'];
  const superAdmin = staff.find(s => s.id === 'STF-101' || s.email === 'rajesh.khanna@nextgendma.com');
  const demoStaff = staff.filter(s => s.id !== 'STF-101' && s.email !== 'rajesh.khanna@nextgendma.com');

  console.log(`\n[PRESERVED SUPER ADMIN]`);
  if (superAdmin) {
    console.log(`  -> ID: ${superAdmin.id} | Name: ${superAdmin.full_name} | Role: ${superAdmin.role} | Email: ${superAdmin.email} | Status: ${superAdmin.employment_status}`);
  } else {
    console.error('  WARNING: STF-101 not found!');
  }

  console.log(`\n[DEMO STAFF ACCOUNTS TO CLEANUP: ${demoStaff.length} records]`);
  demoStaff.forEach(s => {
    console.log(`  - [${s.id}] ${(s.full_name || '').padEnd(20)} | Role: ${(s.role || '').padEnd(18)} | Email: ${s.email}`);
  });

  // --- STEP 5: Courses, Batches, and Settings Review ---
  console.log('\n--- STEP 5: Courses, Batches, and Settings Review ---');
  const courses = tableDataMap['courses'];
  const batches = tableDataMap['batches'];
  const sysSettings = tableDataMap['system_settings'];
  const notifSettings = tableDataMap['notification_settings'];
  const auditLogs = tableDataMap['audit_logs'];

  console.log(`\n• Course Definitions (${courses.length} records):`);
  courses.forEach(c => console.log(`   - [${c.id}] ${(c.course_name || c.title || '').padEnd(35)} | Category: ${(c.category || '').padEnd(20)} | Fee: ₹${c.total_fee || c.fees} | Status: ${c.status}`));

  console.log(`\n• Batches (${batches.length} records):`);
  batches.forEach(b => console.log(`   - [${b.id}] ${(b.batch_code || '').padEnd(15)} | Course: ${(b.course_name || '').padEnd(25)} | Trainer: ${(b.trainer || b.trainer_name || '').padEnd(20)} | Status: ${b.status}`));

  console.log(`\n• Configuration & System State:`);
  console.log(`   - system_settings (${sysSettings.length} record): Institutional branding, academic rules, database config`);
  console.log(`   - notification_settings (${notifSettings.length} record): Alert thresholds, email/SMS dispatch preferences`);
  console.log(`   - audit_logs (${auditLogs.length} record): Pre-existing operational audit records`);

  // --- STEP 6: Foreign Key Dependency Graph & Safe Deletion Order ---
  console.log('\n--- STEP 6: Foreign Key Dependencies & Topological Deletion Order ---');
  console.log(`
  Foreign Key Graph:
  - attendance_records   --> session_id (attendance_sessions), student_id (students)
  - attendance_sessions  --> batch_id (batches) [soft or unconstrained]
  - installments         --> admission_id (admissions), student_id (students)
  - payments             --> admission_id (admissions), student_id (students)
  - admissions           --> student_id (students), course_id (courses), batch_id (batches)
  - placement_offers     --> student_id (students), application_id (placement_applications)
  - placement_applications --> job_id (placement_jobs), student_id (students), company_id (placement_companies)
  - placement_jobs       --> company_id (placement_companies)
  - placement_profiles   --> student_id (students)
  - follow_ups           --> linked_lead_id (leads), linked_enquiry_id (enquiries)
  - enquiries            --> converted_to_lead_id (leads)
  - students             --> lead_id (leads) [if any]

  Recommended Safe Deletion Order (Child tables cleared first):
  1.  attendance_records         (depends on attendance_sessions, students)
  2.  attendance_sessions        (parent of attendance_records)
  3.  placement_offers           (depends on placement_applications, students)
  4.  placement_applications     (depends on placement_jobs, placement_companies, students)
  5.  placement_jobs             (depends on placement_companies)
  6.  placement_profiles         (depends on students)
  7.  placement_companies        (referenced by placement_jobs/applications)
  8.  installments               (depends on admissions, students)
  9.  payments                   (depends on admissions, students)
  10. admissions                 (depends on students, courses, batches)
  11. students                   (referenced by admissions, payments, attendance, placements)
  12. follow_ups                 (depends on leads, enquiries)
  13. enquiries                  (depends on leads)
  14. leads                      (referenced by enquiries, follow_ups)
  15. counselling_sessions       (independent candidate sessions)
  16. notifications              (operational alert messages)
  17. staff (DEMO accounts only) (delete STF-102 through STF-115; preserve STF-101)
  18. Optional: batches          (if wiping demo batch schedule)
  19. Optional: courses          (if wiping demo curriculum)
  20. Optional: audit_logs       (if resetting audit trail)
  `);

  // --- STEP 7: Expected Remaining Record Counts ---
  console.log('\n--- STEP 7: Expected Remaining Record Counts After Cleanup ---');

  console.log('\nScenario A: Standard Clean Slate (Keep Course Curriculum & System Configurations, Preserve STF-101 Super Admin):');
  console.log('-'.repeat(60));
  console.log(`| ${'Table Name'.padEnd(26)} | ${'Current'.padStart(8)} | ${'Delete'.padStart(8)} | ${'Remaining'.padStart(9)} |`);
  console.log('-'.repeat(60));

  const scenarioA = {
    attendance_records: 0,
    attendance_sessions: 0,
    placement_offers: 0,
    placement_applications: 0,
    placement_jobs: 0,
    placement_profiles: 0,
    placement_companies: 0,
    installments: 0,
    payments: 0,
    admissions: 0,
    students: 0,
    follow_ups: 0,
    enquiries: 0,
    leads: 0,
    counselling_sessions: 0,
    notifications: 0,
    staff: 1, // STF-101 Rajesh Khanna only
    courses: courses.length, // 6 courses preserved
    batches: 0, // Batches cleared or optionally preserved
    system_settings: 1,
    notification_settings: 1,
    audit_logs: 1 // or 0
  };

  let totalDelA = 0;
  let totalRemA = 0;

  for (const table of ALL_22_TABLES) {
    const cur = tableDataMap[table].length;
    let rem = 0;
    if (table === 'staff') rem = 1;
    else if (table === 'courses') rem = cur; // preserve courses
    else if (table === 'system_settings' || table === 'notification_settings' || table === 'audit_logs') rem = cur;
    else rem = 0;

    const del = cur - rem;
    totalDelA += del;
    totalRemA += rem;
    console.log(`| ${table.padEnd(26)} | ${cur.toString().padStart(8)} | ${del.toString().padStart(8)} | ${rem.toString().padStart(9)} |`);
  }
  console.log('-'.repeat(60));
  console.log(`| ${'TOTALS'.padEnd(26)} | ${totalRecordsBackedUp.toString().padStart(8)} | ${totalDelA.toString().padStart(8)} | ${totalRemA.toString().padStart(9)} |`);
  console.log('-'.repeat(60));

  console.log('\n' + '='.repeat(80));
  console.log(' AUDIT STATUS: COMPLETE');
  console.log(' DATABASE STATE: 100% UNMODIFIED. ZERO DELETIONS PERFORMED.');
  console.log(' AWAITING EXPLICIT USER APPROVAL BEFORE CLEANUP EXECUTION.');
  console.log('='.repeat(80) + '\n');
}

runBackupAndAudit().catch(err => {
  console.error('[FATAL] Script error:', err);
  process.exit(1);
});

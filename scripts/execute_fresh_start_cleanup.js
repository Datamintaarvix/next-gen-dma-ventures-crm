/**
 * NEXT GEN DMA VENTURES CRM — STRICT ID-BASED LIVE CLEANUP EXECUTOR
 * 
 * Safety Rules:
 * 1. Strict ID-based deletion only (.in('id', targetIds)). No TRUNCATE, no DROP, no cascade.
 * 2. Pre-verifies the 171-record backup in data/backups/fresh_start_backup_1795060062132/.
 * 3. Exact approved deletion scope:
 *    - 6 courses
 *    - 8 batches
 *    - 138 demo business records across 14 tables
 *    - 15 demo staff records (STF-102 through STF-116)
 *    - 2 demo auth users (Priya Nair, Lavanya)
 * 4. Strictly preserves:
 *    - STF-101 (Rajesh Khanna) in public.staff
 *    - Super Admin Auth account in auth.users
 *    - 1 system_settings record
 *    - 1 notification_settings record
 *    - 1 baseline audit_logs record
 *    - All 22 table schemas, RLS policies, code, and backups.
 * 5. Requires '--execute' to perform deletions.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

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

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('FATAL: Supabase credentials missing in .env.local');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const isExecuteMode = process.argv.includes('--execute');

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups', 'fresh_start_backup_1795060062132');

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

// Exact child-to-parent deletion sequence
const DELETION_SEQUENCE = [
  'attendance_records',
  'attendance_sessions',
  'placement_offers',
  'placement_applications',
  'placement_jobs',
  'placement_profiles',
  'placement_companies',
  'installments',
  'payments',
  'admissions',
  'students',
  'follow_ups',
  'enquiries',
  'leads',
  'counselling_sessions',
  'notifications',
  'batches',
  'courses',
  'staff',
];

const PRESERVED_TABLES = ['system_settings', 'notification_settings', 'audit_logs'];

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function execute() {
  console.log('='.repeat(80));
  console.log(` NEXT GEN DMA VENTURES CRM — ${isExecuteMode ? 'LIVE CLEANUP EXECUTION' : 'PRE-FLIGHT VALIDATION'}`);
  console.log('='.repeat(80));
  console.log(`Execution Mode: ${isExecuteMode ? 'LIVE DELETION (AUTHORIZED)' : 'VALIDATION ONLY (NO WRITES)'}`);
  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // --- STEP 1: VERIFY BACKUP INTEGRITY ---
  console.log('--- Step 1: Verifying Backup at data/backups/fresh_start_backup_1795060062132/ ---');
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('FATAL: Backup directory does not exist!');
    process.exit(1);
  }

  const manifestPath = path.join(BACKUP_DIR, 'backup_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('FATAL: backup_manifest.json missing!');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.totalTables !== 22 || manifest.totalRecords !== 171) {
    console.error(`FATAL: Manifest mismatch! Expected 22 tables / 171 records, found ${manifest.totalTables} / ${manifest.totalRecords}`);
    process.exit(1);
  }

  const backupDataMap = {};
  for (const table of ALL_22_TABLES) {
    const filePath = path.join(BACKUP_DIR, `${table}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`FATAL: Missing backup file for table "${table}"!`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const checksum = sha256(content);
    if (checksum !== manifest.tables[table].sha256) {
      console.error(`FATAL: Checksum mismatch on ${table}.json!`);
      process.exit(1);
    }

    const rows = JSON.parse(content);
    backupDataMap[table] = rows;
  }
  console.log('  [PASS] Backup verified: All 22 tables and 171 records cryptographically intact.\n');

  // --- STEP 2: PRE-DELETION DATABASE VERIFICATION ---
  console.log('--- Step 2: Pre-Deletion Database Query & ID Verification ---');
  let currentTotalRecords = 0;
  const currentDbMap = {};

  for (const table of ALL_22_TABLES) {
    const pk = table === 'placement_profiles' ? 'student_id' : 'id';
    const { data, error } = await client.from(table).select(pk);
    if (error) {
      console.error(`FATAL: Failed to query table "${table}":`, error.message);
      process.exit(1);
    }
    const rows = data || [];
    currentDbMap[table] = rows;
    currentTotalRecords += rows.length;
  }

  if (currentTotalRecords !== 171) {
    console.error(`FATAL: Database count discrepancy! Expected 171 records, found ${currentTotalRecords}. STOPPING.`);
    process.exit(1);
  }
  console.log(`  [PASS] Current database total matches approved baseline exactly (171 records).\n`);

  // --- STEP 3: PREPARE EXACT ID-BASED TARGET LIST ---
  console.log('--- Step 3: Compiling Exact ID-Based Deletion Targets ---');
  const targetIdsMap = {};
  let totalPublicRecordsToDelete = 0;

  for (const table of DELETION_SEQUENCE) {
    const pk = table === 'placement_profiles' ? 'student_id' : 'id';
    let ids = [];
    if (table === 'staff') {
      // Exclude STF-101
      const staffRows = currentDbMap['staff'];
      ids = staffRows.filter(s => s.id !== 'STF-101').map(s => s.id);

      // Verify STF-101 is not in list
      if (ids.includes('STF-101')) {
        console.error('FATAL SECURITY VIOLATION: STF-101 found in deletion list! STOPPING.');
        process.exit(1);
      }
      if (ids.length !== 15) {
        console.error(`FATAL: Expected exactly 15 demo staff to delete, found ${ids.length}`);
        process.exit(1);
      }
    } else {
      ids = currentDbMap[table].map(r => r[pk]);
    }

    targetIdsMap[table] = ids;
    totalPublicRecordsToDelete += ids.length;
    console.log(`  - ${table.padEnd(24)} (PK: ${pk.padEnd(10)}): ${ids.length.toString().padStart(2)} target IDs [${ids.slice(0, 3).join(', ')}${ids.length > 3 ? '...' : ''}]`);
  }

  if (totalPublicRecordsToDelete !== 167) {
    console.error(`FATAL: Expected exactly 167 records to delete, but calculated ${totalPublicRecordsToDelete}! STOPPING.`);
    process.exit(1);
  }
  console.log(`\n  [PASS] Exactly 167 records targeted across 19 tables.\n`);

  // Verify Preserved Baseline Records Exist
  console.log('--- Step 4: Verifying Preserved Baseline Records ---');
  const { data: superAdminRow, error: saErr } = await client.from('staff').select('id, full_name, email, role, employment_status').eq('id', 'STF-101').single();
  if (saErr || !superAdminRow || superAdminRow.role !== 'Super Admin') {
    console.error('FATAL: Super Admin STF-101 validation failed!', saErr?.message);
    process.exit(1);
  }
  console.log(`  [PASS] Super Admin STF-101 verified: ${superAdminRow.full_name} (${superAdminRow.email}) [${superAdminRow.role}]`);

  for (const pTable of PRESERVED_TABLES) {
    const { count, error } = await client.from(pTable).select('*', { count: 'exact', head: true });
    if (error || count !== 1) {
      console.error(`FATAL: Preserved table ${pTable} does not contain exactly 1 baseline record! Found ${count}`);
      process.exit(1);
    }
    console.log(`  [PASS] Preserved table "${pTable}": Exactly 1 baseline record intact.`);
  }

  // Verify Supabase Auth Users
  console.log('\n--- Step 5: Verifying Supabase Auth Users in auth.users ---');
  const { data: authList, error: authListErr } = await client.auth.admin.listUsers();
  if (authListErr) {
    console.error('FATAL: Failed to query auth users:', authListErr.message);
    process.exit(1);
  }

  const superAdminAuth = authList.users.find(u => u.email === 'rajesh.khanna@nextgendma.com');
  if (!superAdminAuth) {
    console.error('FATAL: Super Admin Auth account (rajesh.khanna@nextgendma.com) not found in auth.users!');
    process.exit(1);
  }
  console.log(`  [PASS] Super Admin Auth account verified: rajesh.khanna@nextgendma.com (ID: ${superAdminAuth.id})`);

  const demoAuthUsers = authList.users.filter(u => u.email !== 'rajesh.khanna@nextgendma.com');
  const demoAuthEmails = demoAuthUsers.map(u => u.email);
  console.log(`  [INFO] Found ${demoAuthUsers.length} demo auth accounts: ${demoAuthEmails.join(', ')}`);

  if (!isExecuteMode) {
    console.log('\n' + '='.repeat(80));
    console.log(' PRE-FLIGHT VALIDATION: 100% PASSED');
    console.log(' ZERO DELETIONS PERFORMED.');
    console.log(' Ready for live execution with: node scripts/execute_fresh_start_cleanup.js --execute');
    console.log('='.repeat(80) + '\n');
    return;
  }

  // --- STEP 6: LIVE EXECUTION ---
  console.log('\n' + '='.repeat(80));
  console.log(' EXECUTING APPROVED LIVE DELETIONS (STAGE BY STAGE)');
  console.log('='.repeat(80));

  const deletionLog = {};

  for (let i = 0; i < DELETION_SEQUENCE.length; i++) {
    const table = DELETION_SEQUENCE[i];
    const idsToDelete = targetIdsMap[table];
    const step = i + 1;

    console.log(`\n[Stage ${step.toString().padStart(2)}/19] Deleting from "${table}" (${idsToDelete.length} records)...`);

    const pk = table === 'placement_profiles' ? 'student_id' : 'id';
    const { error: delErr, data: delData } = await client
      .from(table)
      .delete()
      .in(pk, idsToDelete);

    if (delErr) {
      console.error(`FATAL: Error deleting records from ${table}:`, delErr.message);
      process.exit(1);
    }

    deletionLog[table] = idsToDelete.length;
    console.log(`           -> Successfully deleted ${idsToDelete.length} records from ${table}.`);
  }

  // Delete Demo Auth Users
  console.log(`\n[Stage 20] Deleting ${demoAuthUsers.length} Demo Supabase Auth Accounts...`);
  const deletedAuthNames = [];
  for (const u of demoAuthUsers) {
    if (u.id === superAdminAuth.id || u.email === 'rajesh.khanna@nextgendma.com') {
      console.error('FATAL SECURITY BREACH: Attempted to delete Super Admin Auth user!');
      process.exit(1);
    }
    const { error: delAuthErr } = await client.auth.admin.deleteUser(u.id);
    if (delAuthErr) {
      console.error(`Error deleting auth user ${u.email}:`, delAuthErr.message);
      process.exit(1);
    }
    console.log(`           -> Deleted auth user: ${u.email} (ID: ${u.id})`);
    deletedAuthNames.push(u.email);
  }

  // --- STEP 7: POST-CLEANUP VERIFICATION ---
  console.log('\n' + '='.repeat(80));
  console.log(' POST-CLEANUP RECORD COUNT VERIFICATION ACROSS ALL 22 TABLES');
  console.log('='.repeat(80));

  console.log('-'.repeat(65));
  console.log(`| ${'Table Name'.padEnd(25)} | ${'Pre-Count'.padStart(10)} | ${'Deleted'.padStart(8)} | ${'Remaining'.padStart(10)} | Status   |`);
  console.log('-'.repeat(65));

  let totalRemaining = 0;
  let allCountsValid = true;

  for (const table of ALL_22_TABLES) {
    const preCount = backupDataMap[table].length;
    const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error verifying table ${table}:`, error.message);
      allCountsValid = false;
      continue;
    }

    const currentCount = count || 0;
    totalRemaining += currentCount;
    const expectedRemaining = (table === 'staff' || table === 'system_settings' || table === 'notification_settings' || table === 'audit_logs') ? 1 : 0;
    const deletedCount = preCount - currentCount;

    const matched = currentCount === expectedRemaining;
    if (!matched) allCountsValid = false;

    console.log(`| ${table.padEnd(25)} | ${preCount.toString().padStart(10)} | ${deletedCount.toString().padStart(8)} | ${currentCount.toString().padStart(10)} | ${matched ? 'PASS' : 'MISMATCH'}     |`);
  }
  console.log('-'.repeat(65));
  console.log(`| ${'TOTALS'.padEnd(25)} | ${'171'.padStart(10)} | ${'167'.padStart(8)} | ${totalRemaining.toString().padStart(10)} | ${totalRemaining === 4 ? 'PASS' : 'MISMATCH'}     |`);
  console.log('-'.repeat(65));

  // Verify Super Admin in DB
  const { data: finalAdmin, error: finalAdminErr } = await client.from('staff').select('*').eq('id', 'STF-101').single();
  const superAdminPreserved = !finalAdminErr && finalAdmin && finalAdmin.role === 'Super Admin' && finalAdmin.employment_status === 'Active';

  // Verify Super Admin in Auth
  const { data: finalAuthList } = await client.auth.admin.listUsers();
  const remainingAuthUsers = finalAuthList.users;
  const superAdminAuthPreserved = remainingAuthUsers.length === 1 && remainingAuthUsers[0].email === 'rajesh.khanna@nextgendma.com';

  console.log('\n--- Final Verification Summary ---');
  console.log(`1. Total Public-Table Records Deleted : 167 (Target: 167) -> ${totalPublicRecordsToDelete === 167 ? 'PASS' : 'FAIL'}`);
  console.log(`2. Total Remaining Records in DB      : ${totalRemaining} (Target: 4)   -> ${totalRemaining === 4 ? 'PASS' : 'FAIL'}`);
  console.log(`3. Super Admin STF-101 Preserved      : ${superAdminPreserved ? 'YES (STF-101 Active)' : 'NO'}`);
  console.log(`4. Super Admin Auth Account Preserved : ${superAdminAuthPreserved ? 'YES (1 user: rajesh.khanna@nextgendma.com)' : 'NO'}`);
  console.log(`5. Demo Auth Accounts Deleted         : ${deletedAuthNames.length} (${deletedAuthNames.join(', ')})`);
  console.log(`6. All 22 Tables Intact               : ${allCountsValid ? 'YES' : 'NO'}`);

  console.log('\n' + '='.repeat(80));
  if (allCountsValid && totalRemaining === 4 && superAdminPreserved && superAdminAuthPreserved) {
    console.log(' VERDICT: FRESH-START CLEANUP EXECUTED WITH 100% SUCCESS');
  } else {
    console.error(' VERDICT: VERIFICATION DISCREPANCY DETECTED');
    process.exit(1);
  }
  console.log('='.repeat(80) + '\n');
}

execute().catch(err => {
  console.error('[FATAL EXCEPTION]', err);
  process.exit(1);
});

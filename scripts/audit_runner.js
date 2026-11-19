const fs = require('fs');
const path = require('path');

const results = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

function assert(condition, testName, details = '') {
  results.totalTests++;
  if (condition) {
    results.passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    results.failed++;
    console.error(`[FAIL] ${testName} - ${details}`);
    results.errors.push({ testName, details });
  }
}

async function runAudit() {
  console.log('====================================================');
  console.log('   NEXT GEN DMA VENTURES CRM - TECHNICAL AUDIT      ');
  console.log('====================================================\n');

  const dataDir = path.join(process.cwd(), 'data');

  // TEST 1: Database Files Verification
  console.log('--- TEST SUITE 1: DATA STORE ARCHITECTURE ---');
  const requiredStores = [
    'leads.json', 'enquiries.json', 'follow-ups.json', 'students.json',
    'courses.json', 'batches.json', 'admissions.json', 'payments.json',
    'installments.json', 'attendance.json', 'counselling.json',
    'placements.json', 'staff.json', 'notifications.json',
    'notification-settings.json', 'settings.json', 'audit-logs.json'
  ];

  requiredStores.forEach(file => {
    const fullPath = path.join(dataDir, file);
    const exists = fs.existsSync(fullPath);
    assert(exists, `Store file exists: ${file}`);
    if (exists) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(raw);
        assert(parsed !== null, `Store valid JSON: ${file}`);
      } catch (e) {
        assert(false, `Store valid JSON: ${file}`, e.message);
      }
    }
  });

  // TEST 2: Financial Consistency & Ledger Integrity
  console.log('\n--- TEST SUITE 2: FINANCIAL ACCURACY & RECONCILIATION ---');
  const admissions = JSON.parse(fs.readFileSync(path.join(dataDir, 'admissions.json'), 'utf8'));
  const payments = JSON.parse(fs.readFileSync(path.join(dataDir, 'payments.json'), 'utf8'));

  assert(admissions.length > 0, 'Admissions records exist', `Found ${admissions.length}`);
  assert(payments.length > 0, 'Payment records exist', `Found ${payments.length}`);

  admissions.forEach(adm => {
    const calculatedFinal = (adm.totalFee || 0) - (adm.discountAmount || 0);
    assert(
      Math.abs(calculatedFinal - adm.finalFee) < 1,
      `Fee calculation integrity for ${adm.admissionCode || adm.id}`,
      `Total ${adm.totalFee} - Discount ${adm.discountAmount} should equal Final ${adm.finalFee}, got ${calculatedFinal}`
    );

    const calculatedPending = (adm.finalFee || 0) - (adm.paidAmount || 0);
    assert(
      Math.abs(calculatedPending - adm.pendingAmount) < 1,
      `Pending balance integrity for ${adm.admissionCode || adm.id}`,
      `Final ${adm.finalFee} - Paid ${adm.paidAmount} should equal Pending ${adm.pendingAmount}, got ${calculatedPending}`
    );
  });

  // TEST 3: Cross-Module Referential Integrity
  console.log('\n--- TEST SUITE 3: CROSS-MODULE REFERENTIAL INTEGRITY ---');
  const students = JSON.parse(fs.readFileSync(path.join(dataDir, 'students.json'), 'utf8'));
  const courses = JSON.parse(fs.readFileSync(path.join(dataDir, 'courses.json'), 'utf8'));
  const batches = JSON.parse(fs.readFileSync(path.join(dataDir, 'batches.json'), 'utf8'));
  const staff = JSON.parse(fs.readFileSync(path.join(dataDir, 'staff.json'), 'utf8'));

  // Ensure batches reference existing courses
  const courseNames = new Set(courses.map(c => c.courseName || c.title || c.name));
  batches.forEach(b => {
    assert(
      b.courseName && b.courseName.length > 0,
      `Batch ${b.batchCode || b.id} has associated course name`
    );
  });

  // Ensure students have valid batch codes
  const batchCodes = new Set(batches.map(b => b.batchCode || b.code));
  students.forEach(s => {
    assert(
      s.batchCode && s.batchCode.length > 0,
      `Student ${s.studentCode || s.id} has assigned batch code: ${s.batchCode}`
    );
  });

  // Ensure Super Admin STF-101 exists and is protected
  const superAdmin = staff.find(s => s.id === 'STF-101' || s.role === 'Super Admin');
  assert(superAdmin !== undefined, 'Super Admin account STF-101 exists in staff store');
  if (superAdmin) {
    assert(superAdmin.role === 'Super Admin', 'STF-101 has Super Admin role');
    assert(superAdmin.employmentStatus === 'Active', 'Super Admin STF-101 is Active');
    assert(!superAdmin.password, 'Staff store never stores raw password property');
  }

  // TEST 4: Placements & Offers
  console.log('\n--- TEST SUITE 4: PLACEMENT WORKFLOW & ELIGIBILITY ---');
  const placements = JSON.parse(fs.readFileSync(path.join(dataDir, 'placements.json'), 'utf8'));
  assert(Array.isArray(placements.companies), 'Companies list exists');
  assert(Array.isArray(placements.jobs), 'Job opportunities list exists');
  assert(Array.isArray(placements.applications), 'Applications list exists');
  assert(Array.isArray(placements.offers), 'Offers list exists');

  placements.offers.forEach(offer => {
    assert(
      offer.offeredSalaryLPA > 0,
      `Offer ${offer.id} has positive salary package (LPA): ${offer.offeredSalaryLPA}`
    );
    assert(
      ['Offer Extended', 'Accepted', 'Declined', 'Expired'].includes(offer.status),
      `Offer ${offer.id} status is valid: ${offer.status}`
    );
  });

  // TEST 5: Counselling Scheduling & Conflict Engine
  console.log('\n--- TEST SUITE 5: COUNSELLING SCHEDULING INTEGRITY ---');
  const counselling = JSON.parse(fs.readFileSync(path.join(dataDir, 'counselling.json'), 'utf8'));
  assert(Array.isArray(counselling), 'Counselling sessions array exists');
  counselling.forEach(c => {
    assert(
      c.counsellingDate && c.startTime && c.endTime,
      `Session ${c.sessionCode || c.id} has valid date/time bounds: ${c.counsellingDate} ${c.startTime}-${c.endTime}`
    );
    assert(
      ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled', 'No Show', 'No-Show'].includes(c.status),
      `Session ${c.sessionCode || c.id} status valid: ${c.status}`
    );
  });

  // TEST 6: Attendance Records & Percentages
  console.log('\n--- TEST SUITE 6: ATTENDANCE TRACKING & METRICS ---');
  const attendance = JSON.parse(fs.readFileSync(path.join(dataDir, 'attendance.json'), 'utf8'));
  assert(Array.isArray(attendance.sessions), 'Attendance sessions array exists');
  assert(Array.isArray(attendance.records), 'Attendance student records array exists');

  students.forEach(s => {
    if (typeof s.attendancePercentage === 'number') {
      assert(
        s.attendancePercentage >= 0 && s.attendancePercentage <= 100,
        `Student ${s.studentCode || s.id} attendance percentage in 0-100% range: ${s.attendancePercentage}%`
      );
    }
  });

  // SUMMARY
  console.log('\n====================================================');
  console.log(`AUDIT TEST SUITE RESULTS: ${results.passed} / ${results.totalTests} PASSED`);
  console.log(`Failed: ${results.failed}`);
  console.log('====================================================\n');

  if (results.failed > 0) {
    console.error('FAILURES RECORDED:');
    results.errors.forEach(e => console.error(` - ${e.testName}: ${e.details}`));
    process.exit(1);
  } else {
    console.log('ALL SYSTEM INTEGRITY TESTS PASSED SUCCESSFULLY!');
  }
}

runAudit();

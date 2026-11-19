const fs = require('fs');
const path = require('path');

const preMigDir = path.join(process.cwd(), 'data', 'backups', 'pre_supabase_migration_1794988769218');
const freshDir = path.join(process.cwd(), 'data', 'backups', 'fresh_start_backup_1795060062132');

const freshFiles = fs.readdirSync(freshDir).filter(f => f.endsWith('.json') && f !== 'backup_manifest.json');

console.log('Comparing Pre-Migration Backup vs Fresh-Start Backup:\n');

let preTotal = 0;
let freshTotal = 0;

for (const f of freshFiles) {
  const freshData = JSON.parse(fs.readFileSync(path.join(freshDir, f), 'utf8'));
  const freshCount = Array.isArray(freshData) ? freshData.length : (typeof freshData === 'object' && freshData !== null ? Object.keys(freshData).length : 0);
  freshTotal += freshCount;
  
  let preCount = 0;
  const preFilePath = path.join(preMigDir, f);
  if (fs.existsSync(preFilePath)) {
    const preData = JSON.parse(fs.readFileSync(preFilePath, 'utf8'));
    preCount = Array.isArray(preData) ? preData.length : (typeof preData === 'object' && preData !== null ? Object.keys(preData).length : 0);
    preTotal += preCount;
  }
  
  if (preCount !== freshCount) {
    console.log(`[MISMATCH] ${f.padEnd(25)} : Pre-migration = ${preCount} vs Fresh = ${freshCount}`);
  } else {
    console.log(`[MATCH]    ${f.padEnd(25)} : Count = ${freshCount}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`Pre-migration Total: ${preTotal}`);
console.log(`Fresh Backup Total:  ${freshTotal}`);
console.log('='.repeat(60));

// Check pre-migration staff
if (fs.existsSync(path.join(preMigDir, 'staff.json'))) {
  const preStaff = JSON.parse(fs.readFileSync(path.join(preMigDir, 'staff.json'), 'utf8'));
  const freshStaff = JSON.parse(fs.readFileSync(path.join(freshDir, 'staff.json'), 'utf8'));
  console.log(`\nPre-migration staff count: ${preStaff.length}`);
  console.log(`Fresh backup staff count:  ${freshStaff.length}`);

  const preIds = new Set(preStaff.map(s => s.id));
  const newStaff = freshStaff.filter(s => !preIds.has(s.id));
  console.log('New staff member added since pre-migration backup:');
  console.log(JSON.stringify(newStaff, null, 2));
}

// Also check leads or other tables

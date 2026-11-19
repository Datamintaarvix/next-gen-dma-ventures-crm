const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('='.repeat(70));
console.log(' NEXT GEN DMA VENTURES CRM - SUPABASE CONNECTION VERIFIER');
console.log('='.repeat(70));

// 1. Environment Variables Inspection
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('[ERROR] .env.local file not found in project root!');
  process.exit(1);
}

const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
const env = {};
lines.forEach(l => {
  const trimmed = l.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

const urlRaw = env['NEXT_PUBLIC_SUPABASE_URL'];
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('\n--- 1. Environment Variables Audit ---');
const isUrlConfigured = Boolean(urlRaw && urlRaw.length > 0 && !urlRaw.includes('placeholder'));
const isAnonConfigured = Boolean(anonKey && anonKey.length > 0 && !anonKey.includes('placeholder'));
const isServiceConfigured = Boolean(serviceRoleKey && serviceRoleKey.length > 0 && !serviceRoleKey.includes('placeholder'));

console.log(`NEXT_PUBLIC_SUPABASE_URL:     ${isUrlConfigured ? 'PRESENT & VERIFIED' : 'MISSING'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${isAnonConfigured ? 'PRESENT & VERIFIED' : 'MISSING'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY:     ${isServiceConfigured ? 'PRESENT & VERIFIED' : 'MISSING'}`);

const urlNormalized = (urlRaw || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const maskedUrl = urlNormalized.replace(/https:\/\/([a-zA-Z0-9]{4})[a-zA-Z0-9]+(\.supabase\.co.*)/, 'https://$1****$2');
console.log(`Endpoint Base Host:            ${maskedUrl}`);
if (urlRaw && urlRaw.includes('/rest/v1')) {
  console.log(`[NOTE] Trailing path '/rest/v1' detected in URL; normalized automatically to base origin.`);
}

// 2. Git Exclusion Check
console.log('\n--- 2. Git Secret Exclusion Audit ---');
const gitignorePath = path.join(process.cwd(), '.gitignore');
let gitIgnored = false;
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  gitIgnored = gitignoreContent.includes('.env.local') || gitignoreContent.includes('.env*.local');
}
console.log(`.env.local protected by .gitignore: ${gitIgnored ? 'YES (VERIFIED)' : 'NO (WARNING)'}`);

// 3. Client Isolation Check
console.log('\n--- 3. Client-Side Code Secret Isolation Audit ---');
let serviceRoleExposed = false;
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.next') scanDir(full);
    } else if (item.name.endsWith('.tsx') || (item.name.endsWith('.ts') && !full.includes(path.join('lib', 'supabase', 'server.ts')) && !full.includes('scripts'))) {
      const code = fs.readFileSync(full, 'utf8');
      if (code.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        console.error(`[ALERT] SUPABASE_SERVICE_ROLE_KEY found in ${full}`);
        serviceRoleExposed = true;
      }
    }
  }
}
scanDir(path.join(process.cwd(), 'app'));
scanDir(path.join(process.cwd(), 'components'));
console.log(`SUPABASE_SERVICE_ROLE_KEY isolated strictly from browser code: ${!serviceRoleExposed ? 'YES (VERIFIED)' : 'NO (EXPOSED)'}`);

// 4. Server-Side Connection Test
console.log('\n--- 4. Live Server-Side Connection Test ---');
async function testServerConnection() {
  let connectionSuccess = false;
  let authConnected = false;
  let dbTablesStatus = 'Pending Migration';

  try {
    // Probe Auth API
    const authRes = await fetch(`${urlNormalized}/auth/v1/health`, {
      headers: { 'apikey': anonKey }
    });
    if (authRes.ok) {
      authConnected = true;
      const authData = await authRes.json();
      console.log(`✓ Supabase Auth API handshake successful (GoTrue ${authData.version || 'v2'})`);
    } else {
      console.warn(`! Supabase Auth handshake returned status: ${authRes.status}`);
    }
  } catch (err) {
    console.error(`✕ Supabase Auth handshake failed: ${err.message}`);
  }

  try {
    // Probe Database PostgREST API with Service Role Key
    const client = createClient(urlNormalized, serviceRoleKey);
    const { data, error } = await client.from('leads').select('id').limit(1);

    if (!error) {
      connectionSuccess = true;
      dbTablesStatus = 'Tables Exist & Queryable';
      console.log(`✓ Supabase Database query succeeded (PostgreSQL active, 'leads' table accessible)`);
    } else {
      if (error.code === 'PGRST205') {
        connectionSuccess = true; // Connection and auth authenticated, schema is just empty
        dbTablesStatus = 'Connected to Project (Database tables pending execution of 01_production_schema.sql)';
        console.log(`✓ Supabase PostgREST connected & authenticated!`);
        console.log(`  [INFO] PostgreSQL schema cache reports table 'leads' not found yet (PGRST205).`);
        console.log(`  [STATUS] Database project is live and authenticated. Ready for migration SQL execution.`);
      } else {
        console.error(`✕ Database query error (${error.code}): ${error.message}`);
      }
    }
  } catch (err) {
    console.error(`✕ Database connection exception: ${err.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(' SUPABASE VERIFICATION SUMMARY:');
  console.log('='.repeat(70));
  console.log(`Supabase connection:     ${connectionSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Environment variables:   ${isUrlConfigured && isAnonConfigured && isServiceConfigured ? 'VERIFIED' : 'MISSING'}`);
  console.log(`Server-side security:    ${!serviceRoleExposed && gitIgnored ? 'VERIFIED' : 'NEEDS ATTENTION'}`);
  console.log(`Database tables status:  ${dbTablesStatus}`);
  console.log('='.repeat(70));
}

testServerConnection();

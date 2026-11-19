const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('[ERROR] .env.local does not exist!');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/);
const env = {};

lines.forEach(l => {
  const trimmed = l.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

console.log('='.repeat(60));
console.log(' NEXT GEN DMA VENTURES CRM - SUPABASE CREDENTIAL AUDIT');
console.log('='.repeat(60));

const requiredKeys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allPresent = true;
requiredKeys.forEach(k => {
  const val = env[k];
  const present = Boolean(val && val.length > 0 && !val.includes('placeholder') && !val.includes('your-project'));
  console.log(`Key: ${k.padEnd(30)} -> Present: ${present} (Length: ${val ? val.length : 0})`);
  
  if (k === 'NEXT_PUBLIC_SUPABASE_URL' && val) {
    const isHttps = val.startsWith('https://');
    const isSupabaseCo = val.includes('.supabase.co');
    console.log(`   - Valid HTTPS scheme: ${isHttps}`);
    console.log(`   - Valid Supabase host: ${isSupabaseCo}`);
    // Safe masking: https://xxxx....supabase.co
    const masked = val.replace(/https:\/\/([a-zA-Z0-9]{4})[a-zA-Z0-9]+(\.supabase\.co.*)/, 'https://$1****$2');
    console.log(`   - Safe Endpoint Reference: ${masked}`);
    if (!isHttps || !isSupabaseCo) allPresent = false;
  }

  if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && val) {
    const isJwt = val.startsWith('eyJ');
    console.log(`   - Valid JWT token structure: ${isJwt}`);
    console.log(`   - Token prefix: ${val.substring(0, 7)}... [MASKED]`);
  }

  if (k === 'SUPABASE_SERVICE_ROLE_KEY' && val) {
    const isJwt = val.startsWith('eyJ');
    console.log(`   - Valid JWT token structure: ${isJwt}`);
    console.log(`   - Token prefix: ${val.substring(0, 7)}... [MASKED]`);
  }

  if (!present) allPresent = false;
});

console.log('-'.repeat(60));
console.log(`All Required Environment Variables Present: ${allPresent ? 'YES (VERIFIED)' : 'NO (MISSING)'}`);

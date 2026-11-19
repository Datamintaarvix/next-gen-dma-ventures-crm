const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(process.cwd(), '.env.local');
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

let rawUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
let cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('='.repeat(65));
console.log(' NEXT GEN DMA VENTURES CRM - SUPABASE CONNECTION TEST');
console.log('='.repeat(65));
console.log('Raw URL from .env.local:  ', rawUrl.replace(/https:\/\/([a-zA-Z0-9]{4}).*(\.supabase\.co.*)/, 'https://$1****$2'));
console.log('Normalized Base URL:      ', cleanUrl.replace(/https:\/\/([a-zA-Z0-9]{4}).*(\.supabase\.co.*)/, 'https://$1****$2'));

async function testConnection() {
  console.log('\n--- 1. Testing Raw URL with Service Role Key ---');
  try {
    const clientRaw = createClient(rawUrl, serviceKey);
    const resRaw = await clientRaw.from('leads').select('*').limit(1);
    console.log('Raw URL Response:', resRaw.error ? `Error: ${resRaw.error.message}` : `Success! Records: ${resRaw.data.length}`);
  } catch (e) {
    console.log('Raw URL Exception:', e.message);
  }

  console.log('\n--- 2. Testing Normalized Base URL with Service Role Key ---');
  try {
    const clientClean = createClient(cleanUrl, serviceKey);
    // Safe read-only probe
    const resClean = await clientClean.from('leads').select('*').limit(1);
    if (resClean.error) {
      console.log('Normalized URL Response Error Code:', resClean.error.code);
      console.log('Normalized URL Response Error Message:', resClean.error.message);
      console.log('Normalized URL Response Details:', resClean.error.details);
      console.log('Normalized URL Response Hint:', resClean.error.hint);
    } else {
      console.log('Normalized URL Success! Query returned data array of length:', resClean.data.length);
    }
  } catch (e) {
    console.log('Normalized URL Exception:', e.message);
  }

  console.log('\n--- 3. Testing Normalized Base URL with Anon Key ---');
  try {
    const clientAnon = createClient(cleanUrl, anonKey);
    const resAnon = await clientAnon.from('leads').select('*').limit(1);
    if (resAnon.error) {
      console.log('Anon Key Response Error Code:', resAnon.error.code);
      console.log('Anon Key Response Error Message:', resAnon.error.message);
    } else {
      console.log('Anon Key Success! Query returned data array of length:', resAnon.data.length);
    }
  } catch (e) {
    console.log('Anon Key Exception:', e.message);
  }

  console.log('\n--- 4. Direct Auth/Health Ping to Supabase Server ---');
  try {
    const pingRes = await fetch(`${cleanUrl}/auth/v1/health`, {
      headers: {
        'apikey': anonKey
      }
    });
    console.log('Auth endpoint HTTP status:', pingRes.status, pingRes.statusText);
    const pingJson = await pingRes.json().catch(() => null);
    console.log('Auth endpoint response:', pingJson);
  } catch (e) {
    console.log('Ping failed:', e.message);
  }
}

testConnection();

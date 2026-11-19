const fs = require('fs');
const path = require('path');
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

const client = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspectAuthUsers() {
  const { data, error } = await client.auth.admin.listUsers();
  if (error) {
    console.error('Error listing auth users:', error.message);
    process.exit(1);
  }

  console.log(`Current Supabase Auth Users in auth.users: ${data.users.length}`);
  data.users.forEach((u, i) => {
    console.log(`[${i + 1}] ID: ${u.id} | Email: ${u.email} | Confirmed: ${!!u.email_confirmed_at} | Created: ${u.created_at}`);
  });
}

inspectAuthUsers().catch(err => {
  console.error(err);
  process.exit(1);
});

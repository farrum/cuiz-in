const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
          if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') supabaseKey = value;
        }
      }
    }
  } catch (e) {
    console.warn('Warning: Could not read local .env file:', e.message);
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking if 'guest_events' table is queryable...");
  const { data: events, error: eventError } = await supabase
    .from('guest_events')
    .select('*')
    .limit(5);

  if (eventError) {
    console.error("Error reading guest_events:", eventError);
  } else {
    console.log("Success: guest_events table is accessible. Found rows:", events.length);
  }

  console.log("Checking if RPC 'get_guest_activity_stats' is callable...");
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stats, error: statsError } = await supabase
    .rpc('get_guest_activity_stats', { since_date: since });

  if (statsError) {
    console.error("Error executing get_guest_activity_stats RPC:", statsError);
  } else {
    console.log("Success: RPC get_guest_activity_stats is callable. Result:", stats);
  }
}

run();

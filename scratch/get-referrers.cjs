const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://pgywvtphfidouakypdno.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log("Attempting to query guest_events...");
  const { data, error } = await supabase
    .from('guest_events')
    .select('referrer')
    .not('referrer', 'is', null);

  if (error) {
    console.error("Error querying guest_events:", error.message);
    process.exit(1);
  }

  console.log(`Successfully fetched ${data.length} records!`);
  const counts = {};
  data.forEach(row => {
    const ref = row.referrer || 'Direct / None';
    counts[ref] = (counts[ref] || 0) + 1;
  });

  console.log("\nTop Referrers:");
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([ref, count]) => {
      console.log(`- ${ref}: ${count} visits`);
    });
}

run();

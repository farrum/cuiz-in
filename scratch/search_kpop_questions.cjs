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

const kpopKeywords = ['k-pop', 'kpop', 'bts', 'blackpink', 'exo', 'twice'];
const kdramaKeywords = ['k-drama', 'kdrama', 'squid game', 'crash landing'];

async function run() {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, question, category');

  if (error) {
    console.error("Error fetching questions:", error);
    process.exit(1);
  }

  const matchingKpop = [];
  const matchingKdrama = [];

  data.forEach(q => {
    const text = (q.question || '').toLowerCase();
    const hasKpop = kpopKeywords.some(kw => text.includes(kw));
    const hasKdrama = kdramaKeywords.some(kw => text.includes(kw));

    if (hasKpop) {
      matchingKpop.push(q);
    } else if (hasKdrama) {
      matchingKdrama.push(q);
    }
  });

  console.log(`Found ${matchingKpop.length} potential K-Pop questions:`);
  matchingKpop.slice(0, 10).forEach(q => {
    console.log(`- [${q.category}] ${q.question}`);
  });

  console.log(`\nFound ${matchingKdrama.length} potential K-Drama questions:`);
  matchingKdrama.slice(0, 10).forEach(q => {
    console.log(`- [${q.category}] ${q.question}`);
  });
}

run();

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

const categoryRenames = [
  { from: 'Science &amp; Nature', to: 'Science & Nature' },
  { from: 'Science and Technology', to: 'Science & Technology' },
  { from: 'Arts and Literature', to: 'Arts & Literature' },
  { from: 'Food and Drinks', to: 'Food & Drink' },
  { from: 'Entertainment: Cartoon &amp; Animations', to: 'Entertainment: Cartoon & Animations' },
  { from: 'Entertainment: Japanese Anime &amp; Manga', to: 'Entertainment: Japanese Anime & Manga' },
  { from: 'Entertainment: Musicals &amp; Theatres', to: 'Entertainment: Musicals & Theatres' },
];

async function run() {
  console.log('Starting category cleanup in quiz_questions...');
  
  for (const rename of categoryRenames) {
    console.log(`Updating '${rename.from}' to '${rename.to}'...`);
    const { data, error, count } = await supabase
      .from('quiz_questions')
      .update({ category: rename.to })
      .eq('category', rename.from)
      .select('id');
      
    if (error) {
      console.error(`Error updating '${rename.from}':`, error);
    } else {
      console.log(`Successfully updated ${data ? data.length : 0} rows.`);
    }
  }
  
  console.log('Category cleanup finished.');
}

run();

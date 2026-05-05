
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgywvtphfidouakypdno.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const essentialSlots = [
  { id: 'db0f8055-544c-4c9a-a127-5e3f948aec85', name: 'Home Top', position: 'header' },
  { id: '2d85ea9c-4aba-48b7-a535-2dfc1e18ad9d', name: 'Home Middle', position: 'content' },
  { id: '793a6675-9af5-46b3-bf8f-76545b8cb719', name: 'Home Bottom', position: 'footer' },
  { id: '93308528-afbb-4e5e-a07d-bfb11c3dd567', name: 'Question Top', position: 'header' },
  { id: '964f65cf-dabc-4d03-9133-89df02a0adf1', name: 'Question Bottom', position: 'footer' },
  { id: '3d328241-4cd1-433c-864c-2ae60386afbd', name: 'Global Pre-Footer', position: 'footer' },
  { id: '1f7027c5-81c9-49f9-a2a2-a3b586a20684', name: 'Middle 1', position: 'middle' },
  { id: '41bf514e-4000-4b4c-9397-86ed19649bb1', name: 'Sidebar', position: 'sidebar' },
  { id: 'b2c0c5c0-a0bb-49e5-b3cd-a2f22a09e591', name: 'Bottom', position: 'bottom' },
  { id: '4302b83e-7dc7-4d8c-973f-fcb4d9d9bd4d', name: 'Top Advert', position: 'top' }
];

async function syncAds() {
  console.log('Starting Ad Slot Synchronization with UUIDs...');

  const essentialIds = essentialSlots.map(s => s.id);

  // 1. Delete all non-essential slots (and their versions via FK if CASCADE, or manually)
  console.log('Deleting non-essential slots...');
  const { data: allSlots } = await supabase.from('ad_slots').select('id');
  const idsToDelete = allSlots.filter(s => !essentialIds.includes(s.id)).map(s => s.id);
  
  if (idsToDelete.length > 0) {
    console.log(`Removing ${idsToDelete.length} extra slots...`);
    // Delete performance records first
    await supabase.from('ad_version_performance').delete().in('slot_id', idsToDelete);
    // Delete versions
    await supabase.from('ad_slot_versions').delete().in('slot_id', idsToDelete);
    // Delete slots
    await supabase.from('ad_slots').delete().in('id', idsToDelete);
  }

  // 2. Update essential slots to default 728x90
  console.log('Updating essential slots to default 728x90...');
  for (const slot of essentialSlots) {
    const { error } = await supabase.from('ad_slots').update({
      code: '<!-- size: 728x90 -->',
      active: true,
      last_updated: new Date().toISOString()
    }).eq('id', slot.id);

    if (error) {
      console.error(`Error updating ${slot.name}:`, error.message);
    } else {
      console.log(`Successfully updated ${slot.name}`);
    }
  }

  console.log('Synchronization complete!');
}

syncAds();

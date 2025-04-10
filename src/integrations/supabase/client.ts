
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
export const supabase = createClient(
  'https://pgywvtphfidouakypdno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Fetch all application data
export const fetchAllAppData = async () => {
  try {
    console.log('Fetching all app data...');
    
    // Fetch ads
    const { data: adSlots, error: adError } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('active', true);
      
    if (!adError && adSlots) {
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
      console.log(`Loaded ${adSlots.length} ad slots`);
    } else if (adError) {
      console.error('Error fetching ad slots:', adError);
    }
    
    // Fetch profile icons
    const { data: profileIcons, error: iconError } = await supabase
      .from('profile_icons')
      .select('*')
      .eq('is_active', true);
      
    if (!iconError && profileIcons) {
      localStorage.setItem('quiz_app_profile_icons', JSON.stringify(profileIcons));
      console.log(`Loaded ${profileIcons.length} profile icons`);
    } else if (iconError) {
      console.error('Error fetching profile icons:', iconError);
    }
    
    console.log('Finished fetching all app data');
  } catch (error) {
    console.error('Error in fetchAllAppData:', error);
  }
};

// Set up realtime subscriptions for key tables
export const setupRealtimeSubscriptions = () => {
  try {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ad_slots' 
      }, (payload) => {
        console.log('Ad slots updated:', payload);
        syncAdSlots();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profile_icons' 
      }, (payload) => {
        console.log('Profile icons updated:', payload);
        syncProfileIcons();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_roles'
      }, (payload) => {
        console.log('User roles updated:', payload.new);
        window.dispatchEvent(new CustomEvent('userRoleUpdated', { 
          detail: [payload.new]
        }));
      })
      .subscribe();
    
    console.log('Realtime subscriptions set up');
    return channel;
  } catch (err) {
    console.error('Failed to set up realtime subscriptions:', err);
    return null;
  }
};

// Helper function to sync ad slots from the server
const syncAdSlots = async () => {
  try {
    console.log('Syncing ad slots from server...');
    const { data: adSlots, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('active', true);
      
    if (!error && adSlots) {
      console.log(`Successfully loaded ${adSlots.length} ad slots`);
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
      
      // Dispatch a custom event to notify components that ad slots were updated
      window.dispatchEvent(new CustomEvent('adSlotsUpdated', { 
        detail: { source: 'realtime', slots: adSlots }
      }));
    } else {
      console.error('Error fetching ad slots in sync:', error);
    }
  } catch (err) {
    console.error('Error in syncAdSlots:', err);
  }
};

// Helper function to sync profile icons from the server
const syncProfileIcons = async () => {
  try {
    console.log('Syncing profile icons from server...');
    const { data: profileIcons, error } = await supabase
      .from('profile_icons')
      .select('*')
      .eq('is_active', true);
      
    if (!error && profileIcons) {
      console.log(`Successfully loaded ${profileIcons.length} profile icons`);
      localStorage.setItem('quiz_app_profile_icons', JSON.stringify(profileIcons));
      
      // Dispatch a custom event to notify components that profile icons were updated
      window.dispatchEvent(new CustomEvent('profileIconsUpdated', { 
        detail: { icons: profileIcons }
      }));
    } else {
      console.error('Error fetching profile icons in sync:', error);
    }
  } catch (err) {
    console.error('Error in syncProfileIcons:', err);
  }
};

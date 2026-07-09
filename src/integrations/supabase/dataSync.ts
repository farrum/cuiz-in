
import { supabase } from './client';

// Define valid table names as a type
type ValidTableName = 'profiles' | 'login_logs' | 'ad_slots' | 'quiz_questions' | 'quiz_answers' | 'payments' | 'user_referrals' | 'ad_views' | 'ad_clicks' | 'login_streaks' | 'user_attendance';

// Function to fetch all application data from Supabase with limits to prevent excessive caching
export const fetchAllAppData = async () => {
  console.log('Fetching app data from Supabase with optimized caching...');
  
  try {
    // Create an array of promises to fetch data from all tables with reasonable limits
    const [
      profilesResponse,
      loginLogsResponse,
      adSlotsResponse,
      quizQuestionsResponse,
      adViewsResponse,
      adClicksResponse,
      loginStreaksResponse,
      userAttendanceResponse
    ] = await Promise.all([
      supabase.from('profiles' as ValidTableName).select('*').limit(500),
      supabase.from('login_logs' as ValidTableName).select('*').order('login_time', { ascending: false }).limit(100),
      supabase.from('ad_slots' as ValidTableName).select('*'),
      supabase.from('quiz_questions' as ValidTableName).select('id, question, options, category, difficulty, points, image_url').limit(200),
      supabase.from('ad_views' as ValidTableName).select('*').limit(100),
      supabase.from('ad_clicks' as ValidTableName).select('*').limit(100),
      supabase.from('login_streaks' as ValidTableName).select('*').limit(100),
      supabase.from('user_attendance' as ValidTableName).select('*').order('attendance_date', { ascending: false }).limit(1000)
    ]);
    
    // Save responses to localStorage for offline access with reduced quantities
    if (profilesResponse.data) {
      localStorage.setItem('admin_users', JSON.stringify(profilesResponse.data));
      console.log(`Stored ${profilesResponse.data.length} profiles in localStorage`);
    }
    
    if (loginLogsResponse.data) {
      localStorage.setItem('quiz_app_login_log', JSON.stringify(loginLogsResponse.data));
      console.log(`Stored ${loginLogsResponse.data.length} login logs in localStorage`);
    }
    
    if (adSlotsResponse.data) {
      // IMPORTANT FIX: Store timestamp with ad slots to prevent overwriting newer data
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify({
        data: adSlotsResponse.data,
        timestamp: Date.now()
      }));
      console.log(`Stored ${adSlotsResponse.data.length} ad slots in localStorage with timestamp`);
    }
    
    if (quizQuestionsResponse.data) {
      localStorage.setItem('quiz_questions', JSON.stringify(quizQuestionsResponse.data));
      console.log(`Stored ${quizQuestionsResponse.data.length} quiz questions in localStorage`);
    }
    
    if (adViewsResponse.data) {
      localStorage.setItem('quiz_app_ad_views', JSON.stringify(adViewsResponse.data));
      console.log(`Stored ${adViewsResponse.data.length} ad views in localStorage`);
    }
    
    if (adClicksResponse.data) {
      localStorage.setItem('quiz_app_ad_clicks', JSON.stringify(adClicksResponse.data));
      console.log(`Stored ${adClicksResponse.data.length} ad clicks in localStorage`);
    }
    
    if (loginStreaksResponse.data) {
      localStorage.setItem('quiz_app_login_streaks', JSON.stringify(loginStreaksResponse.data));
      console.log(`Stored ${loginStreaksResponse.data.length} login streaks in localStorage`);
    }
    
    if (userAttendanceResponse.data) {
      localStorage.setItem('user_attendance', JSON.stringify(userAttendanceResponse.data));
      console.log(`Stored ${userAttendanceResponse.data.length} user attendance records in localStorage`);
    }
    
    // Check for errors and log them
    const responses = [
      { name: 'profiles', response: profilesResponse },
      { name: 'login_logs', response: loginLogsResponse },
      { name: 'ad_slots', response: adSlotsResponse },
      { name: 'quiz_questions', response: quizQuestionsResponse },
      { name: 'ad_views', response: adViewsResponse },
      { name: 'ad_clicks', response: adClicksResponse },
      { name: 'login_streaks', response: loginStreaksResponse },
      { name: 'user_attendance', response: userAttendanceResponse }
    ];
    
    for (const { name, response } of responses) {
      if (response.error) {
        console.error(`Error fetching ${name}:`, response.error);
      }
    }
    
    console.log('App data fetching completed with optimized caching');
    return true;
  } catch (error) {
    console.error('Error fetching app data:', error);
    return false;
  }
};

// Function to sync only essential localStorage data to Supabase
export const syncLocalStorageToSupabase = async () => {
  console.log('Syncing essential localStorage data to Supabase...');
  
  const syncOperations = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    // Sync only critical data (reduce to essentials)
    
    // Sync login logs - important for attendance tracking
    const loginLogs = JSON.parse(localStorage.getItem('quiz_app_login_log') || '[]');
    if (loginLogs.length > 0) {
      syncOperations.push(syncDataWithSupabase('login_logs', loginLogs));
    }

    // SECURITY: NEVER sync ad_slots from localStorage back to Supabase
    // This was a re-infection vector where cached malicious ad data could overwrite clean database records
    // Ad slots should only be managed through the admin panel directly
    localStorage.removeItem('quiz_app_ad_slots');

    // Process all sync operations
    const results = await Promise.allSettled(syncOperations);
    
    // Count successes and failures
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    console.log(`Sync completed: ${successCount} successful, ${failureCount} failed`);
    return successCount > 0;
  } catch (error) {
    console.error('Error syncing localStorage data to Supabase:', error);
    return false;
  }
};

// Helper function to update fetchSupabaseData hook
export const syncDataWithSupabase = async (tableName: string, data: any[]) => {
  try {
    // Skip if data is empty
    if (!data || data.length === 0) {
      console.log(`No data to sync for ${tableName}`);
      return true;
    }
    
    console.log(`Syncing ${data.length} records to ${tableName}...`);
    
    // Type assertion to ensure TypeScript understands this is a valid table name
    const validatedTableName = tableName as ValidTableName;
    
    const { error } = await supabase
      .from(validatedTableName)
      .upsert(data, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error syncing data to ${tableName}:`, error);
      return false;
    }
    
    console.log(`Successfully synced data to ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error syncing data to ${tableName}:`, error);
    return false;
  }
};

// Function to specifically fix the ad slots data in localStorage
export const fixAdSlotsCache = async () => {
  try {
    // Fetch fresh ad slots data
    const { data: freshAdSlots, error } = await supabase
      .from('ad_slots')
      .select('*');
      
    if (error) {
      console.error('Error fetching ad slots:', error);
      return false;
    }
    
    if (freshAdSlots) {
      // Store with timestamp
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify({
        data: freshAdSlots,
        timestamp: Date.now()
      }));
      
      console.log(`Fixed ad slots cache with ${freshAdSlots.length} fresh records`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error fixing ad slots cache:', error);
    return false;
  }
};

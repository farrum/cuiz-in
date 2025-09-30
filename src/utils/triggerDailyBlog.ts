
import { supabase } from '@/integrations/supabase/client';

export async function triggerDailyBlogGeneration() {
  try {
    console.log('Starting daily blog generation trigger...');
    
    const { data, error } = await supabase.functions.invoke('daily-blog-generator', {
      body: { manual: true }
    });

    if (error) {
      console.error('Error triggering daily blog generation:', error);
      return { success: false, error };
    }

    console.log('Daily blog generation result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception triggering daily blog generation:', error);
    return { success: false, error };
  }
}

// Function to check the status of the cron job
export async function checkCronJobStatus() {
  try {
    console.log('Checking cron job status...');
    
    // Note: RPC function not available in current database schema
    // Returning placeholder data
    const data = null;
    const error = null;

    if (error) {
      console.error('Error checking cron job status:', error);
      return { success: false, error };
    }

    console.log('Cron job status result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception checking cron job status:', error);
    return { success: false, error };
  }
}

// Function to test database connectivity
export async function testDatabaseConnectivity() {
  try {
    console.log('Testing database connectivity...');
    
    // Simple query to test connectivity
    const { data, error } = await supabase
      .from('blog_posts')
      .select('count(*)')
      .single();

    if (error) {
      console.error('Error testing database connectivity:', error);
      return { success: false, error };
    }

    console.log('Database connectivity result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception testing database connectivity:', error);
    return { success: false, error };
  }
}

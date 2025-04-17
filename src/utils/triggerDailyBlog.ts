
import { supabase } from '@/integrations/supabase/client';

export async function triggerDailyBlogGeneration() {
  try {
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

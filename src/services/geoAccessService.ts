
/**
 * This service ensures that the application is accessible worldwide
 * without any geographical restrictions.
 */

// For logging issues related to geographic access
export const logGeoAccessIssue = async (countryCode: string, issue: string) => {
  try {
    // Log to console for now
    console.log(`Geo access issue from ${countryCode}: ${issue}`);
    
    // In the future, this could send data to your backend to track access issues
    // await supabase.from('geo_access_issues').insert({
    //   country_code: countryCode,
    //   issue: issue,
    //   timestamp: new Date()
    // });
  } catch (err) {
    console.error('Failed to log geo access issue:', err);
  }
};

// Verify that no locations are blocked
export const checkGeoAccess = async (): Promise<boolean> => {
  try {
    // Get current location info
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data && data.country) {
      // Log access for monitoring
      console.log(`Site accessed from: ${data.country} (${data.country_name})`);
      
      // Add any future access verification here
      // For now, we ensure all countries have access
      
      return true;
    }
    
    return true; // Default to allowing access if location check fails
  } catch (err) {
    console.warn('Location check failed, defaulting to allow access:', err);
    return true; // Default to allowing access on error
  }
};

// No geographic blocks should be implemented
export const shouldAllowAccess = (countryCode?: string): boolean => {
  // Always return true to ensure worldwide access
  return true;
};

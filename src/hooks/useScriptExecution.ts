
import { useEffect, useRef } from 'react';

/**
 * Custom hook to safely execute scripts in HTML content
 * @param htmlContent The HTML content containing scripts to execute
 * @param containerId The ID of the container element
 */
export function useScriptExecution(
  htmlContent: string,
  containerId: string
) {
  const scriptExecuted = useRef(false);

  useEffect(() => {
    if (!htmlContent || scriptExecuted.current) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = htmlContent;

    // Find all script tags in the content
    const scripts = container.getElementsByTagName('script');
    
    // Execute each script
    Array.from(scripts).forEach(oldScript => {
      const newScript = document.createElement('script');
      
      // Copy all attributes from the original script
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy the content of the script
      newScript.textContent = oldScript.textContent;
      
      // Replace the old script with the new one to execute it
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    scriptExecuted.current = true;

    // Cleanup function
    return () => {
      scriptExecuted.current = false;
    };
  }, [htmlContent, containerId]);
}

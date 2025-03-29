
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
    // Skip if no content or already executed
    if (!htmlContent || scriptExecuted.current) return;

    try {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Clear previous content
      container.innerHTML = htmlContent;

      // Find all script tags in the content
      const scripts = container.getElementsByTagName('script');
      
      // Execute each script
      Array.from(scripts).forEach(oldScript => {
        try {
          const newScript = document.createElement('script');
          
          // Copy all attributes from the original script
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // Copy the content of the script
          newScript.textContent = oldScript.textContent;
          
          // Replace the old script with the new one to execute it
          if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
          }
        } catch (scriptError) {
          console.error('Error executing script:', scriptError);
        }
      });

      scriptExecuted.current = true;
    } catch (error) {
      console.error('Error in useScriptExecution:', error);
    }

    // Cleanup function
    return () => {
      scriptExecuted.current = false;
    };
  }, [htmlContent, containerId]);
}

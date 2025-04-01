
import { useEffect } from 'react';

/**
 * Custom hook to safely execute scripts in a specific container
 * @param adContent The HTML content that may contain scripts
 * @param containerId The ID of the container element where scripts should be executed
 */
export const useScriptExecution = (adContent: string, containerId: string) => {
  useEffect(() => {
    if (!adContent || !containerId) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Find all script tags in the ad content
    const parser = new DOMParser();
    const doc = parser.parseFromString(adContent, 'text/html');
    const scripts = doc.querySelectorAll('script');

    // Execute each script
    scripts.forEach(originalScript => {
      const script = document.createElement('script');
      
      // Copy all attributes from the original script
      Array.from(originalScript.attributes).forEach(attr => {
        script.setAttribute(attr.name, attr.value);
      });
      
      // Copy the content of the script
      script.textContent = originalScript.textContent;
      
      // Replace the original script in the container with the new one
      try {
        // For scripts with src attribute, we need to create and append
        if (script.src) {
          script.async = true;
          container.appendChild(script);
        } else if (script.textContent) {
          // For inline scripts, we create a function and call it
          const executeScript = new Function(script.textContent || '');
          executeScript();
        }
      } catch (error) {
        console.error('Error executing ad script:', error);
      }
    });

    // Clean up on unmount
    return () => {
      // Remove any scripts that were added
      const addedScripts = container.querySelectorAll('script');
      addedScripts.forEach(script => {
        script.remove();
      });
    };
  }, [adContent, containerId]);
};

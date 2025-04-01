
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
    if (!container) {
      console.error(`Script execution container with ID ${containerId} not found`);
      return;
    }

    try {
      // Find all script tags in the ad content
      const parser = new DOMParser();
      const doc = parser.parseFromString(adContent, 'text/html');
      const scripts = doc.querySelectorAll('script');
      
      console.log(`Found ${scripts.length} scripts to execute in container ${containerId}`);

      // Execute each script
      scripts.forEach((originalScript, index) => {
        const script = document.createElement('script');
        
        // Copy all attributes from the original script
        Array.from(originalScript.attributes).forEach(attr => {
          script.setAttribute(attr.name, attr.value);
        });
        
        // Copy the content of the script
        script.textContent = originalScript.textContent;
        
        // For debugging
        console.log(`Executing script ${index + 1}/${scripts.length} in ${containerId}`);
        
        // Replace the original script in the container with the new one
        try {
          // For scripts with src attribute, we need to create and append
          if (script.src) {
            script.async = true;
            container.appendChild(script);
            console.log(`Appended external script: ${script.src}`);
          } else if (script.textContent) {
            // For inline scripts, we create a function and call it
            try {
              const executeScript = new Function(script.textContent || '');
              executeScript();
              console.log(`Executed inline script in ${containerId}`);
            } catch (inlineError) {
              console.error('Error executing inline script:', inlineError);
            }
          }
        } catch (error) {
          console.error('Error executing ad script:', error);
        }
      });
    } catch (error) {
      console.error('Error parsing ad content:', error);
    }

    // Clean up on unmount
    return () => {
      // If the container still exists when unmounting
      const containerElement = document.getElementById(containerId);
      if (containerElement) {
        // Remove any scripts that were added
        const addedScripts = containerElement.querySelectorAll('script');
        addedScripts.forEach(script => {
          script.remove();
        });
        console.log(`Cleaned up ${addedScripts.length} scripts from ${containerId}`);
      }
    };
  }, [adContent, containerId]);
};

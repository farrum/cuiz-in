
import { useEffect } from 'react';

/**
 * Custom hook to safely execute scripts in a specific container
 * @param adContent The HTML content that may contain scripts
 * @param containerId The ID of the container element where scripts should be executed
 */
export const useScriptExecution = (adContent: string, containerId: string) => {
  useEffect(() => {
    if (!adContent || !containerId) return;

    // Use a small delay to ensure the container is fully rendered
    const timeoutId = setTimeout(() => {
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
              script.onerror = (e) => {
                console.error(`Error loading external script in ${containerId}:`, e);
              };
              container.appendChild(script);
              console.log(`Appended external script: ${script.src}`);
            } else if (script.textContent) {
              // For inline scripts, wrap execution in a try-catch with additional checks
              try {
                const wrappedCode = `
                  try {
                    // Ensure ad container exists before accessing it
                    const adContainer = document.getElementById('${containerId}');
                    if (!adContainer) {
                      console.warn('Ad container not found, script execution deferred');
                      return;
                    }
                    
                    ${script.textContent}
                  } catch(err) {
                    console.error("Error in ad script:", err);
                  }
                `;
                
                const executeScript = new Function(wrappedCode);
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
    }, 50); // Small delay to ensure DOM is ready

    // Clean up on unmount
    return () => {
      clearTimeout(timeoutId);
      
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

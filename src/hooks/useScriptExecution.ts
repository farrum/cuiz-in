
import { useEffect, useState } from 'react';

/**
 * Hook to safely execute scripts from ad content
 * @param content HTML content that may include script tags
 * @param containerId ID of the container element where the scripts should execute
 * @returns status of script execution
 */
export const useScriptExecution = (content: string, containerId: string): string => {
  const [executionStatus, setExecutionStatus] = useState<string>('');
  
  useEffect(() => {
    if (!content || typeof content !== 'string') {
      console.log('No content to process for scripts');
      return;
    }
    
    let executedCount = 0;
    // Wait for the container to exist in DOM
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found for script execution`);
      setExecutionStatus('Container not found');
      return;
    }
    
    try {
      // Extract and execute scripts
      const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
      let match;
      let scriptFound = false;
      
      while ((match = scriptRegex.exec(content)) !== null) {
        scriptFound = true;
        const scriptContent = match[1];
        
        try {
          // Create a new script element
          const script = document.createElement('script');
          script.type = 'text/javascript';
          
          // For script content (not src), use a function to execute in global scope
          if (scriptContent && scriptContent.trim()) {
            script.text = scriptContent;
            
            // This approach helps with execution context
            const executeScript = new Function(scriptContent);
            try {
              executeScript();
              executedCount++;
            } catch (execError) {
              console.error('Error executing script:', execError);
            }
          }
          
          // Append the script to the container
          container.appendChild(script);
        } catch (scriptError) {
          console.error('Error creating script:', scriptError);
        }
      }
      
      if (!scriptFound) {
        setExecutionStatus('No scripts found');
      } else {
        setExecutionStatus(`${executedCount} scripts executed`);
      }
    } catch (error) {
      console.error('Error in script execution:', error);
      setExecutionStatus(`Error: ${error}`);
    }
    
    return () => {
      // Clean up executed scripts when component unmounts
      const container = document.getElementById(containerId);
      if (container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.parentNode === container) {
            container.removeChild(script);
          }
        });
      }
    };
  }, [content, containerId]);
  
  return executionStatus;
};


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
      setExecutionStatus('No content');
      return;
    }
    
    let executedCount = 0;
    let scriptFound = false;
    
    try {
      // Wait for the container to exist in DOM
      const containerCheck = setInterval(() => {
        const container = document.getElementById(containerId);
        
        if (container) {
          clearInterval(containerCheck);
          
          // Two regex patterns to catch both inline and src scripts
          // 1. Match script tags with src attribute
          const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
          // 2. Match script tags with inline content
          const scriptContentRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gmi;
          
          // Process scripts with src attribute
          let srcMatch;
          while ((srcMatch = scriptSrcRegex.exec(content)) !== null) {
            scriptFound = true;
            try {
              const srcUrl = srcMatch[1];
              if (srcUrl) {
                const newScript = document.createElement('script');
                newScript.src = srcUrl;
                newScript.async = true;
                container.appendChild(newScript);
                executedCount++;
                console.log(`External script loaded: ${srcUrl}`);
              }
            } catch (srcError) {
              console.error('Error loading external script:', srcError);
            }
          }
          
          // Process inline scripts
          let contentMatch;
          while ((contentMatch = scriptContentRegex.exec(content)) !== null) {
            scriptFound = true;
            const scriptContent = contentMatch[1];
            
            if (scriptContent && scriptContent.trim()) {
              try {
                // Create a new script element
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.text = scriptContent;
                
                // Execute the script in global scope
                container.appendChild(script);
                executedCount++;
                console.log(`Inline script executed, length: ${scriptContent.length} bytes`);
              } catch (execError) {
                console.error('Error executing inline script:', execError);
              }
            }
          }
          
          if (scriptFound) {
            setExecutionStatus(`${executedCount} scripts executed`);
          } else {
            console.log('No script tags found in content');
            setExecutionStatus('No scripts found');
          }
        }
      }, 50); // Check every 50ms
      
      // Clear interval after 5 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(containerCheck);
        if (!scriptFound) {
          setExecutionStatus('Container not ready');
        }
      }, 5000);
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

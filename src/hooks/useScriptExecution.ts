
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
    let containerCheckAttempts = 0;
    const maxAttempts = 30; // Increase max attempts
    
    // Clean up function that will be returned
    const cleanup = () => {
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
    
    try {
      // Block listed domains that cause issues
      const blockedDomains = [
        'onclickpsh.com',
        'mrtnsvr.com',
        'TCPusher',
        'push.js',
        'vo2pn0.js',
        'sdk/push'
      ];
      
      // Filter out problematic scripts before processing
      let processedContent = content;
      
      // Remove problematic scripts
      blockedDomains.forEach(domain => {
        const regex = new RegExp(`<script[^>]*${domain}[^>]*>[\\s\\S]*?<\\/script>`, 'gi');
        const scriptCount = (processedContent.match(regex) || []).length;
        if (scriptCount > 0) {
          console.log(`Filtering out ${scriptCount} problematic scripts containing: ${domain}`);
          processedContent = processedContent.replace(regex, '<!-- Problematic script removed -->');
        }
      });
      
      // Wait for the container to exist in DOM
      const containerCheck = setInterval(() => {
        const container = document.getElementById(containerId);
        containerCheckAttempts++;
        
        if (container) {
          clearInterval(containerCheck);
          console.log(`Container found for ${containerId} after ${containerCheckAttempts} attempts`);
          
          // Two regex patterns to catch both inline and src scripts
          // 1. Match script tags with src attribute
          const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
          // 2. Match script tags with inline content
          const scriptContentRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gmi;
          
          // Process scripts with src attribute
          let srcMatch;
          while ((srcMatch = scriptSrcRegex.exec(processedContent)) !== null) {
            scriptFound = true;
            try {
              const srcUrl = srcMatch[1];
              
              // Skip if the URL contains any blocked domains
              if (blockedDomains.some(domain => srcUrl.includes(domain))) {
                console.log(`Skipping blocked script: ${srcUrl}`);
                continue;
              }
              
              if (srcUrl) {
                const newScript = document.createElement('script');
                newScript.src = srcUrl;
                newScript.async = true;
                
                // Prevent potential notification permission requests
                newScript.setAttribute('data-no-notifications', 'true');
                
                // Add event listeners to track script loading status
                newScript.onload = () => {
                  console.log(`External script loaded successfully: ${srcUrl}`);
                  executedCount++;
                  setExecutionStatus(`${executedCount} scripts executed`);
                };
                newScript.onerror = (err) => {
                  console.error(`Error loading external script: ${srcUrl}`, err);
                };
                container.appendChild(newScript);
                console.log(`External script added to DOM: ${srcUrl}`);
              }
            } catch (srcError) {
              console.error('Error loading external script:', srcError);
            }
          }
          
          // Process inline scripts
          let contentMatch;
          while ((contentMatch = scriptContentRegex.exec(processedContent)) !== null) {
            scriptFound = true;
            const scriptContent = contentMatch[1];
            
            // Skip if the content contains any blocked domains
            if (scriptContent && blockedDomains.some(domain => scriptContent.includes(domain))) {
              console.log('Skipping blocked inline script');
              continue;
            }
            
            // Skip notification permission requests
            if (scriptContent && (
                scriptContent.includes('Notification') || 
                scriptContent.includes('requestPermission') ||
                scriptContent.includes('serviceWorker.register')
              )) {
              console.log('Skipping notification permission script');
              continue;
            }
            
            if (scriptContent && scriptContent.trim()) {
              try {
                // Create a new script element with sandbox
                const script = document.createElement('script');
                script.type = 'text/javascript';
                
                // Replace document.write calls
                const safeContent = scriptContent.replace(
                  /document\.write\(/g, 
                  'console.log("document.write prevented", '
                );
                
                script.text = safeContent;
                
                // Execute the script in container scope
                container.appendChild(script);
                executedCount++;
                console.log(`Inline script executed, length: ${scriptContent.length} bytes`);
                setExecutionStatus(`${executedCount} scripts executed`);
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
        } else if (containerCheckAttempts >= maxAttempts) {
          clearInterval(containerCheck);
          console.warn(`Container not found after ${maxAttempts} attempts for ID: ${containerId}`);
          setExecutionStatus('Container not ready');
        } else {
          console.log(`Waiting for container ${containerId}, attempt ${containerCheckAttempts}/${maxAttempts}`);
        }
      }, 100); // Check every 100ms
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(containerCheck);
        if (!scriptFound && executionStatus !== 'Container not ready') {
          setExecutionStatus('Container timeout');
        }
      }, 10000);
    } catch (error) {
      console.error('Error in script execution:', error);
      setExecutionStatus(`Error: ${error}`);
    }
    
    return cleanup;
  }, [content, containerId]);
  
  return executionStatus;
};

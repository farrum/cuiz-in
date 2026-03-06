
import { useEffect, useState, useRef } from 'react';

/**
 * Hook to safely execute scripts from ad content
 * @param content HTML content that may include script tags
 * @param containerId ID of the container element where the scripts should execute
 * @param skipTopics Whether to skip Topics API related code
 * @returns status of script execution
 */
export const useScriptExecution = (
  content: string, 
  containerId: string, 
  skipTopics: boolean = true
): string => {
  const [executionStatus, setExecutionStatus] = useState<string>('');
  const scriptExecutionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const executedScriptsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef<boolean>(true);
  
  // Reset execution state when content changes
  useEffect(() => {
    executedScriptsRef.current = new Set();
  }, [content]);
  
  useEffect(() => {
    // Set mounted flag
    mountedRef.current = true;
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (scriptExecutionTimeoutRef.current) {
        clearTimeout(scriptExecutionTimeoutRef.current);
      }
      if (containerCheckIntervalRef.current) {
        clearInterval(containerCheckIntervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (!content || typeof content !== 'string') {
      console.log('No content to process for scripts');
      setExecutionStatus('No content');
      return;
    }
    
    let executedCount = 0;
    let scriptFound = false;
    let containerCheckAttempts = 0;
    const maxAttempts = 40; // Increased max attempts
    
    // Clean up function that will be returned
    const cleanup = () => {
      // Clear any pending timeouts/intervals
      if (scriptExecutionTimeoutRef.current) {
        clearTimeout(scriptExecutionTimeoutRef.current);
        scriptExecutionTimeoutRef.current = null;
      }
      
      if (containerCheckIntervalRef.current) {
        clearInterval(containerCheckIntervalRef.current);
        containerCheckIntervalRef.current = null;
      }
      
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
      // Expanded block list for problematic domains
      const blockedDomains = [
        'onclickpsh.com',
        'mrtnsvr.com',
        'TCPusher',
        'push.js',
        'vo2pn0.js',
        'sdk/push',
        'AAB',
        'aab.min.js',
        'swpushnotification',
        'notification',
        'Va3pn0.js',
        'push.m.js',
        'ServiceWorker',
        'register',
        'facebook.com'
      ];
      
      // Always block Topics API domains
      if (skipTopics) {
        blockedDomains.push(
          'adspector.io',
          'cuiz.in/topics',
          'Topics',
          'browsingTopics',
          'runAdAuction',
          'attestation'
        );
      }
      
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
      
      // Specifically remove TCPusher and service worker registration scripts
      const tcpusherRegex = /<script[^>]*>[^<]*(ServiceWorker|serviceWorker)[^<]*(register)[^<]*<\/script>/gi;
      processedContent = processedContent.replace(tcpusherRegex, '<!-- ServiceWorker registration script removed -->');
      
      // Remove Topics API-related scripts
      const topicsRegex = /<script[^>]*>[^<]*(browsingTopics|Topics|attestation)[^<]*<\/script>/gi;
      processedContent = processedContent.replace(topicsRegex, '<!-- Topics API script removed -->');
      
      // Wait for the container to exist in DOM with retry mechanism
      const checkAndExecuteScripts = () => {
        const container = document.getElementById(containerId);
        
        if (!container) {
          containerCheckAttempts++;
          
          if (containerCheckAttempts >= maxAttempts) {
            if (mountedRef.current) {
              console.warn(`Container not found after ${maxAttempts} attempts for ID: ${containerId}`);
              setExecutionStatus('Container not ready');
              
              // Clear interval to stop checking
              if (containerCheckIntervalRef.current) {
                clearInterval(containerCheckIntervalRef.current);
                containerCheckIntervalRef.current = null;
              }
            }
            return;
          }
          
          console.log(`Waiting for container ${containerId}, attempt ${containerCheckAttempts}/${maxAttempts}`);
          return;
        }
        
        // Container found, stop checking
        if (containerCheckIntervalRef.current) {
          clearInterval(containerCheckIntervalRef.current);
          containerCheckIntervalRef.current = null;
        }
        
        console.log(`Container found for ${containerId} after ${containerCheckAttempts} attempts`);
        
        // Process scripts
        if (!mountedRef.current) return;
        
        // Two regex patterns to catch both inline and src scripts
        // 1. Match script tags with src attribute
        const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
        // 2. Match script tags with inline content
        const scriptContentRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gmi;
        
        // Process scripts with src attribute
        let srcMatch;
        let foundScripts = false;
        
        while ((srcMatch = scriptSrcRegex.exec(processedContent)) !== null) {
          scriptFound = true;
          foundScripts = true;
          
          try {
            const srcUrl = srcMatch[1];
            
            // Skip if already executed this script
            const scriptKey = `src:${srcUrl}`;
            if (executedScriptsRef.current.has(scriptKey)) {
              console.log(`Skipping already executed script: ${srcUrl}`);
              continue;
            }
            
            // Skip if the URL contains any blocked domains
            if (blockedDomains.some(domain => srcUrl.toLowerCase().includes(domain.toLowerCase()))) {
              console.log(`Skipping blocked script: ${srcUrl}`);
              continue;
            }
            
            if (srcUrl) {
              const newScript = document.createElement('script');
              newScript.src = srcUrl;
              newScript.async = true;
              
              // Add safety attributes
              newScript.setAttribute('data-ad-script', 'true');
              newScript.setAttribute('data-no-notifications', 'true');
              newScript.setAttribute('data-skip-topics', 'true');
              
              // Create isolated error handler for this script
              newScript.onerror = (err) => {
                console.error(`Error loading external script: ${srcUrl}`, err);
                // Don't propagate the error
                return true;
              };
              
              // Add event listeners to track script loading status
              newScript.onload = () => {
                console.log(`External script loaded successfully: ${srcUrl}`);
                executedCount++;
                executedScriptsRef.current.add(scriptKey);
                if (mountedRef.current) {
                  setExecutionStatus(`${executedCount} scripts executed`);
                }
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
          foundScripts = true;
          
          const scriptContent = contentMatch[1];
          
          if (!scriptContent || !scriptContent.trim()) {
            console.log('Skipping empty inline script');
            continue;
          }
          
          // Skip if the content contains any blocked domains or patterns
          if (blockedDomains.some(domain => 
            scriptContent.toLowerCase().includes(domain.toLowerCase()))) {
            console.log('Skipping blocked inline script');
            continue;
          }
          
          // Skip service worker registration scripts explicitly
          if (scriptContent && (
              scriptContent.includes('serviceWorker') || 
              scriptContent.includes('ServiceWorker') ||
              scriptContent.includes('register') ||
              scriptContent.includes('TCPusher') ||
              scriptContent.includes('registerSW')
            )) {
            console.log('Skipping potentially harmful service worker registration script');
            continue;
          }
          
          // Generate a unique key for this inline script to avoid duplicates
          const scriptKey = `inline:${scriptContent.substring(0, 50)}`;
          if (executedScriptsRef.current.has(scriptKey)) {
            console.log('Skipping already executed inline script');
            continue;
          }
          
          try {
            // Create a new script element with sandbox
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.setAttribute('data-ad-script', 'true');
            script.setAttribute('data-skip-topics', 'true');
            
            // Replace potentially harmful functions
            let safeContent = scriptContent
              // Replace document.write calls
              .replace(/document\.write\(/g, "console.log('document.write prevented', ")
              // Replace notification requests
              .replace(/Notification\.requestPermission/g, "console.log")
              // Replace service worker registration
              .replace(/serviceWorker\.register/g, "console.log")
              .replace(/ServiceWorker\.register/g, "console.log")
              .replace(/navigator\.serviceWorker\.register/g, "console.log")
              .replace(/window\.navigator\.serviceWorker\.register/g, "console.log")
              // Replace window.open calls
              .replace(/window\.open\(/g, "console.log('window.open prevented', ")
              // Replace any TCPusher initialization
              .replace(/new\s+TCPusher/g, "console.log('TCPusher initialization prevented'")
              // Block registration functions
              .replace(/\.register\(/g, ".log(")
              // Replace Topics API calls
              .replace(/document\.browsingTopics/g, "console.log")
              .replace(/navigator\.runAdAuction/g, "console.log")
              .replace(/attestation/g, "console.log");
            
            script.text = safeContent;
            
            // Execute the script in container scope
            container.appendChild(script);
            executedCount++;
            executedScriptsRef.current.add(scriptKey);
            
            console.log(`Inline script executed, length: ${safeContent.length} bytes`);
            
            if (mountedRef.current) {
              setExecutionStatus(`${executedCount} scripts executed`);
            }
          } catch (execError) {
            console.error('Error executing inline script:', execError);
          }
        }
        
        if (scriptFound) {
          if (mountedRef.current) {
            setExecutionStatus(`${executedCount} scripts executed`);
          }
        } else if (!foundScripts) {
          console.log('No script tags found in content');
          if (mountedRef.current) {
            setExecutionStatus('No scripts found');
          }
        }
      };
      
      // Start checking for container at a faster interval
      containerCheckIntervalRef.current = setInterval(checkAndExecuteScripts, 100);
      
      // Set timeout to stop checking after 10 seconds
      scriptExecutionTimeoutRef.current = setTimeout(() => {
        if (containerCheckIntervalRef.current) {
          clearInterval(containerCheckIntervalRef.current);
          containerCheckIntervalRef.current = null;
        }
        
        if (!scriptFound && mountedRef.current && executionStatus !== 'Container not ready') {
          setExecutionStatus('Container timeout');
        }
      }, 10000);
    } catch (error) {
      console.error('Error in script execution:', error);
      if (mountedRef.current) {
        setExecutionStatus(`Error: ${error}`);
      }
    }
    
    return cleanup;
  }, [content, containerId, skipTopics]);
  
  return executionStatus;
};

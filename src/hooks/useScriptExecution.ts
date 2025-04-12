
import { useEffect, useRef } from 'react';

/**
 * Parse HTML content and extract scripts
 */
const parseHtmlContent = (adContent: string): Document => {
  const parser = new DOMParser();
  return parser.parseFromString(adContent, 'text/html');
};

/**
 * Extract all script elements from parsed HTML
 */
const extractScripts = (parsedDoc: Document): NodeListOf<HTMLScriptElement> => {
  return parsedDoc.querySelectorAll('script');
};

/**
 * Create a new script element and copy attributes from original
 */
const createScriptElement = (originalScript: HTMLScriptElement): HTMLScriptElement => {
  const script = document.createElement('script');
  
  // Copy all attributes from the original script
  Array.from(originalScript.attributes).forEach(attr => {
    script.setAttribute(attr.name, attr.value);
  });
  
  // Copy the content of the script
  script.textContent = originalScript.textContent;
  
  return script;
};

/**
 * Execute an external script (with src attribute)
 */
const executeExternalScript = (script: HTMLScriptElement, container: HTMLElement, containerId: string): void => {
  script.async = true;
  script.onerror = (e) => {
    console.error(`Error loading external script in ${containerId}:`, e);
  };
  container.appendChild(script);
  console.log(`Appended external script: ${script.src}`);
};

/**
 * Execute an inline script safely
 */
const executeInlineScript = (scriptContent: string | null, containerId: string): void => {
  if (!scriptContent) return;
  
  try {
    const wrappedCode = `
      try {
        // Ensure ad container exists before accessing it
        const adContainer = document.getElementById('${containerId}');
        if (!adContainer) {
          console.warn('Ad container not found, script execution deferred');
          return;
        }
        
        ${scriptContent}
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
};

/**
 * Execute scripts in the container
 */
const executeScriptsInContainer = (
  scripts: NodeListOf<HTMLScriptElement>, 
  container: HTMLElement, 
  containerId: string
): void => {
  console.log(`Found ${scripts.length} scripts to execute in container ${containerId}`);
  
  scripts.forEach((originalScript, index) => {
    try {
      const script = createScriptElement(originalScript);
      console.log(`Executing script ${index + 1}/${scripts.length} in ${containerId}`);
      
      // For scripts with src attribute
      if (script.src) {
        executeExternalScript(script, container, containerId);
      } 
      // For inline scripts
      else if (script.textContent) {
        executeInlineScript(script.textContent, containerId);
      }
    } catch (error) {
      console.error(`Error handling script ${index + 1}:`, error);
    }
  });
};

/**
 * Clean up scripts from container
 */
const cleanupScripts = (containerId: string): void => {
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    const addedScripts = containerElement.querySelectorAll('script');
    addedScripts.forEach(script => {
      script.remove();
    });
    console.log(`Cleaned up ${addedScripts.length} scripts from ${containerId}`);
  }
};

/**
 * Custom hook to safely execute scripts in a specific container
 * @param adContent The HTML content that may contain scripts
 * @param containerId The ID of the container element where scripts should be executed
 */
export const useScriptExecution = (adContent: string, containerId: string) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!adContent || !containerId) return;

    // Use a small delay to ensure the container is fully rendered
    timeoutIdRef.current = setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Script execution container with ID ${containerId} not found`);
        return;
      }

      try {
        // Parse HTML and extract scripts
        const parsedDoc = parseHtmlContent(adContent);
        const scripts = extractScripts(parsedDoc);
        
        // Execute the scripts
        executeScriptsInContainer(scripts, container, containerId);
      } catch (error) {
        console.error('Error processing ad content:', error);
      }
    }, 50); // Small delay to ensure DOM is ready

    // Clean up on unmount
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      cleanupScripts(containerId);
    };
  }, [adContent, containerId]);
};

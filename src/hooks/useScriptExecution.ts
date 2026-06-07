import { useEffect, useState, useRef } from 'react';
import { containsBlockedContent } from '@/utils/adProviderScripts';

/**
 * Hook to execute scripts from ad content
 * Restored to support custom ad networks while filtering blacklisted/malicious domains.
 */
export const useScriptExecution = (
  content: string, 
  containerId: string, 
  skipTopics: boolean = true
): string => {
  const [executionStatus, setExecutionStatus] = useState<string>('');
  const mountedRef = useRef<boolean>(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  
  useEffect(() => {
    if (!content || typeof content !== 'string') {
      setExecutionStatus('No content');
      return;
    }

    // SECURITY: Block any content with known malicious domains
    if (containsBlockedContent(content)) {
      console.warn('[useScriptExecution] BLOCKED malicious content');
      setExecutionStatus('Blocked - malicious content');
      return;
    }

    // SECURITY: Block data-banner-id and aclib content
    if (content.includes('data-banner-id') || content.includes('aclib')) {
      console.warn('[useScriptExecution] BLOCKED banner-id/aclib content');
      setExecutionStatus('Blocked - compromised network');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      setExecutionStatus('Container not ready');
      return;
    }

    // Two regex patterns to catch both inline and src scripts
    // 1. Match script tags with src attribute
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    // 2. Match script tags with inline content
    const scriptContentRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gmi;

    let executed = 0;

    // Process external scripts
    let srcMatch;
    while ((srcMatch = scriptSrcRegex.exec(content)) !== null) {
      const srcUrl = srcMatch[1];
      
      if (containsBlockedContent(srcUrl)) {
        console.warn(`[useScriptExecution] BLOCKED blacklisted script: ${srcUrl}`);
        continue;
      }

      const script = document.createElement('script');
      script.src = srcUrl;
      script.async = true;
      script.setAttribute('data-ad-script', 'true');
      script.onerror = () => console.error(`[useScriptExecution] Failed to load external script: ${srcUrl}`);
      script.onload = () => {
        executed++;
        if (mountedRef.current) setExecutionStatus(`${executed} scripts executed`);
      };
      container.appendChild(script);
    }

    // Process inline scripts (excluding script tags with src attribute)
    let contentMatch;
    while ((contentMatch = scriptContentRegex.exec(content)) !== null) {
      const tagContent = contentMatch[0];
      const scriptContent = contentMatch[1];

      // Skip if it is a script tag that specifies a src attribute
      if (tagContent.includes('src=')) {
        continue;
      }

      if (!scriptContent || !scriptContent.trim()) {
        continue;
      }

      // Skip service worker registrations or other suspicious calls
      if (
        scriptContent.includes('serviceWorker') ||
        scriptContent.includes('ServiceWorker') ||
        scriptContent.includes('register') ||
        scriptContent.includes('TCPusher') ||
        scriptContent.includes('registerSW')
      ) {
        console.warn('[useScriptExecution] Blocked inline script containing service worker/register call');
        continue;
      }

      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.setAttribute('data-ad-script', 'true');
        
        // Safety replacements
        let safeContent = scriptContent
          .replace(/document\.write\(/g, "console.log('document.write call prevented', ")
          .replace(/window\.open\(/g, "console.log('window.open call prevented', ");

        script.text = safeContent;
        container.appendChild(script);
        executed++;
      } catch (e) {
        console.error('Error executing inline script:', e);
      }
    }

    if (executed > 0) {
      if (mountedRef.current) setExecutionStatus(`${executed} scripts executed`);
    } else if (content.includes('adsbygoogle')) {
      setExecutionStatus('AdSense ready');
    } else {
      setExecutionStatus('No scripts executed');
    }

    return () => {
      const c = document.getElementById(containerId);
      if (c) {
        c.querySelectorAll('script[data-ad-script]').forEach(s => s.remove());
      }
    };
  }, [content, containerId, skipTopics]);
  
  return executionStatus;
};

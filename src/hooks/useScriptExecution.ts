import { useEffect, useState, useRef } from 'react';
import { isAllowedAdScript, containsBlockedContent } from '@/utils/adProviderScripts';

/**
 * Hook to safely execute scripts from ad content
 * HARDENED: Only allows Google AdSense scripts via strict allowlist
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

    // Only process Google AdSense scripts
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    let executed = 0;

    while ((match = scriptSrcRegex.exec(content)) !== null) {
      const srcUrl = match[1];
      
      if (!isAllowedAdScript(srcUrl)) {
        console.warn(`[useScriptExecution] BLOCKED non-allowlisted script: ${srcUrl}`);
        continue;
      }

      const script = document.createElement('script');
      script.src = srcUrl;
      script.async = true;
      script.onerror = () => console.error(`[useScriptExecution] Failed: ${srcUrl}`);
      script.onload = () => {
        executed++;
        if (mountedRef.current) setExecutionStatus(`${executed} scripts executed`);
      };
      container.appendChild(script);
    }

    if (executed === 0 && content.includes('adsbygoogle')) {
      setExecutionStatus('AdSense ready');
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

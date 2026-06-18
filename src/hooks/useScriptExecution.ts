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

    // ── Adsterra / highperformanceformat isolation ──────────────────────────
    // These ads rely on a GLOBAL `atOptions` variable that invoke.js reads at
    // runtime. Multiple slots on one page all overwrite the same global, so
    // only one ad ever renders. Render each such ad inside its own sandboxed
    // iframe so every slot gets an isolated window scope (and its own atOptions).
    const isIframeKeyAd =
      /atOptions/i.test(content) &&
      /highperformanceformat\.com|profitableratecpm\.com|invoke\.js/i.test(content);

    if (isIframeKeyAd) {
      try {
        // Pull width/height from the atOptions block (fallback to 728x90 banner).
        const widthMatch = content.match(/['"]width['"]\s*:\s*(\d+)/i);
        const heightMatch = content.match(/['"]height['"]\s*:\s*(\d+)/i);
        const adWidth = widthMatch ? parseInt(widthMatch[1], 10) : 728;
        const adHeight = heightMatch ? parseInt(heightMatch[1], 10) : 90;

        // Strip the size-metadata comment so only the real scripts go inside.
        const innerHtml = content.replace(/<!-- size: \d+x\d+ -->/g, '').trim();

        container.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.setAttribute('data-ad-script', 'true');
        iframe.width = String(adWidth);
        iframe.height = String(adHeight);
        iframe.scrolling = 'no';
        iframe.frameBorder = '0';
        iframe.style.border = '0';
        iframe.style.maxWidth = '100%';
        iframe.style.display = 'block';
        iframe.style.margin = '0 auto';
        iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body>${innerHtml}</body></html>`;
        container.appendChild(iframe);

        if (mountedRef.current) setExecutionStatus('Isolated iframe ad rendered');
      } catch (e) {
        console.error('[useScriptExecution] Error rendering isolated ad:', e);
        if (mountedRef.current) setExecutionStatus('Iframe ad error');
      }

      return () => {
        const c = document.getElementById(containerId);
        if (c) {
          c.querySelectorAll('[data-ad-script]').forEach((s) => s.remove());
        }
      };
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

import { useEffect, useState, useRef } from 'react';
import { containsBlockedContent } from '@/utils/adProviderScripts';
import { isAdsterraNativeCode } from '@/utils/adsterraNative';

/**
 * Hook to execute scripts from ad content
 * Restored to support custom ad networks while filtering blacklisted/malicious domains.
 */
export const useScriptExecution = (
  content: string, 
  containerId: string, 
  skipTopics: boolean = true,
  refreshGeneration: number = 0
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

    // ── Adsterra isolation ───────────────────────────────────────────────────
    // Both direct banners and native units assume globally unique state. The
    // native unit also ships a fixed container id. Isolating every placement in
    // its own iframe lets the same unit render more than once on a page.
    const isNativeAdsterra = isAdsterraNativeCode(content);
    const isIframeKeyAd =
      isNativeAdsterra ||
      (/atOptions/i.test(content) &&
        /highperformanceformat\.com|highrevenueformat\.com|profitableratecpmnetwork\.com|invoke\.js/i.test(content));

    if (isIframeKeyAd) {
      try {
        // Native units are responsive and need room for their card grid. Direct
        // banners keep the configured dimensions from their atOptions block.
        const widthMatch = content.match(/['"]width['"]\s*:\s*(\d+)/i);
        const heightMatch = content.match(/['"]height['"]\s*:\s*(\d+)/i);
        const adWidth = isNativeAdsterra ? '100%' : String(widthMatch ? parseInt(widthMatch[1], 10) : 728);
        const adHeight = isNativeAdsterra ? 320 : (heightMatch ? parseInt(heightMatch[1], 10) : 90);

        // Strip the size-metadata comment so only the real scripts go inside.
        const innerHtml = content.replace(/<!-- size: \d+x\d+ -->/g, '').trim();

        container.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.setAttribute('data-ad-script', 'true');
        iframe.title = 'Sponsored advertisement';
        iframe.width = adWidth;
        iframe.height = String(adHeight);
        iframe.scrolling = 'no';
        iframe.frameBorder = '0';
        iframe.style.border = '0';
        iframe.style.maxWidth = '100%';
        iframe.style.width = isNativeAdsterra ? '100%' : `${adWidth}px`;
        iframe.style.display = 'block';
        iframe.style.margin = '0 auto';
        iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body>${innerHtml}</body></html>`;
        container.appendChild(iframe);

        if (isNativeAdsterra) {
          const resizeNativeFrame = () => {
            try {
              const bodyHeight = iframe.contentDocument?.body?.scrollHeight ?? 0;
              if (bodyHeight > 20) iframe.height = String(Math.min(1200, bodyHeight));
            } catch {
              // The fixed initial height remains when a cross-origin creative
              // prevents measuring its contents.
            }
          };
          iframe.addEventListener('load', resizeNativeFrame);
          const resizeTimer = window.setInterval(resizeNativeFrame, 500);
          window.setTimeout(() => window.clearInterval(resizeTimer), 10000);
        }

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
  }, [content, containerId, skipTopics, refreshGeneration]);
  
  return executionStatus;
};

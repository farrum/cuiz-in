
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import AppMobile from './mobile/AppMobile.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core'
import { storePendingReferral } from '@/utils/pendingReferral';

// Capture ?ref= from any entry URL so the invite survives until sign-up/login.
try {
  storePendingReferral(new URLSearchParams(window.location.search).get('ref'));
} catch { /* noop */ }

// Platform switch: when VITE_PLATFORM=mobile (Capacitor build),
// or when running inside a native Capacitor shell (iOS/Android),
// boot the mobile UI instead of the web app. Same Supabase backend.
const isMobilePlatform =
  import.meta.env.VITE_PLATFORM === 'mobile' ||
  // Auto-detect native Capacitor runtime so any build shows the hub on-device
  (() => {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  })() ||
  // Allow override via ?mobile=1 for in-browser preview / QA
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mobile') === '1') ||
  // Mobile-width browsers and Lovable's phone preview should render the same
  // Hub experience as the native app. This makes native UI changes testable
  // before producing and uploading another Play Store build.
  (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);

const RootComponent = isMobilePlatform ? AppMobile : App;

const CHUNK_RELOAD_KEY = '__lov_chunk_reload__';
const isChunkLoadError = (msg: string) =>
  msg.includes('Failed to fetch dynamically imported module') ||
  msg.includes('Importing a module script failed') ||
  msg.includes('error loading dynamically imported module');

const tryChunkReload = (msg: string) => {
  if (!isChunkLoadError(msg)) return false;
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
  return true;
};

// Clear the reload guard once the app has successfully mounted
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 5000);
});

// Global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error || event.message);
  const msg = String(event?.message || event?.error?.message || '');
  if (tryChunkReload(msg)) return;
  // Prevent blank screen by rendering error message if the app fails to load
  // Prevent blank screen by rendering error message if the app fails to load
  const root = document.getElementById('root');
  if (!root || root.innerHTML.trim() === '') {
    const errorDetail = event.error ? `<pre style="font-family: monospace; font-size: 11px; color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; padding: 10px; border-radius: 8px; text-align: left; overflow-x: auto; max-width: 90%; white-space: pre-wrap; word-break: break-all;">${event.error.stack || event.error.message || event.error}</pre>` : `<p style="font-size: 11px; color: #ef4444;">Error: ${msg}</p>`;
    document.body.innerHTML = `
      <div style="padding: 30px 20px; text-align: center; font-family: sans-serif; background: #0c0a09; color: #f5f5f4; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
        <h2 style="color: #eab308; margin-bottom: 8px; font-family: serif;">Kingdom Gates Locked</h2>
        <p style="font-size: 13px; color: #a8a29e; max-width: 320px; margin-bottom: 16px;">The application encountered an error while entering the realm. Please try refreshing.</p>
        ${errorDetail}
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #eab308; color: #0c0a09; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
          Re-enter Realm
        </button>
      </div>
    `;
  }
});

// Dynamic import failures surface as unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason: any = event.reason;
  const msg = String(reason?.message || reason || '');
  if (tryChunkReload(msg)) {
    event.preventDefault();
  }
});

// Render the app
try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<RootComponent />);
  } else {
    console.error("Root element not found");
  }
} catch (error) {
  console.error("Failed to render app:", error);
}

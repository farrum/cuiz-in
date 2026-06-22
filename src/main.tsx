
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import AppMobile from './mobile/AppMobile.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core'

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
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mobile') === '1');

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
  if (document.body.innerHTML === '') {
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h2>Something went wrong</h2>
        <p>The application encountered an error. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; cursor: pointer;">
          Refresh Page
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

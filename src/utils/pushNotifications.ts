import { supabase } from '@/integrations/supabase/client';

const firebaseConfig = {
  apiKey: 'AIzaSyDyJPPlnIMOLS8P1TMOVI3-lfKZyx3lZiU',
  authDomain: 'quiz-app-notifications.firebaseapp.com',
  projectId: 'quiz-app-notifications',
  messagingSenderId: '408045722227',
  appId: '1:408045722227:web:3b8c7da9311f9f578c83b0',
};

export type PushResult = 'registered' | 'unsupported' | 'open-in-new-tab' | 'denied' | 'signed-out' | 'error';

async function saveToken(token: string, platform: string): Promise<PushResult> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return 'signed-out';
  const { error } = await supabase.from('push_tokens' as any).upsert(
    { user_id: data.user.id, token, platform, last_seen_at: new Date().toISOString() } as any,
    { onConflict: 'token' },
  );
  if (error) { console.warn('[Push] save token failed', error); return 'error'; }
  return 'registered';
}

/** Android app: register with native push. Safe no-op on web. */
async function registerNative(prompt: boolean): Promise<PushResult | null> {
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) return null;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt' && prompt) perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return 'denied';
  return new Promise<PushResult>((resolve) => {
    PushNotifications.addListener('registration', async (t) => resolve(await saveToken(t.value, Capacitor.getPlatform())));
    PushNotifications.addListener('registrationError', (e) => { console.warn('[Push] native error', e); resolve('error'); });
    PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
      const url = (a.notification.data as any)?.url;
      if (url && url.startsWith('/')) { window.history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); }
    });
    PushNotifications.register().catch(() => resolve('error'));
  });
}

/**
 * Enable push for the signed-in player. Pass prompt=true only from a button click.
 * With prompt=false it silently refreshes the token if permission was already granted.
 */
export async function enablePush(prompt = true): Promise<PushResult> {
  try {
    const native = await registerNative(prompt);
    if (native) return native;

    if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
    const { isSupported, getMessaging, getToken } = await import('firebase/messaging');
    if (!(await isSupported())) return 'unsupported';
    if (window.top !== window.self) return 'open-in-new-tab';
    let permission = Notification.permission;
    if (permission === 'default' && prompt) permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    const { initializeApp, getApps } = await import('firebase/app');
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
    const token = await getToken(getMessaging(app), { serviceWorkerRegistration: reg, ...(vapidKey ? { vapidKey } : {}) });
    return token ? saveToken(token, 'web') : 'denied';
  } catch (e) {
    console.warn('[Push] enable failed', e);
    return 'error';
  }
}

export const PUSH_MESSAGES: Record<PushResult, string> = {
  registered: 'Notifications are on! We\'ll remind you about your streak and quests.',
  unsupported: 'This browser does not support notifications.',
  'open-in-new-tab': 'Open CuizIN in its own tab to turn on notifications.',
  denied: 'Notifications are blocked. Allow them in your browser or phone settings.',
  'signed-out': 'Sign in first to turn on notifications.',
  error: 'Could not turn on notifications. Please try again.',
};

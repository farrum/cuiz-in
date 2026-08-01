import { STORAGE_KEYS } from './constants';

export interface AppNotification {
  id: string;
  category: 'daily_reminder' | 'currency_reward' | 'competition' | 'quest_unlock' | 'counsel_upgrade';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  icon?: string;
  rewardClaimed?: boolean;
  rewardType?: 'gems' | 'tickets' | 'chest';
  rewardAmount?: number;
}

const NOTIFICATION_STORAGE_KEY = 'cuizin_user_notifications';

// Fetch all local notifications
export const getNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return getInitialDefaultNotifications();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading notifications:', e);
    return getInitialDefaultNotifications();
  }
};

// Save notifications to localStorage and dispatch update event
export const saveNotifications = (notifications: AppNotification[]) => {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('cuizinNotificationUpdate'));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
};

// Add a new notification
export const addNotification = (
  category: AppNotification['category'],
  title: string,
  message: string,
  actionUrl?: string,
  icon?: string,
  rewardType?: 'gems' | 'tickets' | 'chest',
  rewardAmount?: number
): AppNotification => {
  const current = getNotifications();
  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category,
    title,
    message,
    timestamp: Date.now(),
    read: false,
    actionUrl,
    icon: icon || (category === 'daily_reminder' ? '🎯' : category === 'currency_reward' ? '💎' : category === 'competition' ? '🏆' : category === 'quest_unlock' ? '🏰' : '🏛️'),
    rewardClaimed: false,
    rewardType,
    rewardAmount
  };

  const updated = [newNotif, ...current].slice(0, 50); // Keep last 50
  saveNotifications(updated);
  return newNotif;
};

// Get unread notification count
export const getUnreadCount = (): number => {
  return getNotifications().filter(n => !n.read).length;
};

// Mark single notification as read
export const markNotificationAsRead = (id: string) => {
  const list = getNotifications();
  const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(updated);
};

// Mark all as read
export const markAllNotificationsAsRead = () => {
  const list = getNotifications();
  const updated = list.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
};

// Clear all notifications
export const clearAllNotifications = () => {
  saveNotifications([]);
};

// Seed default initial notifications for fresh players
function getInitialDefaultNotifications(): AppNotification[] {
  const defaults: AppNotification[] = [
    {
      id: 'init_notif_1',
      category: 'quest_unlock',
      title: '🏰 Welcome to the Empire Quest Board!',
      message: 'Stage 1 (Citadel Gates) is open for FREE. embarks on your journey to earn Star Crowns.',
      timestamp: Date.now() - 3600000,
      read: false,
      actionUrl: '/empire-quests',
      icon: '🏰'
    },
    {
      id: 'init_notif_2',
      category: 'daily_reminder',
      title: '🎯 Daily Word Duel Ready',
      message: 'Defeat the Hangman in the Tavern to earn up to +150 Gems and Socrates Shards!',
      timestamp: Date.now() - 7200000,
      read: false,
      actionUrl: '/empire-quests',
      icon: '🎯'
    },
    {
      id: 'init_notif_3',
      category: 'currency_reward',
      title: '💎 Treasury Refill Active',
      message: 'Your Daily Gems & Ticket balances are active. Claim rewards in the Treasury Shop!',
      timestamp: Date.now() - 14400000,
      read: true,
      actionUrl: '/empire-quests',
      icon: '💎'
    }
  ];
  return defaults;
}

// Check and trigger scheduled daily engagement reminders
export const checkScheduledReminders = () => {
  const today = new Date().toISOString().split('T')[0];
  const lastCheckKey = 'cuizin_last_reminder_check';
  const lastCheck = localStorage.getItem(lastCheckKey);

  if (lastCheck !== today) {
    localStorage.setItem(lastCheckKey, today);
    addNotification(
      'daily_reminder',
      '🔥 Today\'s Special Challenge is LIVE!',
      'Complete today\'s Daily Challenge to maintain your streak and earn 2x Rewards & Spin Tickets.',
      '/daily',
      '🔥'
    );
  }
};

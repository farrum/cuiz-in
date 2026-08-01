import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  AppNotification, 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications 
} from '@/utils/notificationManager';
import { Bell, CheckCheck, Trash2, X, Sparkles, Swords, Trophy, Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/mobile/hooks/useHaptics';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'rewards' | 'quests'>('all');
  const navigate = useNavigate();
  const haptics = useHaptics();

  const reloadNotifications = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      reloadNotifications();
    }
    const handleUpdate = () => reloadNotifications();
    window.addEventListener('cuizinNotificationUpdate', handleUpdate);
    return () => window.removeEventListener('cuizinNotificationUpdate', handleUpdate);
  }, [isOpen]);

  if (!isOpen || typeof window === 'undefined') return null;

  const filteredList = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'rewards') return n.category === 'currency_reward';
    if (filter === 'quests') return n.category === 'quest_unlock' || n.category === 'counsel_upgrade';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif: AppNotification) => {
    haptics('light');
    markNotificationAsRead(notif.id);
    reloadNotifications();
    if (notif.actionUrl) {
      onClose();
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    haptics('medium');
    markAllNotificationsAsRead();
    reloadNotifications();
  };

  const handleClearAll = () => {
    haptics('medium');
    clearAllNotifications();
    reloadNotifications();
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-slate-950 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col text-white shadow-2xl relative my-auto overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight font-serif">
                    Empire Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Reminders, Rewards & Quests
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap",
                filter === 'all' ? "bg-amber-500 text-black font-black" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap",
                filter === 'unread' ? "bg-amber-500 text-black font-black" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              )}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('rewards')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap",
                filter === 'rewards' ? "bg-amber-500 text-black font-black" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              )}
            >
              💎 Rewards
            </button>
            <button
              onClick={() => setFilter('quests')}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap",
                filter === 'quests' ? "bg-amber-500 text-black font-black" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              )}
            >
              🏰 Quests
            </button>
          </div>

          {/* Actions Bar */}
          {notifications.length > 0 && (
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 mb-3">
              <span>Showing {filteredList.length} alert{filteredList.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
              </div>
            </div>
          )}

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <Bell className="w-10 h-10 mb-2 opacity-30 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No Notifications</p>
                <p className="text-[11px] text-slate-500 mt-1">You're all caught up! New campaign & reward alerts will appear here.</p>
              </div>
            ) : (
              filteredList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex items-start gap-3 group",
                    !notif.read
                      ? "bg-slate-900/90 border-amber-500/40 hover:border-amber-400 shadow-md"
                      : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 opacity-80"
                  )}
                >
                  <span className="text-2xl mt-0.5 group-hover:scale-110 transition-transform">
                    {notif.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className={cn(
                        "text-xs font-black leading-snug truncate pr-2",
                        !notif.read ? "text-amber-300" : "text-slate-300"
                      )}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-2">
                      {notif.message}
                    </p>
                    {notif.actionUrl && (
                      <span className="text-[10px] font-extrabold text-amber-400 mt-1 inline-flex items-center gap-1">
                        Tap to View <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5 animate-pulse" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 mt-3 flex justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

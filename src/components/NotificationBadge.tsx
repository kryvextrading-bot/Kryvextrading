import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notification-service';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
}

export default function NotificationBadge({ onClick, className = '' }: NotificationBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      subscribeToNotifications();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    
    // Fetch all notification types: deposit, withdrawal, transfer, trading, and others
    const { count } = await notificationService.getUnreadCount(user.id);
    setUnreadCount(count);
    setShowPulse(count > 0);
    
    console.log(`🔔 [NotificationBadge] Loaded ${count} unread notifications for user ${user.id}`);
  };

  const subscribeToNotifications = () => {
    if (!user) return;
    
    return notificationService.subscribeToNotifications(user.id, (notification) => {
      console.log(`🔔 [NotificationBadge] New notification: ${notification.type} - ${notification.title}`);
      loadUnreadCount();
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 3000);
    });
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${className}`}
    >
      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-1 right-1"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

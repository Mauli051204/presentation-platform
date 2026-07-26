import { createContext, useContext, useCallback, useState } from 'react';
import axiosInstance from '@/services/axiosInstance';

const NotificationCountContext = createContext(null);

export const NotificationCountProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/notifications', { params: { page: 1, limit: 1 } });
      setUnreadCount(data.pagination?.unreadCount || 0);
    } catch {
      // silently ignore — not critical if the badge fails to load
    }
  }, []);

  const incrementUnread = useCallback(() => {
    setUnreadCount((c) => c + 1);
  }, []);

  const decrementUnread = useCallback((by = 1) => {
    setUnreadCount((c) => Math.max(0, c - by));
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationCountContext.Provider
      value={{ unreadCount, refreshUnreadCount, incrementUnread, decrementUnread, resetUnread }}
    >
      {children}
    </NotificationCountContext.Provider>
  );
};

export const useNotificationCount = () => {
  const ctx = useContext(NotificationCountContext);
  if (!ctx) throw new Error('useNotificationCount must be used within NotificationCountProvider');
  return ctx;
};

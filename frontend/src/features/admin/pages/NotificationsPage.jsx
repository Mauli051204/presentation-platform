import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellOff, CheckCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import NotificationCard from '@/components/common/NotificationCard';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notificationApi';
import { useNotificationCount } from '@/context/NotificationCountContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { decrementUnread, resetUnread } = useNotificationCount();

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await getMyNotifications({ page: 1, limit: 30 });
      setNotifications(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id) => {
    const target = notifications.find((n) => n._id === id);
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      if (target && !target.isRead) decrementUnread(1);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 text-sm text-primary font-medium"
        >
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-10">
          <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard key={n._id} notification={n} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

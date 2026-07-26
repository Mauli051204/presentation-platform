import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, LogOut } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import BottomNav from '@/components/common/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/services/socket';
import {
  NotificationCountProvider,
  useNotificationCount,
} from '@/context/NotificationCountContext';

const DashboardLayoutInner = ({ navItems, title, notificationsPath }) => {
  const { user, logout } = useAuth();
  const { unreadCount, refreshUnreadCount, incrementUnread } = useNotificationCount();

  useEffect(() => {
    refreshUnreadCount();

    const socket = getSocket();
    const handleNotification = (notification) => {
      toast(notification.title, { icon: '🔔' });
      incrementUnread();
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar navItems={navItems} title={title} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <span className="text-sm text-slate-500 truncate">
            Welcome back, <span className="font-medium text-slate-900">{user?.name}</span>
          </span>
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            {notificationsPath && (
              <Link
                to={notificationsPath}
                className="relative text-slate-500 hover:text-primary transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-danger hover:opacity-80 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomNav navItems={navItems} />
    </div>
  );
};

const DashboardLayout = (props) => (
  <NotificationCountProvider>
    <DashboardLayoutInner {...props} />
  </NotificationCountProvider>
);

export default DashboardLayout;

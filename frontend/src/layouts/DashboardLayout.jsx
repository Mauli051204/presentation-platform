import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, LogOut, Menu, Globe, ChevronDown } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import ScrollToTop from '@/components/common/ScrollToTop';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/services/socket';
import {
  NotificationCountProvider,
  useNotificationCount,
} from '@/context/NotificationCountContext';

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const DashboardLayoutInner = ({ navItems, title, notificationsPath }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, refreshUnreadCount, incrementUnread } = useNotificationCount();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleGoToPublicPortal = () => {
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ScrollToTop />
      <Sidebar
        navItems={navItems}
        title={title}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-600 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm text-slate-500 truncate">
              Welcome back, <span className="font-medium text-slate-900">{user?.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
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

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 sm:gap-2 sm:pl-1 sm:pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {initials(user?.name)}
                </div>
                <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleGoToPublicPortal}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Globe className="w-4 h-4 text-slate-400" /> Go to Public Portal
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = (props) => (
  <NotificationCountProvider>
    <DashboardLayoutInner {...props} />
  </NotificationCountProvider>
);

export default DashboardLayout;

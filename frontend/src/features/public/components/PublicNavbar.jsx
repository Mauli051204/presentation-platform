import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  Presentation,
  Search,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

const roleToDashboard = {
  college: '/college/dashboard',
  presenter: '/presenter/dashboard',
  admin: '/admin/dashboard',
};

const roleToNotifications = {
  college: '/college/notifications',
  presenter: '/presenter/notifications',
  admin: '/admin/notifications',
};

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const PublicNavbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const profileMenuRef = useRef(null);

  const navLinks = [
    { path: '/', label: t('nav.home'), exact: true },
    { path: '/find-presenters', label: t('nav.findPresenters') },
    { path: '/find-opportunities', label: t('nav.findOpportunities') },
    { path: '/colleges', label: t('nav.colleges') },
    { path: '/how-it-works', label: t('nav.howItWorks') },
    { path: '/pricing', label: t('nav.pricing') },
    { path: '/about', label: t('nav.about') },
    { path: '/contact', label: t('nav.contact') },
  ];

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(
      `/find-opportunities${searchValue ? `?keyword=${encodeURIComponent(searchValue)}` : ''}`
    );
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const handleGoToDashboard = () => {
    setIsProfileMenuOpen(false);
    setIsOpen(false);
    navigate(roleToDashboard[user?.role] || '/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden text-slate-600 shrink-0 -ml-1 p-1"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/logo-mark.png"
            alt="Presentation Platform"
            className="w-9 h-9 object-contain"
          />
          <span className="text-lg font-semibold text-slate-900 hidden xl:inline whitespace-nowrap">
            {t('app.name')}
          </span>
        </Link>

        {/* min-w-0 lets this flex child shrink below its content size, and
            overflow-x-auto contains any remaining overflow WITHIN this row
            only — never on the header, so it can never clip the dropdowns
            that live outside this element. */}
        <nav className="hidden lg:flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-hide">
          {navLinks.slice(0, 5).map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={({ isActive }) =>
                `px-2.5 py-2 rounded-md text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'text-primary bg-primary/5'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 min-w-[100px] max-w-md ml-auto"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto md:ml-0">
          <LanguageSwitcher />

          {user && (
            <Link
              to={roleToNotifications[user.role] || '/'}
              className="text-slate-500 hover:text-primary transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Link>
          )}

          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 sm:gap-2 sm:pl-1 sm:pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {initials(user.name)}
                </div>
                <span className="hidden xl:inline text-sm font-medium text-slate-700 max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="hidden xl:inline w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleGoToDashboard}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" /> {t('nav.goToDashboard')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors whitespace-nowrap"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}

          {!user && (
            <Link to="/login" className="lg:hidden text-slate-500" aria-label="Log in">
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      <div className="md:hidden px-3 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
          />
        </form>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <div className="fixed inset-y-0 left-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col">
              <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-900">Menu</span>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {user && (
                <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {initials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
              )}

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.exact}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {user && (
                  <>
                    <div className="h-px bg-slate-100 my-2" />
                    <button
                      onClick={handleGoToDashboard}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />{' '}
                      {t('nav.goToDashboard')}
                    </button>
                  </>
                )}
              </nav>

              <div className="p-4 border-t border-slate-100 space-y-2 shrink-0">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-danger/30 text-sm font-medium text-danger"
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700"
                    >
                      <User className="w-4 h-4" /> {t('nav.login')}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="block text-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    >
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};

export default PublicNavbar;

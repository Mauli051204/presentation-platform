import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Briefcase, Building2, MoreHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const primaryItems = [
  { path: '/', label: 'Home', exact: true, icon: Home },
  { path: '/find-presenters', label: 'Presenters', icon: Search },
  { path: '/find-opportunities', label: 'Jobs', icon: Briefcase },
  { path: '/colleges', label: 'Colleges', icon: Building2 },
];

const moreItems = [
  { path: '/how-it-works', label: 'How It Works' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
];

const PublicBottomNav = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreActive = moreItems.some((item) => location.pathname === item.path);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <div className="relative flex-1" ref={menuRef}>
          <button
            onClick={() => setIsMoreOpen((v) => !v)}
            className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              isMoreActive || isMoreOpen ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <MoreHorizontal
              className={`w-5 h-5 ${isMoreActive || isMoreOpen ? 'text-primary' : 'text-slate-400'}`}
            />
            <span>More</span>
          </button>

          {isMoreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-2">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm ${
                      isActive
                        ? 'text-primary font-medium bg-primary/5'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default PublicBottomNav;

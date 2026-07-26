import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const BottomNav = ({ navItems }) => {
  const location = useLocation();
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const targetScroll = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div ref={containerRef} className="flex overflow-x-auto scrollbar-hide scroll-smooth px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (!item.exact && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              ref={isActive ? activeRef : null}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-4 min-w-[76px] shrink-0 relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              {Icon && (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? 'bg-primary/10' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                </div>
              )}
              <span
                className={`text-[10.5px] font-medium leading-none whitespace-nowrap ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

const Sidebar = ({ navItems, title, isOpen, onClose }) => {
  const content = (
    <>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">{title?.[0]}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 truncate">{title}</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-slate-400 group-hover:text-primary'
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">Presentation Platform</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop — permanent, static */}
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile/Tablet — portal drawer, escapes any backdrop-blur containing block */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div onClick={onClose} className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" />
            <div className="fixed inset-y-0 left-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col">
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Sidebar;

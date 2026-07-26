const FilterTabs = ({ options, value, onChange }) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {options.map((opt) => {
      const isActive = opt.value === value;
      return (
        <button
          key={opt.value || 'all'}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            isActive
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default FilterTabs;

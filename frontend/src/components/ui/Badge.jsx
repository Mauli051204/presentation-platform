const variantStyles = {
  success: 'bg-success/10 text-success ring-1 ring-success/20',
  warning: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  danger: 'bg-danger/10 text-danger ring-1 ring-danger/20',
  primary: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

const Badge = ({ variant = 'neutral', children }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${variantStyles[variant]}`}
  >
    {children}
  </span>
);

export default Badge;

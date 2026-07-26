const Card = ({ title, children, actions, className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-shadow hover:shadow-md ${className}`}
  >
    {(title || actions) && (
      <div className="flex items-center justify-between mb-4 gap-3">
        {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
        {actions}
      </div>
    )}
    {children}
  </div>
);

export default Card;
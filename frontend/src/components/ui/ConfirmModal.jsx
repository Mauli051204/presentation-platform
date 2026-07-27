import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = true,
  isLoading = false,
  icon: Icon = AlertTriangle,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 text-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isDangerous ? 'bg-danger/10' : 'bg-primary/10'
          }`}
        >
          <Icon className={`w-7 h-7 ${isDangerous ? 'text-danger' : 'text-primary'}`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{description}</p>

        {children && <div className="text-left mb-4">{children}</div>}

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90 ${
              isDangerous ? 'bg-danger' : 'bg-primary'
            }`}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

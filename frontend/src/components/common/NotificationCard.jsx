import { Star } from 'lucide-react';
import Card from '@/components/ui/Card';

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const NotificationCard = ({ notification, onMarkRead }) => {
  const { _id, title, message, meta = {}, isRead, createdAt } = notification;
  const { rating, counterpartyName, counterpartyAvatarUrl, requirementTitle } = meta;
  const hasIdentity = Boolean(counterpartyName || counterpartyAvatarUrl);

  return (
    <Card className={!isRead ? 'border-l-4 border-l-primary' : ''}>
      <div className="flex items-start gap-3">
        {hasIdentity &&
          (counterpartyAvatarUrl ? (
            <img
              src={counterpartyAvatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials(counterpartyName)}
            </div>
          ))}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className={`text-sm font-medium ${isRead ? 'text-slate-600' : 'text-slate-900'}`}>
              {title}
            </p>
            {!isRead && (
              <button
                onClick={() => onMarkRead(_id)}
                className="text-xs text-primary font-medium whitespace-nowrap shrink-0"
              >
                Mark read
              </button>
            )}
          </div>

          {(counterpartyName || requirementTitle) && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {counterpartyName}
              {counterpartyName && requirementTitle && ' · '}
              {requirementTitle}
            </p>
          )}

          {rating && (
            <div className="flex gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-3.5 h-3.5 ${n <= rating ? 'text-warning fill-warning' : 'text-slate-200'}`}
                />
              ))}
            </div>
          )}

          <p className="text-sm text-slate-500 mt-1.5">{message}</p>
          <p className="text-xs text-slate-400 mt-2">{new Date(createdAt).toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
};

export default NotificationCard;

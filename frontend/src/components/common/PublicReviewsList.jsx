import { Star } from 'lucide-react';

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const PublicReviewsList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="text-sm text-slate-500">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r._id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials(r.reviewerUser?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-slate-900">
                  {r.reviewerUser?.name || 'Anonymous'}
                </p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3.5 h-3.5 ${n <= r.rating ? 'text-warning fill-warning' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicReviewsList;

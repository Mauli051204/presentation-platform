import { useEffect, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getPopularSearches, getRecentSearches } from '@/features/public/api/searchApi';

const RecentPopularSearches = ({ type, onSelect }) => {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getPopularSearches(type);
        setPopular((data.data || []).map((p) => p.query));
      } catch {
        setPopular([]);
      }

      if (user) {
        try {
          const { data } = await getRecentSearches(type);
          setRecent((data.data || []).map((r) => r.query));
        } catch {
          setRecent([]);
        }
      }
    };
    load();
  }, [type, user]);

  if (recent.length === 0 && popular.length === 0) return null;

  return (
    <div className="space-y-2">
      {recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Clock className="w-3.5 h-3.5" /> Recent:
          </span>
          {recent.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelect(q)}
              className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      {popular.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" /> Popular:
          </span>
          {popular.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelect(q)}
              className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentPopularSearches;

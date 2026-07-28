import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MapPin, Star, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TextInput from '@/components/ui/TextInput';
import FieldAutocomplete from '@/components/ui/FieldAutocomplete';
import RecentPopularSearches from '@/components/ui/RecentPopularSearches';
import Pagination from '@/components/ui/Pagination';
import { searchPresentersPublic } from '../api/publicApi';

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const FindPresentersPage = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    skills: '',
    city: '',
  });
  const [presenters, setPresenters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPresenters = async (page = 1, overrideFilters = filters) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 12 };
      Object.entries(overrideFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const { data } = await searchPresentersPublic(params);
      setPresenters(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load presenters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresenters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPresenters(1);
  };

  const handleQuickSearch = (keyword) => {
    const next = { ...filters, keyword };
    setFilters(next);
    fetchPresenters(1, next);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Find Presenters</h1>
          <p className="text-slate-500 mt-1">
            Search presenters by skills, topics, and experience.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Card
          className="mb-6"
          title={
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filters
            </span>
          }
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput
                label="Keyword"
                placeholder="e.g. AI, Public Speaking"
                value={filters.keyword}
                onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
              />
              <FieldAutocomplete
                label="Skills"
                autocompleteType="skill"
                placeholder="e.g. AI, Career Guidance"
                value={filters.skills}
                onChange={(v) => setFilters((f) => ({ ...f, skills: v }))}
              />
              <FieldAutocomplete
                label="City"
                autocompleteType="location"
                placeholder="e.g. Trichy"
                value={filters.city}
                onChange={(v) => setFilters((f) => ({ ...f, city: v }))}
              />
            </div>
            <RecentPopularSearches type="presenter" onSelect={handleQuickSearch} />
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </form>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : presenters.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-500 text-sm">No presenters match your search yet.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {presenters.map((p) => (
              <Link key={p._id} to={`/presenters/${p._id}`} className="block">
                <Card className="flex flex-col hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    {p.profileImage?.url ? (
                      <img
                        src={p.profileImage.url}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                        {initials(p.user?.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {p.user?.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{p.headline}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(p.skills || []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    {p.location?.city && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" /> {p.location.city}
                      </span>
                    )}
                    {p.ratingsCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-warning">
                        <Star className="w-3 h-3 fill-warning" /> {p.ratingsAverage}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchPresenters(p)}
            />
          </>
        )}

        <div className="text-center mt-10">
          <p className="text-sm text-slate-500">
            Are you a presenter?{' '}
            <Link to="/register" className="text-primary font-medium">
              Create your profile →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindPresentersPage;

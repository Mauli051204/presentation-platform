import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MapPin, CalendarDays, IndianRupee, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import FieldAutocomplete from '@/components/ui/FieldAutocomplete';
import RecentPopularSearches from '@/components/ui/RecentPopularSearches';
import Pagination from '@/components/ui/Pagination';
import { searchRequirementsPublic } from '../api/publicApi';
import { formatBudget } from '@/utils/formatBudget';

const FindOpportunitiesPage = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    city: '',
    presentationType: '',
  });
  const [requirements, setRequirements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequirements = async (page = 1, overrideFilters = filters) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10 };
      Object.entries(overrideFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const { data } = await searchRequirementsPublic(params);
      setRequirements(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load opportunities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRequirements(1);
  };

  const handleQuickSearch = (keyword) => {
    const next = { ...filters, keyword };
    setFilters(next);
    fetchRequirements(1, next);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Find Opportunities</h1>
          <p className="text-slate-500 mt-1">
            Browse presentation requirements posted by colleges.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
              <FieldAutocomplete
                label="Keyword"
                autocompleteType="requirement"
                placeholder="e.g. AI, Career Guidance"
                value={filters.keyword}
                onChange={(v) => setFilters((f) => ({ ...f, keyword: v }))}
              />
              <FieldAutocomplete
                label="City"
                autocompleteType="location"
                placeholder="e.g. Trichy"
                value={filters.city}
                onChange={(v) => setFilters((f) => ({ ...f, city: v }))}
              />
              <Select
                label="Type"
                value={filters.presentationType}
                onChange={(e) => setFilters((f) => ({ ...f, presentationType: e.target.value }))}
              >
                <option value="">Any</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </Select>
            </div>
            <RecentPopularSearches type="requirement" onSelect={handleQuickSearch} />
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
        ) : requirements.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-500 text-sm">No opportunities match your search right now.</p>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {requirements.map((req) => (
                <Card key={req._id} className="hover:shadow-md transition-shadow">
                  <h3 className="text-base font-semibold text-slate-900">{req.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{req.college?.collegeName}</p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{req.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="neutral">{req.presentationType}</Badge>
                    {req.location?.city && (
                      <Badge variant="neutral">
                        <MapPin className="w-3 h-3" /> {req.location.city}
                      </Badge>
                    )}
                    <Badge variant="success">
                      <IndianRupee className="w-3 h-3" />{' '}
                      {formatBudget(req.budgetMin, req.budgetMax)}
                    </Badge>
                    <Badge variant="neutral">
                      <CalendarDays className="w-3 h-3" />{' '}
                      {new Date(req.eventDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchRequirements(p)}
            />
          </>
        )}

        <div className="text-center mt-10">
          <p className="text-sm text-slate-500">
            Want to apply?{' '}
            <Link to="/register" className="text-primary font-medium">
              Create a presenter account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindOpportunitiesPage;

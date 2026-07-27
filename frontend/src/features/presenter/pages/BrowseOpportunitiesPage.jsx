import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MapPin, CalendarDays, IndianRupee, Filter, CheckCircle2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TextInput from '@/components/ui/TextInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import { searchRequirements } from '../api/requirementApi';
import { applyToRequirement, getMyApplications } from '../api/applicationApi';
import FieldAutocomplete from '@/components/ui/FieldAutocomplete';
import RecentPopularSearches from '@/components/ui/RecentPopularSearches';

const emptyFilters = {
  keyword: '',
  city: '',
  presentationType: '',
  sortBy: '',
};

const APPLIED_STATUSES = ['applied', 'shortlisted', 'booked'];

const BrowseOpportunitiesPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(emptyFilters);
  const [requirements, setRequirements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);

  const loadAppliedRequirementIds = async () => {
    try {
      const { data } = await getMyApplications();
      const ids = data.data
        .filter((app) => APPLIED_STATUSES.includes(app.status))
        .map((app) => app.requirement?._id)
        .filter(Boolean);
      setAppliedIds(ids);
    } catch {
      // Non-fatal — if this fails, buttons just won't reflect prior applications
      // until the next successful load; the apply flow itself still works.
    }
  };

  const fetchRequirements = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const { data } = await searchRequirements(params);
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
    loadAppliedRequirementIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRequirements(1);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setTimeout(() => fetchRequirements(1), 0);
  };

  const handleApply = async (requirement) => {
    if (appliedIds.includes(requirement._id)) return;

    setApplyingId(requirement._id);
    try {
      await applyToRequirement({ requirementId: requirement._id });
      toast.success('Applied successfully!');
      setAppliedIds((prev) => [...prev, requirement._id]);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit application';
      if (message.toLowerCase().includes('profile must be complete')) {
        toast(
          (t) => (
            <span>
              {message}{' '}
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/presenter/profile');
                }}
                className="text-primary font-medium underline"
              >
                Complete it now
              </button>
            </span>
          ),
          { duration: 6000, icon: '⚠️' }
        );
      } else if (message.toLowerCase().includes('already applied')) {
        toast.error(message);
        setAppliedIds((prev) => [...prev, requirement._id]);
      } else {
        toast.error(message);
      }
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title={
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> Search Opportunities
          </span>
        }
      >
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
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
            label="Presentation Type"
            value={filters.presentationType}
            onChange={(e) => setFilters((f) => ({ ...f, presentationType: e.target.value }))}
          >
            <option value="">Any</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </Select>
          <Select
            label="Sort By"
            value={filters.sortBy}
            onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
          >
            <option value="">Event Date (soonest)</option>
            <option value="newest">Newest Posted</option>
            <option value="budgetHigh">Highest Budget</option>
          </Select>
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-4 pt-1">
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Search className="w-4 h-4" /> Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Clear filters
            </button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : requirements.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-500 text-sm">No opportunities match your search right now.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requirements.map((req) => {
            const hasApplied = appliedIds.includes(req._id);
            return (
              <Card key={req._id}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
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
                        <IndianRupee className="w-3 h-3" /> {req.budgetMin} – {req.budgetMax}
                      </Badge>
                      <Badge variant="neutral">
                        <CalendarDays className="w-3 h-3" />{' '}
                        {new Date(req.eventDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(req)}
                    disabled={applyingId === req._id || hasApplied}
                    className={`rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap w-full sm:w-auto transition-opacity flex items-center justify-center gap-2 ${
                      hasApplied
                        ? 'bg-success/10 text-success cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50'
                    }`}
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Applied
                      </>
                    ) : applyingId === req._id ? (
                      'Applying...'
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchRequirements(p)}
      />
    </div>
  );
};

export default BrowseOpportunitiesPage;

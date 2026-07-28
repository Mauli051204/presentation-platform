import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MapPin, ShieldCheck, Building2, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TextInput from '@/components/ui/TextInput';
import Pagination from '@/components/ui/Pagination';
import { searchCollegesPublic } from '../api/publicApi';
import FieldAutocomplete from "@/components/ui/FieldAutocomplete";
import RecentPopularSearches from "@/components/ui/RecentPopularSearches";

const CollegesPage = () => {
  const [filters, setFilters] = useState({ keyword: '', city: '' });
  const [colleges, setColleges] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchColleges = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 12 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const { data } = await searchCollegesPublic(params);
      setColleges(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load colleges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchColleges(1);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Colleges</h1>
          <p className="text-slate-500 mt-1">Browse colleges and institutions on the platform.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldAutocomplete
                label="Keyword"
                autocompleteType="requirement"
                placeholder="College name"
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
            </div>
            <RecentPopularSearches
              type="college"
              onSelect={(kw) => {
                setFilters((f) => ({ ...f, keyword: kw }));
                fetchColleges(1, { ...filters, keyword: kw });
              }}
            />
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
        ) : colleges.length === 0 ? (
          <Card className="text-center py-12">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No colleges match your search yet.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {colleges.map((c) => (
                <Link key={c._id} to={`/colleges/${c._id}`} className="block">
                   <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      {c.logo?.url ? (
                        <img src={c.logo.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {c.collegeName}
                        </p>
                        {c.address?.city && (
                          <p className="flex items-center gap-1 text-xs text-slate-500 truncate">
                            <MapPin className="w-3 h-3" /> {c.address.city}, {c.address.state}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{c.description}</p>
                    {c.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-success mt-3">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchColleges(p)}
            />
          </>
        )}

        <div className="text-center mt-10">
          <p className="text-sm text-slate-500">
            Represent a college?{' '}
            <Link to="/register" className="text-primary font-medium">
              Create your college profile →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollegesPage;

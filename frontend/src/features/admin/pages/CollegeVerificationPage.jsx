import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, MapPin, CalendarDays, Building2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import FilterTabs from '@/components/ui/FilterTabs';
import Badge from '@/components/ui/Badge';
import { listCollegesForVerification, verifyCollege } from '../api/adminApi';

const filterOptions = [
  { value: 'false', label: 'Pending Verification' },
  { value: 'true', label: 'Verified' },
  { value: '', label: 'All' },
];

const CollegeVerificationPage = () => {
  const [colleges, setColleges] = useState([]);
  const [filter, setFilter] = useState('false');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filter) params.isVerified = filter;
      const { data } = await listCollegesForVerification(params);
      setColleges(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load colleges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Optimistic verify: if we're on the "Pending" tab, the card should
  // vanish from the list immediately on click; if we're on "All", it should
  // instantly flip its badge to Verified — either way, no waiting on the
  // network round trip to see the change. Reverts only on actual failure.
  const handleVerify = async (id) => {
    const previous = colleges;
    setBusyId(id);

    if (filter === 'false') {
      setColleges((prev) => prev.filter((c) => c._id !== id));
    } else {
      setColleges((prev) => prev.map((c) => (c._id === id ? { ...c, isVerified: true } : c)));
    }

    try {
      await verifyCollege(id);
      toast.success('College verified — notification sent');
    } catch (error) {
      setColleges(previous);
      toast.error(error.response?.data?.message || 'Failed to verify college');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <FilterTabs options={filterOptions} value={filter} onChange={setFilter} />
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : colleges.length === 0 ? (
        <Card className="text-center py-10">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No colleges match this filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {colleges.map((c) => (
            <Card key={c._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {c.logo?.url ? (
                    <img
                      src={c.logo.url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {c.collegeName}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">{c.user?.email}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {c.address?.city && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" /> {c.address.city}, {c.address.state}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <CalendarDays className="w-3 h-3" />
                        Joined {new Date(c.user?.createdAt || c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <Badge variant={c.isVerified ? 'success' : 'warning'}>
                    {c.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                  {!c.isVerified && (
                    <button
                      onClick={() => handleVerify(c._id)}
                      disabled={busyId === c._id}
                      className="flex items-center gap-1.5 text-sm bg-success text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50 whitespace-nowrap transition-opacity"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Verify
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollegeVerificationPage;

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Settings2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import FilterTabs from '@/components/ui/FilterTabs';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { listAllRequirements, forceUpdateRequirementStatus } from '../api/adminApi';

const statusVariant = {
  draft: 'neutral',
  active: 'success',
  closed: 'warning',
  cancelled: 'danger',
};

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const RequirementsModerationPage = () => {
  const [requirements, setRequirements] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await listAllRequirements(params);
      setRequirements(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load requirements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleForceStatus = async (id, status) => {
    if (
      !window.confirm(
        `Force this requirement to "${status}"? This overrides the college's control.`
      )
    )
      return;
    setBusyId(id);
    try {
      await forceUpdateRequirementStatus(id, status);
      toast.success(`Requirement force-updated to ${status}`);
      await load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update requirement');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <FilterTabs options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-10">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No requirements found.</p>
          </div>
        ) : (
          <>
            <Table columns={['Title', 'College', 'Status', 'Applications', 'Event Date', 'Action']}>
              {requirements.map((req) => (
                <tr key={req._id}>
                  <td className="py-3 px-3 font-medium text-slate-900">{req.title}</td>
                  <td className="py-3 px-3 text-slate-600">{req.college?.collegeName}</td>
                  <td className="py-3 px-3">
                    <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{req.applicationsCount || 0}</td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(req.eventDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="relative inline-flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        disabled={busyId === req._id}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleForceStatus(req._id, e.target.value);
                          e.target.value = '';
                        }}
                        className="text-xs border border-slate-300 rounded-md px-2 py-1"
                      >
                        <option value="" disabled>
                          Force status...
                        </option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => load(p)}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default RequirementsModerationPage;

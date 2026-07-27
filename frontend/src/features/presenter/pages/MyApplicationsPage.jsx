import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, XCircle, CalendarDays } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import FilterTabs from '@/components/ui/FilterTabs';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TextArea from '@/components/ui/TextArea';
import { getMyApplications, withdrawApplication } from '../api/applicationApi';
import { getOrCreateConversation } from '../api/chatApi';

const statusVariant = {
  applied: 'warning',
  shortlisted: 'success',
  booked: 'primary',
  completed: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'booked', label: 'Booked' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await getMyApplications(statusFilter ? { status: statusFilter } : {});
      setApplications(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openWithdrawModal = (application) => {
    setWithdrawTarget(application);
    setWithdrawReason('');
  };

  // Optimistic withdraw: flip to "withdrawn" and close the modal instantly;
  // revert only if the server actually rejects the request.
  const handleConfirmWithdraw = async () => {
    const applicationId = withdrawTarget._id;
    const reason = withdrawReason.trim();
    const previous = applications;

    setIsWithdrawing(true);
    setApplications((prev) =>
      prev.map((a) => (a._id === applicationId ? { ...a, status: 'withdrawn' } : a))
    );
    setWithdrawTarget(null);

    try {
      await withdrawApplication(applicationId, reason);
      toast.success('Application withdrawn');
    } catch (error) {
      setApplications(previous);
      toast.error(error.response?.data?.message || 'Failed to withdraw application');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMessageCollege = async (applicationId) => {
    try {
      const { data } = await getOrCreateConversation(applicationId);
      navigate(`/presenter/messages?conversationId=${data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open conversation');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <FilterTabs options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-500 text-sm">No applications found for this filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {app.requirement?.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{app.college?.collegeName}</p>
                  {app.coverNote && <p className="text-sm text-slate-600 mt-2">{app.coverNote}</p>}
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
                    {app.requirement?.presentationType && (
                      <Badge variant="neutral">{app.requirement.presentationType}</Badge>
                    )}
                    {app.requirement?.eventDate && (
                      <Badge variant="neutral">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(app.requirement.eventDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-3 sm:gap-2 sm:items-end">
                  {['shortlisted', 'booked', 'completed'].includes(app.status) && (
                    <button
                      onClick={() => handleMessageCollege(app._id)}
                      className="flex items-center gap-1.5 text-sm text-primary font-medium whitespace-nowrap"
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  )}
                  {['applied', 'shortlisted'].includes(app.status) && (
                    <button
                      onClick={() => openWithdrawModal(app)}
                      className="flex items-center gap-1.5 text-sm text-danger font-medium hover:opacity-80 whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" /> Withdraw
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleConfirmWithdraw}
        title="Withdraw this application?"
        description={
          <span>
            The college will be notified. You can optionally share a reason below before confirming.
          </span>
        }
        confirmLabel="Withdraw"
        isDangerous={true}
        isLoading={isWithdrawing}
        icon={XCircle}
      >
        <TextArea
          label="Reason (optional, shared with the college)"
          rows={3}
          maxLength={500}
          value={withdrawReason}
          onChange={(e) => setWithdrawReason(e.target.value)}
        />
      </ConfirmModal>
    </div>
  );
};

export default MyApplicationsPage;

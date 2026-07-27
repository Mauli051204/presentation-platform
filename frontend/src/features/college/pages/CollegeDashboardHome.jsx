import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  FileText,
  CheckCircle2,
  Users2,
  IndianRupee,
  ArrowRight,
  Sparkles,
  PlusCircle,
  CalendarCheck2,
  Clock,
  XCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getMyCollegeProfile } from '../api/collegeApi';
import { getMyRequirements } from '../api/requirementApi';
import { getMyBookings } from '../api/bookingApi';

const statusVariant = {
  draft: 'neutral',
  active: 'success',
  closed: 'warning',
  cancelled: 'danger',
};
const PIE_COLORS = ['#2563EB', '#7C3AED', '#F59E0B', '#DC2626'];
const BOOKING_COLORS = {
  pending_payment: '#F59E0B',
  confirmed: '#2563EB',
  completed: '#16A34A',
  cancelled: '#DC2626',
};

const StatBox = ({ icon: Icon, label, value, tint }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-slate-500 truncate">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const CollegeDashboardHome = () => {
  const [profile, setProfile] = useState(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setProfileMissing(false);
    setProfileLoadFailed(false);

    try {
      const { data } = await getMyCollegeProfile();
      setProfile(data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setProfileMissing(true);
      } else {
        toast.error('Failed to load profile');
        setProfileLoadFailed(true);
      }
    }

    try {
      const { data } = await getMyRequirements();
      setRequirements(data.data);
    } catch {
      // non-fatal
    }

    try {
      const { data } = await getMyBookings();
      setBookings(data.data);
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (profileMissing) {
    return (
      <Card className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Complete your college profile to get started
        </h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
          You haven't set up your college profile yet. You need a complete profile before you can
          post presentation requirements.
        </p>
        <Link
          to="/college/profile"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Create Profile <ArrowRight className="w-4 h-4" />
        </Link>
      </Card>
    );
  }

  if (profileLoadFailed || !profile) {
    return (
      <Card className="text-center py-10">
        <p className="text-slate-500 text-sm mb-4">Couldn't load your dashboard. Try again.</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </Card>
    );
  }

  const activeCount = requirements.filter((r) => r.status === 'active').length;
  const draftCount = requirements.filter((r) => r.status === 'draft').length;
  const closedCount = requirements.filter((r) => r.status === 'closed').length;
  const cancelledCount = requirements.filter((r) => r.status === 'cancelled').length;
  const totalApplications = requirements.reduce((sum, r) => sum + (r.applicationsCount || 0), 0);

  const pendingPaymentBookings = bookings.filter((b) => b.status === 'pending_payment').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

  const totalSpent = bookings
    .filter((b) => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.totalChargeAmount || b.agreedFee || 0), 0);
  const totalCommissionPaid = bookings
    .filter((b) => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

  const requirementStatusData = [
    { name: 'Active', value: activeCount },
    { name: 'Draft', value: draftCount },
    { name: 'Closed', value: closedCount },
    { name: 'Cancelled', value: cancelledCount },
  ].filter((d) => d.value > 0);

  const bookingStatusData = [
    { name: 'Pending Payment', value: pendingPaymentBookings, key: 'pending_payment' },
    { name: 'Confirmed', value: confirmedBookings, key: 'confirmed' },
    { name: 'Completed', value: completedBookings, key: 'completed' },
    { name: 'Cancelled', value: cancelledBookings, key: 'cancelled' },
  ];

  const revenueBreakdown = [
    { name: 'Spend', totalPaid: totalSpent, commission: totalCommissionPaid },
  ];

  const recentRequirements = [...requirements]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox
          icon={FileText}
          label="Requirements Posted"
          value={requirements.length}
          tint="bg-primary/10 text-primary"
        />
        <StatBox
          icon={CheckCircle2}
          label="Active Requirements"
          value={activeCount}
          tint="bg-success/10 text-success"
        />
        <StatBox
          icon={Users2}
          label="Applications Received"
          value={totalApplications}
          tint="bg-secondary/10 text-secondary"
        />
        <StatBox
          icon={CalendarCheck2}
          label="Total Bookings"
          value={bookings.length}
          tint="bg-primary/10 text-primary"
        />
        <StatBox
          icon={Clock}
          label="Awaiting Payment"
          value={pendingPaymentBookings}
          tint="bg-warning/10 text-warning"
        />
        <StatBox
          icon={IndianRupee}
          label="Total Spent"
          value={`₹${totalSpent}`}
          tint="bg-success/10 text-success"
        />
      </div>

      {!profile.isProfileComplete && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-warning text-sm flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 shrink-0" />
            Your profile is incomplete — add description, address, contact person, and logo so
            presenters trust and find you.{' '}
            <Link to="/college/profile" className="text-primary font-medium underline">
              Complete it now →
            </Link>
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Requirement Status Breakdown">
          {requirementStatusData.length === 0 ? (
            <p className="text-slate-500 text-sm py-10 text-center">No requirements posted yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requirementStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {requirementStatusData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Booking Pipeline">
          {bookings.length === 0 ? (
            <p className="text-slate-500 text-sm py-10 text-center">No bookings yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bookingStatusData}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={index} fill={BOOKING_COLORS[entry.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card title="Spend Breakdown (Fee vs Commission)">
        {totalSpent === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">No completed payments yet.</p>
        ) : (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Bar
                    dataKey="totalPaid"
                    name="Total Paid"
                    fill="#2563EB"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                  <Bar
                    dataKey="commission"
                    name="Platform Commission"
                    fill="#7C3AED"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500">Total Paid</p>
                <p className="text-lg font-semibold text-primary">₹{totalSpent}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500">Platform Commission</p>
                <p className="text-lg font-semibold text-secondary">₹{totalCommissionPaid}</p>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card
        title="Recent Requirements"
        actions={
          <Link
            to="/college/requirements"
            className="flex items-center gap-1.5 text-sm text-primary font-medium"
          >
            <PlusCircle className="w-4 h-4" /> New
          </Link>
        }
      >
        {recentRequirements.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No requirements posted yet.{' '}
            <Link to="/college/requirements" className="text-primary font-medium">
              Post your first one →
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentRequirements.map((req) => (
              <li key={req._id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{req.title}</p>
                  <p className="text-xs text-slate-500">
                    {req.applicationsCount || 0} application(s)
                  </p>
                </div>
                <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default CollegeDashboardHome;

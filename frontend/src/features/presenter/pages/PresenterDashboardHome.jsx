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
  FileStack,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  CalendarCheck2,
  IndianRupee,
  Star,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getMyPresenterProfile, getMyApplications } from '../api/presenterApi';
import { getMyBookings } from '../api/bookingApi';

const badgeVariant = {
  shortlisted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
  applied: 'warning',
  booked: 'primary',
  completed: 'success',
};

const PIE_COLORS = ['#F59E0B', '#16A34A', '#2563EB', '#7C3AED', '#DC2626', '#94A3B8'];
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

const PresenterDashboardHome = () => {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profileMissing, setProfileMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyPresenterProfile();
        setProfile(data.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setProfileMissing(true);
        } else {
          toast.error('Failed to load profile');
        }
      }

      try {
        const { data } = await getMyApplications();
        setApplications(data.data);
      } catch {
        // Profile not created yet
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
          Complete your profile to get started
        </h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
          You haven't created a presenter profile yet. Colleges can't discover you or review your
          applications until your profile is set up.
        </p>
        <Link
          to="/presenter/profile"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Create Profile <ArrowRight className="w-4 h-4" />
        </Link>
      </Card>
    );
  }

  const applied = applications.filter((a) => a.status === 'applied').length;
  const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;
  const booked = applications.filter((a) => a.status === 'booked').length;
  const completed = applications.filter((a) => a.status === 'completed').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;
  const withdrawn = applications.filter((a) => a.status === 'withdrawn').length;

  const pendingPaymentBookings = bookings.filter((b) => b.status === 'pending_payment').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

  const totalEarnings = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.presenterPayoutAmount || 0), 0);
  const pendingEarnings = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.presenterPayoutAmount || 0), 0);

  const applicationPipelineData = [
    { name: 'Applied', value: applied },
    { name: 'Shortlisted', value: shortlisted },
    { name: 'Booked', value: booked },
    { name: 'Completed', value: completed },
    { name: 'Rejected', value: rejected },
    { name: 'Withdrawn', value: withdrawn },
  ].filter((d) => d.value > 0);

  const bookingStatusData = [
    { name: 'Pending Payment', value: pendingPaymentBookings, key: 'pending_payment' },
    { name: 'Confirmed', value: confirmedBookings, key: 'confirmed' },
    { name: 'Completed', value: completedBookings, key: 'completed' },
    { name: 'Cancelled', value: cancelledBookings, key: 'cancelled' },
  ];

  const earningsData = [{ name: 'Earnings', earned: totalEarnings, pending: pendingEarnings }];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox
          icon={FileStack}
          label="Applications Submitted"
          value={applications.length}
          tint="bg-primary/10 text-primary"
        />
        <StatBox
          icon={Clock}
          label="Pending Review"
          value={applied}
          tint="bg-warning/10 text-warning"
        />
        <StatBox
          icon={CheckCircle2}
          label="Shortlisted"
          value={shortlisted}
          tint="bg-success/10 text-success"
        />
        <StatBox
          icon={CalendarCheck2}
          label="Total Bookings"
          value={bookings.length}
          tint="bg-secondary/10 text-secondary"
        />
        <StatBox
          icon={IndianRupee}
          label="Total Earnings"
          value={`₹${totalEarnings}`}
          tint="bg-success/10 text-success"
        />
        <StatBox
          icon={Star}
          label="Your Rating"
          value={
            profile.ratingsCount > 0
              ? `${profile.ratingsAverage} (${profile.ratingsCount})`
              : 'No reviews yet'
          }
          tint="bg-warning/10 text-warning"
        />
      </div>

      {!profile.isProfileComplete && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-warning text-sm flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 shrink-0" />
            Your profile is incomplete — add a headline, bio, skills, and education so colleges can
            find and shortlist you.{' '}
            <Link to="/presenter/profile" className="text-primary font-medium underline">
              Complete it now →
            </Link>
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Application Pipeline">
          {applicationPipelineData.length === 0 ? (
            <p className="text-slate-500 text-sm py-10 text-center">No applications yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applicationPipelineData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {applicationPipelineData.map((_, index) => (
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

        <Card title="Booking Status">
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

      <Card title="Earnings Overview">
        {totalEarnings === 0 && pendingEarnings === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">
            No earnings yet — complete a booking to see your payout here.
          </p>
        ) : (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Bar
                    dataKey="earned"
                    name="Earned (Completed)"
                    fill="#16A34A"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending (Confirmed)"
                    fill="#2563EB"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500">Earned so far</p>
                <p className="text-lg font-semibold text-success">₹{totalEarnings}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500">Pending (awaiting completion)</p>
                <p className="text-lg font-semibold text-primary">₹{pendingEarnings}</p>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card title="Recent Applications">
        {applications.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No applications yet. Browse opportunities to get started.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {applications.slice(0, 5).map((app) => (
              <li key={app._id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {app.requirement?.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{app.college?.collegeName}</p>
                </div>
                <Badge variant={badgeVariant[app.status]}>{app.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default PresenterDashboardHome;

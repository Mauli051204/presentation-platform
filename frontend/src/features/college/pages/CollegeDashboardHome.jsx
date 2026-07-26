import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle2,
  Users2,
  IndianRupee,
  ArrowRight,
  Sparkles,
  PlusCircle,
  RefreshCcw,
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
      // profile not created yet, or same transient failure — non-fatal here
    }

    try {
      const { data } = await getMyBookings();
      setBookings(data.data);
    } catch {
      // profile not created yet
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
        <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <RefreshCcw className="w-7 h-7 text-danger" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Couldn't load your dashboard</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
          Something went wrong while loading your college profile. This is usually temporary — try
          again.
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCcw className="w-4 h-4" /> Retry
        </button>
      </Card>
    );
  }

  const activeCount = requirements.filter((r) => r.status === 'active').length;
  const totalApplications = requirements.reduce((sum, r) => sum + (r.applicationsCount || 0), 0);
  const totalSpent = bookings
    .filter((b) => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.agreedFee || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          icon={IndianRupee}
          label="Total Booked"
          value={`₹${totalSpent}`}
          tint="bg-warning/10 text-warning"
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
        {requirements.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No requirements posted yet.{' '}
            <Link to="/college/requirements" className="text-primary font-medium">
              Post your first one →
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {requirements.slice(0, 5).map((req) => (
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

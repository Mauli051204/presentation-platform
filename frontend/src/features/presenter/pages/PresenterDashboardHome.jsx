import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileStack, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getMyPresenterProfile, getMyApplications } from '../api/presenterApi';

const badgeVariant = {
  shortlisted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
  applied: 'warning',
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

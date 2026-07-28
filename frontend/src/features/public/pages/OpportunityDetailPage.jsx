import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin,
  CalendarDays,
  IndianRupee,
  Clock,
  Users2,
  Languages,
  ArrowLeft,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/common/ShareButton';
import { useAuth } from '@/context/AuthContext';
import { getRequirementPublic } from '../api/publicApi';
import { formatBudget } from '@/utils/formatBudget';

const OpportunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requirement, setRequirement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await getRequirementPublic(id);
        setRequirement(data.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error('Failed to load opportunity');
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApply = () => {
    if (!user) {
      toast('Create a presenter account to apply', { icon: 'ℹ️' });
      navigate('/register');
      return;
    }
    if (user.role !== 'presenter') {
      toast.error('Only presenter accounts can apply to opportunities');
      return;
    }
    navigate('/presenter/opportunities');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !requirement) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Opportunity not found</h1>
        <p className="text-slate-500 mb-6">
          This listing doesn't exist, has closed, or is no longer active.
        </p>
        <Link to="/find-opportunities" className="text-primary font-medium">
          ← Back to Find Opportunities
        </Link>
      </div>
    );
  }

  const deadlinePassed = new Date(requirement.applicationDeadline) < new Date();

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/find-opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Find Opportunities
        </Link>

        <Card>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{requirement.title}</h1>
              <Link
                to={`/colleges/${requirement.college?._id}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary mt-1 hover:underline"
              >
                {requirement.college?.logo?.url ? (
                  <img
                    src={requirement.college.logo.url}
                    alt=""
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
                {requirement.college?.collegeName}
              </Link>
            </div>
            <ShareButton title={requirement.title} />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="neutral">{requirement.presentationType}</Badge>
            {requirement.location?.city && (
              <Badge variant="neutral">
                <MapPin className="w-3 h-3" /> {requirement.location.city}
                {requirement.location.state ? `, ${requirement.location.state}` : ''}
              </Badge>
            )}
            <Badge variant="success">
              <IndianRupee className="w-3 h-3" />{' '}
              {formatBudget(requirement.budgetMin, requirement.budgetMax)}
            </Badge>
            <Badge variant="neutral">
              <CalendarDays className="w-3 h-3" />{' '}
              {new Date(requirement.eventDate).toLocaleDateString()}
            </Badge>
            <Badge variant="neutral">
              <Clock className="w-3 h-3" /> {requirement.durationMinutes} min
            </Badge>
            {requirement.numberOfPresentersNeeded > 0 && (
              <Badge variant="primary">
                <Users2 className="w-3 h-3" /> {requirement.numberOfPresentersNeeded} Presenter
                {requirement.numberOfPresentersNeeded > 1 ? 's' : ''} Needed
              </Badge>
            )}
          </div>

          <button
            onClick={handleApply}
            disabled={deadlinePassed}
            className="mt-6 w-full sm:w-auto bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {deadlinePassed ? 'Application Deadline Passed' : 'Apply for this Opportunity'}
          </button>
        </Card>

        <Card className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">Description</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{requirement.description}</p>
        </Card>

        {(requirement.requiredSkills?.length > 0 || requirement.requiredLanguages?.length > 0) && (
          <Card className="mt-6 space-y-4">
            {requirement.requiredSkills?.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-2">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {requirement.requiredSkills.map((s) => (
                    <Badge key={s} variant="primary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {requirement.requiredLanguages?.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-primary" /> Required Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {requirement.requiredLanguages.map((l) => (
                    <Badge key={l} variant="neutral">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <Card className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Key Dates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Event Date</p>
              <p className="text-sm font-medium text-slate-900">
                {new Date(requirement.eventDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Application Deadline</p>
              <p
                className={`text-sm font-medium ${deadlinePassed ? 'text-danger' : 'text-slate-900'}`}
              >
                {new Date(requirement.applicationDeadline).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {deadlinePassed && ' (Passed)'}
              </p>
            </div>
          </div>
        </Card>

        {requirement.college && (
          <Card className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {requirement.college.logo?.url ? (
                  <img
                    src={requirement.college.logo.url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {requirement.college.collegeName}
                  </p>
                  {requirement.college.address?.city && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {requirement.college.address.city}
                    </p>
                  )}
                </div>
              </div>
              <Link
                to={`/colleges/${requirement.college._id}`}
                className="text-sm text-primary font-medium whitespace-nowrap"
              >
                View College →
              </Link>
            </div>
          </Card>
        )}

        <div className="text-center mt-8 mb-4">
          <p className="text-sm text-slate-500">
            Not registered yet?{' '}
            <Link to="/register" className="text-primary font-medium">
              Create a presenter account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailPage;

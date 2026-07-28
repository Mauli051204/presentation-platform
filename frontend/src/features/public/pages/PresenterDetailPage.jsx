import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin,
  Star,
  Languages,
  GraduationCap,
  Briefcase,
  FileText,
  Video as VideoIcon,
  Award,
  ArrowLeft,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/common/ShareButton';
import PublicReviewsList from '@/components/common/PublicReviewsList';
import { getPresenterPublic, getReviewsForPresenterPublic } from '../api/publicApi';
import { viewFile } from '@/utils/viewFile';

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const PresenterDetailPage = () => {
  const { id } = useParams();
  const [presenter, setPresenter] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await getPresenterPublic(id);
        setPresenter(data.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error('Failed to load presenter profile');
        }
      }
      try {
        const { data } = await getReviewsForPresenterPublic(id);
        setReviews(data.data);
      } catch {
        // non-fatal
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !presenter) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Presenter not found</h1>
        <p className="text-slate-500 mb-6">This profile doesn't exist or is no longer available.</p>
        <Link to="/find-presenters" className="text-primary font-medium">
          ← Back to Find Presenters
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/find-presenters"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Find Presenters
        </Link>

        <Card>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {presenter.profileImage?.url ? (
              <img
                src={presenter.profileImage.url}
                alt=""
                className="w-24 h-24 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-semibold shrink-0">
                {initials(presenter.user?.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{presenter.user?.name}</h1>
                  <p className="text-slate-500 mt-1">{presenter.headline}</p>
                </div>
                <ShareButton title={presenter.user?.name} />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {presenter.location?.city && (
                  <Badge variant="neutral">
                    <MapPin className="w-3 h-3" /> {presenter.location.city}
                    {presenter.location.state ? `, ${presenter.location.state}` : ''}
                  </Badge>
                )}
                {presenter.languages?.length > 0 && (
                  <Badge variant="neutral">
                    <Languages className="w-3 h-3" /> {presenter.languages.join(', ')}
                  </Badge>
                )}
                {presenter.ratingsCount > 0 && (
                  <Badge variant="warning">
                    <Star className="w-3 h-3 fill-warning" /> {presenter.ratingsAverage} (
                    {presenter.ratingsCount} reviews)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {presenter.bio && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-2">About</h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{presenter.bio}</p>
          </Card>
        )}

        {presenter.skills?.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {presenter.skills.map((s) => (
                <Badge key={s} variant="primary">
                  {s}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {presenter.education?.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Education
            </h2>
            <div className="space-y-3">
              {presenter.education.map((edu) => (
                <div key={edu._id}>
                  <p className="text-sm font-medium text-slate-900">{edu.degree}</p>
                  <p className="text-sm text-slate-500">
                    {edu.institution} · {edu.yearOfCompletion}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {presenter.experience?.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Experience
            </h2>
            <div className="space-y-4">
              {presenter.experience.map((exp) => (
                <div key={exp._id}>
                  <p className="text-sm font-medium text-slate-900">{exp.title}</p>
                  <p className="text-sm text-slate-500">
                    {exp.organization} · {new Date(exp.startDate).getFullYear()}
                    {exp.isCurrent
                      ? ' – Present'
                      : exp.endDate
                        ? ` – ${new Date(exp.endDate).getFullYear()}`
                        : ''}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-slate-600 mt-1">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {presenter.videos?.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-primary" /> Sample Videos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presenter.videos.map((v) => (
                <a
                  key={v._id}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-slate-50"
                >
                  <VideoIcon className="w-4 h-4 shrink-0" /> {v.title}
                </a>
              ))}
            </div>
          </Card>
        )}

        {presenter.certificates?.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Certificates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presenter.certificates.map((c) => (
                <a
                  key={c._id}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-slate-50"
                >
                  <Award className="w-4 h-4 shrink-0" /> {c.title}
                </a>
              ))}
            </div>
          </Card>
        )}

        {presenter.resume?.url && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Resume
            </h2>
            <button
              onClick={() => viewFile(presenter.resume.url)}
              className="text-sm text-primary font-medium hover:underline"
            >
              View Resume →
            </button>
          </Card>
        )}

        <Card className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            Reviews {presenter.ratingsCount > 0 && `(${presenter.ratingsCount})`}
          </h2>
          <PublicReviewsList reviews={reviews} />
        </Card>

        <div className="text-center mt-8 mb-4">
          <p className="text-sm text-slate-500">
            Represent a college looking for a speaker?{' '}
            <Link to="/register" className="text-primary font-medium">
              Register to book presenters →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PresenterDetailPage;

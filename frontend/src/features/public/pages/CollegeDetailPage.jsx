import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin,
  ShieldCheck,
  Building2,
  Globe,
  ArrowLeft,
  IndianRupee,
  CalendarDays,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/common/ShareButton';
import PublicReviewsList from '@/components/common/PublicReviewsList';
import {
  getCollegePublic,
  getReviewsForCollegePublic,
  searchRequirementsPublic,
} from '../api/publicApi';
import { formatBudget } from '@/utils/formatBudget';

const CollegeDetailPage = () => {
  const { id } = useParams();
  const [college, setCollege] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeRequirements, setActiveRequirements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await getCollegePublic(id);
        setCollege(data.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error('Failed to load college profile');
        }
      }
      try {
        const { data } = await getReviewsForCollegePublic(id);
        setReviews(data.data);
      } catch {
        // non-fatal
      }
      try {
        const { data } = await searchRequirementsPublic({ college: id, limit: 10 });
        setActiveRequirements(data.data);
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

  if (notFound || !college) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">College not found</h1>
        <p className="text-slate-500 mb-6">
          This college profile doesn't exist or is no longer available.
        </p>
        <Link to="/colleges" className="text-primary font-medium">
          ← Back to Colleges
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/colleges"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Colleges
        </Link>

        <Card>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {college.logo?.url ? (
              <img
                src={college.logo.url}
                alt=""
                className="w-24 h-24 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900">{college.collegeName}</h1>
                    {college.isVerified && (
                      <Badge variant="success">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  {college.address?.city && (
                    <p className="text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {college.address.city}, {college.address.state}
                    </p>
                  )}
                </div>
                <ShareButton title={college.collegeName} />
              </div>
              {college.website && (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary mt-2"
                >
                  <Globe className="w-3.5 h-3.5" /> {college.website}
                </a>
              )}
              {college.ratingsCount > 0 && (
                <Badge variant="warning" className="mt-2">
                  ★ {college.ratingsAverage} ({college.ratingsCount} reviews)
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {college.description && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-2">About</h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{college.description}</p>
          </Card>
        )}

        {college.departments?.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Departments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {college.departments.map((dept) => (
                <div key={dept._id} className="border border-slate-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-900">{dept.name}</p>
                  {dept.headOfDepartment && (
                    <p className="text-xs text-slate-500 mt-0.5">HOD: {dept.headOfDepartment}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {college.gallery?.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {college.gallery.map((img) => (
                <div key={img._id}>
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  {img.caption && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Active Requirements</h2>
          {activeRequirements.length === 0 ? (
            <p className="text-sm text-slate-500">No active requirements posted right now.</p>
          ) : (
            <div className="space-y-3">
              {activeRequirements.map((req) => (
                <Link
                  key={req._id}
                  to={`/opportunities/${req._id}`}
                  className="block border border-slate-200 rounded-lg p-3 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-900">{req.title}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="neutral">{req.presentationType}</Badge>
                    <Badge variant="success">
                      <IndianRupee className="w-3 h-3" />{' '}
                      {formatBudget(req.budgetMin, req.budgetMax)}
                    </Badge>
                    <Badge variant="neutral">
                      <CalendarDays className="w-3 h-3" />{' '}
                      {new Date(req.eventDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            Reviews {college.ratingsCount > 0 && `(${college.ratingsCount})`}
          </h2>
          <PublicReviewsList reviews={reviews} />
        </Card>

        <div className="text-center mt-8 mb-4">
          <p className="text-sm text-slate-500">
            Are you a presenter?{' '}
            <Link to="/register" className="text-primary font-medium">
              Register and apply to opportunities →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollegeDetailPage;

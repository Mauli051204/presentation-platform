import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  CalendarCheck2,
  Star,
  FileText,
  Download,
  Eye,
  IndianRupee,
  CalendarDays,
  MapPin,
  Languages,
  GraduationCap,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import Modal from "@/components/ui/Modal";
import { getRequirementById } from "../api/requirementApi";
import { getApplicationsForRequirement, updateApplicationStatus } from "../api/applicationApi";
import { createBooking } from "../api/bookingApi";
import { getOrCreateConversation } from "../api/chatApi";
import { formatBudget } from "@/utils/formatBudget";
import { downloadFile } from "@/utils/downloadFile";
import { viewFile } from '@/utils/viewFile';

const statusVariant = {
  applied: "warning",
  shortlisted: "success",
  rejected: "danger",
  withdrawn: "neutral",
  booked: "primary",
};

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

const RequirementApplicationsPage = () => {
  const { requirementId } = useParams();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [bookTarget, setBookTarget] = useState(null);
  const [bookForm, setBookForm] = useState({ agreedFee: "", meetingLink: "" });
  const [isBooking, setIsBooking] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [reqRes, appsRes] = await Promise.all([
        getRequirementById(requirementId),
        getApplicationsForRequirement(requirementId),
      ]);
      setRequirement(reqRes.data.data);
      setApplications(appsRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementId]);

  const handleShortlist = async (applicationId) => {
    const previous = applications;
    setActioningId(applicationId);
    setApplications((prev) =>
      prev.map((a) => (a._id === applicationId ? { ...a, status: "shortlisted" } : a))
    );
    try {
      await updateApplicationStatus(applicationId, "shortlisted");
      toast.success("Application shortlisted");
    } catch (error) {
      setApplications(previous);
      toast.error(error.response?.data?.message || "Failed to update application");
    } finally {
      setActioningId(null);
    }
  };

  const openRejectModal = (application) => {
    setRejectTarget(application);
    setRejectReason("");
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    const applicationId = rejectTarget._id;
    const reason = rejectReason.trim();
    const previous = applications;

    setIsRejecting(true);
    setApplications((prev) =>
      prev.map((a) => (a._id === applicationId ? { ...a, status: "rejected", rejectionReason: reason } : a))
    );
    setRejectTarget(null);

    try {
      await updateApplicationStatus(applicationId, "rejected", reason);
      toast.success("Application rejected");
    } catch (error) {
      setApplications(previous);
      toast.error(error.response?.data?.message || "Failed to reject application");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleMessagePresenter = async (applicationId) => {
    try {
      const { data } = await getOrCreateConversation(applicationId);
      navigate(`/college/messages?conversationId=${data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to open conversation");
    }
  };

  const openBookModal = (app) => {
    setBookTarget(app);
    setBookForm({ agreedFee: "", meetingLink: "" });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!bookForm.agreedFee) {
      toast.error("Agreed fee is required");
      return;
    }
    if (requirement.presentationType === "online" && !bookForm.meetingLink) {
      toast.error("Meeting link is required for online presentations");
      return;
    }

    const applicationId = bookTarget._id;
    const previous = applications;

    setIsBooking(true);
    setApplications((prev) =>
      prev.map((a) => (a._id === applicationId ? { ...a, status: "booked" } : a))
    );
    setBookTarget(null);

    try {
      await createBooking({
        applicationId,
        agreedFee: Number(bookForm.agreedFee),
        meetingLink: bookForm.meetingLink || undefined,
      });
      toast.success("Presenter booked! Go to Bookings to complete the payment.");
    } catch (error) {
      setApplications(previous);
      toast.error(error.response?.data?.message || "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
  };

  const handleDownloadResume = (app) => {
    const filename = `${app.presenter?.user?.name || "presenter"}-resume.pdf`;
    downloadFile(app.presenter.resume.url, filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requirement && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">{requirement.title}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="neutral">{requirement.presentationType}</Badge>
            <Badge variant="success">
              <IndianRupee className="w-3 h-3" />{' '}
              {formatBudget(requirement.budgetMin, requirement.budgetMax)}
            </Badge>
            <Badge variant="neutral">
              <CalendarDays className="w-3 h-3" />{' '}
              {new Date(requirement.eventDate).toLocaleDateString()}
            </Badge>
          </div>
        </Card>
      )}

      {applications.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-500 text-sm">
            No applications received yet for this requirement.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {app.presenter?.profileImage?.url ? (
                      <img
                        src={app.presenter.profileImage.url}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {initials(app.presenter?.user?.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {app.presenter?.user?.name}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">{app.presenter?.headline}</p>
                    </div>
                  </div>

                  {app.presenter?.bio && (
                    <p className="text-sm text-slate-600 mt-3">{app.presenter.bio}</p>
                  )}

                  {app.coverNote && (
                    <p className="text-sm text-slate-600 mt-2 italic border-l-2 border-slate-200 pl-3">
                      "{app.coverNote}"
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                    {app.presenter?.location?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {app.presenter.location.city}
                        {app.presenter.location.state ? `, ${app.presenter.location.state}` : ''}
                      </span>
                    )}
                    {(app.presenter?.languages || []).length > 0 && (
                      <span className="flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5" /> {app.presenter.languages.join(', ')}
                      </span>
                    )}
                    {(app.presenter?.education || [])[0] && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {app.presenter.education[0].degree} ·{' '}
                        {app.presenter.education[0].institution}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
                    {(app.presenter?.skills || []).map((s) => (
                      <Badge key={s} variant="neutral">
                        {s}
                      </Badge>
                    ))}
                    {app.presenter?.ratingsCount > 0 && (
                      <Badge variant="warning">
                        <Star className="w-3 h-3 fill-warning" /> {app.presenter.ratingsAverage} (
                        {app.presenter.ratingsCount})
                      </Badge>
                    )}
                    {app.proposedFee && (
                      <Badge variant="primary">
                        <IndianRupee className="w-3 h-3" /> Proposed: {app.proposedFee}
                      </Badge>
                    )}
                  </div>

                  {app.presenter?.resume?.url && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => viewFile(app.presenter.resume.url)}
                        className="inline-flex items-center gap-1.5 text-sm text-primary font-medium"
                      >
                        <Eye className="w-4 h-4" /> View Resume
                      </button>
                      <button
                        onClick={() => handleDownloadResume(app)}
                        className="inline-flex items-center gap-1.5 text-sm text-primary font-medium"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col flex-wrap gap-3 sm:gap-2 sm:items-end shrink-0">
                  {app.status === 'applied' && (
                    <>
                      <button
                        onClick={() => handleShortlist(app._id)}
                        disabled={actioningId === app._id}
                        className="flex items-center gap-1.5 text-sm bg-success text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50 whitespace-nowrap transition-opacity"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Shortlist
                      </button>
                      <button
                        onClick={() => openRejectModal(app)}
                        className="flex items-center gap-1.5 text-sm text-danger whitespace-nowrap"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {app.status === 'shortlisted' && (
                    <>
                      <button
                        onClick={() => openBookModal(app)}
                        className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 whitespace-nowrap transition-opacity"
                      >
                        <CalendarCheck2 className="w-4 h-4" /> Book
                      </button>
                      <button
                        onClick={() => handleMessagePresenter(app._id)}
                        className="flex items-center gap-1.5 text-sm text-primary font-medium whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                    </>
                  )}
                  {app.status === 'booked' && (
                    <>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        See Bookings to pay
                      </span>
                      <button
                        onClick={() => handleMessagePresenter(app._id)}
                        className="flex items-center gap-1.5 text-sm text-primary font-medium whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={`Reject ${rejectTarget?.presenter?.user?.name || ''}`}
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <TextArea
            label="Reason (optional, shared with the presenter)"
            rows={3}
            maxLength={500}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="text-sm text-slate-500 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRejecting}
              className="bg-danger text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!bookTarget}
        onClose={() => setBookTarget(null)}
        title={`Book ${bookTarget?.presenter?.user?.name || ''}`}
      >
        <form onSubmit={handleBook} className="space-y-4">
          <TextInput
            label="Agreed Fee (₹)"
            type="number"
            value={bookForm.agreedFee}
            onChange={(e) => setBookForm((f) => ({ ...f, agreedFee: e.target.value }))}
            required
          />
          {requirement?.presentationType === 'online' && (
            <TextInput
              label="Google Meet Link"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={bookForm.meetingLink}
              onChange={(e) => setBookForm((f) => ({ ...f, meetingLink: e.target.value }))}
              required
            />
          )}
          <p className="text-xs text-slate-500">
            The platform commission is added on top of this fee — you'll see the exact total to pay
            on the Bookings page before completing payment.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setBookTarget(null)}
              className="text-sm text-slate-500 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBooking}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isBooking ? 'Booking...' : 'Book Presenter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RequirementApplicationsPage;
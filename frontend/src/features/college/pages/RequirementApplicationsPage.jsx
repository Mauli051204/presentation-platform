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
  IndianRupee,
  CalendarDays,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import TextInput from "@/components/ui/TextInput";
import Modal from "@/components/ui/Modal";
import { getRequirementById } from "../api/requirementApi";
import { getApplicationsForRequirement, updateApplicationStatus } from "../api/applicationApi";
import { createBooking } from "../api/bookingApi";
import { getOrCreateConversation } from "../api/chatApi";
import { formatBudget } from "@/utils/formatBudget";

const statusVariant = {
  applied: "warning",
  shortlisted: "success",
  rejected: "danger",
  withdrawn: "neutral",
  booked: "primary",
};

const RequirementApplicationsPage = () => {
  const { requirementId } = useParams();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
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

  const handleStatusChange = async (applicationId, status) => {
    setActioningId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      toast.success(`Application ${status}`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update application");
    } finally {
      setActioningId(null);
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

    setIsBooking(true);
    try {
      await createBooking({
        applicationId: bookTarget._id,
        agreedFee: Number(bookForm.agreedFee),
        meetingLink: bookForm.meetingLink || undefined,
      });
      toast.success("Presenter booked! Go to Bookings to complete the payment.");
      setBookTarget(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
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
              <IndianRupee className="w-3 h-3" /> {formatBudget(requirement.budgetMin, requirement.budgetMax)}
            </Badge>
            <Badge variant="neutral">
              <CalendarDays className="w-3 h-3" /> {new Date(requirement.eventDate).toLocaleDateString()}
            </Badge>
          </div>
        </Card>
      )}

      {applications.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-500 text-sm">No applications received yet for this requirement.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {app.presenter?.profileImage?.url && (
                      <img
                        src={app.presenter.profileImage.url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{app.presenter?.user?.name}</h3>
                      <p className="text-sm text-slate-500">{app.presenter?.headline}</p>
                    </div>
                  </div>
                  {app.coverNote && <p className="text-sm text-slate-600 mt-3">{app.coverNote}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
                    {(app.presenter?.skills || []).slice(0, 5).map((s) => (
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
                    {app.presenter?.resume?.url && (
                      <a
                        href={app.presenter.resume.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary underline"
                      >
                        <FileText className="w-3 h-3" /> Resume
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col flex-wrap gap-3 sm:gap-2 sm:items-end shrink-0">
                  {app.status === "applied" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(app._id, "shortlisted")}
                        disabled={actioningId === app._id}
                        className="flex items-center gap-1.5 text-sm bg-success text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50 whitespace-nowrap transition-opacity"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(app._id, "rejected")}
                        disabled={actioningId === app._id}
                        className="flex items-center gap-1.5 text-sm text-danger whitespace-nowrap"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {app.status === "shortlisted" && (
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
                  {app.status === "booked" && (
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

      <Modal isOpen={!!bookTarget} onClose={() => setBookTarget(null)} title={`Book ${bookTarget?.presenter?.user?.name || ""}`}>
        <form onSubmit={handleBook} className="space-y-4">
          <TextInput
            label="Agreed Fee (₹)"
            type="number"
            value={bookForm.agreedFee}
            onChange={(e) => setBookForm((f) => ({ ...f, agreedFee: e.target.value }))}
            required
          />
          {requirement?.presentationType === "online" && (
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
            <button type="button" onClick={() => setBookTarget(null)} className="text-sm text-slate-500 px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBooking}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isBooking ? "Booking..." : "Book Presenter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RequirementApplicationsPage;
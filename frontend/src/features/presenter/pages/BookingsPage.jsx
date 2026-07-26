import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MessageSquare, Star, Video, CalendarDays, IndianRupee } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import TextArea from "@/components/ui/TextArea";
import { getMyBookings } from "../api/bookingApi";
import { getOrCreateConversation } from "../api/chatApi";
import { submitReview } from "../api/reviewApi";

const statusVariant = { pending_payment: "warning", confirmed: "primary", completed: "success", cancelled: "danger" };

const statusOptions = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
        <Star
          className={`w-6 h-6 ${n <= value ? "text-warning fill-warning" : "text-slate-300"}`}
        />
      </button>
    ))}
  </div>
);

const BookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await getMyBookings(statusFilter ? { status: statusFilter } : {});
      setBookings(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleMessageCollege = async (booking) => {
    try {
      const { data } = await getOrCreateConversation(booking.application);
      navigate(`/presenter/messages?conversationId=${data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to open conversation");
    }
  };

  const openReviewModal = (booking) => {
    setReviewTarget(booking);
    setReviewForm({ rating: 5, comment: "" });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      await submitReview({
        bookingId: reviewTarget._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success("Review submitted — thank you!");
      setReviewedBookingIds((prev) => [...prev, reviewTarget._id]);
      setReviewTarget(null);
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("You've already reviewed this booking");
        setReviewedBookingIds((prev) => [...prev, reviewTarget._id]);
        setReviewTarget(null);
      } else {
        toast.error(error.response?.data?.message || "Failed to submit review");
      }
    } finally {
      setIsSubmittingReview(false);
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
      ) : bookings.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-500 text-sm">
            No bookings yet. Once a college books you after shortlisting, it'll appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{booking.requirement?.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{booking.college?.collegeName}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={statusVariant[booking.status]}>{booking.status.replace("_", " ")}</Badge>
                    <Badge variant="neutral">{booking.presentationType}</Badge>
                    <Badge variant="neutral">
                      <CalendarDays className="w-3 h-3" /> {new Date(booking.scheduledDate).toLocaleDateString()}
                    </Badge>
                    <Badge variant="success">
                      <IndianRupee className="w-3 h-3" /> {booking.presenterPayoutAmount}
                    </Badge>
                  </div>
                  {booking.presentationType === "online" && booking.meetingLink && (
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary mt-3 font-medium"
                    >
                      <Video className="w-4 h-4" /> Join Google Meet
                    </a>
                  )}
                </div>
                <div className="flex sm:flex-col gap-3 sm:gap-2 sm:items-end">
                  <button
                    onClick={() => handleMessageCollege(booking)}
                    className="flex items-center gap-1.5 text-sm text-primary font-medium whitespace-nowrap"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  {booking.status === "completed" && !reviewedBookingIds.includes(booking._id) && (
                    <button
                      onClick={() => openReviewModal(booking)}
                      className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground rounded-lg px-3 py-1.5 whitespace-nowrap hover:opacity-90 transition-opacity"
                    >
                      <Star className="w-4 h-4" /> Leave Review
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!reviewTarget} onClose={() => setReviewTarget(null)} title="Review this college">
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
            <StarPicker value={reviewForm.rating} onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))} />
          </div>
          <TextArea
            label="Comment (optional)"
            rows={4}
            maxLength={1000}
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => setReviewTarget(null)}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BookingsPage;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Link2,
  CheckCircle2,
  XCircle,
  Video,
  IndianRupee,
  CalendarDays,
  CreditCard,
  User,
  FileText,
  Star,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import { getMyBookings, updateMeetingLink, completeBooking, cancelBooking } from "../api/bookingApi";
import { createOrder, verifyPayment } from "../api/paymentApi";
import { getOrCreateConversation } from "../api/chatApi";
import { submitReview } from "../api/reviewApi";
import { loadRazorpayScript } from "@/utils/loadRazorpayScript";

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
        <Star className={`w-6 h-6 ${n <= value ? "text-warning fill-warning" : "text-slate-300"}`} />
      </button>
    ))}
  </div>
);

const BookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [linkTarget, setLinkTarget] = useState(null);
  const [newLink, setNewLink] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [completeTarget, setCompleteTarget] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const handleMessagePresenter = async (booking) => {
    try {
      const { data } = await getOrCreateConversation(booking.application);
      navigate(`/college/messages?conversationId=${data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to open conversation");
    }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    setBusyId(linkTarget._id);
    try {
      await updateMeetingLink(linkTarget._id, newLink);
      toast.success("Meeting link updated");
      setLinkTarget(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update link");
    } finally {
      setBusyId(null);
    }
  };

  // Optimistic: flip the UI to "completed" immediately on confirm so the
  // modal closes and the card updates instantly, instead of waiting on the
  // full round trip before anything visibly changes. Reverts on error.
  const handleConfirmComplete = async () => {
    const targetId = completeTarget._id;
    const previousBookings = bookings;
    setIsCompleting(true);
    setBookings((prev) => prev.map((b) => (b._id === targetId ? { ...b, status: "completed" } : b)));
    setCompleteTarget(null);

    try {
      await completeBooking(targetId);
      toast.success("Booking marked completed — payout released");
    } catch (error) {
      setBookings(previousBookings);
      toast.error(error.response?.data?.message || "Failed to complete booking");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }
    setBusyId(cancelTarget._id);
    try {
      await cancelBooking(cancelTarget._id, cancelReason);
      toast.success("Booking cancelled");
      setCancelTarget(null);
      setCancelReason("");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    } finally {
      setBusyId(null);
    }
  };

const handlePayNow = async (booking) => {
  setPayingId(booking._id);
  try {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load Razorpay checkout. Check your connection and try again.');
      return;
    }

    const { data: orderRes } = await createOrder(booking._id);
    const { razorpayOrder, razorpayKeyId, payment } = orderRes.data;

    // Guard: if the backend response is missing what checkout needs,
    // fail with a specific message instead of letting the Razorpay SDK
    // throw an opaque error deep inside new window.Razorpay(...).
    if (!razorpayKeyId) {
      console.error('[payment] razorpayKeyId missing from create-order response:', orderRes.data);
      toast.error("Payment gateway isn't configured correctly (missing key). Contact support.");
      return;
    }
    if (!razorpayOrder?.id && !payment?.razorpayOrderId) {
      console.error('[payment] No order id available:', orderRes.data);
      toast.error('Could not create a payment order. Try again in a moment.');
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: razorpayOrder ? razorpayOrder.amount : Math.round(payment.amount * 100),
      currency: razorpayOrder ? razorpayOrder.currency : 'INR',
      name: 'Presentation Platform',
      description: booking.requirement?.title,
      order_id: razorpayOrder ? razorpayOrder.id : payment.razorpayOrderId,
      handler: async (response) => {
        try {
          await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast.success('Payment successful — booking confirmed!');
          await load();
        } catch (verifyError) {
          toast.error(verifyError.response?.data?.message || 'Payment verification failed');
        }
      },
      modal: {
        ondismiss: () => {
          toast(
            'Payment window closed — you can try again anytime before the booking is cancelled',
            {
              icon: 'ℹ️',
            }
          );
        },
      },
      theme: { color: '#2563EB' },
    };

    try {
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (sdkError) {
      console.error('[payment] Razorpay SDK failed to open:', sdkError);
      toast.error(`Payment gateway error: ${sdkError.message || 'could not open checkout'}`);
    }
  } catch (error) {
    console.error('[payment] create-order request failed:', error);
    if (error.response) {
      toast.error(
        error.response.data?.message || `Payment order failed (status ${error.response.status})`
      );
    } else if (error.request) {
      toast.error('No response from server — check your network or that the backend is reachable.');
    } else {
      toast.error(`Failed to start payment: ${error.message}`);
    }
  } finally {
    setPayingId(null);
  }
};

  const openReviewModal = (booking) => {
    setReviewTarget(booking);
    setReviewForm({ rating: 5, comment: "" });
  };

  // Optimistic: hide the "Leave Review" button and close the modal the
  // instant the user submits, rather than making them wait on the network
  // before seeing any change.
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const targetId = reviewTarget._id;
    const previousBookings = bookings;
    setIsSubmittingReview(true);
    setBookings((prev) => prev.map((b) => (b._id === targetId ? { ...b, hasReviewed: true } : b)));
    setReviewTarget(null);

    try {
      await submitReview({
        bookingId: targetId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success("Review submitted — sent to the presenter");
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("You've already reviewed this booking");
      } else {
        setBookings(previousBookings);
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
            No bookings yet. Book a shortlisted presenter from a requirement's applications page.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking._id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="text-base font-semibold text-slate-900">{booking.requirement?.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{booking.presenter?.user?.name}</span>
                    {booking.presenter?.headline && (
                      <span className="text-slate-400">· {booking.presenter.headline}</span>
                    )}
                  </div>
                  {booking.presenter?.bio && (
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{booking.presenter.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={statusVariant[booking.status]}>{booking.status.replace("_", " ")}</Badge>
                    <Badge variant="neutral">{booking.presentationType}</Badge>
                    <Badge variant="neutral">
                      <CalendarDays className="w-3 h-3" /> {new Date(booking.scheduledDate).toLocaleDateString()}
                    </Badge>
                    <Badge variant="primary">
                      <IndianRupee className="w-3 h-3" /> Fee: {booking.agreedFee}
                    </Badge>
                    <Badge variant="warning">
                      <IndianRupee className="w-3 h-3" /> Commission ({booking.commissionPercent}%): {booking.commissionAmount}
                    </Badge>
                    <Badge variant="success">
                      <IndianRupee className="w-3 h-3" /> Total to Pay: {booking.totalChargeAmount}
                    </Badge>
                  </div>
                  {booking.presentationType === "online" && booking.meetingLink && (
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary mt-3 font-medium"
                    >
                      <Video className="w-4 h-4" /> Meeting link
                    </a>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col flex-wrap gap-3 sm:gap-2 sm:items-end shrink-0">
                  {booking.status === "pending_payment" && (
                    <button
                      onClick={() => handlePayNow(booking)}
                      disabled={payingId === booking._id}
                      className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50 whitespace-nowrap transition-opacity"
                    >
                      <CreditCard className="w-4 h-4" />
                      {payingId === booking._id ? "Opening..." : "Pay Now"}
                    </button>
                  )}
                  <button
                    onClick={() => handleMessagePresenter(booking)}
                    className="flex items-center gap-1.5 text-sm text-primary font-medium whitespace-nowrap"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  {booking.presentationType === "online" && booking.status !== "cancelled" && (
                    <button
                      onClick={() => {
                        setLinkTarget(booking);
                        setNewLink(booking.meetingLink || "");
                      }}
                      className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap"
                    >
                      <Link2 className="w-4 h-4" /> Update Link
                    </button>
                  )}
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => setCompleteTarget(booking)}
                      className="flex items-center gap-1.5 text-sm bg-success text-white rounded-lg px-3 py-1.5 hover:opacity-90 whitespace-nowrap transition-opacity"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Completed
                    </button>
                  )}
                  {booking.status === "completed" && !booking.hasReviewed && (
                    <button
                      onClick={() => openReviewModal(booking)}
                      className="flex items-center gap-1.5 text-sm bg-warning text-white rounded-lg px-3 py-1.5 hover:opacity-90 whitespace-nowrap transition-opacity"
                    >
                      <Star className="w-4 h-4" /> Leave Review
                    </button>
                  )}
                  {["pending_payment", "confirmed"].includes(booking.status) && (
                    <button
                      onClick={() => setCancelTarget(booking)}
                      className="flex items-center gap-1.5 text-sm text-danger whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!linkTarget} onClose={() => setLinkTarget(null)} title="Update Meeting Link">
        <form onSubmit={handleUpdateLink} className="space-y-4">
          <TextInput
            label="Google Meet Link"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            required
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={() => setLinkTarget(null)} className="text-sm text-slate-500 px-4 py-2.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busyId === linkTarget?._id}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleConfirmComplete}
        title="Mark booking as completed?"
        description="This releases the presenter's payout. This action cannot be undone."
        confirmLabel="Mark Completed"
        isDangerous={false}
        isLoading={isCompleting}
        icon={CheckCircle2}
      />

      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel Booking">
        <div className="space-y-4">
          <TextArea
            label="Reason"
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
          <p className="text-xs text-slate-500">
            If already paid, this automatically refunds the payment via Razorpay.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={() => setCancelTarget(null)} className="text-sm text-slate-500 px-4 py-2.5">
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={busyId === cancelTarget?._id}
              className="bg-danger text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {busyId === cancelTarget?._id ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!reviewTarget} onClose={() => setReviewTarget(null)} title={`Review ${reviewTarget?.presenter?.user?.name || "presenter"}`}>
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
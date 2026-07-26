import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Star, Trash2, MessageSquareOff } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { getReviewsModeration, deleteReview } from "../api/adminApi";

const ReviewsModerationPage = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data } = await getReviewsModeration({ page, limit: 20 });
      setReviews(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review? Ratings will be recalculated.")) return;
    setBusyId(id);
    try {
      await deleteReview(id);
      toast.success("Review removed");
      await load(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="text-center py-10">
          <MessageSquareOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No reviews yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${n <= r.rating ? "text-warning fill-warning" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                    <Badge variant="primary">{r.reviewerRole}</Badge>
                    <Badge variant="neutral">reviewing {r.targetType}</Badge>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment}</p>}
                  <p className="text-xs text-slate-400 mt-2">
                    By {r.reviewerUser?.name} ({r.reviewerUser?.email}) ·{" "}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r._id)}
                  disabled={busyId === r._id}
                  className="flex items-center gap-1.5 text-sm text-danger whitespace-nowrap disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  {busyId === r._id ? "Removing..." : "Remove"}
                </button>
              </div>
            </Card>
          ))}
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => load(p)} />
        </div>
      )}
    </div>
  );
};

export default ReviewsModerationPage;
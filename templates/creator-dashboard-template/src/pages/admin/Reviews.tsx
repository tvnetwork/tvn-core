import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, Trash2, CheckCircle, XCircle, Star } from "lucide-react";
import { useToast } from "../../components/Toast";

type Review = {
  id: string;
  book_id: string;
  author_name: string;
  rating: number;
  content: string;
  approved: boolean;
  created_at: string;
  books: {
    title: string;
  };
};

import AdminLayout from "../../components/AdminLayout";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingBulk, setProcessingBulk] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          book_id,
          author_name,
          rating,
          content,
          approved,
          created_at,
          books ( title )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data as unknown as Review[]);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      showToast(error.message || "Failed to fetch reviews", "error");
    } finally {
      setLoading(false);
    }
  }


  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map(r => r.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.size === 0) return;

    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedIds.size} reviews?`)) {
      return;
    }

    setProcessingBulk(true);
    try {
      const idsArray = Array.from(selectedIds);

      if (action === 'delete') {
        const { error } = await supabase.from('reviews').delete().in('id', idsArray);
        if (error) throw error;
        setReviews(current => current.filter(r => !selectedIds.has(r.id)));
        showToast(`${idsArray.length} reviews deleted`, 'success');
      } else {
        const isApproved = action === 'approve';
        const { error } = await supabase.from('reviews').update({ approved: isApproved }).in('id', idsArray);
        if (error) throw error;
        setReviews(current => current.map(r => selectedIds.has(r.id) ? { ...r, approved: isApproved } : r));
        showToast(`${idsArray.length} reviews ${action}d`, 'success');
      }
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Bulk action failed:', err);
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setProcessingBulk(false);
    }
  };

  async function toggleApproval(id: string, currentStatus: boolean) {
    setProcessing(id);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setReviews(current =>
        current.map(r => r.id === id ? { ...r, approved: !currentStatus } : r)
      );
      showToast(`Review ${!currentStatus ? 'approved' : 'hidden'} successfully`, "success");
    } catch (error: any) {
      console.error("Error toggling review approval:", error);
      showToast(error.message || "Failed to update review", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setProcessing(id);
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;

      setReviews((current) => current.filter((r) => r.id !== id));
      showToast("Review deleted successfully", "success");
    } catch (error: any) {
      console.error("Error deleting review:", error);
      showToast(error.message || "Failed to delete review", "error");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
    <AdminLayout>
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-deep-brown">Book Reviews</h1>
          <p className="text-taupe mt-2">Manage reader reviews for your books.</p>
        </div>
      </div>


      {reviews.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-primary/10 mb-4">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedIds.size === reviews.length && reviews.length > 0}
              onChange={toggleAll}
              className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary"
            />
            <span className="text-sm font-bold text-taupe uppercase tracking-widest">{selectedIds.size} Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={selectedIds.size === 0 || processingBulk}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={selectedIds.size === 0 || processingBulk}
              className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={selectedIds.size === 0 || processingBulk}
              className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-primary/10">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-taupe">
            <Star className="mx-auto h-12 w-12 text-primary/20 mb-4" />
            <p>No reviews found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="flex flex-col md:flex-row justify-between items-start gap-6 p-6 bg-soft-cream/30 rounded-2xl border border-primary/5 hover:border-primary/20 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedIds.has(review.id)}
                  onChange={() => toggleSelection(review.id)}
                  className="mt-1.5 w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary"
                />
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-deep-brown">{review.author_name}</span>
                    <div className="flex items-center text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-taupe/30"} />
                      ))}
                    </div>
                    <span className="text-xs text-taupe bg-white px-2 py-1 rounded-md border border-primary/10">
                      for: {review.books?.title || "Unknown Book"}
                    </span>
                    <span className="text-xs text-taupe/60">
                      {new Date(review.created_at).toLocaleString()}
                    </span>
                    {!review.approved && (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-deep-brown/80 leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => toggleApproval(review.id, review.approved)}
                    disabled={processing === review.id}
                    className={`p-2 rounded-xl transition-colors ${review.approved ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    title={review.approved ? "Hide Review" : "Approve Review"}
                  >
                    {processing === review.id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : review.approved ? (
                      <XCircle size={20} />
                    ) : (
                      <CheckCircle size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={processing === review.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Review"
                  >
                    {processing === review.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}

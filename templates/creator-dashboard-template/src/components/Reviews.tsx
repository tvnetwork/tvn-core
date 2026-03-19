import { useState, useEffect } from 'react';
import { Loader2, Star, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

export type Review = {
  id: string;
  book_id: string;
  author_name: string;
  rating: number;
  content: string;
  approved: boolean;
  created_at: string;
};

type ReviewsProps = {
  bookId: string;
};

export default function Reviews({ bookId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newReview, setNewReview] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const { showToast } = useToast();

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel('public:reviews')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'reviews',
        filter: `book_id=eq.${bookId}`
      }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookId]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('book_id', bookId)
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newReview.trim() || !authorName.trim()) {
      showToast('Please provide your name and a review.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            book_id: bookId,
            author_name: authorName.trim(),
            rating: rating,
            content: newReview.trim(),
          }
        ]);

      if (error) throw error;

      setNewReview('');
      setRating(5);
      showToast('Review submitted! It will appear once approved by the author.', 'success');
    } catch (error: any) {
      console.error('Error posting review:', error);
      showToast(error.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div id="reviews" className="mt-16 pt-12 border-t border-primary/10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Star className="text-primary" size={24} />
          <h3 className="text-2xl font-serif font-bold text-deep-brown">Reader Reviews</h3>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center space-x-2 bg-soft-cream px-4 py-2 rounded-xl">
            <span className="font-bold text-deep-brown text-xl">{averageRating.toFixed(1)}</span>
            <div className="flex items-center text-accent">
              <Star className="fill-current" size={16} />
            </div>
            <span className="text-sm text-taupe font-medium">({reviews.length})</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-12 bg-soft-cream/30 p-6 rounded-2xl border border-primary/5">
        <h4 className="text-sm font-bold text-deep-brown uppercase tracking-widest mb-4">Leave a Review</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">
              Rating
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-accent text-accent'
                        : 'text-taupe/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="authorName" className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">
                Your Name
              </label>
              <input
                id="authorName"
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border-none focus:ring-2 focus:ring-primary/20"
                placeholder="Jane Reader"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="review" className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">
                Your Review
              </label>
              <textarea
                id="review"
                required
                rows={4}
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="What did you think of the book?"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-taupe font-medium italic">
              Reviews are moderated and will appear after approval.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
              <span>Submit Review</span>
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-deep-brown">{review.author_name}</span>
                  <div className="flex items-center text-accent">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-taupe/30"} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-taupe font-medium">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-deep-brown/80 leading-relaxed whitespace-pre-wrap">
                {review.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-taupe italic">
            No reviews yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}

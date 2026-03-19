import { useState, useEffect } from 'react';
import { Loader2, MessageCircle, Send, Heart, Reply } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

export type Comment = {
  id: string;
  [key: string]: any; // To allow dynamic parent id fields
  author_name: string;
  content: string;
  created_at: string;
  likes?: number;
  parent_id?: string;
};

type MediaCommentsProps = {
  mediaId: string;
  tableName: string;
  parentIdField: string;
};

export default function MediaComments({ mediaId, tableName, parentIdField }: MediaCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: `${parentIdField}=eq.${mediaId}`
      }, payload => {
        setComments(current => [payload.new as Comment, ...current]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mediaId, tableName, parentIdField]);

  async function fetchComments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(parentIdField, mediaId)
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
          if (error.code === '42P01') {
             setComments([]);
             return;
          }
          throw error;
      }
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) {
      showToast('Please provide both your name and a comment.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        [parentIdField]: mediaId,
        author_name: authorName.trim(),
        content: newComment.trim(),
      };
      if (replyingTo) {
        payload.parent_id = replyingTo;
      }
      const { error } = await supabase
        .from(tableName)
        .insert([payload]);

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      showToast('Comment submitted for approval!', 'success');
      fetchComments(); // refresh comments
    } catch (error: any) {
      console.error('Error posting comment:', error);
      showToast(error.message || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(commentId: string, currentLikes: number) {
    try {
      const newLikes = (currentLikes || 0) + 1;
      const { error } = await supabase.from(tableName).update({ likes: newLikes }).eq('id', commentId);
      if (error) throw error;
      setComments(comments.map(c => c.id === commentId ? { ...c, likes: newLikes } : c));
    } catch(e) {
      console.error(e);
    }
  }

  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="mt-8 pt-8 border-t border-primary/10">
      <div className="flex items-center space-x-3 mb-6">
        <MessageCircle className="text-primary" size={20} />
        <h3 className="text-xl font-serif font-bold text-deep-brown">Comments ({comments.length})</h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 bg-soft-cream/30 p-4 rounded-2xl border border-primary/5">
        {replyingTo && (
           <div className="mb-4 p-3 bg-white border border-primary/10 rounded-xl flex justify-between items-center">
             <span className="text-sm text-taupe font-medium">Replying to comment...</span>
             <button type="button" onClick={() => setReplyingTo(null)} className="text-xs text-red-500 font-bold uppercase tracking-widest hover:text-red-600">Cancel</button>
           </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">
              Your Name
            </label>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border-none focus:ring-2 focus:ring-primary/20"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">
              Comment
            </label>
            <textarea
              required
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Share your thoughts..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center justify-center space-x-2 disabled:opacity-50 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>{replyingTo ? 'Post Reply' : 'Post Comment'}</span>
                <Send size={18} />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="text-center py-8 bg-soft-cream/10 rounded-2xl border border-primary/5">
            <p className="text-sm text-taupe font-medium">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          rootComments.map((comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-primary/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-deep-brown text-sm">{comment.author_name}</h4>
                  <p className="text-[10px] text-taupe font-medium uppercase tracking-widest mt-0.5">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-deep-brown/80 text-sm whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>

              <div className="mt-3 flex items-center gap-4 border-t border-primary/5 pt-3">
                <button
                  onClick={() => handleLike(comment.id, comment.likes || 0)}
                  className="flex items-center gap-1.5 text-xs font-bold text-taupe hover:text-red-500 transition-colors"
                >
                  <Heart size={14} /> <span>{comment.likes || 0}</span>
                </button>
                <button
                  onClick={() => { setReplyingTo(comment.id); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-taupe hover:text-primary transition-colors"
                >
                  <Reply size={14} /> <span>Reply</span>
                </button>
              </div>

              {/* Nested Replies */}
              {getReplies(comment.id).length > 0 && (
                <div className="mt-3 pl-4 md:pl-6 space-y-3 border-l-2 border-primary/10">
                  {getReplies(comment.id).map(reply => (
                    <div key={reply.id} className="bg-soft-cream/20 p-3 rounded-xl">
                       <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-bold text-deep-brown text-xs">{reply.author_name}</h4>
                          <p className="text-[9px] text-taupe font-medium uppercase tracking-widest mt-0.5">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-deep-brown/80 text-xs whitespace-pre-wrap leading-relaxed">
                        {reply.content}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <button
                          onClick={() => handleLike(reply.id, reply.likes || 0)}
                          className="flex items-center gap-1.5 text-xs font-bold text-taupe hover:text-red-500 transition-colors"
                        >
                          <Heart size={12} /> <span>{reply.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

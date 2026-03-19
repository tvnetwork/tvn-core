import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, Trash2, MessageCircle, CheckCircle, XCircle, Heart, Reply, Send, ThumbsUp, MessageSquare } from "lucide-react";
import { useToast } from "../../components/Toast";

type Comment = {
  [key: string]: any;
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
  approved: boolean;
  likes?: number;
  parent_id?: string;
  blog_posts: {
    title: string;
  };
};

import AdminLayout from "../../components/AdminLayout";

export default function AdminComments() {
  const [activeTab, setActiveTab] = useState<'blog' | 'podcasts' | 'videos'>('blog');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [authorReplyName, setAuthorReplyName] = useState('Admin');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingBulk, setProcessingBulk] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchComments();
  }, []);


  async function fetchComments() {
    try {
      setLoading(true);
      const tableName = activeTab === 'blog' ? 'comments' : activeTab === 'podcasts' ? 'podcast_comments' : 'video_comments';
      const fkName = activeTab === 'blog' ? 'post_id' : activeTab === 'podcasts' ? 'podcast_id' : 'video_id';
      const foreignTable = activeTab === 'blog' ? 'blog_posts(title)' : activeTab === 'podcasts' ? 'podcasts(title)' : 'videos(title)';

      const { data, error } = await supabase
        .from(tableName)
        .select(`*, ${foreignTable}`)
        .order('created_at', { ascending: false });

      if (error) {
         if (error.code === '42P01') {
           setComments([]);
           return;
         }
         throw error;
      }
      setComments(data || []);
      setSelectedIds(new Set());
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      showToast(error.message || "Failed to fetch comments", "error");
    } finally {
      setLoading(false);
    }
  }

  // Refetch when tab changes
  useEffect(() => {
    fetchComments();
  }, [activeTab]);



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
    if (selectedIds.size === comments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(comments.map(c => c.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.size === 0) return;

    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedIds.size} comments?`)) {
      return;
    }

    setProcessingBulk(true);
    try {
      const idsArray = Array.from(selectedIds);

      if (action === 'delete') {
        const { error } = await supabase.from('comments').delete().in('id', idsArray);
        if (error) throw error;
        setComments(current => current.filter(c => !selectedIds.has(c.id)));
        showToast(`${idsArray.length} comments deleted`, 'success');
      } else {
        const isApproved = action === 'approve';
        const { error } = await supabase.from('comments').update({ approved: isApproved }).in('id', idsArray);
        if (error) throw error;
        setComments(current => current.map(c => selectedIds.has(c.id) ? { ...c, approved: isApproved } : c));
        showToast(`${idsArray.length} comments ${action}d`, 'success');
      }
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Bulk action failed:', err);
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setProcessingBulk(false);
    }
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('comments').update({ approved: !currentStatus }).eq('id', id);
      if (error) throw error;
      setComments(current => current.map(c => c.id === id ? { ...c, approved: !currentStatus } : c));
      showToast(`Comment ${!currentStatus ? 'approved' : 'hidden'}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    setDeleting(id);
    try {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;

      setComments((current) => current.filter((c) => c.id !== id));
      showToast("Comment deleted successfully", "success");
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      showToast(error.message || "Failed to delete comment", "error");
    } finally {
      setDeleting(null);
    }
  }


  const handleAdminLike = async (id: string, currentLikes: number) => {
    try {
      const newLikes = (currentLikes || 0) + 1;
      const { error } = await supabase.from('comments').update({ likes: newLikes }).eq('id', id);
      if (error) throw error;
      setComments(current => current.map(c => c.id === id ? { ...c, likes: newLikes } : c));
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAdminReply = async (postId: string, parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Assume the admin is replying as the site author, or just "Admin"
      // Using authorReplyName state instead of hardcoded Admin

      const { error } = await supabase.from('comments').insert([{
        post_id: postId,
        parent_id: parentId,
        author_name: authorReplyName,
        content: replyContent.trim(),
        approved: true // Admin replies are auto-approved
      }]);

      if (error) throw error;

      showToast('Reply posted successfully', 'success');
      setReplyingTo(null);
      setReplyContent('');
      fetchComments();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingReply(false);
    }
  };
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
          <h1 className="text-3xl font-serif font-bold text-deep-brown">Comments</h1>
          <p className="text-taupe mt-2">Manage reader comments.</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-primary/10 pb-4">
        <button
          onClick={() => setActiveTab('blog')}
          className={`px-4 py-2 font-bold rounded-xl transition-colors ${activeTab === 'blog' ? 'bg-primary text-soft-cream' : 'text-taupe hover:bg-primary/5'}`}
        >
          Blog Comments
        </button>
        <button
          onClick={() => setActiveTab('podcasts')}
          className={`px-4 py-2 font-bold rounded-xl transition-colors ${activeTab === 'podcasts' ? 'bg-primary text-soft-cream' : 'text-taupe hover:bg-primary/5'}`}
        >
          Podcast Comments
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 font-bold rounded-xl transition-colors ${activeTab === 'videos' ? 'bg-primary text-soft-cream' : 'text-taupe hover:bg-primary/5'}`}
        >
          Video Comments
        </button>
      </div>


      {comments.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-primary/10 mb-4">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedIds.size === comments.length && comments.length > 0}
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
        {comments.length === 0 ? (
          <div className="text-center py-12 text-taupe">
            <MessageCircle className="mx-auto h-12 w-12 text-primary/20 mb-4" />
            <p>No comments found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (

              <div key={comment.id} className="flex flex-col md:flex-row justify-between items-start gap-6 p-6 bg-soft-cream/30 rounded-2xl border border-primary/5 hover:border-primary/20 transition-colors">
                <div className="flex items-start space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(comment.id)}
                    onChange={() => toggleSelection(comment.id)}
                    className="mt-1.5 w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary"
                  />
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-deep-brown">{comment.author_name}</span>
                      <span className="text-xs text-taupe bg-white px-2 py-1 rounded-md border border-primary/10">
                        on: {comment.blog_posts?.title || comment.podcasts?.title || comment.videos?.title || "Unknown Post/Media"}
                      </span>
                      <span className="text-xs text-taupe/60">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {!comment.approved && (
                        <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>

                  <div className="flex flex-col gap-4">
                    <p className="text-deep-brown/80 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-bold text-taupe mt-2">
                      <button
                        onClick={() => handleAdminLike(comment.id, comment.likes)}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <ThumbsUp size={16} className={comment.likes > 0 ? "fill-primary text-primary" : ""} />
                        <span>{comment.likes || 0}</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <MessageSquare size={16} />
                        <span>Reply</span>
                      </button>
                    </div>
                    {replyingTo === comment.id && (
                      <div className="mt-4 flex flex-col gap-2 w-full max-w-2xl bg-white p-3 rounded-xl border border-primary/20 shadow-sm">
                        <input
                          type="text"
                          value={authorReplyName}
                          onChange={(e) => setAuthorReplyName(e.target.value)}
                          placeholder="Author Name (e.g. Admin)"
                          className="w-full bg-transparent border-b border-primary/20 focus:border-primary focus:ring-0 mb-2 p-1 text-sm font-bold text-deep-brown"
                          disabled={submittingReply}
                        />
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply or comment as this user..."
                          className="flex-grow bg-transparent border-none focus:ring-0 resize-none h-10 p-2 text-sm text-deep-brown placeholder:text-taupe/50"
                          disabled={submittingReply}
                        />
                        <button
                          onClick={() => handleAdminReply(comment.post_id || comment.podcast_id || comment.video_id, comment.id)}
                          disabled={!replyContent.trim() || submittingReply}
                          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 self-end"
                        >
                          {submittingReply ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        </button>
                      </div>
                    )}
                  </div>

                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => toggleApproval(comment.id, comment.approved)}
                    className={`p-2 rounded-xl transition-colors ${comment.approved ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    title={comment.approved ? "Hide Comment" : "Approve Comment"}
                  >
                    {comment.approved ? <XCircle size={20} /> : <CheckCircle size={20} />}
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleting === comment.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Comment"
                  >
                    {deleting === comment.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
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

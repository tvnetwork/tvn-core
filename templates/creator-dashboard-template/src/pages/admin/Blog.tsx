import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Plus, Search, Edit, Trash2, Eye, Calendar, User, Loader2 } from "lucide-react";
import { useBlogPosts } from "../../hooks/useBlogPosts";
import { supabase, type BlogPost } from "../../lib/supabase";
import BlogForm from "../../components/admin/BlogForm";
import { useToast } from "../../components/Toast";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function AdminBlog() {
  const { posts, loading, refetch } = useBlogPosts({ includeDrafts: true });
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { refetch(); showToast('Post deleted successfully.', 'success'); }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif font-bold text-deep-brown">Manage Blog</h1>
              <p className="text-taupe font-medium">Write, edit, and publish blog posts to engage your readers.</p>
            </div>
            <button
              onClick={() => { setEditingPost(null); setShowForm(true); }}
              className="px-6 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all"
            >
              <Plus size={20} />
              <span>New Blog Post</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/5 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={20} />
              <input
                type="text"
                placeholder="Search posts by title or excerpt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Blog Posts Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden group">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={post.featured_image_url || `https://picsum.photos/seed/${post.id}/800/450`}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 ${post.published ? 'bg-emerald-500' : 'bg-taupe'} text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-deep-brown group-hover:text-primary transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-taupe text-xs font-bold uppercase tracking-widest">
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{new Date(post.published_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{post.author_name}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-deep-brown/60 text-sm line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="pt-4 border-t border-primary/5 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-taupe hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="p-2 text-taupe hover:text-accent transition-colors hover:bg-accent/5 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="px-4 py-2 bg-soft-cream text-primary rounded-lg font-bold text-sm flex items-center space-x-2 hover:bg-primary/5 transition-all"
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPosts.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-primary/20">
                  <p className="text-taupe italic">No blog posts found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <BlogForm
          post={editingPost}
          onClose={() => setShowForm(false)}
          onSuccess={refetch}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Blog Post"
        message="Are you sure you want to permanently delete this post? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AdminLayout>
  );
}

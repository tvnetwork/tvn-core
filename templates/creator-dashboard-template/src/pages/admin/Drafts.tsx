
import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../components/Toast";
import { Link } from "react-router-dom";
import { Loader2, Book, PenTool, ArrowRight } from "lucide-react";

export default function AdminDrafts() {
  const [blogDrafts, setBlogDrafts] = useState<any[]>([]);
  const [bookDrafts, setBookDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDrafts();
  }, []);

  async function fetchDrafts() {
    setLoading(true);
    try {
      const [blogRes, bookRes] = await Promise.all([
        supabase.from('blog_posts').select('*').eq('is_draft', true).order('created_at', { ascending: false }),
        supabase.from('books').select('*').eq('is_draft', true).order('created_at', { ascending: false })
      ]);

      if (blogRes.error) throw blogRes.error;
      if (bookRes.error) throw bookRes.error;

      setBlogDrafts(blogRes.data || []);
      setBookDrafts(bookRes.data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
     return <AdminLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <main className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-deep-brown">Drafts</h1>
            <p className="text-taupe font-medium">Continue working on your unpublished content.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl text-primary"><PenTool size={24} /></div>
                <h2 className="text-xl font-bold text-deep-brown">Blog Posts ({blogDrafts.length})</h2>
              </div>
              <div className="space-y-4">
                {blogDrafts.length === 0 ? <p className="text-taupe italic">No blog drafts.</p> : blogDrafts.map(post => (
                  <Link to="/admin/blog" key={post.id} className="block p-4 rounded-xl border border-primary/5 hover:border-primary/20 hover:bg-soft-cream/30 transition-all">
                    <h3 className="font-bold text-deep-brown">{post.title || "Untitled Post"}</h3>
                    <p className="text-xs text-taupe mt-1">Created: {new Date(post.created_at).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-accent/10 rounded-xl text-accent"><Book size={24} /></div>
                <h2 className="text-xl font-bold text-deep-brown">Books ({bookDrafts.length})</h2>
              </div>
              <div className="space-y-4">
                {bookDrafts.length === 0 ? <p className="text-taupe italic">No book drafts.</p> : bookDrafts.map(book => (
                  <Link to="/admin/books" key={book.id} className="block p-4 rounded-xl border border-primary/5 hover:border-primary/20 hover:bg-soft-cream/30 transition-all">
                    <h3 className="font-bold text-deep-brown">{book.title || "Untitled Book"}</h3>
                    <p className="text-xs text-taupe mt-1">Created: {new Date(book.created_at).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}

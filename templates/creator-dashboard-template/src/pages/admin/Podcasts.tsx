import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Plus, Search, Edit, Trash2, Loader2, Headphones } from "lucide-react";
import { supabase } from "../../lib/supabase";
import PodcastForm from "../../components/admin/PodcastForm";
import { useToast } from "../../components/Toast";
import ConfirmDialog from "../../components/ConfirmDialog";

type Podcast = {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  cover_image_url: string;
  duration: string;
  published_at: string;
};

export default function AdminPodcasts() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  async function fetchPodcasts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setPodcasts([]);
          return;
        }
        throw error;
      }
      setPodcasts(data as Podcast[]);
    } catch (err) {
      console.error("Error fetching podcasts:", err);
      showToast("Failed to fetch podcasts.", "error");
    } finally {
      setLoading(false);
    }
  }

  const filteredPodcasts = podcasts.filter(podcast =>
    podcast.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const { error } = await supabase.from('podcasts').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      fetchPodcasts();
      showToast('Podcast deleted successfully.', 'success');
    }
  };

  const handleEdit = (podcast: Podcast) => {
    setEditingPodcast(podcast);
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <main className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div>
              <h1 className="text-3xl font-serif font-bold text-deep-brown">Manage Podcasts</h1>
              <p className="text-taupe font-medium">Add, edit, or remove podcasts.</p>
            </div>
            <button
              onClick={() => { setEditingPodcast(null); setShowForm(true); }}
              className="px-6 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all"
            >
              <Plus size={20} />
              <span>Add New Podcast</span>
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/5 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={20} />
              <input
                type="text"
                placeholder="Search podcasts by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soft-cream/50 border-b border-primary/5">
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest">Podcast</th>
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest">Duration</th>
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest">Published</th>
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredPodcasts.map((podcast) => (
                    <tr key={podcast.id} className="hover:bg-soft-cream/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm bg-primary/5 flex items-center justify-center">
                            {podcast.cover_image_url ? (
                              <img
                                src={podcast.cover_image_url}
                                alt={podcast.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Headphones size={20} className="text-primary/40" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-deep-brown group-hover:text-primary transition-colors line-clamp-1">{podcast.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-deep-brown">{podcast.duration || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-deep-brown">{new Date(podcast.published_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(podcast)}
                            className="p-2 text-taupe hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(podcast.id)}
                            className="p-2 text-taupe hover:text-accent transition-colors hover:bg-accent/5 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPodcasts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-taupe italic">No podcasts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {showForm && (
        <PodcastForm
          podcast={editingPodcast}
          onClose={() => setShowForm(false)}
          onSuccess={fetchPodcasts}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Podcast"
        message="Are you sure you want to permanently delete this podcast? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AdminLayout>
  );
}

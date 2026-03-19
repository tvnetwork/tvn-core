import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import ImageUpload from './ImageUpload';
import MediaUpload from './MediaUpload';

type Podcast = {
  id?: string;
  title: string;
  description: string;
  audio_url: string;
  cover_image_url: string;
  duration: string;
  published_at: string;
};

interface PodcastFormProps {
  podcast?: Podcast | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PodcastForm({ podcast, onClose, onSuccess }: PodcastFormProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Podcast>>(
    podcast || {
      title: '',
      description: '',
      audio_url: '',
      cover_image_url: '',
      duration: '',
      published_at: new Date().toISOString(),
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      if (podcast?.id) {
        const { error } = await supabase
          .from('podcasts')
          .update(formData)
          .eq('id', podcast.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('podcasts')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to save podcast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-primary/10 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-serif font-bold text-deep-brown">
            {podcast ? 'Edit Podcast' : 'Add New Podcast'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-soft-cream rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6">
          {formError && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <p className="text-sm font-semibold leading-snug">{formError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Title</label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Description</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="space-y-2">
              <MediaUpload
                label="Audio File / URL"
                value={formData.audio_url || ''}
                onChange={(url) => setFormData({ ...formData, audio_url: url })}
                restrictFormats={true}
                allowedTypes={['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']}
                allowedFormatsLabel="MP3, WAV, OGG, WEBM"
                allowAudioRecording={true}
                aspectRatio="16/9"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUpload
                label="Cover Image"
                value={formData.cover_image_url || ''}
                onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                maxSizeMB={2}
                hint="Recommended size: Square (e.g., 800x800 px)"
                aspectRatio="1/1"
              />
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-taupe uppercase tracking-widest">Duration (Optional)</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., 45:30 or 45 mins"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-taupe uppercase tracking-widest">Published At</label>
                  <input
                    type="datetime-local"
                    value={formData.published_at ? formData.published_at.slice(0, 16) : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, published_at: val ? new Date(val).toISOString() : new Date().toISOString() });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-primary/10 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-taupe font-bold hover:bg-soft-cream rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{podcast ? 'Update Podcast' : 'Save Podcast'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

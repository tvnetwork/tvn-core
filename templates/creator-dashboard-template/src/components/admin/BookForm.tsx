import { useState, useEffect, useRef } from 'react';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { supabase, type Book } from '../../lib/supabase';
import ImageUpload from './ImageUpload';
import RichTextEditor from './RichTextEditor';

type BookFormProps = {
  book?: Book | null;
  onClose: () => void;
  onSuccess: () => void;
};

function generateSlug(text: string): string {
  return text
    .normalize('NFD')
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BookForm({ book, onClose, onSuccess }: BookFormProps) {

  const { settings } = useSiteSettings();

  useEffect(() => {
    // Pre-fill author for new books once settings are loaded
    if (!book && settings?.author_name) {
      setFormData(prev => ({ ...prev, author_name: settings.author_name }));
    }
  }, [book, settings]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!book?.id);
  const [formData, setFormData] = useState<Partial<Book>>(
    book || {
      title: '',
      author_name: '',
      slug: '',
      description: '',
      long_description: '',
      cover_image_url: '',
      release_date: new Date().toISOString().split('T')[0],
      genre: 'Fantasy',
      gumroad_link: '',
      selar_link: '',
      featured: false,
      order: 0,
      is_draft: false,
    }
  );


  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Handle auto-save effect
  useEffect(() => {
    // Only auto-save if we have at least a title and a slug
    if (!formData.title || !formData.slug) return;

    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const dataToSave = { ...formDataRef.current };
        if (book?.id) {
          const { error } = await supabase
            .from('books')
            .update(dataToSave)
            .eq('id', book.id);
          if (error) throw error;
          setLastSaved(new Date());
        } else if (dataToSave.id) {
          const { error } = await supabase
            .from('books')
            .update(dataToSave)
            .eq('id', dataToSave.id);
          if (error) throw error;
          setLastSaved(new Date());
        } else {
          // It's a new book without an ID yet, create it and store the ID in formData
          const { data, error } = await supabase
            .from('books')
            .insert([dataToSave])
            .select()
            .single();
          if (error) throw error;
          if (data) {
            setFormData(prev => ({ ...prev, id: data.id }));
            setLastSaved(new Date());
          }
        }
      } catch (err) {
        if (err.message && err.message.includes('books_slug_key')) {
        setFormError('The generated slug is already in use. Please modify the slug to be unique.');
      } else {
        console.error('Auto-save failed:', err);
      }
      } finally {
        setIsAutoSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, book?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      if (book?.id) {
        const { error } = await supabase
          .from('books')
          .update(formData)
          .eq('id', book.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('books')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('books_slug_key')) {
      setFormError('The generated slug is already in use. Please modify the slug to be unique.');
    } else {
      setFormError(err.message);
    }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-primary/10 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-serif font-bold text-deep-brown">
            {book ? 'Edit Book' : 'Add New Book'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  if (!slugManuallyEdited) {
                    setFormData({ ...formData, title: newTitle, slug: generateSlug(newTitle) });
                  } else {
                    setFormData({ ...formData, title: newTitle });
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Slug</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setFormData({ ...formData, slug: e.target.value });
                }}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Author Name</label>
              <input
                type="text"
                value={formData.author_name}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Genre</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Release Date</label>
              <input
                type="date"
                value={formData.release_date?.split('T')[0]}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-taupe uppercase tracking-widest">Short Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-taupe uppercase tracking-widest">Standard Description</label>
            <RichTextEditor
              value={formData.long_description || ''}
              onChange={(v) => setFormData({ ...formData, long_description: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              label="Cover Image"
              value={formData.cover_image_url || ''}
              onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
              maxSizeMB={2}
              restrictFormats
              hint="Recommended size: 1600 × 2400 px (Book cover ratio 2:3)"
              aspectRatio="2/3"
            />
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Gumroad Link</label>
              <input
                type="url"
                value={formData.gumroad_link}
                onChange={(e) => setFormData({ ...formData, gumroad_link: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Selar Link</label>
              <input
                type="url"
                value={formData.selar_link || ''}
                onChange={(e) => setFormData({ ...formData, selar_link: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>


          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_draft || false}
                onChange={(e) => setFormData({ ...formData, is_draft: e.target.checked })}
                className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-deep-brown">Save as Draft</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_coming_soon || false}
                onChange={(e) => setFormData({ ...formData, is_coming_soon: e.target.checked })}
                className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-deep-brown">Coming Soon</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-deep-brown">Featured on Homepage</span>
            </label>
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-20 px-4 py-2 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-primary/10 flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-0 sm:space-x-4">

            {lastSaved && (
              <div className="text-xs text-taupe flex items-center mr-auto">
                {isAutoSaving ? 'Saving...' : `Last saved at ${lastSaved.toLocaleTimeString()}`}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 text-taupe font-bold hover:bg-soft-cream rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-soft-cream rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{book ? 'Update Book' : 'Save Book'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { X, Save, Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import ImageUpload from './ImageUpload';
import RichTextEditor from './RichTextEditor';

type BlogPost = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  genre: string;
  featured_image_url: string;
  author_name: string;
  published: boolean;
  published_at: string;
  is_draft: boolean;
  additional_images?: string[];
};
type BlogFormProps = {
  post: BlogPost | null | any;
  onClose: () => void;
  onSuccess: () => void;
};

// --------------------------------------------------------------------------
// Reusable content field with "Insert Image" toolbar
// --------------------------------------------------------------------------
type ContentFieldProps = {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
};

function ContentField({ label, value, onChange, required, rows = 8, placeholder, mono }: ContentFieldProps) {
  const [showInsert, setShowInsert] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertImage = (url: string) => {
    if (!url) return;
    const ta = textareaRef.current;
    const markdown = `\n![image](${url})\n`;
    if (ta) {
      const start = ta.selectionStart ?? (value || '').length;
      const end   = ta.selectionEnd   ?? start;
      const before = (value || '').substring(0, start);
      const after  = (value || '').substring(end);
      onChange(before + markdown + after);
      // Restore cursor after the inserted snippet
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + markdown.length;
      }, 0);
    } else {
      onChange((value || '') + markdown);
    }
    setShowInsert(false);
    setPendingUrl('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-taupe uppercase tracking-widest">{label}</label>
        <button
          type="button"
          onClick={() => { setShowInsert(v => !v); setPendingUrl(''); }}
          className="flex items-center space-x-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <ImagePlus size={14} />
          <span>Insert Image</span>
        </button>
      </div>

      {showInsert && (
        <div className="p-4 bg-soft-cream/50 rounded-xl border border-primary/10 space-y-3">
          <ImageUpload
            label="Image to insert"
            value={pendingUrl}
            onChange={setPendingUrl}
          />
          <div className="flex justify-end space-x-2">


            <button
              type="button"
              onClick={() => setShowInsert(false)}
              className="px-3 py-1.5 text-taupe text-sm font-bold hover:text-deep-brown transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => insertImage(pendingUrl)}
              disabled={!pendingUrl}
              className="px-4 py-1.5 bg-primary text-soft-cream rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Insert
            </button>
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        required={required}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20 resize-none${mono ? ' font-mono text-sm' : ''}`}
      />
    </div>
  );
}


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

// --------------------------------------------------------------------------
// Main form
// --------------------------------------------------------------------------
export default function BlogForm({ post, onClose, onSuccess }: BlogFormProps) {

  const { settings } = useSiteSettings();

  useEffect(() => {
    // Pre-fill author for new posts once settings are loaded
    if (!post && settings?.author_name) {
      setFormData(prev => ({ ...prev, author_name: settings.author_name }));
    }
  }, [post, settings]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [genreInput, setGenreInput] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post?.id);
  const [formData, setFormData] = useState<Partial<BlogPost>>(
    post || {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      genre: 'Writing Life',
      featured_image_url: '',
      author_name: '',
      published: true,
      published_at: new Date().toISOString(),
      is_draft: false,
      additional_images: [],
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
        if (formData.id) {
          const { error } = await supabase
            .from('blog_posts')
            .update(dataToSave)
            .eq('id', formData.id);
          if (error) throw error;
          setLastSaved(new Date());
        } else if (dataToSave.id) {
          const { error } = await supabase
            .from('blog_posts')
            .update(dataToSave)
            .eq('id', dataToSave.id);
          if (error) throw error;
          setLastSaved(new Date());
        } else {
          // It's a new post without an ID yet, create it and store the ID in formData
          const { data, error } = await supabase
            .from('blog_posts')
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
        if (err.message && err.message.includes('blog_posts_slug_key')) {
        setFormError('The generated slug is already in use. Please modify the slug to be unique.');
      } else {
        console.error('Auto-save failed:', err);
      }
      } finally {
        setIsAutoSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, post?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      if (formData.id) {
        const { error } = await supabase
          .from('blog_posts')
          .update(formData)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        let insertData = { ...formData };
        if (insertData.published) {
          // If trying to publish but missing key fields, force draft
          if (!insertData.title || !insertData.slug || !insertData.content) {
            insertData.published = false;
            insertData.is_draft = true;
            setFormError("Missing required fields for publishing. Saved as draft instead.");
          }
        }
        const { error } = await supabase
          .from('blog_posts')
          .insert([insertData]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('blog_posts_slug_key')) {
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
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-primary/10 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-serif font-bold text-deep-brown">
            {post ? 'Edit Post' : 'New Blog Post'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-soft-cream rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                  setFormData({
                    ...formData,
                    title: newTitle,
                    ...(!slugManuallyEdited && { slug: generateSlug(newTitle) }),
                  });
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
          </div>


          <div className="space-y-2">
            <label className="text-xs font-bold text-taupe uppercase tracking-widest">Categories</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.genre || '').split(',').map((g) => g.trim()).filter(Boolean).map((genre, index) => (
                <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-1">
                  {genre}
                  <button
                    type="button"
                    onClick={() => {
                      const currentGenres = (formData.genre || '').split(',').map(g => g.trim()).filter(Boolean);
                      currentGenres.splice(index, 1);
                      setFormData({ ...formData, genre: currentGenres.join(', ') });
                    }}
                    className="hover:text-accent transition-colors focus:outline-none"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (genreInput.trim()) {
                    const currentGenres = (formData.genre || '').split(',').map(g => g.trim()).filter(Boolean);
                    if (!currentGenres.includes(genreInput.trim())) {
                      currentGenres.push(genreInput.trim());
                      setFormData({ ...formData, genre: currentGenres.join(', ') });
                    }
                    setGenreInput('');
                  }
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              placeholder="Type a category and press Enter"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-taupe uppercase tracking-widest">Excerpt</label>
            <textarea
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-taupe uppercase tracking-widest">Standard Content</label>
            <RichTextEditor
              value={formData.content || ''}
              onChange={(v) => setFormData({ ...formData, content: v })}
            />
          </div>

          <div>
            <ImageUpload
              label="Featured Image"
              value={formData.featured_image_url || ''}
              onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-primary/10">
            <h3 className="text-sm font-bold text-taupe uppercase tracking-widest">Additional Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.additional_images?.map((url: string, index: number) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-primary/10 group">
                  <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...(formData.additional_images || [])];
                      newImages.splice(index, 1);
                      setFormData({ ...formData, additional_images: newImages });
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="aspect-video">
                <ImageUpload
                  label=""
                  value=""
                  onChange={(url) => setFormData({ ...formData, additional_images: [...(formData.additional_images || []), url] })}
                />
              </div>
            </div>
          </div>


          <div className="space-y-4 pt-4 border-t border-primary/10">
            <h3 className="text-sm font-bold text-taupe uppercase tracking-widest">Additional Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.additional_images?.map((url: string, index: number) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-primary/10 group">
                  <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...(formData.additional_images || [])];
                      newImages.splice(index, 1);
                      setFormData({ ...formData, additional_images: newImages });
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="aspect-video">
                <ImageUpload
                  label=""
                  value=""
                  onChange={(url) => setFormData({ ...formData, additional_images: [...(formData.additional_images || []), url] })}
                />
              </div>
            </div>
          </div>


          <div className="space-y-4 pt-4 border-t border-primary/10">
            <h3 className="text-sm font-bold text-taupe uppercase tracking-widest">Additional Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.additional_images?.map((url: string, index: number) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-primary/10 group">
                  <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...(formData.additional_images || [])];
                      newImages.splice(index, 1);
                      setFormData({ ...formData, additional_images: newImages });
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="aspect-video">
                <ImageUpload
                  label=""
                  value=""
                  onChange={(url) => setFormData({ ...formData, additional_images: [...(formData.additional_images || []), url] })}
                />
              </div>
            </div>
          </div>



          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_draft || false}
                onChange={(e) => setFormData({ ...formData, is_draft: e.target.checked, published: !e.target.checked })}
                className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-deep-brown">Save as Draft</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked, is_draft: !e.target.checked })}
                className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-deep-brown">Published</span>
            </label>
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
              <span>{post ? 'Update Post' : 'Publish Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

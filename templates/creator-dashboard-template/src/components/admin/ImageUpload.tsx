import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImageWithProgress, supabase } from '../../lib/supabase';
import { useEffect } from 'react';
import { useToast } from '../Toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_FORMATS_LABEL = 'JPG, PNG, WEBP';

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  bucket?: string;
  maxSizeMB?: number;
  restrictFormats?: boolean;
  hint?: string;
  aspectRatio?: string;
};

export default function ImageUpload({ value, onChange, label, bucket = 'images', maxSizeMB, restrictFormats, hint, aspectRatio }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024) {
      showToast(`${label} must be under ${maxSizeMB}MB.`, 'error');
      e.target.value = '';
      return;
    }

    if (restrictFormats && !ALLOWED_TYPES.includes(file.type)) {
      showToast(`Only ${ALLOWED_FORMATS_LABEL} images are allowed.`, 'error');
      e.target.value = '';
      return;
    }


    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadImageWithProgress(file, (progress) => {
        setUploadProgress(Math.round(progress));
      }, bucket);
      onChange(url);
    } catch (error: any) {

      showToast('Error uploading image: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const containerStyle = aspectRatio ? { aspectRatio } : undefined;
  const containerClass = aspectRatio ? '' : 'aspect-video';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-taupe uppercase tracking-widest">{label}</label>

        <button
          type="button"
          onClick={() => setIsLibraryOpen(true)}
          className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
        >
          Select from Library
        </button>

      </div>

      <div className="relative group">
        {value ? (
          <div
            className={`relative rounded-2xl overflow-hidden ${containerClass} bg-soft-cream/30 border-2 border-dashed border-primary/10`}
            style={containerStyle}
          >
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white text-primary rounded-full hover:scale-110 transition-transform"
                title="Change Image"
              >
                <Upload size={20} />
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="p-2 bg-white text-accent rounded-full hover:scale-110 transition-transform"
                title="Remove Image"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`w-full ${containerClass} rounded-2xl border-2 border-dashed border-primary/20 bg-soft-cream/30 hover:bg-soft-cream/50 transition-colors flex flex-col items-center justify-center space-y-2 text-taupe group`}
            style={containerStyle}
          >

            {uploading ? (
              <div className="flex flex-col items-center space-y-3 w-full px-6">
                <Loader2 className="animate-spin text-primary" size={32} />
                <div className="w-full bg-soft-cream/50 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-primary">{uploadProgress}% Uploaded</span>
              </div>
            ) : (

              <>
                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={24} className="text-primary" />
                </div>
                <span className="text-sm font-medium">Click to upload image</span>
              </>
            )}
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={restrictFormats ? ALLOWED_TYPES.join(',') : 'image/*'}
          className="hidden"
        />
      </div>

      {hint && (
        <p className="text-[11px] text-taupe/60 font-medium">{hint}</p>
      )}

      <div className="flex items-center space-x-2">
        <div className="flex-grow h-px bg-primary/5"></div>
        <span className="text-[10px] font-bold text-taupe/40 uppercase tracking-widest">or use URL</span>
        <div className="flex-grow h-px bg-primary/5"></div>
      </div>

      <div className="relative">
        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={16} />
        <input
          type="url"
          value={value}
          placeholder="https://example.com/image.jpg"
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={(url) => { onChange(url); setIsLibraryOpen(false); }}
      />
    </div>
  );
}


function MediaLibraryModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (url: string) => void }) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  async function fetchMedia() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('media_library').select('*').order('created_at', { ascending: false });
      if (error) {
        if (error.code !== '42P01') console.error('Error fetching media:', error);
        setMedia([]);
      } else {
        setMedia(data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-deep-brown">Select from Media Library</h2>
          <button onClick={onClose} className="p-2 hover:bg-soft-cream/50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-taupe">
              <ImageIcon className="mx-auto h-12 w-12 text-primary/20 mb-4" />
              <p>No images found in your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.url)}
                  className="cursor-pointer group relative rounded-xl overflow-hidden border border-primary/10 hover:border-primary/40 transition-all aspect-square bg-soft-cream/30 flex items-center justify-center p-2"
                >
                  <img src={item.url} alt={item.filename} className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

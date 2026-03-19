import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Mic, Square } from 'lucide-react';
import { uploadImageWithProgress, supabase } from '../../lib/supabase';
import { useEffect } from 'react';
import { useToast } from '../Toast';

// Dynamic types will be used from props if provided.

type MediaUploadProps = {
  allowedTypes?: string[];
  allowedFormatsLabel?: string;
  allowAudioRecording?: boolean;
  value: string;
  onChange: (url: string) => void;
  label: string;
  bucket?: string;
  maxSizeMB?: number;
  restrictFormats?: boolean;
  hint?: string;
  aspectRatio?: string;
};

export default function MediaUpload({ value, onChange, label, bucket = 'images', maxSizeMB, restrictFormats, hint, aspectRatio, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], allowedFormatsLabel = 'JPG, PNG, WEBP, GIF', allowAudioRecording = false }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const processFileUpload = async (file: File) => {
    if (maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024) {
      showToast(`${label} must be under ${maxSizeMB}MB.`, 'error');
      return false;
    }

    if (restrictFormats && !allowedTypes.includes(file.type) && !file.type.startsWith('audio/webm')) {
      showToast(`Only ${allowedFormatsLabel} are allowed.`, 'error');
      return false;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadImageWithProgress(file, (progress) => {
        setUploadProgress(Math.round(progress));
      }, bucket);
      onChange(url);
      return true;
    } catch (error: any) {
      showToast('Error uploading media: ' + error.message, 'error');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        await processFileUpload(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);} catch (err) {
      console.error("Error accessing microphone:", err);
      showToast("Could not access microphone for recording.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await processFileUpload(file);
    if (!success) {
      e.target.value = '';
    }
  };

  const removeImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    let embedUrl = null;

    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    if (ytMatch && ytMatch[1]) {
      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return embedUrl;
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
            {value.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={value} className="w-full h-full object-cover" controls />
            ) : value.match(/\.(mp3|wav|ogg)$/i) ? (
              <div className="flex items-center justify-center w-full h-full text-primary/50 bg-soft-cream/10">
                 <audio src={value} controls className="w-full px-4" />
              </div>
            ) : (
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white text-primary rounded-full hover:scale-110 transition-transform"
                title="Change Media"
              >
                <Upload size={20} />
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="p-2 bg-white text-accent rounded-full hover:scale-110 transition-transform"
                title="Remove Media"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isRecording}
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
                <span className="text-sm font-medium">Click to upload {label.toLowerCase()}</span>
              </>
            )}
          </button>
        )}

        {allowAudioRecording && !value && (
          <div className="mt-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={uploading}
                className="w-full py-3 rounded-xl border border-primary/20 bg-soft-cream/10 hover:bg-soft-cream/30 transition-colors flex items-center justify-center space-x-2 text-primary font-bold disabled:opacity-50"
              >
                <Mic size={18} />
                <span>Record Audio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="w-full py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center space-x-2 text-red-600 font-bold"
              >
                <Square size={18} className="fill-current" />
                <span className="animate-pulse">Recording ({formatTime(recordingTime)}) - Click to Stop</span>
              </button>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={restrictFormats ? allowedTypes.join(',') : 'image/*,video/*,audio/*'}
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
          placeholder="https://example.com/media.ext"
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
              <p>No media found in your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.url)}
                  className="cursor-pointer group relative rounded-xl overflow-hidden border border-primary/10 hover:border-primary/40 transition-all aspect-square bg-soft-cream/30 flex items-center justify-center p-2"
                >
                  {item.mime_type?.startsWith('video/') ? (
                    <video src={item.url} className="max-w-full max-h-full object-contain" />
                  ) : item.mime_type?.startsWith('audio/') ? (
                    <div className="flex items-center justify-center w-full h-full text-primary/50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    </div>
                  ) : (
                    <img src={item.url} alt={item.filename} className="max-w-full max-h-full object-contain" />
                  )}
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

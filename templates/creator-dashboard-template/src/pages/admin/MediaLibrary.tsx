import { useState, useEffect } from "react";
import { supabase, uploadImage } from "../../lib/supabase";
import { Loader2, Trash2, Image as ImageIcon, Copy, CheckCircle, Upload } from "lucide-react";
import { useToast } from "../../components/Toast";
import AdminLayout from "../../components/AdminLayout";

type MediaItem = {
  id: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  created_at: string;
};

export default function AdminMediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === '42P01') {
           // relation does not exist
           setMedia([]);
           return;
        }
        throw error;
      }
      setMedia(data as MediaItem[]);
    } catch (error: any) {
      console.error("Error fetching media:", error);
      showToast(error.message || "Failed to fetch media", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    const newMediaItems: MediaItem[] = [];

    try {
      for (const file of files) {
        try {
          // Use existing uploadImage function
          const publicUrl = await uploadImage(file);

          const { data, error } = await supabase.from('media_library').insert([{
            filename: file.name,
            url: publicUrl,
            size: file.size,
            mime_type: file.type
          }]).select().single();

          if (error) throw error;

          newMediaItems.push(data as MediaItem);
          successCount++;
        } catch (fileError: any) {
          console.error(`Failed to upload ${file.name}:`, fileError);
          showToast(fileError.message || `Failed to upload ${file.name}`, "error");
        }
      }

      if (successCount > 0) {
        setMedia((current) => [...newMediaItems, ...current]);
        showToast(`Successfully uploaded ${successCount} ${successCount === 1 ? 'file' : 'files'}`, "success");
      }
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };


  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this media?")) return;

    setProcessingId(id);
    try {
      const { error } = await supabase.from("media_library").delete().eq("id", id);
      if (error) throw error;

      setMedia((current) => current.filter((m) => m.id !== id));
      showToast("Media deleted successfully", "success");
    } catch (error: any) {
      console.error("Error deleting image:", error);
      showToast(error.message || "Failed to delete media", "error");
    } finally {
      setProcessingId(null);
    }
  }

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast("URL copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
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
            <h1 className="text-3xl font-serif font-bold text-deep-brown">Media Library</h1>
            <p className="text-taupe mt-2">Manage images for your blog posts and books.</p>
          </div>
          <div>
            <label className="cursor-pointer px-6 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span>Upload Media</span>
              <input type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-primary/10">
          {media.length === 0 ? (
            <div className="text-center py-12 text-taupe">
              <ImageIcon className="mx-auto h-12 w-12 text-primary/20 mb-4" />
              <p>No media found in your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {media.map((item) => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-md transition-all">

                  <div className="aspect-square bg-soft-cream/30 flex items-center justify-center p-2">
                    {item.mime_type?.startsWith('video/') ? (
                      <video src={item.url} className="max-w-full max-h-full object-contain" />
                    ) : item.mime_type?.startsWith('audio/') ? (
                      <div className="flex items-center justify-center w-full h-full text-primary/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                      </div>
                    ) : (
                      <img src={item.url} alt={item.filename} className="max-w-full max-h-full object-contain" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                    <div className="text-white text-xs truncate font-medium">
                      {item.filename}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleCopyUrl(item.id, item.url)}
                        className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl transition-colors"
                        title="Copy URL"
                      >
                        {copiedId === item.id ? <CheckCircle size={18} /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={processingId === item.id}
                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-colors"
                        title="Delete Media"
                      >
                        {processingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
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

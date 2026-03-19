import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Video as VideoIcon, Loader2, PlayCircle, Clock, Calendar, Heart } from "lucide-react";
import { supabase } from "../lib/supabase";
import MediaComments from "../components/MediaComments";

type VideoItem = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  published_at: string;
  likes?: number;
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

export default function Videos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, just ignore gracefully
          setVideos([]);
          return;
        }
        throw error;
      }
      setVideos(data as VideoItem[]);
    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(id: string, currentLikes: number) {
    try {
      const newLikes = (currentLikes || 0) + 1;
      const { error } = await supabase.from('videos').update({ likes: newLikes }).eq('id', id);
      if (error) throw error;
      setVideos(videos.map(v => v.id === id ? { ...v, likes: newLikes } : v));
    } catch (err) {
      console.error("Error liking video:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex justify-center items-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <VideoIcon className="text-primary" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-deep-brown mb-4">Videos</h1>
          <p className="text-xl text-taupe max-w-2xl mx-auto">
            Watch and learn. Explore discussions, tutorials, and more.
          </p>
        </div>

        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-primary/5 border border-primary/10"
              >
                <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                   {getEmbedUrl(video.video_url) ? (
                     <iframe
                       src={getEmbedUrl(video.video_url)!}
                       className="w-full h-full"
                       allowFullScreen
                       title={video.title}
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     ></iframe>
                   ) : (
                     <video controls className="w-full h-full object-contain" poster={video.thumbnail_url}>
                       <source src={video.video_url} />
                       Your browser does not support the video tag.
                     </video>
                   )}
                </div>

                <div className="p-8">
                  <div className="flex items-center space-x-4 text-taupe text-xs font-bold uppercase tracking-widest mb-3">
                    <div className="flex items-center space-x-1"><Calendar size={14} /> <span>{new Date(video.published_at).toLocaleDateString()}</span></div>
                    {video.duration && <div className="flex items-center space-x-1"><Clock size={14} /> <span>{video.duration}</span></div>}
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-deep-brown mb-3">
                    {video.title}
                  </h3>

                  <p className="text-deep-brown/70 mb-6 text-sm">
                    {video.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-primary/10 pt-4">
                    <button
                      onClick={() => handleLike(video.id, video.likes || 0)}
                      className="flex items-center space-x-2 text-taupe hover:text-red-500 transition-colors"
                    >
                      <Heart size={20} className={video.likes ? "fill-red-500 text-red-500" : ""} />
                      <span className="font-bold">{video.likes || 0}</span>
                    </button>
                  </div>

                  <MediaComments mediaId={video.id} tableName="video_comments" parentIdField="video_id" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

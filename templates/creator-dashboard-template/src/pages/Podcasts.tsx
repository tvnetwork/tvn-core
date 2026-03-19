import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Headphones, Loader2, PlayCircle, Clock, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Heart } from "lucide-react";
import MediaComments from "../components/MediaComments";

type Podcast = {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  cover_image_url: string;
  duration: string;
  published_at: string;
  likes?: number;
};

export default function Podcasts() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

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
          // Table doesn't exist yet, just ignore gracefully
          setPodcasts([]);
          return;
        }
        throw error;
      }
      setPodcasts(data as Podcast[]);
    } catch (err) {
      console.error("Error fetching podcasts:", err);
    } finally {
      setLoading(false);
    }
  }


  async function handleLike(id: string, currentLikes: number) {
    try {
      const newLikes = (currentLikes || 0) + 1;
      const { error } = await supabase.from('podcasts').update({ likes: newLikes }).eq('id', id);
      if (error) throw error;
      setPodcasts(podcasts.map(p => p.id === id ? { ...p, likes: newLikes } : p));
    } catch (err) {
      console.error("Error liking podcast:", err);
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
            <Headphones className="text-primary" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-deep-brown mb-4">The Podcast</h1>
          <p className="text-xl text-taupe max-w-2xl mx-auto">
            Listen to conversations about writing, life, and the stories that shape us.
          </p>
        </div>

        {podcasts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {podcasts.map((podcast, index) => (
              <motion.div
                key={podcast.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-primary/5 border border-primary/10 group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-soft-cream">
                  {podcast.cover_image_url ? (
                    <img
                      src={podcast.cover_image_url}
                      alt={podcast.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex justify-center items-center bg-primary/5">
                       <Headphones size={48} className="text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100 shadow-xl shadow-black/20">
                      <PlayCircle className="text-primary" size={32} />
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center space-x-4 text-taupe text-xs font-bold uppercase tracking-widest mb-3">
                    <div className="flex items-center space-x-1"><Calendar size={14} /> <span>{new Date(podcast.published_at).toLocaleDateString()}</span></div>
                    {podcast.duration && <div className="flex items-center space-x-1"><Clock size={14} /> <span>{podcast.duration}</span></div>}
                  </div>

                  <h3 className="text-xl font-serif font-bold text-deep-brown mb-3 group-hover:text-primary transition-colors">
                    {podcast.title}
                  </h3>

                  <p className="text-deep-brown/70 line-clamp-2 mb-6 text-sm">
                    {podcast.description}
                  </p>


                  <audio controls className="w-full h-10 rounded-full" src={podcast.audio_url} preload="metadata">
                    Your browser does not support the audio element.
                  </audio>

                  <div className="mt-6 flex items-center justify-between border-t border-primary/10 pt-4">
                    <button
                      onClick={() => handleLike(podcast.id, podcast.likes || 0)}
                      className="flex items-center space-x-2 text-taupe hover:text-red-500 transition-colors"
                    >
                      <Heart size={20} className={podcast.likes ? "fill-red-500 text-red-500" : ""} />
                      <span className="font-bold">{podcast.likes || 0}</span>
                    </button>
                  </div>

                  <MediaComments mediaId={podcast.id} tableName="podcast_comments" parentIdField="podcast_id" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

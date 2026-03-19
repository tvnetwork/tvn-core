import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight, Loader2 } from "lucide-react";
import { useBlogPosts } from "../hooks/useBlogPosts";
import { useSiteSettings } from "../hooks/useSiteSettings";


const getFontClass = (font: string | undefined) => {
  switch (font) {
    case 'serif': return 'font-serif';
    case 'mono': return 'font-mono';
    case 'lora': return '[font-family:"Lora",serif]';
    case 'times': return '[font-family:"Times_New_Roman",Times,serif]';
    case 'sans':
    default: return 'font-sans';
  }
};

export default function Blog() {
  const { posts, loading } = useBlogPosts();
  const { settings } = useSiteSettings();
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

  const loadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const genres = useMemo(() => {
    const g = ["All"];
    posts.forEach(p => {
      if (p.genre) {
        const pGenres = p.genre.split(',').map(g => g.trim()).filter(Boolean);
        pGenres.forEach(pg => {
          if (!g.includes(pg)) g.push(pg);
        });
      }
    });
    return g;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (selectedGenre === "All") return true;
      if (!post.genre) return false;
      const pGenres = post.genre.split(',').map(g => g.trim()).filter(Boolean);
      return pGenres.includes(selectedGenre);
    });
  }, [posts, selectedGenre]);

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1, visibleCount);
  const hasMore = filteredPosts.length > visibleCount;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-brown mb-4">The Inkwell</h1>
        <p className="text-xl text-taupe max-w-2xl mx-auto">
          Reflections on the writing life, literary inspirations, and the stories behind the stories.
        </p>
      </div>


      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-center">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 w-full md:w-auto">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                selectedGenre === genre
                ? "bg-primary text-soft-cream shadow-md"
                : "bg-white text-taupe hover:bg-primary/5 border border-primary/5"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {loading ? (

        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-2 group cursor-pointer"
            >
              <Link to={`/blog/${featuredPost.slug}`} className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-3xl overflow-hidden shadow-sm border border-primary/5 p-4">
                <div className="aspect-video lg:aspect-square rounded-2xl overflow-hidden">
                  <img
                    src={featuredPost.featured_image_url || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1973"}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-center p-4">
                  <span className="text-accent font-bold text-sm uppercase tracking-widest mb-4">Featured Post</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-deep-brown mb-4 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-deep-brown/70 text-lg mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center space-x-6 text-taupe text-sm font-medium mb-8">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>{new Date(featuredPost.published_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User size={16} />
                      <span>{featuredPost.author_name || settings?.author_name || "Author"}</span>
                    </div>
                  </div>
                  <div className="text-primary font-bold flex items-center space-x-2">
                    <span>Read Full Article</span>
                    <ArrowRight size={20} />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Regular Posts */}
          {regularPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="aspect-video rounded-2xl overflow-hidden shadow-md mb-6">
                  <img
                    src={post.featured_image_url || `https://picsum.photos/seed/${post.id}/800/450`}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center space-x-4 text-taupe text-xs font-bold uppercase tracking-widest mb-3">
                  {post.genre ? (
                    post.genre.split(',').map(g => g.trim()).filter(Boolean).map((genre, index) => (
                      <span key={index}>{genre}</span>
                    ))
                  ) : (
                    <span>Uncategorized</span>
                  )}
                  <span className="w-1 h-1 bg-taupe rounded-full" />
                  <span>{Math.ceil(post.content?.split(" ").length / 200) || 5} min read</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-deep-brown mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-deep-brown/60 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="text-primary font-bold flex items-center space-x-1">
                  <span>Read More</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            </motion.div>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p className="text-taupe italic">No blog posts found. Check back soon!</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

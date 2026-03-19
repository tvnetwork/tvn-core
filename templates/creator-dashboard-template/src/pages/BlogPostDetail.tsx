import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { marked } from 'marked';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import { ArrowLeft, Calendar, User, Share2, MessageCircle, Clock, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { usePost } from "../hooks/useBlogPosts";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { useToast } from "../components/Toast";
import Comments from "../components/Comments";



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

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
turndownService.escape = (string) => string;

marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function BlogPostDetail() {
  const [settings, setSettings] = useState<any>(null); // Temp fix for lint
  const { slug } = useParams();
  const { post, loading } = usePost(slug || "");
  const { settings: typedSettings } = useSiteSettings();
  useEffect(() => { setSettings(typedSettings); }, [typedSettings]);
  const { showToast } = useToast();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || "Check out this post!",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    }
  };

  const scrollToComments = () => {
    const commentsSection = document.getElementById('comments');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-serif font-bold text-deep-brown mb-4">
          Post Not Found
        </h2>
        <p className="text-taupe mb-8">
          The blog post you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/blog" className="px-8 py-3 bg-primary text-soft-cream rounded-full font-bold">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <Link to="/blog" className="inline-flex items-center space-x-2 text-taupe hover:text-primary transition-colors font-bold group">
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Blog</span>
        </Link>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="space-y-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-taupe text-sm font-bold uppercase tracking-widest">
            {post.genre ? (
              post.genre.split(',').map(g => g.trim()).filter(Boolean).map((genre, index) => (
                <span key={index} className="text-accent">{genre}</span>
              ))
            ) : (
              <span className="text-accent">Uncategorized</span>
            )}
            <span className="w-1 h-1 bg-taupe rounded-full" />
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{Math.ceil(post.content?.split(" ").length / 200) || 5} min read</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-brown leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-center space-x-6 text-taupe font-medium">
            <div className="flex items-center space-x-2">
              <Calendar size={18} />
              <span>{new Date(post.published_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User size={18} />
              <span>{post.author_name || settings?.author_name || "Author"}</span>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={post.featured_image_url || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1973"}
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex justify-center space-x-4 py-4 border-y border-primary/10">
          <button onClick={handleShare} className="flex items-center space-x-2 px-4 py-2 hover:text-primary transition-colors font-bold text-taupe">
            <Share2 size={18} />
            <span>Share</span>
          </button>
          <button onClick={scrollToComments} className="flex items-center space-x-2 px-4 py-2 hover:text-primary transition-colors font-bold text-taupe">
            <MessageCircle size={18} />
            <span>Comment</span>
          </button>
        </div>

        <div className="prose prose-lg prose-headings:font-serif prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-p:text-deep-brown/80 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-deep-brown prose-strong:font-bold prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-deep-brown/70 max-w-none">
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(turndownService.turndown(post.content || '')) as string) }} />
        </div>

        <div className="mt-16 pt-12 border-t border-primary/10">
          <div className="bg-secondary/20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-lg bg-soft-cream flex items-center justify-center">
              {settings?.author_profile_image_url ? (
                 <img src={settings.author_profile_image_url} alt={settings?.author_name || post?.author_name} className="w-full h-full object-cover" />
              ) : (
                 <User className="text-taupe w-12 h-12" />
              )}
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-serif font-bold text-deep-brown">About {settings?.author_name || post?.author_name}</h3>
              <p className="text-deep-brown/70 leading-relaxed">
                {settings?.author_bio || "Author bio goes here."}
              </p>
              <Link to="/about" className="text-primary font-bold hover:underline">View Profile</Link>
            </div>
          </div>
        </div>

        {post && post.additional_images && post.additional_images.length > 0 && (
          <div className="mt-12 mb-8 space-y-4">
            <h3 className="text-xl font-serif font-bold text-deep-brown">Additional Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {post.additional_images.map((url, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden shadow-sm border border-primary/5">
                  <img src={url} alt={`Additional image ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {post && <Comments postId={post.id} />}
      </motion.article>
    </div>
  );
}

import { useAnalytics } from '../hooks/useAnalytics';
import Reviews from "../components/Reviews";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { marked } from 'marked';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import { ArrowLeft, ShoppingCart, Star, Calendar, BookOpen, Share2, Loader2 } from "lucide-react";
import { supabase, type Book } from "../lib/supabase";
import { useToast } from "../components/Toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
turndownService.escape = (string) => string;

marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function BookDetail() {
  const { slug } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book?.title,
          text: book?.description,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          showToast('Failed to share', 'error');
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard", "success");
    }
  };

  useEffect(() => {
    const fetchBook = async () => {
      if (!slug) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error) setBook(data);
      setLoading(false);
    };
    fetchBook();
  }, [slug]);

  // Initialize favorite from localStorage once book slug is known
  useEffect(() => {
    if (!slug) return;
    const saved = localStorage.getItem(`favorite-${slug}`);
    if (saved === 'true') setFavorite(true);
  }, [slug]);

  // Update document title and OG/Twitter meta tags dynamically
  useEffect(() => {
    if (!book) return;

    const siteName = 'Sample Creator Media';
    const pageTitle = `${book.title} | ${siteName}`;
    const description = book.description || '';
    const image = book.cover_image_url || '';
    const url = window.location.href;

    const prevTitle = document.title;
    document.title = pageTitle;

    const metaDefs = [
      { selector: 'meta[name="description"]',        attrName: 'name',     attrValue: 'description',        content: description },
      { selector: 'meta[property="og:title"]',       attrName: 'property', attrValue: 'og:title',           content: pageTitle },
      { selector: 'meta[property="og:description"]', attrName: 'property', attrValue: 'og:description',     content: description },
      { selector: 'meta[property="og:image"]',       attrName: 'property', attrValue: 'og:image',           content: image },
      { selector: 'meta[property="og:url"]',         attrName: 'property', attrValue: 'og:url',             content: url },
      { selector: 'meta[property="og:type"]',        attrName: 'property', attrValue: 'og:type',            content: 'article' },
      { selector: 'meta[name="twitter:card"]',       attrName: 'name',     attrValue: 'twitter:card',       content: 'summary_large_image' },
      { selector: 'meta[name="twitter:title"]',      attrName: 'name',     attrValue: 'twitter:title',      content: pageTitle },
      { selector: 'meta[name="twitter:description"]',attrName: 'name',     attrValue: 'twitter:description',content: description },
      { selector: 'meta[name="twitter:image"]',      attrName: 'name',     attrValue: 'twitter:image',      content: image },
    ];

    const CREATED = '__CREATED__';
    const prevContents: string[] = [];

    for (const { selector, attrName, attrValue, content } of metaDefs) {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
        prevContents.push(CREATED);
      } else {
        prevContents.push(el.getAttribute('content') ?? '');
      }
      el.setAttribute('content', content);
    }

    return () => {
      document.title = prevTitle;
      metaDefs.forEach(({ selector }, idx) => {
        const el = document.querySelector<HTMLMetaElement>(selector);
        if (!el) return;
        if (prevContents[idx] === CREATED) {
          el.remove();
        } else {
          el.setAttribute('content', prevContents[idx]);
        }
      });
    };
  }, [book]);


  const handlePurchaseClick = () => {
    if (book) {
      trackEvent('book_purchase_click', { title: book.title, platform: 'gumroad' }, book.id);
    }
  };

  const shareBook = async () => {
    if (!book) return;
    const shareData = {
      title: book.title,
      text: book.description,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard', 'success');
      }
    } catch (_err) {
      // User cancelled share or clipboard access was denied — silently ignore
    }
  };

  const toggleFavorite = () => {
    if (!slug) return;
    const newState = !favorite;
    setFavorite(newState);
    localStorage.setItem(`favorite-${slug}`, String(newState));
    showToast(newState ? 'Added to favorites' : 'Removed from favorites', newState ? 'success' : 'info');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-serif font-bold text-deep-brown mb-4">
          Book Not Found
        </h2>
        <p className="text-taupe mb-8">
          The book you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/books" className="px-8 py-3 bg-primary text-soft-cream rounded-full font-bold">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <Link to="/books" className="inline-flex items-center space-x-2 text-taupe hover:text-primary transition-colors font-bold group">
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Library</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Book Cover */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl relative z-10 group">
            <img
              src={book.cover_image_url || `https://picsum.photos/seed/${book.id}/800/1200`}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl -z-10" />

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={shareBook}
              className="p-3 bg-white rounded-full shadow-md hover:text-primary transition-colors"
              title="Share this book"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={toggleFavorite}
              className={`p-3 bg-white rounded-full shadow-md transition-colors ${favorite ? 'text-accent' : 'hover:text-accent'}`}
              title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={20} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </motion.div>

        {/* Book Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="flex items-center space-x-3 mb-4">
              {book.featured && (
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-widest">
                  Featured
                </span>
              )}
              <span className="text-taupe font-medium text-sm">{book.genre}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-brown leading-tight mb-4">
              {book.title}
            </h1>
            <div className="flex items-center space-x-4 text-taupe font-medium">
              <div className="flex items-center space-x-1">
                <Calendar size={18} />
                <span>Published: {new Date(book.release_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen size={18} />
                <span>{book.author_name}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-lg text-deep-brown/80 max-w-none">
            <p className="text-xl font-medium text-deep-brown mb-4 leading-relaxed italic">
              {book.description}
            </p>
                        <div className="leading-relaxed whitespace-pre-wrap prose prose-taupe max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(turndownService.turndown(book.long_description || '')) as string) }} />
            </div>
          </div>

          <div className="bg-secondary/20 p-8 rounded-3xl border border-primary/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-taupe text-sm font-bold uppercase tracking-widest mb-1 block">Available Now</span>
                <span className="text-3xl font-bold text-deep-brown">Standard Edition</span>
              </div>
              <div className="flex items-center space-x-1 text-accent">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
            </div>

            {book.gumroad_link ? (
              <a
                href={book.gumroad_link}
                onClick={handlePurchaseClick}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-primary text-soft-cream rounded-full font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
              >
                <ShoppingCart size={20} />
                <span>Purchase on Gumroad</span>
              </a>
            ) : (
              <button disabled className="w-full py-4 bg-taupe/20 text-taupe rounded-full font-bold cursor-not-allowed">
                Coming Soon
              </button>
            )}
            <p className="text-center text-xs text-taupe mt-4 font-medium">
              Secure checkout powered by Gumroad. Instant digital delivery.
            </p>
          </div>
        </motion.div>
      </div>

      {book && <Reviews bookId={book.id} />}
    </div>
  );
}

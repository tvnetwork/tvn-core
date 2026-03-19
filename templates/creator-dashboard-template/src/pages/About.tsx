import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { marked } from 'marked';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import { ArrowLeft, User, Mail, Globe, Twitter, Instagram, Linkedin, Facebook } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { Loader2 } from "lucide-react";

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
turndownService.escape = (string) => string;

marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function About() {
  const { settings, loading } = useSiteSettings();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-serif font-bold text-deep-brown mb-4">
          Profile Not Found
        </h2>
        <p className="text-taupe mb-8">
          The author profile could not be loaded.
        </p>
        <Link to="/" className="px-8 py-3 bg-primary text-soft-cream rounded-full font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <Link to="/" className="inline-flex items-center space-x-2 text-taupe hover:text-primary transition-colors font-bold group">
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-xl bg-soft-cream flex items-center justify-center mx-auto md:mx-0">
            {settings.author_profile_image_url ? (
               <img src={settings.author_profile_image_url} alt={settings.author_name} className="w-full h-full object-cover" />
            ) : (
               <User className="text-taupe w-24 h-24" />
            )}
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-deep-brown mb-2">
                {settings.author_name}
              </h1>
              <p className="text-xl text-primary font-medium">{settings.tagline}</p>
            </div>

            <p className="text-lg text-deep-brown/80 leading-relaxed">
              {settings.author_bio}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4 border-t border-primary/10">
              {settings.author_email && (
                <a href={`mailto:${settings.author_email}`} className="flex items-center space-x-2 text-taupe hover:text-primary transition-colors" title="Email">
                  <div className="p-2 bg-soft-cream/50 rounded-full">
                    <Mail size={20} />
                  </div>
                </a>
              )}
              {settings.social_links?.website && (
                <a href={settings.social_links.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-taupe hover:text-primary transition-colors" title="Website">
                  <div className="p-2 bg-soft-cream/50 rounded-full">
                    <Globe size={20} />
                  </div>
                </a>
              )}
              {settings.social_links?.twitter && (
                <a href={settings.social_links.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-taupe hover:text-primary transition-colors" title="Twitter">
                  <div className="p-2 bg-soft-cream/50 rounded-full">
                    <Twitter size={20} />
                  </div>
                </a>
              )}
              {settings.social_links?.instagram && (
                <a href={settings.social_links.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-taupe hover:text-primary transition-colors" title="Instagram">
                  <div className="p-2 bg-soft-cream/50 rounded-full">
                    <Instagram size={20} />
                  </div>
                </a>
              )}
              {settings.social_links?.linkedin && (
                <a href={settings.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-taupe hover:text-primary transition-colors" title="LinkedIn">
                  <div className="p-2 bg-soft-cream/50 rounded-full">
                    <Linkedin size={20} />
                  </div>
                </a>
              )}
              {settings.social_links?.facebook && (
                <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-taupe hover:text-primary transition-colors" title="Facebook">
                  <div className="p-2 bg-soft-cream/50 rounded-full">
                    <Facebook size={20} />
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        {settings.about_content && settings.about_content !== 'The full story of your writing journey.' && (
          <div className="mt-16 pt-12 border-t border-primary/10">
            <div className="prose prose-lg prose-headings:font-serif prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-p:text-deep-brown/80 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-deep-brown prose-strong:font-bold max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(turndownService.turndown(settings.about_content || '')) as string) }} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

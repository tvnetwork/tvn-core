import { DEFAULT_SITE_NAME } from '../lib/constants';
import { Database, Terminal, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function DatabaseSetup() {
  const [copied, setCopied] = useState(false);
  const sql = `-- Create Books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,
    advanced_description TEXT,
    premium_description TEXT,
    cover_image_url TEXT,
    release_date DATE,
    genre TEXT,
    gumroad_link TEXT,
    selar_link TEXT,
    advanced_gumroad_link TEXT,
    premium_gumroad_link TEXT,
    featured BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    is_draft BOOLEAN DEFAULT false,
    is_coming_soon BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Blog Posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    advanced_content TEXT,
    premium_content TEXT,
    excerpt TEXT,
    genre TEXT,
    featured_image_url TEXT,
    author_name TEXT NOT NULL,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- Create Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- Create Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Site Settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name TEXT DEFAULT '${DEFAULT_SITE_NAME}',
    site_logo_url TEXT,
    favicon_url TEXT,
    author_name TEXT,
    author_bio TEXT,
    author_email TEXT,
    author_profile_image_url TEXT,
    tagline TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    about_content TEXT,
    footer_text TEXT
);

-- Create Subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Newsletter Campaigns table
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'markdown',
    recipient_count INTEGER NOT NULL DEFAULT 0,
    delivered INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    simulated BOOLEAN NOT NULL DEFAULT false,
    featured_image_url TEXT,
    accent_color TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);


-- Create Analytics Events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    path TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Media Library table
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: In a real migration you would alter, but for initial setup:
-- comments already exists, so we should make sure 'approved' is in it.
-- Let's replace the comments table definition.

-- Set up Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on analytics_events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read access on analytics_events" ON public.analytics_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public read access on media_library" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on media_library" ON public.media_library FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access on approved comments" ON public.comments FOR SELECT USING (approved = true);
CREATE POLICY "Allow public insert on comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Allow public insert on reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow public read access on blog_posts" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on subscribers" ON public.subscribers FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated full access on comments" ON public.comments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on reviews" ON public.reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on books" ON public.books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on blog_posts" ON public.blog_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on site_settings" ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on subscribers" ON public.subscribers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on newsletter_campaigns" ON public.newsletter_campaigns FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial site settings
INSERT INTO public.site_settings (
    site_name,
    author_name,
    tagline,
    author_bio,
    about_content,
    footer_text
) VALUES (
    '${DEFAULT_SITE_NAME}',
    'Your Name',
    'Author & Storyteller',
    'A brief bio about you.',
    'The full story of your writing journey.',
    '© 2024 Your Name. All rights reserved.'
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback: select a hidden textarea
      const ta = document.createElement('textarea');
      ta.value = sql;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
      >
        <div className="bg-stone-900 p-6 text-white flex items-center gap-4">
          <div className="bg-stone-800 p-3 rounded-xl">
            <Database className="w-8 h-8 text-stone-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold">Database Setup Required</h1>
            <p className="text-stone-400 text-sm">Follow these steps to initialize your Supabase tables.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                <span>Open Supabase</span>
              </div>
              <p className="text-sm text-stone-600">Go to your project dashboard and select the <span className="font-mono text-stone-900">SQL Editor</span>.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                <span>Paste Script</span>
              </div>
              <p className="text-sm text-stone-600">Create a <span className="font-mono text-stone-900">New query</span> and paste the SQL script below.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                <span>Run Query</span>
              </div>
              <p className="text-sm text-stone-600">Click <span className="font-mono text-stone-900">Run</span> and refresh this page to start using your app.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Terminal className="w-5 h-5" />
                <span>SQL Script</span>
              </div>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                }`}
              >
                {copied ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  'Copy SQL'
                )}
              </button>
            </div>
            <div className="relative">
              <pre className="bg-stone-900 text-stone-300 p-6 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-stone-800">
                {sql}
              </pre>
              <div className="absolute bottom-4 right-4 text-stone-500 pointer-events-none">
                <CheckCircle2 className="w-5 h-5 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
            <p className="text-sm text-stone-600 italic">
              "Once the tables are created, this screen will automatically disappear and your site will be live."
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

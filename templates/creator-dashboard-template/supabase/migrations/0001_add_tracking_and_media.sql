-- Tracking Analytics Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- e.g., 'page_view', 'book_click', 'newsletter_signup'
    path TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Media Library Table
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add Approved Column to Comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add Coming Soon Column to Books (if not exists)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;

-- RLS for Analytics
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on analytics_events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read access on analytics_events" ON public.analytics_events FOR SELECT USING (auth.role() = 'authenticated');

-- RLS for Media Library
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on media_library" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on media_library" ON public.media_library FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on media_library" ON public.media_library FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on media_library" ON public.media_library FOR DELETE USING (auth.role() = 'authenticated');

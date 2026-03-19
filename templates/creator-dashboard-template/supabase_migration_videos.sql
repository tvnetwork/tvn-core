CREATE TABLE IF NOT EXISTS public.videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration TEXT,
    likes INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on videos" ON public.videos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public update likes on videos" ON public.videos FOR UPDATE USING (true) WITH CHECK (true);

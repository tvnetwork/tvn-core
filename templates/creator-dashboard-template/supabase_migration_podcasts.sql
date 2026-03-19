CREATE TABLE IF NOT EXISTS public.podcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    cover_image_url TEXT,
    duration TEXT,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on podcasts" ON public.podcasts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on podcasts" ON public.podcasts FOR ALL USING (auth.role() = 'authenticated');

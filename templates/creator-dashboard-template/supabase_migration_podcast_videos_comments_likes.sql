-- Add likes column to podcasts if it doesn't exist
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Update RLS for podcasts to allow updating likes
CREATE POLICY "Allow public update likes on podcasts" ON public.podcasts FOR UPDATE USING (true) WITH CHECK (true);


-- Create Podcast Comments table
CREATE TABLE IF NOT EXISTS public.podcast_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    likes INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.podcast_comments(id) ON DELETE CASCADE
);

-- Set up Row Level Security (RLS) for podcast comments
ALTER TABLE public.podcast_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on podcast_comments" ON public.podcast_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on podcast_comments" ON public.podcast_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update likes on podcast_comments" ON public.podcast_comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on podcast_comments" ON public.podcast_comments FOR ALL USING (auth.role() = 'authenticated');


-- Create Video Comments table
CREATE TABLE IF NOT EXISTS public.video_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    likes INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE
);

-- Set up Row Level Security (RLS) for video comments
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on video_comments" ON public.video_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on video_comments" ON public.video_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update likes on video_comments" ON public.video_comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on video_comments" ON public.video_comments FOR ALL USING (auth.role() = 'authenticated');

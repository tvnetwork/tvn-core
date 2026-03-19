-- Create Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to comments
CREATE POLICY "Allow public read access on comments" ON public.comments FOR SELECT USING (true);

-- Allow public insert access to comments
CREATE POLICY "Allow public insert on comments" ON public.comments FOR INSERT WITH CHECK (true);

-- Allow authenticated users full access to comments
CREATE POLICY "Allow authenticated full access on comments" ON public.comments FOR ALL USING (auth.role() = 'authenticated');

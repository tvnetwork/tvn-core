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

-- Set up Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to approved reviews
CREATE POLICY "Allow public read access on approved reviews" ON public.reviews FOR SELECT USING (approved = true);

-- Allow public insert on reviews
CREATE POLICY "Allow public insert on reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Allow authenticated users full access to reviews
CREATE POLICY "Allow authenticated full access on reviews" ON public.reviews FOR ALL USING (auth.role() = 'authenticated');

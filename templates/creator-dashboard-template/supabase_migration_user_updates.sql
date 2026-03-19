ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE public.podcast_comments ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE public.video_comments ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS genre TEXT;

NOTIFY pgrst, 'reload schema';

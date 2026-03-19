ALTER TABLE public.comments ADD COLUMN likes INTEGER DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

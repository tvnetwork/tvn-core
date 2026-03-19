import { useState, useEffect } from 'react';
import { supabase, type BlogPost } from '../lib/supabase';

export function useBlogPosts(options?: { includeDrafts?: boolean }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('blog_posts').select('*').order('published_at', { ascending: false });
      if (!options?.includeDrafts) {
        query = query.eq('published', true);
      }
      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { posts, loading, error, refetch: fetchPosts };
}

export function usePost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();
      setPost(data);
      setLoading(false);
    };
    if (slug) fetchPost();
  }, [slug]);

  return { post, loading };
}

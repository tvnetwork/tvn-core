import { useState, useEffect } from 'react';
import { supabase, type Book, type BlogPost } from '../lib/supabase';

export interface DashboardStats {
  totalBooks: number;
  totalPosts: number;
  totalSubscribers: number;
  recentBooks: Book[];
  recentPosts: BlogPost[];
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch counts
      const [booksCount, postsCount, subsCount] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('subscribers').select('*', { count: 'exact', head: true })
      ]);

      // Fetch recent items
      const [recentBooks, recentPosts] = await Promise.all([
        supabase.from('books').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      setStats({
        totalBooks: booksCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalSubscribers: subsCount.count || 0,
        recentBooks: recentBooks.data || [],
        recentPosts: recentPosts.data || []
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}

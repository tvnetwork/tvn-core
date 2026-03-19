import { useState, useEffect } from 'react';
import { supabase, type Book } from '../lib/supabase';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setBooks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return { books, loading, error, refetch: fetchBooks };
}

export function useFeaturedBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('featured', true)
        .limit(3);
      setBooks(data || []);
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  return { books, loading };
}

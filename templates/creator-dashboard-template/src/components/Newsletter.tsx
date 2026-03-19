import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if Supabase is properly configured
    const isConfigured = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env.SUPABASE_URL);
    if (!isConfigured) {
      setError('Newsletter is currently unavailable (Supabase not configured).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already subscribed!');
        }
        throw error;
      }

      setSuccess(true);
      trackEvent('newsletter_signup', { email });
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20">
        <CheckCircle2 size={20} />
        <span className="font-medium">Thanks for joining the inner circle!</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-serif font-semibold text-secondary">Join the Inner Circle</h4>
      <p className="text-soft-cream/70 text-sm">
        Be the first to know about new releases, exclusive previews, and behind-the-scenes content.
      </p>
      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-soft-cream/5 border border-soft-cream/10 rounded-xl px-4 py-3 pr-12 text-soft-cream placeholder:text-soft-cream/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-soft-cream rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
}

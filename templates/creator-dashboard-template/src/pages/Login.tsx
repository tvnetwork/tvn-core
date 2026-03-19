import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, LogIn } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-soft-cream/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-primary/5 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-deep-brown mb-2">Admin Login</h1>
            <p className="text-taupe font-medium">Access your author dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center space-x-3 text-accent text-sm font-bold">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-taupe uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-soft-cream rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-primary/5 text-center">
            <Link to="/" className="text-sm font-bold text-taupe hover:text-primary transition-colors">
              Back to Public Website
            </Link>
          </div>
        </div>

        <div className="bg-primary/5 p-6 text-center space-y-2">
          <p className="text-xs text-taupe font-bold uppercase tracking-widest">
            Protected by Sample Creator Media Security
          </p>
          <p className="text-[10px] text-taupe/60 font-medium">
            Powered by <a href="https://your-agency.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline underline-offset-2">Developer Agency</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

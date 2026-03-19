import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { NewsletterCampaign } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import {
  Mail, Loader2, Search, Eye, X, CheckCircle2, AlertCircle,
  Calendar, Users, ChevronRight, ChevronLeft, Send, Database,
  Terminal, Copy, RefreshCw,
} from 'lucide-react';

// ── SQL needed to create the newsletter_campaigns table ───────────────────────
const MIGRATION_SQL = `CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'markdown',
    recipient_count INTEGER NOT NULL DEFAULT 0,
    delivered INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    simulated BOOLEAN NOT NULL DEFAULT false,
    featured_image_url TEXT,
    accent_color TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on newsletter_campaigns"
  ON public.newsletter_campaigns FOR ALL
  USING (auth.role() = 'authenticated');`;

// ── One-time migration banner ─────────────────────────────────────────────────
function MigrationBanner({ onRetry }: { onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(MIGRATION_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="bg-amber-50 px-6 py-5 flex items-start gap-4 border-b border-amber-100">
        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shrink-0 mt-0.5">
          <Database size={22} />
        </div>
        <div>
          <h3 className="font-serif font-bold text-deep-brown text-lg leading-tight">
            One-time database setup required
          </h3>
          <p className="text-sm text-taupe mt-1">
            The <code className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs font-mono">newsletter_campaigns</code> table doesn't exist in your Supabase database yet.
            Run the SQL below in your{' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline font-medium"
            >
              Supabase SQL Editor
            </a>
            {' '}to enable newsletter history.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/40">
        <ol className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          {[
            { n: '1', text: 'Open your Supabase project → SQL Editor → New query' },
            { n: '2', text: 'Paste the SQL below and click Run' },
            { n: '3', text: 'Click "Check Again" to reload this page' },
          ].map(step => (
            <li key={step.n} className="flex items-start gap-2.5 text-sm text-taupe">
              <span className="shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                {step.n}
              </span>
              {step.text}
            </li>
          ))}
        </ol>
      </div>

      {/* SQL block */}
      <div className="px-6 py-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-deep-brown font-bold text-sm">
            <Terminal size={16} />
            <span>SQL Script</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-soft-cream hover:bg-primary/10 text-taupe hover:text-primary'
            }`}
          >
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
        </div>
        <pre className="bg-deep-brown text-soft-cream/90 p-5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
          {MIGRATION_SQL}
        </pre>
        <div className="flex justify-end pt-1">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {retrying
              ? <Loader2 size={15} className="animate-spin" />
              : <RefreshCw size={15} />}
            {retrying ? 'Checking…' : 'Check Again'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminNewsletterHistory() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [preview, setPreview] = useState<NewsletterCampaign | null>(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCampaigns = async () => {
    setLoading(true);
    setTableMissing(false);
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('sent_at', { ascending: false });
      if (error) {
        // Postgres "relation does not exist" (42P01) or Supabase "PGRST116" / generic
        if (
          error.message?.toLowerCase().includes('relation') ||
          error.message?.toLowerCase().includes('does not exist') ||
          error.code === '42P01'
        ) {
          setTableMissing(true);
        } else {
          throw error;
        }
      } else {
        setCampaigns(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching newsletter campaigns:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = campaigns.filter(c =>
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0);
  const totalRecipients = campaigns.reduce((s, c) => s + c.recipient_count, 0);

  // reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [searchTerm]);

  // ── Preview helpers ───────────────────────────────────────────────────────
  const renderPreviewBody = (c: NewsletterCampaign) => {
    if (c.content_type === 'html') {
      // Render raw HTML inside a sandboxed iframe via a blob URL
      return (
        <iframe
          title="Newsletter preview"
          srcDoc={c.content}
          sandbox=""
          className="w-full flex-grow border-0 rounded-b-2xl"
          style={{ minHeight: 480 }}
        />
      );
    }
    // For Markdown, show plain text with whitespace preserved
    return (
      <pre className="flex-grow overflow-y-auto p-6 text-sm text-deep-brown/80 whitespace-pre-wrap font-sans leading-relaxed">
        {c.content}
      </pre>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-deep-brown">Newsletter History</h1>
              <p className="text-taupe font-medium">Browse every newsletter you've sent to your subscribers.</p>
            </div>
          </div>

          {/* ── Migration banner (only shown when table is missing) ── */}
          {tableMissing && <MigrationBanner onRetry={fetchCampaigns} />}

          {/* ── The rest only renders when the table exists ── */}
          {!tableMissing && (<>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Campaigns',
                value: campaigns.length,
                icon: Send,
                color: 'bg-primary/10 text-primary',
              },
              {
                label: 'Total Recipients',
                value: totalRecipients,
                icon: Users,
                color: 'bg-purple-100 text-purple-600',
              },
              {
                label: 'Emails Delivered',
                value: totalDelivered,
                icon: CheckCircle2,
                color: 'bg-emerald-100 text-emerald-600',
              },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-primary/5 p-5 flex items-center space-x-4">
                  <div className={`p-3 rounded-xl shrink-0 ${card.color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-taupe uppercase tracking-widest">{card.label}</p>
                    <p className="text-2xl font-bold text-deep-brown">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Search ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
            <div className="p-5 border-b border-primary/5 flex items-center space-x-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={18} />
                <input
                  type="text"
                  placeholder="Search by subject…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-soft-cream/30 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <p className="text-xs font-bold text-taupe shrink-0">
                {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* ── Campaign list ── */}
            {loading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : paginated.length === 0 ? (
              <div className="p-20 text-center">
                <Mail className="w-12 h-12 text-taupe/30 mx-auto mb-4" />
                <p className="text-taupe font-medium">
                  {searchTerm ? 'No campaigns match your search.' : 'No newsletters sent yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-primary/5">
                {paginated.map(campaign => (
                  <div
                    key={campaign.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-soft-cream/20 transition-colors group"
                  >
                    {/* Icon */}
                    <div className="shrink-0 p-2.5 bg-primary/8 rounded-xl text-primary">
                      <Mail size={18} />
                    </div>

                    {/* Main info */}
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-deep-brown truncate group-hover:text-primary transition-colors">
                        {campaign.subject}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-taupe font-medium">
                          <Calendar size={12} />
                          {new Date(campaign.sent_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-taupe font-medium">
                          <Users size={12} />
                          {campaign.recipient_count} recipient{campaign.recipient_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 size={12} />
                          {campaign.delivered} delivered
                        </span>
                        {campaign.failed > 0 && (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertCircle size={12} />
                            {campaign.failed} failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        campaign.content_type === 'html'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {campaign.content_type}
                      </span>
                      {campaign.simulated && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">
                          Simulated
                        </span>
                      )}
                    </div>

                    {/* Preview button */}
                    <button
                      onClick={() => setPreview(campaign)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-primary/5 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-taupe border border-primary/10 rounded-lg hover:bg-primary/5 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs font-medium text-taupe">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-taupe border border-primary/10 rounded-lg hover:bg-primary/5 disabled:opacity-40 transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          </>)} {/* end !tableMissing */}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          Newsletter Preview Modal
      ══════════════════════════════════════════════════════════════════════ */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-brown/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-primary/10 overflow-hidden">

            {/* Modal header */}
            <div className="px-6 py-5 border-b border-primary/5 flex items-start gap-4 bg-soft-cream/30 shrink-0">
              <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0 mt-0.5">
                <Mail size={20} />
              </div>
              <div className="flex-grow min-w-0">
                <h2 className="text-lg font-serif font-bold text-deep-brown leading-tight truncate">
                  {preview.subject}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-taupe font-medium">
                    <Calendar size={12} />
                    {new Date(preview.sent_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-taupe font-medium">
                    <Users size={12} />
                    {preview.recipient_count} recipients
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={12} />
                    {preview.delivered} delivered
                  </span>
                  {preview.failed > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={12} />
                      {preview.failed} failed
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    preview.content_type === 'html'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {preview.content_type}
                  </span>
                  {preview.simulated && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">
                      Simulated
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="p-2 hover:bg-accent/5 text-taupe hover:text-accent rounded-full transition-all shrink-0"
              >
                <X size={22} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden flex flex-col">
              {renderPreviewBody(preview)}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

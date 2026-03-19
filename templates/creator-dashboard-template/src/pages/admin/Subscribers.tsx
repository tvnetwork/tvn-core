import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { NewsletterCampaign } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import { Mail, Trash2, Loader2, Search, Download, Send, X, Sparkles, Image as ImageIcon, Palette, Users, CheckSquare, Square, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

type ModalTab = 'recipients' | 'compose';

interface SendProgress {
  phase: 'idle' | 'sending' | 'done' | 'error';
  total: number;
  /** Simulated "current email index" for the progress bar */
  current: number;
  delivered: number;
  failed: number;
  errorMessage?: string;
  simulated?: boolean;
  historyNote?: string;
  siteName: string;
}

// ── Mailchimp-style progress / summary panel ───────────────────────────────
function SendProgressPanel({
  progress,
  onClose,
}: {
  progress: SendProgress;
  onClose: () => void;
}) {
  const pct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-deep-brown/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-primary/10 overflow-hidden">

        {/* Header */}
        <div className={`px-6 py-5 flex items-center space-x-3 ${
          progress.phase === 'done'  ? 'bg-emerald-50 border-b border-emerald-100' :
          progress.phase === 'error' ? 'bg-red-50 border-b border-red-100' :
                                       'bg-soft-cream/40 border-b border-primary/5'
        }`}>
          <div className={`p-2 rounded-xl ${
            progress.phase === 'done'  ? 'bg-emerald-100 text-emerald-600' :
            progress.phase === 'error' ? 'bg-red-100 text-red-500' :
                                         'bg-primary/10 text-primary'
          }`}>
            {progress.phase === 'done'  && <CheckCircle2 size={22} />}
            {progress.phase === 'error' && <AlertCircle size={22} />}
            {(progress.phase === 'sending' || progress.phase === 'idle') && <Loader2 size={22} className="animate-spin" />}
          </div>
          <div>
            <h3 className="font-serif font-bold text-deep-brown text-lg leading-tight">
              {progress.phase === 'done'  ? 'Newsletter Sent!' :
               progress.phase === 'error' ? 'Sending Failed' :
                                            'Sending Newsletter…'}
            </h3>
            <p className="text-xs font-medium text-taupe">
              {progress.phase === 'sending'
                ? `Sending to subscriber ${Math.min(progress.current + 1, progress.total)} of ${progress.total}…`
                : progress.phase === 'done'
                  ? progress.simulated ? 'Simulation complete — SMTP not configured' : 'All emails processed'
                  : progress.errorMessage ?? 'An error occurred'}
            </p>
          </div>
          {progress.phase !== 'sending' && (
            <button
              onClick={onClose}
              className="ml-auto p-1.5 hover:bg-black/5 rounded-full text-taupe hover:text-deep-brown transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-5 pb-2">
          <div className="h-2.5 bg-soft-cream rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                progress.phase === 'done'  ? 'bg-emerald-500' :
                progress.phase === 'error' ? 'bg-red-400' :
                                             'bg-primary'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs font-medium text-taupe">
            <span>{progress.phase === 'done' ? '✓ Completed' : `${pct}%`}</span>
            <span>{progress.total} recipient{progress.total !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Delivery summary (shown only on done / error) */}
        {(progress.phase === 'done' || progress.phase === 'error') && (
          <div className="px-6 pb-6">
            <div className="mt-4 rounded-2xl bg-soft-cream/40 border border-primary/5 divide-y divide-primary/5">
              {[
                { label: 'Recipients', value: progress.total },
                { label: 'Delivered',  value: progress.delivered,  color: 'text-emerald-600' },
                { label: 'Failed',     value: progress.failed,     color: progress.failed > 0 ? 'text-red-500' : undefined },
                { label: 'Sender',     value: progress.siteName },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="font-medium text-taupe">{row.label}</span>
                  <span className={`font-bold text-deep-brown ${row.color ?? ''}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {progress.phase === 'done' && (
              <p className="mt-3 text-center text-xs text-taupe">
                This panel will close automatically in a few seconds.
              </p>
            )}

            {progress.historyNote && (
              <p className="mt-2 text-center text-xs text-amber-600 font-medium">
                ⚠ {progress.historyNote}
              </p>
            )}

            <button
              onClick={onClose}
              className={`mt-4 w-full py-3 rounded-xl font-bold text-white transition-all ${
                progress.phase === 'done' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {progress.phase === 'done' ? 'Close' : 'Dismiss'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSubscribers() {
  const { settings } = useSiteSettings();
  const { showToast } = useToast();

  // ── List state ──────────────────────────────────────────────────────────
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('recipients');
  const [modalSearch, setModalSearch] = useState('');
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(new Set());

  // ── Compose state ────────────────────────────────────────────────────────
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'markdown' | 'html'>('markdown');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#8B6F47');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── Send progress panel state ─────────────────────────────────────────────
  const defaultProgress: SendProgress = {
    phase: 'idle', total: 0, current: 0, delivered: 0, failed: 0, siteName: '',
  };
  const [sendProgress, setSendProgress] = useState<SendProgress>(defaultProgress);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-close the progress panel 5 s after success
  useEffect(() => {
    if (sendProgress.phase === 'done') {
      autoCloseTimerRef.current = setTimeout(closeSendProgress, 5000);
    }
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [sendProgress.phase]);

  const closeSendProgress = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setSendProgress(defaultProgress);
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubscribers(data || []);
    } catch (error: any) {
      console.error('Error fetching subscribers:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscribers(); }, []);

  // ── Main table helpers ───────────────────────────────────────────────────
  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allMainChecked =
    filteredSubscribers.length > 0 &&
    filteredSubscribers.every(s => selectedIds.has(s.id));

  const toggleMainAll = () => {
    if (allMainChecked) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredSubscribers.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredSubscribers.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const toggleMainOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Open modal ───────────────────────────────────────────────────────────
  const openModal = () => {
    // Pre-select: use main-table selection if any, otherwise all
    const initial = selectedIds.size > 0
      ? new Set(selectedIds)
      : new Set(subscribers.map(s => s.id));
    setModalSelectedIds(initial);
    setModalTab('recipients');
    setModalSearch('');
    setIsModalOpen(true);
  };

  // ── Modal recipient helpers ───────────────────────────────────────────────
  const modalFiltered = subscribers.filter(s =>
    s.email.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const allModalChecked =
    modalFiltered.length > 0 &&
    modalFiltered.every(s => modalSelectedIds.has(s.id));

  const toggleModalAll = () => {
    if (allModalChecked) {
      setModalSelectedIds(prev => {
        const next = new Set(prev);
        modalFiltered.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setModalSelectedIds(prev => {
        const next = new Set(prev);
        modalFiltered.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const toggleModalOne = (id: string) => {
    setModalSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      const { error } = await supabase.from('subscribers').delete().eq('id', id);
      if (error) throw error;
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      showToast('Subscriber removed.', 'success');
    } catch (error: any) {
      showToast('Error deleting subscriber: ' + error.message, 'error');
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = subscribers.map(s =>
      `${s.email},${new Date(s.created_at).toLocaleDateString()}`
    );
    const csv = 'data:text/csv;charset=utf-8,Email,Joined Date\n' + rows.join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'subscribers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Send newsletter ───────────────────────────────────────────────────────
  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;
    if (modalSelectedIds.size === 0) {
      setSendProgress({
        phase: 'error',
        total: 0,
        current: 0,
        delivered: 0,
        failed: 0,
        errorMessage: 'Please select at least one recipient.',
        siteName: settings?.site_name || 'Sample Creator Media',
      });
      return;
    }

    const recipientEmails = subscribers
      .filter(s => modalSelectedIds.has(s.id))
      .map(s => s.email);

    const total = recipientEmails.length;
    const siteName = settings?.site_name || 'Sample Creator Media';

    // Close the compose modal and open the progress panel
    setIsModalOpen(false);
    setSending(true);

    setSendProgress({
      phase: 'sending',
      total,
      current: 0,
      delivered: 0,
      failed: 0,
      siteName,
    });

    // Simulate per-email progress ticks while the HTTP request is in-flight.
    // We advance 1 "tick" every (estimated total time / total) ms, but stop
    // one tick short so the bar doesn't reach 100 % before the real response.
    const tickMs = Math.max(300, Math.min(1500, 3000 / total));
    let tick = 0;
    progressTimerRef.current = setInterval(() => {
      tick++;
      if (tick < total) {
        setSendProgress(prev => ({ ...prev, current: tick }));
      } else {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }
    }, tickMs);

    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          contentType,
          subscribers: recipientEmails,
          siteName,
          authorName: settings?.author_name || 'The Author',
          featuredImageUrl: featuredImageUrl || undefined,
          accentColor: accentColor !== '#8B6F47' ? accentColor : undefined,
        }),
      });

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      const data = await response.json();
      if (data.success) {
        const delivered = data.delivered ?? total;
        const failed = data.failed ?? 0;

        setSendProgress({
          phase: 'done',
          total,
          current: total,
          delivered,
          failed,
          simulated: data.simulated,
          siteName,
        });

        // Persist the campaign to Supabase (best-effort)
        supabase.from('newsletter_campaigns').insert([{
          subject,
          content,
          content_type: contentType,
          recipient_count: total,
          delivered,
          failed,
          simulated: !!data.simulated,
          featured_image_url: featuredImageUrl || null,
          accent_color: accentColor !== '#8B6F47' ? accentColor : null,
        } satisfies Omit<NewsletterCampaign, 'id' | 'sent_at'>]).then(({ error: dbErr }) => {
          if (dbErr) {
            console.warn('Could not save campaign record:', dbErr.message);
            setSendProgress(prev => ({
              ...prev,
              historyNote: 'History not saved — run the newsletter_campaigns SQL migration first.',
            }));
          }
        });

        // Reset compose fields
        setSubject('');
        setContent('');
        setContentType('markdown');
        setFeaturedImageUrl('');
        setAccentColor('#8B6F47');
      } else {
        throw new Error(data.error || 'Failed to send newsletter');
      }
    } catch (error: any) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setSendProgress(prev => ({
        ...prev,
        phase: 'error',
        current: prev.current,
        errorMessage: error.message,
      }));
    } finally {
      setSending(false);
    }
  };

  // ── AI draft generation ───────────────────────────────────────────────────
  const handleGenerateDraft = async () => {
    try {
      setGenerating(true);
      const { data: recentPosts } = await supabase
        .from('blog_posts')
        .select('title, excerpt')
        .order('published_at', { ascending: false })
        .limit(3);

      const { data: recentBooks } = await supabase
        .from('books')
        .select('title, description')
        .order('created_at', { ascending: false })
        .limit(2);

      const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a professional newsletter writer for an author.
        Create a compelling newsletter draft based on the following recent content:
        Blog Posts: ${JSON.stringify(recentPosts)}
        Books: ${JSON.stringify(recentBooks)}
        The newsletter should be engaging, personal, and encourage readers to check out new content.
        Provide the output in JSON format with "subject" and "content" (markdown) fields.`,
        config: { responseMimeType: 'application/json' },
      });

      const result = JSON.parse(response.text || '{}');
      if (result.subject) setSubject(result.subject);
      if (result.content) setContent(result.content);
      setModalTab('compose');
    } catch (error: any) {
      console.error('Error generating draft:', error);
      showToast('Failed to generate draft. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-deep-brown">Subscribers</h1>
              <p className="text-taupe font-medium">Manage your mailing list and reader engagement.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openModal}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Send size={20} />
                <span>
                  {selectedIds.size > 0
                    ? `Send to ${selectedIds.size} selected`
                    : 'Send Newsletter'}
                </span>
              </button>
              <button
                onClick={exportCSV}
                className="px-6 py-3 bg-white border border-primary/10 text-primary rounded-xl font-bold flex items-center space-x-2 hover:bg-primary/5 transition-all"
              >
                <Download size={20} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* ── Subscriber table ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
            <div className="p-6 border-b border-primary/5 flex items-center space-x-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={20} />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-soft-cream/30 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="text-sm font-bold text-taupe uppercase tracking-widest shrink-0">
                {selectedIds.size > 0
                  ? <span className="text-primary">{selectedIds.size} selected</span>
                  : `${filteredSubscribers.length} total`}
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 flex justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="p-20 text-center">
                  <Mail className="w-12 h-12 text-taupe/30 mx-auto mb-4" />
                  <p className="text-taupe font-medium">No subscribers found.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-soft-cream/30 text-taupe text-xs font-bold uppercase tracking-widest">
                      <th className="px-6 py-4 w-12">
                        <button onClick={toggleMainAll} className="text-taupe hover:text-primary transition-colors">
                          {allMainChecked
                            ? <CheckSquare size={18} className="text-primary" />
                            : <Square size={18} />}
                        </button>
                      </th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {filteredSubscribers.map((subscriber) => (
                      <tr
                        key={subscriber.id}
                        className={`transition-colors cursor-pointer ${selectedIds.has(subscriber.id) ? 'bg-primary/5' : 'hover:bg-soft-cream/20'}`}
                        onClick={() => toggleMainOne(subscriber.id)}
                      >
                        <td className="px-6 py-4">
                          {selectedIds.has(subscriber.id)
                            ? <CheckSquare size={18} className="text-primary" />
                            : <Square size={18} className="text-taupe/40" />}
                        </td>
                        <td className="px-6 py-4 font-bold text-deep-brown">{subscriber.email}</td>
                        <td className="px-6 py-4 text-taupe font-medium">
                          {new Date(subscriber.created_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setConfirmDeleteId(subscriber.id)}
                            className="p-2 text-accent hover:bg-accent/5 rounded-lg transition-colors"
                            title="Remove Subscriber"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          Newsletter Modal
      ══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-brown/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-primary/10 overflow-hidden">

            {/* ── Modal header ── */}
            <div className="p-6 border-b border-primary/5 flex justify-between items-center bg-soft-cream/30 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Mail size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-deep-brown">Send Newsletter</h2>
                  <p className="text-xs text-taupe font-medium">
                    {modalSelectedIds.size} of {subscribers.length} recipients selected
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-accent/5 text-taupe hover:text-accent rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-primary/5 shrink-0 bg-white">
              {(['recipients', 'compose'] as ModalTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`px-6 py-3 text-sm font-bold capitalize transition-colors border-b-2 ${
                    modalTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-taupe hover:text-deep-brown'
                  }`}
                >
                  {tab === 'recipients' && <span className="flex items-center space-x-1.5"><Users size={14} /><span>Recipients ({modalSelectedIds.size})</span></span>}
                  {tab === 'compose'    && <span className="flex items-center space-x-1.5"><Send size={14} /><span>Compose</span></span>}
                </button>
              ))}
              {/* AI draft — always accessible */}
              <div className="ml-auto flex items-center pr-4">
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  disabled={generating}
                  className="text-sm font-bold text-primary flex items-center space-x-1.5 hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{generating ? 'Generating…' : 'AI Draft'}</span>
                </button>
              </div>
            </div>

            {/* ── Tab body ── */}
            <div className="flex-grow overflow-y-auto">

              {/* ── Recipients tab ── */}
              {modalTab === 'recipients' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" size={16} />
                      <input
                        type="text"
                        placeholder="Search recipients…"
                        value={modalSearch}
                        onChange={e => setModalSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-soft-cream/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={toggleModalAll}
                      className="shrink-0 flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-primary/10 text-sm font-bold text-deep-brown hover:bg-primary/5 transition-colors"
                    >
                      {allModalChecked
                        ? <><CheckSquare size={16} className="text-primary" /><span>Deselect All</span></>
                        : <><Square size={16} /><span>Select All</span></>}
                    </button>
                  </div>

                  <div className="border border-primary/5 rounded-2xl overflow-hidden divide-y divide-primary/5 max-h-72 overflow-y-auto">
                    {modalFiltered.map(s => (
                      <div
                        key={s.id}
                        onClick={() => toggleModalOne(s.id)}
                        className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                          modalSelectedIds.has(s.id) ? 'bg-primary/5' : 'hover:bg-soft-cream/30'
                        }`}
                      >
                        {modalSelectedIds.has(s.id)
                          ? <CheckSquare size={16} className="text-primary shrink-0" />
                          : <Square size={16} className="text-taupe/40 shrink-0" />}
                        <span className="font-medium text-deep-brown text-sm">{s.email}</span>
                        <span className="ml-auto text-xs text-taupe shrink-0">
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {modalFiltered.length === 0 && (
                      <div className="p-8 text-center text-taupe text-sm italic">No subscribers match your search.</div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalTab('compose')}
                      disabled={modalSelectedIds.size === 0}
                      className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-40"
                    >
                      <span>Next: Compose</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Compose tab ── */}
              {modalTab === 'compose' && (
                <form id="newsletter-form" onSubmit={handleSendNewsletter} className="p-6 space-y-5">
                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-taupe uppercase tracking-widest">Subject Line</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. New Book Release: The Whispering Woods"
                      className="w-full px-4 py-3 bg-soft-cream/30 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-taupe uppercase tracking-widest">Email Content</label>
                      <div className="flex items-center bg-soft-cream/50 rounded-lg p-0.5 border border-primary/10">
                        <button
                          type="button"
                          onClick={() => setContentType('markdown')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            contentType === 'markdown'
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-taupe hover:text-deep-brown'
                          }`}
                        >
                          Markdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setContentType('html')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            contentType === 'html'
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-taupe hover:text-deep-brown'
                          }`}
                        >
                          HTML
                        </button>
                      </div>
                    </div>
                    <textarea
                      required
                      rows={10}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder={contentType === 'html'
                        ? '<p>Write your update here…</p>'
                        : 'Write your update here…'}
                      className={`w-full px-4 py-3 bg-soft-cream/30 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium resize-none${contentType === 'html' ? ' font-mono text-sm' : ''}`}
                    />
                    {contentType === 'html' && (
                      <p className="text-xs text-taupe">
                        HTML will be embedded directly into the email body — inline styles are recommended for broad email-client compatibility.
                      </p>
                    )}
                  </div>

                  {/* Customisation row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-soft-cream/30 rounded-2xl border border-primary/5">
                    {/* Hero image */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center space-x-1.5">
                        <ImageIcon size={13} />
                        <span>Hero Image URL (optional)</span>
                      </label>
                      <input
                        type="url"
                        value={featuredImageUrl}
                        onChange={e => setFeaturedImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2.5 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                      />
                      {featuredImageUrl && (
                        <img
                          src={featuredImageUrl}
                          alt="Hero preview"
                          className="w-full h-28 object-cover rounded-xl mt-1"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* Accent colour */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center space-x-1.5">
                        <Palette size={13} />
                        <span>Header Accent Colour</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={e => setAccentColor(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <div>
                          <p className="text-sm font-bold text-deep-brown">{accentColor.toUpperCase()}</p>
                          <p className="text-xs text-taupe">Email header background</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAccentColor('#8B6F47')}
                          className="ml-auto text-xs text-taupe hover:text-primary font-medium transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                      {/* Preview swatch */}
                      <div
                        className="w-full h-10 rounded-xl flex items-center justify-center mt-1"
                        style={{ backgroundColor: accentColor }}
                      >
                        <span className="text-xs font-bold text-white/80 tracking-widest uppercase">Header Preview</span>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* ── Modal footer / send button ── */}
            <div className="p-6 border-t border-primary/5 bg-white flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-taupe font-bold hover:text-deep-brown transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="newsletter-form"
                disabled={sending || !subject || !content || modalSelectedIds.size === 0}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending
                  ? <Loader2 size={20} className="animate-spin" />
                  : <Send size={20} />}
                <span>
                  {sending
                    ? 'Sending…'
                    : `Send to ${modalSelectedIds.size} subscriber${modalSelectedIds.size !== 1 ? 's' : ''}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mailchimp-style send progress panel ── */}
      {sendProgress.phase !== 'idle' && (
        <SendProgressPanel progress={sendProgress} onClose={closeSendProgress} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Remove Subscriber"
        message="Are you sure you want to permanently remove this subscriber? They will no longer receive newsletters."
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AdminLayout>
  );
}

import { BarChart3, MousePointerClick } from 'lucide-react';
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Book, PenTool, Users, TrendingUp, Plus, ArrowRight, Loader2, ShieldAlert, XCircle, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { fetchAnalyticsStats } from "../../hooks/useAnalytics";
import { supabase } from "../../lib/supabase";
import type { NewsletterCampaign } from "../../lib/supabase";

export default function AdminDashboard() {
  const { settings } = useSiteSettings();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [recentCampaigns, setRecentCampaigns] = useState<NewsletterCampaign[]>([]);
  const [totalNewsletters, setTotalNewsletters] = useState(0);
  const navigate = useNavigate();
  const [analyticsStats, setAnalyticsStats] = useState({ pageViews: 0, bookClicks: 0, newsletterSignups: 0 });
  const authorName = settings?.author_name || "Author";

  useEffect(() => {
    const loadAnalytics = async () => {
      const stats = await fetchAnalyticsStats();
      setAnalyticsStats({
        pageViews: typeof stats.pageViews === 'number' ? stats.pageViews : (stats.pageViews ? stats.pageViews.length : 0),
        bookClicks: typeof stats.bookClicks === 'number' ? stats.bookClicks : (stats.bookClicks ? stats.bookClicks.length : 0),
        newsletterSignups: typeof stats.newsletterSignups === 'number' ? stats.newsletterSignups : (stats.newsletterSignups ? stats.newsletterSignups.length : 0)
      });
    };
    loadAnalytics();

    // Disable right-click on admin dashboard for "advanced protection"
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // Robust DevTools Detection
    const detectDevTools = () => {
      const threshold = 160;

      // 1. Check window dimensions
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      // 2. Performance check (debugger trick)
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const endTime = performance.now();
      const debuggerDetected = (endTime - startTime) > 100;

      if (widthDiff || heightDiff || debuggerDetected) {
        if (!isDevToolsOpen) {
          setIsDevToolsOpen(true);
          console.clear();
          console.log("%cSecurity Warning!", "color: red; font-size: 30px; font-weight: bold;");
          console.log("This area is protected. Unauthorized access is prohibited.");
        }
      } else {
        setIsDevToolsOpen(false);
      }
    };

    // Run check periodically
    const interval = setInterval(detectDevTools, 1000);
    window.addEventListener("resize", detectDevTools);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", detectDevTools);
      clearInterval(interval);
    };
  }, [isDevToolsOpen]);

  // Fetch newsletter campaign count + 3 most recent
  useEffect(() => {
    supabase
      .from('newsletter_campaigns')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => setTotalNewsletters(count || 0));

    supabase
      .from('newsletter_campaigns')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRecentCampaigns(data || []));
  }, []);

  const statCards = [
    { label: "Total Books", value: stats?.totalBooks || 0, icon: Book, color: "bg-blue-500" },
    { label: "Blog Posts", value: stats?.totalPosts || 0, icon: PenTool, color: "bg-emerald-500" },
    { label: "Subscribers", value: stats?.totalSubscribers || 0, icon: Users, color: "bg-purple-500" },
    { label: "Newsletters Sent", value: totalNewsletters, icon: Mail, color: "bg-orange-500" },
  ];

  if (isDevToolsOpen) {
    return (
      <div className="fixed inset-0 bg-deep-brown z-[9999] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl space-y-6 border-4 border-red-500 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 rounded-full text-red-600">
              <ShieldAlert size={64} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold text-deep-brown">Security Violation</h2>
            <p className="text-taupe font-medium">
              Developer tools have been detected. For security reasons, access to the admin dashboard is disabled while inspection tools are active.
            </p>
          </div>
          <div className="pt-4">
            <button
              onClick={() => navigate("/")}
              className="w-full py-4 bg-deep-brown text-soft-cream rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-black transition-all"
            >
              <XCircle size={20} />
              <span>Exit Dashboard</span>
            </button>
          </div>
          <p className="text-xs text-taupe/60 italic">
            Please close developer tools and refresh the page to continue.
          </p>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <AdminLayout>
        <main className="p-8 flex items-center justify-center min-h-[calc(100vh-112px)]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif font-bold text-deep-brown">Welcome back, {authorName}</h1>
              <p className="text-taupe font-medium">Here's what's happening with your platform today.</p>
            </div>
            <div className="flex space-x-4">
              <Link to="/admin/books" className="px-6 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all">
                <Plus size={20} />
                <span>New Book</span>
              </Link>
              <Link to="/admin/blog" className="px-6 py-3 bg-white border border-primary/10 text-primary rounded-xl font-bold flex items-center space-x-2 hover:bg-primary/5 transition-all">
                <Plus size={20} />
                <span>New Post</span>
              </Link>
            </div>
          </div>


          {/* Analytics Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-bold text-deep-brown flex items-center gap-2">
                <TrendingUp size={24} className="text-primary" />
                Analytics Overview
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-soft-cream/30 border border-primary/5">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><BarChart3 size={24} /></div>
                <div>
                  <p className="text-sm text-taupe font-bold uppercase tracking-widest">Page Views</p>
                  <p className="text-2xl font-bold text-deep-brown">{analyticsStats.pageViews}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-soft-cream/30 border border-primary/5">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><MousePointerClick size={24} /></div>
                <div>
                  <p className="text-sm text-taupe font-bold uppercase tracking-widest">Book Interactions</p>
                  <p className="text-2xl font-bold text-deep-brown">{analyticsStats.bookClicks}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-soft-cream/30 border border-primary/5">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Users size={24} /></div>
                <div>
                  <p className="text-sm text-taupe font-bold uppercase tracking-widest">Newsletter Conversions</p>
                  <p className="text-2xl font-bold text-deep-brown">{analyticsStats.newsletterSignups}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                      <Icon size={24} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-taupe text-sm font-bold uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-bold text-deep-brown">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Books */}
            <div className="bg-white rounded-2xl shadow-sm border border-primary/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold text-deep-brown">Recent Books</h2>
                <Link to="/admin/books" className="text-primary text-sm font-bold hover:underline flex items-center space-x-1">
                  <span>Manage All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-4">
                {stats?.recentBooks.length === 0 ? (
                  <p className="text-taupe text-sm italic py-4">No books added yet.</p>
                ) : (
                  stats?.recentBooks.map((book) => (
                    <div key={book.id} className="flex items-center space-x-4 p-3 hover:bg-soft-cream/50 rounded-xl transition-colors cursor-pointer group">
                      <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                        <img src={book.cover_image_url || `https://picsum.photos/seed/${book.id}/200/300`} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold text-deep-brown group-hover:text-primary transition-colors">{book.title}</h3>
                        <p className="text-xs text-taupe font-medium">{book.genre} &bull; {book.release_date}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Blog Posts */}
            <div className="bg-white rounded-2xl shadow-sm border border-primary/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold text-deep-brown">Recent Posts</h2>
                <Link to="/admin/blog" className="text-primary text-sm font-bold hover:underline flex items-center space-x-1">
                  <span>Manage All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-4">
                {stats?.recentPosts.length === 0 ? (
                  <p className="text-taupe text-sm italic py-4">No posts published yet.</p>
                ) : (
                  stats?.recentPosts.map((post) => (
                    <div key={post.id} className="flex items-center space-x-4 p-3 hover:bg-soft-cream/50 rounded-xl transition-colors cursor-pointer group">
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm">
                        <img src={post.featured_image_url || `https://picsum.photos/seed/${post.id}/300/200`} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold text-deep-brown group-hover:text-primary transition-colors">{post.title}</h3>
                        <p className="text-xs text-taupe font-medium">{post.published ? 'Published' : 'Draft'} &bull; {new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 ${post.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                        {post.published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Recent Newsletter Campaigns ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-bold text-deep-brown">Recent Newsletters</h2>
              <Link to="/admin/newsletters" className="text-primary text-sm font-bold hover:underline flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentCampaigns.length === 0 ? (
                <p className="text-taupe text-sm italic py-4">No newsletters sent yet.</p>
              ) : (
                recentCampaigns.map(campaign => (
                  <Link
                    key={campaign.id}
                    to="/admin/newsletters"
                    className="flex items-center gap-4 p-3 hover:bg-soft-cream/50 rounded-xl transition-colors group"
                  >
                    <div className="p-2.5 bg-primary/8 rounded-xl text-primary shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-deep-brown group-hover:text-primary transition-colors truncate">
                        {campaign.subject}
                      </h3>
                      <p className="text-xs text-taupe font-medium">
                        {new Date(campaign.sent_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {' · '}
                        {campaign.recipient_count} recipient{campaign.recipient_count !== 1 ? 's' : ''}
                        {' · '}
                        {campaign.delivered} delivered
                      </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      campaign.simulated ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {campaign.simulated ? 'Simulated' : 'Sent'}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}

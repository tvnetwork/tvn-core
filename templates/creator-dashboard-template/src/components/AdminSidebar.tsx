import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard,
  Image as ImageIcon,
  MessageCircle,
  Star, Book, PenTool, Settings, LogOut, ExternalLink, Users, X, Mail, Headphones, Video, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      navigate("/login");
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Book, label: "Manage Books", path: "/admin/books" },
    { icon: FileText, label: "Drafts", path: "/admin/drafts" },
    { icon: MessageCircle, label: "Manage Comments", path: "/admin/comments" },
    { icon: Star, label: "Manage Reviews", path: "/admin/reviews" },
    { icon: PenTool, label: "Manage Blog", path: "/admin/blog" },
    { icon: Headphones, label: "Manage Podcasts", path: "/admin/podcasts" },
    { icon: Video, label: "Manage Videos", path: "/admin/videos" },
    { icon: Users, label: "Subscribers", path: "/admin/subscribers" },
    { icon: Mail, label: "Newsletters", path: "/admin/newsletters" },
    { icon: ImageIcon, label: "Manage Media", path: "/admin/media" },
    { icon: Settings, label: "Site Settings", path: "/admin/settings" },
  ];

  const sidebarContent = (
    <aside className="w-64 bg-white flex flex-col h-full">
      {/* Mobile header row with close button */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-primary/10">
        <span className="text-xs font-bold text-taupe uppercase tracking-widest">Admin Console</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-deep-brown hover:text-primary transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-6 flex-grow overflow-y-auto">
        <h2 className="hidden lg:block text-xs font-bold text-taupe uppercase tracking-widest mb-6">Admin Console</h2>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive
                  ? "bg-primary text-soft-cream shadow-md"
                  : "text-deep-brown/60 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-primary/10 space-y-4">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center space-x-3 px-4 py-3 text-taupe hover:text-primary font-bold transition-colors"
        >
          <ExternalLink size={20} />
          <span>View Live Site</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 text-accent hover:bg-accent/5 rounded-xl font-bold transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:block border-r border-primary/10 sticky top-admin-sticky self-start h-admin-content overflow-y-auto shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 shadow-2xl">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}

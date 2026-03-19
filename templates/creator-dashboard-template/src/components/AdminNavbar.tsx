import { Link, useNavigate } from "react-router-dom";
import { Menu, ExternalLink, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { DEFAULT_SITE_NAME } from "../lib/constants";



interface AdminNavbarProps {
  onMenuClick: () => void;
}

export default function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const siteName = settings?.site_name || DEFAULT_SITE_NAME;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="bg-white border-b border-primary/10 sticky top-main-sticky z-40 h-12 flex items-center px-4 lg:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg text-deep-brown hover:text-primary hover:bg-primary/10 transition-colors mr-3 focus:outline-none"
        aria-label="Open admin menu"
      >
        <Menu size={22} />
      </button>

      {/* Branding */}
      <div className="flex items-center space-x-2">
        <LayoutDashboard size={16} className="text-primary shrink-0" />
        <span className="text-sm font-bold text-deep-brown uppercase tracking-widest">Admin Console</span>
        <span className="hidden sm:inline text-taupe/40 mx-1">—</span>
        <span className="hidden sm:inline text-sm text-taupe font-medium truncate">{siteName}</span>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center space-x-1">
        <Link
          to="/"
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-taupe hover:text-primary hover:bg-primary/5 transition-colors text-sm font-medium"
        >
          <ExternalLink size={15} />
          <span>View Site</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors text-sm font-medium"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

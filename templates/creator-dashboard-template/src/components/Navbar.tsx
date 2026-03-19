import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Book, PenTool, Home, User, Menu, X, Headphones, Video } from "lucide-react";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { DEFAULT_SITE_NAME } from '../lib/constants';

export default function Navbar() {
  const { settings } = useSiteSettings();
  const siteName = settings?.site_name || DEFAULT_SITE_NAME;
  const siteLogo = settings?.site_logo_url;
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Home", icon: <Home size={18} /> },
    { to: "/books", label: "Books", icon: <Book size={18} /> },
    { to: "/blog", label: "Blog", icon: <PenTool size={18} /> },
    { to: "/podcasts", label: "Podcasts", icon: <Headphones size={18} /> },
    { to: "/videos", label: "Videos", icon: <Video size={18} /> },
  ];

  return (
    <nav className="bg-soft-cream/80 backdrop-blur-md sticky top-0 z-50 border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-serif font-bold text-primary tracking-tight" onClick={() => setMenuOpen(false)}>
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span>{siteName}</span>
              )}
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex space-x-8">
            {navLinks.map(({ to, label, icon }) => (
              <Link key={to} to={to} className="flex items-center space-x-1 text-deep-brown hover:text-primary transition-colors font-medium">
                {icon}
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile hamburger button */}
          <button
            className="sm:hidden p-2 rounded-md text-deep-brown hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        id="mobile-nav"
        role="region"
        aria-label="Mobile navigation"
        className={`sm:hidden border-t border-primary/10 bg-soft-cream/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col space-y-1">
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center space-x-3 px-3 py-3 rounded-lg text-deep-brown hover:text-primary hover:bg-primary/10 transition-colors font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

import { Mail, Instagram, Twitter, Facebook, Linkedin, Globe } from "lucide-react";
import Newsletter from "./Newsletter";
import { useSiteSettings } from "../hooks/useSiteSettings";

export default function Footer() {
  const { settings } = useSiteSettings();

  const siteName = settings?.site_name || "Sample Creator Media";
  const tagline = settings?.tagline || "Crafting stories that resonate. Join my journey through the written word.";
  const footerText = settings?.footer_text || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  // Default social links if none are provided in settings
  const defaultSocialLinks = {
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    website: "https://your-agency.com"
  };

  // Merge settings with defaults, but only if settings have a value
  const socialLinks = { ...defaultSocialLinks };
  if (settings?.social_links) {
    Object.entries(settings.social_links).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        (socialLinks as any)[key] = value;
      }
    });
  }

  return (
    <footer className="bg-deep-brown text-soft-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <h3 className="text-xl font-serif font-bold mb-4">{siteName}</h3>
            <p className="text-soft-cream/70 max-w-xs">
              {tagline}
            </p>
          </div>
          <div>
            <h4 className="text-lg font-serif font-semibold mb-4 text-secondary">Quick Links</h4>
            <ul className="space-y-2 text-soft-cream/70">
              <li><a href="/" className="hover:text-secondary transition-colors">Home</a></li>
              <li><a href="/books" className="hover:text-secondary transition-colors">Books</a></li>
              <li><a href="/blog" className="hover:text-secondary transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-serif font-semibold mb-4 text-secondary">Connect</h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors">
                  <Twitter size={18} />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors">
                  <Instagram size={18} />
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors">
                  <Facebook size={18} />
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors">
                  <Linkedin size={18} />
                </a>
              )}
              {socialLinks.website && (
                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors">
                  <Globe size={18} />
                </a>
              )}
              {settings?.author_email && (
                <a href={`mailto:${settings.author_email}`} className="p-2 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors">
                  <Mail size={18} />
                </a>
              )}
            </div>
          </div>
          <div className="md:col-span-1">
            <Newsletter />
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-soft-cream/10 text-center text-soft-cream/50 text-sm space-y-2">
          <p>{footerText}</p>
          <p className="text-xs opacity-60">
            Built with passion by <a href="https://your-agency.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors underline underline-offset-4">Developer Agency</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

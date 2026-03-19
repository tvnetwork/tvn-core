import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Save, User, Mail, Globe, Twitter, Instagram, Facebook, Linkedin, Loader2, CheckCircle, Quote, AlertCircle } from "lucide-react";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import ImageUpload from "../../components/admin/ImageUpload";
import { DEFAULT_SITE_NAME } from '../../lib/constants';

export default function AdminSettings() {
  const { settings, loading, updateSettings } = useSiteSettings();
  const [formData, setFormData] = useState<any>({
    site_name: "",
    tagline: "",
    footer_text: "",
    site_logo_url: "",
    favicon_url: "",
    author_name: "",
    author_bio: "",
    author_email: "",
    author_profile_image_url: "",
    blog_font: "font-sans",
    social_links: {
      twitter: "",
      instagram: "",
      facebook: "",
      linkedin: "",
      website: ""
    }
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || "My Blog",
        tagline: settings.tagline || "",
        footer_text: settings.footer_text || "",
        site_logo_url: settings.site_logo_url || "",
        favicon_url: settings.favicon_url || "",
        author_name: settings.author_name || "",
        author_bio: settings.author_bio || "",
        author_email: settings.author_email || "",
        author_profile_image_url: settings.author_profile_image_url || "",
        blog_font: settings.blog_font || "font-sans",
        social_links: settings.social_links || {
          twitter: "",
          instagram: "",
          facebook: "",
          linkedin: "",
          website: ""
        }
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setShowError(null);
    const { success, error } = await updateSettings(formData);
    setSaving(false);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setShowError(error ?? 'Failed to save settings.');
      setTimeout(() => setShowError(null), 6000);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <main className="flex items-center justify-center min-h-[calc(100vh-112px)]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="p-8 bg-soft-cream/50 min-h-[calc(100vh-112px)]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif font-bold text-deep-brown">Site Settings</h1>
              <p className="text-taupe font-medium">Manage your author profile and website configuration.</p>
            </div>
            <div className="flex items-center space-x-4">
              {showSuccess && (
                <span className="flex items-center space-x-2 text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-right-4">
                  <CheckCircle size={18} />
                  <span>Settings saved successfully!</span>
                </span>
              )}
              {showError && (
                <span className="flex items-center space-x-2 text-red-600 font-bold text-sm animate-in fade-in slide-in-from-right-4">
                  <AlertCircle size={18} />
                  <span>{showError}</span>
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Site Configuration */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5 space-y-6">
              <div className="flex items-center space-x-3 border-b border-primary/5 pb-4">
                <Globe className="text-primary" size={24} />
                <h2 className="text-xl font-serif font-bold text-deep-brown">Site Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-taupe uppercase tracking-widest">Website Name</label>
                    <input
                      type="text"
                      value={formData.site_name}
                      onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                      placeholder={`e.g. ${DEFAULT_SITE_NAME}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-taupe uppercase tracking-widest">Site Tagline</label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. Stories that resonate..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-taupe uppercase tracking-widest">Footer Copyright Text</label>
                    <input
                      type="text"
                      value={formData.footer_text}
                      onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. © 2026 My Blog. All rights reserved."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUpload
                      label="Site Logo"
                      value={formData.site_logo_url}
                      onChange={(url) => setFormData({ ...formData, site_logo_url: url })}
                    />
                    <ImageUpload
                      label="Favicon"
                      value={formData.favicon_url}
                      onChange={(url) => setFormData({ ...formData, favicon_url: url })}
                    />
                  </div>
                </div>
                <div className="bg-soft-cream/20 p-6 rounded-2xl border border-primary/5">
                  <h3 className="font-bold text-deep-brown mb-2">Developer Protection</h3>
                  <p className="text-sm text-taupe mb-4">
                    This site is protected with advanced security measures. Access to the admin dashboard is restricted to authenticated users only.
                  </p>
                  <div className="flex items-center space-x-2 text-emerald-600 text-sm font-bold">
                    <CheckCircle size={16} />
                    <span>Row Level Security (RLS) Active</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-600 text-sm font-bold mt-2">
                    <CheckCircle size={16} />
                    <span>Session-based Authentication</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Author Profile */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5 space-y-6">
              <div className="flex items-center space-x-3 border-b border-primary/5 pb-4">
                <User className="text-primary" size={24} />
                <h2 className="text-xl font-serif font-bold text-deep-brown">Author Profile</h2>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                  <ImageUpload
                    label="Profile Photo"
                    value={formData.author_profile_image_url}
                    onChange={(url) => setFormData({ ...formData, author_profile_image_url: url })}
                  />
                </div>

                <div className="flex-grow space-y-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-taupe uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={formData.author_name}
                        onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-taupe uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        value={formData.author_email}
                        onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-taupe uppercase tracking-widest">Author Bio</label>
                    <textarea
                      rows={4}
                      value={formData.author_bio}
                      onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Social Links */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5 space-y-6">
              <div className="flex items-center space-x-3 border-b border-primary/5 pb-4">
                <Globe className="text-primary" size={24} />
                <h2 className="text-xl font-serif font-bold text-deep-brown">Social Media & Links</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center space-x-2">
                    <Twitter size={14} />
                    <span>Twitter / X</span>
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.twitter}
                    onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center space-x-2">
                    <Instagram size={14} />
                    <span>Instagram</span>
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.instagram}
                    onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center space-x-2">
                    <Facebook size={14} />
                    <span>Facebook</span>
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.facebook}
                    onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center space-x-2">
                    <Linkedin size={14} />
                    <span>LinkedIn</span>
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.linkedin}
                    onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center space-x-2">
                    <Globe size={14} />
                    <span>Personal Website</span>
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.website}
                    onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, website: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}

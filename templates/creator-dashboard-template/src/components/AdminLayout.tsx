import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-grow bg-soft-cream/50 min-h-[calc(100vh-112px)] overflow-x-hidden">
          {children}
        </div>
      </div>
    </>
  );
}

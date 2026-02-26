"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageSquare, 
  LayoutDashboard, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Clock,
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase-browser";

export default function Sidebar() {
  const supabase = createClient();
  const pathname = usePathname();
  const { t } = useTranslation();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    } else {
      setIsCollapsed(false);
    }
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  useEffect(() => {
    async function getCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { count } = await supabase
        .from("emails")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("processing_status", "pending")
        .not("proposed_actions", "is", null);
      setNotificationCount(count || 0);
    }
    getCount();

    const channel = supabase
      .channel('email-count-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emails' }, () => {
        getCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { icon: MessageSquare, label: "AI Sohbet", href: "/chat" },
    { icon: Bell, label: "Bildirimler", href: "/notifications", badge: notificationCount },
    { icon: LayoutDashboard, label: "Panel", href: "/dashboard" },
    { icon: FileText, label: "Dökümanlar", href: "/documents" },
    { icon: Clock, label: "Hatırlatıcılar", href: "/reminders" },
  ];

  if (!mounted) {
    return <div className="hidden md:flex w-[72px] h-screen bg-white border-r border-slate-200 flex-shrink-0" />;
  }

  const renderNavItems = (isMobile = false) => (
    <nav className={cn("flex-1 space-y-1 overflow-y-auto scrollbar-hide flex flex-col", isMobile ? "px-2" : "px-3 mt-4")}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
            pathname === item.href
              ? "bg-indigo-50 text-indigo-700 font-bold"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <item.icon className={cn(
            "w-6 h-6 flex-shrink-0 transition-colors",
            pathname === item.href ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
          )} />
          {(!isCollapsed || isMobile) && (
            <span className="text-sm truncate">
              {item.label}
            </span>
          )}

          {item.badge !== undefined && item.badge > 0 && (
            <span className={cn(
              "flex items-center justify-center bg-indigo-600 text-white text-[10px] font-black rounded-full h-5 w-5 ml-auto shadow-lg shadow-indigo-200",
              (isCollapsed && !isMobile) && "absolute top-1 right-1"
            )}>
              {item.badge}
            </span>
          )}
          
          {pathname === item.href && !isMobile && (
            <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
          )}

          {isCollapsed && !isMobile && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {item.label}
            </div>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 relative z-50 flex-shrink-0",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:shadow-md transition-all z-[60] text-slate-400 hover:text-indigo-600"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="h-20 flex items-center px-4 overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-100">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            {!isCollapsed && (
              <span className="font-black text-xl tracking-tighter text-slate-900 uppercase whitespace-nowrap">
                asist
              </span>
            )}
          </div>
        </div>

        {renderNavItems()}

        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm transition-all group relative"
            >
              <Settings size={22} className="flex-shrink-0 text-slate-400 group-hover:text-slate-600" />
              {!isCollapsed && <span className="text-sm font-bold">Ayarlar</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 sticky top-0 z-50 w-full">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 uppercase tracking-tighter">asist</span>
        </div>
        <button onClick={toggleMobileMenu} className="text-slate-500 p-2">
          {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-white pt-20 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {renderNavItems(true)}
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <Link
              href="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-700 bg-white shadow-sm border border-slate-100"
            >
              <Settings size={24} className="text-indigo-600" />
              <span className="font-bold">Ayarlar</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

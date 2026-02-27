"use client";

import React, { useEffect, useState } from "react";
import { 
  Bell, 
  Check, 
  X, 
  Clock, 
  Mail, 
  Calendar, 
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Reply
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NotificationsClient() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .eq("processing_status", "pending")
      .not("proposed_actions", "is", null)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAction = async (id: string, actionType: 'accepted' | 'ignored' | 'postponed') => {
    // Optimistic update: Remove from UI immediately
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== id));
    setActionLoading(id);

    try {
      const { error } = await supabase
        .from("emails")
        .update({ processing_status: actionType })
        .eq("id", id);

      if (error) throw error;
      
      // If accepted and action is add_calendar, trigger it
      const notification = originalNotifications.find(n => n.id === id);
      if (actionType === 'accepted' && notification?.proposed_actions?.action === 'add_calendar') {
        await fetch("/api/calendar/create", {
          method: "POST",
          body: JSON.stringify({
            title: notification.proposed_actions.title,
            startTime: notification.proposed_actions.appointmentDate,
            emailId: id
          })
        });
      }
    } catch (err) {
      console.error("Action error:", err);
      // Revert if error
      setNotifications(originalNotifications);
      alert("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setActionLoading(null);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="font-bold text-slate-500">Bildirimler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Bell className="text-indigo-600" />
            Bildirimler & Akıllı Öneriler
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Yapay zeka asistanınız gelen mailleri analiz etti ve sizin için şu aksiyonları öneriyor.
          </p>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-[#111113] rounded-[32px] border border-slate-200 dark:border-white/5 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl h-fit shrink-0">
                      <Mail className="w-6 h-6 text-indigo-600" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                          {notif.proposed_actions?.title || notif.subject}
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap ml-4">
                          {new Date(notif.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {notif.summary}
                      </p>

                      {notif.proposed_actions?.appointmentDate && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-2xl text-xs font-black shadow-sm w-fit border border-orange-100 dark:border-orange-500/20">
                          <Calendar size={14} />
                          ÖNERİLEN TARİH: {new Date(notif.proposed_actions.appointmentDate).toLocaleString('tr-TR')}
                        </div>
                      )}

                      <div className="pt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleAction(notif.id, 'accepted')}
                          disabled={actionLoading === notif.id}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 disabled:opacity-50"
                        >
                          {actionLoading === notif.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                          Kabul Et
                        </button>
                        
                        <button
                          onClick={() => handleAction(notif.id, 'postponed')}
                          disabled={actionLoading === notif.id}
                          className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                          <Clock size={18} />
                          Daha Sonra
                        </button>

                        <button
                          onClick={() => handleAction(notif.id, 'ignored')}
                          disabled={actionLoading === notif.id}
                          className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                          Yok Say
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-slate-50 dark:bg-white/5 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-white/10"
              >
                <div className="w-20 h-20 bg-white dark:bg-[#1a1a1c] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-lg">Harika! Her şey yolunda.</h3>
                <p className="text-slate-400 text-sm mt-3 italic px-12 max-w-md mx-auto">Asistanınız tüm mailleri analiz etti ve şu an bekleyen bir öneri bulunmuyor.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

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
    if (actionType === 'ignored' && confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }

    setActionLoading(id);
    try {
      // If accepted and it's a calendar action, we might want to actually trigger the calendar creation here
      // but for now, let's just update the status so the sync service or a separate worker can handle it,
      // or we can call a focused API.
      
      const { error } = await supabase
        .from("emails")
        .update({ processing_status: actionType })
        .eq("id", id);

      if (error) throw error;
      
      // If accepted and action is add_calendar, let's trigger it
      const notification = notifications.find(n => n.id === id);
      if (actionType === 'accepted' && notification?.proposed_actions?.action === 'add_calendar') {
        // Trigger calendar creation API
        await fetch("/api/calendar/create", {
          method: "POST",
          body: JSON.stringify({
            title: notification.proposed_actions.title,
            startTime: notification.proposed_actions.appointmentDate,
            emailId: id
          })
        });
      }

      setNotifications(prev => prev.filter(n => n.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoading(null);
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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Bell className="text-indigo-600" />
          Bildirimler & Akıllı Öneriler
        </h1>
        <p className="text-slate-500 mt-2">
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
                className="bg-white dark:bg-[#111113] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl h-fit shrink-0">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {notif.proposed_actions?.title || notif.subject}
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {new Date(notif.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {notif.summary}
                    </p>

                    {notif.proposed_actions?.appointmentDate && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-xl text-xs font-bold w-fit">
                        <Calendar size={14} />
                        Önerilen Tarih: {new Date(notif.proposed_actions.appointmentDate).toLocaleString('tr-TR')}
                      </div>
                    )}

                    <div className="pt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAction(notif.id, 'accepted')}
                        disabled={actionLoading === notif.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                      >
                        {actionLoading === notif.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Kabul Et
                      </button>
                      
                      <button
                        onClick={() => handleAction(notif.id, 'postponed')}
                        disabled={actionLoading === notif.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                      >
                        <Clock size={16} />
                        Daha Sonra
                      </button>

                      <button
                        onClick={() => handleAction(notif.id, 'ignored')}
                        disabled={actionLoading === notif.id}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
                          confirmDelete === notif.id 
                            ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-200 text-xs" 
                            : "bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        )}
                      >
                        {confirmDelete === notif.id ? <AlertCircle size={16} /> : <Trash2 size={16} />}
                        {confirmDelete === notif.id ? "Emin misiniz? (Tıkla)" : "Yok Say"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/10">
              <div className="w-16 h-16 bg-white dark:bg-[#1a1a1c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm">Harika! Hiç yeni bildirim yok.</h3>
              <p className="text-slate-400 text-xs mt-2 italic px-8">Asistanınız tüm mailleri analiz etti ve şu an bekleyen bir görev bulunmuyor.</p>
            </div>
          )}
        </AnimatePresence>
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

"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  ChevronRight,
  Bell
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RemindersClient() {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<any[]>([]);
  const supabase = createClient();

  const fetchReminders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("reminder_at", { ascending: true });

    setReminders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (!error) {
      setReminders(prev => prev.filter(r => r.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="font-bold text-slate-500">Hatırlatıcılar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Clock className="text-indigo-600" />
            Hatırlatıcılar & Görevler
          </h1>
          <p className="text-slate-500 mt-2">
            Planlanmış tüm randevularınız ve asistanınızın sizin için oluşturduğu görevler.
          </p>
        </div>
        <div className="hidden md:block">
           <Link href="/notifications" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">
            <Bell size={14} />
            Yeni Önerileri Gör
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {reminders.length > 0 ? (
            reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#111113] rounded-3xl border border-slate-200 dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-all group flex items-center gap-6"
              >
                <div className={cn(
                  "p-4 rounded-2xl shrink-0",
                  new Date(reminder.reminder_at) < new Date() ? "bg-slate-100 text-slate-400" : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                )}>
                  <Calendar size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {reminder.title}
                    </h3>
                    {reminder.priority === 'high' && (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black rounded uppercase">Önemli</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Clock size={12} />
                      {new Date(reminder.reminder_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  {reminder.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 italic">
                      {reminder.description}
                    </p>
                  )}
                </div>

                <button 
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/10">
              <div className="w-16 h-16 bg-white dark:bg-[#1a1a1c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <Clock className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm italic">Henüz bir hatırlatıcı yok.</h3>
              <p className="text-slate-400 text-xs mt-3 px-8 max-w-sm mx-auto">
                Maillerinizden gelen randevuları <strong>Bildirimler</strong> sayfasından onaylayarak buraya ekleyebilirsiniz.
              </p>
              <Link href="/notifications" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                Önerileri Kontrol Et
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


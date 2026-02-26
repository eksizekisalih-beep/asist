"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  FileText, 
  Bell, 
  Mail, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  Loader2,
  CalendarDays
} from "lucide-react";
import { motion } from "framer-motion";

export default function Overview() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    async function triggerSync() {
      setSyncing(true);
      try {
        await fetch("/api/sync");
        // Re-fetch dashboard after sync to show new results
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        setSyncing(false);
      }
    }

    fetchDashboard();
    triggerSync();
  }, []);

  const stats = [
    { label: t("dashboard.total_documents"), value: data?.stats?.documents || "0", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t("dashboard.upcoming_reminders"), value: data?.stats?.reminders || "0", icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: t("dashboard.recent_emails"), value: data?.stats?.emails || "0", icon: Mail, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="font-bold text-slate-500">Verileriniz Google'dan alınıyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("dashboard.overview")}</h1>
          <p className="text-slate-500 mt-1">Hoş geldiniz. İşte hesabınızdaki güncel durum.</p>
        </div>
        {syncing && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">Otomatik Analiz Yapılıyor...</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-white dark:bg-[#111113] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent Google Calendar Events */}
        <section className="bg-white dark:bg-[#111113] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              Takvim Etkinlikleri
            </h2>
          </div>
          <div className="space-y-4">
            {data?.events?.length > 0 ? (
              data.events.map((event: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                  <div className="p-3 bg-orange-500/10 rounded-xl h-fit">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{event.summary}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(event.start.dateTime || event.start.date).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 p-4 text-center italic">Yakın zamanda planlanmış etkinlik yok.</p>
            )}
          </div>
        </section>

        {/* Recent Analyzed Gmail Messages */}
        <section className="bg-white dark:bg-[#111113] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-500" />
              Analiz Edilen E-postalar
            </h2>
            {data?.emails?.length > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-bold">AI KONTROLÜNDER</span>}
          </div>
          <div className="space-y-4">
            {data?.emails?.length > 0 ? (
              data.emails.map((email: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-sm truncate">{email.subject}</h4>
                      <p className="text-[10px] text-indigo-500 font-bold truncate lowercase">{email.sender}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{email.summary}</p>
                      {email.proposed_actions?.action === "add_calendar" && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full mt-2 font-bold uppercase">
                          <Clock size={10} /> Takvime Eklendi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 p-4 text-center italic">Henüz analiz edilmiş önemli bir mail yok.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

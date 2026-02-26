"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FileText, Search, Plus, Filter, Loader2, Download, Trash2, ExternalLink, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";

export default function DocumentsClient() {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDocs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setDocs(data || []);
      setLoading(false);
    }
    fetchDocs();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="font-bold text-slate-500">Dökümanlar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <FileText className="text-indigo-600" />
            Dökümanlarım
          </h1>
          <p className="text-slate-500 mt-2">
            Analiz edilen faturalar, fişler ve diğer tüm belgeleriniz.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all w-fit">
          <Plus size={18} />
          Yeni Yükle
        </button>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#111113] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Dökümanlarda ara..." 
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200"
        />
        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {docs.length > 0 ? (
            docs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#111113] rounded-[32px] border border-slate-200 dark:border-white/5 p-6 shadow-sm hover:shadow-indigo-100 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600">
                    <FileText size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Download size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 dark:text-white truncate mb-1">{doc.title}</h3>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">
                  <span>{new Date(doc.created_at).toLocaleDateString('tr-TR')}</span>
                  <span>•</span>
                  <span className="text-indigo-500">{doc.amount} {doc.currency}</span>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                  <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:gap-3 transition-all">
                    Detayları Görüntüle
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/10">
               <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm">Hiç döküman bulunamadı.</h3>
               <p className="text-slate-400 text-xs mt-2 px-8">Henüz bir fatura veya belge analiz etmediniz.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


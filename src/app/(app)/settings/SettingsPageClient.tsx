"use client";

import React, { useState } from "react";
import { 
  Puzzle, 
  Settings2, 
  CalendarDays,
  Mail,
  HardDrive,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Database,
  Cpu,
  Save,
  Loader2,
  Key
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SettingsPageClient() {
  const [activeTab, setActiveTab] = useState("integrations");
  
  // AI Settings State
  const [apiKey, setApiKey] = useState("");
  const [aiProvider, setAiProvider] = useState("google");
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);
  
  // Integration States
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const searchParams = useSearchParams();

  const supabase = createClient();

  React.useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ai_api_key, ai_provider, use_own_api_key, google_access_token')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          if (profile.ai_api_key) setApiKey(profile.ai_api_key);
          if (profile.ai_provider) setAiProvider(profile.ai_provider);
          if (profile.use_own_api_key) setUseOwnKey(profile.use_own_api_key);
          if (profile.google_access_token) setIsGoogleConnected(true);
        }
      }
    }
    loadProfile();

    // Handle Success Callbacks from OAuth
    const success = searchParams.get("success");
    if (success === "GoogleConnected") {
      setIsGoogleConnected(true);
      setMessage({ type: "success", text: "Google hesabınız başarıyla bağlandı!" });
      setTimeout(() => setMessage(null), 5000);
      // Clean up the URL without refreshing
      window.history.replaceState({}, "", "/settings");
    }
  }, [supabase, searchParams]);

  const saveAiSettings = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "Lütfen geçerli bir API anahtarı girin." });
      return;
    }
    setLoadingAi(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      const { error } = await supabase
        .from('profiles')
        .update({ 
          ai_api_key: apiKey,
          ai_provider: aiProvider,
          use_own_api_key: true
        })
        .eq('id', user.id);

      if (error) throw error;
      setUseOwnKey(true);
      setMessage({ type: "success", text: "Yapay zeka ayarlarınız başarıyla kaydedildi!" });
    } catch (err: any) {
      setMessage({ type: "error", text: "Hata: " + err.message });
    } finally {
      setLoadingAi(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const integrations = [
    {
      id: "google-calendar",
      title: "Google Takvim",
      description: "Asistanın programınızı okuması ve yeni randevular oluşturması için takviminizi bağlayın.",
      icon: CalendarDays,
      status: isGoogleConnected ? "connected" : "disconnected",
      color: "bg-orange-500",
      action: () => window.location.href = "/api/auth/google"
    },
    {
      id: "gmail",
      title: "Gmail",
      description: "Asistanın maillerinizi özetlemesi, önemli olanları size bildirmesi için mail hesabınızı bağlayın.",
      icon: Mail,
      status: isGoogleConnected ? "connected" : "disconnected",
      color: "bg-red-500",
      action: () => window.location.href = "/api/auth/google"
    },
    {
      id: "gdrive",
      title: "Google Drive (Yakında)",
      description: "Belgelerinizi, notlarınızı ve fotoğraflarınızı analiz etmesi için bulut deponuzu bağlayın.",
      icon: HardDrive,
      status: "coming_soon",
      color: "bg-blue-500"
    },
    {
      id: "notion",
      title: "Notion (Yakında)",
      description: "Asistanınıza doğrudan Notion veritabanlarınızı okuma ve düzenleme yetkisi verin.",
      icon: Database, 
      status: "coming_soon",
      color: "bg-slate-800"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Settings2 className="text-indigo-600" />
          Ayarlar & Entegrasyonlar
        </h1>
        <p className="mt-2 text-slate-500 font-medium">
          Asistanınızı yeteneklerini genişletin ve size özel hale getirin.
        </p>
      </div>

      <div className="flex gap-8">
        
        {/* Sidebar Menu */}
        <div className="w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab("integrations")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === "integrations" 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Puzzle size={20} />
            Entegrasyonlar
          </button>
          
          <button 
            onClick={() => setActiveTab("ai_settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === "ai_settings" 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Cpu size={20} />
            Yapay Zeka (BYOK)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {message && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
                 message.type === 'success' 
                   ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                   : 'bg-rose-50 border-rose-100 text-rose-700'
               }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <Settings2 size={18} />}
              <span className="font-bold text-sm">{message.text}</span>
            </motion.div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-xl font-black flex items-center gap-2 mb-2">
                    <Sparkles className="text-indigo-200" />
                    Süper Güçlerinizi Aktive Edin
                  </h2>
                  <p className="text-indigo-100 font-medium max-w-md">
                    Bağladığınız her yeni uygulama, asistanınızın sizin adınıza yapabileceği işlerin sınırlarını genişletir. Verileriniz şifrelenir ve tamamen sizin kontrolünüzdedir.
                  </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((item) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ y: -2 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col hover:border-indigo-300 transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg ${item.color}`}>
                        <item.icon size={24} />
                      </div>
                      
                      {item.status === "connected" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                          <CheckCircle2 size={14} /> Bağlı
                        </span>
                      )}
                      
                      {item.status === "coming_soon" && (
                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          YAKINDA
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1 mb-6 flex-1">
                      {item.description}
                    </p>

                    {item.status === "disconnected" && (
                      <button 
                         onClick={item.action}
                         className="w-full py-2.5 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        Bağla <ArrowRight size={16} />
                      </button>
                    )}

                    {item.status === "connected" && (
                      <button 
                         className="w-full py-2.5 rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Bağlantı Kuruldu
                      </button>
                    )}

                    {item.status === "coming_soon" && (
                      <button disabled className="w-full py-2.5 rounded-xl bg-slate-50 cursor-not-allowed text-slate-400 font-bold text-sm">
                        Geçici Olarak Kapalı
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ai_settings" && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-xl font-black flex items-center gap-2 mb-2">
                    <Key className="text-indigo-400" />
                    Kendi Anahtarını Getir (BYOK)
                  </h2>
                  <p className="text-slate-400 font-medium max-w-xl">
                    Sistem maliyetlerini düşürmek ve tamamen kendinize ait, limitsiz bir asistan kullanmak için kendi ücretsiz <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google Gemini API</a> anahtarınızı buraya tanımlayabilirsiniz. Anahtarınız güvenlik şifrelemesi ile veritabanına kaydedilir.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                  <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg bg-slate-900`}>
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Yapay Zeka Yapılandırması</h3>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Erişim için kendi API anahtarınızı (API Key) kullanmanız gerekmektedir.</p>
                  </div>
                </div>

                <div className={`space-y-4`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sağlayıcı</label>
                      <select 
                        value={aiProvider}
                        onChange={(e) => setAiProvider(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 appearance-none"
                      >
                        <option value="google">Google Gemini (Tavsiye Edilen)</option>
                        <option value="openai">OpenAI (Yakında)</option>
                        <option value="anthropic">Anthropic (Yakında)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Gemini API Key (Zorunlu)</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          type="password" 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2 font-medium">Anahtarınız veritabanınızda güvenli bir şekilde şifrelenmiş olarak saklanır.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                  <button 
                    onClick={saveAiSettings}
                    disabled={loadingAi}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                  >
                    {loadingAi ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                    Ayarları Kaydet
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

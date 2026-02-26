"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Camera, Mic, User, Bot, Sparkles, Loader2, X, Image as ImageIcon, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase-browser";

import { analyzeDocument, chatWithAI } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import "@/translations/i18n";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatContainer() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userAiKey, setUserAiKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function getUserSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ai_api_key')
          .eq('id', user.id)
          .single();
        
        if (profile?.ai_api_key) {
          setUserAiKey(profile.ai_api_key);
        }
      }
    }
    getUserSettings();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const messageIdBase = Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const userMessage: Message = {
      id: `user-${messageIdBase}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      if (currentImage) {
        const prompt = currentInput || "Analyze this document and extract key details like amount, date, and items.";
        const aiResponseText = await analyzeDocument(currentImage, prompt, userAiKey || undefined);
        
        setMessages((prev) => [...prev, {
          id: `ai-${messageIdBase}`,
          role: "assistant",
          content: aiResponseText,
          timestamp: new Date(),
        }]);
      } else {
        let systemContext = "";
        const now = new Date().toISOString();
        
        systemContext = `[SİSTEM YETKİSİ: Sen kullanıcının Google (Gmail ve Takvim) hesaplarına bağlısın. Sana sağlanan veriler GERÇEK verilerdir. "Erişimim yok" deme. Kullanıcı maillerini sorduğunda veya takvimiyle ilgili bilgi istediğinde bu bilgileri kullan.]\n\n[Şu anki gerçek zaman: ${now}]. Eğer kullanıcı yeni bir hatırlatıcı/görev eklemeni isterse onay ver ve mesajın EKLEMEYECEĞİN EN ALTINA şunu koy: [[ADD_REMINDER|Başlık|ISO_TARİH]]. Örn: [[ADD_REMINDER|Toplantı|2026-02-27T09:00:00]]\n\n`;

        const lowerInput = currentInput.toLowerCase();
        const triggers = ["fatura", "ödeme", "harcama", "borç", "ekstre", "invoice", "receipt"];
        const taskTriggers = ["hatırlat", "görev", "takvim", "neler", "ne var", "ekle", "not al", "mail", "eposta", "e-posta", "ajanda", "randevu"];
        
        const supabase = createClient();

        if (triggers.some(t => lowerInput.includes(t)) || taskTriggers.some(t => lowerInput.includes(t))) {
          // 1. Fetch Real Documents/Invoices from DB
          const { data: docs } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .order('created_at', { ascending: false });

          if (docs && docs.length > 0) {
            const docText = docs.map((d: any) => `- ${d.title}: ${d.amount} ${d.currency} (Tarih: ${new Date(d.created_at).toLocaleDateString()})`).join("\n");
            systemContext += `[GERÇEK VERİ - BELGELER: Kullanıcının sistemdeki gerçek belgeleri:\n${docText}]\n\n`;
          }

          // 2. Fetch Real Analyzed Emails from DB
          const { data: emails } = await supabase
            .from('emails')
            .select('*')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (emails && emails.length > 0) {
            const emailText = emails.map((e: any) => `- ${e.subject} (Gönderen: ${e.sender}, Özet: ${e.summary})`).join("\n");
            systemContext += `[GERÇEK VERİ - ANALİZ EDİLEN MAİLLER: Kullanıcının gerçek e-postaları:\n${emailText}]\n\n`;
          }

          // 3. Fetch Reminders
          const { data: reminders } = await supabase
            .from('reminders')
            .select('*')
            .eq('is_sent', false)
            .order('reminder_at', { ascending: true })
            .limit(10);
            
          if (reminders && reminders.length > 0) {
            const reminderText = reminders.map((r: any) => `- ${r.title} (Tarih: ${new Date(r.reminder_at).toLocaleString('tr-TR')})`).join("\n");
            systemContext += `[GERÇEK VERİ - HATIRLATICILAR: Kullanıcının takvimi:\n${reminderText}]\n\n`;
          }

          if ((!docs || docs.length === 0) && (!emails || emails.length === 0) && (!reminders || reminders.length === 0)) {
            systemContext += `[SİSTEM UYARISI: Kullanıcının veritabanında şu an HİÇBİR fatura, e-posta veya randevu bulunmamaktadır. Lütfen kullanıcıya verisi olmadığını açıkça söyle ve ASLA uydurma fatura/isim (Turkcell vb.) üretme. Sadece gerçek verileri konuş.]\n\n`;
          }
        }

        const history = messages.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));
        
        setMessages((prev) => [...prev, {
          id: `ai-${messageIdBase}`,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        }]);

        setIsLoading(false);
        const finalPrompt = systemContext + currentInput;
        
        const fullResponse = await chatWithAI(history, finalPrompt, (chunk) => {
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === `ai-${messageIdBase}` 
                ? { ...msg, content: chunk.replace(/\[\[ADD_REMINDER\|.*?\|.*?\]\]/g, "") }
                : msg
            )
          );
        }, userAiKey || undefined);

        if (fullResponse) {
           const matchRegex = /\[\[ADD_REMINDER\|(.*?)\|(.*?)\]\]/g;
           let matches = [...fullResponse.matchAll(matchRegex)];
           if (matches.length > 0) {
               const supabase = createClient();
               const { data: { user } } = await supabase.auth.getUser();
               if (user) {
                   for (const match of matches) {
                       const title = match[1];
                       const date = match[2];
                       try {
                         await supabase.from('reminders').insert({
                             user_id: user.id,
                             title: title,
                             reminder_at: new Date(date).toISOString(),
                         });
                         
                         fetch("/api/calendar", {
                           method: "POST",
                           body: JSON.stringify({ title, date: new Date(date).toISOString() })
                         }).catch(e => console.error("Google Sync Failed", e));

                         console.log("Reminder added & synced:", title, date);
                       } catch (e) {
                         console.error("Action error", e);
                       }
                   }
               }
           }
        }
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, {
        id: `err-${messageIdBase}`,
        role: "assistant",
        content: "Hata: " + (error.message || "Mesaj işlenemedi."),
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-slate-100 relative">
      {/* Header - Transparent & Integrated */}
      <header className="flex items-center justify-between p-6 px-8 bg-transparent md:bg-white/50 dark:md:bg-[#050505]/50 backdrop-blur-sm z-10 lg:hidden">
        <div className="flex items-center gap-3">
          <Sparkles className="text-indigo-600 w-6 h-6" />
          <h1 className="font-black text-xl tracking-tighter uppercase">asist</h1>
        </div>
      </header>

      {/* Main Chat Stream */}
      <div className="flex-1 overflow-y-auto pt-8 pb-32 scrollbar-none scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-8">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                key="welcome-screen"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 shadow-2xl shadow-indigo-500/40 flex items-center justify-center mb-4">
                  <Sparkles className="text-white w-10 h-10 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2">Merhaba! Ben asist.</h2>
                  <p className="max-w-md text-slate-500 font-medium">Size nasıl yardımcı olabilirim? Bir fatura yükleyebilir, finansal sorularınızı sorabilir veya gününüzü planlamamı isteyebilirsiniz.</p>
                </div>
                
                {/* Quick Action Chips */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {["Son faturalarım?", "Bu ay ne kadar harcadım?", "Çalışma planı oluştur"].map((suggestion) => (
                    <button 
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-5 py-2.5 rounded-2xl bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/5 text-sm font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-4 max-w-[90%] md:max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                    msg.role === "user" ? "bg-indigo-600" : "bg-white dark:bg-[#111113]"
                  }`}>
                    {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-500" />}
                  </div>
                  <div className={`p-5 rounded-3xl ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-500/20"
                      : "bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/5 rounded-tl-none shadow-sm"
                  }`}>
                    <p className="text-[16px] leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-[10px] block mt-3 font-bold opacity-40 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div key="loading-indicator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start ml-14">
                <div className="flex gap-2 items-center bg-white/50 dark:bg-white/5 px-4 py-2 rounded-2xl border border-slate-100 dark:border-white/5">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-xs font-bold text-slate-400 tracking-wider">AIST DÜŞÜNÜYOR...</span>
                </div>
              </motion.div>
            )}
            
            {/* Scroll Anchor */}
            <div ref={messagesEndRef} className="h-4" />
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Input Area (ChatGpt Style) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-slate-50 dark:from-[#050505] via-slate-50/80 dark:via-[#050505]/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          {selectedImage && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4 relative inline-block">
              <img src={selectedImage} alt="Selected" className="w-24 h-24 object-cover rounded-[1.5rem] border-4 border-indigo-500 shadow-2xl" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-xl hover:bg-rose-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          <div className="relative bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-indigo-500/5 transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 active:scale-[0.99] duration-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Asistanınıza bir mesaj yazın..."
              className="w-full bg-transparent p-5 pr-40 outline-none resize-none min-h-[70px] max-h-48 text-[16px] font-medium"
              rows={1}
            />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageSelect}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl transition-all"
                title="Dosya Yükle"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl transition-all lg:flex hidden" title="Sesli Komut">
                <Mic className="w-6 h-6" />
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={cn(
                  "p-3.5 rounded-2xl transition-all duration-300",
                  input.trim() || selectedImage
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 scale-100 hover:scale-105 active:scale-95"
                    : "bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600"
                )}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-4 font-bold tracking-widest uppercase opacity-50">
            asist professional AI intelligence
          </p>
        </div>
      </div>
    </div>
  );
}

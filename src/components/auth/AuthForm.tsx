"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) throw error;
        window.location.href = "/chat";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: email.split("@")[0],
            },
          },
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email for confirmation!" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email first." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password reset link sent to your email!" });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/20 mb-6">
          <Sparkles className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">asist</h1>
        <p className="text-slate-500 mt-2">
          {isLogin ? "Welcome back. I've missed you." : "Start your professional journey today."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            {isLogin && (
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        {isLogin && (
          <div className="flex items-center gap-2 ml-1">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              defaultChecked 
            />
            <label htmlFor="remember" className="text-sm text-slate-500 font-medium">
              Remember me
            </label>
          </div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-sm font-medium ${
              message.type === "success" 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-rose-50 text-rose-600 border border-rose-100"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isLogin ? "Sign In" : "Sign Up"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Trusted by professionals</p>
        <div className="flex justify-center gap-6 opacity-30 grayscale">
          {/* Simple logo placeholders */}
          <div className="font-black italic text-lg tracking-tighter">GLOBAL</div>
          <div className="font-black italic text-lg tracking-tighter">SECURE</div>
          <div className="font-black italic text-lg tracking-tighter">FAST</div>
        </div>
      </div>
    </div>
  );
}

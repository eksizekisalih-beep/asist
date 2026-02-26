"use client";

import React from "react";
import Sidebar from "./Sidebar";
import "@/translations/i18n";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#050505] overflow-hidden text-slate-900 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}

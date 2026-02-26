import React, { Suspense } from "react";
import SettingsPageClient from "@/app/(app)/settings/SettingsPageClient";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<div className="p-10 font-bold">Yükleniyor...</div>}>
        <SettingsPageClient />
      </Suspense>
    </div>
  );
}

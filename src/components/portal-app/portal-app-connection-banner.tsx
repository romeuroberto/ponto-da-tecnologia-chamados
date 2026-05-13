"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function PortalAppConnectionBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const syncStatus = () => setIsOffline(!navigator.onLine);

    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);

    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="mx-auto mt-3 w-full max-w-md px-4">
      <div className="flex items-center gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
        <WifiOff className="h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Sem conexão no momento</p>
          <p className="text-xs text-amber-800">Algumas ações podem falhar até a internet voltar.</p>
        </div>
      </div>
    </div>
  );
}

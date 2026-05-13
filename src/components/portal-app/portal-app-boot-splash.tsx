"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "portal-app-boot-seen";

export function PortalAppBootSplash() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const alreadySeen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    setMounted(true);

    if (alreadySeen) {
      return;
    }

    setVisible(true);
    window.sessionStorage.setItem(SEEN_KEY, "1");

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 850);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div className="portal-app-boot-splash fixed inset-0 z-[70] flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#1d4ed8_100%)] px-6 text-white">
      <div className="flex w-full max-w-xs flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl shadow-slate-950/20 backdrop-blur">
          <div className="text-center">
            <p className="text-xl font-bold tracking-[0.24em]">PDT</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Portal</p>
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-sky-100">Portal do Cliente</p>
        <p className="mt-2 text-sm text-slate-200">Abrindo sua área de chamados, financeiro e documentos.</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "portal-app-install-dismissed";

function isIos() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PortalAppInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISSED_KEY) === "1";
    const standalone = isStandaloneMode();
    const ios = isIos();

    setIsDismissed(dismissed);
    setIsInstalled(standalone);
    setIsIosDevice(ios);

    if (standalone) {
      document.body.classList.add("portal-app-standalone");
    } else {
      document.body.classList.remove("portal-app-standalone");
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      document.body.classList.add("portal-app-standalone");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  function dismissBanner() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setIsDismissed(true);
  }

  if (isInstalled || isDismissed) {
    return null;
  }

  if (!installPrompt && !isIosDevice) {
    return null;
  }

  return (
    <div className="mx-auto mt-3 w-full max-w-md px-4">
      <div className="rounded-[1.6rem] border border-sky-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Instale o portal no celular</p>
              {installPrompt ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Abra o portal como app, com acesso mais rápido e menos interface do navegador.
                </p>
              ) : (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  No iPhone, toque em <span className="font-semibold">Compartilhar</span> <Share className="mx-1 inline h-3.5 w-3.5 align-[-2px]" /> e depois em{" "}
                  <span className="font-semibold">Adicionar à Tela de Início</span>.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={dismissBanner}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar aviso de instalação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {installPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Download className="h-4 w-4" />
            Instalar app
          </button>
        ) : null}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

export function usePWAInstall() {
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [iosTip, setIosTip] = useState(false);

  useEffect(() => {
    const inStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      // @ts-expect-error iOS Safari non standard
      !!window.navigator.standalone;
    setIsStandalone(!!inStandalone);
  }, []);

  useEffect(() => {
    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); setIosTip(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS = /iP(hone|od|ad)/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIOS && isSafari && !isStandalone) setIosTip(false);
  }, [isStandalone]);

  const canInstall = !installed && !isStandalone && (!!deferred || (!isStandalone && !deferred));
  const promptInstall = async () => {
    const ua = navigator.userAgent || "";
    const isIOS = /iP(hone|od|ad)/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIOS && isSafari && !deferred) { setIosTip(true); return; }
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };
  const closeIosTip = () => setIosTip(false);
  return { canInstall, promptInstall, iosTip, closeIosTip };
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/profile/ProfileHeader";
import Tabs from "@/components/profile/Tabs";
import InfosTab from "@/components/profile/tabs/InfosTab";
import StatsTab from "@/components/profile/tabs/StatsTab";
import PrefsTab from "@/components/profile/tabs/PrefsTab";
import SecurityTab from "@/components/profile/tabs/SecurityTab";

export default function ProfilPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<"infos"|"stats"|"prefs"|"security">("infos");

  // Attendre la session avant de fetch /api/users
  useEffect(() => {
    let alive = true;
    if (status !== "authenticated") return;
    (async () => {
      const res = await fetch("/api/users", { credentials: "include", cache: "no-store" });
      if (!alive) return;
      if (res.status === 401) {
        router.push("/auth/signin?callbackUrl=/profil&alert=auth");
        return;
      }
      const data = await res.json().catch(() => null);
      if (alive) setMe(data);
    })();
    return () => { alive = false; };
  }, [status, router]);

  const handleProfilSaved = useCallback((profil:any) => {
    setMe((prev:any)=> ({ ...prev, profil }));
  }, []);

  const handlePrefsSaved = useCallback((preferences:any) => {
    setMe((prev:any)=> ({ ...prev, preferences }));
  }, []);

  if (status === "loading") return <div className="p-4">Chargement de la session…</div>;
  if (status !== "authenticated") return <div className="p-4">Redirection…</div>;
  if (!me) return <div className="p-4">Chargement…</div>;

  const isAdmin = session?.user?.role === "ADMIN";
  const tabs = [
    { key: "infos" as const, label: "Informations" },
    { key: "stats" as const, label: "Statistiques" },
    { key: "prefs" as const, label: "Préférences" },
    { key: "security" as const, label: "Sécurité" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Mon Profil</h1>
      <p className="text-sm text-neutral-500 mb-4">Gérez vos informations personnelles et préférences</p>

      <ProfileHeader user={me} isAdmin={isAdmin} />

      <Tabs tabs={tabs} active={tab} onChange={(key: string) => setTab(key as "infos" | "stats" | "prefs" | "security")} />

      <div className="mt-4">
        {tab === "infos" && <InfosTab user={me} onSaved={handleProfilSaved} />}
        {tab === "stats" && <StatsTab />}
        {tab === "prefs" && <PrefsTab me={me} />}
        {tab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}

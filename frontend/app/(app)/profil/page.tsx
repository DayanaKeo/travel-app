"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import Tabs from "@/components/profile/Tabs";
import InfosTab from "@/components/profile/tabs/InfosTab";
import StatsTab from "@/components/profile/tabs/StatsTab";
import PrefsTab from "@/components/profile/tabs/PrefsTab";
import SecurityTab from "@/components/profile/tabs/SecurityTab";

export default function ProfilPage() {
  const { data: session } = useSession();
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<"infos"|"stats"|"prefs"|"security">("infos");

  useEffect(() => {
    let alive = true;
    fetch("/api/users").then(r=>r.json()).then((data)=>{ if (alive) setMe(data); });
    return () => { alive = false; };
  }, []);

  const handleProfilSaved = useCallback((profil:any) => {
    setMe((prev:any)=> ({ ...prev, profil }));
  }, []);

  const handlePrefsSaved = useCallback((preferences:any) => {
    setMe((prev:any)=> ({ ...prev, preferences }));
  }, []);

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

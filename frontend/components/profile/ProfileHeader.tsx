"use client";
import { useUserStats } from "@/hooks/useUserStats";
import { formatFR } from "@/lib/time";


export default function ProfileHeader({ user, isAdmin }: { user:any; isAdmin:boolean }) {
  const stats = useUserStats();
  const updated = user?.updatedAt ? formatFR(user.updatedAt) : null;

  return (
    
    <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex flex-col md:flex-row items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 grid place-items-center text-white text-2xl">
        {user?.profil?.avatarUrl ? (
          <img src={user.profil.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
        ) : "👤"}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl md:text-2xl font-semibold">
            {user?.profil?.nomComplet ?? user?.email ?? "Utilisateur"}
          </h2>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Actif</span>
          {isAdmin && (
            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
              Administrateur
            </span>
          )}
        </div>

        <p className="text-neutral-500 text-sm">
          {user?.profil?.biographie ?? "Voyageur·se."}
        </p>

        {stats && (
          <div className="mt-2 flex gap-6 text-sm">
            <div><span className="font-semibold">{stats.voyages}</span> Voyages</div>
            <div><span className="font-semibold">{stats.pays}</span> Pays</div>
            <div><span className="font-semibold">{stats.photos}</span> Photos</div>
          </div>
        )}
        {updated && (
          <p className="text-xs text-neutral-500 mt-2">
            Dernière mise à jour : {updated} (heure France)
          </p>
        )}
      </div>

      <button className="self-start md:self-auto rounded-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm hover:opacity-90">
        ✏️ Modifier
      </button>
    </div>
  );
}

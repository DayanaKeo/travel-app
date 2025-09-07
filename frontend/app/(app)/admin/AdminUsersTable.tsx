"use client";
import { useEffect, useState } from "react";

type Row = {
  id: number;
  email: string | null;
  name: string | null;
  role: "USER"|"ADMIN";
  premium: boolean;
  createdAt: string;
  updatedAt: string;
  profil?: { nomComplet?: string|null; avatarUrl?: string|null } | null;
};

export default function AdminUsersTable() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total:number; page:number; pageSize:number; items:Row[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${page}&pageSize=20`, { cache: "no-store" });
    const j = await r.json();
    setData(j);
    setBusy(false);
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [page]);

  async function patch(id:number, body:any) {
    const r = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type":"application/json" }, body: JSON.stringify(body) });
    if (!r.ok) alert("Action refusée");
    await load();
  }

  async function del(id:number) {
    if (!confirm(`Supprimer (soft) l'utilisateur #${id} ?`)) return;
    const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!r.ok) alert("Suppression refusée");
    await load();
  }

  return (
    <section className="rounded-2xl bg-white shadow-sm p-4 grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium">Utilisateurs</div>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher (email, nom)" className="border rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={()=>{ setPage(1); load(); }} className="px-3 py-1.5 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50" disabled={busy}>
            {busy ? "Recherche…" : "Chercher"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-2">ID</th>
              <th className="py-2">Utilisateur</th>
              <th className="py-2">Rôle</th>
              <th className="py-2">Premium</th>
              <th className="py-2">Créé</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map(u=>(
              <tr key={u.id} className="border-t">
                <td className="py-2">{u.id}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <img src={u.profil?.avatarUrl || "/avatar-placeholder.png"} alt="" className="w-7 h-7 rounded-full object-cover" />
                    <div className="grid">
                      <span className="text-neutral-800">{u.profil?.nomComplet || u.name || u.email || "—"}</span>
                      <span className="text-xs text-neutral-500">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.premium ? "Oui" : "Non"}</td>
                <td className="py-2">{new Intl.DateTimeFormat("fr-FR",{ dateStyle:"medium" }).format(new Date(u.createdAt))}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded border hover:bg-neutral-50" onClick={()=>patch(u.id, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })}>
                      {u.role === "ADMIN" ? "Rendre USER" : "Promouvoir ADMIN"}
                    </button>
                    <button className="px-2 py-1 rounded border hover:bg-neutral-50" onClick={()=>patch(u.id, { premium: !u.premium })}>
                      {u.premium ? "Retirer Premium" : "Donner Premium"}
                    </button>
                    <button className="px-2 py-1 rounded border hover:bg-neutral-50 text-red-600" onClick={()=>del(u.id)}>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!data || data.items.length===0) && (
              <tr><td colSpan={6} className="py-6 text-center text-neutral-500">Aucun résultat</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-neutral-500">
          {data ? `Page ${data.page} / ${Math.ceil(data.total / data.pageSize) || 1} — ${data.total} utilisateurs` : "—"}
        </span>
        <button className="px-3 py-1.5 text-sm rounded-lg border hover:bg-neutral-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Préc.</button>
        <button className="px-3 py-1.5 text-sm rounded-lg border hover:bg-neutral-50" disabled={!!data && page >= Math.ceil(data.total / data.pageSize)} onClick={()=>setPage(p=>p+1)}>Suiv.</button>
      </div>
    </section>
  );
}

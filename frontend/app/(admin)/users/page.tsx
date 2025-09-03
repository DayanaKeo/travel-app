"use client";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const load = () => fetch("/api/users/list").then(r=>r.json()).then(setUsers);
  useEffect(() => {
    load();
  }, []);

  async function patch(id:number, data:any) {
    const r = await fetch(`/api/users/${id}`, {
      method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(data)
    });
    if (!r.ok) return alert("Erreur");
    load();
  }
  async function del(id:number) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const r = await fetch(`/api/users/${id}`, { method:"DELETE" });
    if (!r.ok) return alert("Erreur");
    load();
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Administration — Utilisateurs</h1>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3 text-left">Utilisateur</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Premium</th>
              <th className="p-3">Créé</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email ?? "(supprimé)"}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.premium ? "✔︎" : "—"}</td>
                <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-3 flex gap-2">
                  {u.role !== "ADMIN" && (
                    <button onClick={()=>patch(u.id,{ role:"ADMIN" })}
                      className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700">Promouvoir</button>
                  )}
                  <button onClick={()=>patch(u.id,{ premium: !u.premium })}
                    className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700">{u.premium?"Retirer premium":"Donner premium"}</button>
                  <button onClick={()=>del(u.id)}
                    className="px-3 py-1 rounded-lg bg-red-100 text-red-700">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

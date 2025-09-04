"use client";

import * as React from "react";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

type Role = "USER" | "ADMIN";
type Status = "ACTIVE" | "SUSPENDED";

export type UserRow = {
  id: number;
  email: string;
  role: Role;
  status: Status;
  createdAt: string | Date;
};

export function UsersTable({ users: initial }: { users: UserRow[] }) {
  const [users, setUsers] = React.useState<UserRow[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = React.useState<number | null>(null);

  async function doAction(id: number, action: "promote" | "suspend" | "restore") {
    setBusyId(id);
    const prev = [...users];

    setUsers(u =>
      u.map(x =>
        x.id === id
          ? {
              ...x,
              role: action === "promote" ? "ADMIN" : x.role,
              status:
                action === "suspend" ? "SUSPENDED" : action === "restore" ? "ACTIVE" : x.status,
            }
          : x
      )
    );

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      setUsers(prev);
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Action échouée");
    } else {
      startTransition(() => {});
    }
    setBusyId(null);
  }

  async function doDelete(id: number) {
    if (!confirm("Confirmer la suppression définitive ?")) return;
    setBusyId(id);
    const prev = [...users];
    setUsers(u => u.filter(x => x.id !== id));

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setUsers(prev);
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Suppression échouée");
    } else {
      startTransition(() => {});
    }
    setBusyId(null);
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Utilisateurs</h2>
        {isPending && <RefreshCw className="h-4 w-4 animate-spin" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-t text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Rôle</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Créé le</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isBusy = busyId === u.id;
              return (
                <tr key={u.id} className="border-b">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {u.role === "USER" && (
                        <button
                          onClick={() => doAction(u.id, "promote")}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                          disabled={isBusy}
                          title="Promouvoir en ADMIN"
                        >
                          Promouvoir
                        </button>
                      )}

                      {u.role === "USER" && (
                        u.status === "ACTIVE" ? (
                          <button
                            onClick={() => doAction(u.id, "suspend")}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                            disabled={isBusy}
                            title="Suspendre le compte"
                          >
                            Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => doAction(u.id, "restore")}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                            disabled={isBusy}
                            title="Restaurer le compte"
                          >
                            Restaurer
                          </button>
                        )
                      )}

                      {u.role === "USER" && (
                        <button
                          onClick={() => doDelete(u.id)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          disabled={isBusy}
                          title="Supprimer définitivement"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                  Aucun utilisateur
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

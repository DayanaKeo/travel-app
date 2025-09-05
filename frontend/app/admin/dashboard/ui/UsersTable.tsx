"use client";

import * as React from "react";
import { useTransition } from "react";
import {
  RefreshCw,
  User2,
  Shield,
  ShieldCheck,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";

/* ================== Types ================== */
type Role = "USER" | "ADMIN";
type Status = "ACTIVE" | "SUSPENDED";

export type UserRow = {
  id: number;
  email: string;
  role: Role;
  status: Status;
  createdAt: string | Date;
};

/* =========================================================
   Composant principal
   ========================================================= */
export function UsersTable({ users: initial }: { users: UserRow[] }) {
  const [users, setUsers] = React.useState<UserRow[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = React.useState<number | null>(null);

  // Toggle global : active/désactive la confirmation via modal
  const [confirmMode, setConfirmMode] = React.useState<boolean>(true);

  // État pour le modal de confirmation
  const [pending, setPending] = React.useState<{
    open: boolean;
    user?: UserRow;
    action?: "promote" | "suspend" | "restore" | "delete";
    title?: string;
    description?: string;
    danger?: boolean;
    confirmLabel?: string;
  }>({ open: false });

  /* ------------------- Actions serveur ------------------- */
  async function doAction(id: number, action: "promote" | "suspend" | "restore") {
    setBusyId(id);
    const prev = [...users];

    // Optimistic UI
    setUsers((u) =>
      u.map((x) =>
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
    setBusyId(id);
    const prev = [...users];

    // Optimistic UI
    setUsers((u) => u.filter((x) => x.id !== id));

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

  /* ------------------- Ouverture du modal ------------------- */
  function requestAction(user: UserRow, action: "promote" | "suspend" | "restore" | "delete") {
    if (!confirmMode) {
      // Sans confirmation → on exécute directement
      if (action === "delete") return doDelete(user.id);
      return doAction(user.id, action);
    }

    const config: Record<typeof action, { title: string; description: string; danger?: boolean; confirmLabel?: string }> = {
      promote: {
        title: "Promouvoir en ADMIN",
        description: `Promouvoir ${user.email} au rôle ADMIN ?`,
      },
      suspend: {
        title: "Suspendre le compte",
        description: `Suspendre le compte de ${user.email} ? L'utilisateur ne pourra plus se connecter.`,
      },
      restore: {
        title: "Restaurer le compte",
        description: `Restaurer l'accès de ${user.email} ?`,
      },
      delete: {
        title: "Supprimer définitivement",
        description: `Supprimer définitivement ${user.email} et ses données associées ? Cette action est irréversible.`,
        danger: true,
        confirmLabel: "Supprimer",
      },
    } as const;

    setPending({
      open: true,
      user,
      action,
      ...config[action],
    });
  }

  function closeModal() {
    setPending({ open: false });
  }

  async function confirmModal() {
    const { user, action } = pending;
    closeModal();
    if (!user || !action) return;
    if (action === "delete") return doDelete(user.id);
    return doAction(user.id, action);
  }

  /* ------------------------- Vue ------------------------- */
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <header className="flex items-center justify-between gap-3 p-4">
        <h2 className="text-base font-semibold">Utilisateurs</h2>

        <div className="flex items-center gap-3">
          <ConfirmToggle checked={confirmMode} onChange={setConfirmMode} />
          {isPending && (
            <RefreshCw className="h-4 w-4 animate-spin" aria-label="Actualisation en cours" />
          )}
        </div>
      </header>

      {/* Grid de cards – mobile first */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const isBusy = busyId === u.id;
            return (
              <article
                key={u.id}
                className="relative rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-4 hover:shadow-md transition"
              >
                {/* Overlay busy par card */}
                {isBusy && (
                  <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-sm grid place-items-center z-10">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  </div>
                )}

                {/* En-tête : email + rôle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <User2 className="h-4 w-4 text-neutral-500 shrink-0" />
                      <p className="font-medium truncate">{u.email}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">ID&nbsp;#{u.id}</p>
                  </div>

                  <RoleBadge role={u.role} />
                </div>

                {/* Statut + date */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill status={u.status} />
                  <div className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(u.createdAt)}
                  </div>
                </div>

                {/* Sélecteur d’actions */}
                <div className="mt-4">
                  <ActionSelect
                    user={u}
                    disabled={isBusy}
                    onRequest={requestAction}
                  />
                </div>
              </article>
            );
          })}

          {users.length === 0 && (
            <div className="col-span-full py-8 text-center text-neutral-500">Aucun utilisateur.</div>
          )}
        </div>
      </div>

      {/* Modal de confirmation */}
      <ConfirmModal
        open={pending.open}
        title={pending.title ?? ""}
        description={pending.description ?? ""}
        danger={pending.danger}
        confirmLabel={pending.confirmLabel}
        onCancel={closeModal}
        onConfirm={confirmModal}
      />
    </section>
  );
}

/* ================== UI éléments ================== */

function ConfirmToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 select-none">
      <span className="text-xs text-neutral-600">Confirmer les actions</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-5 w-9 rounded-full transition-colors outline-none ring-1 ring-black/5",
          checked ? "bg-neutral-900" : "bg-neutral-200",
        ].join(" ")}
        title={checked ? "Confirmation activée" : "Confirmation désactivée"}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 px-2.5 py-1 text-xs border border-purple-200">
        <ShieldCheck className="h-3.5 w-3.5" />
        ADMIN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-neutral-700 px-2.5 py-1 text-xs border border-neutral-200">
      <Shield className="h-3.5 w-3.5" />
      USER
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs border",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block w-1.5 h-1.5 rounded-full",
          isActive ? "bg-emerald-500" : "bg-amber-500",
        ].join(" ")}
      />
      {status}
    </span>
  );
}

function ActionSelect({
  user,
  disabled,
  onRequest,
}: {
  user: UserRow;
  disabled?: boolean;
  onRequest: (user: UserRow, action: "promote" | "suspend" | "restore" | "delete") => void;
}) {
  const [value, setValue] = React.useState<string>("");

  // Options disponibles (mobile-first)
  const options: { value: string; label: string; hidden?: boolean }[] = [
    { value: "", label: "Choisir une action" },
    { value: "promote", label: "Promouvoir en ADMIN", hidden: user.role !== "USER" },
    { value: "suspend", label: "Suspendre le compte", hidden: !(user.role === "USER" && user.status === "ACTIVE") },
    { value: "restore", label: "Restaurer le compte", hidden: !(user.role === "USER" && user.status === "SUSPENDED") },
    { value: "delete", label: "Supprimer définitivement", hidden: user.role !== "USER" },
  ].filter((o) => !o.hidden);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as "promote" | "suspend" | "restore" | "delete" | "";
    setValue(v);
    // reset du select pour revenir sur le placeholder
    setTimeout(() => setValue(""), 0);
    if (!v) return;
    onRequest(user, v);
  }

  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-neutral-500">Actions</label>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled || options.length <= 1}
          className={[
            "w-full appearance-none rounded-xl border px-3 py-2 pr-9 text-sm outline-none",
            "border-neutral-200 bg-white focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60",
            options.length <= 1 ? "text-neutral-400" : "text-neutral-800",
          ].join(" ")}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* chevron minimal */}
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>

        {/* hint danger si suppression dispo */}
        {options.some((o) => o.value === "delete") && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            Action destructive disponible
          </div>
        )}
      </div>
    </div>
  );
}

/* ================== Modal de confirmation ================== */

function ConfirmModal({
  open,
  title,
  description,
  danger,
  confirmLabel = "Confirmer",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  danger?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {danger ? (
            <div className="mt-1 grid place-items-center h-8 w-8 rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          ) : null}
          <div className="grid gap-1">
            <h3 id={titleId} className="text-base font-semibold">
              {title}
            </h3>
            <p id={descId} className="text-sm text-neutral-600">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-xl border text-sm hover:bg-neutral-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={[
              "px-3 py-2 rounded-xl text-sm text-white",
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-neutral-900 hover:bg-neutral-800",
            ].join(" ")}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================== Helpers ================== */

function formatDate(d: string | Date) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

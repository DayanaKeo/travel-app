"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Prefs = {
  notificationsEmail?: boolean | null;
  profilPublic?: boolean | null;
  suggestionsIAAutomatiques?: boolean | null;
};

export default function PrefsTab({ me }: { me: any }) {
  // ---- état initial depuis l'utilisateur ----
  const initial = useMemo<Prefs>(() => {
    const p = me?.preferences ?? {};
    return {
      notificationsEmail: p.notificationsEmail ?? true,
      profilPublic: p.profilPublic ?? false,
      suggestionsIAAutomatiques: p.suggestionsIAAutomatiques ?? true,
    };
  }, [me?.preferences]);

  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<any>(null);

  useEffect(() => setPrefs(initial), [initial]);
  useEffect(() => () => saveTimer.current && clearTimeout(saveTimer.current), []);

  const setField = useCallback(<K extends keyof Prefs>(key: K, val: NonNullable<Prefs[K]>) => {
    setPrefs((prev) => ({ ...prev, [key]: val }));
    setSaving("idle");
  }, []);

  // construit un payload "sparse" = uniquement les champs modifiés par rapport à l'initial
  const buildPayload = useCallback(() => {
    const out: Record<string, any> = {};
    (["notificationsEmail", "profilPublic", "suggestionsIAAutomatiques"] as (keyof Prefs)[]).forEach((k) => {
      if (prefs[k] !== initial[k]) out[k] = prefs[k];
    });
    return out;
  }, [prefs, initial]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const payload = buildPayload();
        // si rien n'a changé, on évite l'appel
        if (Object.keys(payload).length === 0) {
          setSaving("saved");
          setTimeout(() => setSaving("idle"), 800);
          return;
        }

        setSaving("saving");
        const r = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preference: payload }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Erreur");
        setSaving("saved");
        setTimeout(() => setSaving("idle"), 1000);
      } catch {
        setSaving("error");
      }
    }, 400);
  }, [buildPayload]);

  return (
    <div className="grid gap-6">
      {/* Export RGPD */}
      <section className="rounded-2xl bg-white shadow-sm p-4 md:p-6 grid gap-4">
        <h3 className="text-base md:text-lg font-semibold">Exporter mes données (RGPD)</h3>
        <ExportChooser />
      </section>

      {/* Barre d'état */}
      <div className="text-xs text-neutral-500 h-5">
        {saving === "saving" && <span role="status">Enregistrement…</span>}
        {saving === "saved" && <span className="text-green-600" role="status">Enregistré ✅</span>}
        {saving === "error" && <span className="text-red-600" role="status">Erreur d’enregistrement</span>}
      </div>

      {/* Préférences */}
      <section className="rounded-2xl bg-white shadow-sm p-4 md:p-6 grid gap-4">
        <h3 className="text-base md:text-lg font-semibold">Confidentialité & notifications</h3>

        <ToggleRow
          label="Profil public"
          desc="Permet d’afficher votre profil et vos voyages publics aux autres utilisateurs."
          checked={!!prefs.profilPublic}
          onChange={(v) => {
            setField("profilPublic", v);
            scheduleSave();
          }}
        />

        <ToggleRow
          label="Notifications par email"
          desc="Recevoir des emails (partages, commentaires, rappels)."
          checked={!!prefs.notificationsEmail}
          onChange={(v) => {
            setField("notificationsEmail", v);
            scheduleSave();
          }}
        />

        <ToggleRow
          label="Suggestions IA automatiques"
          desc="Activer les propositions automatiques (itinéraires, légendes photos…)."
          checked={!!prefs.suggestionsIAAutomatiques}
          onChange={(v) => {
            setField("suggestionsIAAutomatiques", v);
            scheduleSave();
          }}
        />
      </section>

      {/* Placeholder pour futur fuseau horaire : option 1 gardée pour plus tard
      <section className="rounded-2xl bg-white shadow-sm p-4 md:p-6 grid gap-3">
        <h3 className="text-base md:text-lg font-semibold">Fuseau horaire</h3>
        <p className="text-sm text-neutral-500">Affichage actuellement en Europe/Paris.</p>
      </section>
      */}
    </div>
  );
}

/* ----- Export sélectif ----- */
function ExportChooser() {
  const [mode, setMode] = useState<"all" | "custom">("all");
  const [sel, setSel] = useState<Record<string, boolean>>({
    profil: true,
    preferences: true,
    voyages: true,
    etapes: true,
    medias: true,
    shares: true,
  });
  const [busy, setBusy] = useState(false);

  function toggleAll(v: boolean) {
    setSel({
      profil: v,
      preferences: v,
      voyages: v,
      etapes: v,
      medias: v,
      shares: v,
    });
  }

  async function doExport() {
    try {
      setBusy(true);
      if (mode === "all") {
        // GET => export complet
        const res = await fetch("/api/users/export");
        await downloadJsonResponse(res);
        return;
      }

      // Mode custom => POST scopes
      const scopes = Object.entries(sel)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (scopes.length === 0) {
        alert("Sélectionnez au moins une catégorie.");
        return;
      }

      const res = await fetch("/api/users/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopes }),
      });
      await downloadJsonResponse(res);
    } catch {
      alert("Export impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="exportMode"
            value="all"
            checked={mode === "all"}
            onChange={() => setMode("all")}
          />
          Tout exporter
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="exportMode"
            value="custom"
            checked={mode === "custom"}
            onChange={() => setMode("custom")}
          />
          Choisir les données
        </label>
      </div>

      {mode === "custom" && (
        <div className="grid gap-2 border rounded-xl p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium">Sélection</div>
            <div className="flex items-center gap-2">
              <button type="button" className="text-xs underline" onClick={() => toggleAll(true)}>
                Tout cocher
              </button>
              <button type="button" className="text-xs underline" onClick={() => toggleAll(false)}>
                Tout décocher
              </button>
            </div>
          </div>

          {[
            ["profil", "Profil (identité, biographie, avatar)"],
            ["preferences", "Préférences (confidentialité, notifications)"],
            ["voyages", "Voyages"],
            ["etapes", "Étapes (avec voyages si cochés)"],
            ["medias", "Médias (photos/vidéos)"],
            ["shares", "Liens de partage"],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!sel[k]}
                onChange={(e) => setSel((p) => ({ ...p, [k]: e.target.checked }))}
              />
              {label}
            </label>
          ))}

          <p className="text-xs text-neutral-500">
            Astuce : “Médias” seul renverra les médias à plat. “Voyages + Étapes + Médias” inclura tout en
            arborescence.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={doExport}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? "Préparation…" : "Exporter (JSON)"}
        </button>
        <span className="text-xs text-neutral-500">Limite : 3 exports / 10 min</span>
      </div>
    </div>
  );
}

/* ----- Helpers ----- */
async function downloadJsonResponse(res: Response) {
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!res.ok) {
    alert(json?.error || "Export impossible.");
    return;
  }

  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = franceFilename("travelbook_export");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function franceFilename(prefix = "travelbook_export") {
  try {
    const d = new Date();
    const fmt = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
    return `${prefix}_${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}_FR.json`;
  } catch {
    return `${prefix}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  }
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex-1">
        <div className="text-sm font-medium text-neutral-800">{label}</div>
        {desc && <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-red-500" : "bg-neutral-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

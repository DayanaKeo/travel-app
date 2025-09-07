"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import AvatarPicker from "@/components/profile/AvatarPicker";
import PhoneInput from "@/components/form/PhoneInput";

type Profil = {
  nomComplet?: string | null;
  telephone?: string | null;     // en base: E.164 ou null
  localisation?: string | null;
  languePreferee?: string | null;
  biographie?: string | null;
  dateNaissance?: string | null; // ISO (yyyy-mm-dd)
  avatarUrl?: string | null;
};

export default function InfosTab({
  user,
  onSaved,
}: {
  user: any;
  onSaved: (profil: any) => void;
}) {
  //Initialisation depuis l'utilisateur
  const initial = useMemo<Profil>(() => {
    const p = user?.profil ?? {};
    return {
      nomComplet: p.nomComplet ?? "",
      telephone: p.telephone ?? "", // E.164 si présent
      localisation: p.localisation ?? "",
      languePreferee: p.languePreferee ?? "fr-FR",
      biographie: p.biographie ?? "",
      dateNaissance: p.dateNaissance ? String(p.dateNaissance).slice(0, 10) : "",
      avatarUrl: p.avatarUrl ?? "",
    };
  }, [user?.profil]);

  const [form, setForm] = useState<Profil>(initial);

  const [phoneRaw, setPhoneRaw] = useState<string>("");        // affichage input (format national)
  const [phoneValid, setPhoneValid] = useState<boolean>(true);
  const [phoneE164, setPhoneE164] = useState<string | null>(initial.telephone || null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);

  const [avatarTouched, setAvatarTouched] = useState<boolean>(false);

  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<any>(null);

  useEffect(() => {
    setForm(initial);
    setPhoneE164(initial.telephone || null);
    setPhoneRaw("");
    setPhoneValid(true);
    setPhoneTouched(false);
    setAvatarTouched(false);
  }, [initial]);

  // cleanup du timer
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const getCountry = (lang?: string | null) => {
    if (!lang) return "FR";
    const parts = String(lang).split("-");
    if (parts.length === 2 && parts[1]) return parts[1].toUpperCase();
    const map: Record<string, string> = { fr: "FR", en: "US", es: "ES", de: "DE", it: "IT" };
    return map[parts[0].toLowerCase()] ?? "FR";
  };
  const country = getCountry(form.languePreferee);

  const setField = useCallback((k: keyof Profil, v: string | null) => {
    setForm((prev) => ({ ...prev, [k]: v ?? "" }));
    setSaving("idle");
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const payload: Record<string, any> = {
          nomComplet: form.nomComplet ?? undefined,
          localisation: form.localisation ?? undefined,
          languePreferee: form.languePreferee ?? undefined,
          biographie: form.biographie ?? undefined,
          dateNaissance: form.dateNaissance
            ? new Date(form.dateNaissance).toISOString()
            : undefined,
          avatarUrl: avatarTouched
            ? (form.avatarUrl ? form.avatarUrl : null)
            : undefined,
        };

        if (phoneTouched) {
          if (!phoneRaw || phoneRaw.trim() === "") {
            payload.telephone = null;
          } else if (phoneValid && phoneE164) {
            payload.telephone = phoneE164;
          } else {
            // invalide et non vide -> on n'envoie rien (pas de modif DB)
          }
        }

        setSaving("saving");
        const r = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: payload }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Erreur");
        onSaved(data.profil);
        setSaving("saved");
        setPhoneTouched(false);
        setAvatarTouched(false);
        setTimeout(() => setSaving("idle"), 1200);
      } catch {
        setSaving("error");
      }
    }, 600);
  }, [form, avatarTouched, phoneTouched, phoneRaw, phoneValid, phoneE164, onSaved]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Bloquer la sauvegarde si téléphone invalide et non vide
    if (phoneTouched && !phoneValid && phoneRaw.trim() !== "") {
      setSaving("error");
      return;
    }
    scheduleSave();
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-4">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        {saving === "saving" && <span role="status">Enregistrement…</span>}
        {saving === "saved" && <span className="text-green-600" role="status">Enregistré ✅</span>}
        {saving === "error" && <span className="text-red-600" role="status">Vérifiez le numéro de téléphone</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field
          label="Nom complet"
          value={form.nomComplet ?? ""}
          onChange={(v) => setField("nomComplet", v)}
          onBlur={scheduleSave}
        />

        <Field label="Email" value={user.email ?? ""} readOnly />

        <Labelled label="Téléphone">
          <div
            onBlur={() => {
              if (phoneTouched && !phoneValid && phoneRaw.trim() !== "") setSaving("error");
              else scheduleSave();
            }}
          >
            <PhoneInput
              valueE164={phoneE164 || ""}
              onChange={({ e164, raw, valid }) => {
                setPhoneTouched(true);
                setPhoneRaw(raw);
                setPhoneValid(valid);
                setPhoneE164(e164);
              }}
              country={country}
            />
            {phoneTouched && !phoneValid && phoneRaw.trim() !== "" && (
              <p className="text-xs text-red-600 mt-1">
                Numéro invalide pour le pays sélectionné
              </p>
            )}
          </div>
        </Labelled>

        <Field
          label="Localisation"
          value={form.localisation ?? ""}
          onChange={(v) => setField("localisation", v)}
          onBlur={scheduleSave}
        />

        <Field
          label="Date de naissance"
          type="date"
          value={form.dateNaissance ?? ""}
          onChange={(v) => setField("dateNaissance", v)}
          onBlur={scheduleSave}
        />

        <Field
          label="Langue préférée"
          value={form.languePreferee ?? "fr-FR"}
          onChange={(v) => setField("languePreferee", v)}
          onBlur={scheduleSave}
        />

        <Labelled label="Avatar">
          <AvatarPicker
            value={form.avatarUrl ?? ""}
            onChange={(url) => {
              setAvatarTouched(true);
              setField("avatarUrl", url ?? "");
              scheduleSave(); // sauvegarde immédiate
            }}
          />
        </Labelled>
      </div>

      <Labelled label="Biographie">
        <textarea
          className="w-full border rounded-lg p-2 resize-y min-h-[96px] focus:outline-none focus:ring-2 focus:ring-red-400"
          value={form.biographie ?? ""}
          onChange={(e) => setField("biographie", e.target.value)}
          onBlur={scheduleSave}
        />
      </Labelled>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          aria-label="Enregistrer le profil"
          onClick={() => {
            if (phoneTouched && !phoneValid && phoneRaw.trim() !== "") { setSaving("error"); return; }
            scheduleSave();
          }}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          disabled={saving === "saving"}
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}

const Field = React.memo(function Field({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  onBlur,
}: {
  label: string;
  value?: any;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  type?: string;
  onBlur?: () => void;
}) {
  return (
    <label className="text-sm grid gap-1">
      <span className="text-neutral-600">{label}</span>
      <input
        className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        type={type}
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
      />
    </label>
  );
});

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm grid gap-1">
      <span className="text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

"use client";
import React, { useMemo, useState } from "react";

type State = "idle" | "submitting" | "success" | "error";

export default function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Analyse de robustesse du mot de passe
  const strength = useMemo(() => scorePassword(newPassword), [newPassword]);
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword === newPassword &&
    strength.score >= 3;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || state === "submitting") return;
    setState("submitting");
    setErrorMsg("");

    try {
      const r = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setState("error");
        setErrorMsg(data?.error || "Erreur lors du changement de mot de passe");
        return;
      }
      setState("success");
      // reset champs sensibles après succès
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
      setErrorMsg("Erreur réseau");
    }
  }

  function generatePassword() {
    const p = generateSecurePassword(16); 
    setNewPassword(p);
    setConfirmPassword(p);
    setState("idle");
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-white shadow-sm p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold">Changer le mot de passe</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Votre nouveau mot de passe doit être unique et difficile à deviner.
        </p>

        {/* messages d'état */}
        {state === "success" && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            Mot de passe mis à jour ✅
          </div>
        )}
        {state === "error" && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errorMsg || "Une erreur est survenue."}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-4 max-w-lg">
          <PasswordField
            label="Mot de passe actuel"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            setShow={setShowCurrent}
            autoComplete="current-password"
          />

          <div className="grid gap-2">
            <PasswordField
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              setShow={setShowNew}
              autoComplete="new-password"
            />
            <StrengthMeter strength={strength} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs px-2 py-1 rounded-md border border-neutral-200 hover:bg-neutral-50"
              >
                Générer un mot de passe
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(newPassword)}
                className="text-xs px-2 py-1 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
                disabled={!newPassword}
              >
                Copier
              </button>
            </div>
          </div>

          <PasswordField
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            setShow={setShowConfirm}
            autoComplete="new-password"
            error={confirmPassword && confirmPassword !== newPassword ? "La confirmation ne correspond pas" : ""}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit || state === "submitting"}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {state === "submitting" ? "Enregistrement…" : "Mettre à jour"}
            </button>
          </div>
        </form>

        <PolicyHints />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="text-sm grid gap-1">
      <span className="text-neutral-600">{label}</span>
      <div className={`flex items-stretch border rounded-lg focus-within:ring-2 ${error ? "border-red-300 ring-red-400" : "focus-within:ring-red-400"}`}>
        <input
          className="flex-1 px-3 py-2 rounded-l-lg outline-none"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="px-3 text-xs text-neutral-700 border-l hover:bg-neutral-50 rounded-r-lg"
          onClick={() => setShow(!show)}
        >
          {show ? "Masquer" : "Afficher"}
        </button>
      </div>
      {!!error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

/** Indicateur de robustesse (0..5) + règles */
function StrengthMeter({ strength }: { strength: ReturnType<typeof scorePassword> }) {
  const bars = Array.from({ length: 5 }, (_, i) => i < strength.score);
  const colors = ["bg-red-400","bg-orange-400","bg-yellow-400","bg-lime-500","bg-green-600"];
  const color = colors[Math.max(0, strength.score - 1)] || "bg-gray-300";

  return (
    <div className="grid gap-1">
      <div className="flex gap-1">
        {bars.map((ok, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded ${ok ? color : "bg-neutral-200"}`}
          />
        ))}
      </div>
      <ul className="text-xs text-neutral-500 grid gap-0.5">
        <li className={strength.length ? "text-green-700" : ""}>Au moins 12 caractères</li>
        <li className={strength.lower  ? "text-green-700" : ""}>Une minuscule</li>
        <li className={strength.upper  ? "text-green-700" : ""}>Une majuscule</li>
        <li className={strength.digit  ? "text-green-700" : ""}>Un chiffre</li>
        <li className={strength.symbol ? "text-green-700" : ""}>Un symbole</li>
      </ul>
    </div>
  );
}

function scorePassword(pw: string) {
  const length = pw.length >= 12;
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  const symbol = /[^A-Za-z0-9]/.test(pw);

  const score = [length, lower, upper, digit, symbol].reduce((s, ok) => s + (ok ? 1 : 0), 0);
  return { score, length, lower, upper, digit, symbol };
}

/** Génère un mot de passe aléatoire fort (A-Za-z0-9+symboles) */
function generateSecurePassword(length = 16) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.?/|";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

async function copyToClipboard(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

function PolicyHints() {
  return (
    <div className="mt-6 text-xs text-neutral-500">
      <p className="mb-1 font-medium text-neutral-700">Bonnes pratiques :</p>
      <ul className="list-disc pl-4 grid gap-0.5">
        <li>N’utilisez jamais le même mot de passe sur plusieurs services.</li>
        <li>Utilisez un gestionnaire de mots de passe pour stocker en sécurité.</li>
        <li>Évitez les informations personnelles (nom, date de naissance, etc.).</li>
      </ul>
    </div>
  );
}

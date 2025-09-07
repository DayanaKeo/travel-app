"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// ——— petite validation côté client (rapide, sans dépendances)
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
const pwdChecks = (v: string) => ({
  length: v.length >= 8,
  letter: /[A-Za-z]/.test(v),
  digit: /[0-9]/.test(v),
});

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = pwdChecks(password);
  const pwdValid = checks.length && checks.letter && checks.digit;
  const canSubmit = useMemo(() => name.trim().length >= 2 && isEmail(email) && pwdValid, [name, email, pwdValid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setMsg(null);
    setOk(false);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      const details = data?.details?.fieldErrors || {};
      const flat = Object.entries(details).map(([k, v]: any) => `${k}: ${v?.join(", ")}`).join(" | ");
      setMsg((data.error || "Impossible de créer le compte.") + (flat ? ` — ${flat}` : ""));
      return;
    }

    setOk(true);
    setMsg("Compte créé ! Tu peux te connecter.");
    // Option : rediriger automatiquement après 1.2s
    // setTimeout(() => router.push("/auth/signin"), 1200);
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm bg-gradient-to-r from-orange-100 to-rose-100 text-orange-700 rounded-lg p-6 shadow-lg">
        <header className="mb-5 text-center">
          <h1 className="text-2xl font-semibold">Créer un compte</h1>
          <p className="text-sm text-gray-500">Rejoins l’aventure ✈️</p>
        </header>

        <form onSubmit={onSubmit} className="card p-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">Nom</label>
            <input
              id="name"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ton nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-invalid={name.trim() !== "" && name.trim().length < 2}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              inputMode="email"
              placeholder="ex. toi@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={email !== "" && !isEmail(email)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                type={showPwd ? "text" : "password"}
                placeholder="Au moins 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-describedby="pwd-req"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto text-xs text-gray-500 hover:text-gray-700"
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPwd ? "Masquer" : "Afficher"}
              </button>
            </div>

            <ul id="pwd-req" className="mt-1 grid grid-cols-1 gap-1 text-xs text-gray-500">
              <li className={checks.length ? "text-green-600" : ""}>• 8 caractères minimum</li>
              <li className={checks.letter ? "text-green-600" : ""}>• au moins 1 lettre</li>
              <li className={checks.digit ? "text-green-600" : ""}>• au moins 1 chiffre</li>
            </ul>
          </div>

          {msg && (
            <p className={`text-sm ${ok ? "text-green-700" : "text-red-600"}`} role="alert">
              {msg}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            disabled={!canSubmit || loading}
          >
            {loading ? "Création…" : "S’inscrire"}
          </button>

          <div className="text-xs text-center text-gray-500">
            <Link href="/auth/signin" className="underline underline-offset-2 hover:text-gray-700">
              Déjà inscrit·e ? Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

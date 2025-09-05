"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function mapNextAuthError(code?: string | null) {
  switch (code) {
    case "CredentialsSignin":
      return "Email ou mot de passe invalide.";
    case "OAuthAccountNotLinked":
      return "Adresse déjà liée à un autre mode de connexion.";
    default:
      return code ? `Erreur d’authentification (${code}).` : null;
  }
}

export default function SignInPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/voyages/listing";
  const nextAuthError = mapNextAuthError(sp.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim() !== "" && password.length >= 1, [email, password]);

  useEffect(() => {
    if (nextAuthError) setMsg(nextAuthError);
  }, [nextAuthError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setMsg(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);
    if (res?.error) {
      setMsg(mapNextAuthError(res.error));
    } else if (res?.ok) {
      router.push(res.url ?? callbackUrl);
    } else {
      setMsg("Échec inattendu.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(255,179,71,.25),transparent),radial-gradient(1200px_800px_at_110%_20%,rgba(255,99,132,.22),transparent),linear-gradient(to_bottom,#fff,rgba(255,255,255,.9))] rounded-lg p-6 shadow-lg">
        <header className="mb-5 text-center">
          <h1 className="text-2xl font-semibold">Connexion</h1>
          <p className="text-sm text-gray-500">Accède à ton carnet de voyage</p>
        </header>

        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ex. toi@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!msg && /Email/.test(msg)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!msg && /mot de passe/i.test(msg)}
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
          </div>

          {msg && <p className="text-sm text-red-600" role="alert">{msg}</p>}

          <button
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            disabled={!canSubmit || loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="h-px flex-1 bg-gray-200" />
            ou
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* OAuth (optionnel) — n’affichera rien si non configuré côté NextAuth */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="rounded-lg border py-2 text-sm hover:bg-gray-50"
              aria-label="Se connecter avec Google"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl })}
              className="rounded-lg border py-2 text-sm hover:bg-gray-50"
              aria-label="Se connecter avec GitHub"
            >
              GitHub
            </button>
          </div>

          <div className="text-xs text-center text-gray-500">
            <Link href="/auth/signup" className="underline underline-offset-2 hover:text-gray-700">
              Pas de compte ? S’inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

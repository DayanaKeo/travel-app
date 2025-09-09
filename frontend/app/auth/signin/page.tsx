"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

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
  return (
    <Suspense fallback={<SigninFallback />}>
      <SignInInner />
    </Suspense>
  );
}

function SigninFallback() {
  return (
    <div className="min-h-svh grid place-items-center bg-gradient-to-br from-orange-100 via-white to-blue-100 px-6">
      <h1 className="text-lg font-medium text-neutral-600">Chargement…</h1>
    </div>
  );
}

function SignInInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const callbackUrl = sp.get("callbackUrl") || "/voyages/listing";
  const nextAuthError = mapNextAuthError(sp.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  
  const canSubmit = useMemo(
    () => email.trim() !== "" && password.length >= 1,
    [email, password]
  );
  
  useEffect(() => {
    if (nextAuthError) setMsg(nextAuthError);
  }, [nextAuthError]);
  
  const [alertOpen, setAlertOpen] = useState(false);
  const shouldShowAlert = sp.get("alert") === "auth";

  useEffect(() => {
    if (shouldShowAlert) setAlertOpen(true);
  }, [shouldShowAlert]);

  useEffect(() => {
    if (!alertOpen) return;
    const t = setTimeout(() => setAlertOpen(false), 4500);
    return () => clearTimeout(t);
  }, [alertOpen]);

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
    <section className="relative flex min-h-svh items-center justify-center bg-gradient-to-br from-orange-100 via-white to-blue-100 px-6">
      <RedirectAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        callbackUrl={callbackUrl}
      />
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Accède à ton carnet de voyage
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ex. toi@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs text-neutral-500 hover:bg-neutral-100"
              >
                {showPwd ? "Masquer" : "Afficher"}
              </button>
            </div>
          </div>

          {msg && (
            <p className="text-sm text-red-600" role="alert">
              {msg}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            disabled={!canSubmit || loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <div className="h-px flex-1 bg-neutral-200" />
            ou
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="rounded-lg border border-neutral-300 bg-white py-2 text-sm hover:bg-neutral-50"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl })}
              className="rounded-lg border border-neutral-300 bg-white py-2 text-sm hover:bg-neutral-50"
            >
              GitHub
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-600">
          Pas de compte ?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-blue-600 hover:underline"
          >
            S’inscrire
          </Link>
        </p>
      </div>
    </section>
  );
}

function RedirectAlert({
  open,
  onClose,
  callbackUrl,
}: {
  open: boolean;
  onClose: () => void;
  callbackUrl: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="redir-title"
      aria-describedby="redir-desc"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4">
          <h2 id="redir-title" className="text-base font-semibold text-neutral-900">
            Authentification requise
          </h2>
          <p id="redir-desc" className="mt-1 text-sm text-neutral-600">
            Tu as été redirigé(e) depuis une page protégée.
            Connecte-toi pour continuer.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Après connexion, tu seras renvoyé(e) vers :{" "}
            <span className="font-medium break-all">{callbackUrl}</span>
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
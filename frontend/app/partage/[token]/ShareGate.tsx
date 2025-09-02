"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import ExpireCountdown from "./ExpireCountdown";

export default function ShareGate({ token, expiresAt }: { token: string; expiresAt?: string }) {
  const [pin, setPin] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [retryAfter, setRetryAfter] = React.useState<number | null>(null);
  const router = useRouter();

  const pinRegex = /^[0-9]{5}[A-Za-z]$/;

  React.useEffect(() => {
    if (retryAfter == null) return;
    if (retryAfter <= 0) { setRetryAfter(null); return; }
    const id = setInterval(() => setRetryAfter((s) => (s == null ? null : Math.max(0, s - 1))), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!pinRegex.test(pin)) { setErr("Format attendu : 5 chiffres + 1 lettre (ex: 12345A)"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/share-links/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin: pin.toUpperCase() }),
        credentials: "include",
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 429) {
          const ra = Number(res.headers.get("Retry-After") ?? "0");
          setRetryAfter(Number.isFinite(ra) ? ra : 60);
        }
        throw new Error(j?.error || "Vérification impossible");
      }
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-sm w-full rounded-2xl bg-white border border-orange-100 shadow p-4 space-y-3">
      <div className="text-center">{expiresAt && <ExpireCountdown iso={expiresAt} />}</div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Entrer le code PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.toUpperCase().trim())}
          inputMode="text"
          autoComplete="one-time-code"
          placeholder="Ex: 12345A"
          maxLength={6}
          pattern="[0-9]{5}[A-Za-z]"
          title="5 chiffres + 1 lettre (ex: 12345A)"
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
          disabled={retryAfter != null && retryAfter > 0}
        />
      </div>

      {retryAfter != null && retryAfter > 0 ? (
        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2">
          Trop d’essais. Réessaie dans {retryAfter}s.
        </p>
      ) : err ? (
        <p className="text-xs text-red-600">{err}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !pinRegex.test(pin) || (retryAfter != null && retryAfter > 0)}
        className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
      >
        {loading ? "Vérification..." : "Déverrouiller"}
      </button>

      <p className="text-[11px] text-gray-500">L’accès restera actif sur cet appareil jusqu’à expiration du lien.</p>
    </form>
  );
}
// Formulaire de saisie du PIN pour accéder au partage
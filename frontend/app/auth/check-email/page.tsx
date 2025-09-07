"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white">
          <h1 className="text-xl font-semibold">Vérifie ta boîte mail</h1>
          <p className="mt-2 text-sm text-gray-600">Chargement…</p>
        </div>
      </main>
    }>
      <CheckEmailInner />
    </Suspense>
  );
}

function CheckEmailInner() {
  const sp = useSearchParams();
  const fromQuery = sp.get("email") ?? "";

  const [email, setEmail] = useState(fromQuery);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    fromQuery ? { type: "info", text: `Un e-mail a été envoyé à ${fromQuery}. Le lien est valable 24h.` } : null
  );

  const canSubmit = useMemo(() => !!email && /\S+@\S+\.\S+/.test(email) && !loading, [email, loading]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "E-mail de vérification renvoyé. Pense à vérifier le spam." });
      } else if (res.status === 429) {
        setMsg({ type: "info", text: data?.error || "Un e-mail actif existe déjà. Consulte ta boîte de réception." });
      } else if (res.status === 404) {
        setMsg({ type: "error", text: "Aucun compte avec cet e-mail. Vérifie l’adresse ou inscris-toi." });
      } else {
        setMsg({ type: "error", text: data?.error || "Impossible de renvoyer l’e-mail pour le moment." });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau. Réessaie." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xl">✉️</div>
          <h1 className="text-xl font-semibold">Vérifie ta boîte mail</h1>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Nous t’avons envoyé un e-mail avec un lien de confirmation. Clique dessus pour vérifier ton adresse.
        </p>

        {msg && (
          <div
            className={
              "mb-4 rounded-lg p-3 text-sm " +
              (msg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : msg.type === "info"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-red-50 text-red-700 border border-red-200")
            }
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-3">
          <label className="block text-sm font-medium">Adresse e-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder="ton.email@exemple.com"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={
              "w-full rounded-lg px-4 py-2 font-medium text-white " +
              (canSubmit ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed")
            }
          >
            {loading ? "Envoi..." : "Renvoyer l’e-mail de vérification"}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          Astuce : en dev, tu vois l’e-mail dans Mailtrap. En prod, vérifie ton domaine et expéditeur.
        </div>
      </div>
    </main>
  );
}

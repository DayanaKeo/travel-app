"use client";
import * as React from "react";

type LinkRow = {
  id: number;
  token: string;
  expiresAt: string;
  isRevoked: boolean;
};

export default function SharePanel({ voyageId }: { voyageId: number }) {
  const [useAutoPin, setUseAutoPin] = React.useState(true);
  const [pin, setPin] = React.useState(""); // utilisé seulement si useAutoPin=false
  const [hours, setHours] = React.useState(48);
  const [err, setErr] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [links, setLinks] = React.useState<LinkRow[]>([]);
  const [lastCreated, setLastCreated] = React.useState<{ url: string; pin: string } | null>(null);

  async function load() {
    const res = await fetch(`/api/share-links?voyageId=${voyageId}`, { cache: "no-store" });
    const j = await res.json().catch(() => null);
    if (res.ok) setLinks(j.data || []);
  }
  React.useEffect(() => { load(); }, [voyageId]);

  function shareText(url: string, pin: string, expiresAt?: string) {
    const exp = expiresAt ? ` (valable jusqu'au ${new Date(expiresAt).toLocaleString("fr-FR")})` : "";
    return `Je partage mon voyage avec toi 🌍\n\nLien : ${url}\nPIN : ${pin}${exp}\n\nCe code est requis pour ouvrir le lien.`;
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSuccess(null); setLoading(true); setLastCreated(null);
    try {
      const body: any = { voyageId, expiresInHours: hours };
      if (!useAutoPin) { body.pin = pin; }

      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Création impossible");

      const { url, pin: plainPin, expiresAt } = j.data;
      setSuccess(`Lien créé`);
      setLastCreated({ url, pin: plainPin });
      setPin("");
      await load();

      const msg = shareText(url, plainPin, expiresAt);
      try { await navigator.clipboard.writeText(msg); } catch {}

      if (navigator.share) {
        try { await navigator.share({ title: "Partage de voyage", text: msg, url }); } catch {}
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: number) {
    setErr(null); setSuccess(null);
    const res = await fetch(`/api/share-links/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => null);
    if (!res.ok) { setErr(j?.error || "Révocation impossible"); return; }
    await load();
  }

  const pinHelp = "Format: 5 chiffres + 1 lettre (ex: 12345A)";

  return (
    <div className="rounded-2xl bg-white border border-orange-100 shadow p-4 space-y-4">
      <h3 className="font-semibold text-[#E63946]">Partage sécurisé</h3>

      <form onSubmit={createLink} className="grid grid-cols-1 gap-3">
        {/* Mode de PIN */}
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="pinmode"
              checked={useAutoPin}
              onChange={() => setUseAutoPin(true)}
            />
            PIN automatique (recommandé)
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="pinmode"
              checked={!useAutoPin}
              onChange={() => setUseAutoPin(false)}
            />
            PIN personnalisé
          </label>
        </div>

        {!useAutoPin && (
          <div>
            <label className="block text-sm text-gray-700">PIN personnalisé</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              placeholder="Ex: 12345A"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              pattern="^[0-9]{5}[A-Za-z]$"
              title={pinHelp}
              inputMode="text"
              maxLength={6}
            />
            <p className="text-[11px] text-gray-500">{pinHelp}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-700">Durée (heures)</label>
            <input
              type="number" min={1} max={24 * 14}
              value={hours} onChange={(e) => setHours(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading || (!useAutoPin && !/^[0-9]{5}[A-Za-z]$/.test(pin))}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? "Création..." : "Générer le lien"}
            </button>
          </div>
        </div>
      </form>

      {err && <p className="text-xs text-red-600">{err}</p>}
      {success && lastCreated && (
        <div className="rounded-xl border border-green-200 bg-green-50 text-green-900 p-3 space-y-2">
          <p className="text-sm font-medium">Lien prêt à partager</p>
          <p className="text-sm break-all"><span className="font-semibold">URL :</span> {lastCreated.url}</p>
          <p className="text-sm"><span className="font-semibold">PIN :</span> {lastCreated.pin} <span className="text-[11px]">(affiché une seule fois)</span></p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const txt = shareText(lastCreated.url, lastCreated.pin);
                try { await navigator.clipboard.writeText(txt); } catch {}
              }}
              className="rounded-lg border px-3 py-1 text-sm"
            >
              Copier le message
            </button>
            {typeof navigator.share !== "undefined" && (
              <button
                onClick={async () => {
                  const txt = shareText(lastCreated.url, lastCreated.pin);
                  try { await navigator.share({ title: "Partage de voyage", text: txt, url: lastCreated.url }); } catch {}
                }}
                className="rounded-lg border px-3 py-1 text-sm"
              >
                Partager…
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium text-gray-900 mb-2">Liens actifs / historiques</h4>
        <div className="space-y-2">
          {links.length === 0 ? (
            <p className="text-sm text-gray-600">Aucun lien pour l’instant.</p>
          ) : links.map((l) => {
            const active = !l.isRevoked && new Date(l.expiresAt).getTime() > Date.now();
            const status = l.isRevoked ? "Révoqué" : (active ? "Actif" : "Expiré");
            return (
              <div key={l.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <div className="space-y-0.5">
                  <p className="font-medium">Token: {l.token}</p>
                  <p className="text-gray-600">Expire le {new Date(l.expiresAt).toLocaleString("fr-FR")} — {status}</p>
                </div>
                {active && (
                  <button onClick={() => revoke(l.id)} className="text-[#E63946] hover:underline">
                    Révoquer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

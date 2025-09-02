"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

type Media = { id: number; url: string; type: string };

export default function MediaCard({ media }: { media: Media }) {
  const router = useRouter();
  const [del, setDel] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    if (!confirm("Supprimer définitivement ce média ?")) return;
    setErr(null);
    setDel(true);
    try {
      const res = await fetch(`/api/medias/${media.id}`, { method: "DELETE" });
      if (!res.ok) {
        let msg = "Suppression impossible";
        try { const j = await res.json(); msg = j?.error || msg; } catch {}
        throw new Error(msg);
      }
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur inconnue");
      setDel(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border">
      {media.type === "video" ? (
        <video src={media.url} controls className="w-full h-40 object-cover" />
      ) : (
        <img src={media.url} alt="" className="w-full h-40 object-cover" />
      )}

      <button
        onClick={onDelete}
        disabled={del}
        className="absolute top-2 right-2 inline-flex items-center justify-center rounded-lg bg-red-600/90 text-white p-2 hover:bg-red-700 disabled:opacity-60"
        title="Supprimer"
        aria-label="Supprimer"
      >
        {del ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      {err && <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-xs px-2 py-1">{err}</div>}
    </div>
  );
}

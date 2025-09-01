"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";

type Props = { etapeId: number };

const ACCEPT = "image/*,video/mp4,video/webm";
const MAX_MB = 30;

export default function MediaUploader({ etapeId }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // validations rapides côté client
    for (const f of Array.from(files)) {
      if (!ACCEPT.split(",").some((a) => a.trim() === f.type || (a.trim() === "image/*" && f.type.startsWith("image/")))) {
        setError("Format non supporté. Autorisés: images, MP4, WebM.");
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`Fichier trop volumineux (max ${MAX_MB}MB).`);
        return;
      }
    }

    setUploading(true);
    setProgress({ done: 0, total: files.length });

    let done = 0;
    try {
      for (const f of Array.from(files)) {
        const form = new FormData();
        form.append("etapeId", String(etapeId));
        form.append("file", f);

        const res = await fetch("/api/medias", { method: "POST", body: form });
        if (!res.ok) {
          let msg = "Upload échoué";
          try {
            const j = await res.json();
            msg = j?.error || msg;
          } catch {}
          throw new Error(msg);
        }
        done += 1;
        setProgress({ done, total: files.length });
      }
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setUploading(false);
      // reset l'input pour pouvoir réuploader les mêmes fichiers si besoin
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm cursor-pointer">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span>{uploading ? "Téléversement..." : "Ajouter des médias"}</span>
        <input
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {progress && (
        <span className="text-xs text-gray-600">
          Upload {progress.done}/{progress.total}
        </span>
      )}

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}

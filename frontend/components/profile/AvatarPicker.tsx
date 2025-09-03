"use client";
import React, { useRef, useState, useEffect } from "react";

type MediaItem = { id: number; url: string };

export default function AvatarPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "gallery">("upload");
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  async function loadGallery() {
    try {
      setLoading(true);
      const r = await fetch("/api/medias?mine=1&type=image&limit=24");
      const data = await r.json();
      setGallery(data.items ?? []);
    } catch {
      setGallery([]);
    } finally {
      setLoading(false);
    }
  }

  // Upload avatar
  async function handleFile(file: File) {
    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Upload échoué");
        return;
      }

      setPreview(json.url);
      onChange(json.url);
    } catch {
      alert("Upload échoué");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function selectFromGallery(url: string) {
    setPreview(url);
    onChange(url);
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            tab === "upload" ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-700"
          }`}
        >
          Importer
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("gallery");
            loadGallery();
          }}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            tab === "gallery" ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-700"
          }`}
        >
          Depuis ma galerie
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>

        {tab === "upload" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? "Envoi…" : "Choisir une photo"}
            </button>
          </>
        )}
      </div>

      {tab === "gallery" && (
        <div className="min-h-[96px]">
          {loading ? (
            <div className="text-sm text-neutral-500">Chargement…</div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {gallery.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectFromGallery(m.url)}
                  className="aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-red-400"
                >
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {gallery.length === 0 && (
                <div className="text-sm text-neutral-500">Aucune image trouvée.</div>
              )}
            </div>
          )}
        </div>
      )}

      {value && (
        <div className="flex">
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange(null);
            }}
            className="text-xs text-red-600"
          >
            Supprimer l’avatar
          </button>
        </div>
      )}
    </div>
  );
}

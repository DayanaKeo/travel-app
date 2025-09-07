"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";

type Props = {
  accept: string[];          // ex: ["image/jpeg","image/png",...]
  maxMb: number;             // ex: 10
  minWidth: number;          // ex: 1200
  minHeight: number;         // ex: 675
  existingUrl?: string | null;
  removeExisting: boolean;
  onRemoveExistingChange: (checked: boolean) => void;

  // Renvoie le fichier sélectionné (ou null si effacé)
  onFileChange: (file: File | null) => void;
  // Permet au parent d'afficher ou bloquer le submit
  onErrorChange?: (msg: string | null) => void;
};

export default function CoverDropzone({
  accept,
  maxMb,
  minWidth,
  minHeight,
  existingUrl = null,
  removeExisting,
  onRemoveExistingChange,
  onFileChange,
  onErrorChange,
}: Props) {
  const [dropActive, setDropActive] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(existingUrl);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Reset preview si existingUrl / removeExisting changent
  React.useEffect(() => {
    if (removeExisting) {
      setPreview(null);
      return;
    }
    if (!fileRef.current || !fileRef.current.files?.[0]) {
      setPreview(existingUrl ?? null);
    }
  }, [existingUrl, removeExisting]);

  function setError(msg: string | null) {
    onErrorChange?.(msg);
  }

  async function validateAndPreview(file: File) {
    setError(null);
    if (!accept.includes(file.type)) {
      setError("Formats acceptés : " + accept.map((t) => t.split("/")[1].toUpperCase()).join(", ") + ".");
      return false;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Fichier trop lourd (max ${maxMb} Mo).`);
      return false;
    }
    const blobUrl = URL.createObjectURL(file);
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width >= minWidth && img.height >= minHeight);
      img.onerror = () => resolve(false);
      img.src = blobUrl;
    });
    if (!ok) {
      URL.revokeObjectURL(blobUrl);
      setError(`Image trop petite (min ${minWidth}×${minHeight}px, 16:9 recommandé).`);
      return false;
    }
    // valide
    setPreview((old) => {
      if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
      return blobUrl;
    });
    return true;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    const ok = await validateAndPreview(f);
    if (ok) {
      onRemoveExistingChange(false); // on remplace l'existant
      onFileChange(f);
      setError(null);
    } else {
      onFileChange(null);
    }
  }

  function clearSelectedFile() {
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
    onFileChange(null);
    // si on efface le nouveau fichier → on revient à l’existant (sauf si removeExisting)
    setPreview(removeExisting ? null : existingUrl ?? null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDropActive(false);
    handleFiles(e.dataTransfer.files || null);
  }

  const acceptStr = accept.join(",");

  return (
    <div>
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`rounded-xl border-2 border-dashed ${
          dropActive ? "border-[#E63946] bg-orange-50/50" : "border-orange-200"
        } p-4 transition-colors cursor-pointer`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        aria-label="Déposer une image de couverture ou cliquer pour sélectionner"
      >
        <div className="flex items-start gap-3">
          <Upload className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium">Dépose ton image ici</p>
            <p className="text-xs text-gray-500">
              ou{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
                className="underline decoration-orange-400 hover:text-[#E63946]"
              >
                clique pour parcourir
              </button>
            </p>
            <p className="mt-2 text-[11px] text-gray-500">
              Formats: {accept.map((t) => t.split("/")[1].toUpperCase()).join(", ")} · Max {maxMb} Mo · Min{" "}
              {minWidth}×{minHeight}px (16:9 recommandé)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={acceptStr}
              onChange={(e) => handleFiles(e.target.files)}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      {/* Actions cover */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={!!removeExisting}
            onChange={(e) => onRemoveExistingChange(e.target.checked)}
          />
        </label>
        <span className="text-xs text-gray-700">Retirer la couverture existante</span>

        {/* Effacer le fichier choisi (si un nouveau est sélectionné) */}
        <button
          type="button"
          onClick={clearSelectedFile}
          className="inline-flex items-center gap-1.5 text-xs rounded-lg border px-2.5 py-1 hover:bg-orange-50"
          title="Annuler la sélection du nouveau fichier"
        >
          <X className="h-3.5 w-3.5" /> Effacer le fichier choisi
        </button>
      </div>

      {/* Aperçu */}
      {preview && !removeExisting && (
        <div className="mt-4 relative aspect-[16/9] overflow-hidden rounded-xl border border-orange-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu couverture" className="w-full h-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>
      )}
    </div>
  );
}

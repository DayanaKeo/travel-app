export type Media = {
  id: number;
  url: string;
  type: "image" | "video" | string;
};

export async function uploadMedia(etapeId: number, file: File): Promise<{ data: Media }> {
  const form = new FormData();
  form.append("etapeId", String(etapeId));
  form.append("file", file);

  const res = await fetch("/api/medias", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Upload échoué");
  return res.json();
}

export async function deleteMedia(id: number): Promise<{ ok: true }> {
  const res = await fetch(`/api/medias/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Suppression impossible");
  return res.json();
}

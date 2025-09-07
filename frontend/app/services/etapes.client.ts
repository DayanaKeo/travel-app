export type Etape = {
  id: number;
  voyageId: number;
  titre: string;
  adresse: string;
  texte: string | null;
  latitude: number;
  longitude: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function createEtape(payload: {
  voyageId: number;
  titre: string;
  adresse: string;
  texte?: string | null;
  latitude: number | string;
  longitude: number | string;
  date: string;
}): Promise<{ data: Etape }> {
  const res = await fetch("/api/etapes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Création d’étape impossible");
  return res.json();
}

export async function updateEtape(id: number, payload: Partial<{
  titre: string; adresse: string; texte: string | null;
  latitude: number | string; longitude: number | string; date: string;
}>): Promise<{ data: Etape }> {
  const res = await fetch(`/api/etapes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Mise à jour d’étape impossible");
  return res.json();
}

export async function deleteEtape(id: number): Promise<{ ok: true }> {
  const res = await fetch(`/api/etapes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Suppression d’étape impossible");
  return res.json();
}

export type Voyage = {
  id: number;
  titre: string;
  description?: string | null;
  image?: string | null;
  dateDebut: string;
  dateFin: string;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
};


export async function createVoyageJSON(payload: {
  titre: string;
  description?: string | null;
  dateDebut: string;
  dateFin: string;
  isPublic?: boolean;
}): Promise<{ data: Voyage }> {
  const res = await fetch("/api/voyages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Création impossible");
  return res.json();
}

export async function createVoyageWithCover(payload: {
  titre: string;
  description?: string | null;
  dateDebut: string;
  dateFin: string;
  isPublic?: boolean;
  cover?: File | null;
}): Promise<{ data: Voyage }> {
  const form = new FormData();
  form.append("titre", payload.titre);
  if (payload.description) form.append("description", payload.description);
  form.append("dateDebut", payload.dateDebut);
  form.append("dateFin", payload.dateFin);
  if (payload.isPublic) form.append("isPublic", "true");
  if (payload.cover) form.append("cover", payload.cover);

  const res = await fetch("/api/voyages", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Création impossible");
  return res.json();
}

export async function updateVoyageJSON(
  id: number,
  payload: Partial<{
    titre: string;
    description: string | null;
    dateDebut: string;
    dateFin: string;
    isPublic: boolean;
    removeCover: boolean;
  }>
): Promise<{ data: Voyage }> {
  const res = await fetch(`/api/voyages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Mise à jour impossible");
  return res.json();
}

export async function updateVoyageWithCover(
  id: number,
  payload: Partial<{
    titre: string;
    description: string | null;
    dateDebut: string;
    dateFin: string;
    isPublic: boolean;
    removeCover: boolean;
  }> & { cover: File }
): Promise<{ data: Voyage }> {
  const form = new FormData();
  if (payload.titre != null) form.append("titre", payload.titre);
  if (payload.description != null) form.append("description", payload.description ?? "");
  if (payload.dateDebut != null) form.append("dateDebut", payload.dateDebut);
  if (payload.dateFin != null) form.append("dateFin", payload.dateFin);
  if (payload.isPublic != null) form.append("isPublic", String(payload.isPublic));
  if (payload.removeCover != null) form.append("removeCover", String(payload.removeCover));
  form.append("cover", payload.cover);

  const res = await fetch(`/api/voyages/${id}`, { method: "PATCH", body: form });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Mise à jour impossible");
  return res.json();
}



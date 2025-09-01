type Voyage = {
  id: number;
  titre: string;
  description?: string | null;
  image?: string | null;
  ville?: string | null;
  dateDebut?: string;
  dateFin?: string;
  createdAt?: string;
  statut?: "prive" | "public";
};

type Ctx = { baseUrl?: string };

function buildUrl(path: string, baseUrl?: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return (baseUrl ?? "") + path;
}

export async function getVoyageById(id: number, ctx?: Ctx): Promise<Voyage | null> {
  const url = buildUrl(`/api/voyages/${id}`, ctx?.baseUrl);
  const res = await fetch(url, { cache: "no-store", headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.data as Voyage;

}

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
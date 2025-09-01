// services/voyages.ts
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

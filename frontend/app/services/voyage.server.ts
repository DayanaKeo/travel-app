import { fetchJson } from "./http.server";

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

export async function getVoyageSSR(id: number): Promise<{ data: Voyage | null }> {
  return fetchJson<{ data: Voyage | null }>(`/api/voyages/${id}`);
}

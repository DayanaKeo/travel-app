import "server-only";
import { fetchJson } from "./http.server";

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

export async function getEtapeSSR(id: number): Promise<{ data: Etape | null }> {
  return fetchJson<{ data: Etape | null }>(`/api/etapes/${id}`);
}

export async function listEtapesSSR(
  options: { voyageId: number; order?: "asc" | "desc"; page?: number; limit?: number; q?: string }
): Promise<{ data: Etape[]; pagination: any }> {
  const qs = new URLSearchParams(
    Object.entries({
      voyageId: String(options.voyageId),
      order: options.order ?? "asc",
      page: String(options.page ?? 1),
      limit: String(options.limit ?? 20),
      q: options.q ?? "",
    }).filter(([, v]) => v !== "")) // enlève q vide
    .toString();

  return fetchJson<{ data: Etape[]; pagination: any }>(`/api/etapes?${qs}`);
}

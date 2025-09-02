import { fetchJson } from "./http.server";
import "server-only";

export type Media = {
  id: number;
  url: string;
  type: "image" | "video" | string;
  createdAt?: string;
  voyageId?: number | null;
  etapeId?: number | null;
};

export async function listMediasByEtapeSSR(etapeId: number): Promise<Media[]> {
  const { data } = await fetchJson<{ data: Media[] }>(`/api/medias/list?etapeId=${etapeId}`);
  return data;
}

import { prisma } from "./prisma";

export async function assertVoyageOwnership(voyageId: number, userId: string | number): Promise<void> {
  const uid = Number(userId);
  const voyage = await prisma.voyage.findFirst({
    where: {
      id: voyageId,
      userId: uid,
    },
  });

  if (!voyage) {
    throw new Error("FORBIDDEN");
  }
}

export async function getOwnerUserIdByEtapeId(etapeId: number): Promise<number | null> {
  const et = await prisma.etape.findUnique({
    where: { id: etapeId },
    select: { voyage: { select: { userId: true } } },
  });
  return et?.voyage.userId ?? null;
}

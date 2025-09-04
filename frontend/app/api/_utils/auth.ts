import { getToken } from "next-auth/jwt";

type Role = "USER" | "ADMIN";

export async function requireUserIdFromRequest(req: Request): Promise<number> {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.uid) throw new Response("Non authentifié", { status: 401 });
  return token.uid as number;
}

export async function requireAdminFromRequest(req: Request): Promise<{ uid: number; role: Role }> {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.uid || !token?.role) throw new Response("Non authentifié", { status: 401 });
  if (token.role !== "ADMIN") throw new Response("Accès refusé", { status: 403 });
  return { uid: token.uid as number, role: token.role as Role };
}

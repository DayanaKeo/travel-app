import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  if (id === undefined || id === null) {
        // console.log("NO_SESSION", session);
    throw new Error("UNAUTHORIZED");
  }
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    throw new Error("UNAUTHORIZED");
  }
  return { id: userId, email: session!.user!.email ?? null };
}

import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  // ... UI : session.user.email, session.user.premium, etc.
  return <div>Bonjour {session.user.email}</div>;
}

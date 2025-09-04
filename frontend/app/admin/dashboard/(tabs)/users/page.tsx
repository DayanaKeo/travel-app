import { prisma } from "@/lib/prisma";
import { UsersTable, UserRow } from "../../ui/UsersTable";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });

  return (
    <main className="p-6">
      <UsersTable users={users as unknown as UserRow[]} />
    </main>
  );
}

import { notFound } from "next/navigation";
import SharePanel from "@/app/voyages/[id]/SharePanel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const voyageId = Number(id);
  if (!Number.isInteger(voyageId) || voyageId <= 0) notFound();

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#E63946]">Partage sécurisé</h1>
        <SharePanel voyageId={voyageId} />
      </div>
    </div>
  );
}

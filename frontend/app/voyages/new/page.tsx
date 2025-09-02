import NewVoyageForm from "@/app/voyages/new/NewVoyageForm";


export const dynamic = "force-dynamic";

export default async function NewVoyagePage() {
  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#E63946]">Nouveau voyage</h1>
        <div className="mt-6 rounded-2xl bg-white border border-orange-100 shadow p-5">
          <NewVoyageForm />
        </div>
      </div>
    </div>
  );
}

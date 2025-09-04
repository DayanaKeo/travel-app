import { getMongo } from "@/lib/mongo";

type Feedback = {
  _id: any;
  user_id?: number;
  message: string;
  type?: string;
  rating?: number;
  created_at: Date;
  context?: { path?: string; ua?: string };
};

export default async function SupportPage() {
  const db = await getMongo();
  const list = (await db
    .collection("feedbacks")
    .find({}, { projection: { message: 1, type: 1, rating: 1, created_at: 1, user_id: 1, context: 1 } })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray()) as Feedback[];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-medium mb-4">Messages de support</h2>
      <ul className="divide-y">
        {list.map((f) => (
          <li key={String(f._id)} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">
                  {f.type === "bug" ? "Problème" : f.type === "feature" ? "Demande de fonctionnalité" : "Message"}
                  {typeof f.rating === "number" && (
                    <span className="ml-2 inline-flex rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-xs border border-amber-200">
                      Note {f.rating}/5
                    </span>
                  )}
                </div>
                <div className="text-neutral-700">{f.message}</div>
                <div className="text-neutral-500 text-xs mt-1">
                  {f.context?.path ? `Contexte: ${f.context.path} – ` : ""}
                  {new Date(f.created_at).toLocaleString()}
                </div>
              </div>
              <div className="shrink-0 flex gap-3">
                <button className="text-sky-600 hover:underline">Répondre</button>
                <button className="text-neutral-500 hover:underline">Marquer résolu</button>
              </div>
            </div>
          </li>
        ))}
        {list.length === 0 && (
          <li className="py-8 text-center text-neutral-500">Aucun message de support.</li>
        )}
      </ul>
    </section>
  );
}

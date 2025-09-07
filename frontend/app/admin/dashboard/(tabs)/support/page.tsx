import { getMongo } from "@/lib/mongo";
import {
  Bug,
  Sparkles,
  MessageSquareText,
  Star,
  Link2,
  Clock3,
  User2,
  CheckCircle2,
  Reply,
} from "lucide-react";

type Feedback = {
  _id: any;
  user_id?: number;
  message: string;
  type?: "bug" | "feature" | "message" | string;
  rating?: number;
  created_at: Date;
  context?: { path?: string; ua?: string };
};

/* ---------- helpers UI ---------- */
function badgeForType(t?: Feedback["type"]) {
  switch (t) {
    case "bug":
      return { label: "Problème", Icon: Bug, cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "feature":
      return { label: "Demande", Icon: Sparkles, cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    default:
      return { label: "Message", Icon: MessageSquareText, cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }
}
function Stars({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Note ${v}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < v ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} />
      ))}
    </span>
  );
}
function fmtDate(d: Date | string) {
  const dd = new Date(d);
  return dd.toLocaleString();
}

/* =================================================================== */

export default async function SupportPage() {
  const db = await getMongo();
  const list = (await db
    .collection("feedbacks")
    .find({}, { projection: { message: 1, type: 1, rating: 1, created_at: 1, user_id: 1, context: 1 } })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray()) as Feedback[];

  const total = list.length;
  const bugs = list.filter((x) => x.type === "bug").length;
  const features = list.filter((x) => x.type === "feature").length;
  const avg = list.filter((x) => typeof x.rating === "number").reduce((a, b) => a + (b.rating ?? 0), 0) / Math.max(1, list.filter((x)=>typeof x.rating==="number").length);

  return (
    <section className="space-y-6">
      {/* Header / résumé */}
      <header className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">Messages de support</h2>
            <p className="text-xs text-neutral-500">
              {total} élément{total > 1 ? "s" : ""} • {bugs} bug{bugs > 1 ? "s" : ""} • {features} demande
              {features > 1 ? "s" : ""} • note moyenne {Number.isFinite(avg) ? avg.toFixed(1) : "–"}/5
            </p>
          </div>
        </div>
      </header>

      {/* Liste des feedbacks */}
      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-500">
          Aucun message de support.
        </div>
      ) : (
        <ul className="grid gap-4 sm:gap-5">
          {list.map((f) => {
            const badge = badgeForType(f.type);
            return (
              <li key={String(f._id)} className="group rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                {/* En-tête de la card */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border ${badge.cls}`}>
                      <badge.Icon className="h-3.5 w-3.5" />
                      {badge.label}
                    </span>
                    {typeof f.rating === "number" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 border border-amber-200">
                        <Stars value={f.rating} /> <span className="ml-1">{f.rating}/5</span>
                      </span>
                    )}
                  </div>

                  {/* Méta droites (compact en mobile) */}
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {f.user_id && (
                      <span className="inline-flex items-center gap-1">
                        <User2 className="h-3.5 w-3.5" /> #{f.user_id}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {fmtDate(f.created_at)}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <p className="mt-3 text-sm leading-6 text-neutral-800">
                  {f.message}
                </p>

                {/* Contexte */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  {f.context?.path && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1">
                      <Link2 className="h-3.5 w-3.5" />
                      {f.context.path}
                    </span>
                  )}
                  {f.context?.ua && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1">
                      {f.context.ua}
                    </span>
                  )}
                </div>

                {/* Actions (purement visuelles) */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"
                    title="Répondre"
                  >
                    <Reply className="h-3.5 w-3.5" /> Répondre
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"
                    title="Marquer résolu"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marquer résolu
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

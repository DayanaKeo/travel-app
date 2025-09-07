import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserIdFromRequest } from "@/app/api/_utils/auth";

// ------- Rate limit (mémoire). En prod => Redis/KV.
type Stamp = number;
type RLState = Record<number, Stamp[]>;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQ = 3;

function getLimiter() {
  // @ts-ignore
  if (!globalThis.__exportLimiter) globalThis.__exportLimiter = {} as RLState;
  // @ts-ignore
  return globalThis.__exportLimiter as RLState;
}
function rateLimit(userId: number) {
  const store = getLimiter();
  const now = Date.now();
  store[userId] = (store[userId] || []).filter((t) => now - t < WINDOW_MS);
  if (store[userId].length >= MAX_REQ) return false;
  store[userId].push(now);
  return true;
}

type Scope = "profil" | "preferences" | "voyages" | "etapes" | "medias" | "shares";
function normalizeScopes(input?: unknown): Scope[] {
  if (!Array.isArray(input) || input.length === 0) {
    return ["profil", "preferences", "voyages", "etapes", "medias", "shares"];
  }
  const allowed = new Set<Scope>(["profil", "preferences", "voyages", "etapes", "medias", "shares"]);
  const out: Scope[] = [];
  for (const s of input) {
    const v = String(s).toLowerCase() as Scope;
    if (allowed.has(v)) out.push(v);
  }
  return out.length ? out : ["profil", "preferences", "voyages", "etapes", "medias", "shares"];
}

function franceFilename(prefix = "travelbook_export") {
  try {
    const d = new Date();
    const fmt = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
    const name = `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}`;
    return `${prefix}_${name}_FR.json`;
  } catch {
    return `${prefix}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  }
}

export async function GET(req: NextRequest) {
  // Compat: GET => export complet
  return handleExport(req, ["profil", "preferences", "voyages", "etapes", "medias", "shares"]);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const scopes = normalizeScopes(body?.scopes);
  return handleExport(req, scopes);
}

async function handleExport(req: NextRequest, scopes: Scope[]) {
  try {
    const userId = await requireUserIdFromRequest(req);
    if (!rateLimit(userId)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const needProfil = scopes.includes("profil");
    const needPrefs = scopes.includes("preferences");
    const needVoyages = scopes.includes("voyages");
    const needEtapes = scopes.includes("etapes");
    const needMedias = scopes.includes("medias");
    const needShares = scopes.includes("shares");

    // User de base (toujours utile pour le contexte de l'export)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, image: true, role: true, premium: true, createdAt: true, updatedAt: true },
    });

    // Récupérations
    const [profil, preferences, voyages, shares, medias] = await Promise.all([
      needProfil ? prisma.profilUser.findUnique({ where: { userId } }) : Promise.resolve(undefined),
      needPrefs ? prisma.preferenceUser.findUnique({ where: { userId } }) : Promise.resolve(undefined),

      needVoyages
        ? prisma.voyage.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
              // n'inclure étapes que si demandé
              etapes: needEtapes
                ? {
                    orderBy: { date: "asc" },
                    include: {
                      // inclure médias d'étape seulement si demandé
                      media: needMedias ? { orderBy: { createdAt: "asc" } } : false,
                    },
                  }
                : false,
              // médias attachés directement au voyage (en plus des médias d'étapes)
              media: needMedias ? { orderBy: { createdAt: "asc" } } : false,
            },
          })
        : Promise.resolve(undefined),

      needShares
        ? prisma.shareLink.findMany({
            where: { voyage: { userId } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve(undefined),

      // Si l'utilisateur demande "medias" mais pas "voyages", on fournit les médias globaux à plat
      needMedias && !needVoyages
        ? prisma.media.findMany({
            where: {
              OR: [{ voyage: { userId } }, { etape: { voyage: { userId } } }],
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve(undefined),
    ]);

    const payload: any = {
      exportMeta: {
        app: "TravelBook",
        version: 2,
        generatedAt: new Date().toISOString(), // UTC
        scopes,
      },
      user,
    };
    if (needProfil) payload.profil = profil ?? null;
    if (needPrefs) payload.preferences = preferences ?? null;
    if (needVoyages) payload.voyages = voyages ?? [];
    if (needShares) payload.shares = shares ?? [];
    if (needMedias && !needVoyages) payload.medias = medias ?? []; // médias à plat seulement si voyages non demandés

    const filename = franceFilename("travelbook_export");

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    const msg = e?.message || "Erreur export";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

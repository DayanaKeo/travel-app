import AdminUsersTable from "./AdminUsersTable";

async function getStats() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/stats`, { cache: "no-store" });
  if (!r.ok) throw new Error("stats error");
  return r.json();
}

export default async function AdminPage() {
  const stats = await getStats();
  const lastFR = stats.lastSignup
    ? new Intl.DateTimeFormat("fr-FR",{ dateStyle:"medium", timeStyle:"short" }).format(new Date(stats.lastSignup))
    : "—";

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-sm text-neutral-600">Tableau de bord</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Utilisateurs" value={stats.users} />
        <Kpi label="Voyages" value={stats.voyages} />
        <Kpi label="Médias" value={stats.medias} />
        <Kpi label="Dernière inscription" value={lastFR} />
      </div>

      {/* Usage last 30d */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-medium">Activité (30 jours)</div>
          <span className="text-xs text-neutral-500">Source: Mongo usage_events</span>
        </div>
        <MiniArea data={stats.usageLast30d.map((d:any)=>d.total)} />
      </div>

      {/* Top pays */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <div className="text-base font-medium mb-3">Top pays</div>
        <ul className="grid md:grid-cols-3 gap-3">
          {stats.topCountries.map((c:any)=>(
            <li key={c.country} className="rounded-xl border p-4 flex items-center justify-between">
              <span className="text-sm">{c.country}</span>
              <span className="text-sm text-neutral-600">{c.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <AdminUsersTable />
    </div>
  );
}

function Kpi({label, value}:{label:string; value:any}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function MiniArea({ data }:{ data:number[] }) {
  const W = 560, H = 120, pad = 4;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => {
    const x = pad + (i * (W - pad*2)) / Math.max(1, (data.length - 1));
    const y = H - pad - (v / max) * (H - pad*2);
    return `${x},${y}`;
  }).join(" ");
  const path = `M ${pad},${H - pad} L ${pts} L ${W - pad},${H - pad} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={H} className="block">
        <path d={path} fill="url(#g)" />
        <polyline points={pts} fill="none" stroke="#ef4444" strokeWidth="2" />
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

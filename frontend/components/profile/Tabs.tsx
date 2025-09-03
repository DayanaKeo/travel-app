export default function Tabs({
  tabs, active, onChange,
}: { tabs: {key:string;label:string}[]; active:string; onChange:(k:string)=>void }) {
  return (
    <div className="mt-4 bg-white rounded-xl p-1 flex gap-1 overflow-x-auto">
      {tabs.map(t => (
        <button key={t.key}
          onClick={()=>onChange(t.key)}
          className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap ${active===t.key ? "bg-red-50 text-red-600" : "text-neutral-600 hover:bg-neutral-50"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Link, PlusCircle } from "lucide-react";

type Voyage = {
  id: number;
  titre: string;
  description?: string | null;
  dateDebut: string;
  dateFin: string;
};

export default function VoyagesPage() {
  const [items, setItems] = useState<Voyage[]>([]);
  const [form, setForm] = useState({ titre: "", description: "", dateDebut: "", dateFin: "" });
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/voyages", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
    else setMsg("Impossible de charger les voyages (êtes-vous connecté ?)");
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/voyages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ titre: "", description: "", dateDebut: "", dateFin: "" });
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data?.error || "Erreur");
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF5F5] py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-center text-[#E63946]">🌍 Mes Voyages</h1>

        {/* Formulaire */}
        <form
          onSubmit={onSubmit}
          className="bg-white shadow-md rounded-2xl p-6 grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-3">
            <input
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#E63946]"
              placeholder="Titre du voyage"
              value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })}
            />
            <textarea
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#E63946]"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <input
              type="date"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#E63946]"
              value={form.dateDebut}
              onChange={e => setForm({ ...form, dateDebut: e.target.value })}
            />
            <input
              type="date"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#E63946]"
              value={form.dateFin}
              onChange={e => setForm({ ...form, dateFin: e.target.value })}
            />
            <button
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:opacity-90 transition"
            >
              <PlusCircle size={20} /> Créer un voyage
            </button>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
          </div>
        </form>

        {/* Liste voyages */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="/voyages/listing">Mes voyages</a>
          <Link href="/voyages/listing" className="text-sm hover:underline">Mes Voyages</Link>
        </div>
      </div>
    </div>
  );
}

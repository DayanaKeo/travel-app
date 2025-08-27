"use client";

import { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
    const details = data?.details?.fieldErrors || {};
    const flat = Object.entries(details).map(([k, v]: any) => `${k}: ${v?.join(", ")}`).join(" | ");
    setMsg(data.error + (flat ? ` — ${flat}` : ""));
    } else {
    setMsg("Compte créé ! Tu peux te connecter.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">Créer un compte</h1>
        <input className="border p-2 w-full rounded" placeholder="Nom" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2 w-full rounded" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full rounded" placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="bg-blue-600 text-white p-2 rounded w-full">S’inscrire</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </div>
  );
}

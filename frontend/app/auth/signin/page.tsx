"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,     // récupérer l'erreur côté client
      callbackUrl: "/",
    });

    if (res?.error) setMsg(`Erreur: ${res.error}`);
    else if (res?.ok) window.location.href = res.url ?? "/";
    else setMsg("Échec inattendu");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <input className="border p-2 w-full rounded" type="email" placeholder="Email"
               value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="border p-2 w-full rounded" type="password" placeholder="Mot de passe"
               value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="bg-blue-600 text-white p-2 rounded w-full">Se connecter</button>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </form>
    </div>
  );
}

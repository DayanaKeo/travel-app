export default function VerifiedPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const email = searchParams?.email;

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">
          ✅
        </div>
        <h1 className="mt-4 text-xl font-semibold">Adresse e-mail vérifiée</h1>
        <p className="mt-2 text-sm text-gray-600">
          {email ? (
            <>
              L’adresse <span className="font-medium">{email}</span> a bien été vérifiée. Tu peux maintenant te
              connecter.
            </>
          ) : (
            <>Ton adresse e-mail a bien été vérifiée. Tu peux maintenant te connecter.</>
          )}
        </p>

        <a
          href="/auth/signin"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Se connecter
        </a>
      </div>
    </main>
  );
}

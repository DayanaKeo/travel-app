
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="min-h-dvh flex flex-col bg-neutral-50">
        <main className="flex-1 mx-auto max-w-6xl w-full px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
  );
}

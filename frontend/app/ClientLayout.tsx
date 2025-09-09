"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader =
    pathname?.startsWith("/auth/signin") || pathname?.startsWith("/auth/signup");

  return (
    <div className="flex min-h-dvh flex-col">
      {!hideHeader && <AppHeader />}
      <main className="flex-1">{children}</main>
      {!hideHeader && <AppFooter />}
    </div>
  );
}

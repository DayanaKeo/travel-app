import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carnet de voyage numérique",
  description: "Gérez vos voyages et étapes facilement",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="fr">
      <body className="min-h-dvh bg-neutral-50 text-neutral-900">
        <Providers>
          <div className="flex min-h-dvh flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <AppFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}

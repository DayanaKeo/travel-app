"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export default function NavPill({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative px-3.5 py-2 rounded-full text-sm transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-red-400",
        active
          ? "text-neutral-900 bg-neutral-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,.04)]"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
      )}
    >
      {children}
      {active && <span aria-hidden className="absolute inset-0 rounded-full ring-1 ring-black/5 pointer-events-none" />}
    </Link>
  );
}

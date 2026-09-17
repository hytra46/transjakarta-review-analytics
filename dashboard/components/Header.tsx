"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { href: "/", label: "Analytics" },
  { href: "/playground", label: "Playground" },
];

export default function Header() {
  const path = usePathname();

  return (
    <header>
      <div className="bg-tj-blue text-tj-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-2xl leading-none tracking-wide">
            <span className="font-semibold">TransJakarta</span>{" "}
            <span className="font-medium opacity-80">App Review Analytics</span>
          </Link>

          <nav className="ml-auto flex gap-1" aria-label="Halaman">
            {menu.map((m) => {
              const aktif = path === m.href;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  aria-current={aktif ? "page" : undefined}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    aktif
                      ? "bg-tj-white font-medium text-tj-blue"
                      : "text-tj-white/80 hover:bg-white/10 hover:text-tj-white"
                  }`}
                >
                  {m.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="pita-koridor" />
    </header>
  );
}

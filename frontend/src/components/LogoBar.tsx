"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function LogoBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/");
  };

  const crumbParts = pathname
    .split("/")
    .filter(Boolean)
    .map((part, idx, arr) => {
      const href = "/" + arr.slice(0, idx + 1).join("/");
      const label =
        part.length > 12 ? `${part.slice(0, 4)}…${part.slice(-3)}` : part;
      return { href, label: part === "app" ? "arena" : part === "bet" ? "duel" : label };
    });

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="text-xl sm:text-2xl font-bold text-white tracking-tight cursor-pointer"
        >
          sol.arena
        </Link>
        <nav className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/50">
          <Link href="/app" className="hover:text-white transition">
            arena
          </Link>
          <span className="text-white/30">/</span>
          <Link href="/create" className="hover:text-white transition">
            host
          </Link>
          <span className="text-white/30">/</span>
          <Link href="/me" className="hover:text-white transition">
            me
          </Link>
        </nav>
      </div>
      {crumbParts.length > 0 && (
        <div className="max-w-7xl mx-auto mt-2 px-1 text-[11px] text-white/50 flex items-center gap-1">
          <Link href="/" className="hover:text-white/80 transition">
            home
          </Link>
          {crumbParts.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              <span className="text-white/30">/</span>
              <Link
                href={crumb.href}
                className={`hover:text-white/80 transition ${
                  idx === crumbParts.length - 1 ? "text-white/80" : ""
                }`}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      )}
    </header>
  );
}

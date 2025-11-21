"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LogoBar() {
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/");
  };

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
      </div>
    </header>
  );
}

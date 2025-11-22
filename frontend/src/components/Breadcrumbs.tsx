"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

const routeMap: Record<string, BreadcrumbItem[]> = {
  "/": [{ label: "Landing", icon: "🏠" }],
  "/app": [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Arena", icon: "🏟️" },
  ],
  "/create": [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Arena", href: "/app", icon: "🏟️" },
    { label: "Create Duel", icon: "⚔️" },
  ],
  "/me": [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Arena", href: "/app", icon: "🏟️" },
    { label: "My Bets", icon: "📊" },
  ],
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname.startsWith("/bet/")) {
      const betId = pathname.split("/")[2];
      return [
        { label: "Home", href: "/", icon: "🏠" },
        { label: "Arena", href: "/app", icon: "🏟️" },
        { label: `Duel ${betId?.slice(0, 8)}...`, icon: "⚔️" },
      ];
    }

    return routeMap[pathname] || [{ label: "Unknown", icon: "❓" }];
  };

  const breadcrumbs = getBreadcrumbs();

  if (pathname === "/") {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-center gap-2 text-sm text-white/60"
    >
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-white/40"
            >
              /
            </motion.span>
          )}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-1.5"
          >
            {item.icon && <span className="text-xs">{item.icon}</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors duration-200 hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-white/90">{item.label}</span>
            )}
          </motion.div>
        </React.Fragment>
      ))}
    </motion.nav>
  );
}

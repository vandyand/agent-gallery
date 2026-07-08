"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Gallery" },
  { href: "/evolution", label: "Evolution" },
  { href: "/lineage", label: "Lineage" },
  { href: "/rejected", label: "Rejected" },
  { href: "/about", label: "How it works" },
];

export function TopBar() {
  const path = usePathname();
  return (
    <header className="topbar">
      <div className="topbar-in">
        <Link href="/" className="brand">
          The Evolving <span className="accent">Gallery</span>
        </Link>
        <nav className="nav">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={active ? "active" : ""}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

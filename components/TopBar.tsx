"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useRun } from "@/components/RunProvider";

const NAV = [
  { href: "/", label: "Gallery" },
  { href: "/evolution", label: "Evolution" },
  { href: "/lineage", label: "Lineage" },
  { href: "/rejected", label: "Rejected" },
  { href: "/about", label: "How it works" },
];

const NEW_DEFAULTS = [
  { name: "Ember", styleDirective: "glowing molten geometric fragments on deep charcoal with a few warm colors" },
  { name: "Frost", styleDirective: "crystalline symmetric ice-blue lattice with delicate white linework" },
  { name: "Verdant", styleDirective: "organic tangled vines and leaf shapes in layered greens with hand-drawn energy" },
];

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const { run, library, selectFeatured, openSaved, newRun } = useRun();
  const [open, setOpen] = useState(false);

  const go = (fn: () => void, target?: string) => {
    fn();
    setOpen(false);
    if (target) router.push(target);
  };

  return (
    <header className="topbar">
      <div className="topbar-in">
        <Link href="/" className="brand">
          The Evolving <span className="accent">Gallery</span>
        </Link>

        {/* run switcher */}
        <div className="switcher">
          <button className="switch-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} title="Switch, fork, or create a run">
            <span className="switch-dot" style={{ background: run?.source === "live" ? "var(--up)" : "var(--gold)" }} />
            <span className="switch-label">Run</span>
            <span className="switch-name">{run ? run.name : "Loading…"}</span>
            <span aria-hidden="true" style={{ color: "var(--faint)" }}>▾</span>
          </button>
          {open && (
            <>
              <div className="switch-backdrop" onClick={() => setOpen(false)} />
              <div className="switch-menu" role="menu">
                <div className="switch-group">Featured</div>
                <button className={`switch-item${run?.source === "featured" ? " active" : ""}`} onClick={() => go(selectFeatured)}>
                  The Evolving Gallery <span className="switch-sub">8 generations</span>
                </button>
                {library.length > 0 && <div className="switch-group">Your runs</div>}
                {library.slice(0, 12).map((r) => (
                  <button
                    key={r.id}
                    className={`switch-item${run?.id === r.id ? " active" : ""}`}
                    onClick={() => go(() => openSaved(r.id))}
                  >
                    {r.name} <span className="switch-sub">{r.gens} gen{r.gens === 1 ? "" : "s"}</span>
                  </button>
                ))}
                <div className="switch-group" />
                <button className="switch-item new" onClick={() => go(() => newRun(NEW_DEFAULTS), "/evolution")}>
                  ＋ New run
                </button>
              </div>
            </>
          )}
        </div>

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

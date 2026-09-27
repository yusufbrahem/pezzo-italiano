"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  href: string;
  label: string;
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop: inline links. Phones: a swipeable strip that keeps the current page in view. */
export default function AdminNav({ links, variant }: { links: NavLink[]; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (variant === "mobile") activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname, variant]);

  if (variant === "desktop") {
    return (
      <nav className="hidden lg:flex items-center gap-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active ? "bg-brand-white/10 text-brand-gold" : "text-brand-white/70 hover:text-brand-gold"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="lg:hidden flex items-center gap-1 overflow-x-auto px-3 pb-2.5 -mt-1 [scrollbar-width:none]">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            ref={active ? activeRef : undefined}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              active ? "bg-brand-gold text-brand-green font-semibold" : "text-brand-white/70 hover:text-brand-gold"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

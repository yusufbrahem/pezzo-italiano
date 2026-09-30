"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  href: string;
  label: string;
  badge?: number; // e.g. proposals waiting for approval
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The admin's page links, on their own row under the header bar (one line per
 * link, never wrapping). When the screen is too narrow for all of them the row
 * scrolls sideways and keeps the current page in view.
 */
export default function AdminNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav className="border-t border-brand-white/10">
      <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto px-3 sm:px-5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              ref={active ? activeRef : undefined}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                active ? "bg-brand-gold text-brand-green font-semibold" : "text-brand-white/75 hover:text-brand-gold hover:bg-brand-white/5"
              }`}
            >
              {link.label}
              {!!link.badge && (
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold leading-5 text-center ${
                    active ? "bg-brand-green text-brand-gold" : "bg-brand-gold text-brand-green"
                  }`}
                  aria-label={`${link.badge} en attente`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

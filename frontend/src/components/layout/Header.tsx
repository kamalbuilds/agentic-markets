"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bot, Store, LayoutDashboard, RefreshCw, Zap, Activity } from "lucide-react";

const navItems = [
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/merchant", label: "Merchant", icon: Store },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
              <Zap className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Agent<span className="text-indigo-400">Market</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href || pathname?.startsWith(href + "/")
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <ConnectButton
          showBalance={true}
          chainStatus="icon"
          accountStatus="address"
        />
      </div>
    </header>
  );
}

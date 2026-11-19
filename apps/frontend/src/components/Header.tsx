"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gavel, PlusCircle, LayoutList, ShieldCheck } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                  AuctionRFQ
                  <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                    British Auction
                  </span>
                </span>
                <p className="text-xs text-slate-500 font-medium">Dynamic Reverse Auction System</p>
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-2">
            <Link
              href="/"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>Auctions</span>
            </Link>

            <Link
              href="/rfqs/new"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all hover:shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create RFQ</span>
            </Link>

            <div className="hidden sm:flex items-center pl-3 border-l border-slate-200 ml-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Backend Isolated
              </span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

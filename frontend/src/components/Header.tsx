import { Crosshair, Github } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-lg blur-sm opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-zinc-900 border border-zinc-700 rounded-lg p-1.5">
                <Crosshair className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-zinc-100 tracking-tight">
                CS2 Prices
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">
                Skin Compare
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <a
              href="https://github.com/francescolaudato/cs2-price-compare"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          {/* Markets badge */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-zinc-600">Comparing</span>
            {["Steam", "Skinport", "Waxpeer", "DMarket"].map((m) => (
              <span
                key={m}
                className="text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

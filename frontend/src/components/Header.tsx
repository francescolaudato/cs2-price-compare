import { Crosshair, Github, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-lg blur-sm opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-secondary border border-border rounded-lg p-1.5">
                <Crosshair className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">
                CS2 Prices
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                Skin Compare
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-4">
            <a
              href="https://github.com/francescolaudato/cs2-price-compare"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-secondary hover:bg-accent transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-zinc-600" />
              )}
            </button>
          </nav>

          {/* Markets badge */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Comparing</span>
            {["Steam", "Skinport", "Waxpeer", "DMarket"].map((m) => (
              <span
                key={m}
                className="text-xs px-2 py-0.5 bg-secondary border border-border rounded-full text-muted-foreground"
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

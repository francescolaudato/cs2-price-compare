import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, ChevronRight } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "./ui/command";
import type { Skin } from "../types";
import { searchItems } from "../lib/api";

interface SearchBarProps {
  onSelect: (skin: Skin) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchItems(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 30,
  });

  const handleSelect = useCallback(
    (skin: Skin) => {
      setQuery("");
      setOpen(false);
      onSelect(skin);
    },
    [onSelect]
  );

  const handleClear = () => {
    setQuery("");
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown =
    open && debouncedQuery.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <Command className="shadow-2xl border-zinc-700 rounded-2xl">
        <div className="relative">
          <CommandInput
            placeholder="Search skins... (e.g. AK-47 Redline, AWP Dragon Lore)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="text-base pr-10"
            wrapperClassName="border-0 px-5 py-1"
          />
          {/* Right icons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isFetching && (
              <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
            )}
            {query && !isFetching && (
              <button
                onClick={handleClear}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </Command>

      {/* Dropdown rendered outside Command to avoid any overflow clipping */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-zinc-700 rounded-xl bg-zinc-900 shadow-2xl overflow-hidden">
          <CommandList>
            {results.length === 0 && !isFetching && (
              <CommandEmpty>
                {debouncedQuery.length >= 2
                  ? `No skins found for "${debouncedQuery}"`
                  : "Type at least 2 characters to search"}
              </CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading={`${results.length} results`}>
                {results.map((skin) => (
                  <CommandItem
                    key={skin.id}
                    onSelect={() => handleSelect(skin)}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    {/* Skin thumbnail */}
                    <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-md bg-zinc-800 border border-zinc-700">
                      <img
                        src={skin.image}
                        alt={skin.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        {skin.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-xs font-medium"
                          style={{ color: skin.rarity?.color || "#aaa" }}
                        >
                          {skin.rarity?.name || ""}
                        </span>
                        {skin.stattrak && (
                          <span className="text-xs text-orange-400 font-medium">
                            • StatTrak
                          </span>
                        )}
                        {skin.wears && skin.wears.length > 0 && (
                          <span className="text-xs text-zinc-500">
                            • {skin.wears.length} wear
                            {skin.wears.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </div>
      )}
    </div>
  );
}

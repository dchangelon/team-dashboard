"use client";

import { useState, useEffect } from "react";
import { useFilterStore } from "@/stores/filter-store";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterBar() {
  const { data } = useDashboardData();
  const { search, member, status, setSearch, setMember, clearAll } =
    useFilterStore();

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  useEffect(() => {
    if (search === "" && searchInput !== "") {
      setSearchInput("");
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = search !== "" || member !== null || status !== null;
  const activeCount = (search ? 1 : 0) + (member ? 1 : 0) + (status ? 1 : 0);

  const teamMembers =
    data?.workloads
      ?.filter((w) => w.memberId !== "__unassigned__")
      .map((w) => ({ id: w.memberId, name: w.memberName })) ?? [];

  return (
    <div className="space-y-2.5">
      {/* Hero search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A8A9B]" />
        <input
          type="text"
          placeholder="Search by project name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search projects by title"
          className={cn(
            "h-12 w-full rounded-lg border bg-white pl-12 pr-10 text-sm text-[#1A1A24]",
            "placeholder:text-[#8A8A9B] shadow-sm",
            "border-[#E0E0E4] transition-all duration-150",
            "focus:outline-none focus:border-[#E8762C] focus:ring-2 focus:ring-[#E8762C]/20",
          )}
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#8A8A9B] transition-colors hover:text-[#5B5B6E]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Secondary row: member filter + clear */}
      <div className="flex items-center gap-3">
        <Select
          value={member ?? "all"}
          onValueChange={(v) => setMember(v === "all" ? null : v)}
        >
          <SelectTrigger
            className="h-8 w-[160px] border-[#E0E0E4] bg-white text-xs text-[#5B5B6E]"
            aria-label="Filter by team member"
          >
            <SelectValue placeholder="All members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-[#5B5B6E] transition-colors hover:text-[#1A1A24]"
          >
            <X className="h-3 w-3" />
            Clear filters
            <span className="ml-0.5 tabular-nums text-[#8A8A9B]">
              ({activeCount})
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

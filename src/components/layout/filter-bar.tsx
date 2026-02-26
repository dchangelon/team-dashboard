"use client";

import { useState, useEffect } from "react";
import { useFilterStore } from "@/stores/filter-store";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export function FilterBar() {
  const { data } = useDashboardData();
  const { search, member, status, setSearch, setMember, clearAll } =
    useFilterStore();

  // Local search input for debouncing
  const [searchInput, setSearchInput] = useState(search);

  // Debounce search input → store
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  // Sync external search resets (e.g., clearAll) back to local input
  useEffect(() => {
    if (search === "" && searchInput !== "") {
      setSearchInput("");
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = search !== "" || member !== null || status !== null;
  const activeCount =
    (search ? 1 : 0) + (member ? 1 : 0) + (status ? 1 : 0);

  // Team members for dropdown (from API data)
  const teamMembers = data?.workloads?.map((w) => ({
    id: w.memberId,
    name: w.memberName,
  })) ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 pr-8"
          aria-label="Search projects by title"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Member filter */}
      <Select
        value={member ?? "all"}
        onValueChange={(v) => setMember(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px]" aria-label="Filter by team member">
          <SelectValue placeholder="All Members" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          {teamMembers.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear filters
          <Badge variant="secondary" className="ml-1.5">
            {activeCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}

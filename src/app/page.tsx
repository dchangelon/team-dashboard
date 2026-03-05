"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useFilterStore } from "@/stores/filter-store";
import { cardMatchesFilters } from "@/lib/filters";
import type { DashboardCard } from "@/lib/types";

import { Header } from "@/components/layout/header";
import { FilterBar } from "@/components/layout/filter-bar";
import { ProgressionTracker } from "@/components/layout/progression-tracker";
import { TeamOverview } from "@/components/workload/team-overview";
import { CardModal } from "@/components/detail/card-modal";
import { ErrorBoundary } from "@/components/error-boundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboardData();
  const { search, member, status } = useFilterStore();

  const [selectedCard, setSelectedCard] = useState<DashboardCard | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredCards = useMemo(() => {
    if (!data) return [];
    return data.cards.filter((card) =>
      cardMatchesFilters(card, search, member, status),
    );
  }, [data, search, member, status]);

  function handleCardClick(card: DashboardCard) {
    setSelectedCard(card);
    setModalOpen(true);
  }

  if (error && !data) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <h2 className="text-base font-semibold text-[#1A1A24]">
              Failed to load dashboard
            </h2>
            <p className="text-sm text-[#8A8A9B]">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden">
        <Header />

        {/* Fixed top zone: filter + pipeline */}
        <div className="shrink-0 border-b border-[#EBEBEF]">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
            <FilterBar />
            <ProgressionTracker cards={data?.cards ?? []} />
          </div>
        </div>

        {/* Scrollable panel zone — fills remaining viewport height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="mx-auto h-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <ErrorBoundary fallbackMessage="Workload section failed to render.">
              <TeamOverview
                cards={filteredCards}
                allCards={data?.cards ?? []}
                workloads={data?.workloads}
                members={data?.members}
                isLoading={isLoading}
                onCardClick={handleCardClick}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <CardModal
        card={selectedCard}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

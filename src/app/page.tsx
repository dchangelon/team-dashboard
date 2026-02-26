"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useFilterStore } from "@/stores/filter-store";
import { cardMatchesFilters } from "@/lib/filters";
import type { DashboardCard } from "@/lib/types";

import { Header } from "@/components/layout/header";
import { FilterBar } from "@/components/layout/filter-bar";
import { ProgressionTracker } from "@/components/layout/progression-tracker";
import { SummaryCards } from "@/components/summary/summary-cards";
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

  // Filters affect workload view, NOT summary cards
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

  // Error state
  if (error && !data) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
            <p className="text-sm text-gray-500">{error.message}</p>
            <Button variant="outline" onClick={() => refetch()}>
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
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
        <SummaryCards summary={data?.summary} isLoading={isLoading} />
        <FilterBar />

        <ProgressionTracker cards={data?.cards ?? []} />

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
      </main>
      <CardModal
        card={selectedCard}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

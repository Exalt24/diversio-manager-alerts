import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { AlertsTable } from "./AlertsTable";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { Filters } from "./Filters";
import { useFilters } from "../hooks/useFilters";
import { ApiClient } from "../services/api";
import type { Alert } from "../types";

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const { filters, updateFilters } = useFilters();
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const fetchAlerts = useCallback(async () => {
    try {
      // Only show skeleton on initial load, not on filter changes
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setRefetching(true);
      }

      const data = await ApiClient.getAlerts(filters);
      setAlerts(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch alerts"
      );
    } finally {
      setInitialLoading(false);
      setRefetching(false);
    }
  }, [filters, initialLoading]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleDismiss = async (alertId: string) => {
    const originalAlerts = [...alerts];
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, status: "dismissed" as const }
          : alert
      )
    );

    try {
      await ApiClient.dismissAlert(alertId);
      toast.success("Alert dismissed");
    } catch (error) {
      setAlerts(originalAlerts);
      toast.error(
        error instanceof Error ? error.message : "Failed to dismiss alert"
      );
    }
  };

  // Only show skeleton on initial page load
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-column justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                Manager Alerts
              </h1>
              <p className="text-slate-400 mt-2">
                Viewing alerts for manager {filters.managerId} (
                {filters.scope === "direct" ? "direct reports" : "full subtree"}
                )
              </p>
            </div>
            <button
              className="bg-[#0f172b] text-white px-6 py-2 my-4 rounded-md hover:bg-[#1d293d]"
              onClick={toggleFilters}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </header>

        {showFilters && (
          <Filters filters={filters} onFiltersChange={updateFilters} />
        )}

        {alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-4 text-sm text-slate-400 flex items-center gap-2">
              Showing {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
              {refetching && (
                <span className="text-blue-400 text-xs">(updating...)</span>
              )}
            </div>
            <div className="bg-slate-900 rounded-lg shadow-xl overflow-hidden border border-slate-800">
              <AlertsTable alerts={alerts} onDismiss={handleDismiss} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

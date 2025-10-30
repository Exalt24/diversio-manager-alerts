import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AlertsTable } from './AlertsTable';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { Filters } from './Filters';
import { useFilters } from '../hooks/useFilters';
import { ApiClient } from '../services/api';
import type { Alert } from '../types';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, updateFilters } = useFilters();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getAlerts(filters);
      setAlerts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleDismiss = async (alertId: string) => {
    const originalAlerts = [...alerts];
    
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'dismissed' as const }
          : alert
      )
    );

    try {
      await ApiClient.dismissAlert(alertId);
      toast.success('Alert dismissed');
    } catch (error) {
      setAlerts(originalAlerts);
      toast.error(error instanceof Error ? error.message : 'Failed to dismiss alert');
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Manager Alerts</h1>
          <p className="text-slate-400 mt-2">
            Viewing alerts for manager {filters.managerId} ({filters.scope === 'direct' ? 'direct reports' : 'full subtree'})
          </p>
        </header>

        

        <Filters filters={filters} onFiltersChange={updateFilters} />

        {alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-4 text-sm text-slate-400">
              Showing {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
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
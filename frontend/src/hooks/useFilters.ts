import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { Filters } from '../types';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<Filters>(() => {
    const managerId = searchParams.get('manager_id') || 'E2';
    const scope = (searchParams.get('scope') as 'direct' | 'subtree') || 'direct';
    const severityParam = searchParams.get('severity');
    const severity = severityParam ? severityParam.split(',') : [];
    const statusParam = searchParams.get('status');
    const status = statusParam ? statusParam.split(',') : [];
    const q = searchParams.get('q') || '';

    return {
      managerId,
      scope,
      severity,
      status,
      q,
    };
  }, [searchParams]);

  const updateFilters = useCallback((newFilters: Filters) => {
    const params = new URLSearchParams();
    
    params.set('manager_id', newFilters.managerId);
    params.set('scope', newFilters.scope);
    
    if (newFilters.severity.length > 0) {
      params.set('severity', newFilters.severity.join(','));
    }
    
    if (newFilters.status.length > 0) {
      params.set('status', newFilters.status.join(','));
    }
    
    if (newFilters.q.trim()) {
      params.set('q', newFilters.q.trim());
    }
    
    setSearchParams(params);
  }, [setSearchParams]);

  return { filters, updateFilters };
}
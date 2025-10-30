import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useFilters } from '../hooks/useFilters';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useFilters Hook', () => {
  it('returns default filters when no URL params', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    expect(result.current.filters).toEqual({
      managerId: 'E2',
      scope: 'direct',
      severity: [],
      status: [],
      q: '',
    });
  });

  it('updates URL params when filters change', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilters({
        managerId: 'E2',
        scope: 'subtree',
        severity: ['high'],
        status: ['open'],
        q: 'Jordan',
      });
    });

    expect(result.current.filters).toEqual({
      managerId: 'E2',
      scope: 'subtree',
      severity: ['high'],
      status: ['open'],
      q: 'Jordan',
    });
  });

  it('parses severity from URL params', () => {
    window.history.pushState(
      {},
      '',
      '?manager_id=E2&scope=direct&severity=high,medium'
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    expect(result.current.filters.severity).toEqual(['high', 'medium']);
  });

  it('parses status from URL params', () => {
    window.history.pushState(
      {},
      '',
      '?manager_id=E2&scope=direct&status=open'
    );

    const { result } = renderHook(() => useFilters(), { wrapper });

    expect(result.current.filters.status).toEqual(['open']);
  });

  it('omits empty filters from URL', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilters({
        managerId: 'E2',
        scope: 'direct',
        severity: [],
        status: [],
        q: '',
      });
    });

    const searchParams = new URLSearchParams(window.location.search);
    expect(searchParams.has('severity')).toBe(false);
    expect(searchParams.has('status')).toBe(false);
    expect(searchParams.has('q')).toBe(false);
  });

  it('trims whitespace from search query', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.updateFilters({
        managerId: 'E2',
        scope: 'direct',
        severity: [],
        status: [],
        q: '  Jordan  ',
      });
    });

    const searchParams = new URLSearchParams(window.location.search);
    expect(searchParams.get('q')).toBe('Jordan');
  });
});
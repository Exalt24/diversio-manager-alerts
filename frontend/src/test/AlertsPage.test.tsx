import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AlertsPage } from '../components/AlertsPage';
import { ApiClient } from '../services/api';
import type { Alert } from '../types';

const mockAlerts: Alert[] = [
  {
    id: 'A1',
    employee: { id: 'E3', name: 'Jordan Lee' },
    severity: 'high',
    category: 'retention',
    created_at: '2025-09-01T09:00:00Z',
    status: 'open',
  },
  {
    id: 'A2',
    employee: { id: 'E4', name: 'Casey Kim' },
    severity: 'medium',
    category: 'engagement',
    created_at: '2025-09-02T09:00:00Z',
    status: 'open',
  },
  {
    id: 'A11',
    employee: { id: 'E4', name: 'Casey Kim' },
    severity: 'high',
    category: 'retention',
    created_at: '2025-09-11T09:00:00Z',
    status: 'open',
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AlertsPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear URL params between tests
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters to high severity only (REQUIRED TEST)', async () => {
    const user = userEvent.setup();
    
    // Mock API to return all alerts initially
    vi.spyOn(ApiClient, 'getAlerts').mockResolvedValue(mockAlerts);

    render(<AlertsPage />, { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    });

    // Verify all 3 alerts are displayed
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getAllByText('Casey Kim')).toHaveLength(2);

    // Mock API to return only high severity alerts
    const highSeverityAlerts = mockAlerts.filter(a => a.severity === 'high');
    vi.spyOn(ApiClient, 'getAlerts').mockResolvedValue(highSeverityAlerts);

    // Click the "high" severity checkbox
    const highCheckbox = screen.getByLabelText('high');
    await user.click(highCheckbox);

    // Wait for filtered results
    await waitFor(() => {
      const caseyElements = screen.queryAllByText('Casey Kim');
      expect(caseyElements).toHaveLength(1); // Only one Casey Kim now (A11)
    });

    // Verify only high severity alerts are shown
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument(); // A1
    expect(screen.getAllByText('Casey Kim')).toHaveLength(1); // A11 only

    // Verify API was called with correct filter
    expect(ApiClient.getAlerts).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: ['high'],
      })
    );
  });

  it('reverts optimistic update on API failure (REQUIRED TEST)', async () => {
    const user = userEvent.setup();

    // Mock initial API call
    vi.spyOn(ApiClient, 'getAlerts').mockResolvedValue(mockAlerts);

    render(<AlertsPage />, { wrapper });

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    });

    // Find dismiss button using aria-label
    const firstDismissButton = screen.getByRole('button', { 
      name: /dismiss alert for jordan lee/i 
    });

    // Verify initial state
    expect(firstDismissButton).toHaveTextContent('Dismiss');

    // Mock API to fail
    const dismissSpy = vi.spyOn(ApiClient, 'dismissAlert').mockRejectedValue(
      new Error('Network error')
    );

    // Click dismiss button
    await user.click(firstDismissButton);

    // Verify API was called
    await waitFor(() => {
      expect(dismissSpy).toHaveBeenCalledWith('A1');
    });

    // The optimistic update makes button show "Dismissed" briefly,
    // then on error it should revert back to "Dismiss"
    // Just wait for the final state after error
    await waitFor(() => {
      expect(firstDismissButton).toHaveTextContent('Dismiss');
      expect(firstDismissButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  it('successfully dismisses alert with optimistic update', async () => {
    const user = userEvent.setup();

    // Mock initial API call
    vi.spyOn(ApiClient, 'getAlerts').mockResolvedValue(mockAlerts);

    render(<AlertsPage />, { wrapper });

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    });

    // Find the first dismiss button using aria-label
    const firstDismissButton = screen.getByRole('button', { 
      name: /dismiss alert for jordan lee/i 
    });

    // Mock API to succeed
    const dismissedAlert = { ...mockAlerts[0], status: 'dismissed' as const };
    vi.spyOn(ApiClient, 'dismissAlert').mockResolvedValue(dismissedAlert);

    // Click dismiss button
    await user.click(firstDismissButton);

    // Verify optimistic update (button shows "Dismissed" and disabled)
    await waitFor(() => {
      expect(firstDismissButton).toHaveTextContent('Dismissed');
      expect(firstDismissButton).toBeDisabled();
    });

    // Verify API was called
    expect(ApiClient.dismissAlert).toHaveBeenCalledWith('A1');
  });

  it('displays loading skeleton initially', () => {
    vi.spyOn(ApiClient, 'getAlerts').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AlertsPage />, { wrapper });

    // Check for loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays empty state when no alerts found', async () => {
    vi.spyOn(ApiClient, 'getAlerts').mockResolvedValue([]);

    render(<AlertsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No alerts found')).toBeInTheDocument();
    });
  });

  it('toggles scope from direct to subtree', async () => {
    const user = userEvent.setup();

    // Mock initial call (direct)
    vi.spyOn(ApiClient, 'getAlerts').mockResolvedValue(mockAlerts);

    render(<AlertsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    });

    // Verify initial scope is direct by checking the header paragraph
    const header = screen.getByText(/viewing alerts for manager/i);
    expect(header).toHaveTextContent('direct reports');

    // Click "Full Subtree" radio
    const subtreeRadio = screen.getByLabelText('Full Subtree');
    await user.click(subtreeRadio);

    // Verify API was called with subtree scope
    await waitFor(() => {
      expect(ApiClient.getAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'subtree',
        })
      );
    });

    // Verify UI updated in header
    expect(header).toHaveTextContent('full subtree');
  });

  it('searches by employee name', async () => {
    const user = userEvent.setup();

    vi.spyOn(ApiClient, 'getAlerts').mockResolvedValue(mockAlerts);

    render(<AlertsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    });

    // Clear the mock to start fresh
    vi.mocked(ApiClient.getAlerts).mockClear();

    const searchInput = screen.getByPlaceholderText('Search by name...');
    await user.type(searchInput, 'J');

    // Wait for API call with the search query
    await waitFor(() => {
      expect(ApiClient.getAlerts).toHaveBeenCalled();
      const lastCall = vi.mocked(ApiClient.getAlerts).mock.calls[
        vi.mocked(ApiClient.getAlerts).mock.calls.length - 1
      ];
      expect(lastCall[0].q).toBe('J');
    });
  });
});
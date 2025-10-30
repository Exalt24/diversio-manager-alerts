import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Filters } from '../components/Filters';
import type { Filters as FiltersType } from '../types';

describe('Filters Component', () => {
  const defaultFilters: FiltersType = {
    managerId: 'E2',
    scope: 'direct',
    severity: [],
    status: [],
    q: '',
  };

  it('renders all filter sections', () => {
    const mockOnChange = vi.fn();
    render(<Filters filters={defaultFilters} onFiltersChange={mockOnChange} />);

    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Employee Search')).toBeInTheDocument();
  });

  it('toggles scope from direct to subtree', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<Filters filters={defaultFilters} onFiltersChange={mockOnChange} />);

    const subtreeRadio = screen.getByLabelText('Full Subtree');
    await user.click(subtreeRadio);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      scope: 'subtree',
    });
  });

  it('toggles severity checkboxes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<Filters filters={defaultFilters} onFiltersChange={mockOnChange} />);

    const highCheckbox = screen.getByLabelText('high');
    await user.click(highCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      severity: ['high'],
    });
  });

  it('removes severity when unchecked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    const filtersWithSeverity: FiltersType = {
      ...defaultFilters,
      severity: ['high', 'medium'],
    };
    render(<Filters filters={filtersWithSeverity} onFiltersChange={mockOnChange} />);

    const highCheckbox = screen.getByLabelText('high');
    await user.click(highCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...filtersWithSeverity,
      severity: ['medium'],
    });
  });

  it('updates search input', async () => {
    const mockOnChange = vi.fn();
    render(<Filters filters={defaultFilters} onFiltersChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'Jordan' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      q: 'Jordan',
    });
  });

  it('toggles status checkboxes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<Filters filters={defaultFilters} onFiltersChange={mockOnChange} />);

    const openCheckbox = screen.getByLabelText('open');
    await user.click(openCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: ['open'],
    });
  });
});
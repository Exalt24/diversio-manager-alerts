import { useState, useEffect } from "react";
import type { Filters as FiltersType } from "../types";

interface FiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  // Local state for search input (updates immediately for responsive typing)
  const [searchValue, setSearchValue] = useState(filters.q);

  // Sync local state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  // Debounce search updates (500ms delay after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.q) {
        onFiltersChange({ ...filters, q: searchValue });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]); // Only watch searchValue, not filters

  const handleScopeChange = (scope: "direct" | "subtree") => {
    onFiltersChange({ ...filters, scope });
  };

  const handleSeverityToggle = (severity: "low" | "medium" | "high") => {
    const newSeverity = filters.severity.includes(severity)
      ? filters.severity.filter((s) => s !== severity)
      : [...filters.severity, severity];
    onFiltersChange({ ...filters, severity: newSeverity });
  };

  const handleStatusToggle = (status: "open" | "dismissed") => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleManagerChange = (managerId: string) => {
    onFiltersChange({ ...filters, managerId });
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6">
      {/* Manager ID Input */}
      <div className="mb-6">
        <label
          htmlFor="manager-id"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Manager ID
        </label>
        <input
          id="manager-id"
          type="text"
          value={filters.managerId}
          onChange={(e) => handleManagerChange(e.target.value)}
          placeholder="E2"
          className="w-full md:w-48 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Scope Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Scope
          </label>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="scope"
                value="direct"
                checked={filters.scope === "direct"}
                onChange={() => handleScopeChange("direct")}
                className="w-4 h-4 text-blue-500 border-slate-600 focus:ring-blue-500 focus:ring-2 bg-slate-800"
              />
              <span className="ml-2 text-sm text-slate-300 group-hover:text-slate-100">
                Direct Reports
              </span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="scope"
                value="subtree"
                checked={filters.scope === "subtree"}
                onChange={() => handleScopeChange("subtree")}
                className="w-4 h-4 text-blue-500 border-slate-600 focus:ring-blue-500 focus:ring-2 bg-slate-800"
              />
              <span className="ml-2 text-sm text-slate-300 group-hover:text-slate-100">
                Full Subtree
              </span>
            </label>
          </div>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Severity
          </label>
          <div className="space-y-2">
            {(["high", "medium", "low"] as const).map((severity) => (
              <label
                key={severity}
                className="flex items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.severity.includes(severity)}
                  onChange={() => handleSeverityToggle(severity)}
                  className="w-4 h-4 text-blue-500 border-slate-600 focus:ring-blue-500 focus:ring-2 rounded bg-slate-800"
                />
                <span className="ml-2 text-sm text-slate-300 group-hover:text-slate-100 capitalize">
                  {severity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Status
          </label>
          <div className="space-y-2">
            {(["open", "dismissed"] as const).map((status) => (
              <label
                key={status}
                className="flex items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => handleStatusToggle(status)}
                  className="w-4 h-4 text-blue-500 border-slate-600 focus:ring-blue-500 focus:ring-2 rounded bg-slate-800"
                />
                <span className="ml-2 text-sm text-slate-300 group-hover:text-slate-100 capitalize">
                  {status}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Employee Search */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-slate-300 mb-3"
          >
            Employee Search
          </label>
          <input
            id="search"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by name..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

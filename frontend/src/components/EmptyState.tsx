export function EmptyState() {
  return (
    <div className="text-center py-16 bg-slate-900 rounded-lg border border-slate-800">
      <svg
        className="mx-auto h-12 w-12 text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-slate-300">No alerts found</h3>
      <p className="mt-2 text-sm text-slate-500">
        Try adjusting your filters to see more results
      </p>
    </div>
  );
}
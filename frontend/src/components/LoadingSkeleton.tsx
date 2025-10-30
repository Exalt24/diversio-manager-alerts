export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="space-y-3">
            <div className="h-8 bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          </div>
          
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700">
              <div className="flex space-x-8">
                <div className="h-4 bg-slate-700 rounded w-24"></div>
                <div className="h-4 bg-slate-700 rounded w-24"></div>
                <div className="h-4 bg-slate-700 rounded w-24"></div>
                <div className="h-4 bg-slate-700 rounded w-24"></div>
                <div className="h-4 bg-slate-700 rounded w-24"></div>
              </div>
            </div>
            
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-slate-800">
                <div className="flex space-x-8">
                  <div className="h-4 bg-slate-800 rounded w-32"></div>
                  <div className="h-4 bg-slate-800 rounded w-24"></div>
                  <div className="h-6 bg-slate-800 rounded w-16"></div>
                  <div className="h-6 bg-slate-800 rounded w-16"></div>
                  <div className="h-4 bg-slate-800 rounded w-24"></div>
                  <div className="h-4 bg-slate-800 rounded w-16 ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
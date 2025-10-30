import type { Alert } from '../types';

interface AlertsTableProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

const severityColors = {
  high: 'bg-red-600 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-slate-400 text-white',
};

export function AlertsTable({ alerts, onDismiss }: AlertsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Employee
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Severity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-900 divide-y divide-slate-700">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-slate-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                {alert.employee.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                {alert.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${severityColors[alert.severity]}`}>
                  {alert.severity}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  alert.status === 'open' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-600 text-slate-300'
                }`}>
                  {alert.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                {formatDate(alert.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onDismiss(alert.id)}
                  disabled={alert.status === 'dismissed'}
                  className={`${
                    alert.status === 'dismissed'
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-blue-400 hover:text-blue-300'
                  } font-medium transition-colors`}
                  aria-label={`Dismiss alert for ${alert.employee.name}`}
                >
                  {alert.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import type { Alert, Filters, ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export class ApiClient {
  private static buildQueryParams(filters: Filters): string {
    const params = new URLSearchParams();
    
    params.append('manager_id', filters.managerId);
    params.append('scope', filters.scope);
    
    if (filters.severity.length > 0) {
      params.append('severity', filters.severity.join(','));
    }
    
    if (filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    
    if (filters.q.trim()) {
      params.append('q', filters.q.trim());
    }
    
    return params.toString();
  }

  static async getAlerts(filters: Filters): Promise<Alert[]> {
    const queryString = this.buildQueryParams(filters);
    const response = await fetch(`${API_BASE_URL}/alerts?${queryString}`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail);
    }
    
    return response.json();
  }

  static async dismissAlert(alertId: string): Promise<Alert> {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/dismiss`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail);
    }
    
    return response.json();
  }
}
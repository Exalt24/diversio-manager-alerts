export interface Employee {
  id: string;
  name: string;
}

export interface Alert {
  id: string;
  employee: Employee;
  severity: 'low' | 'medium' | 'high';
  category: string;
  created_at: string;
  status: 'open' | 'dismissed';
}

export interface Filters {
  managerId: string;
  scope: 'direct' | 'subtree';
  severity: string[];
  status: string[];
  q: string;
}

export interface ApiError {
  detail: string;
}
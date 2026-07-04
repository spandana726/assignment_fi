/** Axios HTTP client configured for the backend API. */

import axios from 'axios';
import type {
  DashboardStats,
  HealthCheck,
  HealthCheckWithURL,
  URLCreatePayload,
  URLRecord,
  URLUpdatePayload,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── URL CRUD ──────────────────────────────────────────────

export async function fetchURLs(): Promise<URLRecord[]> {
  const { data } = await api.get<URLRecord[]>('/urls');
  return data;
}

export async function createURL(payload: URLCreatePayload): Promise<URLRecord> {
  const { data } = await api.post<URLRecord>('/urls', payload);
  return data;
}

export async function updateURL(id: number, payload: URLUpdatePayload): Promise<URLRecord> {
  const { data } = await api.put<URLRecord>(`/urls/${id}`, payload);
  return data;
}

export async function deleteURL(id: number): Promise<void> {
  await api.delete(`/urls/${id}`);
}

// ─── Dashboard & Health Checks ─────────────────────────────

export async function fetchDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard');
  return data;
}

export async function fetchHistory(urlId: number, limit = 50): Promise<HealthCheck[]> {
  const { data } = await api.get<HealthCheck[]>(`/history/${urlId}`, { params: { limit } });
  return data;
}

export async function fetchAllHealthChecks(limit = 100): Promise<HealthCheckWithURL[]> {
  const { data } = await api.get<HealthCheckWithURL[]>('/healthchecks', { params: { limit } });
  return data;
}

export default api;

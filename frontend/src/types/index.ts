/** TypeScript interfaces for the Uptime Monitor application. */

export interface URLRecord {
  id: number;
  url: string;
  created_at: string;
  updated_at: string;
  current_status: string | null;
  http_status: number | null;
  response_time: number | null;
  last_checked: string | null;
  health_percentage: number | null;
}

export interface HealthCheck {
  id: number;
  url_id: number;
  status: string;
  http_status: number | null;
  response_time: number | null;
  timestamp: string;
  error_message: string | null;
}

export interface HealthCheckWithURL extends HealthCheck {
  url: string;
}

export interface DashboardStats {
  total_urls: number;
  healthy_urls: number;
  failed_urls: number;
  avg_response_time: number | null;
  total_health_checks: number;
  last_scan_time: string | null;
}

export interface URLCreatePayload {
  url: string;
}

export interface URLUpdatePayload {
  url: string;
}

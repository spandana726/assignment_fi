/** Health history side panel with mini sparkline and check history. */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Activity, Copy, RotateCw } from 'lucide-react';
import { useHistory } from '@/hooks/useDashboard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTimestamp, formatResponseTime, extractHostname } from '@/lib/utils';
import { toast } from '@/components/Toast';
import type { URLRecord } from '@/types';

interface HealthPanelProps {
  url: URLRecord | null;
  onClose: () => void;
}

/** Mini SVG sparkline for response times. */
function Sparkline({ data }: { data: (number | null)[] }) {
  const values = data.filter((v): v is number => v !== null);
  if (values.length < 2) return <div className="text-xs text-muted-foreground">Not enough data</div>;

  const width = 280;
  const height = 48;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(210, 100%, 60%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(210, 100%, 60%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke="hsl(210, 100%, 60%)" strokeWidth="1.5" />
    </svg>
  );
}

export function HealthPanel({ url, onClose }: HealthPanelProps) {
  const { data: history, isLoading, refetch } = useHistory(url?.id ?? null);

  const copyToClipboard = () => {
    if (url) {
      navigator.clipboard.writeText(url.url);
      toast({ title: 'Copied', description: 'URL copied to clipboard', variant: 'success' });
    }
  };

  return (
    <AnimatePresence>
      {url && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md glass-card z-50 overflow-y-auto scrollbar-thin border-l border-border/50"
          >
            {/* Header */}
            <div className="sticky top-0 glass-card border-t-0 border-x-0 rounded-none p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {extractHostname(url.url)}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{url.url}</p>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => refetch()}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  title="Refresh"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status summary */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={url.current_status} />
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(url.last_checked)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-accent/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Response</p>
                  <p className="text-sm font-semibold text-foreground">{formatResponseTime(url.response_time)}</p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">HTTP</p>
                  <p className="text-sm font-semibold text-foreground">{url.http_status ?? '—'}</p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Health</p>
                  <p className="text-sm font-semibold text-foreground">
                    {url.health_percentage !== null ? `${url.health_percentage}%` : '—'}
                  </p>
                </div>
              </div>

              {/* Sparkline */}
              <div className="bg-accent/20 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Response Time Trend</span>
                </div>
                {history && history.length > 1 ? (
                  <Sparkline data={[...history].reverse().map((h) => h.response_time)} />
                ) : (
                  <div className="text-xs text-muted-foreground py-3 text-center">
                    Waiting for data...
                  </div>
                )}
              </div>

              {/* History list */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Recent Checks</span>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton h-12 rounded-lg" />
                    ))}
                  </div>
                ) : history && history.length > 0 ? (
                  <div className="space-y-1.5">
                    {history.map((check) => (
                      <motion.div
                        key={check.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2.5 bg-accent/20 rounded-lg hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <StatusBadge status={check.status} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {check.http_status ? `HTTP ${check.http_status}` : check.error_message || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-foreground font-medium">
                            {formatResponseTime(check.response_time)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatTimestamp(check.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No health checks yet. Monitoring will start shortly.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

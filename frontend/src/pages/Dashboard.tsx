/** Main Dashboard page — stats cards, URL table, and health panel. */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  CheckCircle2,
  XCircle,
  Timer,
  Activity,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { StatsCard, StatsCardSkeleton } from '@/components/StatsCard';
import { URLTable } from '@/components/URLTable';
import { AddURLDialog } from '@/components/AddURLDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HealthPanel } from '@/components/HealthPanel';
import { useURLs, useDeleteURL } from '@/hooks/useUrls';
import { useDashboard } from '@/hooks/useDashboard';
import { toast } from '@/components/Toast';
import { formatTimestamp } from '@/lib/utils';
import type { URLRecord } from '@/types';

export function Dashboard() {
  const { data: urls, isLoading: urlsLoading, isFetching } = useURLs();
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const deleteURL = useDeleteURL();

  const [editingURL, setEditingURL] = React.useState<URLRecord | null>(null);
  const [deletingURL, setDeletingURL] = React.useState<URLRecord | null>(null);
  const [viewingURL, setViewingURL] = React.useState<URLRecord | null>(null);

  // Live clock
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async () => {
    if (!deletingURL) return;
    try {
      await deleteURL.mutateAsync(deletingURL.id);
      toast({ title: 'URL deleted', description: deletingURL.url, variant: 'success' });
      setDeletingURL(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to delete URL. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  Uptime Monitor
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Auto-refresh indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                {isFetching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                  </motion.div>
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{isFetching ? 'Checking...' : 'Auto-refresh on'}</span>
              </div>

              {/* Live clock */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <Clock className="w-3.5 h-3.5" />
                {now.toLocaleTimeString('en-US', { hour12: false })}
              </div>

              <AddURLDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statsLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total URLs"
                value={stats?.total_urls ?? 0}
                icon={Globe}
                accentColor="text-blue-400"
                delay={0}
              />
              <StatsCard
                title="Healthy"
                value={stats?.healthy_urls ?? 0}
                icon={CheckCircle2}
                accentColor="text-emerald-400"
                delay={0.05}
              />
              <StatsCard
                title="Failed"
                value={stats?.failed_urls ?? 0}
                icon={XCircle}
                accentColor="text-red-400"
                delay={0.1}
              />
              <StatsCard
                title="Avg Response"
                value={stats?.avg_response_time ? `${Math.round(stats.avg_response_time)}ms` : '—'}
                icon={Timer}
                accentColor="text-amber-400"
                delay={0.15}
              />
              <StatsCard
                title="Health Checks"
                value={stats?.total_health_checks ?? 0}
                icon={Activity}
                accentColor="text-purple-400"
                delay={0.2}
              />
              <StatsCard
                title="Last Scan"
                value={formatTimestamp(stats?.last_scan_time ?? null)}
                icon={Clock}
                accentColor="text-cyan-400"
                delay={0.25}
              />
            </>
          )}
        </div>

        {/* URL Table */}
        <URLTable
          urls={urls ?? []}
          isLoading={urlsLoading}
          onEdit={setEditingURL}
          onDelete={setDeletingURL}
          onViewHistory={setViewingURL}
        />
      </main>

      {/* Edit dialog */}
      {editingURL && (
        <AddURLDialog
          editingURL={editingURL}
          onClose={() => setEditingURL(null)}
        />
      )}

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deletingURL}
        onOpenChange={(open) => !open && setDeletingURL(null)}
        onConfirm={handleDelete}
        isLoading={deleteURL.isPending}
        urlName={deletingURL?.url}
      />

      {/* Health history panel */}
      <HealthPanel url={viewingURL} onClose={() => setViewingURL(null)} />
    </div>
  );
}

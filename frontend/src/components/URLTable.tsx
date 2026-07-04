/** Monitored URLs table with search, sort, and actions. */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  ExternalLink,
  Activity,
  Globe,
  Inbox,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTimestamp, formatResponseTime, extractHostname, cn } from '@/lib/utils';
import type { URLRecord } from '@/types';

type SortField = 'url' | 'status' | 'response_time' | 'last_checked' | 'health_percentage';
type SortDir = 'asc' | 'desc';

interface URLTableProps {
  urls: URLRecord[];
  isLoading: boolean;
  onEdit: (url: URLRecord) => void;
  onDelete: (url: URLRecord) => void;
  onViewHistory: (url: URLRecord) => void;
}

export function URLTable({ urls, isLoading, onEdit, onDelete, onViewHistory }: URLTableProps) {
  const [search, setSearch] = React.useState('');
  const [sortField, setSortField] = React.useState<SortField>('last_checked');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary" />
    );
  };

  // Filter and sort
  const filtered = React.useMemo(() => {
    let result = urls;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.url.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'url':
          cmp = a.url.localeCompare(b.url);
          break;
        case 'status':
          cmp = (a.current_status || '').localeCompare(b.current_status || '');
          break;
        case 'response_time':
          cmp = (a.response_time ?? Infinity) - (b.response_time ?? Infinity);
          break;
        case 'last_checked':
          cmp = new Date(a.last_checked || 0).getTime() - new Date(b.last_checked || 0).getTime();
          break;
        case 'health_percentage':
          cmp = (a.health_percentage ?? -1) - (b.health_percentage ?? -1);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [urls, search, sortField, sortDir]);

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="glass-card overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-accent/30 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              {[
                { field: 'url' as SortField, label: 'Website' },
                { field: 'status' as SortField, label: 'Status' },
                { field: 'response_time' as SortField, label: 'Response Time' },
                { field: 'last_checked' as SortField, label: 'Last Checked' },
                { field: 'health_percentage' as SortField, label: 'Health %' },
              ].map(({ field, label }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                >
                  <span className="flex items-center gap-1.5">
                    {label}
                    <SortIcon field={field} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16">
                    <EmptyState hasSearch={!!search.trim()} />
                  </td>
                </tr>
              ) : (
                filtered.map((url) => (
                  <motion.tr
                    key={url.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={() => onViewHistory(url)}
                    className="border-b border-border/30 hover:bg-accent/20 cursor-pointer transition-colors group"
                  >
                    {/* Website */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-accent/50 group-hover:bg-accent transition-colors">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate max-w-[260px]">
                            {extractHostname(url.url)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                            {url.url}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={url.current_status} size="sm" />
                        {url.http_status && (
                          <span className="text-xs text-muted-foreground">{url.http_status}</span>
                        )}
                      </div>
                    </td>

                    {/* Response Time */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono text-foreground">
                        {formatResponseTime(url.response_time)}
                      </span>
                    </td>

                    {/* Last Checked */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(url.last_checked)}
                      </span>
                    </td>

                    {/* Health % */}
                    <td className="px-4 py-3.5">
                      <HealthBar percentage={url.health_percentage} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewHistory(url); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors"
                          title="View history"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors"
                          title="Open URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(url); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(url); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Inline health percentage bar. */
function HealthBar({ percentage }: { percentage: number | null }) {
  if (percentage === null) return <span className="text-sm text-muted-foreground">—</span>;

  const color =
    percentage >= 90
      ? 'bg-emerald-500'
      : percentage >= 70
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-accent/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
      <span className="text-xs font-medium text-foreground">{percentage}%</span>
    </div>
  );
}

/** Empty state illustration. */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 rounded-xl bg-accent/30">
        <Inbox className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {hasSearch ? 'No matching URLs' : 'No URLs monitored yet'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {hasSearch ? 'Try a different search term.' : 'Add your first URL to start monitoring.'}
        </p>
      </div>
    </div>
  );
}

/** Loading skeleton for the table. */
function TableSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="skeleton h-10 rounded-lg" />
      </div>
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

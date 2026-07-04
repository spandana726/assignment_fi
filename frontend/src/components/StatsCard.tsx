/** Animated dashboard stats card with Framer Motion. */

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: string;
  delay?: number;
}

export function StatsCard({ title, value, subtitle, icon: Icon, accentColor = 'text-primary', delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            {title}
          </p>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn('text-2xl font-bold tracking-tight', accentColor)}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg bg-accent/50', accentColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

/** Loading skeleton placeholder for StatsCard. */
export function StatsCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="skeleton h-3 w-20 mb-3" />
          <div className="skeleton h-7 w-16 mb-2" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="skeleton h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

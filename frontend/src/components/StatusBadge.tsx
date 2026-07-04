/** Animated status badge with pulse effects for UP/DOWN/Pending states. */

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isUp = status === 'UP';
  const isDown = status === 'DOWN';
  const isPending = !status;

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'rounded-full inline-block',
          dotSize,
          isUp && 'bg-emerald-500 status-up',
          isDown && 'bg-red-500 status-down',
          isPending && 'bg-yellow-500 status-pending'
        )}
      />
      <span
        className={cn(
          'text-xs font-semibold uppercase tracking-wider',
          isUp && 'text-emerald-400',
          isDown && 'text-red-400',
          isPending && 'text-yellow-400'
        )}
      >
        {isUp ? 'UP' : isDown ? 'DOWN' : 'Pending'}
      </span>
    </div>
  );
}

import { useConnectionStatus } from '@/hooks/useOnlineStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STATE_CONFIG = {
  online: {
    color: 'bg-emerald-500',
    pulse: 'bg-emerald-500/40',
    label: 'Connected',
    description: 'All systems reachable',
  },
  degraded: {
    color: 'bg-amber-500',
    pulse: 'bg-amber-500/40',
    label: 'Degraded',
    description: 'Browser online, Supabase ping failed — retrying',
  },
  offline: {
    color: 'bg-rose-500',
    pulse: 'bg-rose-500/40',
    label: 'Offline',
    description: 'No network — actions will queue until reconnected',
  },
} as const;

export function OnlineIndicator() {
  const status = useConnectionStatus();
  const config = STATE_CONFIG[status];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="relative flex h-2.5 w-2.5 shrink-0 cursor-default"
            aria-label={`Connection status: ${config.label}`}
          >
            {status === 'online' && (
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                  config.pulse
                )}
              />
            )}
            <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', config.color)} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="font-medium">{config.label}</div>
          <div className="text-muted-foreground">{config.description}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

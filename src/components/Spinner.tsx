import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className={cn('flex items-center justify-center gap-2 text-muted-foreground', className)}>
      <Loader2 className={cn(sizeClass, 'animate-spin')} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}

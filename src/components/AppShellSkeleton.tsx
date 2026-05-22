import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state that mirrors the shape of AppLayout —
 * shown while we determine auth status, so the user doesn't
 * see a flash of empty page or "Loading…" text.
 */
export function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background lg:flex">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4 lg:px-6">
          <Skeleton className="h-9 w-9 lg:hidden" />
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="ml-auto h-9 w-9 rounded-full" />
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-5xl space-y-4">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-6 h-64 w-full rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  );
}

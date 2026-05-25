import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { EffectiveColumn } from '@/lib/apply-overrides';
import { DraggableColumn } from './DraggableColumn';

interface ColumnListPaneProps {
  columns: EffectiveColumn[];
}

export function ColumnListPane({ columns }: ColumnListPaneProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return columns;
    return columns.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [columns, query]);

  const dimensions = filtered.filter((c) => c.effectiveRole === 'dimension');
  const measures = filtered.filter((c) => c.effectiveRole === 'measure');

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search columns…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">No columns match "{query}"</p>
        ) : (
          <div className="space-y-4">
            {dimensions.length > 0 && (
              <Section title="Dimensions" count={dimensions.length}>
                {dimensions.map((col) => (
                  <DraggableColumn key={col.name} column={col} />
                ))}
              </Section>
            )}
            {measures.length > 0 && (
              <Section title="Measures" count={measures.length}>
                {measures.map((col) => (
                  <DraggableColumn key={col.name} column={col} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title} ({count})
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

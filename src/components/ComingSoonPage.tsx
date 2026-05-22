import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  shipsDay: number;
  features: string[];
}

export function ComingSoonPage({
  title,
  description,
  icon: Icon,
  shipsDay,
  features,
}: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          Ships Day {shipsDay}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="mt-8 border-t pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What lands on Day {shipsDay}
            </p>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

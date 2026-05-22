import { NavLink } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { NAV_ITEMS } from './nav-items';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4">
      <div>
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )
                  }
                  end={item.to === '/dashboard'}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.shipsDay !== null && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:bg-background">
                      Day {item.shipsDay}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="flex items-center gap-1.5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3 w-3" />
          Recent
        </p>
        <div className="px-3 py-2 text-xs italic text-muted-foreground">
          Nothing yet — uploads, charts, and dashboards will appear here as you work.
        </div>
      </div>
    </nav>
  );
}

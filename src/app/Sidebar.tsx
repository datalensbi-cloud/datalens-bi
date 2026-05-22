import { Database } from 'lucide-react';
import { SidebarNav } from './SidebarNav';

/**
 * Desktop sidebar (hidden on mobile — see TopBar's mobile sheet).
 */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-background lg:flex">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <Database className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">DataLens BI</span>
      </div>
      <SidebarNav />
    </aside>
  );
}

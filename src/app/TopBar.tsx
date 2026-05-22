import { useState } from 'react';
import { Database, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { OnlineIndicator } from './OnlineIndicator';
import { ProfileDropdown } from './ProfileDropdown';
import { SidebarNav } from './SidebarNav';

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-5 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5 text-primary" />
              DataLens BI
            </SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2 lg:hidden">
        <Database className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">DataLens BI</span>
      </div>

      <div className="flex items-center gap-2">
        <OnlineIndicator />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ProfileDropdown />
      </div>
    </header>
  );
}

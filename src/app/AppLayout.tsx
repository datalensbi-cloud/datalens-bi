import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageTransition } from './PageTransition';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <PageTransition />
        </main>
      </div>
    </div>
  );
}

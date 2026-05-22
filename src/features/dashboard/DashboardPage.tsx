import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold tracking-tight">DataLens BI</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Welcome to DataLens BI 👋</CardTitle>
            <CardDescription>
              You are logged in as <span className="font-medium">{user?.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Day 1 complete. Day 2 brings the app shell — sidebar, navigation, dark-mode toggle.
              Day 3 adds file upload. Stay tuned.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

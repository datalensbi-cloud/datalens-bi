import { Upload, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardPage() {
  const { user } = useAuth();

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? null;
  const greeting = fullName ? fullName.split(' ')[0] : 'there';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {greeting} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Your workspace is empty for now — upload a CSV or Excel file to get started.
        </p>
      </div>

      <Card>
        <CardContent className="py-16">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <FileSpreadsheet className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">No files yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Drag in a spreadsheet to preview the data, detect column types, and build your first
              chart in under 3 minutes.
            </p>
            <Button className="mt-6" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Upload your first file
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline h-3 w-3" />
              Upload feature lands Day 3 — button wakes up then.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

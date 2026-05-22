import { useAuth } from '@/features/auth/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, getAvatarColorClass } from '@/hooks/useAvatar';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { user } = useAuth();
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? null;
  const email = user?.email ?? null;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account. Workspace and team settings ship on Day 17.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Account details from your signup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className={cn('text-lg font-semibold text-white', getAvatarColorClass(email))}>
                {getInitials(fullName, email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-base font-medium">{fullName ?? 'Unnamed'}</div>
              <div className="text-sm text-muted-foreground">{email}</div>
            </div>
          </div>

          <Separator />

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Full name" value={fullName ?? '—'} />
            <Field label="Email" value={email ?? '—'} />
            <Field label="User ID" value={user?.id ?? '—'} mono />
            <Field label="Member since" value={memberSince} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace & integrations</CardTitle>
          <CardDescription>Coming Day 17 — branding, invites, roles, billing.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}

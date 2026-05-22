import { Building2 } from 'lucide-react';
import { ComingSoonPage } from '@/components/ComingSoonPage';

export function WorkspacesPage() {
  return (
    <ComingSoonPage
      title="Workspaces"
      description="Bring your team into a shared workspace with company branding and presets."
      icon={Building2}
      shipsDay={17}
      features={[
        'Create a company workspace with name, logo, brand color',
        'Invite teammates by email link (owner / viewer roles)',
        'Brand color cascades into chart palette and PDF exports',
        'Shared column-name aliases and KPI formula library',
        'Per-workspace access control via row-level security',
      ]}
    />
  );
}

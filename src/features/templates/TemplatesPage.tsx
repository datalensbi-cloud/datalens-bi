import { LayoutTemplate } from 'lucide-react';
import { ComingSoonPage } from '@/components/ComingSoonPage';

export function TemplatesPage() {
  return (
    <ComingSoonPage
      title="Templates"
      description="Save an analysis once. Apply it to any structurally-similar dataset."
      icon={LayoutTemplate}
      shipsDay={20}
      features={[
        'Save chart, pivot, or dashboard as a reusable template',
        'Auto-apply via semantic column matching (schema fingerprinting)',
        'Confidence badges: Exact / Fuzzy / Suggested',
        'Private templates or shared workspace library',
        'Apply to new data with one click — no rebuild',
      ]}
    />
  );
}

import { BarChart3 } from 'lucide-react';
import { ComingSoonPage } from '@/components/ComingSoonPage';

export function ChartsPage() {
  return (
    <ComingSoonPage
      title="Charts"
      description="Build bar, line, pie, scatter charts — drag a column to an axis, done."
      icon={BarChart3}
      shipsDay={7}
      features={[
        'Drag-and-drop chart builder powered by Apache ECharts',
        'Bar (grouped + stacked), line (multi-series), pie, scatter',
        'Color palette picker with 6 presets',
        'Title, axis labels, legend toggle',
        'Save chart to workspace, re-open anytime',
      ]}
    />
  );
}

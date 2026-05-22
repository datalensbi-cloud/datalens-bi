import {
  LayoutDashboard,
  FileSpreadsheet,
  BarChart3,
  LayoutTemplate,
  Building2,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Day on which this feature actually ships — null = available now */
  shipsDay: number | null;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shipsDay: null },
  { to: '/files', label: 'Files', icon: FileSpreadsheet, shipsDay: 3 },
  { to: '/charts', label: 'Charts', icon: BarChart3, shipsDay: 7 },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate, shipsDay: 20 },
  { to: '/workspaces', label: 'Workspaces', icon: Building2, shipsDay: 17 },
  { to: '/settings', label: 'Settings', icon: Settings, shipsDay: null },
];

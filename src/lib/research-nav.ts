import {
  LayoutDashboard, Mail, ListTodo, Users, FileText, FolderOpen, Crosshair, Table2,
  Sparkles, Target, Lightbulb, type LucideIcon,
} from 'lucide-react';

export interface ResearchNavItem { to: string; label: string; icon: LucideIcon; exact?: boolean }

/** Sections of the research workspace, in nav order. Shared by the header and the Hub. */
export const RESEARCH_NAV: ResearchNavItem[] = [
  { to: '/research', label: 'Hub', icon: LayoutDashboard, exact: true },
  { to: '/research/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/research/centre', label: 'Correspondence', icon: Mail },
  { to: '/research/people', label: 'People', icon: Users },
  { to: '/research/records', label: 'Records', icon: FileText },
  { to: '/research/clues', label: 'Clues', icon: Lightbulb },
  { to: '/research/matrix', label: 'Matrix', icon: Table2 },
  { to: '/research/triangulate', label: 'Triangulate', icon: Crosshair },
  { to: '/research/documents', label: 'Documents', icon: FolderOpen },
  { to: '/research/assistant', label: 'Assistant', icon: Sparkles },
  { to: '/research/goals', label: 'Goals', icon: Target },
];

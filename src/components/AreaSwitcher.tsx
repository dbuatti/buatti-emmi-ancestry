import { useLocation, Link } from 'react-router-dom';
import { Users, FlaskConical } from 'lucide-react';

/**
 * Phase A shell component: persistent switcher between the Family-facing
 * experience and the Research Workspace. Pure navigation, no state.
 */
export function AreaSwitcher() {
  const { pathname } = useLocation();
  const inFamily = pathname.startsWith('/family');
  const inResearch = pathname.startsWith('/research') || pathname === '/' || pathname.startsWith('/people') || pathname.startsWith('/records') || pathname.startsWith('/research-goals') || pathname.startsWith('/familysearch');

  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors';
  const active = 'bg-[#800020] text-white shadow-sm';
  const inactive = 'text-stone-700 hover:bg-stone-100';

  return (
    <nav aria-label="Area switcher" className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white/70 p-1">
      <Link to="/family" className={`${base} ${inFamily ? active : inactive}`}>
        <Users className="w-3.5 h-3.5" /> Family
      </Link>
      <Link to="/research" className={`${base} ${inResearch && !inFamily ? active : inactive}`}>
        <FlaskConical className="w-3.5 h-3.5" /> Research
      </Link>
    </nav>
  );
}

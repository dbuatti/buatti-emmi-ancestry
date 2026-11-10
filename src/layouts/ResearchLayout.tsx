import { Outlet, Link, useLocation } from 'react-router-dom';
import { AreaSwitcher } from '@/components/AreaSwitcher';
import { RESEARCH_NAV } from '@/lib/research-nav';

/**
 * Shell for every /research page: brand + Family/Research switch on top,
 * section nav underneath. The nav scrolls sideways on a phone instead of
 * wrapping into three rows, and stays highlighted on sub-pages (a record
 * page keeps "Records" lit, a person page keeps "People" lit).
 */
export default function ResearchLayout() {
  const { pathname } = useLocation();
  const isActive = (n: (typeof RESEARCH_NAV)[number]) =>
    n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + '/')
      || (n.to === '/research/people' && pathname.startsWith('/research/familysearch/'));
  return (
    <>
      <header className="bg-[#F4EFE6] border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-3 flex items-center justify-between gap-3">
          <Link to="/research" className="min-w-0">
            <span className="block text-base md:text-lg font-bold text-[#800020] font-serif leading-tight truncate">
              Buatti — Emmi Research
            </span>
            <span className="block text-[11px] text-stone-500 font-sans leading-tight">Private workspace</span>
          </Link>
          <AreaSwitcher />
        </div>
        <div className="max-w-7xl mx-auto px-2 md:px-6">
          <nav
            aria-label="Research sections"
            className="flex gap-1 items-center overflow-x-auto py-2 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {RESEARCH_NAV.map((n) => {
              const active = isActive(n);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-sans font-medium px-3 py-1.5 rounded-md transition-colors ${
                    active ? 'bg-[#800020] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  );
}

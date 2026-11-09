import { Outlet, Link, useLocation } from 'react-router-dom';
import { AreaSwitcher } from '@/components/AreaSwitcher';
import { Users, GitFork, BookOpen, ScrollText } from 'lucide-react';

const NAV = [
  { to: '/family/tree', label: 'Family Tree', icon: GitFork },
  { to: '/family/people', label: 'People', icon: Users },
  { to: '/family/sources', label: 'Records & Sources', icon: ScrollText },
  { to: '/family/stories', label: 'Family Stories', icon: BookOpen },
];

export default function FamilyLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <header className="border-b border-stone-200 bg-[#F4EFE6] py-4 px-4 md:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#800020] font-serif">Buatti — Emmi Family</h1>
            <p className="text-xs text-stone-600 font-sans">Our family history, shared with relatives.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-1">
              {NAV.map((n) => {
                const active = pathname === n.to || pathname.startsWith(n.to + '/');
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors ${
                      active ? 'bg-[#800020] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {n.label}
                  </Link>
                );
              })}
            </nav>
            <AreaSwitcher />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 bg-[#F4EFE6] py-6 px-4 text-center text-xs text-stone-500 font-sans mt-8">
        <p>Buatti — Emmi Ancestry Project • Shared with family</p>
      </footer>
    </div>
  );
}

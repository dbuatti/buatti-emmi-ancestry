import { Users, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_COLOR } from '@/lib/constants';
import type { Person, ResearchLead, OpenQuestion } from '@/types';

interface AppHeaderProps {
  people: Person[];
  leads: ResearchLead[];
  questions: OpenQuestion[];
  onReset: () => void;
  onAddPerson: () => void;
}

export function AppHeader({ people, leads, questions, onReset, onAddPerson }: AppHeaderProps) {
  return (
    <header className="relative border-b border-stone-200 bg-[#F4EFE6] py-8 px-4 md:px-8 shadow-sm overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#800020_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#800020] flex items-center justify-center text-amber-100 shadow-md border-2 border-amber-200/50">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#800020] font-serif">
              Buatti — Emmi Ancestry
            </h1>
            <p className="text-sm md:text-base text-stone-600 font-sans mt-1 max-w-2xl">
              Compiled from passports, civil & ecclesiastical records, National Archives of Australia, and family recollections. Merged & consolidated June 2026.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          <a
            href="/research-goals"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans font-medium border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" /> Research Goals
          </a>
          <Button
            variant="outline"
            onClick={onReset}
            className="font-sans text-xs border-stone-300 hover:bg-stone-100 text-stone-700"
          >
            Reset to Original
          </Button>
          <Button
            onClick={onAddPerson}
            className="bg-[#800020] hover:bg-[#600018] text-white font-sans text-sm flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Ancestor
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-stone-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center md:text-left">
        <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
          <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Total Records</span>
          <span className="text-xl font-bold text-[#800020]">{people.length} Individuals</span>
        </div>
        <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
          <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Generations</span>
          <span className="text-xl font-bold text-[#800020]">{people.length > 0 ? new Set(people.map(p => p.generation)).size : 0} Generations</span>
        </div>
        <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
          <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Open Questions</span>
          <span className="text-xl font-bold text-amber-700">{questions.filter(q => q.status !== 'Resolved').length} Active</span>
        </div>
        <div className="bg-[#FAF6F0]/80 p-3 rounded-lg border border-stone-200/40">
          <span className="block text-xs text-stone-500 font-sans uppercase tracking-wider">Research Leads</span>
          <span className="text-xl font-bold text-emerald-800">{leads.filter(l => l.status === 'To Investigate' || l.status === 'In Progress').length} Open</span>
        </div>
      </div>
    </header>
  );
}

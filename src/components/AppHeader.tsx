import { useState } from 'react';
import { Users, Plus, BookOpen, Copy, Check } from 'lucide-react';
import { AreaSwitcher } from '@/components/AreaSwitcher';
import { Button } from '@/components/ui/button';
import { BRAND_COLOR } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { buildFamilyTreeExport } from '@/lib/exportFamilyTree';
import type { Person, ResearchLead, OpenQuestion } from '@/types';

interface AppHeaderProps {
  people: Person[];
  leads: ResearchLead[];
  questions: OpenQuestion[];
  onReset: () => void;
  onAddPerson: () => void;
}

export function AppHeader({ people, leads, questions, onReset, onAddPerson }: AppHeaderProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  /** One-click: whole tree as plain text on the clipboard, ready to paste into Claude. */
  const handleCopyTree = async () => {
    const text = buildFamilyTreeExport(people, leads, questions);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts (plain http / older Safari).
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.top = '-10000px';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
      toast({
        title: 'Family tree copied',
        description: `${people.length} people, ${text.length.toLocaleString()} characters. Paste into Claude — or run "pnpm export:tree" for the family-tree-export.md file.`,
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Run "pnpm export:tree" in the project folder to write family-tree-export.md instead.',
        variant: 'destructive',
      });
    }
  };

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
        <div className="flex flex-wrap gap-3 justify-end items-center">
          <AreaSwitcher />
          <a
            href="/research-goals"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans font-medium border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" /> Research Goals
          </a>
          <Button
            variant="outline"
            onClick={handleCopyTree}
            title="Copies the whole tree as plain text, grouped by family line — ready to paste into Claude"
            className="font-sans text-xs border-stone-300 hover:bg-stone-100 text-stone-700 flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy family tree'}
          </Button>
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

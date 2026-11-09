import { AreaSwitcher } from '@/components/AreaSwitcher';
import { Button } from '@/components/ui/button';
import { GitFork, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Phase A: minimal Family-area entry point. Content arrives in Phase B.
 * Intentionally read-only and free of research internals.
 */
const FamilyArea = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <header className="border-b border-stone-200 bg-[#F4EFE6] py-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#800020] font-serif">Buatti — Emmi Family</h1>
            <p className="text-sm text-stone-600 font-sans mt-1">A family-facing view of our ancestry. Research tools live in the Research area.</p>
          </div>
          <AreaSwitcher />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-6">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-serif text-[#800020] mb-2">Family area — coming in Phase B</h2>
          <p className="text-sm text-stone-600 font-sans">
            This area will hold the family tree, people directory, family profiles, verified records and family stories.
            Until then, the full (research) tree is available below.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={() => navigate('/')} className="bg-[#800020] text-white font-sans text-sm">
              <GitFork className="w-4 h-4 mr-2" /> Open family tree
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="font-sans text-sm">
              <Users className="w-4 h-4 mr-2" /> People directory
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FamilyArea;

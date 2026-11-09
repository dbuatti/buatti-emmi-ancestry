import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { initialPeople, initialOpenQuestions } from '@/data/familyDataWrapper';
import { AncestorsDirectory } from '@/components/AncestorsDirectory';
import { calculateCompleteness } from '@/lib/research';

const FamilyPeople = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const filteredPeople = useMemo(() => {
    const filtered = initialPeople.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.birthPlace && p.birthPlace.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.occupations && p.occupations.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesLine = lineFilter === 'all' || p.line === lineFilter;
      const matchesGen = genFilter === 'all' || p.generation === Number(genFilter);
      return matchesSearch && matchesLine && matchesGen;
    });
    if (sortBy === 'priority' || sortBy === 'completeness') {
      const scores = new Map(filtered.map((p) => [p.id, calculateCompleteness(p, initialOpenQuestions).score]));
      filtered.sort((a, b) => {
        const diff = (scores.get(a.id) ?? 0) - (scores.get(b.id) ?? 0);
        return sortBy === 'completeness' ? -diff : diff;
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [searchQuery, lineFilter, genFilter, sortBy]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#800020] font-serif">People</h2>
        <p className="text-xs text-stone-500 font-sans">Search and browse family members.</p>
      </div>
      <AncestorsDirectory
        filteredPeople={filteredPeople}
        searchQuery={searchQuery}
        lineFilter={lineFilter}
        genFilter={genFilter}
        sortBy={sortBy}
        onSearchChange={setSearchQuery}
        onLineFilterChange={setLineFilter}
        onGenFilterChange={setGenFilter}
        onSortChange={setSortBy}
        onSelectPerson={(id) => navigate(`/family/people/${id}`)}
        onNavigateToTree={() => navigate('/family/tree')}
      />
    </div>
  );
};

export default FamilyPeople;

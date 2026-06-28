import { Search, Users, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLineBadgeColor, GENERATIONS, LINE_NAMES } from '@/lib/constants';
import { calculateCompleteness, getScoreBadgeColor, getScoreLabel } from '@/lib/research';
import type { Person } from '@/types';

interface AncestorsDirectoryProps {
  filteredPeople: Person[];
  searchQuery: string;
  lineFilter: string;
  genFilter: string;
  sortBy: string;
  onSearchChange: (query: string) => void;
  onLineFilterChange: (line: string) => void;
  onGenFilterChange: (gen: string) => void;
  onSortChange: (sort: string) => void;
  onSelectPerson: (id: string) => void;
  onNavigateToTree: () => void;
}

export function AncestorsDirectory({
  filteredPeople, searchQuery, lineFilter, genFilter, sortBy,
  onSearchChange, onLineFilterChange, onGenFilterChange, onSortChange,
  onSelectPerson, onNavigateToTree,
}: AncestorsDirectoryProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#F4EFE6] border border-stone-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search ancestors by name, birth place, occupation..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 bg-white border-stone-300 font-sans"
          />
        </div>
        <div>
          <Select value={lineFilter} onValueChange={onLineFilterChange}>
            <SelectTrigger className="bg-white border-stone-300 font-sans">
              <SelectValue placeholder="Filter by Line" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              <SelectItem value="all">All Family Lines</SelectItem>
              {LINE_NAMES.map(line => (
                <SelectItem key={line} value={line}>{line} Line</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={genFilter} onValueChange={onGenFilterChange}>
            <SelectTrigger className="bg-white border-stone-300 font-sans">
              <SelectValue placeholder="Filter by Generation" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              <SelectItem value="all">All Generations</SelectItem>
              {GENERATIONS.map(gen => (
                <SelectItem key={gen.value} value={gen.value}>{gen.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="bg-white border-stone-300 font-sans">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              <SelectItem value="name">Sort: Name A–Z</SelectItem>
              <SelectItem value="priority">Sort: Priority (lowest first)</SelectItem>
              <SelectItem value="completeness">Sort: Most complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.map(person => (
          <Card key={person.id}
            onClick={() => { onSelectPerson(person.id); onNavigateToTree(); }}
            className="border-stone-300 bg-[#FAF6F0] hover:border-[#800020] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge className={getLineBadgeColor(person.line)}>
                  {person.line} Line
                </Badge>
                <Badge variant="outline" className="font-sans text-[10px]">
                  Gen {person.generation}
                </Badge>
              </div>
              <CardTitle className="text-xl font-serif text-[#800020] mt-2 flex items-center gap-1.5">
                {person.name}
                <span className="text-xs text-stone-500 font-sans">
                  ({person.gender === 'M' ? 'Male' : 'Female'})
                </span>
              </CardTitle>
              <CardDescription className="font-sans text-xs text-stone-600">
                {person.birthDate || 'Unknown'} – {person.deathDate || (person.isLiving ? 'Living' : 'Unknown')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2 pt-0">
              {person.birthPlace && (
                <p className="text-xs text-stone-700"><strong>Birthplace:</strong> {person.birthPlace}</p>
              )}
              {person.occupations && person.occupations.length > 0 && (
                <p className="text-xs text-stone-700"><strong>Occupation:</strong> {person.occupations.join(', ')}</p>
              )}
              {person.notes && person.notes.length > 0 && (
                <p className="text-xs text-stone-600 line-clamp-2 italic">"{person.notes[0]}"</p>
              )}
            </CardContent>
            <div className="p-3 bg-stone-100/60 border-t border-stone-200/60 flex justify-between items-center text-xs font-sans text-stone-500">
              <div className="flex items-center gap-2">
                <Badge className={getScoreBadgeColor(calculateCompleteness(person).score) + ' text-[9px]'}>
                  {calculateCompleteness(person).score}%
                </Badge>
                <span>Status: <strong>{person.researchStatus.status}</strong></span>
              </div>
              <span className="text-[#800020] hover:underline flex items-center gap-0.5">
                View Profile <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Card>
        ))}
        {filteredPeople.length === 0 && (
          <div className="col-span-full text-center py-12 bg-[#F4EFE6] border border-stone-200 rounded-xl">
            <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <p className="text-lg font-bold text-stone-700">No ancestors match your search.</p>
            <p className="text-sm text-stone-500 font-sans mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

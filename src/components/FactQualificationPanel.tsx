import { useState } from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Person } from '@/types';

interface Fact {
  label: string;
  value: string | undefined;
  source?: string;
  recordId?: string;
  verified?: boolean;
}

interface FactQualificationPanelProps {
  person: Person;
  records: Map<string, { id: string }>;
  onNavigateToRecord?: (recordId: string) => void;
}

export function FactQualificationPanel({ person, records, onNavigateToRecord }: FactQualificationPanelProps) {
  const [verifiedFacts, setVerifiedFacts] = useState<Set<string>>(new Set());

  const facts: Fact[] = [
    { label: 'Birth date', value: person.birthDate, source: person.records?.find((r) => r.type === 'Birth Record')?.status, recordId: person.lifeEvents?.find((e) => e.type === 'birth')?.recordId },
    { label: 'Birth place', value: person.birthPlace, source: person.records?.find((r) => r.type === 'Birth Record')?.status, recordId: person.lifeEvents?.find((e) => e.type === 'birth')?.recordId },
    { label: 'Death date', value: person.deathDate, source: person.records?.find((r) => r.type === 'Death Record')?.status, recordId: person.lifeEvents?.find((e) => e.type === 'death')?.recordId },
    { label: 'Death place', value: person.deathPlace, source: person.records?.find((r) => r.type === 'Death Record')?.status, recordId: person.lifeEvents?.find((e) => e.type === 'death')?.recordId },
    { label: 'Burial place', value: person.burialPlace, source: person.records?.find((r) => r.type === 'Burial Record')?.status, recordId: person.lifeEvents?.find((e) => e.type === 'burial')?.recordId },
    { label: 'Father', value: person.parents?.[0], source: 'Parent record' },
    { label: 'Mother', value: person.parents?.[1], source: 'Parent record' },
    { label: 'Spouse(s)', value: person.spouses?.join(', '), source: 'Marriage record', recordId: person.lifeEvents?.find((e) => e.type === 'marriage')?.recordId },
  ].filter((f) => f.value);

  const toggleVerified = (label: string) => {
    setVerifiedFacts((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const allVerified = facts.length > 0 && facts.every((f) => verifiedFacts.has(f.label));
  const verifiedCount = facts.filter((f) => verifiedFacts.has(f.label)).length;

  // Self-doubting suggestions
  const suggestions: string[] = [];
  if (!person.birthDate) suggestions.push('Birth date is missing — consider searching BDM indexes or parish baptism records.');
  if (!person.deathDate) suggestions.push('Death date is missing — consider cemetery databases or death indexes.');
  if (!person.parents || person.parents.length === 0) suggestions.push('Parents unknown — consider birth/baptism records or stato di famiglia.');
  if (!person.familySearchId) suggestions.push('No FamilySearch ID — cross-check against FamilySearch for additional perspective.');
  if (person.records?.some((r) => r.status === 'Searching')) suggestions.push('Some records still searching — try Antenati (Italian civil archives) or NAA (Australian records).');
  if (person.records?.some((r) => r.status === 'Not Found')) suggestions.push('Some records marked Not Found — consider alternative sources (parish records, census, passenger lists).');

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Fact Qualification
          <Badge variant="outline" className="text-xs ml-2">
            {verifiedCount}/{facts.length} verified
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {facts.length === 0 ? (
          <p className="text-xs text-stone-500 font-sans">No facts to qualify for this person.</p>
        ) : (
          <div className="space-y-2">
            {facts.map((fact) => {
              const isVerified = verifiedFacts.has(fact.label);
              const hasRecord = fact.recordId && records.has(fact.recordId);
              return (
                <div
                  key={fact.label}
                  className={`flex items-center justify-between gap-2 rounded border p-2 text-xs font-sans ${
                    isVerified ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-700">{fact.label}</div>
                    <div className="text-stone-600">{fact.value}</div>
                    {fact.source && (
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Source: {fact.source}
                        {hasRecord && (
                          <button
                            className="ml-1 text-[#800020] underline"
                            onClick={() => fact.recordId && onNavigateToRecord?.(fact.recordId)}
                          >
                            <FileText className="w-3 h-3 inline" /> {fact.recordId}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleVerified(fact.label)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isVerified ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                    }`}
                    title={isVerified ? 'Verified — click to unverify' : 'Click to verify'}
                  >
                    {isVerified ? <CheckCircle2 className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {allVerified && facts.length > 0 && (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700 font-sans flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> All facts verified for this person.
          </div>
        )}

        {/* Self-doubting cross-reference suggestions */}
        {suggestions.length > 0 && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 font-sans">
              <AlertCircle className="w-4 h-4" /> Cross-reference suggestions
            </div>
            {suggestions.map((s, i) => (
              <p key={i} className="text-[10px] text-amber-700 font-sans">→ {s}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FactQualificationPanel;

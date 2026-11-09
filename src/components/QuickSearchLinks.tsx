import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  name: string;
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.replace(/\([^)]*\)/g, '').trim().split(/\s+/);
  if (parts.length === 1) return { first: '', last: parts[0] };
  return { first: parts[0], last: parts[parts.length - 1] };
}

export function QuickSearchLinks({ name }: Props) {
  const { first, last } = splitName(name);
  const q = encodeURIComponent(`${first} ${last}`.trim());
  const links = [
    {
      label: 'NAA RecordSearch',
      url: `https://recordsearch.naa.gov.au/SearchNRetrieve/Search/SearchResults.aspx?txt_search=${encodeURIComponent(last + ' ' + first)}`,
    },
    {
      label: 'Find a Grave',
      url: `https://www.findagrave.com/memorial/search?firstname=${encodeURIComponent(first)}&lastname=${encodeURIComponent(last)}`,
    },
    {
      label: 'Cemetery (Borgo Solestà)',
      url: 'https://www.comune.ascoli-piceno.it/it/servizi/cimitero', // placeholder landing; search form is POST
    },
    {
      label: 'Antenati (Ascoli Piceno)',
      url: `https://antenati.cultura.gov.it/search/?q=${q}`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Button key={l.label} variant="outline" size="sm" asChild className="text-xs">
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" /> {l.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
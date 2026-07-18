import { useMemo } from 'react';
import { BadgeCheck } from 'lucide-react';
import type { Person } from '@/types';

interface TreeConnectedProps {
  people: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
}

const LINE_DOT: Record<string, string> = {
  Buatti: '#800020',
  Chiappini: '#b45309',
  Emmi: '#065f46',
  Patanè: '#1e3a5f',
};

const LINE_HEX: Record<string, string> = {
  Buatti: '#800020',
  Chiappini: '#b45309',
  Emmi: '#065f46',
  Patanè: '#1e3a5f',
};

const CARD_W = 190;
const CARD_H = 62;
const GEN_GAP = 100;
const ROW_GAP = 16;

function cleanDate(d: string | undefined): string {
  if (!d) return '';
  const c = d.replace(/\s*\(.*?\)\s*/g, '').trim();
  return c.replace(/^Unknown\s*[—–-]\s*(likely\s+)?/i, '~');
}

interface LayoutNode {
  person: Person;
  x: number;
  y: number;
  gen: number;
}

function buildLayout(people: Person[]): LayoutNode[] {
  const directIds = new Set([
    'daniele-buatti', 'roberto-buatti', 'stefano-buatti', 'marco-buatti',
    'alfred-buatti', 'venera-buatti',
    'ezio-buatti', 'bruna-lilia-chiappini', 'gregorio-emmi', 'rosaria-patane',
    'alfredo-buatti-sr', 'ida-galanti', 'remo-chiappini', 'irma-pirri',
    'egidio-emmi', 'concetta-sgroi', 'rosario-patane-sr', 'venera-vecchio',
    'giovanni-buatti', 'emidia-bruni',
    'antonino-emmi', 'rosaria-nasti', 'gregorio-sgroi', 'santa-cali',
    'sebastiano-patane-sr', 'rosaria-dagata', 'vincenzo-vecchio', 'rosaria-raciti',
    'emidio-buatti', 'antonia-lenzi', 'antonino-emmi-sr', 'nunzia-pavone',
    'antonio-galanti', 'virginia-rosati',
    'domenico-galanti', 'feliciani-angela-maria', 'luigi-rosati', 'filippini',
    'domenico-lenzi', 'luigia', 'antonio-bruni', 'sperandia-pasqualini',
    'luigi-galanti', 'vincenza-michetti',
  ]);

  const filtered = people.filter(p => directIds.has(p.id));
  const gens = [...new Set(filtered.map(p => p.generation))].sort((a, b) => a - b);

  if (gens.length === 0) return [];

  const byGen: Record<number, Person[]> = {};
  for (const p of filtered) {
    if (!byGen[p.generation]) byGen[p.generation] = [];
    byGen[p.generation].push(p);
  }

  const nodes: LayoutNode[] = [];
  for (const gen of gens) {
    const list = byGen[gen] || [];
    const genIndex = gens.indexOf(gen);
    const x = genIndex * (CARD_W + GEN_GAP);
    list.forEach((person, i) => {
      const y = i * (CARD_H + ROW_GAP);
      nodes.push({ person, x, y, gen });
    });
  }

  // Center each generation vertically
  const genHeights: Record<number, number> = {};
  for (const node of nodes) {
    if (!genHeights[node.gen]) genHeights[node.gen] = 0;
    genHeights[node.gen] = Math.max(genHeights[node.gen], node.y + CARD_H + ROW_GAP);
  }
  const maxHeight = Math.max(...Object.values(genHeights), 1);
  for (const node of nodes) {
    const h = genHeights[node.gen] || 1;
    node.y = node.y + (maxHeight - h) / 2;
  }

  return nodes;
}

export function TreeConnected({ people, selectedPersonId, onSelectPerson }: TreeConnectedProps) {
  const layout = useMemo(() => buildLayout(people), [people]);

  if (layout.length === 0) {
    return <div className="text-center py-10 text-stone-500">No data to display.</div>;
  }

  const svgW = layout.length > 0 ? Math.max(...layout.map(n => n.x)) + CARD_W + 40 : 400;
  const svgH = layout.length > 0 ? Math.max(...layout.map(n => n.y)) + CARD_H + 40 : 400;

  // Build connection edges
  const edges: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  for (const node of layout) {
    const p = node.person;
    // Parent-child edges
    for (const pid of p.parents) {
      const parent = layout.find(n => n.person.id === pid);
      if (parent) {
        const x1 = parent.x + CARD_W;
        const y1 = parent.y + CARD_H / 2;
        const x2 = node.x;
        const y2 = node.y + CARD_H / 2;
        const cx = (x1 + x2) / 2;
        edges.push({
          x1, y1, x2: cx, y2: y1, color: LINE_HEX[p.line] || '#999'
        });
        edges.push({
          x1: cx, y1: y1, x2: cx, y2: y2, color: LINE_HEX[p.line] || '#999'
        });
        edges.push({
          x1: cx, y1: y2, x2, y2, color: LINE_HEX[p.line] || '#999'
        });
      }
    }
    // Spouse edges
    for (const sid of p.spouses) {
      const spouse = layout.find(n => n.person.id === sid);
      if (spouse && spouse.y === node.y && spouse.x > node.x) {
        edges.push({
          x1: node.x + CARD_W, y1: node.y + CARD_H / 2,
          x2: spouse.x, y2: spouse.y + CARD_H / 2,
          color: '#a8a29e',
        });
      }
    }
  }

  return (
    <div className="bg-[#F4EFE6] border border-stone-200 rounded-xl p-4 shadow-inner overflow-auto">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-[#800020] tracking-wide">Connected Pedigree</h3>
        <p className="text-xs text-stone-500 font-sans">Left-to-right pedigree with marriage and descent lines.</p>
      </div>
      <svg width={svgW} height={svgH} className="mx-auto">
        {/* Edges */}
        {edges.map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.color} strokeWidth={1.5} strokeDasharray={e.color === '#a8a29e' ? '4,3' : 'none'}
            opacity={0.5}
          />
        ))}
        {/* Nodes */}
        {layout.map(node => {
          const p = node.person;
          const selected = p.id === selectedPersonId;
          const dot = LINE_DOT[p.line] || '#999';
          const confirmed = p.birthDate && p.deathDate && (p.parents.length > 0 || p.children.length > 0);
          const bd = cleanDate(p.birthDate);
          const dd = cleanDate(p.deathDate);
          return (
            <g key={p.id} onClick={() => onSelectPerson(p.id)} className="cursor-pointer">
              <rect
                x={node.x} y={node.y} width={CARD_W} height={CARD_H} rx={6}
                fill={selected ? dot : '#fff'} stroke={selected ? dot : dot} strokeWidth={selected ? 2 : 1}
                className="transition-all duration-200 hover:opacity-80"
              />
              {/* Verified badge */}
              {confirmed && (
                <g transform={`translate(${node.x + CARD_W - 16}, ${node.y - 6})`}>
                  <circle r="8" fill="#fff" />
                  <BadgeCheck x={-6} y={-6} width={12} height={12} className="text-emerald-600" />
                </g>
              )}
              {/* Line dot */}
              <circle cx={node.x + 10} cy={node.y + CARD_H / 2} r={4} fill={dot} />
              {/* Card content via foreignObject for proper text wrapping */}
              <foreignObject x={node.x + 18} y={node.y + 6} width={CARD_W - 22} height={CARD_H - 12}>
                <div className={`w-full h-full text-[11px] font-sans leading-tight overflow-hidden ${selected ? 'text-white' : 'text-stone-800'}`}>
                  <p className="font-bold truncate">{p.name}</p>
                  <p className={`text-[10px] ${selected ? 'text-white/80' : 'text-stone-500'}`}>
                    {bd || '?'}{dd ? ` – ${dd}` : p.isLiving ? ' – Living' : ''}
                  </p>
                  {p.occupations?.[0] && (
                    <p className={`text-[9px] italic truncate ${selected ? 'text-white/60' : 'text-stone-400'}`}>{p.occupations[0]}</p>
                  )}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 mt-4 text-[10px] text-stone-500 font-sans">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-px bg-stone-400" /> Parent-child</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-px border-t border-dashed border-stone-400" /> Marriage</span>
      </div>
    </div>
  );
}
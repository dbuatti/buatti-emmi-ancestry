import { BookOpen, ScrollText, Users, ArrowRight, Link as LinkIcon } from 'lucide-react';

interface EvidenceNode {
  id: string;
  label: string;
  source: string;
  note?: string;
}

interface EvidenceLink {
  from: string;
  to: string;
  via: string;
  source: string;
  date: string;
  notes?: string;
}

const nodes: EvidenceNode[] = [
  { id: 'antonino-emmi', label: 'Antonino Emmi', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59 — listed as "fu Antonino"', note: 'Died before 8 Sep 1900. Possibly son of Giuseppe Emmi (pencil theory).' },
  { id: 'rosaria-raiti', label: 'Rosaria Raiti', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59 — listed as mother "Raiti Rosaria"', note: 'Surname confirmed as Raiti (not Raciti/Rapisardi). Living at time of Egidio\'s marriage.' },
  { id: 'salvatore-sgroi', label: 'Salvatore Sgroi', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59 — listed as father of Concetta', note: 'Living at time of Concetta\'s marriage. Born ~1850s-60s.' },
  { id: 'santa-cali', label: 'Santa Cali', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59 — listed as mother "Cali Santa"', note: 'Living at time of Concetta\'s marriage.' },
  { id: 'egidio-emmi', label: 'Egidio Emmi (~1870 – pre-1943)', source: 'Marriage Proclamation atto № 59: age 30 on 8 Sep 1900 → born ~1869/1870. POW report (1943) shows "DEC" = deceased.', note: 'Farmer (contadino). Illiterate. NOT the same as Egidio Emmi (b. ~1855) who married Angela Raiti in 1895 — same father Antonino, different mother (Rosa Vecchio vs Rosaria Raiti), likely half-brothers.' },
  { id: 'concetta-sgroi', label: 'Concetta Sgroi (~1880 – pre-1967)', source: 'Marriage Proclamation atto № 59: age 20 on 8 Sep 1900 → born ~1879/1880. Later church records show deceased by 1967.', note: 'Farmer (contadina). Illiterate. Maiden name Sgroi confirmed via Gregorio\'s 1943 POW report.' },
  { id: 'gregorio-emmi', label: 'Gregorio Emmi (1915–1979)', source: 'Civil birth extract atto n. 202 (23 Oct 1915). Also parish baptism 5 Dec 1915 (DGS 5455112, entry N.251) — 4-day discrepancy. Death notice SMH 30 Nov 1979 (Ryerson).', note: 'Born 23 Oct 1915 (civil) / 27 Oct 1915 (baptism), Linguaglossa. Died 24 Nov 1979, Stanmore NSW. POW in WWII. Married Rosaria Patanè 7 Jul 1948 Fiumefreddo. Emigrated Australia 1950. Naturalised 26 Jan 1961.' },
  { id: 'sebastiano-patane-sr', label: 'Sebastiano Patanè', source: 'Calatabiano civil birth 1889, atto n. 28 — listed as father (age 39, castaldo). Also in Fiumefreddo marriage banns 1911.', note: 'Resident of Calatabiano. Father of Rosario, Giuseppe, and Venera Patanè.' },
  { id: 'rosaria-dagata', label: 'Rosaria D\'Agata', source: 'Calatabiano civil birth 1889, atto n. 28 — listed as mother. Also in Fiumefreddo marriage banns 1911.', note: 'From Fiumefreddo. Died before 1911 (not listed in later records).' },
  { id: 'vincenzo-vecchio', label: 'Vincenzo Vecchio', source: 'Fiumefreddo baptism 1888 — listed as father of Venera. Also in marriage processetti 1911.', note: 'Son of Gregorio Vecchio + Anna D\'Agostino (per 1857 marriage proclamation index).' },
  { id: 'rosaria-raciti', label: 'Rosaria Raciti', source: 'Fiumefreddo Liber Matrimoniorum N.18 (24 Apr 1911) — "Vincentii et Rosariae Raciti". Baptism 8 Jan 1888 also records Raciti.', note: 'Often misrecorded as "Rapisardi" on church marriage certificates (scribal error). Correct surname is Raciti.' },
  { id: 'rosario-patane-sr', label: 'Rosario Patanè (1889–?)', source: 'Calatabiano civil birth 8 Feb 1889, atto n. 28. Baptism 9/10 Feb 1889.', note: 'Born Contrada Trappitelli, Calatabiano. Married Venera Vecchio 24 Apr 1911 (church), 27 Apr 1911 (civil).' },
  { id: 'venera-vecchio', label: 'Venera (Veneranda) Vecchio (1888–pre-1953)', source: 'Fiumefreddo baptism 8 Jan 1888, folio 240, entry n. 8. Married 24 Apr 1911.', note: 'Full baptismal name: Veneranda. Godparents: Alfio Musumeci Casalino & Maria Raciti. Midwife: Concetta Marano.' },
  { id: 'rosaria-patane', label: 'Rosaria Patanè (1924–1994)', source: 'Fiumefreddo civil birth 23 May 1924, atto n. 71, Sezione Castello.', note: 'Daughter of Rosario Patanè + Venera Vecchio. Married Gregorio Emmi 7 Jul 1948, Fiumefreddo.' },
  { id: 'ezio-buatti', label: 'Ezio Buatti (1923–1991)', source: 'NAA: B78, ITALIAN/BUATTI EZIO (Item 5746087) — arrival form RA, marriage notification, passport photo.', note: 'Born Ascoli Piceno. Arrived Toscana 27 Sep 1952, Greta Migrant Camp. Married Lilia Chiappini 4 Oct 1952 St Anthony\'s Greta. Departed per Neptunia 13 Sep 1963. Returned, died Melbourne.' },
  { id: 'bruna-lilia-chiappini', label: 'Bruna Lilia Chiappini (1930–1998)', source: 'NAA: B78 (Ezio\'s file) — marriage notification listing reg no. 290730. Also Toscana passenger manifest K269.', note: 'Born San Benedetto del Tronto. Travelled Toscana same voyage as Ezio (registered 12 apart). Married 4 Oct 1952 St Anthony\'s Greta. Naturalised 1965, Richmond VIC.' },
];

const links: EvidenceLink[] = [
  { from: 'antonino-emmi', to: 'rosaria-raiti', via: 'Marriage (presumed, record not yet found)', source: 'Surmised from Egidio\'s proclamation naming both as parents', date: '~1868-1869', notes: 'No marriage record found yet. Likely Linguaglossa parish.' },
  { from: 'antonino-emmi', to: 'egidio-emmi', via: 'Father–son', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59: "figlio di fu Antonino e di Raiti Rosaria"', date: '8 Sep 1900' },
  { from: 'rosaria-raiti', to: 'egidio-emmi', via: 'Mother–son', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59', date: '8 Sep 1900' },
  { from: 'salvatore-sgroi', to: 'santa-cali', via: 'Marriage (presumed)', source: 'Surmised from Concetta\'s proclamation naming both as parents', date: '~1878-1879' },
  { from: 'salvatore-sgroi', to: 'concetta-sgroi', via: 'Father–daughter', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59: "figlia di Salvatore e di Cali Santa"', date: '8 Sep 1900' },
  { from: 'santa-cali', to: 'concetta-sgroi', via: 'Mother–daughter', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59', date: '8 Sep 1900' },
  { from: 'egidio-emmi', to: 'concetta-sgroi', via: 'Marriage', source: 'Linguaglossa Marriage Proclamation 1900, atto № 59. Witnesses: Francesco Di Francesco (44), Giacomo Di Casaco (44). Both illiterate.', date: '8 Sep 1900', notes: 'Civil marriage (proclamation). Church marriage may be separate record.' },
  { from: 'egidio-emmi', to: 'gregorio-emmi', via: 'Father–son', source: 'Gregorio\'s baptism record (5 Dec 1915, DGS 5455112). Also 1943 POW report lists mother "Sgroi Concetta" and father as "DEC".', date: '1915' },
  { from: 'concetta-sgroi', to: 'gregorio-emmi', via: 'Mother–son', source: 'Gregorio\'s 1943 POW report NAA: MP1103/2, 55491 — "Mother\'s Pre-marriage Name: Sgroi Concetta"', date: '1943' },
  { from: 'sebastiano-patane-sr', to: 'rosaria-dagata', via: 'Marriage (presumed)', source: 'Surmised from Rosario\'s birth record naming both as parents', date: '~1887-1888' },
  { from: 'sebastiano-patane-sr', to: 'rosario-patane-sr', via: 'Father–son', source: 'Calatabiano civil birth 1889, atto n. 28', date: '8 Feb 1889' },
  { from: 'rosaria-dagata', to: 'rosario-patane-sr', via: 'Mother–son', source: 'Calatabiano civil birth 1889, atto n. 28', date: '8 Feb 1889' },
  { from: 'vincenzo-vecchio', to: 'rosaria-raciti', via: 'Marriage (presumed)', source: 'Surmised from Venera\'s baptism and Liber Matrimoniorum N.18 naming both as parents', date: '~1886-1887' },
  { from: 'vincenzo-vecchio', to: 'venera-vecchio', via: 'Father–daughter', source: 'Fiumefreddo baptism 8 Jan 1888, folio 240 — "figlia di Vincenzo Vecchio"', date: '8 Jan 1888' },
  { from: 'rosaria-raciti', to: 'venera-vecchio', via: 'Mother–daughter', source: 'Fiumefreddo Liber Matrimoniorum N.18 (24 Apr 1911) — "Rosariae Raciti". Also in baptism 8 Jan 1888.', date: '8 Jan 1888', notes: 'Surname definitively Raciti. "Rapisardi" was a scribal error on some marriage certificates.' },
  { from: 'rosario-patane-sr', to: 'venera-vecchio', via: 'Marriage', source: 'Fiumefreddo church marriage 24 Apr 1911, celebrated by Fr. Eutichio Scarcella at Chiesa del S. Rosario. Civil marriage 27 Apr 1911.', date: '24/27 Apr 1911', notes: 'Canonical examination 23 Apr 1911 — witnesses knew Rosario from infancy. Both free to marry.' },
  { from: 'rosario-patane-sr', to: 'rosaria-patane', via: 'Father–daughter', source: 'Fiumefreddo civil birth 23 May 1924, atto n. 71, Sezione Castello', date: '23 May 1924' },
  { from: 'venera-vecchio', to: 'rosaria-patane', via: 'Mother–daughter', source: 'Fiumefreddo civil birth 23 May 1924, atto n. 71, Sezione Castello', date: '23 May 1924' },
  { from: 'gregorio-emmi', to: 'rosaria-patane', via: 'Marriage', source: 'Civil birth extract atto n. 202 margin annotation: 7 Jul 1948, Fiumefreddo di Sicilia, atto n. 34 part 2 series A.', date: '7 Jul 1948' },
  { from: 'ezio-buatti', to: 'bruna-lilia-chiappini', via: 'Marriage', source: 'NAA B78, Form RA 6 (Aliens Act Notification of Marriage): 4 Oct 1952, St Anthony\'s, Greta, NSW, cert C810020. Both on Toscana same voyage, registered same batch (reg nos 290718 / 290730).', date: '4 Oct 1952' },
];

function NodeSection({ node, linkedNodes }: { node: EvidenceNode; linkedNodes: EvidenceLink[] }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-emerald-100 rounded-lg p-2 mt-0.5">
          <Users className="w-4 h-4 text-emerald-800" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-stone-900">{node.label}</h4>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            <span className="font-semibold text-stone-700">Source:</span> {node.source}
          </p>
          {node.note && (
            <p className="text-xs text-amber-700 mt-1 leading-relaxed italic">
              {node.note}
            </p>
          )}
          {linkedNodes.length > 0 && (
            <div className="mt-2 space-y-1">
              {linkedNodes.map((link, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-stone-600">
                  <ArrowRight className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  <span><span className="font-medium">{link.to === node.id ? 'From' : 'To'}:</span> {link.to === node.id ? link.from : link.to} — <span className="italic">{link.via}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EvidenceWiki() {
  return (
    <div className="space-y-8">
      <div className="bg-[#F4EFE6] border border-stone-200 rounded-xl p-6 shadow-inner">
        <div className="flex items-center gap-3 mb-4">
          <ScrollText className="w-6 h-6 text-[#800020]" />
          <div>
            <h2 className="text-xl font-bold text-[#800020]">Evidence Wiki</h2>
            <p className="text-xs text-stone-500 font-sans">Every link in the tree traced back to its primary source.</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-stone-700 font-sans">
          <p>
            This page documents the chain of evidence for every parent–child and marriage connection
            shown in the Pedigree Chart. Each person has a confirmed source; each relationship has a
            specific record (or combination of records) that proves it.
          </p>
        </div>
      </div>

      {/* Emmi–Sgroi Line */}
      <div>
        <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-200 pb-2 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-700" /> Emmi–Sgroi Line
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NodeSection
            node={nodes.find(n => n.id === 'antonino-emmi')!}
            linkedNodes={links.filter(l => l.from === 'antonino-emmi' || l.to === 'antonino-emmi')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'rosaria-raiti')!}
            linkedNodes={links.filter(l => l.from === 'rosaria-raiti' || l.to === 'rosaria-raiti')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'salvatore-sgroi')!}
            linkedNodes={links.filter(l => l.from === 'salvatore-sgroi' || l.to === 'salvatore-sgroi')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'santa-cali')!}
            linkedNodes={links.filter(l => l.from === 'santa-cali' || l.to === 'santa-cali')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'egidio-emmi')!}
            linkedNodes={links.filter(l => l.from === 'egidio-emmi' || l.to === 'egidio-emmi')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'concetta-sgroi')!}
            linkedNodes={links.filter(l => l.from === 'concetta-sgroi' || l.to === 'concetta-sgroi')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'gregorio-emmi')!}
            linkedNodes={links.filter(l => l.from === 'gregorio-emmi' || l.to === 'gregorio-emmi')}
          />
        </div>
      </div>

      {/* Patanè–Vecchio Line */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-2 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-700" /> Patanè–Vecchio Line
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NodeSection
            node={nodes.find(n => n.id === 'sebastiano-patane-sr')!}
            linkedNodes={links.filter(l => l.from === 'sebastiano-patane-sr' || l.to === 'sebastiano-patane-sr')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'rosaria-dagata')!}
            linkedNodes={links.filter(l => l.from === 'rosaria-dagata' || l.to === 'rosaria-dagata')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'vincenzo-vecchio')!}
            linkedNodes={links.filter(l => l.from === 'vincenzo-vecchio' || l.to === 'vincenzo-vecchio')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'rosaria-raciti')!}
            linkedNodes={links.filter(l => l.from === 'rosaria-raciti' || l.to === 'rosaria-raciti')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'rosario-patane-sr')!}
            linkedNodes={links.filter(l => l.from === 'rosario-patane-sr' || l.to === 'rosario-patane-sr')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'venera-vecchio')!}
            linkedNodes={links.filter(l => l.from === 'venera-vecchio' || l.to === 'venera-vecchio')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'rosaria-patane')!}
            linkedNodes={links.filter(l => l.from === 'rosaria-patane' || l.to === 'rosaria-patane')}
          />
        </div>
      </div>

      {/* Name Discrepancies */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
          <LinkIcon className="w-4 h-4" /> Name & Record Discrepancies
        </h3>
        <div className="space-y-3 text-sm text-amber-800 font-sans">
          <div>
            <span className="font-semibold">Rosaria Raciti / Rapisardi / Raiti:</span> Three different scribal recordings for women in connected families. 
            Venera Vecchio's mother appears as <strong>Raciti</strong> in the 1888 baptism and as <strong>Rapisardi</strong> in the 1911 marriage processetti. 
            Our Egidio's mother is <strong>Rosaria Raiti</strong>. These are distinct families (not the same woman), but the phonetic similarity across 
            Raciti–Rapisardi–Raiti suggests a common root or frequent scribal confusion.
          </div>
          <div>
            <span className="font-semibold">Two Egidio Emmis:</span> Both have father Antonino Emmi, but different mothers — Rosa Vecchio (first marriage, Egidio b. ~1855) 
            vs Rosaria Raiti (second marriage, our Egidio b. ~1870). Likely half-brothers. The older Egidio married Angela Raiti in 1895 (age 40). 
            Our Egidio married Concetta Sgroi in 1900 (age 30).
          </div>
          <div>
            <span className="font-semibold">Venera / Veneranda:</span> Baptismal register records "Veneranda" as full name. Marriage records and civil documents 
            abbreviate to "Venera." Both refer to the same person.
          </div>
          <div>
            <span className="font-semibold">Rosario's birth date (8 vs 9 Feb 1889):</span> Civil birth record (atto n. 28, Calatabiano) states 8 Feb 1889 at 4:15 AM. 
            Baptism certificate says "born yesterday" on 10 Feb, implying 9 Feb. The civil record is primary — the baptism was on the 10th, 
            and the priest wrote "born yesterday" meaning the 9th, but the actual birth was at 4:15 AM on the 8th. The 8 Feb date is correct.
          </div>
        </div>
      </div>

      {/* Sources Summary */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
        <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-3">
          <ScrollText className="w-4 h-4" /> Primary Source Summary
        </h3>
        <div className="text-xs text-stone-600 font-sans space-y-1">
          <p><strong>Catania, Calatabiano, Nati 1889</strong> — atto n. 28 (Rosario Patanè)</p>
          <p><strong>Fiumefreddo Baptisms 1762-1904</strong> — folio 240, entry n. 8 (Venera Vecchio)</p>
          <p><strong>Fiumefreddo Marriage Supplements 1911</strong> — processetti for Rosario Patanè & Venera Vecchio (confirms siblings, parents, marriage)</p>
          <p><strong>Linguaglossa Marriage Proclamation Records 1900</strong> — atto № 59 (Egidio Emmi & Concetta Sgroi)</p>
          <p><strong>Gregorio Emmi 1943 POW Report</strong> — NAA: MP1103/2, 55491 (confirms mother Concetta Sgroi, father deceased)</p>
          <p><strong>Comune di Fiumefreddo, Nati 1924</strong> — atto n. 71, Sezione Castello (Rosaria Patanè)</p>
          <p><strong>Comune di Ascoli Piceno Cemetery Search</strong> — Alfredo Buatti burial (5 Sep 1964, Borgo Solestà)</p>
        </div>
      </div>
    </div>
  );
}

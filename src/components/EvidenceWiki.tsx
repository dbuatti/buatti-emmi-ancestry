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
  { id: 'antonino-emmi', label: 'Antonino Emmi', source: 'Linguaglossa Marriage Act 1900, atto № 59 — listed as "fu Antonino"', note: 'Died before 4 Nov 1900. Husband of Rosaria Nasti (not Raiti — earlier banns error).' },
  { id: 'rosaria-nasti', label: 'Rosaria (surname unresolved — Nasti/Raiti)', source: 'Linguaglossa Marriage Act 1900, atto № 59 (4 Nov 1900) — "Nasti Rosaria". Banns (8 Sep 1900, same clerk) — "Raiti Rosaria". Two documents, same clerk, same year — neither authoritative.', note: 'Given name also uncertain — "Rocaria/Rosaria" in both acts. Banns gave Raiti, marriage act gave Nasti. Only Egidio\'s ~1870 birth act (different clerk, mother present) will resolve. Living in 1900 (not "fu").' },
  { id: 'gregorio-sgroi', label: 'Gregorio Sgroi (~1840–?)', source: 'Linguaglossa Banns (8 Sep 1900) — age 60, falegname. Marriage Act (4 Nov 1900) confirms given name.', note: 'Born ~1840. Carpenter — tradesman, not farmer. Previously misread as "Salvatore" from banns. Living at time of Concetta\'s marriage.' },
  { id: 'santa-cali', label: 'Santa Calì', source: 'Linguaglossa Marriage Act 1900, atto № 59 (4 Nov 1900) — listed as mother "Cali Santa"', note: 'Living at time of Concetta\'s marriage. Wife of Gregorio Sgroi (not Salvatore).' },
  { id: 'egidio-emmi', label: 'Egidio Emmi (~1870 – pre-1943)', source: 'Marriage act atto № 59 (4 Nov 1900): age 30 → born ~1869/1870. Banns (8 Sep 1900): same age. POW report (1943) shows "DEC" = deceased.', note: 'Farmer (contadino). Illiterate. Officer: Concetto Scarlata. Wedding witnesses: Cassaniti Vincenzo, Arlotta Giuseppe. Banns witnesses: De Francesco Francesco (guardia), Cesareo Giacomo (mugnaio). Birth act confirmed to exist (cited in processetti). NOT the same as Egidio Emmi (b. 5 Sep 1868, son of Antonino + Rosa Vecchio) who married Angela Raiti in 1895 — they MAY share the same father Antonino, or may be from different Antoninos (multiple existed).' },
  { id: 'concetta-sgroi', label: 'Concetta Sgroi (~1877 – pre-1967)', source: 'Marriage act atto № 59 (4 Nov 1900): age 23 → born ~1876/1877. Banns (8 Sep 1900): age 23, industriosa. Later church records show deceased by 1967.', note: 'Industriosa (home-based textile/domestic work) — NOT contadina as previously recorded. Maiden name Sgroi confirmed via Gregorio\'s 1943 POW report. Previously recorded as age 20, father Salvatore (banns errors — marriage act corrects).' },
  { id: 'gregorio-emmi', label: 'Gregorio Emmi (1915–1979)', source: 'Civil birth extract atto n. 202 (23 Oct 1915). Also parish baptism 5 Dec 1915 (DGS 5455112, entry N.251) — 4-day discrepancy. Death notice SMH 30 Nov 1979 (Ryerson).', note: 'Born 23 Oct 1915 (civil) / 27 Oct 1915 (baptism), Linguaglossa. Died 24 Nov 1979, Stanmore NSW. POW in WWII. Married Rosaria Patanè 7 Jul 1948 Fiumefreddo. Emigrated Australia 1950. Naturalised 26 Jan 1961.' },
  { id: 'sebastiano-patane-sr', label: 'Sebastiano Patanè', source: 'Calatabiano civil birth 1889, atto n. 28 — listed as father (age 39, castaldo). Also in Fiumefreddo marriage banns 1911.', note: 'Resident of Calatabiano. Father of Rosario, Giuseppe, and Venera Patanè.' },
  { id: 'rosaria-dagata', label: 'Rosaria D\'Agata', source: 'Calatabiano civil birth 1889, atto n. 28 — listed as mother. Also in Fiumefreddo marriage banns 1911.', note: 'From Fiumefreddo. Died before 1911 (not listed in later records).' },
  { id: 'vincenzo-vecchio', label: 'Vincenzo Vecchio', source: 'Fiumefreddo baptism 1888 — listed as father of Venera. Also in marriage processetti 1911.', note: 'Son of Gregorio Vecchio + Anna D\'Agostino (per 1857 marriage proclamation index).' },
  { id: 'rosaria-raciti', label: 'Rosaria Raciti', source: 'Fiumefreddo Liber Matrimoniorum N.18 (24 Apr 1911) — "Vincentii et Rosariae Raciti". Baptism 8 Jan 1888 also records Raciti.', note: 'Often misrecorded as "Rapisardi" on church marriage certificates (scribal error). Correct surname is Raciti.' },
  { id: 'rosario-patane-sr', label: 'Rosario Patanè (1889–?)', source: 'Calatabiano civil birth 8 Feb 1889, atto n. 28. Baptism 9/10 Feb 1889.', note: 'Born Contrada Trappitelli, Calatabiano. Married Venera Vecchio 24 Apr 1911 (church), 27 Apr 1911 (civil).' },
  { id: 'venera-vecchio', label: 'Venera (Veneranda) Vecchio (1888–pre-1953)', source: 'Fiumefreddo baptism 8 Jan 1888, folio 240, entry n. 8. Married 24 Apr 1911.', note: 'Full baptismal name: Veneranda. Godparents: Alfio Musumeci Casalino & Maria Raciti. Midwife: Concetta Marano.' },
  { id: 'rosaria-patane', label: 'Rosaria Patanè (1924–1994)', source: 'Fiumefreddo civil birth 23 May 1924, atto n. 71, Sezione Castello.', note: 'Daughter of Rosario Patanè + Venera Vecchio. Married Gregorio Emmi 7 Jul 1948, Fiumefreddo.' },
  { id: 'ezio-buatti', label: 'Ezio Buatti (1923–1991)', source: 'NAA: B78, ITALIAN/BUATTI EZIO (Item 5746087) — arrival form RA, marriage notification, passport photo.', note: 'Born Ascoli Piceno. Arrived Toscana 27 Sep 1952, Greta Migrant Camp. Married Lilia Chiappini 4 Oct 1952 St Anthony\'s Greta. Departed per Neptunia 13 Sep 1963. Returned, died Melbourne.' },
  { id: 'bruna-lilia-chiappini', label: 'Bruna Lilia Chiappini (1930–1998)', source: 'NAA: B78 (Ezio\'s file) — marriage notification listing reg no. 290730. Also Toscana passenger manifest K269, line 178. Naturalisation cert EF10155554, file V653748 (18 Nov 1965). Branxton Parish extract (10 Jul 2026) names parents.', note: 'Born San Benedetto del Tronto. Travelled Toscana same voyage as Ezio (registered 12 apart). Married 4 Oct 1952 St Anthony\'s Greta. Parents: Remo Chiappini + Irma Pirri (Branxton extract 10 Jul 2026). Naturalised 1965, Richmond VIC. Gino Chiappini on line 177 same manifest — confirmed real by NAA, Bonegilla camp, ARDs exist.' },
  { id: 'remo-chiappini', label: 'Remo Chiappini', source: 'Branxton Catholic Parish marriage extract (10 Jul 2026) — named as father of Lilia Chiappini.', note: 'Wife: Irma Pirri. Both resided Ascoli Piceno. Family accounts suggest he was sent to Porto San Giorgio after wife\'s death (TB). Needs primary source verification.' },
  { id: 'irma-pirri', label: 'Irma Pirri', source: 'Branxton Catholic Parish marriage extract (10 Jul 2026) — named as mother of Lilia Chiappini.', note: 'Previously unknown. Wife of Remo Chiappini, mother of Bruna Lilia Chiappini. Possibly died of TB (per family story). Both resided Ascoli Piceno.' },
];

const links: EvidenceLink[] = [
  { from: 'antonino-emmi', to: 'rosaria-nasti', via: 'Marriage (presumed, record not yet found)', source: 'Surmised from Egidio\'s marriage act naming both as parents', date: '~1868-1869', notes: 'No marriage record found yet. Likely Linguaglossa parish.' },
  { from: 'antonino-emmi', to: 'egidio-emmi', via: 'Father–son', source: 'Linguaglossa Marriage Act 1900, atto № 59 (4 Nov 1900): "figlio di fu Antonino e di Nasti Rosaria"', date: '4 Nov 1900' },
  { from: 'rosaria-nasti', to: 'egidio-emmi', via: 'Mother–son', source: 'Linguaglossa Marriage Act 1900, atto № 59 (4 Nov 1900)', date: '4 Nov 1900' },
  { from: 'gregorio-sgroi', to: 'santa-cali', via: 'Marriage (presumed)', source: 'Surmised from Concetta\'s marriage act naming both as parents', date: '~1875-1876' },
  { from: 'gregorio-sgroi', to: 'concetta-sgroi', via: 'Father–daughter', source: 'Linguaglossa Marriage Act 1900, atto № 59 (4 Nov 1900): "figlia di Gregorio e di Cali Santa"', date: '4 Nov 1900' },
  { from: 'santa-cali', to: 'concetta-sgroi', via: 'Mother–daughter', source: 'Linguaglossa Marriage Act 1900, atto № 59 (4 Nov 1900)', date: '4 Nov 1900' },
  { from: 'egidio-emmi', to: 'concetta-sgroi', via: 'Marriage', source: 'Linguaglossa Marriage Act 1900, atto № 59 (4 Nov 1900). Officer: Concetto Scarlata. Wedding witnesses: Cassaniti Vincenzo (40), Arlotta Giuseppe (23). Both illiterate. Banns (8 Sep 1900, same officer) witnesses: De Francesco Francesco (~44, guardia), Cesareo Giacomo (40).', date: '4 Nov 1900', notes: 'Civil marriage ceremony. Banns published 9 & 16 Sep 1900. ~7-week gap. Church marriage record may exist separately.' },
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
  { from: 'ezio-buatti', to: 'bruna-lilia-chiappini', via: 'Marriage', source: 'NAA B78, Form RA 6 (Aliens Act Notification of Marriage): 4 Oct 1952, St Anthony\'s, Greta, NSW, cert C810020. Branxton Parish extract confirms parents, witnesses, celebrant. Both on Toscana same voyage, registered same batch (reg nos 290718 / 290730).', date: '4 Oct 1952' },
  { from: 'remo-chiappini', to: 'irma-pirri', via: 'Marriage (presumed)', source: 'Branxton Catholic Parish marriage extract (10 Jul 2026) — named as parents of Lilia', date: '~1928-1929' },
  { from: 'remo-chiappini', to: 'bruna-lilia-chiappini', via: 'Father–daughter', source: 'Branxton Catholic Parish marriage extract (10 Jul 2026)', date: '3 Jul 1930' },
  { from: 'irma-pirri', to: 'bruna-lilia-chiappini', via: 'Mother–daughter', source: 'Branxton Catholic Parish marriage extract (10 Jul 2026)', date: '3 Jul 1930' },
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
            node={nodes.find(n => n.id === 'rosaria-nasti')!}
            linkedNodes={links.filter(l => l.from === 'rosaria-nasti' || l.to === 'rosaria-nasti')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'gregorio-sgroi')!}
            linkedNodes={links.filter(l => l.from === 'gregorio-sgroi' || l.to === 'gregorio-sgroi')}
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

      {/* Buatti–Chiappini Line */}
      <div>
        <h3 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-stone-700" /> Buatti–Chiappini Line
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NodeSection
            node={nodes.find(n => n.id === 'remo-chiappini')!}
            linkedNodes={links.filter(l => l.from === 'remo-chiappini' || l.to === 'remo-chiappini')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'irma-pirri')!}
            linkedNodes={links.filter(l => l.from === 'irma-pirri' || l.to === 'irma-pirri')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'ezio-buatti')!}
            linkedNodes={links.filter(l => l.from === 'ezio-buatti' || l.to === 'ezio-buatti')}
          />
          <NodeSection
            node={nodes.find(n => n.id === 'bruna-lilia-chiappini')!}
            linkedNodes={links.filter(l => l.from === 'bruna-lilia-chiappini' || l.to === 'bruna-lilia-chiappini')}
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
            Our Egidio's mother appears as <strong>Raiti</strong> in the banns (8 Sep 1900) and as <strong>Nasti</strong> in the marriage act (4 Nov 1900) — same clerk Concetto Scarlata, same year. Neither is inherently more authoritative on this point. Given name also uncertain: "Rocaria/Rosaria" in both. Egidio's ~1870 birth act (a different clerk, mother present) will settle it. These are distinct families from the Raciti/Rapisardi confusion above, but the phonetic similarity across 
            Raciti–Rapisardi–Raiti/Nasti is worth noting.
          </div>
          <div>
            <span className="font-semibold">Two Egidio Emmis:</span> Both have father named Antonino Emmi, but different mothers — Rosa Vecchio (Egidio b. 5 Sep 1868, married Angela Raiti 1895) 
            vs Rosaria (surname unresolved — Nasti in marriage act, Raiti in banns; our Egidio b. ~1870, married Concetta Sgroi 1900). They MAY share the same father or may descend from different Antoninos (at least two Antonino Emmis documented in 1860s-70s Linguaglossa: son of Francesco, and son of Giuseppe). Our Egidio's birth act will settle this.
          </div>
          <div>
            <span className="font-semibold">Concetta's occupation — contadina vs industriosa:</span> The banns (8 Sep 1900) record both Concetta and her mother Santa Calì as <strong>industriosa</strong> (home-based textile/domestic work), not contadina. My earlier transcription of the marriage act misread this word. Amend all references: Concetta Sgroi and Santa Calì were industriosa.
          </div>
          <div>
            <span className="font-semibold">Banns vs wedding dates:</span> The marriage act (4 Nov 1900) referred to banns being published "last month" (October), but the banns record shows 9 & 16 September 1900 — both genuine Sundays. The marriage act's phrase was either loose boilerplate or I misread "settembre scorso" as "mese scorso". Banns record wins: September. ~7-week gap between banns and wedding — slightly unusual (most married within 2–3 weeks), but legally valid.
          </div>
          <div>
            <span className="font-semibold">Birth acts confirmed to exist:</span> The banns processetti cite copies of both Egidio's and Concetta's birth acts as issued — both are definitely in Linguaglossa Nati registers (DGS 7841071). However, the allegati volume for 1900 falls in the 1894–1910 unfilmed gap, so the processetti copies aren't available online. Originals may survive at Archivio di Stato di Catania.
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

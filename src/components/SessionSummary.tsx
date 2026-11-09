import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** Local-only notes from the last working session. Edit the lists below. */
const SESSION_DATE = '5 November 2026';

const DONE: string[] = [
  'NEW: a page per person — click a person → "Open full page →" (or go to /people/<id>). Save their FamilySearch link, other profiles, links and notes; see every life event with its next action; records naming them; FamilySearch page check.',
  'Built the records system: save to FAMILY TREE › _inbox → type "process inbox" in OpenCode → follow the Next card (file → transcribe → check → apply → FamilySearch).',
  'Organised the FAMILY TREE folder into the app (189 files, all checked): records-local/, reference/, correspondence/, private/ (your ID — never published), _unsorted/ (111 still to identify). Images never go online.',
  'Gregorio — birth (Linguaglossa, Nati 1915 atto 202): all 5 steps done. Born 23 Oct 1915 per the civil act; box 10 gives his marriage reference and 1961 citizenship act.',
  'Gregorio — baptism (DGS 5455112, entry 251): all 5 steps done. Parish says born 27 Oct, baptised 5 Dec 1915. 23 vs 27 kept as a discrepancy. Godmother Rosaria Emmi = new lead.',
  'New leads: marriage Fiumefreddo 1948 parte II serie A n. 34; citizenship Linguaglossa 1961 atto 32; siblings in Linguaglossa baptisms 1901–1921.',
  'New tools: check screen (tick each line against the image), FamilySearch form card with Copy buttons, "Get the document" card with Requested/Chase, FamilySearch person check (paste the page → to-do list).',
  'Models: Nemotron VL (free) for first drafts of images; a coding model for app changes and "process"; Claude for hard handwriting and Italian letters. Typed documents: copy the text from Preview.',
];

const NEXT: string[] = [
  'The closest-relative queue is built (Next card starts with you). Open your own page and Gregorio\'s page and paste their FamilySearch links.',
  'Restart the app (Ctrl + C, then pnpm dev). In OpenCode: commit everything and push.',
  'GitHub: make the repo private (Settings → General → Danger Zone → Change visibility).',
  'Gmail (info@ Drafts): send the Fiumefreddo marriage request, then click "Requested" on that Next card.',
  'Next card → "Update Gregorio on FamilySearch": paste his page → add Birth, Christening, Marriage; review duplicate P65V-T59 and the Acireale "Gregorius Emmi" record; check Concetta Sgroi 1874 vs 1877 before changing.',
  'Later: order Gregorio\'s NSW death certificate; request Linguaglossa citizenship 1961 atto 32; find the Linguaglossa baptism films for 1901–1913 (siblings); start identifying the 111 _unsorted files.',
  'Small fix for OpenCode: TypeScript error in NextGuide "Found online" (personId) — app still runs.',
];

export function SessionSummary() {
  const [open, setOpen] = useState(true);
  if (!import.meta.env.DEV) return null;
  return (
    <div className="rounded-xl border border-stone-300 bg-white shadow-sm">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-bold text-[#800020]">Last session — {SESSION_DATE}: what was done, what's next</span>
        {open ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
      </button>
      {open && (
        <div className="grid md:grid-cols-2 gap-4 px-4 pb-4 text-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Done</div>
            <ul className="list-disc ml-5 space-y-1 text-stone-700">{DONE.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Next (in order)</div>
            <ol className="list-decimal ml-5 space-y-1 text-stone-700">{NEXT.map((d) => <li key={d}>{d}</li>)}</ol>
          </div>
        </div>
      )}
    </div>
  );
}

import placesFile from '@/data/places.json';
import type { FamilyLine, Person } from '@/types';

/**
 * The family map works from a *committed* gazetteer (src/data/places.json),
 * built from OpenStreetMap by `node scripts/geocode-places.mjs`.
 *
 * Nothing is geocoded at runtime: every string in familyData.ts is matched
 * against the explicit rules below, so a place can never drift or be invented.
 * Anything that does not match is reported as "not locatable" instead of being
 * silently dropped.
 */

export interface MapPlace {
  id: string;
  label: string;
  country: string;
  region: string;
  precision: 'address' | 'street' | 'cemetery' | 'locality' | 'town' | 'area';
  query: string;
  lat: number | null;
  lon: number | null;
  geocoded?: 'nominatim' | 'fallback' | 'manual' | 'failed';
  fallbackId?: string;
  matched?: string | null;
  osmType?: string;
  osmId?: number;
  note?: string;
}

export type MapEventKind = 'birth' | 'death' | 'burial' | 'residence' | 'port';

export interface MapEvent {
  personId: string;
  personName: string;
  generation: number;
  line: FamilyLine;
  kind: MapEventKind;
  detail: string;
  /** The source string itself carried a hedge ("likely", "assumed", "?"). */
  uncertain: boolean;
}

export interface MapPin {
  place: MapPlace;
  events: MapEvent[];
  personIds: string[];
  lines: FamilyLine[];
  /** True when the pin is only an approximation (OSM had no exact match). */
  approximate: boolean;
  lat: number;
  lon: number;
}

export interface UnlocatedEntry {
  text: string;
  count: number;
  people: { id: string; name: string; kind: MapEventKind }[];
}

export const PLACE_BY_ID: Map<string, MapPlace> = new Map(
  (placesFile.places as MapPlace[]).map((p) => [p.id, p]),
);

export const PLACES: MapPlace[] = placesFile.places as MapPlace[];

/**
 * Ordered matcher table. First match wins, so the most specific place must come
 * first (e.g. "Cimitero di Borgo Solestà" before "Borgo Solestà", "Wamoon"
 * before "Leeton", "Punt Road" before "Richmond").
 */
const PLACE_RULES: { test: RegExp; placeId: string }[] = [
  { test: /cimitero di borgo solest|cimitero 01/, placeId: 'cimitero-borgo-solesta' },
  { test: /borgo solest/, placeId: 'ascoli-borgo-solesta' },
  { test: /duomo/, placeId: 'ascoli-duomo' },
  { test: /s\. vittore|san vittore/, placeId: 'ascoli-san-vittore' },
  { test: /lisciano/, placeId: 'lisciano' },
  { test: /barro/, placeId: 'via-barro' },
  { test: /mercantini/, placeId: 'via-mercantini' },
  { test: /fabriano/, placeId: 'via-fabriano' },
  { test: /maltignano/, placeId: 'maltignano' },
  { test: /rotella/, placeId: 'rotella' },
  { test: /san benedetto/, placeId: 'san-benedetto-del-tronto' },
  { test: /trifilippi|trappitelli/, placeId: 'calatabiano-trifilippi' },
  { test: /feudogrande/, placeId: 'fiumefreddo-feudogrande' },
  { test: /sezione castello/, placeId: 'fiumefreddo-castello' },
  { test: /via roma/, placeId: 'via-roma-linguaglossa' },
  { test: /s\. egidio|sant'egidio/, placeId: 'via-s-egidio' },
  { test: /linguaglossa/, placeId: 'linguaglossa' },
  { test: /fiumefreddo/, placeId: 'fiumefreddo' },
  { test: /calatabiano/, placeId: 'calatabiano' },
  { test: /milo/, placeId: 'milo' },
  { test: /acireale/, placeId: 'acireale' },
  { test: /messina/, placeId: 'messina' },
  { test: /cividale/, placeId: 'cividale' },
  { test: /trieste/, placeId: 'trieste' },
  { test: /black ?rock/, placeId: 'black-rock-qld' },
  { test: /new ingham|ingham cemetery/, placeId: 'ingham-cemetery' },
  { test: /ingham/, placeId: 'ingham' },
  { test: /broadford/, placeId: 'broadford' },
  { test: /parkdale/, placeId: 'parkdale' },
  { test: /punt road/, placeId: 'punt-road' },
  { test: /richmond/, placeId: 'richmond-vic' },
  { test: /springvale/, placeId: 'springvale-cemetery' },
  { test: /cheltenham/, placeId: 'cheltenham-cemetery' },
  { test: /rookwood/, placeId: 'rookwood-cemetery' },
  { test: /sydney/, placeId: 'sydney' },
  { test: /wamoon/, placeId: 'wamoon' },
  { test: /leeton/, placeId: 'leeton' },
  { test: /cowra/, placeId: 'cowra' },
  { test: /brisbane/, placeId: 'brisbane' },
  { test: /fremantle/, placeId: 'fremantle' },
  { test: /ascoli/, placeId: 'ascoli-piceno' },
];

/** Strings that are deliberately not plotted (no place to point at). */
const NOT_A_PLACE = [/^unknown\b/, /^none\b/, /^italy$/];

const HEDGES = /\blikely\b|\bassumed\b|\bprobably\b|\bunknown\b|\?|~|\bca\./i;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function resolvePlace(text: string): { placeId: string | null; uncertain: boolean } {
  const t = norm(text);
  if (!t) return { placeId: null, uncertain: false };
  if (NOT_A_PLACE.some((r) => r.test(t))) return { placeId: null, uncertain: false };
  const hit = PLACE_RULES.find((r) => r.test.test(t));
  return { placeId: hit ? hit.placeId : null, uncertain: HEDGES.test(text) };
}

/** Split a free-text list of addresses ("A (1938–44); B (1952); C (1964)"). */
function splitAddresses(text: string): string[] {
  return text
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface MapBuildResult {
  pins: MapPin[];
  unlocated: UnlocatedEntry[];
  /** Number of place-bearing facts found in the data (located + not located). */
  totalFacts: number;
  locatedFacts: number;
}

export function buildMapPins(people: Person[]): MapBuildResult {
  const byPlace = new Map<string, MapEvent[]>();
  const missing = new Map<string, UnlocatedEntry>();
  let totalFacts = 0;

  const add = (person: Person, kind: MapEventKind, text: string | undefined) => {
    if (!text) return;
    const value = text.trim();
    if (!value) return;
    totalFacts += 1;
    const { placeId, uncertain } = resolvePlace(value);
    if (!placeId) {
      const key = value;
      const entry = missing.get(key) ?? { text: value, count: 0, people: [] };
      entry.count += 1;
      entry.people.push({ id: person.id, name: person.name, kind });
      missing.set(key, entry);
      return;
    }
    const list = byPlace.get(placeId) ?? [];
    const duplicate = list.some((e) => e.personId === person.id && e.kind === kind && e.detail === value);
    if (duplicate) return;
    list.push({
      personId: person.id,
      personName: person.name,
      generation: person.generation,
      line: person.line,
      kind,
      detail: value,
      uncertain,
    });
    byPlace.set(placeId, list);
  };

  for (const person of people) {
    add(person, 'birth', person.birthPlace);
    add(person, 'death', person.deathPlace);
    add(person, 'burial', person.burialPlace);
    (person.residences ?? []).forEach((r) => add(person, 'residence', r));
    splitAddresses(person.italianAddress ?? '').forEach((r) => add(person, 'residence', r));

    for (const voyage of person.migration?.voyages ?? []) {
      const when = voyage.date ? `, ${voyage.date}` : '';
      if (voyage.departure) {
        const { placeId } = resolvePlace(voyage.departure);
        if (placeId) {
          add(person, 'port', `${voyage.ship ?? 'Voyage'} — sailed from ${voyage.departure}${when}`);
        }
      }
      if (voyage.arrival) {
        // An arrival string can name several ports ("Fremantle … / Sydney …").
        const seen = new Set<string>();
        for (const rule of PLACE_RULES) {
          if (!rule.test.test(norm(voyage.arrival))) continue;
          const place = PLACE_BY_ID.get(rule.placeId);
          if (!place || seen.has(place.label)) continue;
          seen.add(place.label);
          add(person, 'port', `${voyage.ship ?? 'Voyage'} — ${voyage.arrival}${when}`);
        }
      }
    }
  }

  const pins: MapPin[] = [];
  for (const [placeId, events] of byPlace) {
    const place = PLACE_BY_ID.get(placeId);
    if (!place || place.lat == null || place.lon == null) {
      // Gazetteer entry without coordinates: report, never invent.
      const entry = missing.get(placeId) ?? { text: place?.label ?? placeId, count: 0, people: [] };
      entry.count += events.length;
      events.forEach((e) => entry.people.push({ id: e.personId, name: e.personName, kind: e.kind }));
      missing.set(placeId, entry);
      continue;
    }
    const lines = [...new Set(events.map((e) => e.line))];
    pins.push({
      place,
      events: events.sort((a, b) => a.kind.localeCompare(b.kind) || a.personName.localeCompare(b.personName)),
      personIds: [...new Set(events.map((e) => e.personId))],
      lines,
      approximate: place.geocoded === 'fallback',
      lat: place.lat,
      lon: place.lon,
    });
  }

  pins.sort((a, b) => b.events.length - a.events.length || a.place.label.localeCompare(b.place.label));

  return {
    pins,
    unlocated: [...missing.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)),
    totalFacts,
    locatedFacts: pins.reduce((n, p) => n + p.events.length, 0),
  };
}

export const EVENT_LABELS: Record<MapEventKind, string> = {
  birth: 'Born',
  death: 'Died',
  burial: 'Buried',
  residence: 'Lived',
  port: 'Voyage',
};

export const EVENT_PLURALS: Record<MapEventKind, string> = {
  birth: 'births',
  death: 'deaths',
  burial: 'burials',
  residence: 'homes',
  port: 'voyages',
};

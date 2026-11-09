#!/usr/bin/env node
/**
 * Build src/data/places.json — the coordinate gazetteer used by the family map.
 *
 * Every place that appears in src/data/familyData.ts is listed here by hand
 * (id + human label + the exact Nominatim query). Coordinates are looked up once
 * from OpenStreetMap's Nominatim service and then committed, so the map works
 * offline and never geocodes at runtime.
 *
 * Usage:  node scripts/geocode-places.mjs            (refresh from Nominatim)
 *         node scripts/geocode-places.mjs --check    (offline: verify offline entries)
 *
 * Nominatim usage policy: 1 request/second, identifying User-Agent, cache results.
 * Data © OpenStreetMap contributors, ODbL 1.0.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/places.json');

const UA = 'Buatti-Emmi-Ancestry-Map/1.0 (personal family-history project; info@danielebuatti.com)';

/**
 * `precision` describes how exact the point is:
 *  - address   : a house / street number mentioned in a document
 *  - street    : a street
 *  - cemetery  : a named cemetery
 *  - locality   : a frazione / contrada / small settlement
 *  - town      : the town itself (the usual case)
 *  - area      : "likely around X" — a guess, shown as approximate on the map
 */
const PLACES = [
  // ── Marche, Italy ────────────────────────────────────────────────────────
  {
    id: 'ascoli-piceno',
    label: 'Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'town',
    query: 'Ascoli Piceno, Provincia di Ascoli Piceno, Marche, Italia',
    pick: { preferNode: true },
    note: 'Main Buatti and Galanti town. Births, deaths and burials across four generations.',
  },
  {
    id: 'ascoli-borgo-solesta',
    label: 'Borgo Solestà, Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'locality',
    query: 'Borgo Solestà, Ascoli Piceno, Italy',
    fallback: 'ascoli-piceno',
    note: 'Family home at Alfredo Buatti Sr.\u2019s birth; also the cemetery where he, Ida and Ezio are buried.',
  },
  {
    id: 'cimitero-borgo-solesta',
    label: 'Cimitero di Borgo Solestà, Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'cemetery',
    query: 'Cimitero di Borgo Solestà, Ascoli Piceno, Italia',
    fallback: 'ascoli-piceno',
    note: 'Alfredo Buatti Sr. (d. 1964), Ida Galanti (d. 1970) and Ezio Buatti (d. 1991) share one ossuary here \u2014 Settore L, Blocco L074O, Lotto 074, Posto 8, Fila 1.',
  },
  {
    id: 'ascoli-duomo',
    label: 'Duomo parish, Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'locality',
    query: 'Piazza Arringo, Ascoli Piceno, Italy',
    fallback: 'ascoli-piceno',
    note: 'Parish of the 1888 Buatti birth.',
  },
  {
    id: 'ascoli-san-vittore',
    label: 'S. Vittore parish, Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'locality',
    query: 'San Vittore, Ascoli Piceno, Italy',
    fallback: 'ascoli-piceno',
    note: 'Parish given for one Buatti birth.',
  },
  {
    id: 'lisciano',
    label: 'Lisciano (Ascoli Piceno)',
    country: 'Italy',
    region: 'Marche',
    precision: 'locality',
    query: 'Lisciano, Ascoli Piceno, Marche',
    pick: { displayIncludes: 'Ascoli Piceno', displayExcludes: ['Comunanza', 'Roccafluvione'] },
    fallback: 'ascoli-piceno',
    note: 'Frazione of Ascoli Piceno.',
  },
  {
    id: 'maltignano',
    label: 'Maltignano',
    country: 'Italy',
    region: 'Marche',
    precision: 'town',
    query: 'Maltignano, Ascoli Piceno, Italy',
    note: 'Ezio and Lilia\u2019s last residence; both death acts are held by this comune.',
  },
  {
    id: 'rotella',
    label: 'Rotella',
    country: 'Italy',
    region: 'Marche',
    precision: 'town',
    query: 'Rotella, Ascoli Piceno, Italy',
  },
  {
    id: 'san-benedetto-del-tronto',
    label: 'San Benedetto del Tronto',
    country: 'Italy',
    region: 'Marche',
    precision: 'town',
    query: 'San Benedetto del Tronto, Ascoli Piceno, Italy',
    note: 'Birthplace of Bruna Lilia Chiappini (1930).',
  },
  {
    id: 'via-barro',
    label: 'Via T. B. Barro 11, Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'street',
    query: 'Via Barro, Ascoli Piceno, Italy',
    fallback: 'ascoli-piceno',
    note: 'Buatti home 1938\u20131948, from school and university enrolment forms.',
  },
  {
    id: 'via-mercantini',
    label: 'Via Mercantini 62, Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'street',
    query: 'Via Mercantini, Ascoli Piceno, Italy',
    fallback: 'ascoli-piceno',
    note: 'Address on Ezio\u2019s February 1952 university papers.',
  },
  {
    id: 'via-fabriano',
    label: 'Via Fabriano 25, Ascoli Piceno',
    country: 'Italy',
    region: 'Marche',
    precision: 'street',
    query: 'Via Fabriano, Ascoli Piceno, Italia',
    pick: { displayIncludes: 'Ascoli Piceno', displayExcludes: ['Folignano'] },
    fallback: 'ascoli-piceno',
    note: 'First appears on a 1964 document.',
  },

  // ── Sicily, Italy ────────────────────────────────────────────────────────
  {
    id: 'linguaglossa',
    label: 'Linguaglossa',
    country: 'Italy',
    region: 'Sicily',
    precision: 'town',
    query: 'Linguaglossa, Catania, Sicily, Italy',
    note: 'Emmi home town, under Etna. Gregorio Emmi born here 1915.',
  },
  {
    id: 'fiumefreddo',
    label: 'Fiumefreddo di Sicilia',
    country: 'Italy',
    region: 'Sicily',
    precision: 'town',
    query: 'Fiumefreddo di Sicilia, Catania, Sicily, Italy',
    note: 'Patan\u00e8 home town; Rosaria Patan\u00e8 born here 1924.',
  },
  {
    id: 'fiumefreddo-feudogrande',
    label: 'Sezione Feudogrande, Fiumefreddo',
    country: 'Italy',
    region: 'Sicily',
    precision: 'locality',
    query: 'Feudogrande, Fiumefreddo di Sicilia, Italy',
    fallback: 'fiumefreddo',
  },
  {
    id: 'fiumefreddo-castello',
    label: 'Sezione Castello, Fiumefreddo',
    country: 'Italy',
    region: 'Sicily',
    precision: 'locality',
    query: 'Castello, Fiumefreddo di Sicilia, Italy',
    fallback: 'fiumefreddo',
  },
  {
    id: 'calatabiano',
    label: 'Calatabiano',
    country: 'Italy',
    region: 'Sicily',
    precision: 'town',
    query: 'Calatabiano, Catania, Sicily, Italy',
    note: 'Rosario Patan\u00e8 Sr. born here 1889 (atto n. 28).',
  },
  {
    id: 'calatabiano-trifilippi',
    label: 'Contrada Trifilippi, Calatabiano',
    country: 'Italy',
    region: 'Sicily',
    precision: 'locality',
    query: 'Trifilippi, Calatabiano, Italy',
    fallback: 'calatabiano',
  },
  {
    id: 'via-roma-linguaglossa',
    label: 'Via Roma 333, Linguaglossa',
    country: 'Italy',
    region: 'Sicily',
    precision: 'street',
    query: 'Via Roma, Linguaglossa, Italy',
    fallback: 'linguaglossa',
    note: 'Emmi family address in Linguaglossa.',
  },
  {
    id: 'via-s-egidio',
    label: 'Via S. Egidio, Linguaglossa',
    country: 'Italy',
    region: 'Sicily',
    precision: 'street',
    query: "Via Sant'Egidio, Linguaglossa, Italy",
    fallback: 'linguaglossa',
    note: 'Place of death recorded for an Emmi relative.',
  },
  {
    id: 'milo',
    label: 'Milo (Catania)',
    country: 'Italy',
    region: 'Sicily',
    precision: 'town',
    query: 'Milo, Catania, Sicily, Italy',
    note: 'Patan\u00e8 residence before emigration.',
  },
  {
    id: 'acireale',
    label: 'Acireale',
    country: 'Italy',
    region: 'Sicily',
    precision: 'town',
    query: 'Acireale, Catania, Sicily, Italy',
  },
  {
    id: 'messina',
    label: 'Messina (port of departure)',
    country: 'Italy',
    region: 'Sicily',
    precision: 'town',
    query: 'Messina, Sicily, Italy',
    note: 'Patan\u00e8 and Emmi emigrants sailed from here (1950, 1951).',
  },
  {
    id: 'cividale',
    label: 'Cividale del Friuli',
    country: 'Italy',
    region: 'Friuli',
    precision: 'town',
    query: 'Cividale del Friuli, Udine, Italy',
    note: 'Hospital where one relative died (recorded only as "Hospital in Cividale").',
  },
  {
    id: 'trieste',
    label: 'Trieste (port of departure)',
    country: 'Italy',
    region: 'Friuli Venezia Giulia',
    precision: 'town',
    query: 'Trieste, Italy',
    note: 'Ezio and Lilia sailed from here on the Toscana, 1952.',
  },

  // ── Queensland, Australia ────────────────────────────────────────────────
  {
    id: 'ingham',
    label: 'Ingham, Queensland',
    country: 'Australia',
    region: 'Queensland',
    precision: 'town',
    query: 'Ingham, Queensland, Australia',
    note: 'Sugar-cane country. Emmi and Patan\u00e8 families settled here from 1950.',
  },
  {
    id: 'black-rock-qld',
    label: 'Black Rock, via Ingham',
    country: 'Australia',
    region: 'Queensland',
    precision: 'locality',
    query: 'Blackrock, Queensland, Australia',
    pick: { addresstype: ['locality', 'city_district'] },
    fallback: 'ingham',
    note: 'Gregorio Emmi worked as a cane cutter on Pietro Patan\u00e8\u2019s farm here.',
  },
  {
    id: 'ingham-cemetery',
    label: 'New Ingham Cemetery',
    country: 'Australia',
    region: 'Queensland',
    precision: 'cemetery',
    query: 'Ingham Cemetery, Queensland, Australia',
    fallback: 'ingham',
  },

  // ── Victoria, Australia ──────────────────────────────────────────────────
  {
    id: 'broadford',
    label: 'Broadford, Victoria',
    country: 'Australia',
    region: 'Victoria',
    precision: 'town',
    query: 'Broadford, Victoria, Australia',
    note: 'Alfred Buatti born here 1956; Ezio ran a caf\u00e9 and milk bar.',
  },
  {
    id: 'melbourne',
    label: 'Melbourne (port of departure)',
    country: 'Australia',
    region: 'Victoria',
    precision: 'town',
    query: 'Melbourne, Victoria, Australia',
    note: 'Ezio and his sons left for Italy on the Neptunia, 13 September 1963.',
  },
  {
    id: 'parkdale',
    label: 'Parkdale, Victoria',
    country: 'Australia',
    region: 'Victoria',
    precision: 'town',
    query: 'Parkdale, Victoria, Australia',
  },
  {
    id: 'richmond-vic',
    label: 'Richmond, Victoria',
    country: 'Australia',
    region: 'Victoria',
    precision: 'town',
    query: 'Richmond, Victoria, Australia',
  },
  {
    id: 'punt-road',
    label: '303 Punt Road, Richmond',
    country: 'Australia',
    region: 'Victoria',
    precision: 'address',
    query: 'Punt Road, Richmond, Victoria, Australia',
    fallback: 'richmond-vic',
    note: 'Buatti family address in 1965.',
  },
  {
    id: 'springvale-cemetery',
    label: 'Springvale Botanical Cemetery',
    country: 'Australia',
    region: 'Victoria',
    precision: 'cemetery',
    query: 'Springvale Botanical Cemetery, Victoria, Australia',
    fallback: 'springvale-vic',
  },
  {
    id: 'springvale-vic',
    label: 'Springvale, Victoria',
    country: 'Australia',
    region: 'Victoria',
    precision: 'town',
    query: 'Springvale, Victoria, Australia',
  },
  {
    id: 'cheltenham-cemetery',
    label: 'Cheltenham Memorial Cemetery',
    country: 'Australia',
    region: 'Victoria',
    precision: 'cemetery',
    query: 'Cheltenham Memorial Cemetery, Victoria, Australia',
    fallback: 'cheltenham-vic',
  },
  {
    id: 'cheltenham-vic',
    label: 'Cheltenham, Victoria',
    country: 'Australia',
    region: 'Victoria',
    precision: 'town',
    query: 'Cheltenham, Victoria, Australia',
  },

  // ── New South Wales, Australia ───────────────────────────────────────────
  {
    id: 'sydney',
    label: 'Sydney, New South Wales',
    country: 'Australia',
    region: 'New South Wales',
    precision: 'town',
    query: 'Sydney, New South Wales, Australia',
    note: 'Main arrival port for the family\u2019s migrant ships.',
  },
  {
    id: 'rookwood-cemetery',
    label: 'Rookwood Catholic Cemetery',
    country: 'Australia',
    region: 'New South Wales',
    precision: 'cemetery',
    query: 'Rookwood Cemetery, New South Wales, Australia',
    fallback: 'sydney',
  },
  {
    id: 'leeton',
    label: 'Leeton, New South Wales',
    country: 'Australia',
    region: 'New South Wales',
    precision: 'town',
    query: 'Leeton, New South Wales 2705, Australia',
  },
  {
    id: 'wamoon',
    label: 'Wamoon, near Leeton',
    country: 'Australia',
    region: 'New South Wales',
    precision: 'locality',
    query: 'Wamoon, New South Wales, Australia',
    fallback: 'leeton',
    note: 'Farm 732 — Patan\u00e8 family residence.',
  },
  {
    id: 'cowra',
    label: 'Cowra, New South Wales',
    country: 'Australia',
    region: 'New South Wales',
    precision: 'town',
    query: 'Cowra, New South Wales 2794, Australia',
    note: 'POW Camp No. 12, where Gregorio Emmi was interned from 1943.',
  },

  // ── Elsewhere ────────────────────────────────────────────────────────────
  {
    id: 'brisbane',
    label: 'Brisbane, Queensland',
    country: 'Australia',
    region: 'Queensland',
    precision: 'town',
    query: 'Brisbane, Queensland, Australia',
    note: 'Rosaria and Concetta arrived here on the SS Surriento, 1951.',
  },
  {
    id: 'fremantle',
    label: 'Fremantle, Western Australia',
    country: 'Australia',
    region: 'Western Australia',
    precision: 'town',
    query: 'Fremantle, Western Australia, Australia',
    note: 'First Australian landfall for the Toscana, September 1952.',
  },
];

function matchesPick(row, pick) {
  if (pick.preferNode && row.osm_type === 'node') return true;
  if (pick.addresstype && pick.addresstype.includes(row.addresstype)) return true;
  if (pick.displayIncludes && !row.display_name.includes(pick.displayIncludes)) return false;
  if (pick.displayExcludes && pick.displayExcludes.some((x) => row.display_name.includes(x))) return false;
  return !pick.preferNode && !pick.addresstype;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function lookup(place) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=' +
    encodeURIComponent(place.query);
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status} for ${place.query}`);
  const all = await res.json();
  const rows = place.pick ? all.filter((row) => matchesPick(row, place.pick)) : all;
  const r = (rows.length ? rows : all)[0];
  if (!r) return null;
  return {
    lat: Number(Number(r.lat).toFixed(5)),
    lon: Number(Number(r.lon).toFixed(5)),
    osmType: r.osm_type,
    osmId: r.osm_id,
    matched: r.display_name,
  };
}

const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { places: [] };
const byId = new Map((existing.places ?? []).map((p) => [p.id, p]));
const checkOnly = process.argv.includes('--check');

const out = [];
for (const p of PLACES) {
  if (checkOnly) {
    const prior = byId.get(p.id);
    if (!prior || typeof prior.lat !== 'number') {
      console.error(`MISSING  ${p.id}`);
    }
    if (prior) out.push({ ...prior, ...stripped(p) });
    continue;
  }

  process.stdout.write(`… ${p.id} `);
  let hit = null;
  try {
    hit = await lookup(p);
  } catch (err) {
    console.error(`\n  FAILED ${p.id}: ${err.message}`);
  }
  await sleep(1100); // Nominatim policy: max 1 request per second

  const prior = byId.get(p.id);
  const base = stripped(p);

  if (!hit && p.fallback) {
    const fb = byId.get(p.fallback);
    console.log(`no hit → fallback ${p.fallback}`);
    out.push({
      ...base,
      lat: fb?.lat ?? null,
      lon: fb?.lon ?? null,
      fallbackId: p.fallback,
      geocoded: 'fallback',
      matched: fb ? `approximated to ${fb.label}` : null,
    });
    continue;
  }
  if (!hit) {
    console.log('no hit');
    out.push({ ...base, lat: prior?.lat ?? null, lon: prior?.lon ?? null, geocoded: prior ? 'manual' : 'failed' });
    continue;
  }
  console.log(`ok  ${hit.lat}, ${hit.lon}  ${hit.matched}`);
  out.push({
    ...base,
    lat: hit.lat,
    lon: hit.lon,
    osmType: hit.osmType,
    osmId: hit.osmId,
    matched: hit.matched,
    geocoded: 'nominatim',
  });
}

function stripped(p) {
  return {
    id: p.id,
    label: p.label,
    country: p.country,
    region: p.region,
    precision: p.precision,
    query: p.query,
    ...(p.fallback ? { fallbackId: p.fallback } : {}),
    ...(p.note ? { note: p.note } : {}),
  };
}

const payload = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'OpenStreetMap Nominatim (ODbL 1.0) — https://nominatim.openstreetmap.org',
  attribution: '© OpenStreetMap contributors',
  places: out,
};
writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
console.log(`\nwrote ${OUT} — ${out.length} places`);

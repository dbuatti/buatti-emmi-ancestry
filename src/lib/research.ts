import type { Person } from '@/types';

export interface CompletenessResult {
  score: number;
  found: number;
  searching: number;
  notFound: number;
  total: number;
}

export function calculateCompleteness(person: Person): CompletenessResult {
  const records = person.records;
  if (!records || records.length === 0) {
    return { score: 0, found: 0, searching: 0, notFound: 0, total: 0 };
  }

  let found = 0;
  let searching = 0;
  let notFound = 0;

  for (const record of records) {
    if (record.status === 'Found') found++;
    else if (record.status === 'Searching') searching++;
    else notFound++;
  }

  const total = records.length;
  const points = found + searching * 0.5;
  const score = Math.round((points / total) * 100);

  return { score, found, searching, notFound, total };
}

export function getScoreColor(score: number): string {
  if (score === 100) return 'text-emerald-700 bg-emerald-100 border-emerald-300';
  if (score >= 60) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 30) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
}

export function getScoreLabel(score: number): string {
  if (score === 100) return 'All records found';
  if (score >= 60) return 'Good progress';
  if (score >= 30) return 'Needs work';
  return 'Priority';
}

export function getScoreBadgeColor(score: number): string {
  if (score === 100) return 'bg-emerald-800 text-white';
  if (score >= 60) return 'bg-emerald-600 text-white';
  if (score >= 30) return 'bg-amber-600 text-white';
  return 'bg-rose-700 text-white';
}

import type { Person } from '@/types';
import type { OpenQuestion } from '@/types';

export interface CompletenessResult {
  score: number;
  found: number;
  requested: number;
  searching: number;
  notFound: number;
  total: number;
  breakdown: {
    records: number;
    status: number;
    facts: number;
    questions: number;
    tasks: number;
  };
}

export function calculateCompleteness(
  person: Person,
  openQuestions?: OpenQuestion[],
  pendingTaskCount?: number,
  verifiedRecordCount?: number,
  relevantQuestionCount?: number
): CompletenessResult {
  const records = person.records;

  // Records score (40%): verified Found=1, Found (unverified)=0.5,
  // Requested=0.35, Searching=0.25, Not Found (or anything else)=0.
  // Verified count is capped at the number of Found records so stray
  // verified links can't inflate the score beyond what's actually found.
  let recordsScore = 0;
  let found = 0;
  let requested = 0;
  let searching = 0;
  let notFound = 0;
  const total = records?.length ?? 0;
  if (records && records.length > 0) {
    for (const record of records) {
      if (record.status === 'Found') found++;
      else if (record.status === 'Requested') requested++;
      else if (record.status === 'Searching') searching++;
      else notFound++;
    }
    const verified = Math.min(verifiedRecordCount ?? 0, found);
    const unverifiedFound = Math.max(0, found - verified);
    recordsScore =
      (verified * 1.0 + unverifiedFound * 0.5 + requested * 0.35 + searching * 0.25) / total;
  }

  // Research status score (20%): statuses carry suffixes
  // ("Confirmed — Fully Mapped", "In Progress — Marriage Cert Requested"),
  // so match on the leading word.
  const leadingStatus = (person.researchStatus?.status ?? '').split(' — ')[0];
  const statusMap: Record<string, number> = {
    'Confirmed': 1.0,
    'In Progress': 0.5,
    'Outstanding': 0.2,
    'Ruled Out': 0.0,
  };
  const statusScore = statusMap[leadingStatus] ?? 0;

  // Facts score (20%): count present key facts
  const keyFacts = [
    !!person.birthDate,
    !!person.birthPlace,
    person.isLiving ? true : !!person.deathDate,
    (person.parents?.length ?? 0) > 0,
    (person.spouses?.length ?? 0) > 0,
  ];
  const factsScore = keyFacts.filter(Boolean).length / keyFacts.length;

  // Open questions score (10%): penalty for unresolved questions ABOUT THIS
  // PERSON. When the caller passes a person-scoped unresolved count, use it;
  // otherwise fall back to the person's whole line (legacy behaviour).
  // Each unresolved question reduces score by 20%, floored at 0.
  let questionsScore = 1.0;
  if (relevantQuestionCount !== undefined) {
    questionsScore = Math.max(0, 1 - relevantQuestionCount * 0.2);
  } else if (openQuestions && openQuestions.length > 0) {
    const lineCategory = person.line === 'Buatti' || person.line === 'Chiappini' ? 'Buatti/Chiappini' : 'Emmi/Patanè';
    const personQuestions = openQuestions.filter(
      (q) => q.category === lineCategory && q.status !== 'Resolved'
    );
    questionsScore = Math.max(0, 1 - personQuestions.length * 0.2);
  }

  // Pending tasks score (10%): penalty for pending tasks
  let tasksScore = 1.0;
  if (pendingTaskCount && pendingTaskCount > 0) {
    tasksScore = Math.max(0, 1 - pendingTaskCount * 0.2);
  }

  // Weighted average
  const weights = { records: 0.4, status: 0.2, facts: 0.2, questions: 0.1, tasks: 0.1 };
  const totalScore =
    recordsScore * weights.records +
    statusScore * weights.status +
    factsScore * weights.facts +
    questionsScore * weights.questions +
    tasksScore * weights.tasks;

  const score = Math.round(totalScore * 100);

  return {
    score,
    found,
    requested,
    searching,
    notFound,
    total,
    breakdown: {
      records: Math.round(recordsScore * 100),
      status: Math.round(statusScore * 100),
      facts: Math.round(factsScore * 100),
      questions: Math.round(questionsScore * 100),
      tasks: Math.round(tasksScore * 100),
    },
  };
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

// Family data wrapper.
//
// In a normal build, @/data/familyData resolves to src/data/familyData.ts (full data).
// In a family build (FAMILY_BUILD=1), the Vite alias in vite.config.ts redirects
// @/data/familyData to src/data/family/familyData.generated.ts (family-safe data).
// So this wrapper is a thin indirection that lets the alias do the switching.

import type { Person, ResearchLead, OpenQuestion } from '@/types';

const { initialPeople: basePeople, initialResearchLeads: baseLeads, initialOpenQuestions: baseQuestions } =
  await import('@/data/familyData');

export const initialPeople: Person[] = basePeople as Person[];
export const initialResearchLeads: ResearchLead[] = (baseLeads ?? []) as ResearchLead[];
export const initialOpenQuestions: OpenQuestion[] = (baseQuestions ?? []) as OpenQuestion[];
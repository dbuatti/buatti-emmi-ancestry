export interface RecordStatus {
  type: string;
  status: 'Found' | 'Not Found' | 'Searching' | 'Ruled Out';
  notes?: string;
}

export interface Person {
  id: string;
  name: string;
  generation: number;
  line: 'Buatti' | 'Chiappini' | 'Emmi' | 'Patanè' | 'Other';
  gender: 'M' | 'F';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  burialPlace?: string;
  burialDetails?: string;
  burialLink?: string;
  spouses: string[];
  parents: string[];
  children: string[];
  siblings?: string[];
  notes?: string[];
  occupations?: string[];
  residences?: string[];
  physicalDescription?: {
    height?: string;
    build?: string;
    hair?: string;
    eyes?: string;
    other?: string;
  };
  migration?: {
    details?: string;
    voyages?: {
      ship?: string;
      departure?: string;
      arrival?: string;
      date?: string;
      details?: string;
    }[];
    sponsorship?: string;
    settled?: string;
  };
  military?: {
    service?: string;
    captured?: string;
    internment?: string;
    repatriation?: string;
    details?: string;
  };
  researchStatus: {
    status: 'Confirmed' | 'In Progress' | 'Outstanding' | 'Ruled Out';
    details?: string;
    nextSteps?: string[];
  };
  records?: RecordStatus[];
  sources?: {
    title: string;
    type: string;
    reference?: string;
    link?: string;
  }[];
  isLiving?: boolean;
}

export interface ResearchLead {
  id: string;
  title: string;
  category: 'Buatti/Chiappini' | 'Emmi/Patanè' | 'General';
  status: 'To Investigate' | 'In Progress' | 'Ruled Out' | 'Completed';
  description: string;
  whyRuledOut?: string;
  nextSteps?: string;
  sources?: string[];
}

export interface OpenQuestion {
  id: string;
  question: string;
  category: 'Buatti/Chiappini' | 'Emmi/Patanè';
  status: 'Pending' | 'In Progress' | 'Resolved';
  notes?: string;
}

export type FamilyLine = Person['line'];
export type ResearchStatus = Person['researchStatus']['status'];
export type LeadCategory = ResearchLead['category'];
export type LeadStatus = ResearchLead['status'];
export type QuestionCategory = OpenQuestion['category'];
export type QuestionStatus = OpenQuestion['status'];

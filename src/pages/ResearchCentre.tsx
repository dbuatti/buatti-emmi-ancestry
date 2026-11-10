import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CorrespondenceList } from '@/components/CorrespondenceList';
import { ThreadReader } from '@/components/ThreadReader';
import { RequestReview } from '@/components/RequestReview';
import { NewItemsView } from '@/components/NewItemsView';
import { NextCorrespondenceAction } from '@/components/NextCorrespondenceAction';
import { DecisionsLog } from '@/components/DecisionsLog';
import { ScanStatusBanner } from '@/components/ScanStatusBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export interface CorrespondenceAttachment {
  id?: number;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  local_path?: string;
  downloaded?: boolean;
  unavailable?: boolean;
  unavailable_reason?: string;
  gmail_attachment_id?: string;
}

export interface CorrespondenceMessage {
  id: number;
  account_email: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  direction: 'in' | 'out';
  from_name?: string;
  from_email?: string;
  subject?: string;
  snippet?: string;
  to_json?: string;
  cc_json?: string;
  received_at?: string;
  sent_at?: string;
  message_type?: string;
  action_status?: string;
  genealogy_relevance?: string;
  body_text?: string;
  body_html_path?: string;
  raw_path?: string;
  attachments?: CorrespondenceAttachment[];
  attachment_count?: number;
}

export function ResearchCentre() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'correspondence';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [relevance, setRelevance] = useState<'definite' | 'possible' | 'all'>('definite');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif selection:bg-[#800020]/20 selection:text-[#800020]">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <Mail className="w-8 h-8 text-[#800020]" />
            Correspondence
          </h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            The living inbox of research correspondence — Gmail messages and attachments Daniele sends or
            receives, swept daily, classified against the family tree, and turned into tracked requests,
            drafts and chases.
          </p>
        </div>

        <ScanStatusBanner />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 h-auto flex-wrap justify-start">
            <TabsTrigger value="correspondence">Correspondence</TabsTrigger>
            <TabsTrigger value="newitems">New items</TabsTrigger>
            <TabsTrigger value="requests">Request review</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
          </TabsList>

          <TabsContent value="correspondence">
            <p className="text-xs text-stone-500 font-sans mb-3 max-w-3xl">
              Archive view: the full imported history of Gmail threads. Read, classify relevance, and follow
              the next-action trail (get document, chase, process inbox).
            </p>
            <NextCorrespondenceAction />
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 font-sans">Relevance</label>
              <Select value={relevance} onValueChange={(v) => setRelevance(v as 'definite' | 'possible' | 'all')}>
                <SelectTrigger className="w-40 bg-white border-stone-300 min-h-[40px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="definite">Definite</SelectItem>
                  <SelectItem value="possible">Possible</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              </div>
              <p className="text-[11px] text-stone-500 font-sans pb-2">
                Definite = from a government office or archive · Possible = may be relevant · All = everything imported
              </p>
            </div>

            <Card className="border-stone-200">
              <CardContent className="p-4">
                <CorrespondenceList
                  key={relevance}
                  relevance={relevance}
                  onSelectThread={(threadId) => { setSelectedThreadId(threadId); setThreadOpen(true); }}
                  setIsDetailOpen={() => {}}
                />
              </CardContent>
            </Card>

            <ThreadReader
              threadId={selectedThreadId}
              open={threadOpen}
              onOpenChange={setThreadOpen}
            />
          </TabsContent>

          <TabsContent value="newitems">
            <p className="text-xs text-stone-500 font-sans mb-3 max-w-3xl">
              Unreviewed messages the daily sweep detected as new. Triage here before they age into the archive.
            </p>
            <NewItemsView />
          </TabsContent>

          <TabsContent value="requests">
            <p className="text-xs text-stone-500 font-sans mb-3 max-w-3xl">
              Approved research requests we are waiting on (or chasing — 30-day window before the next chase).
            </p>
            <RequestReview />
          </TabsContent>

          <TabsContent value="decisions">
            <p className="text-xs text-stone-500 font-sans mb-3 max-w-3xl">
              Audit trail of correspondence-driven actions: classifications, request states, and resolutions.
            </p>
            <DecisionsLog />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

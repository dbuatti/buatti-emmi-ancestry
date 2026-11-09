import React, { useState } from 'react';
import { TrendingUp, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CorrespondenceList } from '@/components/CorrespondenceList';
import { ThreadReader } from '@/components/ThreadReader';
import { RequestReview } from '@/components/RequestReview';
import { NextCorrespondenceAction } from '@/components/NextCorrespondenceAction';
import { DecisionsLog } from '@/components/DecisionsLog';
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
          <p className="text-stone-600 font-sans">
            Browse, read and review imported Gmail correspondence and attachments.
          </p>
        </div>

        <Tabs defaultValue="correspondence" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="correspondence">Correspondence</TabsTrigger>
            <TabsTrigger value="requests">Request review</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
          </TabsList>

          <TabsContent value="correspondence">
            <NextCorrespondenceAction />
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm text-stone-600 font-sans">Relevance:</label>
              <Select value={relevance} onValueChange={(v) => setRelevance(v as 'definite' | 'possible' | 'all')}>
                <SelectTrigger className="w-40 bg-white border-stone-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="definite">Definite</SelectItem>
                  <SelectItem value="possible">Possible</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
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

          <TabsContent value="requests">
            <RequestReview />
          </TabsContent>

          <TabsContent value="decisions">
            <DecisionsLog />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

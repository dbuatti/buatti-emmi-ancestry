import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Send, Save, Loader2, Check, AlertCircle, Languages } from 'lucide-react';

interface DraftGeneratorPanelProps {
  threadId: string;
  gmailThreadId: string;
  accountEmail: string;
  composeAvailable: boolean;
  institution: string;
  people: string[];
  protocolRefs: string[];
  latestSnippet: string;
  classification: string;
  prefillTemplate?: string;
}

export const DraftGeneratorPanel = ({
  threadId,
  gmailThreadId,
  accountEmail,
  composeAvailable,
  institution,
  people,
  protocolRefs,
  latestSnippet,
  classification,
  prefillTemplate,
}: DraftGeneratorPanelProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState(prefillTemplate || '');
  const [subject, setSubject] = useState('');
  const [to, setTo] = useState('');
  const [saved, setSaved] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const buildPrompt = () => {
    const parts = [
      'You are Daniele Buatti, an Australian citizen of Italian descent researching his family history from Australia.',
      'You are writing a reply TO the institution/office that sent the latest incoming message below.',
      'You are the REQUESTER (the genealogy researcher), NOT the office. Never write as if you are the institution answering.',
      '',
      'Write in Italian (or English if the correspondent writes in English).',
      '',
      `Institution you are writing to: ${institution || 'Unknown'}`,
      `Your ancestors/people mentioned: ${people.join(', ') || 'None'}`,
      `Protocol refs to cite verbatim if referring to prior requests: ${protocolRefs.join(', ') || 'None'}`,
      `Thread classification: ${classification || 'Unknown'}`,
      '',
      'The latest incoming message from them:',
      latestSnippet || '(no snippet available)',
      '',
      'Write a concise reply FROM Daniele that:',
      '1. Addresses them politely (Gentile/Gentili ...)',
      '2. Cites any protocol numbers verbatim (e.g. prot. 0062771/2026) when referring to prior requests',
      '3. Acknowledges what they said, thanks them if they did work, asks for clarification if needed',
      '4. Requests exactly one thing where possible',
      '5. Signs as Daniele Buatti (writing from Australia)',
      '',
      'Output ONLY the email body (no subject line).',
    ];
    return parts.join('\n');
  };

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Claude's rule: hold new drafts when a person already has 2+ open requests.
  const checkHold = async (): Promise<string[]> => {
    try {
      const res = await fetch('/api/correspondence/person-requests');
      if (!res.ok) return [];
      const data = await res.json();
      interface PersonRequest { person_id: string; hold?: boolean; }
      const holding = new Set<string>(
        ((data.people || []) as PersonRequest[]).filter((p) => p.hold).map((p) => p.person_id),
      );
      const held: string[] = [];
      for (const name of people) {
        if (holding.has(slugify(name))) held.push(name);
      }
      // Also try matching by last name token against person_ids.
      if (held.length === 0) {
        for (const name of people) {
          const tokens = name.toLowerCase().split(/\\s+/).filter(Boolean);
          for (const pid of holding) {
            if (tokens.some((t) => String(pid).includes(t))) { held.push(name); break; }
          }
        }
      }
      return Array.from(new Set(held));
    } catch {
      return [];
    }
  };

  const generateDraft = async () => {
    const held = await checkHold();
    if (held.length > 0) {
      const ok = window.confirm(
        `HOLD (Claude rule): ${held.join(', ')} already has 2+ open requests. ` +
        `Sending another now may crowd the correspondent. Generate a draft anyway?`,
      );
      if (!ok) return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/assistant/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          gmailThreadId,
          accountEmail,
          prompt: buildPrompt(),
        }),
      });
      if (!res.ok) throw new Error('Failed to generate draft');
      const data = await res.json();
      setDraft(data.draft || '');
      setSubject(data.subject || `Re: ${institution || 'Your inquiry'}`);
      toast({ title: 'Draft generated', description: 'Review and edit before sending' });
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!draft.trim()) return;
    try {
      await fetch('/api/assistant/draft-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          gmailThreadId,
          accountEmail,
          draft,
          subject,
          to,
        }),
      });
      setSaved(true);
      toast({ title: 'Draft saved', description: 'Saved to local drafts directory' });
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  const sendDraft = async () => {
    const held = await checkHold();
    if (held.length > 0) {
      const ok = window.confirm(
        `HOLD (Claude rule): ${held.join(', ')} already has 2+ open requests. Send to Gmail anyway?`,
      );
      if (!ok) return;
    }
    if (!composeAvailable) {
      toast({ title: 'Compose unavailable', description: 'Use copy-paste mode for this account', variant: 'destructive' });
      return;
    }
    try {
      await fetch('/api/assistant/draft-send-gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          gmailThreadId,
          accountEmail,
          draft,
          subject,
          to,
        }),
      });
      toast({ title: 'Draft sent to Gmail', description: 'Check your Drafts folder to review and send' });
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    toast({ title: 'Copied', description: 'Draft copied to clipboard' });
  };

  const translateDraft = async () => {
    if (!draft.trim()) return;
    setTranslating(true);
    setTranslation(null);
    try {
      const res = await fetch('/api/assistant/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft, target: 'en' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }
      const data = await res.json();
      setTranslation(data.translation || '');
    } catch (e) {
      toast({ title: 'Translation failed', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  };

  return (
    <Card className="border-stone-200">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Generate Reply Draft</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Re: ..."
              className="bg-white border-stone-300"
            />
          </div>
          <div>
            <Label>To</Label>
            <Input
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="bg-white border-stone-300"
            />
          </div>
        </div>

        <div>
          <Label>Draft Body</Label>
          <Textarea
            value={draft}
            onChange={e => { setDraft(e.target.value); setSaved(false); }}
            placeholder="Click 'Generate Draft' to create a reply..."
            className="bg-white border-stone-300 font-serif h-64"
            rows={12}
          />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
          <Button
            onClick={generateDraft}
            disabled={isGenerating}
            className="bg-[#800020] hover:bg-[#600018]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…
              </>
            ) : (
              'Generate Draft'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={!draft.trim()}
          >
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button
            variant="outline"
            onClick={sendDraft}
            disabled={!draft.trim() || !composeAvailable}
          >
            <Send className="w-4 h-4 mr-2" /> {composeAvailable ? 'Send to Gmail' : 'Compose Unavailable'}
          </Button>
          <Button
            variant="ghost"
            onClick={copyDraft}
            disabled={!draft.trim()}
          >
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
          <Button
            variant="outline"
            onClick={translateDraft}
            disabled={!draft.trim() || translating}
          >
            <Languages className="w-4 h-4 mr-2" /> {translating ? 'Translating…' : 'Translate to English'}
          </Button>
        </div>

        {saved && (
          <div className="text-xs text-emerald-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Saved to local drafts
          </div>
        )}

        {translation && (
          <div className="pt-2 border-t border-stone-200">
            <p className="text-xs font-semibold text-stone-700 mb-1">English Translation</p>
            <div className="bg-stone-50 border border-stone-200 rounded p-3 text-sm text-stone-700 whitespace-pre-wrap">
              {translation}
            </div>
          </div>
        )}

        {!composeAvailable && (
          <div className="text-xs text-stone-500 flex items-center gap-1 bg-stone-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            This account has read-only Gmail scope. Generated drafts must be copied and pasted manually.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
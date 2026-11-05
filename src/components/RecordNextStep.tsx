import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getNextStepInfo } from '@/lib/workflow-steps';
import type { RecordFrontMatter } from '@/types/record';

interface RecordNextStepProps {
  recordId: string;
  frontMatter: RecordFrontMatter;
  isDev: boolean;
  onCheckAgainstImage: () => void;
}

export function RecordNextStep({
  recordId,
  frontMatter,
  isDev,
  onCheckAgainstImage,
}: RecordNextStepProps) {
  const [copied, setCopied] = useState(false);
  const next = getNextStepInfo(frontMatter);

  if (!next) {
    return (
      <Card className="border-emerald-300 bg-emerald-50/60">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Next step
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-emerald-900">
            All five steps are done for this record.
          </p>
        </CardContent>
      </Card>
    );
  }

  const prompt = next.prompt?.(recordId);

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (non-secure context) — fall back to a temp textarea
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-[#800020]/40 bg-white">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-bold text-[#800020] uppercase tracking-wider">
          Next step — Step {next.number} of 5: {next.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${
              next.actor === 'you'
                ? 'bg-[#800020] text-white'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {next.actor === 'you' ? 'You' : 'OpenCode'}
          </span>
          <p className="text-xs text-stone-600">
            {next.actor === 'you'
              ? 'Only you can do this one.'
              : 'Ask in chat — nothing is applied without your say-so.'}
          </p>
        </div>

        <p className="text-sm text-stone-800 leading-snug">{next.blurb(recordId)}</p>

        {prompt && (
          <div className="rounded border border-stone-200 bg-stone-50 p-2">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">
              Prompt for OpenCode
            </p>
            <p className="text-xs text-stone-700 font-mono break-words">{prompt}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {next.number === 3 && isDev && (
            <Button size="sm" variant="default" className="text-xs h-7 px-3" onClick={onCheckAgainstImage}>
              Check against image
            </Button>
          )}
          {prompt && (
            <Button size="sm" variant="outline" className="text-xs h-7 px-3" onClick={handleCopyPrompt}>
              {copied ? 'Copied ✓' : 'Copy prompt'}
            </Button>
          )}
          {next.number === 5 && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-3"
              onClick={() => window.open('https://www.familysearch.org/tree/find/name', '_blank')}
            >
              Open FamilySearch ↗
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

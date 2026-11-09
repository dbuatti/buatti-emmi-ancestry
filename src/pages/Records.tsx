import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllRecords } from '@/lib/record-loader';
import type { RecordEntry } from '@/lib/record-loader';
import { stepLabel, type WorkflowStep } from '@/types/record';

export default function Records() {
  const [records, setRecords] = useState<RecordEntry[] | null>(null);

  useEffect(() => {
    let alive = true;
    getAllRecords().then((rs) => { if (alive) setRecords(rs); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#800020]" />
            Records
          </h1>
          <p className="text-stone-600 font-sans max-w-3xl">
            Every transcription record filed in the research workspace, and where each one sits in the
            workflow (filed → transcribed → verified → in app → on FamilySearch).
          </p>
        </div>

        {records === null ? (
          <p className="text-sm text-stone-500 font-sans">Loading records…</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-stone-500 font-sans">No records yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((r) => (
              <Link key={r.id} to={`/research/records/${r.id}`} className="block">
                <Card className="border-stone-200 hover:border-[#800020] transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-serif flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#800020]" />
                      {r.frontMatter.type || 'Record'} — {r.frontMatter.id}
                    </CardTitle>
                    <CardDescription>
                      {r.frontMatter.date || 'undated'} · {r.frontMatter.place || ''}
                      {r.frontMatter.protocol ? ` · prot. ${r.frontMatter.protocol}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        Step: {stepLabel(r.step as WorkflowStep)}
                      </span>
                      {r.frontMatter.people?.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[#F4EFE6] text-[#800020]">
                          {r.frontMatter.people.join(', ')}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#800020] p-0">
                      Open record <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

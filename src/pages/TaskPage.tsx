import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NextGuide } from '@/components/NextGuide';
import { getAllRecords } from '@/lib/record-loader';

export default function TaskPage() {
  const [records, setRecords] = useState<Awaited<ReturnType<typeof getAllRecords>>>([]);

  useEffect(() => {
    getAllRecords().then(setRecords).catch(() => setRecords([]));
  }, []);

  const incomplete = records.filter((r) => r.stepNumber < 5);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-2">
            <ListTodo className="w-8 h-8 text-[#800020]" /> Tasks
          </h1>
          <p className="text-stone-600 font-sans">Walk through every pending task, one at a time.</p>
        </div>

        <NextGuide />

        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              Incomplete records ({incomplete.length} of {records.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incomplete.length === 0 && (
              <p className="text-xs text-stone-500">All records complete.</p>
            )}
            {incomplete.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="min-w-0">
                  <Link to={`/research/records/${r.id}`} className="text-sm font-medium text-[#800020] hover:underline truncate block">
                    {r.id}
                  </Link>
                  <div className="text-xs text-stone-500">
                    Step {r.stepNumber}/5 — {r.step}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {r.stepNumber < 3 ? <Clock className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                  {r.stepNumber}/5
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
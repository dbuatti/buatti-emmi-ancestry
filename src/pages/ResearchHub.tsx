import { Link } from 'react-router-dom';
import { Mail, ListTodo, Users, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HUBS = [
  { to: '/research/centre', icon: Mail, title: 'Correspondence Centre', desc: 'Sweep, review, draft, and track research correspondence.' },
  { to: '/research/tasks', icon: ListTodo, title: 'Tasks', desc: 'Walk through every pending task, one at a time.' },
  { to: '/research/people', icon: Users, title: 'People', desc: 'Browse and edit person records and life events.' },
  { to: '/research/records', icon: FileText, title: 'Records', desc: 'View and verify transcription records.' },
];

export default function ResearchHub() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Research</h1>
          <p className="text-stone-600 font-sans">Pick a workspace.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HUBS.map((h) => (
            <Link key={h.to} to={h.to} className="block">
              <Card className="border-stone-200 hover:border-[#800020] transition-colors h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-serif flex items-center gap-2">
                    <h.icon className="w-6 h-6 text-[#800020]" />
                    {h.title}
                  </CardTitle>
                  <CardDescription>{h.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="text-[#800020]">
                    Open <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/research/assistant" className="text-sm text-[#800020] underline">
            Research Assistant (suggestions, drafts, thread analysis)
          </Link>
        </div>
      </main>
    </div>
  );
}
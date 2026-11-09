import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import { FamilySearchCheck } from '@/components/FamilySearchCheck';

export default function FamilySearchCheckPage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const person = initialPeople.find((p) => p.id === personId);
  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-3 h-3 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-serif text-[#800020]">
          FamilySearch check — {person?.name ?? personId}
        </h1>
        {person ? (
          <FamilySearchCheck person={person} people={initialPeople} />
        ) : (
          <p className="text-sm text-stone-600">No person with id "{personId}".</p>
        )}
      </div>
    </div>
  );
}

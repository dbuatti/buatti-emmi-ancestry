import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitFork, Waypoints, GitBranch, Users } from 'lucide-react';
import { initialPeople } from '@/data/familyDataWrapper';
import { PedigreeChart } from '@/components/PedigreeChart';
import { TreeEgo } from '@/components/TreeEgo';
import { TreeConnected } from '@/components/TreeConnected';

const FamilyTree = () => {
  const navigate = useNavigate();
  const [selectedPersonId, setSelectedPersonId] = useState('daniele-buatti');
  const goPerson = (id: string) => navigate(`/family/people/${id}`);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#800020] font-serif">Family Tree</h2>
        <p className="text-xs text-stone-500 font-sans">Explore our family across generations. Tap a name to view their profile.</p>
      </div>
      <Tabs defaultValue="pedigree" className="space-y-4">
        <TabsList className="bg-[#F4EFE6] border border-stone-200 p-1">
          <TabsTrigger value="pedigree" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
            <GitFork className="w-4 h-4" /> Pedigree
          </TabsTrigger>
          <TabsTrigger value="ego" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
            <Waypoints className="w-4 h-4" /> Ego Tree
          </TabsTrigger>
          <TabsTrigger value="connected" className="font-sans data-[state=active]:bg-[#800020] data-[state=active]:text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Connected
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pedigree">
          <PedigreeChart people={initialPeople} selectedPersonId={selectedPersonId} onSelectPerson={(id) => { setSelectedPersonId(id); goPerson(id); }} />
        </TabsContent>
        <TabsContent value="ego">
          <TreeEgo people={initialPeople} selectedPersonId={selectedPersonId} onSelectPerson={(id) => { setSelectedPersonId(id); goPerson(id); }} />
        </TabsContent>
        <TabsContent value="connected">
          <TreeConnected people={initialPeople} selectedPersonId={selectedPersonId} onSelectPerson={(id) => { setSelectedPersonId(id); goPerson(id); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyTree;

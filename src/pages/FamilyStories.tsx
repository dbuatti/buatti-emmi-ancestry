import { TimelineTab } from '@/components/TimelineTab';

const FamilyStories = () => (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-[#800020] font-serif">Family stories & migration</h2>
      <p className="text-xs text-stone-500 font-sans">A chronological view of our family's milestones, voyages and settlements.</p>
    </div>
    <TimelineTab />
  </div>
);

export default FamilyStories;

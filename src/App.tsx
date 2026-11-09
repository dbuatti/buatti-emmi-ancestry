import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useParams, Link, useLocation, Outlet } from "react-router-dom";

import ResearchGoals from "./pages/ResearchGoals";
import NotFound from "./pages/NotFound";
import RecordPage from "./pages/RecordPage";
import PersonPage from "./pages/PersonPage";
import FamilySearchCheckPage from "./pages/FamilySearchCheckPage";
import ResearchHub from "./pages/ResearchHub";
import TaskPage from "./pages/TaskPage";
import Records from "./pages/Records";
import { ResearchCentre } from "./pages/ResearchCentre";
import ResearchAssistant from "./pages/ResearchAssistant";
import Documents from "./pages/Documents";
import Triangulate from "./pages/Triangulate";
import FamilyLayout from "./layouts/FamilyLayout";
import FamilyTree from "./pages/FamilyTree";
import FamilyPeople from "./pages/FamilyPeople";
import FamilyPerson from "./pages/FamilyPerson";
import ResearchPeople from "./pages/ResearchPeople";
import FamilySources from "./pages/FamilySources";
import FamilyStories from "./pages/FamilyStories";

const ParamRedirect = ({ to }: { to: (id: string) => string }) => {
  const { personId, recordId } = useParams();
  const id = personId || recordId || '';
  const search = window.location.search;
  return <Navigate to={to(id) + search} replace />;
};

const RESEARCH_NAV = [
  { to: '/research', label: 'Hub' },
  { to: '/research/centre', label: 'Correspondence' },
  { to: '/research/tasks', label: 'Tasks' },
  { to: '/research/people', label: 'People' },
  { to: '/research/records', label: 'Records' },
  { to: '/research/documents', label: 'Documents' },
  { to: '/research/triangulate', label: 'Triangulate' },
  { to: '/research/assistant', label: 'Assistant' },
  { to: '/research/goals', label: 'Goals' },
];

const ResearchLayout = () => {
  const { pathname } = useLocation();
  return (
    <>
      <div className="bg-[#F4EFE6] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <nav aria-label="Research" className="flex flex-wrap gap-1.5 items-center">
            {RESEARCH_NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`text-xs font-sans font-medium px-3 py-1.5 rounded-md transition-colors ${
                  pathname === n.to ? 'bg-[#800020] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <Outlet />
    </>
  );
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        {/* Phase A: area shell + redirects (content split in Phases B/C) */}
        <Route path="/" element={<Navigate to="/family/tree" replace />} />
        <Route path="/family" element={<Navigate to="/family/tree" replace />} />
        <Route element={<FamilyLayout />}>
          <Route path="/family/tree" element={<FamilyTree />} />
          <Route path="/family/people" element={<FamilyPeople />} />
          <Route path="/family/people/:personId" element={<FamilyPerson />} />
          <Route path="/family/sources" element={<FamilySources />} />
          <Route path="/family/stories" element={<FamilyStories />} />
        </Route>
        {/* Research Workspace: shared sub-nav so every /research/* page is navigable */}
        <Route element={<ResearchLayout />}>
          <Route path="/research" element={<ResearchHub />} />
          <Route path="/research/tasks" element={<TaskPage />} />
          <Route path="/research/centre" element={<ResearchCentre />} />
          <Route path="/research/assistant" element={<ResearchAssistant />} />
          <Route path="/research/goals" element={<ResearchGoals />} />
          <Route path="/research/records" element={<Records />} />
          <Route path="/research/records/:recordId" element={<RecordPage />} />
          <Route path="/research/people" element={<ResearchPeople />} />
          <Route path="/research/people/:personId" element={<PersonPage />} />
          <Route path="/research/familysearch/:personId" element={<FamilySearchCheckPage />} />
          <Route path="/research/documents" element={<Documents />} />
          <Route path="/research/triangulate" element={<Triangulate />} />
        </Route>

        {/* Legacy routes preserved via redirects */}
        <Route path="/research-goals" element={<Navigate to="/research/goals" replace />} />
        <Route path="/records/:recordId" element={<ParamRedirect to={(id) => `/research/records/${id}`} />} />
        <Route path="/people/:personId" element={<ParamRedirect to={(id) => `/research/people/${id}`} />} />
        <Route path="/familysearch/:personId" element={<ParamRedirect to={(id) => `/research/familysearch/${id}`} />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import ResearchGoals from "./pages/ResearchGoals";
import NotFound from "./pages/NotFound";
import RecordPage from "./pages/RecordPage";
import PersonPage from "./pages/PersonPage";
import FamilySearchCheckPage from "./pages/FamilySearchCheckPage";
import ResearchHub from "./pages/ResearchHub";
import TaskPage from "./pages/TaskPage";
import { ResearchCentre } from "./pages/ResearchCentre";
import ResearchAssistant from "./pages/ResearchAssistant";
import FamilyLayout from "./layouts/FamilyLayout";
import FamilyTree from "./pages/FamilyTree";
import FamilyPeople from "./pages/FamilyPeople";
import FamilyPerson from "./pages/FamilyPerson";
import FamilySources from "./pages/FamilySources";
import FamilyStories from "./pages/FamilyStories";

const ParamRedirect = ({ to }: { to: (id: string) => string }) => {
  const { personId, recordId } = useParams();
  const id = personId || recordId || '';
  return <Navigate to={to(id)} replace />;
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
        <Route path="/research" element={<ResearchHub />} />
        <Route path="/research/tasks" element={<TaskPage />} />
        <Route path="/research/centre" element={<ResearchCentre />} />
        <Route path="/research/assistant" element={<ResearchAssistant />} />

        {/* Research Workspace canonical routes */}
        <Route path="/research/goals" element={<ResearchGoals />} />
        <Route path="/research/records/:recordId" element={<RecordPage />} />
        <Route path="/research/people/:personId" element={<PersonPage />} />
        <Route path="/research/familysearch/:personId" element={<FamilySearchCheckPage />} />

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

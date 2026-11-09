import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OllamaModel {
  name: string;
  size?: number;
}

interface OpenCodeSession {
  id: string;
  name?: string;
  status?: string;
}

const AIProgress = () => {
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [openCodeSessions, setOpenCodeSessions] = useState<OpenCodeSession[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadOllamaModels = async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags', { headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        setOllamaModels(data.models || []);
      } catch {
        setOllamaModels([]);
      }
    };

    const loadOpenCodeSessions = async () => {
      try {
        const res = await fetch('http://localhost:96037/api/sessions', { headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        const sessions = (data.sessions || data || []) as OpenCodeSession[];
        setOpenCodeSessions(sessions);
      } catch {
        setOpenCodeSessions([]);
      }
    };

    loadOllamaModels();
    loadOpenCodeSessions();
  }, []);

  const handleRefresh = () => {
    toast({ title: 'Refreshing AI Progress...', description: 'Loading models and sessions' });
    window.location.reload();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">AI & OpenCode Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* OpenRouter / Ollama Models */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">OpenRouter AI Models</h2>
          {ollamaModels.length === 0 ? (
            <p className="text-gray-500 text-sm">No models detected</p>
          ) : (
            <ul className="space-y-2">
              {ollamaModels.map(m => (
                <li key={m.name} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm font-medium text-stone-700">{m.name}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                    {Math.round((m.size || 0) / 1e9)}B params
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* OpenCode Sessions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">OpenCode Sessions</h2>
          {openCodeSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No active sessions</p>
          ) : (
            <ul className="space-y-2">
              {openCodeSessions.map(s => (
                <li key={s.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm font-medium text-stone-700">{s.name || s.id}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                    {s.status || 'active'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Research Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Research Status</h2>
          <p className="text-sm text-stone-600">Check the Research Log tab for open leads and questions.</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-between text-sm text-stone-500">
        <span>AI & OpenCode Progress Dashboard</span>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default AIProgress;
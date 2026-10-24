import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import AssistantExperience from '../src/components/assistant/AssistantExperience';
import '../src/index.css';

// Intentionally no App, AuthProvider, Supabase, AI service, or production routes.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AssistantExperience demo previewOnly query={{
      isFetching: false, isPending: false, isError: false, refetch: () => undefined,
    }} />
    <Toaster />
  </BrowserRouter>,
);

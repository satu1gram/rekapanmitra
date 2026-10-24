import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import MulaDemo from '../src/components/assistant/MulaDemo';
import '../src/index.css';

// Intentionally no App, AuthProvider, Supabase, AI service, or production routes.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <MulaDemo />
    <Toaster />
  </BrowserRouter>,
);

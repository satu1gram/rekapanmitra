import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import PrototypeApp from '../src/prototype/PrototypeApp';
import '../src/index.css';

// Intentionally no App, AuthProvider, Supabase, AI service, or production routes.
createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <PrototypeApp />
  </HashRouter>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BookOpen } from 'lucide-react';
import './index.css';

export function App(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <BookOpen className="h-8 w-8 text-sky-400" />
        <h1>DJayJesse-Art</h1>
      </div>
      <p className="mt-4 max-w-md text-slate-400">
        Comic portfolio reader and gallery. 313 pages across 5 Acts.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

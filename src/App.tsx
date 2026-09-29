import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AppShell from './components/Layout/AppShell';

const Overview = lazy(() => import('./pages/Overview'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Run = lazy(() => import('./pages/Run'));
const Findings = lazy(() => import('./pages/Findings'));
const Provenance = lazy(() => import('./pages/Provenance'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[50vh]">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Suspense fallback={<PageLoader />}><Overview /></Suspense>} />
          <Route path="workspace" element={<Suspense fallback={<PageLoader />}><Workspace /></Suspense>} />
          <Route path="run" element={<Suspense fallback={<PageLoader />}><Run /></Suspense>} />
          <Route path="findings" element={<Suspense fallback={<PageLoader />}><Findings /></Suspense>} />
          <Route path="provenance" element={<Suspense fallback={<PageLoader />}><Provenance /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

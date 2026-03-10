import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SetupWizard from './components/wizard/SetupWizard';
import AlertBanner from './components/shared/AlertBanner';
import { useHealthCheck } from './hooks/useHealthCheck';

function DashboardPlaceholder() {
  const health = useHealthCheck();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Aether WebUI</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>
      </header>

      <AlertBanner health={health} />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Dashboard coming soon.</p>
          <a
            href="/setup"
            className="inline-block mt-4 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            Go to Setup Wizard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPlaceholder />} />
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

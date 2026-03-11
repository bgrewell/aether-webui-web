import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { getVersion } from '../../api/meta';
import type { VersionInfo } from '../../types/api';

export default function VersionIndicator() {
  const [showDetails, setShowDetails] = useState(false);
  const [backend, setBackend] = useState<VersionInfo | null>(null);

  useEffect(() => {
    if (!showDetails || backend) return;
    getVersion()
      .then(setBackend)
      .catch(() => {});
  }, [showDetails, backend]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-md hover:bg-gray-700 transition-colors shadow-lg"
        title="Version information"
      >
        <Info size={12} />
        <span className="font-mono">{__APP_VERSION__}</span>
      </button>

      {showDetails && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-gray-300 text-xs rounded-md shadow-xl p-3 min-w-64">
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 font-medium mb-1.5">Frontend</div>
                <div className="space-y-1 pl-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Version</span>
                    <span className="font-mono">{__APP_VERSION__}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Build Time</span>
                    <span className="font-mono">{new Date(__BUILD_TIME__).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-700" />
              <div>
                <div className="text-gray-400 font-medium mb-1.5">Backend</div>
                {backend ? (
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Version</span>
                      <span className="font-mono">{backend.version}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Build Time</span>
                      <span className="font-mono">{new Date(backend.build_date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Branch</span>
                      <span className="font-mono">{backend.branch}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Commit</span>
                      <span className="font-mono">{backend.commit_hash}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 pl-2">Unavailable</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

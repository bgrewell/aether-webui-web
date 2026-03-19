import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  Info,
} from 'lucide-react';
import { patchOnrampConfig } from '../../api/onramp';
import ConfigFieldEditor from './ConfigFieldEditor';
import type { WizardData } from '../../hooks/useWizardState';
import type { ConfigDefaultApplied } from '../../types/api';

interface ConfigReviewProps {
  data: WizardData;
  update: (partial: Partial<WizardData>) => void;
}

const SECTION_LABELS: Record<string, string> = {
  k8s: 'Kubernetes',
  core: '5G Core',
  gnbsim: 'gNBsim',
  amp: 'AMP',
  sdran: 'SD-RAN',
  ueransim: 'UERANSIM',
  oai: 'OpenAirInterface',
  srsran: 'srsRAN',
  n3iwf: 'N3IWF',
};

function setPath(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> {
  if (path.length === 0) return obj;
  const [head, ...rest] = path;
  if (rest.length === 0) return { ...obj, [head]: value };
  return {
    ...obj,
    [head]: setPath((obj[head] as Record<string, unknown>) ?? {}, rest, value),
  };
}

function countEditableFields(obj: Record<string, unknown>): number {
  let count = 0;
  for (const v of Object.values(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      count += countEditableFields(v as Record<string, unknown>);
    } else {
      count += 1;
    }
  }
  return count;
}

interface SectionCardProps {
  sectionKey: string;
  label: string;
  sectionData: Record<string, unknown>;
  onChange: (path: string[], value: unknown) => void;
  defaultsApplied: ConfigDefaultApplied[];
}

function SectionCard({ sectionKey, label, sectionData, onChange, defaultsApplied }: SectionCardProps) {
  const [open, setOpen] = useState(false);
  const sectionDefaults = defaultsApplied.filter((d) => d.field.startsWith(`${sectionKey}.`));
  const fieldCount = countEditableFields(sectionData);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-gray-50 hover:bg-gray-100/70 transition-colors text-left"
      >
        {open ? (
          <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />
        )}
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="text-[10px] font-mono text-gray-400 ml-1">{sectionKey}</span>
        {sectionDefaults.length > 0 && (
          <span className="ml-auto px-2 py-0.5 bg-intel-50 text-intel-700 text-[10px] font-medium rounded-full">
            {sectionDefaults.length} auto-filled
          </span>
        )}
        {sectionDefaults.length === 0 && (
          <span className="ml-auto text-[11px] text-gray-400">{fieldCount} fields</span>
        )}
      </button>
      {open && (
        <div className="px-5 pt-2 pb-3 bg-white">
          {Object.entries(sectionData).map(([k, v]) => (
            <ConfigFieldEditor
              key={k}
              label={k.replace(/_/g, ' ')}
              path={[k]}
              value={v}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AppliedDefaultsPanelProps {
  applied: ConfigDefaultApplied[];
}

function AppliedDefaultsPanel({ applied }: AppliedDefaultsPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-intel-200 rounded-xl overflow-hidden bg-intel-50/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-intel-50/60 transition-colors"
      >
        <Info size={15} className="text-intel-600 flex-shrink-0" />
        <span className="text-sm font-medium text-intel-800">
          {applied.length} default{applied.length !== 1 ? 's' : ''} applied from your node configuration
        </span>
        {open ? (
          <ChevronDown size={14} className="ml-auto text-intel-500" />
        ) : (
          <ChevronRight size={14} className="ml-auto text-intel-500" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {applied.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <span className="font-mono text-intel-700 font-medium flex-shrink-0 min-w-[140px]">
                {item.field}
              </span>
              <span className="font-mono text-gray-700 font-semibold flex-shrink-0">{item.value}</span>
              <span className="text-gray-500 truncate">
                — {item.explanation}
                {item.source_node && (
                  <span className="text-intel-600 ml-1">({item.source_node})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ConfigReview({ data, update }: ConfigReviewProps) {
  const [localConfig, setLocalConfig] = useState<Record<string, unknown> | null>(
    () => data.onrampConfig ? JSON.parse(JSON.stringify(data.onrampConfig)) : null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasInitialized = useRef(data.onrampConfig !== null);

  useEffect(() => {
    if (!hasInitialized.current && data.onrampConfig !== null) {
      hasInitialized.current = true;
      setLocalConfig(JSON.parse(JSON.stringify(data.onrampConfig)));
    }
  }, [data.onrampConfig]);

  const isDirty = useMemo(() => {
    if (!localConfig || !data.onrampConfig) return false;
    return JSON.stringify(localConfig) !== JSON.stringify(data.onrampConfig);
  }, [localConfig, data.onrampConfig]);

  const handleFieldChange = useCallback((section: string, path: string[], value: unknown) => {
    setLocalConfig((prev) => {
      if (!prev) return prev;
      const sectionData = (prev[section] as Record<string, unknown>) ?? {};
      const updated = setPath(sectionData, path, value);
      return { ...prev, [section]: updated };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!localConfig) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const saved = await patchOnrampConfig(localConfig);
      update({ onrampConfig: saved });
      setLocalConfig(JSON.parse(JSON.stringify(saved)));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save config');
    }
  }, [localConfig, update]);

  const sections = useMemo(() => {
    const cfg = localConfig ?? data.onrampConfig;
    if (!cfg) return [];
    return Object.entries(cfg).filter(([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v));
  }, [localConfig, data.onrampConfig]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Review Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sensible defaults have been applied based on your nodes' network configuration. Review and
          adjust any values before deployment.
        </p>
      </div>

      {data.defaultsLoading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 mb-5">
          <Loader2 size={18} className="text-intel-600 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">Discovering network configuration...</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Connecting to nodes via SSH to determine interfaces and IP addresses.
            </p>
          </div>
        </div>
      )}

      {!data.defaultsLoading && (data.configDefaultsErrors ?? []).length > 0 && (
        <div className="mb-5 space-y-2">
          {(data.configDefaultsErrors ?? []).map((err, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{err}</p>
            </div>
          ))}
          <p className="text-xs text-gray-500 ml-1">
            Values for unreachable nodes may need to be filled in manually below.
          </p>
        </div>
      )}

      {!data.defaultsLoading && (data.configDefaultsApplied ?? []).length > 0 && (
        <div className="mb-5">
          <AppliedDefaultsPanel applied={data.configDefaultsApplied ?? []} />
        </div>
      )}

      {!data.defaultsLoading && sections.length > 0 && (
        <>
          <div className="space-y-3 mb-5">
            {sections.map(([key, sectionData]) => (
              <SectionCard
                key={key}
                sectionKey={key}
                label={SECTION_LABELS[key] ?? key.toUpperCase()}
                sectionData={sectionData as Record<string, unknown>}
                onChange={(path, value) => handleFieldChange(key, path, value)}
                defaultsApplied={data.configDefaultsApplied ?? []}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!isDirty || saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-intel-600 rounded-lg hover:bg-intel-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
            </button>
            {!isDirty && saveStatus === 'idle' && (
              <span className="text-xs text-gray-400">No unsaved changes</span>
            )}
            {isDirty && saveStatus === 'idle' && (
              <span className="text-xs text-amber-600">Unsaved changes</span>
            )}
          </div>

          {saveStatus === 'error' && saveError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          )}
        </>
      )}

      {!data.defaultsLoading && sections.length === 0 && !data.onrampConfig && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <AlertCircle size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No configuration available</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            The config could not be loaded. You can continue to deployment and configure manually.
          </p>
        </div>
      )}
    </div>
  );
}

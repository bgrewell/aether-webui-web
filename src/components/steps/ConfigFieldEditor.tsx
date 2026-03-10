import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FieldProps {
  label: string;
  path: string[];
  onChange: (path: string[], value: unknown) => void;
}

function fieldLabel(key: string): string {
  return key.replace(/_/g, ' ');
}

function StringField({ label, path, value, onChange }: FieldProps & { value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600 flex-1 min-w-0 truncate" title={label}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(path, e.target.value)}
        className="w-52 text-sm px-2.5 py-1.5 border border-gray-200 rounded-md focus:border-teal-400 focus:ring-1 focus:ring-teal-200 outline-none font-mono text-right"
        spellCheck={false}
      />
    </div>
  );
}

function NumberField({ label, path, value, onChange }: FieldProps & { value: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600 flex-1 min-w-0 truncate" title={label}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(path, Number(e.target.value))}
        className="w-32 text-sm px-2.5 py-1.5 border border-gray-200 rounded-md focus:border-teal-400 focus:ring-1 focus:ring-teal-200 outline-none text-right"
      />
    </div>
  );
}

function BooleanField({ label, path, value, onChange }: FieldProps & { value: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600 flex-1 min-w-0 truncate" title={label}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(path, !value)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1 ${
          value ? 'bg-teal-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ArrayField({ label, path, value, onChange }: FieldProps & { value: unknown[] }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [hasError, setHasError] = useState(false);

  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600 block mb-1.5" title={label}>
        {label}
      </span>
      <textarea
        value={text}
        rows={Math.max(3, Math.min(text.split('\n').length + 1, 10))}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            setHasError(false);
            onChange(path, parsed);
          } catch {
            setHasError(true);
          }
        }}
        spellCheck={false}
        className={`w-full text-xs font-mono px-2.5 py-2 border rounded-md focus:ring-1 outline-none resize-y transition-colors ${
          hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
            : 'border-gray-200 focus:border-teal-400 focus:ring-teal-200'
        }`}
      />
      {hasError && <p className="text-xs text-red-500 mt-1">Invalid JSON</p>}
    </div>
  );
}

interface ObjectFieldProps extends FieldProps {
  value: Record<string, unknown>;
  depth: number;
}

function ObjectField({ label, path, value, onChange, depth }: ObjectFieldProps) {
  const [open, setOpen] = useState(depth < 2);

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full py-2.5 text-left hover:bg-gray-50/50 rounded transition-colors"
      >
        {open ? (
          <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </button>
      {open && (
        <div className="pl-5 pb-1">
          {Object.entries(value).map(([k, v]) => (
            <ConfigFieldEditor
              key={k}
              label={fieldLabel(k)}
              path={[...path, k]}
              value={v}
              onChange={onChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ConfigFieldEditorProps {
  label: string;
  path: string[];
  value: unknown;
  onChange: (path: string[], value: unknown) => void;
  depth?: number;
}

export default function ConfigFieldEditor({
  label,
  path,
  value,
  onChange,
  depth = 0,
}: ConfigFieldEditorProps) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'boolean') {
    return <BooleanField label={label} path={path} value={value} onChange={onChange} />;
  }
  if (typeof value === 'number') {
    return <NumberField label={label} path={path} value={value} onChange={onChange} />;
  }
  if (typeof value === 'string') {
    return <StringField label={label} path={path} value={value} onChange={onChange} />;
  }
  if (Array.isArray(value)) {
    return <ArrayField label={label} path={path} value={value} onChange={onChange} />;
  }
  if (typeof value === 'object') {
    return (
      <ObjectField
        label={label}
        path={path}
        value={value as Record<string, unknown>}
        onChange={onChange}
        depth={depth}
      />
    );
  }
  return null;
}

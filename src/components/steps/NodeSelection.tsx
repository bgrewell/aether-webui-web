import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Server,
  Loader2,
  Monitor,
} from 'lucide-react';
import { listNodes, createNode, deleteNode } from '../../api/nodes';
import type { WizardData } from '../../hooks/useWizardState';
import type { ManagedNode } from '../../types/api';
import AddNodeModal from './AddNodeModal';

interface NodeSelectionProps {
  data: WizardData;
  update: (partial: Partial<WizardData>) => void;
}

export default function NodeSelection({ data, update }: NodeSelectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const excluded = new Set(data.excludedNodeIds);

  const loadNodes = useCallback(async () => {
    setLoading(true);
    try {
      const nodes = await listNodes();
      const nodeList = nodes ?? [];

      const hasLocalhost = nodeList.some(
        (n) => n.ansible_host === '127.0.0.1' || n.ansible_host === 'localhost'
      );
      if (!hasLocalhost) {
        const localhost = await createNode({
          name: 'localhost',
          ansible_host: '127.0.0.1',
          ansible_user: 'aether',
          password: 'aether',
          sudo_password: 'aether',
          roles: null,
        });
        nodeList.unshift(localhost);
      }

      const existing = data.nodeVerification;
      const verification: Record<string, 'pending' | 'verified' | 'failed'> = {};
      nodeList.forEach((n) => {
        verification[n.id] = existing[n.id] ?? 'pending';
      });

      update({ nodes: nodeList, nodeVerification: verification });
    } catch {
      if (data.nodes.length === 0) {
        const placeholder: ManagedNode = {
          id: 'localhost',
          name: 'localhost',
          ansible_host: '127.0.0.1',
          ansible_user: 'aether',
          has_password: true,
          has_sudo_password: true,
          has_ssh_key: false,
          roles: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        update({
          nodes: [placeholder],
          nodeVerification: { localhost: 'pending' },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [update, data.nodeVerification]);

  useEffect(() => {
    loadNodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleIncluded = useCallback(
    (nodeId: string) => {
      const next = excluded.has(nodeId)
        ? data.excludedNodeIds.filter((id) => id !== nodeId)
        : [...data.excludedNodeIds, nodeId];
      update({ excludedNodeIds: next });
    },
    [data.excludedNodeIds, excluded, update]
  );

  const handleAddNode = useCallback(
    async (values: { name: string; host: string; user: string; password: string }) => {
      const node = await createNode({
        name: values.name,
        ansible_host: values.host,
        ansible_user: values.user,
        password: values.password || undefined,
        sudo_password: values.password || undefined,
        roles: null,
      });

      const updatedNodes = [...data.nodes, node];
      const updatedVerification = { ...data.nodeVerification, [node.id]: 'pending' as const };
      update({ nodes: updatedNodes, nodeVerification: updatedVerification });
    },
    [data.nodes, data.nodeVerification, update]
  );

  const handleDelete = useCallback(
    async (node: ManagedNode) => {
      setDeletingId(node.id);
      try {
        await deleteNode(node.id);
        const updatedNodes = data.nodes.filter((n) => n.id !== node.id);
        const updatedVerification = { ...data.nodeVerification };
        delete updatedVerification[node.id];
        const updatedExcluded = data.excludedNodeIds.filter((id) => id !== node.id);
        update({
          nodes: updatedNodes,
          nodeVerification: updatedVerification,
          excludedNodeIds: updatedExcluded,
        });
      } finally {
        setDeletingId(null);
      }
    },
    [data.nodes, data.nodeVerification, data.excludedNodeIds, update]
  );

  const isLocalhost = (n: ManagedNode) =>
    n.ansible_host === '127.0.0.1' || n.ansible_host === 'localhost';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-intel-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select Nodes</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose which hosts will participate in this deployment. Uncheck any node you want to
          exclude.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {data.nodes.map((node) => {
          const isExcluded = excluded.has(node.id);
          return (
            <div
              key={node.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                isExcluded
                  ? 'border-gray-200 bg-gray-100/60 opacity-60'
                  : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleIncluded(node.id)}
                className="flex-shrink-0 focus:outline-none"
                aria-label={isExcluded ? `Include ${node.name}` : `Exclude ${node.name}`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isExcluded
                      ? 'border-gray-300 bg-white'
                      : 'border-intel-600 bg-intel-600'
                  }`}
                >
                  {!isExcluded && (
                    <svg
                      viewBox="0 0 12 12"
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
              </button>

              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                {isLocalhost(node) ? (
                  <Monitor size={18} className="text-gray-500" />
                ) : (
                  <Server size={18} className="text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{node.name}</p>
                  {isLocalhost(node) && (
                    <span className="px-1.5 py-0.5 bg-intel-50 text-intel-700 text-[10px] font-medium rounded">
                      LOCAL
                    </span>
                  )}
                  {isExcluded && (
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-medium rounded">
                      EXCLUDED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {node.ansible_host}
                  {node.ansible_user ? ` (${node.ansible_user})` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isLocalhost(node) && (
                  <button
                    onClick={() => handleDelete(node)}
                    disabled={deletingId === node.id}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {deletingId === node.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-intel-700 bg-intel-50 border border-intel-200 rounded-lg hover:bg-intel-100 transition-colors"
        >
          <Plus size={16} />
          Add Node
        </button>
      </div>

      <AddNodeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddNode}
      />
    </div>
  );
}

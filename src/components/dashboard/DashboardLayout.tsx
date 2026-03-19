import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import AlertBanner from '../shared/AlertBanner';
import DeploymentBanner from '../shared/DeploymentBanner';
import VersionIndicator from '../shared/VersionIndicator';
import {
  LayoutDashboard,
  Server,
  Radio,
  Database,
  Activity,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'deploy',
    label: 'Deploy',
    icon: Server,
    path: '/dashboard/deployment',
  },
  {
    id: '5g-network',
    label: '5G Network',
    icon: Radio,
    path: '/dashboard/5g',
    children: [
      { id: 'core', label: 'Core', icon: Database, path: '/dashboard/5g/core' },
      { id: 'ran', label: 'RAN', icon: Radio, path: '/dashboard/5g/ran' },
      { id: 'ues', label: 'UEs & Subscribers', icon: Activity, path: '/dashboard/5g/ues' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Database,
    path: '/dashboard/operations',
    children: [
      { id: 'backup', label: 'Backup & Restore', icon: Database, path: '/dashboard/operations/backup' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    icon: Activity,
    path: '/dashboard/status',
    children: [
      { id: 'network-status', label: '5G Network', icon: Radio, path: '/dashboard/status/network' },
      { id: 'k8s-status', label: 'Kubernetes', icon: Server, path: '/dashboard/status/kubernetes' },
      { id: 'infra-status', label: 'Infrastructure', icon: Server, path: '/dashboard/status/infrastructure' },
      { id: 'security-status', label: 'Security', icon: Activity, path: '/dashboard/status/security' },
    ],
  },
];

export default function DashboardLayout() {
  const health = useHealthCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['5g-network', 'operations', 'status']));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deploymentSelectorOpen, setDeploymentSelectorOpen] = useState(false);
  const [selectedDeployment] = useState('Default Deployment');

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.id);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id);
            } else {
              navigate(item.path);
              setMobileMenuOpen(false);
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
            active && !hasChildren
              ? 'bg-intel-50 text-intel-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          } ${depth > 0 ? 'ml-4' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-8 h-8 bg-intel-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 leading-tight">Aether WebUI</h1>
              <p className="text-xs text-gray-500">Private 5G Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setDeploymentSelectorOpen(!deploymentSelectorOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                <Server className="w-4 h-4 text-gray-600" />
                <span className="hidden sm:inline text-gray-700 font-medium">{selectedDeployment}</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              {deploymentSelectorOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Active Deployment</p>
                  </div>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between">
                    <span className="font-medium text-gray-900">{selectedDeployment}</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  </button>
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button className="w-full px-3 py-2 text-left text-sm text-intel-600 hover:bg-intel-50 font-medium">
                      + Create New Deployment
                    </button>
                  </div>
                </div>
              )}
            </div>
            <VersionIndicator />
          </div>
        </div>
      </header>

      <AlertBanner health={health} />
      <DeploymentBanner />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-64 bg-white border-r border-gray-200 overflow-y-auto absolute lg:relative z-40 h-[calc(100vh-64px)] lg:h-auto`}
        >
          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => renderNavItem(item))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

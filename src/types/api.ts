export interface ManagedNode {
  id: string;
  name: string;
  ansible_host: string;
  ansible_user: string;
  has_password: boolean;
  has_sudo_password: boolean;
  has_ssh_key: boolean;
  roles: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface NodeCreateInput {
  name: string;
  ansible_host: string;
  ansible_user?: string;
  password?: string;
  sudo_password?: string;
  ssh_key?: string;
  roles?: string[] | null;
}

export interface NodeUpdateInput {
  name?: string;
  ansible_host?: string;
  ansible_user?: string;
  password?: string;
  sudo_password?: string;
  ssh_key?: string;
  roles?: string[] | null;
}

export interface CheckResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  severity: 'required' | 'warning' | 'info';
  category: string;
  message: string;
  details: string;
  can_fix: boolean;
  fix_warning: string;
}

export interface PreflightSummary {
  passed: number;
  failed: number;
  total: number;
  results: CheckResult[];
}

export interface FixResult {
  id: string;
  success: boolean;
  message: string;
}

export interface OnRampTask {
  id: string;
  component: string;
  action: string;
  target: string;
  status: string;
  started_at: string;
  finished_at?: string;
  exit_code: number;
  output: string;
  output_offset: number;
}

export interface Action {
  name: string;
  description: string;
  target: string;
}

export interface Component {
  name: string;
  description: string;
  actions: Action[] | null;
}

export interface ComponentStateItem {
  component: string;
  status: string;
  action_id?: string;
  last_action?: string;
  updated_at?: number;
}

export interface InventorySyncResult {
  message: string;
  path: string;
}

export interface ApiError {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: { location?: string; message?: string; value?: unknown }[];
}

export interface NodeFacts {
  node_id: string;
  node_name: string;
  default_iface: string;
  default_ip: string;
  default_subnet: string;
  interfaces: {
    name: string;
    addresses: string[];
    mac: string;
    is_up: boolean;
  }[];
  gathered_at: string;
}

export interface ConfigDefaultApplied {
  field: string;
  value: string;
  explanation: string;
  source_node: string;
}

export interface ConfigDefaultsResult {
  applied: ConfigDefaultApplied[];
  errors: string[];
  config: Record<string, unknown>;
}

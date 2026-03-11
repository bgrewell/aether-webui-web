// ---------------------------------------------------------------------------
// Shared / Error types
// ---------------------------------------------------------------------------

/** RFC 9457 Problem Details error envelope returned by all error responses. */
export interface ApiError {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: ErrorDetail[];
}

export interface ErrorDetail {
  location?: string;
  message?: string;
  value?: unknown;
}

// ---------------------------------------------------------------------------
// Meta provider  –  /api/v1/meta/*
// ---------------------------------------------------------------------------

/** GET /meta/version – semantic version, build date, git branch & commit. */
export interface VersionInfo {
  version: string;
  build_date: string;
  branch: string;
  commit_hash: string;
}

/** GET /meta/build – Go toolchain version, target OS and architecture. */
export interface BuildInfo {
  go_version: string;
  os: string;
  arch: string;
}

/** GET /meta/runtime – process runtime details. */
export interface RuntimeInfo {
  pid: number;
  user: UserInfo;
  group: GroupInfo;
  binary_path: string;
  /** RFC 3339 timestamp of server start. */
  start_time: string;
  /** Human-readable duration since start (e.g. "2h30m0s"). */
  uptime: string;
}

export interface UserInfo {
  uid: string;
  name: string;
}

export interface GroupInfo {
  gid: string;
  name: string;
}

/** GET /meta/config – non-secret application configuration. */
export interface ConfigInfo {
  schema_version: number;
  listen_address: string;
  debug_enabled: boolean;
  security: SecurityConfig;
  frontend: FrontendConfig;
  storage: StorageConfig;
  metrics: MetricsConfig;
}

export interface SecurityConfig {
  tls_enabled: boolean;
  tls_auto_generated: boolean;
  mtls_enabled: boolean;
  token_auth_enabled: boolean;
  rbac_enabled: boolean;
}

export interface FrontendConfig {
  enabled: boolean;
  /** "embedded" or a custom directory path. */
  source: string;
  dir: string;
}

export interface StorageConfig {
  data_dir: string;
}

export interface MetricsConfig {
  /** Collection interval (e.g. "10s"). */
  interval: string;
  /** Retention period (e.g. "24h"). */
  retention: string;
}

/** GET /meta/providers – registered provider statuses. */
export interface ProvidersInfo {
  providers: ProviderStatus[];
}

export interface ProviderStatus {
  name: string;
  enabled: boolean;
  running: boolean;
  endpoint_count: number;
  degraded?: boolean;
  degraded_reason?: string;
}

/** GET /meta/store – store engine health and diagnostics. */
export interface StoreInfo {
  engine: string;
  path: string;
  file_size_bytes: number;
  schema_version: number;
  /** Overall health: "healthy", "degraded", or "unhealthy". */
  status: string;
  diagnostics: DiagnosticCheck[];
}

export interface DiagnosticCheck {
  name: string;
  passed: boolean;
  latency: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// System provider  –  /api/v1/system/*
// ---------------------------------------------------------------------------

/** GET /system/cpu – CPU model, cores, frequency, cache, and flags. */
export interface CPUInfo {
  model: string;
  physical_cores: number;
  logical_cores: number;
  frequency_mhz: number;
  cache_size_kb: number;
  flags: string[] | null;
}

/** GET /system/memory – physical and swap memory usage. */
export interface MemoryInfo {
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  usage_percent: number;
  swap_total_bytes: number;
  swap_used_bytes: number;
  swap_percent: number;
}

/** GET /system/disks – partition list with usage. */
export interface DiskInfo {
  partitions: Partition[];
}

export interface Partition {
  device: string;
  mountpoint: string;
  fs_type: string;
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  usage_percent: number;
}

/** GET /system/os – hostname, platform, kernel, uptime. */
export interface OSInfo {
  hostname: string;
  os: string;
  platform: string;
  platform_version: string;
  kernel_version: string;
  kernel_arch: string;
  uptime_seconds: number;
}

/** GET /system/network/interfaces – NIC details. */
export interface NetworkInterface {
  name: string;
  mac: string;
  mtu: number;
  flags: string[] | null;
  addresses: string[] | null;
}

/** GET /system/network/config – DNS servers and search domains. */
export interface NetworkConfig {
  dns_servers: string[] | null;
  search_domains: string[] | null;
}

/** GET /system/network/ports – TCP/UDP listeners. */
export interface ListeningPort {
  protocol: string;
  local_addr: string;
  local_port: number;
  pid: number;
  process_name: string;
  state: string;
}

/** GET /system/metrics – time-series query result. */
export interface MetricsResult {
  series: SeriesResult[];
}

export interface SeriesResult {
  metric: string;
  labels: Record<string, string>;
  points: PointResult[] | null;
}

export interface PointResult {
  /** RFC 3339 timestamp. */
  timestamp: string;
  value: number;
}

/** Query parameters for GET /system/metrics. */
export interface MetricsQuery {
  /** Required. Metric name (e.g. "system.cpu.usage_percent"). */
  metric: string;
  /** Start time (RFC 3339). */
  from?: string;
  /** End time (RFC 3339). */
  to?: string;
  /** Comma-separated key=val label filters (e.g. "cpu=total"). */
  labels?: string;
  /** Time bucket aggregation: "raw" | "10s" | "1m" | "5m" | "1h". */
  aggregation?: 'raw' | '10s' | '1m' | '5m' | '1h';
}

// ---------------------------------------------------------------------------
// Nodes provider  –  /api/v1/nodes/*
// ---------------------------------------------------------------------------

/** A managed cluster node (returned by list / get / create / update). */
export interface ManagedNode {
  id: string;
  /** Unique node name (Ansible inventory hostname). */
  name: string;
  /** IP or hostname for SSH. */
  ansible_host: string;
  /** SSH username. */
  ansible_user: string;
  has_password: boolean;
  has_sudo_password: boolean;
  has_ssh_key: boolean;
  roles: string[] | null;
  created_at: string;
  updated_at: string;
}

/** POST /nodes – body for creating a new node. */
export interface NodeCreateInput {
  /** Unique node name (Ansible inventory hostname). */
  name: string;
  /** IP or hostname for SSH. */
  ansible_host: string;
  ansible_user?: string;
  password?: string;
  sudo_password?: string;
  ssh_key?: string;
  roles?: string[] | null;
}

/** PUT /nodes/:id – body for updating a node. All fields optional; roles replaces entire set. */
export interface NodeUpdateInput {
  name?: string;
  ansible_host?: string;
  ansible_user?: string;
  /** Set to empty string to clear. */
  password?: string;
  /** Set to empty string to clear. */
  sudo_password?: string;
  /** Set to empty string to clear. */
  ssh_key?: string;
  /** Replaces entire role set when provided. */
  roles?: string[] | null;
}

/** DELETE /nodes/:id response. */
export interface NodeDeleteResult {
  message: string;
}

// ---------------------------------------------------------------------------
// OnRamp provider  –  /api/v1/onramp/*
// ---------------------------------------------------------------------------

/** An available OnRamp component with its actions. */
export interface Component {
  name: string;
  description: string;
  actions: Action[] | null;
}

export interface Action {
  name: string;
  description: string;
  /** Ansible target pattern (e.g. "all", "master_nodes"). */
  target: string;
}

/**
 * POST /onramp/components/:component/:action – optional request body.
 * Labels and tags are attached to the resulting task for filtering.
 */
export interface ExecuteActionBody {
  labels?: Record<string, string>;
  tags?: string[] | null;
}

/**
 * A running or completed task (make target execution).
 * Poll GET /onramp/tasks/:id with an offset for incremental output streaming.
 */
export interface OnRampTask {
  id: string;
  component: string;
  action: string;
  target: string;
  /** "pending" | "running" | "succeeded" | "failed". */
  status: string;
  started_at: string;
  finished_at?: string;
  exit_code: number;
  output: string;
  /** Byte offset for the next incremental output read. */
  output_offset: number;
}

/** GET /onramp/state – per-component deployment state. */
export interface ComponentStateItem {
  component: string;
  /** "not_installed" | "installed" | "failed" | "installing" | "uninstalling". */
  status: string;
  action_id?: string;
  last_action?: string;
  updated_at?: number;
}

/** GET /onramp/actions – paginated action execution history. */
export interface ActionHistoryItem {
  id: string;
  component: string;
  action: string;
  target: string;
  status: string;
  exit_code: number;
  /** Unix epoch seconds. */
  started_at: number;
  finished_at?: number;
  error?: string;
  tags?: string[] | null;
  labels?: Record<string, string>;
}

/** Query parameters for GET /onramp/actions. */
export interface ActionHistoryQuery {
  component?: string;
  action?: string;
  status?: string;
  /** Max results (default 50). */
  limit?: number;
  /** Pagination offset (default 0). */
  offset?: number;
}

/** POST /onramp/inventory/sync response. */
export interface InventorySyncResult {
  message: string;
  path: string;
}

/** GET /onramp/inventory – parsed hosts.ini data. */
export interface InventoryData {
  nodes: InventoryNode[];
}

export interface InventoryNode {
  name: string;
  ansible_host: string;
  ansible_user: string;
  roles: string[] | null;
}

/** GET /onramp/repo – OnRamp repository status. */
export interface RepoStatus {
  cloned: boolean;
  dir: string;
  repo_url: string;
  version: string;
  dirty: boolean;
  branch?: string;
  commit?: string;
  tag?: string;
  error?: string;
}

/** POST /onramp/config/profiles/:name/activate response. */
export interface ProfileActivateResult {
  message: string;
}

/** GET /onramp/config – typed OnRamp configuration (vars/main.yml). */
export interface OnRampConfig {
  k8s: K8sConfig;
  core: CoreConfig;
  gnbsim: GNBSimConfig;
  amp: AMPConfig;
  sdran: SDRANConfig;
  ueransim: UERANSIMConfig;
  oai: OAIConfig;
  srsran: SRSRanConfig;
  n3iwf: N3IWFConfig;
}

export interface HelmRef {
  version: string;
  local_charts: boolean | null;
  chart_ref: string;
  chart_version: string;
}

export interface HelmBlock {
  helm: HelmRef;
}

export interface StoreConfigBlock {
  lpp: { version: string };
}

export interface K8sConfig {
  rke2: {
    version: string;
    config: {
      token: string;
      port: number;
      params_file: { master: string; worker: string };
    };
  };
  helm: HelmRef;
}

export interface CoreConfig {
  standalone: boolean | null;
  data_iface: string;
  values_file: string;
  ran_subnet: string;
  helm: HelmRef;
  upf: UPFConfig;
  amf: { ip: string };
  mme: { ip: string };
}

export interface UPFConfig {
  access_subnet: string;
  core_subnet: string;
  mode: string;
  multihop_gnb: boolean | null;
  helm: HelmRef;
  values_file: string;
  default_upf: UPFInstance;
  additional_upfs: Record<string, UPFInstance>;
}

export interface UPFInstance {
  ip: { access: string; core: string };
  ue_ip_pool: string;
}

export interface AMPConfig {
  roc_models: string;
  monitor_dashboard: string;
  aether_roc: HelmBlock;
  atomix: HelmBlock;
  onosproject: HelmBlock;
  store: StoreConfigBlock;
  monitor: HelmBlock;
  monitor_crd: HelmBlock;
}

export interface GNBSimConfig {
  docker: {
    container: { image: string; prefix: string; count: number };
    network: { macvlan: { name: string } };
  };
  router: {
    data_iface: string;
    macvlan: { subnet_prefix: string };
  };
  servers: Record<string, string[] | null>;
}

export interface SDRANConfig {
  platform: {
    atomix: HelmBlock;
    onosproject: HelmBlock;
    store: StoreConfigBlock;
  };
  sdran: {
    helm: HelmRef;
    import: SDRANImport;
    ransim: { model: string; metric: string };
  };
}

export interface SDRANImport {
  e2t: boolean | null;
  a1t: boolean | null;
  uenib: boolean | null;
  topo: boolean | null;
  config: boolean | null;
  ransim: boolean | null;
  kpimon: boolean | null;
  pci: boolean | null;
  mho: boolean | null;
  mlb: boolean | null;
  ts: boolean | null;
}

export interface UERANSIMConfig {
  gnb: { ip: string };
  servers: Record<string, { gnb: string; ue: string }>;
}

export interface OAIConfig {
  docker: {
    container: { gnb_image: string; ue_image: string };
    network: { data_iface: string; name: string; subnet: string; bridge: { name: string } };
  };
  simulation: boolean | null;
  servers: Record<string, { gnb_conf: string; gnb_ip: string; ue_conf: string }>;
}

export interface SRSRanConfig {
  docker: {
    container: { gnb_image: string; ue_image: string };
    network: { name: string };
  };
  simulation: boolean | null;
  servers: Record<string, { gnb_ip: string; gnb_conf: string; ue_conf: string }>;
}

export interface N3IWFConfig {
  docker: {
    image: string;
    network: { name: string };
  };
  servers: Record<string, { conf_file: string; n3iwf_ip: string; n2_ip: string; n3_ip: string; nwu_ip: string }>;
}

// ---------------------------------------------------------------------------
// Preflight (not in the OpenAPI spec but used by the wizard)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Wizard (frontend-only state management via backend)
// ---------------------------------------------------------------------------

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

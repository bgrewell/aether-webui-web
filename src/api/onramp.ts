/**
 * OnRamp provider API  –  /api/v1/onramp/*
 *
 * Aether OnRamp operations: components, tasks, action history,
 * deployment state, config profiles, and inventory management.
 */
import { get, post, patch as patchRequest } from './client';
import type {
  Component,
  OnRampTask,
  ComponentStateItem,
  ActionHistoryItem,
  ActionHistoryQuery,
  ExecuteActionBody,
  InventorySyncResult,
  InventoryData,
  OnRampConfig,
  RepoStatus,
  ProfileActivateResult,
  ConfigDefaultsResult,
} from '../types/api';

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Returns all available OnRamp components and their actions. */
export function listComponents() {
  return get<Component[] | null>('/onramp/components');
}

/** Returns a single OnRamp component by name. */
export function getComponent(name: string) {
  return get<Component>(`/onramp/components/${name}`);
}

/**
 * Runs a make target for the specified component and action.
 * Returns the created task which can be polled for output.
 *
 * @param component - Component name (e.g. "k8s", "5gc").
 * @param action    - Action name (e.g. "install", "uninstall").
 * @param body      - Optional labels and tags to attach to the task.
 */
export function executeAction(component: string, action: string, body?: ExecuteActionBody) {
  return post<OnRampTask>(`/onramp/components/${component}/${action}`, body);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/** Returns all recent tasks (make target executions). */
export function listTasks() {
  return get<OnRampTask[] | null>('/onramp/tasks');
}

/**
 * Returns details and output for a specific task.
 * Pass offset for incremental output streaming (avoids re-fetching prior output).
 *
 * @param id     - Task ID.
 * @param offset - Byte offset; the response's output_offset gives the next value.
 */
export function getTask(id: string, offset?: number) {
  const params: Record<string, string | number> = {};
  if (offset !== undefined) params.offset = offset;
  return get<OnRampTask>(`/onramp/tasks/${id}`, params);
}

// ---------------------------------------------------------------------------
// Component state
// ---------------------------------------------------------------------------

/** Returns current deployment state of all components. */
export function listComponentStates() {
  return get<ComponentStateItem[] | null>('/onramp/state');
}

/** Returns current deployment state of a single component. */
export function getComponentState(component: string) {
  return get<ComponentStateItem>(`/onramp/state/${component}`);
}

// ---------------------------------------------------------------------------
// Action history
// ---------------------------------------------------------------------------

/**
 * Returns paginated action execution history.
 *
 * @param query.component - Filter by component name.
 * @param query.action    - Filter by action name.
 * @param query.status    - Filter by status.
 * @param query.limit     - Max results (default 50).
 * @param query.offset    - Pagination offset (default 0).
 */
export function listActions(query?: ActionHistoryQuery) {
  const params: Record<string, string | number> = {};
  if (query?.component) params.component = query.component;
  if (query?.action) params.action = query.action;
  if (query?.status) params.status = query.status;
  if (query?.limit !== undefined) params.limit = query.limit;
  if (query?.offset !== undefined) params.offset = query.offset;
  return get<ActionHistoryItem[] | null>('/onramp/actions', params);
}

/** Returns a single action execution record by ID. */
export function getAction(id: string) {
  return get<ActionHistoryItem>(`/onramp/actions/${id}`);
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

/** Parses the current hosts.ini and returns structured inventory data. */
export function getInventory() {
  return get<InventoryData>('/onramp/inventory');
}

/** Generates hosts.ini from managed nodes in the database and writes it to disk. */
export function syncInventory() {
  return post<InventorySyncResult>('/onramp/inventory/sync');
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Reads vars/main.yml and returns the parsed OnRamp configuration. */
export function getOnrampConfig() {
  return get<OnRampConfig>('/onramp/config');
}

/** Merges provided fields into vars/main.yml, preserving untouched values. */
export function patchOnrampConfig(body: Partial<OnRampConfig>) {
  return patchRequest<OnRampConfig>('/onramp/config', body);
}

// ---------------------------------------------------------------------------
// Config profiles
// ---------------------------------------------------------------------------

/** Lists available vars profiles (main-*.yml files). */
export function listProfiles() {
  return get<string[] | null>('/onramp/config/profiles');
}

/** Reads a specific vars profile and returns its configuration. */
export function getProfile(name: string) {
  return get<OnRampConfig>(`/onramp/config/profiles/${name}`);
}

/** Copies the named profile to vars/main.yml, making it the active config. */
export function activateProfile(name: string) {
  return post<ProfileActivateResult>(`/onramp/config/profiles/${name}/activate`);
}

/**
 * Computes and applies config defaults based on discovered node facts.
 * The backend inspects managed nodes and populates config fields like
 * network interfaces and IP addresses.
 */
export function applyConfigDefaults(refresh = false) {
  const qs = refresh ? '?refresh=true' : '';
  return post<ConfigDefaultsResult>(`/onramp/config/defaults${qs}`);
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

/** Returns clone status, commit, branch, tag, and dirty state of the OnRamp repo. */
export function getRepoStatus() {
  return get<RepoStatus>('/onramp/repo');
}

/** Clones the repo if missing, checks out the pinned version, and validates. */
export function refreshRepo() {
  return post<RepoStatus>('/onramp/repo/refresh');
}

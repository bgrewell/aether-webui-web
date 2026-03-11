/**
 * Meta provider API  –  /api/v1/meta/*
 *
 * Server introspection endpoints for version, build, runtime, config,
 * provider status, and store health.
 */
import { get } from './client';
import type {
  VersionInfo,
  BuildInfo,
  RuntimeInfo,
  ConfigInfo,
  ProvidersInfo,
  StoreInfo,
} from '../types/api';

/** Returns semantic version, build date, git branch, and commit hash. */
export function getVersion() {
  return get<VersionInfo>('/meta/version');
}

/** Returns the Go toolchain version, target OS, and architecture. */
export function getBuild() {
  return get<BuildInfo>('/meta/build');
}

/** Returns PID, running user/group, binary path, start time, and uptime. */
export function getRuntime() {
  return get<RuntimeInfo>('/meta/runtime');
}

/** Returns non-secret configuration: listen address, storage, security, etc. */
export function getConfig() {
  return get<ConfigInfo>('/meta/config');
}

/** Returns name, enabled/running state, and endpoint count per provider. */
export function getProviders() {
  return get<ProvidersInfo>('/meta/providers');
}

/** Returns store engine, file size, schema version, and live diagnostics. */
export function getStore() {
  return get<StoreInfo>('/meta/store');
}

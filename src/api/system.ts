/**
 * System provider API  –  /api/v1/system/*
 *
 * Host system information: CPU, memory, disk, OS, network, and time-series metrics.
 */
import { get } from './client';
import type {
  CPUInfo,
  MemoryInfo,
  DiskInfo,
  OSInfo,
  NetworkInterface,
  NetworkConfig,
  ListeningPort,
  MetricsResult,
  MetricsQuery,
} from '../types/api';

/** Returns CPU model, core counts, frequency, cache size, and feature flags. */
export function getCpu() {
  return get<CPUInfo>('/system/cpu');
}

/** Returns physical and swap memory usage (bytes and percentages). */
export function getMemory() {
  return get<MemoryInfo>('/system/memory');
}

/** Returns partition list with device, mount, fs type, and usage. */
export function getDisks() {
  return get<DiskInfo>('/system/disks');
}

/** Returns hostname, OS, platform, kernel version, arch, and uptime. */
export function getOs() {
  return get<OSInfo>('/system/os');
}

/** Returns all network interfaces with addresses, MAC, MTU, and flags. */
export function getNetworkInterfaces() {
  return get<NetworkInterface[]>('/system/network/interfaces');
}

/** Returns DNS servers and search domains from resolv.conf. */
export function getNetworkConfig() {
  return get<NetworkConfig>('/system/network/config');
}

/** Returns TCP/UDP ports in LISTEN state with process info. */
export function getListeningPorts() {
  return get<ListeningPort[]>('/system/network/ports');
}

/**
 * Queries time-series metrics with optional time range, label filters, and aggregation.
 *
 * @param query.metric    - Required. Metric name (e.g. "system.cpu.usage_percent").
 * @param query.from      - Start time (RFC 3339).
 * @param query.to        - End time (RFC 3339).
 * @param query.labels    - Comma-separated key=val filters (e.g. "cpu=total").
 * @param query.aggregation - Time bucket: "raw" | "10s" | "1m" | "5m" | "1h".
 */
export function getMetrics(query: MetricsQuery) {
  const params: Record<string, string | number> = { metric: query.metric };
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.labels) params.labels = query.labels;
  if (query.aggregation) params.aggregation = query.aggregation;
  return get<MetricsResult>('/system/metrics', params);
}

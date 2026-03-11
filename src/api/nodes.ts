/**
 * Nodes provider API  –  /api/v1/nodes/*
 *
 * CRUD operations for managed cluster nodes with role assignments
 * and encrypted credentials.
 */
import { get, post, put, del } from './client';
import type { ManagedNode, NodeCreateInput, NodeUpdateInput, NodeDeleteResult } from '../types/api';

/** Returns all managed cluster nodes with role assignments. */
export function listNodes() {
  return get<ManagedNode[] | null>('/nodes');
}

/** Returns a single node by ID with secret-presence flags. */
export function getNode(id: string) {
  return get<ManagedNode>(`/nodes/${id}`);
}

/**
 * Creates a new node with optional roles and credentials.
 * Only `name` and `ansible_host` are required.
 */
export function createNode(input: NodeCreateInput) {
  return post<ManagedNode>('/nodes', input);
}

/**
 * Updates a node. All fields are optional; only provided fields are changed.
 * `roles` replaces the entire set when provided.
 * Set password/sudo_password/ssh_key to empty string to clear.
 */
export function updateNode(id: string, input: NodeUpdateInput) {
  return put<ManagedNode>(`/nodes/${id}`, input);
}

/** Deletes a node and its role assignments. */
export function deleteNode(id: string) {
  return del<NodeDeleteResult>(`/nodes/${id}`);
}

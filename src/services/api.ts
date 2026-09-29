/**
 * NETRA-Guard API Service Layer
 *
 * All functions check MOCK_MODE first. When true they return mock data
 * without making any network calls. When false they call the local backend.
 *
 * Backend endpoints:
 *   GET  /api/demo/workspace        → DemoWorkspaceManifest
 *   POST /api/assets                → Asset
 *   POST /api/runs                  → { run_id: string }
 *   GET  /api/runs/{run_id}         → RunResult
 */

import type { Asset, DemoWorkspaceManifest, WorkspaceHealthItem, RunRequest, RunResult, ProvenanceEntry } from '../types';
import {
  MOCK_ASSETS,
  MOCK_WORKSPACE,
  MOCK_WORKSPACE_HEALTH,
  DEMO_MANIFEST,
  MOCK_PROVENANCE,
} from '../mockData';

/** Set to true while backend is not yet connected. */
export const MOCK_MODE = true;

const BASE_URL = 'http://localhost:8000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

// ─── Workspace ────────────────────────────────────────────────────────────────

/**
 * GET /api/demo/workspace
 * Returns the bundled demo workspace manifest.
 */
export async function fetchDemoWorkspace(): Promise<DemoWorkspaceManifest> {
  if (MOCK_MODE) {
    await delay(600);
    return { ...DEMO_MANIFEST };
  }
  const res = await fetch(`${BASE_URL}/api/demo/workspace`);
  if (!res.ok) throw new Error(`fetchDemoWorkspace: ${res.status}`);
  return res.json() as Promise<DemoWorkspaceManifest>;
}

/**
 * Returns registered assets for the active workspace.
 * GET /api/assets  (not yet implemented in backend — using mock)
 */
export async function fetchAssets(): Promise<Asset[]> {
  if (MOCK_MODE) {
    await delay(400);
    return [...MOCK_ASSETS];
  }
  const res = await fetch(`${BASE_URL}/api/assets?workspaceId=${MOCK_WORKSPACE.id}`);
  if (!res.ok) throw new Error(`fetchAssets: ${res.status}`);
  return res.json() as Promise<Asset[]>;
}

/**
 * POST /api/assets
 * Register a new asset file. Computes SHA-256 on the backend.
 */
export async function registerAsset(file: File): Promise<Asset> {
  if (MOCK_MODE) {
    await delay(1200);
    // Return a synthetic registered asset from the file
    const mockAsset: Asset = {
      id: `asset-upload-${Date.now()}`,
      displayName: file.name,
      internalId: `upload_${file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      type: file.name.endsWith('.onnx') || file.name.endsWith('.pt') ? 'MODEL' : 'DATASET',
      format: file.name.endsWith('.onnx') ? 'ONNX' : file.name.endsWith('.pt') ? 'PT' : 'YOLO',
      size: formatBytes(file.size),
      hash: 'mock' + Math.random().toString(16).substring(2, 18).padEnd(60, '0'),
      registeredAt: new Date().toISOString(),
      role: 'CURRENT',
      assetStatus: 'REGISTERED',
      metadata: {},
    };
    return mockAsset;
  }
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/api/assets`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`registerAsset: ${res.status}`);
  return res.json() as Promise<Asset>;
}

/**
 * Returns current workspace health checks.
 */
export async function fetchWorkspaceHealth(): Promise<WorkspaceHealthItem[]> {
  if (MOCK_MODE) {
    await delay(300);
    return [...MOCK_WORKSPACE_HEALTH];
  }
  const res = await fetch(`${BASE_URL}/api/workspace/health`);
  if (!res.ok) throw new Error(`fetchWorkspaceHealth: ${res.status}`);
  return res.json() as Promise<WorkspaceHealthItem[]>;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

/** Simulated in-memory run store for mock mode */
const mockRunStore: Record<string, RunResult> = {};

/**
 * POST /api/runs
 * Enqueues a new assurance run. Returns the run ID immediately.
 */
export async function startRun(request: RunRequest): Promise<{ run_id: string }> {
  if (MOCK_MODE) {
    await delay(400);
    const run_id = `RUN-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const hasScenario = !!request.scenarioId;
    mockRunStore[run_id] = {
      runId: run_id,
      status: hasScenario ? 'WARNING' : 'PASS',
      checksExecuted: request.checks.length,
      warnings: hasScenario ? 2 : 0,
      critical: 0,
      newFindings: hasScenario ? 2 : 0,
      durationMs: 0,
      controlledScenarioTriggered: hasScenario,
    };
    return { run_id };
  }
  const res = await fetch(`${BASE_URL}/api/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`startRun: ${res.status}`);
  return res.json() as Promise<{ run_id: string }>;
}

/**
 * GET /api/runs/{run_id}
 * Returns run result or null if still in progress.
 */
export async function fetchRunResult(runId: string): Promise<RunResult | null> {
  if (MOCK_MODE) {
    await delay(200);
    return mockRunStore[runId] ?? null;
  }
  const res = await fetch(`${BASE_URL}/api/runs/${encodeURIComponent(runId)}`);
  if (res.status === 202) return null;
  if (!res.ok) throw new Error(`fetchRunResult: ${res.status}`);
  return res.json() as Promise<RunResult>;
}
// ─── PROVENANCE ─────────────────────────────────────────────────────────────

export async function fetchProvenance(): Promise<ProvenanceEntry[]> {
  if (MOCK_MODE) {
    await delay(300);
    return [...MOCK_PROVENANCE].reverse(); // Return newest first for the list
  }
  const res = await fetch('/api/ledger');
  if (!res.ok) throw new Error('Failed to fetch ledger');
  return res.json();
}

export async function verifyLedger(): Promise<{ valid: boolean; failedSequence?: string }> {
  if (MOCK_MODE) {
    await delay(2000); // Simulate long verification
    // We'll simulate that entry 041 is invalid if we want a failure demo, 
    // but the prompt says "LEDGER VALID" for success and failure demo state. 
    // Let's just return true by default. The UI can handle the states.
    return { valid: true };
  }
  const res = await fetch('/api/ledger/verify', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to verify ledger');
  return res.json();
}

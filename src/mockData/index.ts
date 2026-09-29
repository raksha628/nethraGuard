import type {
  Run,
  Workspace,
  Asset,
  Finding,
  ProvenanceEntry,
  ComparisonResult,
  DemoWorkspaceManifest,
  WorkspaceHealthItem,
} from '../types';

// ─── Core Workspace ───────────────────────────────────────────────────────────

export const MOCK_WORKSPACE: Workspace = {
  id: 'ws-SIH26228',
  name: 'SIH26228 Demo Workspace',
  description:
    'Computer-vision assurance workspace for the SIH26228 prototype. Includes dataset integrity, model provenance, distribution shift, and adversarial robustness checks.',
  lastUpdated: '2026-09-29T14:12:00Z',
  assetCount: 6,
};

// ─── Demo Manifest ────────────────────────────────────────────────────────────

export const DEMO_MANIFEST: DemoWorkspaceManifest = {
  id: 'ws-SIH26228',
  name: 'SIH26228 Reference Workspace',
  description:
    'Bundled prototype workspace containing reference dataset, current inference batch, baseline model artifact, evaluation set, and assurance configuration.',
  contents: [
    'Reference dataset (YOLO format)',
    'Current inference batch (YOLO format)',
    'Baseline model artifact (ONNX)',
    'Baseline manifest (JSON)',
    'Fixed evaluation set (YOLO format)',
  ],
  assetIds: ['asset-ref', 'asset-cur', 'asset-model', 'asset-eval'],
  status: 'READY',
};

// ─── Registered Assets (rich schema) ─────────────────────────────────────────

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'asset-ref',
    displayName: 'reference-dataset',
    internalId: 'ref_dataset_sih26228_v1',
    type: 'DATASET',
    format: 'YOLO',
    size: '18.4 MB',
    hash: 'a83f2c14e09d3a5b7f1c8e22d6b90f4c31a7d6e9f0a2b3c4d5e6f7a8b9c091c2',
    registeredAt: '2026-09-29T09:00:00Z',
    role: 'REFERENCE',
    assetStatus: 'REGISTERED',
    baselineRelationship: 'Used as reference distribution for PSI computation.',
    metadata: {
      imageCount: 4200,
      classCount: 8,
      splitInfo: '70 / 20 / 10 (train / val / test)',
    },
  },
  {
    id: 'asset-model',
    displayName: 'baseline-model',
    internalId: 'model_sih26228_v4_baseline',
    type: 'MODEL',
    format: 'ONNX',
    size: '6.8 MB',
    hash: '3f12a94c7e85d2b1f6a3c8e0d4b7f9a2c1e3d5f7a9b0c2d4e6f8a0b2c4d6e8b1',
    registeredAt: '2026-09-29T09:05:00Z',
    role: 'BASELINE',
    assetStatus: 'BASELINE',
    baselineRelationship: 'Registered as baseline. Subsequent runs compare against this artifact hash.',
    metadata: {
      framework: 'YOLOv8 / ONNX Runtime',
      inputShape: '1 × 3 × 640 × 640',
    },
  },
  {
    id: 'asset-cur',
    displayName: 'current-batch',
    internalId: 'cur_batch_sih26228_20260929',
    type: 'DATASET',
    format: 'YOLO',
    size: '7.2 MB',
    hash: '91acc3d7e1f2a4b5c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a24d77',
    registeredAt: '2026-09-29T13:55:00Z',
    role: 'CURRENT',
    assetStatus: 'REGISTERED',
    baselineRelationship: 'Compared against reference-dataset for distribution shift analysis.',
    metadata: {
      imageCount: 1580,
      classCount: 8,
      splitInfo: 'Inference batch — no split',
    },
  },
  {
    id: 'asset-eval',
    displayName: 'evaluation-set',
    internalId: 'eval_set_sih26228_fixed_v1',
    type: 'DATASET',
    format: 'YOLO',
    size: '3.1 MB',
    hash: 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    registeredAt: '2026-09-29T09:02:00Z',
    role: 'EVALUATION',
    assetStatus: 'REGISTERED',
    baselineRelationship: 'Fixed held-out evaluation set. Not used in training.',
    metadata: {
      imageCount: 620,
      classCount: 8,
      splitInfo: 'Evaluation only',
    },
  },
];

// ─── Workspace Health ─────────────────────────────────────────────────────────

export const MOCK_WORKSPACE_HEALTH: WorkspaceHealthItem[] = [
  {
    key: 'dataset',
    label: 'Dataset registered',
    description: 'reference-dataset · 4,200 images · YOLO format',
    status: 'PASS',
  },
  {
    key: 'model',
    label: 'Model registered',
    description: 'baseline-model · ONNX · input 640×640',
    status: 'PASS',
  },
  {
    key: 'baseline',
    label: 'Baseline available',
    description: 'RUN-2026-0038 designated as baseline',
    status: 'PASS',
  },
  {
    key: 'evalset',
    label: 'Evaluation set available',
    description: 'evaluation-set · 620 images · fixed held-out split',
    status: 'PASS',
  },
  {
    key: 'config',
    label: 'Configuration available',
    description: 'assurance-config.yaml loaded · thresholds applied',
    status: 'WARNING',
  },
];

// ─── Assurance Runs ───────────────────────────────────────────────────────────

export const MOCK_RUNS: Run[] = [
  {
    id: 'RUN-2026-0037',
    workspaceId: 'ws-SIH26228',
    type: 'BASELINE',
    status: 'COMPLETED',
    startedAt: '2026-09-10T10:05:00Z',
    completedAt: '2026-09-10T10:18:00Z',
    summary: { totalChecks: 38, passed: 38, warnings: 0, failures: 0, notRun: 0, durationMs: 780000 },
    controlledIssueTriggered: false,
  },
  {
    id: 'RUN-2026-0038',
    workspaceId: 'ws-SIH26228',
    type: 'BASELINE',
    status: 'COMPLETED',
    startedAt: '2026-09-15T08:00:00Z',
    completedAt: '2026-09-15T08:15:00Z',
    summary: { totalChecks: 42, passed: 42, warnings: 0, failures: 0, notRun: 0, durationMs: 900000 },
    controlledIssueTriggered: false,
  },
  {
    id: 'RUN-2026-0042',
    workspaceId: 'ws-SIH26228',
    type: 'CURRENT',
    status: 'COMPLETED',
    startedAt: '2026-09-29T14:00:00Z',
    completedAt: '2026-09-29T14:12:00Z',
    summary: { totalChecks: 42, passed: 39, warnings: 3, failures: 0, notRun: 0, durationMs: 720000 },
    controlledIssueTriggered: true,
  },
];

// ─── Findings ─────────────────────────────────────────────────────────────────

export const MOCK_FINDINGS: Finding[] = [
  {
    id: 'DATA-004',
    runId: 'RUN-2026-0042',
    assetId: 'asset-ref',
    severity: 'WARNING',
    category: 'INTEGRITY',
    title: 'Suspicious Sample Cluster Detected',
    description:
      'Perceptual hashing identified 23 near-duplicate samples across the dataset. One cluster of 3 images is flagged as a potential injection. Artifact differs from registered baseline.',
    evidence: [
      { id: 'ev-d004-1', type: 'METRIC', description: '23 duplicates detected (threshold: 0)' },
      { id: 'ev-d004-2', type: 'METRIC', description: '1 near-duplicate cluster (pHash distance < 8)' },
    ],
  },
  {
    id: 'MODEL-002',
    runId: 'RUN-2026-0042',
    assetId: 'asset-model',
    severity: 'WARNING',
    category: 'INTEGRITY',
    title: 'Model Artifact Differs from Registered Baseline',
    description:
      'The SHA-256 hash of model.onnx does not match the hash registered during baseline ingestion. Artifact differs from registered baseline. Simulated condition detected.',
    evidence: [
      { id: 'ev-m002-1', type: 'HASH_MISMATCH', description: 'Expected: 3f12a94c... | Actual: c3d4e5f6...' },
    ],
  },
  {
    id: 'SHIFT-001',
    runId: 'RUN-2026-0042',
    assetId: 'asset-cur',
    severity: 'WARNING',
    category: 'DRIFT',
    title: 'Input Distribution Shift Exceeds Threshold',
    description:
      'Population Stability Index for the current inference batch exceeds the configured threshold. Brightness and contrast channels show the greatest divergence from training distribution.',
    evidence: [
      { id: 'ev-s001-1', type: 'METRIC', description: 'PSI: 0.21 (threshold: 0.20)' },
      { id: 'ev-s001-2', type: 'METRIC', description: 'Wasserstein distance (brightness): 0.18' },
    ],
  },
  {
    id: 'MODEL-001',
    runId: 'RUN-2026-0042',
    assetId: 'asset-model',
    severity: 'PASS',
    category: 'ROBUSTNESS',
    title: 'Adversarial Noise Resilience',
    description: 'Model maintained ≥95% accuracy under PGD and FGSM adversarial perturbation probes.',
    evidence: [],
  },
];

// ─── Comparisons ──────────────────────────────────────────────────────────────

export const MOCK_COMPARISONS: ComparisonResult[] = [
  {
    metricName: 'Dataset Integrity (pHash duplicates)',
    baseline: 0,
    current: 23,
    delta: 23,
    threshold: 0,
    status: 'WARNING',
  },
  {
    metricName: 'Model SHA-256 Match',
    baseline: 1,
    current: 0,
    delta: -1,
    threshold: 0,
    status: 'WARNING',
  },
  {
    metricName: 'Distribution PSI',
    baseline: 0.04,
    current: 0.21,
    delta: 0.17,
    threshold: 0.2,
    status: 'WARNING',
  },
  {
    metricName: 'Adversarial Robustness (PGD)',
    baseline: 0.962,
    current: 0.958,
    delta: -0.004,
    threshold: 0.05,
    status: 'PASS',
  },
  {
    metricName: 'Model Accuracy (Validation)',
    baseline: 0.985,
    current: 0.978,
    delta: -0.007,
    threshold: 0.02,
    status: 'PASS',
  },
];

// ─── Provenance Ledger ────────────────────────────────────────────────────────

export const MOCK_PROVENANCE: ProvenanceEntry[] = [
  {
    sequence: '040',
    runId: 'RUN-2026-0038',
    timestamp: '2026-09-28T09:12:44Z',
    status: 'PASS',
    baseline: '—',
    actor: 'SYS_AGENT_01',
    assetHashes: [
      'a83f2c14e09d3a5b7f1c8e22d6b90f4c31a7d6e9f0a2b3c4d5e6f7a8b9c091c2',
      '3f12a94c7e85d2b1f6a3c8e0d4b7f9a2c1e3d5f7a9b0c2d4e6f8a0b2c4d6e8b1'
    ],
    configHash: 'CFG-8A91',
    summaryHash: '0000000000000000000000000000000000000000000000000000000000000000',
    previousEntryHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    currentEntryHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    isControlledTest: false
  },
  {
    sequence: '041',
    runId: 'RUN-2026-0042',
    timestamp: '2026-09-29T14:42:11Z',
    status: 'REVIEW',
    baseline: '0038',
    actor: 'OPERATOR_99',
    assetHashes: [
      'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4'
    ],
    configHash: 'CFG-8A91',
    summaryHash: '739c29f6358c279c67bc2f6805187e5b61b5ff2c2a3e0b4c803f295b9c054238',
    previousEntryHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    currentEntryHash: '4a0f41369cb7613b560df01362e6093fc53f2cf190288825a07c0ea910542b45',
    isControlledTest: true
  },
  {
    sequence: '042',
    runId: 'RUN-2026-0043',
    timestamp: '2026-09-29T14:50:00Z',
    status: 'PASS',
    baseline: '0038',
    actor: 'SYS_AGENT_01',
    assetHashes: [
      'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
      '3f12a94c7e85d2b1f6a3c8e0d4b7f9a2c1e3d5f7a9b0c2d4e6f8a0b2c4d6e8b1'
    ],
    configHash: 'CFG-8A91',
    summaryHash: 'b5b8c2e6f47051a8d56b4f71a4f00dbbe4300a29bb6d89280d0577b218f4803d',
    previousEntryHash: '4a0f41369cb7613b560df01362e6093fc53f2cf190288825a07c0ea910542b45',
    currentEntryHash: '20165b4c4897f215d2a9018f670737a28e7eb852ef7141525f0e9bf34f71a0eb',
    isControlledTest: false
  }
];

// ─── Distribution Shift Chart ─────────────────────────────────────────────────

export const MOCK_DISTRIBUTION_DATA = [
  { feature: 'Brightness', baseline: 0.62, current: 0.79, threshold: 0.20 },
  { feature: 'Contrast', baseline: 0.44, current: 0.53, threshold: 0.20 },
  { feature: 'Img Width', baseline: 0.38, current: 0.41, threshold: 0.20 },
  { feature: 'Img Height', baseline: 0.37, current: 0.40, threshold: 0.20 },
  { feature: 'Saturation', baseline: 0.29, current: 0.33, threshold: 0.20 },
  { feature: 'Sharpness', baseline: 0.51, current: 0.58, threshold: 0.20 },
];

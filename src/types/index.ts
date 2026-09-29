export type Status = 'PASS' | 'WARNING' | 'FAIL' | 'NOT RUN';
export type ProvenanceStatus = Status | 'REVIEW';

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  assetCount: number;
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export type AssetType = 'DATASET' | 'MODEL' | 'PIPELINE';
export type AssetFormat = 'YOLO' | 'COCO' | 'ONNX' | 'PT' | 'CSV' | 'UNKNOWN';
export type AssetRole = 'REFERENCE' | 'CURRENT' | 'BASELINE' | 'EVALUATION' | 'CONFIG';
export type AssetStatus = 'REGISTERED' | 'BASELINE' | 'PENDING' | 'ERROR';

export interface AssetMetadata {
  imageCount?: number;
  classCount?: number;
  splitInfo?: string;
  framework?: string;
  inputShape?: string;
  evaluationSetId?: string;
}

export interface Asset {
  id: string;
  displayName: string;         // Safe display name shown to analyst
  internalId: string;          // Safe internal identifier (no raw FS path)
  type: AssetType;
  format: AssetFormat;
  size: string;
  hash: string;
  registeredAt: string;
  role: AssetRole;
  assetStatus: AssetStatus;
  baselineRelationship?: string;
  metadata: AssetMetadata;
}

// Legacy – kept for backwards compat with existing pages
export type LegacyAsset = {
  id: string;
  name: string;
  type: 'DATASET' | 'MODEL' | 'PIPELINE';
  hash: string;
  size: string;
  registeredAt: string;
};

// ─── Workspace Health ─────────────────────────────────────────────────────────

export interface WorkspaceHealthItem {
  key: string;
  label: string;
  description: string;
  status: Status;
}

// ─── Demo Workspace Manifest ──────────────────────────────────────────────────

export interface DemoWorkspaceManifest {
  id: string;
  name: string;
  description: string;
  contents: string[];
  assetIds: string[];
  status: 'READY' | 'LOADING' | 'ERROR';
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

export interface RunSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  failures: number;
  notRun: number;
  durationMs: number;
}

export interface Run {
  id: string;
  workspaceId: string;
  type: 'BASELINE' | 'CURRENT';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  summary: RunSummary;
  controlledIssueTriggered: boolean;
}

// ─── Evidence & Findings ──────────────────────────────────────────────────────

/** Legacy narrow type — kept for existing callers */
export interface Evidence {
  id: string;
  type: 'IMAGE' | 'LOG' | 'METRIC' | 'HASH_MISMATCH';
  url?: string;
  content?: string;
  description: string;
}

export type FindingSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'PASS';
export type FindingStatus   = 'OPEN' | 'REVIEWED' | 'CLEARED';
export type CertaintyType   = 'DETERMINISTIC' | 'STATISTICAL';
export type DispositionRecommendation = 'ACCEPT' | 'REVIEW' | 'QUARANTINE';
export type FindingCategory =
  | 'DATA_INTEGRITY' | 'MODEL_INTEGRITY' | 'DISTRIBUTION_SHIFT'
  | 'COMPARATOR' | 'ROBUSTNESS';

export interface RichEvidence {
  id: string;
  type: 'IMAGE' | 'LOG' | 'METRIC' | 'HASH_MISMATCH';
  /** SVG / data-URL placeholder — never a raw filesystem path */
  thumbnailDataUrl?: string;
  sampleId?: string;
  expectedLabel?: string;
  observedLabel?: string;

  fileHash?: string;
  content?: string;
  description: string;
  findingId: string;
}

export interface RichFinding {
  id: string;
  runId: string;
  assetId: string;
  affectedArtifact: string;
  severity: FindingSeverity;
  status: FindingStatus;
  category: FindingCategory;
  categoryLabel: string;
  title: string;
  description: string;
  whatWasTested: string;
  method: string;
  observedValue: string;
  expectedValue: string;
  thresholdLabel: string;
  certaintyType: CertaintyType;
  certaintyNote: string;
  statisticalMetric?: { raw: number; threshold: number; sampleCount: number; unit: string };
  limitations: string;
  disposition: DispositionRecommendation;
  dispositionRationale: string;
  controlledScenario: boolean;
  evidence: RichEvidence[];
  observed: string;
  threshold: string;
}

/** Legacy narrow type — kept for compatibility */
export interface Finding {
  id: string;
  runId: string;
  assetId: string;
  severity: Status;
  category: 'INTEGRITY' | 'BIAS' | 'DRIFT' | 'ROBUSTNESS' | 'EXPLAINABILITY';
  title: string;
  description: string;
  evidence: Evidence[];
}


// ─── Provenance ───────────────────────────────────────────────────────────────

export interface ProvenanceEntry {
  sequence: string;
  runId: string;
  timestamp: string;
  status: ProvenanceStatus;
  baseline: string;
  actor: string;
  assetHashes: string[];
  configHash: string;
  summaryHash: string;
  previousEntryHash: string;
  currentEntryHash: string;
  isControlledTest: boolean;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  assetId: string;
  previousHash: string;
  newHash: string;
  signature: string;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface DistributionMetric {
  label: string;
  value: number;
  baselineValue?: number;
}

export interface ComparisonResult {
  metricName: string;
  baseline: number;
  current: number;
  delta: number;
  threshold: number;
  status: Status;
}

// ─── Assurance Run (detailed) ─────────────────────────────────────────────────

export type CheckId = 'DATA_INTEGRITY' | 'MODEL_INTEGRITY' | 'DISTRIBUTION_SHIFT' | 'COMPARATOR';

export type StageStatus = 'WAITING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'NOT RUN';

export interface RunStage {
  id: string;
  label: string;
  status: StageStatus;
  durationMs?: number;
  detail?: string;
}

export interface ThresholdConfig {
  checkId: CheckId;
  metric: string;
  value: number;
  unit: string;
  label: string;
  tooltip: string;
}

export interface ScenarioConfig {
  id: string;
  title: string;
  description: string;
  affectedAsset: string;
  expectedSignal: string;
  category: CheckId;
}

export interface RunRequest {
  workspaceId: string;
  checks: CheckId[];
  scenarioId?: string;
  thresholds: Record<string, number>;
}

export interface RunResult {
  runId: string;
  status: Status;
  checksExecuted: number;
  warnings: number;
  critical: number;
  newFindings: number;
  durationMs: number;
  controlledScenarioTriggered: boolean;
}

import type { RichFinding } from '../types';

// ─── SVG placeholder thumbnails (no filesystem paths exposed) ─────────────────

function svgThumb(label: string, bg: string, fg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90">
    <rect width="120" height="90" fill="${bg}"/>
    <rect x="10" y="10" width="100" height="70" rx="3" fill="none" stroke="${fg}" stroke-width="1.5" stroke-opacity="0.4"/>
    <text x="60" y="42" font-family="monospace" font-size="9" fill="${fg}" fill-opacity="0.7" text-anchor="middle">${label}</text>
    <text x="60" y="56" font-family="monospace" font-size="7" fill="${fg}" fill-opacity="0.4" text-anchor="middle">SAMPLE PREVIEW</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const THUMB_DUPE_A  = svgThumb('IMG-4821', '#0f172a', '#a78bfa');
const THUMB_DUPE_B  = svgThumb('IMG-4822', '#0f172a', '#a78bfa');
const THUMB_BRIGHT  = svgThumb('IMG-0091', '#1c1917', '#fbbf24');
const THUMB_BRIGHT2 = svgThumb('IMG-0094', '#1c1917', '#fbbf24');

// ─── Rich Findings ─────────────────────────────────────────────────────────────

export const RICH_FINDINGS: RichFinding[] = [
  // ── DATA-004 ──────────────────────────────────────────────────────────────────
  {
    id: 'DATA-004',
    runId: 'RUN-2026-0042',
    assetId: 'asset-ref',
    affectedArtifact: 'reference-dataset',
    severity: 'WARNING',
    status: 'OPEN',
    category: 'DATA_INTEGRITY',
    categoryLabel: 'Data Integrity',
    title: 'Near-duplicate cluster detected',
    description:
      'Perceptual hash analysis identified 23 near-duplicate image samples in the dataset. One cluster of 3 images has an inter-sample pHash distance below the configured threshold (< 8 bits). These samples may bias model evaluation metrics if included in the validation split.',
    whatWasTested:
      'All images in reference-dataset were hashed using SHA-256 (file integrity) and perceptual hashing (pHash, 64-bit DCT). Pairwise Hamming distances were computed for the pHash index. Clusters with distance ≤ 8 bits were flagged.',
    method: 'SHA-256 + Perceptual Hash (pHash, 64-bit DCT)',
    observedValue: '23 near-duplicate samples · 1 cluster (pHash distance ≤ 8)',
    expectedValue: '0 duplicates (threshold: 0)',
    thresholdLabel: 'Duplicate tolerance: 0 samples (demonstration threshold)',
    certaintyType: 'DETERMINISTIC',
    certaintyNote:
      'Rule-based / deterministic check. The pHash distance computation is exact; the threshold of 8 bits is a configurable prototype value.',
    limitations:
      'Near-duplicate detection via pHash identifies perceptually similar images but cannot determine intent. Duplicates may arise from legitimate data collection processes (e.g., burst photography, augmentation artefacts) or may represent injected samples. Manual review is required to determine disposition.',
    disposition: 'REVIEW',
    dispositionRationale:
      'Finding is open. 23 samples flagged; 1 cluster warrants manual inspection to determine whether samples are legitimate or should be excluded from the evaluation split.',
    controlledScenario: true,
    observed: '23 duplicates',
    threshold: '0 expected',
    evidence: [
      {
        id: 'ev-d004-img-1',
        type: 'IMAGE',
        thumbnailDataUrl: THUMB_DUPE_A,
        sampleId: 'IMG-4821',
        expectedLabel: 'vehicle / class-3',
        observedLabel: 'vehicle / class-3',

        fileHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        description: 'Original sample — used as duplicate reference.',
        findingId: 'DATA-004',
      },
      {
        id: 'ev-d004-img-2',
        type: 'IMAGE',
        thumbnailDataUrl: THUMB_DUPE_B,
        sampleId: 'IMG-4822',
        expectedLabel: 'vehicle / class-3',
        observedLabel: 'vehicle / class-3',

        fileHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
        description: 'Near-duplicate of IMG-4821. pHash distance: 4 bits.',
        findingId: 'DATA-004',
      },
      {
        id: 'ev-d004-metric',
        type: 'METRIC',
        description: 'pHash cluster summary: 1 cluster · 3 members · min distance 4 bits · max distance 6 bits',
        findingId: 'DATA-004',
      },
    ],
  },

  // ── MODEL-002 ─────────────────────────────────────────────────────────────────
  {
    id: 'MODEL-002',
    runId: 'RUN-2026-0042',
    assetId: 'asset-model',
    affectedArtifact: 'baseline-model.onnx',
    severity: 'WARNING',
    status: 'OPEN',
    category: 'MODEL_INTEGRITY',
    categoryLabel: 'Model Integrity',
    title: 'Artifact differs from registered baseline',
    description:
      'The SHA-256 hash of the model artifact in the current run does not match the hash recorded at baseline registration time. Artifact differs from registered baseline. Controlled scenario condition observed.',
    whatWasTested:
      'The SHA-256 digest of baseline-model.onnx was computed and compared against the hash stored in the provenance ledger at registration time (RUN-2026-0038). Metadata fields (ONNX opset, model version, producer) were also compared.',
    method: 'SHA-256 hash comparison against provenance ledger',
    observedValue: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    expectedValue: '3f12a94c7e85d2b1f6a3c8e0d4b7f9a2c1e3d5f7a9b0c2d4e6f8a0b2c4d6e8b1',
    thresholdLabel: 'Exact baseline identity (SHA-256 must match registered hash)',
    certaintyType: 'DETERMINISTIC',
    certaintyNote:
      'Rule-based / deterministic check. SHA-256 comparison is exact and collision-resistant for practical purposes. A mismatch is a definitive artifact difference.',
    limitations:
      'A changed model hash establishes artifact difference from the registered baseline; it does not independently prove malicious tampering. Differences may arise from re-training, format conversion, quantisation, or authorised updates not captured in the provenance ledger.',
    disposition: 'REVIEW',
    dispositionRationale:
      'Hash mismatch is open. Review provenance ledger to determine whether an authorised model update occurred. If not, escalate to asset custodian.',
    controlledScenario: true,
    observed: 'SHA-256 mismatch',
    threshold: 'Exact baseline match',
    evidence: [
      {
        id: 'ev-m002-hash',
        type: 'HASH_MISMATCH',
        description: 'Expected: 3f12a94c… | Observed: c3d4e5f6… | Mismatch at byte 0',
        findingId: 'MODEL-002',
      },
      {
        id: 'ev-m002-meta',
        type: 'LOG',
        content:
          'ONNX opset: 17 (unchanged)\nModel version: 4 (unchanged)\nProducer: pytorch 2.1.0 (unchanged)\nFile size: 6.8 MB → 6.8 MB (unchanged)\nHash: MISMATCH',
        description: 'ONNX metadata comparison output',
        findingId: 'MODEL-002',
      },
    ],
  },

  // ── SHIFT-001 ─────────────────────────────────────────────────────────────────
  {
    id: 'SHIFT-001',
    runId: 'RUN-2026-0042',
    assetId: 'asset-cur',
    affectedArtifact: 'current-batch',
    severity: 'WARNING',
    status: 'OPEN',
    category: 'DISTRIBUTION_SHIFT',
    categoryLabel: 'Distribution Shift',
    title: 'Distribution shift observed in inference batch',
    description:
      'The Population Stability Index (PSI) for the current inference batch exceeds the configured threshold. Brightness and contrast channels show the greatest divergence from the training distribution. Controlled scenario condition observed.',
    whatWasTested:
      'Image-level statistics (brightness mean, contrast std-dev, spatial dimensions, saturation, sharpness) were extracted from all images in current-batch and compared against the reference distribution computed from reference-dataset at baseline time.',
    method: 'Population Stability Index (PSI) per feature channel',
    observedValue: 'PSI: 0.21 (Brightness: 0.18, Contrast: 0.09)',
    expectedValue: 'PSI ≤ 0.20 (configured threshold)',
    thresholdLabel: 'PSI threshold: 0.20 (demonstration threshold)',
    certaintyType: 'STATISTICAL',
    certaintyNote:
      'Statistical check. PSI is a distribution-distance metric; results depend on sample count and binning strategy. This is not a calibrated probability of deployment failure.',
    statisticalMetric: {
      raw: 0.21,
      threshold: 0.20,
      sampleCount: 1580,
      unit: 'PSI',
    },
    limitations:
      'PSI measures distributional distance but cannot determine the cause of shift. Shift may reflect legitimate domain change, sensor variation, or a controlled condition. Model performance impact requires empirical evaluation on the shifted distribution.',
    disposition: 'REVIEW',
    dispositionRationale:
      'PSI marginally exceeds threshold (0.21 vs 0.20). Review whether the shift reflects a legitimate input domain change or an anomalous condition requiring data collection review.',
    controlledScenario: true,
    observed: 'PSI 0.21',
    threshold: '0.20',
    evidence: [
      {
        id: 'ev-s001-img-1',
        type: 'IMAGE',
        thumbnailDataUrl: THUMB_BRIGHT,
        sampleId: 'IMG-0091',
        expectedLabel: 'person / class-1',
        observedLabel: 'person / class-1',

        fileHash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
        description: 'Sample from current-batch showing elevated brightness.',
        findingId: 'SHIFT-001',
      },
      {
        id: 'ev-s001-img-2',
        type: 'IMAGE',
        thumbnailDataUrl: THUMB_BRIGHT2,
        sampleId: 'IMG-0094',
        expectedLabel: 'vehicle / class-3',
        observedLabel: 'background / class-0',

        fileHash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
        description: 'Sample showing brightness-induced classification degradation.',
        findingId: 'SHIFT-001',
      },
      {
        id: 'ev-s001-metric',
        type: 'METRIC',
        description: 'PSI by channel: Brightness 0.18 · Contrast 0.09 · Width 0.03 · Height 0.02 · Saturation 0.04 · Sharpness 0.07',
        findingId: 'SHIFT-001',
      },
    ],
  },

  // ── MODEL-001 (PASS) ──────────────────────────────────────────────────────────
  {
    id: 'MODEL-001',
    runId: 'RUN-2026-0042',
    assetId: 'asset-model',
    affectedArtifact: 'baseline-model.onnx',
    severity: 'PASS',
    status: 'CLEARED',
    category: 'ROBUSTNESS',
    categoryLabel: 'Robustness',
    title: 'Adversarial noise resilience verified',
    description:
      'Model maintained ≥95% accuracy under PGD and FGSM adversarial perturbation probes at ε = 0.02 (L∞ norm). No degradation beyond the configured tolerance.',
    whatWasTested:
      'Fixed evaluation set (620 images) was used to probe model predictions under PGD-20 and FGSM adversarial examples. Clean accuracy and adversarial accuracy were compared.',
    method: 'PGD-20 + FGSM adversarial probing on fixed evaluation set',
    observedValue: 'Adversarial accuracy: 95.8% (clean: 97.8%)',
    expectedValue: '≥ 95.0% adversarial accuracy',
    thresholdLabel: 'Adversarial accuracy threshold: 95.0%',
    certaintyType: 'STATISTICAL',
    certaintyNote:
      'Statistical check over 620 evaluation samples. Result is specific to the fixed evaluation set and the perturbation parameters used; generalisation to other threat models requires separate evaluation.',
    statisticalMetric: {
      raw: 0.958,
      threshold: 0.95,
      sampleCount: 620,
      unit: 'accuracy',
    },
    limitations:
      'Adversarial robustness results are specific to the evaluated perturbation budget (ε = 0.02, L∞) and attack algorithm. Stronger attacks or different norms may yield different results.',
    disposition: 'ACCEPT',
    dispositionRationale:
      'Check passed. Adversarial accuracy (95.8%) is above the configured threshold (95.0%). No action required.',
    controlledScenario: false,
    observed: 'Acc: 95.8%',
    threshold: '≥ 95.0%',
    evidence: [
      {
        id: 'ev-r001-metric',
        type: 'METRIC',
        description: 'Clean accuracy: 97.8% · PGD-20 accuracy: 95.8% · FGSM accuracy: 96.4% · Eval set: 620 samples',
        findingId: 'MODEL-001',
      },
    ],
  },
];

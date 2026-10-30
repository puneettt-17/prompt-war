// =============================================================================
// ASTRA-GRID — AI + Mathematical Engine
// Complete deterministic scoring, duplicate detection, causal clustering,
// Shapley comparison, plausibility checking, and optional Gemini integration.
// =============================================================================

import type {
  CivicReport,
  HazardDomain,
  GeoCoord,
  VulnerableLandmark,
  TrustTag,
} from './seedData';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000;

// ---------------------------------------------------------------------------
// 1. Haversine Distance
// ---------------------------------------------------------------------------

/**
 * Standard haversine formula returning distance in meters (1-decimal precision).
 */
export function haversineMeters(a: GeoCoord, b: GeoCoord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfLng * sinHalfLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(EARTH_RADIUS_M * c * 10) / 10;
}

// ---------------------------------------------------------------------------
// 2. Civic Synonym Map & TF-IDF Cosine Similarity
// ---------------------------------------------------------------------------

const CIVIC_SYNONYMS: Record<string, string[]> = {
  pothole: [
    'pothole', 'crater', 'gaddha', 'gundi', 'ಗುಂಡಿ',
    'cave-in', 'asphalt', 'road damage', 'raste', 'road',
  ],
  electrical: [
    'wire', 'cable', 'current', 'kambha', 'mescom', 'bescom',
    'sparking', 'spark', 'sparks', 'shock', 'transformer', 'feeder',
    'ಕರೆಂಟ್', 'ವೈರ್', 'ತುಂಡಾಗಿ', 'bijli', 'pole', 'electric', 'electricity', 'cut',
  ],
  drainage: [
    'drain', 'culvert', 'mori', 'manhole', 'sewage', 'waterlogged',
    'flooded', 'ನೀರು', 'paani', 'flooding', 'water logging', 'underpass',
  ],
  waste: [
    'garbage', 'waste', 'kasa', 'trash', 'bin', 'ಕಸ',
    'kachra', 'litter', 'dumped', 'debris',
  ],
  vegetation: [
    'tree', 'branch', 'overgrown', 'fallen', 'vegetation', 'mara', 'ಮರ',
  ],
  safety: [
    'danger', 'dangerous', 'hazard', 'risk', 'unsafe',
    'accident', 'injury', 'broken', 'damaged',
  ],
};

const CIVIC_STOPWORDS = new Set([
  'the', 'and', 'is', 'in', 'at', 'of', 'to', 'a', 'an', 'near', 'on', 'by',
  'very', 'hai', 'ho', 'gaya', 'bahut', 'yaar', 'pls', 'please', 'asap',
  'hathra', 'hatra', 'hathira', 'aagthide', 'agthide', 'saw', 'called', 'no',
]);

/** Lowercase, strip punctuation, split on whitespace, drop empties and stopwords. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0C80-\u0CFF\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !CIVIC_STOPWORDS.has(t));
}

/**
 * Replace each token with its synonym-group key when a match is found.
 */
export function normalizeSynonyms(tokens: string[]): string[] {
  return tokens.map((token) => {
    for (const [groupKey, synonyms] of Object.entries(CIVIC_SYNONYMS)) {
      if (synonyms.includes(token)) return groupKey;
    }
    return token;
  });
}

/**
 * Simple TF vector (count / total). IDF omitted — each doc is independent.
 */
export function computeTfIdfVector(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  const total = tokens.length || 1;
  const tf = new Map<string, number>();
  for (const [term, count] of freq) {
    tf.set(term, count / total);
  }
  return tf;
}

/**
 * Cosine similarity of TF vectors after synonym normalisation. 0.00 – 1.00.
 */
export function computeSemanticSimilarity(textA: string, textB: string): number {
  const tokensA = normalizeSynonyms(tokenize(textA));
  const tokensB = normalizeSynonyms(tokenize(textB));

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const vecA = computeTfIdfVector(tokensA);
  const vecB = computeTfIdfVector(tokensB);

  // Collect union of terms
  const allTerms = new Set<string>([...vecA.keys(), ...vecB.keys()]);

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const term of allTerms) {
    const a = vecA.get(term) ?? 0;
    const b = vecB.get(term) ?? 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;

  return Math.round((dot / denom) * 100) / 100;
}

// ---------------------------------------------------------------------------
// 3. Spatio-Temporal Duplicate Linker
// ---------------------------------------------------------------------------

export interface DuplicateCandidate {
  targetId: string;
  masterId: string;
  distance: number;
  cosineSim: number;
  temporalDecay: number;
  duplicateScore: number;
  domainMatch: boolean;
}

/**
 * Temporal decay: 1 within the same instant, 0 when ≥ 72 h apart.
 */
export function computeTemporalDecay(
  reportedAtA: string,
  reportedAtB: string,
): number {
  const msA = new Date(reportedAtA).getTime();
  const msB = new Date(reportedAtB).getTime();
  const hoursDiff = Math.abs(msA - msB) / (1000 * 60 * 60);
  if (hoursDiff >= 72) return 0;
  return Math.max(0, Math.min(1, 1 - hoursDiff / 72));
}

/**
 * Detect spatial + textual + temporal duplicates of `newReport` among
 * existing non-merged reports within `maxDistanceMeters`.
 */
export function findDuplicates(
  newReport: CivicReport,
  existingReports: CivicReport[],
  maxDistanceMeters: number = 150,
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (const existing of existingReports) {
    // Skip self and already-merged reports
    if (existing.id === newReport.id) continue;
    if (existing.mergedIntoMasterId !== null) continue;

    const distance = haversineMeters(newReport.coords, existing.coords);
    if (distance > maxDistanceMeters) continue;

    const cosineSim = computeSemanticSimilarity(newReport.rawText, existing.rawText);
    const temporalDecay = computeTemporalDecay(newReport.reportedAt, existing.reportedAt);
    const spatialProximity = 1 - distance / maxDistanceMeters;

    const duplicateScore =
      0.55 * cosineSim + 0.30 * spatialProximity + 0.15 * temporalDecay;

    const domainMatch = newReport.category === existing.category;

    if (duplicateScore >= 0.60 && domainMatch) {
      candidates.push({
        targetId: newReport.id,
        masterId: existing.id,
        distance: Math.round(distance * 10) / 10,
        cosineSim,
        temporalDecay: Math.round(temporalDecay * 100) / 100,
        duplicateScore: Math.round(duplicateScore * 100) / 100,
        domainMatch,
      });
    }
  }

  return candidates.sort((a, b) => b.duplicateScore - a.duplicateScore);
}

// ---------------------------------------------------------------------------
// 4. Safety Score Calculator
// ---------------------------------------------------------------------------

/**
 * Compute a 0–100 safety score based on hazard domain + keyword analysis.
 */
export function computeSafetyScore(report: CivicReport): number {
  const txt = report.rawText.toLowerCase();
  let score = 50; // default

  switch (report.category) {
    case 'Electrical':
      if (/sparking|shock|live|wire/.test(txt)) {
        score = 95;
      } else {
        score = 80;
      }
      break;

    case 'Water_Drainage':
      if (/flood|submerged|waterlogged/.test(txt)) {
        score = 75;
      } else {
        score = 55;
      }
      break;

    case 'Roads':
      if (/crater|pothole/.test(txt) && /bike|vehicle|skid/.test(txt)) {
        score = 70;
      } else {
        score = 55;
      }
      break;

    case 'Sanitation':
      if (/manhole|open|uncovered/.test(txt)) {
        score = 75;
      } else {
        score = 55;
      }
      break;

    case 'Public_Safety':
      score = 60;
      break;

    case 'Solid_Waste':
      score = 30;
      break;

    case 'Vegetation':
      score = 40;
      break;

    default:
      score = 50;
      break;
  }

  // Urgency bonus
  if (/urgent|emergency|danger|asap|immediately/i.test(report.rawText)) {
    score += 10;
  }

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// 5. Landmark Proximity Score
// ---------------------------------------------------------------------------

export function computeLandmarkProximityScore(
  report: CivicReport,
  landmarks: VulnerableLandmark[],
): { score: number; nearest: { id: string; distanceMeters: number } | null } {
  if (landmarks.length === 0) return { score: 0, nearest: null };

  let nearestId = '';
  let nearestDist = Infinity;

  for (const lm of landmarks) {
    const d = haversineMeters(report.coords, lm.coords);
    if (d < nearestDist) {
      nearestDist = d;
      nearestId = lm.id;
    }
  }

  if (nearestDist > 500) {
    return { score: 0, nearest: { id: nearestId, distanceMeters: Math.round(nearestDist * 10) / 10 } };
  }

  // Find the landmark to get its weight
  const nearestLandmark = landmarks.find((l) => l.id === nearestId)!;
  const rawScore = Math.max(0, 100 - nearestDist / 5) * nearestLandmark.vulnerabilityWeight;
  const score = Math.round(rawScore * 100) / 100;

  return {
    score,
    nearest: { id: nearestId, distanceMeters: Math.round(nearestDist * 10) / 10 },
  };
}

// ---------------------------------------------------------------------------
// 6. Corroboration Volume Score
// ---------------------------------------------------------------------------

export function computeVolumeScore(reportVolumeCount: number): number {
  if (reportVolumeCount <= 1) return 15;
  if (reportVolumeCount === 2) return 35;
  if (reportVolumeCount === 3) return 55;
  if (reportVolumeCount <= 5) return 70;
  return 85; // 6+
}

// ---------------------------------------------------------------------------
// 7. Cascade Score
// ---------------------------------------------------------------------------

/**
 * Map of domain → its directly related (downstream / upstream) domains.
 */
const DOMAIN_CHAIN_MAP: Record<string, string[]> = {
  Solid_Waste: ['Water_Drainage', 'Roads'],
  Water_Drainage: ['Roads', 'Electrical'],
  Roads: ['Electrical', 'Water_Drainage'],
  Electrical: ['Roads', 'Water_Drainage'],
  Sanitation: ['Water_Drainage', 'Public_Safety'],
  Vegetation: ['Electrical', 'Roads'],
  Public_Safety: ['Electrical', 'Roads'],
};

/**
 * Count neighbours within 250 m in *related* (but different) hazard domains.
 */
export function computeCascadeScore(
  report: CivicReport,
  allReports: CivicReport[],
): number {
  const relatedDomains = DOMAIN_CHAIN_MAP[report.category] ?? [];
  let cascadeNeighbours = 0;

  for (const other of allReports) {
    if (other.id === report.id) continue;
    if (other.mergedIntoMasterId !== null) continue;
    if (other.category === report.category) continue;
    if (!relatedDomains.includes(other.category)) continue;

    const dist = haversineMeters(report.coords, other.coords);
    if (dist <= 250) {
      cascadeNeighbours++;
    }
  }

  if (cascadeNeighbours === 0) return 10;
  if (cascadeNeighbours === 1) return 30;
  if (cascadeNeighbours === 2) return 50;
  if (cascadeNeighbours === 3) return 70;
  return 90; // 4+
}

// ---------------------------------------------------------------------------
// 8. Trust Multiplier
// ---------------------------------------------------------------------------

export function getTrustMultiplier(trustTag: TrustTag): number {
  switch (trustTag) {
    case 'Verified_Hazard':
      return 1.15;
    case 'Corroborated':
      return 1.05;
    case 'Standard':
      return 1.0;
    case 'Needs_Verification':
      return 0.75;
    default:
      return 1.0;
  }
}

// ---------------------------------------------------------------------------
// 9. Dynamic Priority Calculator
// ---------------------------------------------------------------------------

export interface PolicyWeights {
  safety: number;
  vulnerability: number;
  volume: number;
  cascade: number;
}

export const POLICY_PRESETS: Record<string, PolicyWeights> = {
  standard: { safety: 0.35, vulnerability: 0.25, volume: 0.20, cascade: 0.20 },
  monsoon: { safety: 0.35, vulnerability: 0.15, volume: 0.05, cascade: 0.45 },
  school_hospital: { safety: 0.35, vulnerability: 0.45, volume: 0.10, cascade: 0.10 },
};

export interface PriorityBreakdown {
  safetyScore: number;
  safetyWeighted: number;
  landmarkScore: number;
  landmarkWeighted: number;
  volumeScore: number;
  volumeWeighted: number;
  cascadeScore: number;
  cascadeWeighted: number;
  rawPriority: number;
  trustMultiplier: number;
  finalPriority: number;
}

export function computePriority(
  report: CivicReport,
  allReports: CivicReport[],
  landmarks: VulnerableLandmark[],
  weights: PolicyWeights,
): PriorityBreakdown {
  const safetyScore = computeSafetyScore(report);
  const { score: landmarkScore } = computeLandmarkProximityScore(report, landmarks);
  const volumeScore = computeVolumeScore(report.reportVolumeCount);
  const cascadeScore = computeCascadeScore(report, allReports);

  const safetyWeighted = Math.round(safetyScore * weights.safety * 100) / 100;
  const landmarkWeighted = Math.round(landmarkScore * weights.vulnerability * 100) / 100;
  const volumeWeighted = Math.round(volumeScore * weights.volume * 100) / 100;
  const cascadeWeighted = Math.round(cascadeScore * weights.cascade * 100) / 100;

  const rawPriority =
    Math.round((safetyWeighted + landmarkWeighted + volumeWeighted + cascadeWeighted) * 100) / 100;

  const trustMultiplier = getTrustMultiplier(report.trustTag);
  const finalPriority = Math.min(
    100,
    Math.round(rawPriority * trustMultiplier * 100) / 100,
  );

  return {
    safetyScore,
    safetyWeighted,
    landmarkScore,
    landmarkWeighted,
    volumeScore,
    volumeWeighted,
    cascadeScore,
    cascadeWeighted,
    rawPriority,
    trustMultiplier,
    finalPriority,
  };
}

// ---------------------------------------------------------------------------
// 10. Escalation Forecast
// ---------------------------------------------------------------------------

export interface EscalationForecast {
  escalation24hScore: number;
  costOfDelayText: string;
}

export function computeEscalation(
  report: CivicReport,
  priority: PriorityBreakdown,
): EscalationForecast {
  const txt = report.rawText.toLowerCase();
  let bump = 5;
  let costText =
    'Gradual deterioration. ₹15K additional remediation cost per 24h.';

  if (report.category === 'Electrical' && /sparking/.test(txt)) {
    bump = 15;
    costText =
      'Risk of electrocution within 6-12 hours. Immediate isolation required.';
  } else if (report.category === 'Water_Drainage' && /flood/.test(txt)) {
    bump = 10;
    costText =
      'Flooding expands ~40m per hour during rain. ₹1.2L incremental road damage per 12h delay.';
  } else if (report.category === 'Roads' && /crater/.test(txt)) {
    bump = 8;
    costText =
      'Each 12h delay → ~3 additional vehicle damage incidents. ₹45K per incident.';
  } else if (report.category === 'Sanitation' && /manhole/.test(txt)) {
    bump = 12;
    costText =
      'Open manhole near pedestrian area. Fall-injury liability escalates after 8h.';
  }

  const escalation24hScore = Math.min(100, priority.finalPriority + bump);

  return { escalation24hScore, costOfDelayText: costText };
}

// ---------------------------------------------------------------------------
// 11. Causal Cluster Builder
// ---------------------------------------------------------------------------

export interface CausalNode {
  reportId: string;
  category: HazardDomain;
  label: string;
  hoursAgo: number;
}

export interface CausalCluster {
  clusterId: string;
  rootNode: CausalNode;
  nodes: CausalNode[];
  edges: { from: string; to: string; label: string }[];
  crewRoiText: string;
  actionBrief: string;
  affectedReportCount: number;
  estimatedSavings: string;
}

/**
 * Causal ordering index — lower = more upstream / root-cause.
 */
const DOMAIN_CAUSAL_ORDER: Record<string, number> = {
  Solid_Waste: 0,
  Water_Drainage: 1,
  Roads: 2,
  Electrical: 3,
  Sanitation: 1,
  Vegetation: 0,
  Public_Safety: 4,
};

/** Estimated per-report remediation cost for crew ROI text. */
const DOMAIN_COST: Record<string, number> = {
  Solid_Waste: 8_000,
  Water_Drainage: 25_000,
  Roads: 45_000,
  Electrical: 60_000,
  Sanitation: 30_000,
  Vegetation: 12_000,
  Public_Safety: 20_000,
};

/**
 * Build causal clusters from spatially and categorically related reports.
 *
 * Algorithm:
 * 1. Find connected components of non-merged reports within 250 m.
 * 2. Keep only components with ≥ 3 members.
 * 3. Sort members by reportedAt (oldest first).
 * 4. Build directed edges following DOMAIN_CAUSAL_ORDER.
 */
export function buildCausalClusters(reports: CivicReport[]): CausalCluster[] {
  const active = reports.filter((r) => r.mergedIntoMasterId === null);
  const visited = new Set<string>();
  const components: CivicReport[][] = [];

  // BFS to find connected components within 250 m
  for (const report of active) {
    if (visited.has(report.id)) continue;
    const queue: CivicReport[] = [report];
    const component: CivicReport[] = [];
    visited.add(report.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      for (const other of active) {
        if (visited.has(other.id)) continue;
        const dist = haversineMeters(current.coords, other.coords);
        if (dist <= 250) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }

    if (component.length >= 3) {
      components.push(component);
    }
  }

  const now = 1793354400000;

  return components.map((comp, idx) => {
    // Sort by reportedAt ascending (oldest first = most likely root cause)
    comp.sort(
      (a, b) =>
        new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime(),
    );

    const nodes: CausalNode[] = comp.map((r) => ({
      reportId: r.id,
      category: r.category,
      label: r.rawText.slice(0, 60),
      hoursAgo: Math.round(
        (now - new Date(r.reportedAt).getTime()) / (1000 * 60 * 60),
      ),
    }));

    // Sort nodes by causal order to determine root
    const sortedByCausal = [...nodes].sort(
      (a, b) =>
        (DOMAIN_CAUSAL_ORDER[a.category] ?? 99) -
        (DOMAIN_CAUSAL_ORDER[b.category] ?? 99),
    );

    const rootNode = sortedByCausal[0];

    // Build edges: from upstream → downstream following domain causal order
    const edges: { from: string; to: string; label: string }[] = [];
    const nodeByCausal = [...nodes].sort(
      (a, b) =>
        (DOMAIN_CAUSAL_ORDER[a.category] ?? 99) -
        (DOMAIN_CAUSAL_ORDER[b.category] ?? 99),
    );

    for (let i = 0; i < nodeByCausal.length - 1; i++) {
      const from = nodeByCausal[i];
      const to = nodeByCausal[i + 1];
      const edgeLabel = generateEdgeLabel(from.category, to.category);
      edges.push({
        from: from.reportId,
        to: to.reportId,
        label: edgeLabel,
      });
    }

    const downstreamCount = nodes.length - 1;
    const totalSavings = comp.reduce(
      (sum, r) => sum + (DOMAIN_COST[r.category] ?? 20_000),
      0,
    );

    const crewRoiText = `Resolving ${rootNode.reportId} (${rootNode.category}) neutralizes ${downstreamCount} downstream complaints and prevents ₹${(totalSavings / 1000).toFixed(0)}K in repeat remediation.`;

    const actionBrief = generateActionBrief(comp, rootNode);

    return {
      clusterId: `CL-${String(idx + 1).padStart(3, '0')}`,
      rootNode,
      nodes,
      edges,
      crewRoiText,
      actionBrief,
      affectedReportCount: nodes.length,
      estimatedSavings: `₹${(totalSavings / 1000).toFixed(0)}K`,
    };
  });
}

/** Generate a human-readable edge label for the causal chain. */
function generateEdgeLabel(from: HazardDomain, to: HazardDomain): string {
  const pairs: Record<string, string> = {
    'Solid_Waste→Water_Drainage': 'Debris blocks drains',
    'Water_Drainage→Roads': 'Water seepage erodes surface',
    'Roads→Electrical': 'Road collapse exposes cables',
    'Solid_Waste→Roads': 'Waste decomposition weakens base',
    'Water_Drainage→Electrical': 'Water contact causes shorts',
    'Vegetation→Electrical': 'Branch contact with power line',
    'Vegetation→Roads': 'Root damage to road surface',
    'Sanitation→Water_Drainage': 'Sewage overflow into drains',
    'Sanitation→Public_Safety': 'Health hazard exposure',
  };

  return pairs[`${from}→${to}`] ?? `${from} impacts ${to}`;
}

/** Generate a deterministic 3-5 step action brief for a cluster. */
function generateActionBrief(
  reports: CivicReport[],
  rootNode: CausalNode,
): string {
  const categories = [...new Set(reports.map((r) => r.category))];
  const steps: string[] = [];

  steps.push(
    `STEP 1: Deploy crew to ${rootNode.reportId} location. Address root-cause ${rootNode.category.replace(/_/g, ' ')} issue first.`,
  );

  if (categories.includes('Electrical')) {
    steps.push(
      '2. Isolate electrical supply in affected zone before any ground work.',
    );
  }

  if (categories.includes('Water_Drainage')) {
    steps.push(
      `${steps.length + 1}. Clear drainage blockages and pump standing water to restore flow.`,
    );
  }

  if (categories.includes('Roads')) {
    steps.push(
      `${steps.length + 1}. Patch road surface damage and install temporary barricades.`,
    );
  }

  if (categories.includes('Solid_Waste')) {
    steps.push(
      `${steps.length + 1}. Remove solid waste accumulation from drains and road shoulders.`,
    );
  }

  if (categories.includes('Sanitation')) {
    steps.push(
      `${steps.length + 1}. Secure open manholes with covers and apply disinfectant to overflow areas.`,
    );
  }

  if (categories.includes('Vegetation')) {
    steps.push(
      `${steps.length + 1}. Trim or remove fallen vegetation blocking roads or power lines.`,
    );
  }

  // Ensure at least 3 steps
  if (steps.length < 3) {
    steps.push(
      `${steps.length + 1}. Photograph completed repairs and update all ${reports.length} linked tickets as resolved.`,
    );
  }

  // Final step
  steps.push(
    `${steps.length + 1}. Verify all ${reports.length} linked complaints resolved and close cluster.`,
  );

  return steps.join('\n');
}

// ---------------------------------------------------------------------------
// 12. Pairwise Shapley Comparator
// ---------------------------------------------------------------------------

export interface ShapleyComparison {
  reportA: string;
  reportB: string;
  deltas: {
    factor: string;
    scoreA: number;
    scoreB: number;
    delta: number;
    explanation: string;
  }[];
  netDelta: number;
  verdict: string;
}

export function compareReports(
  reportA: CivicReport,
  reportB: CivicReport,
  allReports: CivicReport[],
  landmarks: VulnerableLandmark[],
  weights: PolicyWeights,
): ShapleyComparison {
  const prioA = computePriority(reportA, allReports, landmarks, weights);
  const prioB = computePriority(reportB, allReports, landmarks, weights);

  const deltas: ShapleyComparison['deltas'] = [];

  // Safety factor
  const safetyDelta = Math.round((prioA.safetyWeighted - prioB.safetyWeighted) * 100) / 100;
  deltas.push({
    factor: 'Life Safety',
    scoreA: prioA.safetyWeighted,
    scoreB: prioB.safetyWeighted,
    delta: safetyDelta,
    explanation: generateSafetyExplanation(reportA, reportB, safetyDelta),
  });

  // Vulnerability / Proximity factor
  const vulnDelta = Math.round((prioA.landmarkWeighted - prioB.landmarkWeighted) * 100) / 100;
  deltas.push({
    factor: 'Vulnerability/Proximity',
    scoreA: prioA.landmarkWeighted,
    scoreB: prioB.landmarkWeighted,
    delta: vulnDelta,
    explanation: generateProximityExplanation(reportA, reportB, landmarks, vulnDelta),
  });

  // Volume factor
  const volDelta = Math.round((prioA.volumeWeighted - prioB.volumeWeighted) * 100) / 100;
  deltas.push({
    factor: 'Report Volume',
    scoreA: prioA.volumeWeighted,
    scoreB: prioB.volumeWeighted,
    delta: volDelta,
    explanation: `${volDelta >= 0 ? '+' : ''}${volDelta} pts Report Volume: ${reportA.reportVolumeCount} corroboration(s) vs ${reportB.reportVolumeCount} corroboration(s)`,
  });

  // Cascade factor
  const cascDelta = Math.round((prioA.cascadeWeighted - prioB.cascadeWeighted) * 100) / 100;
  deltas.push({
    factor: 'Cascade Risk',
    scoreA: prioA.cascadeWeighted,
    scoreB: prioB.cascadeWeighted,
    delta: cascDelta,
    explanation: `${cascDelta >= 0 ? '+' : ''}${cascDelta} pts Cascade Risk: ${reportA.id} cascade score ${prioA.cascadeScore} vs ${reportB.id} cascade score ${prioB.cascadeScore}`,
  });

  const netDelta =
    Math.round((prioA.finalPriority - prioB.finalPriority) * 100) / 100;

  const winner = netDelta >= 0 ? reportA : reportB;
  const loser = netDelta >= 0 ? reportB : reportA;
  const absDelta = Math.abs(netDelta);

  const highestFactor = [...deltas].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  )[0];

  const verdict = `${winner.id} outranks ${loser.id} by +${absDelta.toFixed(0)} points. The primary differentiator is ${highestFactor.factor} (${highestFactor.delta >= 0 ? '+' : ''}${highestFactor.delta.toFixed(1)} pts). ${winner.category.replace(/_/g, ' ')} hazard at ${winner.id} presents a ${absDelta > 30 ? 'significantly' : 'moderately'} higher risk profile.`;

  return {
    reportA: reportA.id,
    reportB: reportB.id,
    deltas,
    netDelta,
    verdict,
  };
}

function generateSafetyExplanation(
  a: CivicReport,
  b: CivicReport,
  delta: number,
): string {
  const aDesc = `${a.category.replace(/_/g, ' ')} hazard`;
  const bDesc = `${b.category.replace(/_/g, ' ')} complaint`;
  return `${delta >= 0 ? '+' : ''}${delta} pts Life Safety: ${aDesc} vs ${bDesc}`;
}

function generateProximityExplanation(
  a: CivicReport,
  b: CivicReport,
  landmarks: VulnerableLandmark[],
  delta: number,
): string {
  const nearA = computeLandmarkProximityScore(a, landmarks);
  const nearB = computeLandmarkProximityScore(b, landmarks);

  const distAText = nearA.nearest
    ? `${nearA.nearest.distanceMeters}m from nearest landmark`
    : 'no nearby landmark';
  const distBText = nearB.nearest
    ? `${nearB.nearest.distanceMeters}m from nearest landmark`
    : 'no nearby landmark';

  return `${delta >= 0 ? '+' : ''}${delta} pts Proximity: ${a.id} ${distAText} vs ${b.id} ${distBText}`;
}

// ---------------------------------------------------------------------------
// 13. Adversarial Plausibility Check
// ---------------------------------------------------------------------------

export interface PlausibilityResult {
  isPlausible: boolean;
  trustTag: TrustTag;
  multiplier: number;
  flags: string[];
  explanation: string;
}

const HYPERBOLE_PATTERNS: RegExp[] = [
  /\b\d{3,}\s*(feet|ft|meter|metre|m|vehicle|car|bike|people|person)/i,
  /\b100\s*feet/i,
  /\b500\s*vehicles/i,
  /\b1000\b/i,
  /entire\s+road\s+collapsed/i,
  /massive\s+sinkhole/i,
];

export function checkPlausibility(
  report: CivicReport,
  nearbyReports: CivicReport[],
): PlausibilityResult {
  const flags: string[] = [];
  const txt = report.rawText;
  const hasPhoto = !!report.photoUrl;

  // 1. Hyperbole check
  const hasHyperbole = HYPERBOLE_PATTERNS.some((p) => p.test(txt));
  if (hasHyperbole && !hasPhoto && report.reportVolumeCount === 1) {
    flags.push('Uncorroborated extreme claim');
  }

  // 2. ALL CAPS ratio
  const alphaChars = txt.replace(/[^a-zA-Z]/g, '');
  if (alphaChars.length > 0) {
    const upperRatio =
      alphaChars.replace(/[^A-Z]/g, '').length / alphaChars.length;
    if (upperRatio > 0.6) {
      flags.push('Excessive urgency formatting');
    }
  }

  // 3. No photo + high severity keywords
  const severityKeywords =
    /sparking|electrocution|collapse|sinkhole|flood|submerged|dangerous|fatal/i;
  if (!hasPhoto && severityKeywords.test(txt)) {
    flags.push('No visual evidence for severe claim');
  }

  // 4. Nearby corroboration check (within 200 m, last 6 h)
  const reportTime = new Date(report.reportedAt).getTime();
  const sixHoursMs = 6 * 60 * 60 * 1000;
  const corroborating = nearbyReports.filter((other) => {
    if (other.id === report.id) return false;
    if (other.mergedIntoMasterId !== null) return false;
    const dist = haversineMeters(report.coords, other.coords);
    if (dist > 200) return false;
    const otherTime = new Date(other.reportedAt).getTime();
    if (Math.abs(reportTime - otherTime) > sixHoursMs) return false;
    return other.category === report.category;
  });

  const hasCorroboration = corroborating.length > 0;

  // 5. Determine trust tag
  let trustTag: TrustTag = 'Standard';
  let multiplier = 1.0;

  if (hasPhoto) {
    trustTag = 'Verified_Hazard';
    multiplier = 1.15;
  } else if (hasCorroboration) {
    trustTag = 'Corroborated';
    multiplier = 1.05;
  } else if (flags.includes('Uncorroborated extreme claim')) {
    trustTag = 'Needs_Verification';
    multiplier = 0.75;
  }

  const isPlausible = trustTag !== 'Needs_Verification';

  let explanation: string;
  if (trustTag === 'Verified_Hazard') {
    explanation = `Report verified: photo evidence present and ${corroborating.length} nearby report(s) corroborate the claim within 200m/6h.`;
  } else if (trustTag === 'Corroborated') {
    explanation = `Report corroborated by ${corroborating.length} nearby report(s) within 200m/6h. No photo evidence.`;
  } else if (trustTag === 'Needs_Verification') {
    explanation = `Report flagged for verification: ${flags.join('; ')}. No corroboration found within 200m/6h.`;
  } else {
    explanation =
      flags.length > 0
        ? `Standard report with minor flags: ${flags.join('; ')}.`
        : 'Standard report. No anomalies detected.';
  }

  return {
    isPlausible,
    trustTag,
    multiplier,
    flags,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// 14. Gemini API Integration
// ---------------------------------------------------------------------------

/**
 * Call Gemini for a short summary and category suggestion.
 * Falls back deterministically when no API key is provided.
 */
export async function callGeminiForSummary(
  rawText: string,
  category: HazardDomain,
  apiKey: string | null,
): Promise<{ summary: string; suggestedCategory: HazardDomain }> {
  // Deterministic fallback
  if (!apiKey) {
    const words = rawText.split(/\s+/).slice(0, 15).join(' ');
    return {
      summary: words + (rawText.split(/\s+/).length > 15 ? '...' : ''),
      suggestedCategory: category,
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an Indian civic infrastructure analyst. Given this citizen complaint, produce a JSON object with exactly two keys:
1. "summary": a concise 15-word-max summary of the hazard.
2. "suggestedCategory": one of Electrical, Water_Drainage, Roads, Sanitation, Solid_Waste, Vegetation, Public_Safety.

Complaint: "${rawText}"
Current category: ${category}

Respond ONLY with valid JSON. No markdown, no explanation.`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extract JSON from response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');

    const parsed = JSON.parse(jsonMatch[0]);
    const validDomains: HazardDomain[] = [
      'Electrical',
      'Water_Drainage',
      'Roads',
      'Sanitation',
      'Solid_Waste',
      'Vegetation',
      'Public_Safety',
    ];

    return {
      summary:
        typeof parsed.summary === 'string'
          ? parsed.summary.slice(0, 120)
          : rawText.split(/\s+/).slice(0, 15).join(' ') + '...',
      suggestedCategory: validDomains.includes(parsed.suggestedCategory)
        ? parsed.suggestedCategory
        : category,
    };
  } catch {
    // Fallback on any error
    const words = rawText.split(/\s+/).slice(0, 15).join(' ');
    return {
      summary: words + (rawText.split(/\s+/).length > 15 ? '...' : ''),
      suggestedCategory: category,
    };
  }
}

/**
 * Call Gemini for an enhanced action brief for a causal cluster.
 * Falls back to the pre-built actionBrief when no key is provided.
 */
export async function callGeminiForActionBrief(
  cluster: CausalCluster,
  apiKey: string | null,
): Promise<string> {
  if (!apiKey) {
    return cluster.actionBrief;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const nodeDescriptions = cluster.nodes
    .map(
      (n) =>
        `- ${n.reportId} (${n.category}): "${n.label}" reported ${n.hoursAgo}h ago`,
    )
    .join('\n');

  const prompt = `You are an Indian municipal operations expert. A causal cluster of ${cluster.affectedReportCount} related civic complaints has been identified:

Root cause: ${cluster.rootNode.reportId} (${cluster.rootNode.category})
Nodes:
${nodeDescriptions}

Causal chain edges:
${cluster.edges.map((e) => `${e.from} → ${e.to}: ${e.label}`).join('\n')}

Write a 3-5 step sequenced dispatch plan for a single crew to resolve all complaints efficiently, starting from the root cause. Be specific about Indian municipal operations (BBMP, MESCOM, etc.). Keep each step to 1-2 sentences.`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return text.trim() || cluster.actionBrief;
  } catch {
    return cluster.actionBrief;
  }
}

// ---------------------------------------------------------------------------
// 15. Full Pipeline Runner
// ---------------------------------------------------------------------------

/**
 * Run the complete scoring pipeline on all reports and return them
 * sorted by finalPriority descending.
 */
export function runFullPipeline(
  reports: CivicReport[],
  landmarks: VulnerableLandmark[],
  weights: PolicyWeights,
): CivicReport[] {
  return reports
    .map((report) => {
      // 1. Plausibility check
      const plausibility = checkPlausibility(report, reports);

      // Apply trust tag from plausibility
      const updatedReport: CivicReport = {
        ...report,
        trustTag: plausibility.trustTag,
      };

      // 2. Nearest landmark
      const { nearest } = computeLandmarkProximityScore(updatedReport, landmarks);

      // 3. Compute all sub-scores
      const safetyScore = computeSafetyScore(updatedReport);
      const volumeScore = computeVolumeScore(updatedReport.reportVolumeCount);
      const cascadeScore = computeCascadeScore(updatedReport, reports);

      // 4. Compute final priority
      const priority = computePriority(
        updatedReport,
        reports,
        landmarks,
        weights,
      );

      // 5. Compute escalation
      const escalation = computeEscalation(updatedReport, priority);

      // 6. Assemble updated report
      return {
        ...updatedReport,
        priorityScore: priority.finalPriority,
        escalation24hScore: escalation.escalation24hScore,
        costOfDelayText: escalation.costOfDelayText,
        nearestLandmark: nearest ? { id: nearest.id, distanceMeters: nearest.distanceMeters } : updatedReport.nearestLandmark,
      };
    })
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
}

// =============================================================================
// ASTRA-GRID Automated Test Suite
// Rigorous verification of mathematical formulas, NLP synonyms, causal DAGs,
// and edge-case accessibility logic.
// =============================================================================

import {
  haversineMeters,
  tokenize,
  normalizeSynonyms,
  computeSemanticSimilarity,
  findDuplicates,
  computeSafetyScore,
  computeLandmarkProximityScore,
  computeVolumeScore,
  computeCascadeScore,
  computePriority,
  computeEscalation,
  buildCausalClusters,
  compareReports,
  checkPlausibility,
  POLICY_PRESETS,
} from '../lib/aiEngine';

import {
  VULNERABLE_LANDMARKS,
  generateSeedReports,
  CivicReport,
} from '../lib/seedData';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

console.log('=== ASTRA-GRID ALGORITHM & ACCESSIBILITY TEST RUNNER ===\n');

// 1. HAVERSINE DISTANCE ACCURACY
console.log('[1] Geodesic Haversine Distance:');
const p1 = { lat: 12.8742, lng: 74.8432 }; // KMC Attavar
const p2 = { lat: 12.8744, lng: 74.8428 }; // Nearby manhole
const dist = haversineMeters(p1, p2);
assert(dist > 40 && dist < 70, `Distance between KMC and AST-1016 is ~55m (actual: ${dist}m)`);

const pSame = haversineMeters(p1, p1);
assert(pSame === 0, 'Distance to self is exactly 0m');

// 2. MULTILINGUAL CIVIC SYNONYM TF-IDF COSINE SIMILARITY
console.log('\n[2] Multilingual Semantic Similarity:');
const engText = 'Overhead electric wire snapped and sparking continuously';
const kanText = 'ಕರೆಂಟ್ ವೈರ್ ತುಂಡಾಗಿ spark ಆಗ್ತಿದೆ Jyothi circle';
const hingText = 'Current wire cut ho gaya near school, danger hai';

const simKanEng = computeSemanticSimilarity(engText, kanText);
assert(simKanEng >= 0.50, `Kannada-English electrical wire similarity >= 0.50 (actual: ${simKanEng})`);

const simHingEng = computeSemanticSimilarity(engText, hingText);
assert(simHingEng >= 0.50, `Hinglish-English electrical wire similarity >= 0.50 (actual: ${simHingEng})`);

const unrelatedText = 'Dry leaves and minor paper litter in Kadri park';
const simUnrelated = computeSemanticSimilarity(engText, unrelatedText);
assert(simUnrelated < 0.20, `Unrelated waste vs sparking wire similarity < 0.20 (actual: ${simUnrelated})`);

// 3. SPATIO-TEMPORAL DUPLICATE MERGE
console.log('\n[3] Spatio-Temporal Duplicate Merging:');
const reports = generateSeedReports();
const masterWire = reports.find(r => r.id === 'AST-1010')!;
const candidateWire = reports.find(r => r.id === 'AST-1011')!;
const duplicates = findDuplicates(candidateWire, [masterWire]);

assert(duplicates.length > 0, 'AST-1011 detects AST-1010 as duplicate candidate');
if (duplicates.length > 0) {
  assert(duplicates[0].duplicateScore >= 0.60, `Duplicate score meets 0.60 threshold (actual: ${duplicates[0].duplicateScore})`);
  assert(duplicates[0].domainMatch === true, 'Hazard domains match (Electrical)');
}

// 4. ADVERSARIAL HYPERBOLE & PLAUSIBILITY GUARD
console.log('\n[4] Adversarial Hyperbole & Spam Guard:');
const spamReport = reports.find(r => r.id === 'AST-1018')!;
const plausibilitySpam = checkPlausibility(spamReport, reports);
assert(plausibilitySpam.trustTag === 'Needs_Verification', 'Uncorroborated extreme claim flagged as Needs_Verification');
assert(plausibilitySpam.multiplier === 0.75, 'Spam multiplier dampened to 0.75x');
assert(plausibilitySpam.flags.length > 0, `Flags detected: ${plausibilitySpam.flags.join(', ')}`);

const verifiedReport = reports.find(r => r.id === 'AST-1016')!;
const plausibilityVerified = checkPlausibility(verifiedReport, reports);
assert(plausibilityVerified.trustTag === 'Verified_Hazard', 'Photo-verified report flagged as Verified_Hazard');
assert(plausibilityVerified.multiplier === 1.15, 'Verified multiplier boosted to 1.15x');

// 5. POLICY WEIGHT RE-RANKING DYNAMICS
console.log('\n[5] Dynamic Policy Simulation:');
const reportManhole = reports.find(r => r.id === 'AST-1016')!; // Hospital zone
const reportLitter = reports.find(r => r.id === 'AST-1017')!;  // Minor litter

const stdPriorityManhole = computePriority(reportManhole, reports, VULNERABLE_LANDMARKS, POLICY_PRESETS.standard);
const stdPriorityLitter = computePriority(reportLitter, reports, VULNERABLE_LANDMARKS, POLICY_PRESETS.standard);
assert(stdPriorityManhole.finalPriority > stdPriorityLitter.finalPriority, 'Hospital hazard outranks litter in Standard mode');

const schoolGuardPriority = computePriority(reportManhole, reports, VULNERABLE_LANDMARKS, POLICY_PRESETS.school_hospital);
assert(schoolGuardPriority.finalPriority >= stdPriorityManhole.finalPriority, 'Hospital hazard priority increases or stays elevated in School/Hospital mode');

// 6. PAIRWISE SHAPLEY WATERFALL COMPARATOR
console.log('\n[6] Pairwise Shapley Waterfall Comparator:');
const comparison = compareReports(reportManhole, reportLitter, reports, VULNERABLE_LANDMARKS, POLICY_PRESETS.standard);
assert(comparison.netDelta > 0, `Manhole holds positive priority lead (netDelta: +${comparison.netDelta})`);
assert(comparison.deltas.some(d => d.factor.includes('Safety')), 'Comparator factors include Life Safety delta');
assert(comparison.deltas.some(d => d.factor.includes('Landmark') || d.factor.includes('Vulnerability')), 'Comparator factors include Landmark Proximity delta');
assert(comparison.verdict.length > 20, 'Generates plain-language explainability verdict');

// 7. DIRECTED ROOT-CAUSE CAUSAL DOMINO CLUSTERING
console.log('\n[7] Directed Causal DAG Domino Graph:');
const clusters = buildCausalClusters(reports);
assert(clusters.length >= 1, `Detected ${clusters.length} causal clusters within 250m`);

const monsoonCluster = clusters.find(c => c.affectedReportCount >= 4);
assert(Boolean(monsoonCluster), 'Detected multi-node Monsoon Cascade Cluster');
if (monsoonCluster) {
  assert(monsoonCluster.nodes.length >= 4, `Cluster contains ${monsoonCluster.nodes.length} sequenced nodes`);
  assert(monsoonCluster.edges.length >= 3, `Cluster has ${monsoonCluster.edges.length} directed causal edges`);
  assert(monsoonCluster.crewRoiText.includes('₹'), 'Crew ROI metric includes financial savings estimate');
  assert(monsoonCluster.actionBrief.includes('STEP 1'), 'Action brief provides sequenced dispatch steps');
}

// 8. DATASET COMPLETENESS
console.log('\n[8] Synthetic Dataset Verification:');
assert(reports.length === 42, `Exactly 42 reports generated (actual: ${reports.length})`);
const allHaveCoords = reports.every(r => r.coords && r.coords.lat > 12.8 && r.coords.lng > 74.7);
assert(allHaveCoords, 'All 42 reports have valid Mangaluru geographic coordinates');

console.log('\n=======================================================');
console.log(`TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
console.log('=======================================================\n');

if (failed > 0) {
  process.exit(1);
}

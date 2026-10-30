// =============================================================================
// ASTRA-GRID — Municipal Triage System: Seed Data
// Synthetic dataset for Mangaluru, India civic hazard reports
// =============================================================================

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type ReportStatus = 'Submitted' | 'Triaged' | 'Assigned' | 'In_Progress' | 'Resolved';

export type HazardDomain =
  | 'Electrical'
  | 'Roads'
  | 'Water_Drainage'
  | 'Solid_Waste'
  | 'Sanitation'
  | 'Public_Safety'
  | 'Vegetation';

export type TrustTag = 'Verified_Hazard' | 'Corroborated' | 'Standard' | 'Needs_Verification';

export type Department =
  | 'MESCOM_Electrical'
  | 'MCC_Storm_Water'
  | 'Civil_Roads'
  | 'Solid_Waste_SWM'
  | 'MCC_Health'
  | 'Traffic_Police';

export interface GeoCoord {
  lat: number;
  lng: number;
}

export interface VulnerableLandmark {
  id: string;
  name: string;
  type: 'Hospital' | 'School' | 'Transit_Terminal' | 'Market';
  coords: GeoCoord;
  vulnerabilityWeight: number; // 0.0–1.0
}

export interface CivicReport {
  id: string;                                  // AST-XXXX format
  rawText: string;                             // Original citizen text (multilingual)
  normalizedSummary: string;                   // 15-word AI summary
  category: HazardDomain;
  coords: GeoCoord;
  reportedAt: string;                          // ISO timestamp
  photoUrl: string | null;                     // placeholder path or null
  status: ReportStatus;
  trustTag: TrustTag;
  reportVolumeCount: number;                   // starts at 1, incremented on merge
  mergedIntoMasterId: string | null;           // if merged, the master ticket ID
  assignedDept: Department | null;
  priorityScore: number | null;                // 0–100, computed
  escalation24hScore: number | null;
  costOfDelayText: string | null;
  nearestLandmark: { id: string; distanceMeters: number } | null;
  clusterId: string | null;                    // causal cluster ID
  citizenName: string;                         // synthetic name
  citizenPhone: string;                        // masked: 98XXX-XXXX3 format
  fieldNotes: string | null;
}

// ---------------------------------------------------------------------------
// Vulnerable Landmarks — 8 real Mangaluru locations
// ---------------------------------------------------------------------------

export const VULNERABLE_LANDMARKS: VulnerableLandmark[] = [
  {
    id: 'LM-01',
    name: 'KMC Hospital (Attavar)',
    type: 'Hospital',
    coords: { lat: 12.8742, lng: 74.8432 },
    vulnerabilityWeight: 1.0,
  },
  {
    id: 'LM-02',
    name: 'Father Muller Hospital',
    type: 'Hospital',
    coords: { lat: 12.8803, lng: 74.8534 },
    vulnerabilityWeight: 1.0,
  },
  {
    id: 'LM-03',
    name: 'St. Aloysius College & School',
    type: 'School',
    coords: { lat: 12.8658, lng: 74.8425 },
    vulnerabilityWeight: 0.95,
  },
  {
    id: 'LM-04',
    name: 'Canara High School (Dongerkery)',
    type: 'School',
    coords: { lat: 12.8681, lng: 74.8451 },
    vulnerabilityWeight: 0.9,
  },
  {
    id: 'LM-05',
    name: 'KSRTC Mangaluru Central Bus Stand',
    type: 'Transit_Terminal',
    coords: { lat: 12.8695, lng: 74.8435 },
    vulnerabilityWeight: 0.8,
  },
  {
    id: 'LM-06',
    name: 'Hampankatta Market Complex',
    type: 'Market',
    coords: { lat: 12.87, lng: 74.8445 },
    vulnerabilityWeight: 0.65,
  },
  {
    id: 'LM-07',
    name: 'Govt. Lady Goschen Hospital',
    type: 'Hospital',
    coords: { lat: 12.8613, lng: 74.8358 },
    vulnerabilityWeight: 1.0,
  },
  {
    id: 'LM-08',
    name: 'Lourdes Central School (Bejai)',
    type: 'School',
    coords: { lat: 12.8856, lng: 74.8491 },
    vulnerabilityWeight: 0.9,
  },
];

// ---------------------------------------------------------------------------
// Helper: hours ago → ISO string
// ---------------------------------------------------------------------------

const BASE_DEMO_TIME = 1793354400000; // Deterministic benchmark timestamp

function hoursAgo(h: number): string {
  return new Date(BASE_DEMO_TIME - h * 3600000).toISOString();
}

// ---------------------------------------------------------------------------
// Generate All 42 Seed Reports
// ---------------------------------------------------------------------------

export function generateSeedReports(): CivicReport[] {
  return [
    // =========================================================================
    // CLUSTER 1 — Pumpwell–Kankanady Monsoon Cascade (9 reports)
    //   clusterId: 'CLU-MONSOON-01'
    //   Center ≈ lat 12.8915, lng 74.8540 (within 220 m of each other)
    // =========================================================================

    // 1. AST-1001
    {
      id: 'AST-1001',
      rawText:
        'Market waste plastic bags dumped beside storm drain near Pumpwell',
      normalizedSummary:
        'Plastic market waste bags dumped beside storm drain near Pumpwell Circle area.',
      category: 'Solid_Waste',
      coords: { lat: 12.8918, lng: 74.8538 },
      reportedAt: hoursAgo(48),
      photoUrl: '/photos/waste-drain-01.jpg',
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Ravi Shetty',
      citizenPhone: '98450-XXXX1',
      fieldNotes: null,
    },

    // 2. AST-1002
    {
      id: 'AST-1002',
      rawText: 'ಕಸ ರಾಶಿ storm drain ಹತ್ತಿರ fish market waste',
      normalizedSummary:
        'Fish market garbage heap found near storm drain causing blockage at Pumpwell.',
      category: 'Solid_Waste',
      coords: { lat: 12.8921, lng: 74.8541 },
      reportedAt: hoursAgo(47),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Suresh Poojary',
      citizenPhone: '97423-XXXX2',
      fieldNotes: null,
    },

    // 3. AST-1003
    {
      id: 'AST-1003',
      rawText:
        'Culvert grating near Pumpwell service road blocked with garbage, water overflowing',
      normalizedSummary:
        'Culvert grating blocked with garbage near Pumpwell service road causing water overflow.',
      category: 'Water_Drainage',
      coords: { lat: 12.8912, lng: 74.8535 },
      reportedAt: hoursAgo(24),
      photoUrl: '/photos/culvert-blocked-01.jpg',
      status: 'Triaged',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: "Fatima D'Souza",
      citizenPhone: '94482-XXXX3',
      fieldNotes: null,
    },

    // 4. AST-1004
    {
      id: 'AST-1004',
      rawText: 'Storm drain mori overflow onto road kankanady side',
      normalizedSummary:
        'Storm drain overflow flooding road on the Kankanady side near Pumpwell area.',
      category: 'Water_Drainage',
      coords: { lat: 12.891, lng: 74.8543 },
      reportedAt: hoursAgo(23),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Mohammed Ashraf',
      citizenPhone: '96323-XXXX4',
      fieldNotes: null,
    },

    // 5. AST-1005 (MASTER for underpass flooding)
    {
      id: 'AST-1005',
      rawText:
        'Pumpwell underpass completely waterlogged knee deep, two-wheelers stranded',
      normalizedSummary:
        'Pumpwell underpass knee-deep waterlogged stranding two-wheelers and blocking vehicular traffic.',
      category: 'Water_Drainage',
      coords: { lat: 12.8916, lng: 74.854 },
      reportedAt: hoursAgo(6),
      photoUrl: '/photos/flood-underpass-01.jpg',
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 3,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Deepak Rao',
      citizenPhone: '98861-XXXX5',
      fieldNotes: null,
    },

    // 6. AST-1006 (merged → AST-1005)
    {
      id: 'AST-1006',
      rawText:
        'Ambulance cannot pass through Pumpwell underpass water logging',
      normalizedSummary:
        'Ambulance unable to pass through Pumpwell underpass due to severe waterlogging.',
      category: 'Water_Drainage',
      coords: { lat: 12.8917, lng: 74.8539 },
      reportedAt: hoursAgo(5.5),
      photoUrl: null,
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: 'AST-1005',
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Priya Nayak',
      citizenPhone: '87623-XXXX6',
      fieldNotes: null,
    },

    // 7. AST-1007 (merged → AST-1005)
    {
      id: 'AST-1007',
      rawText: 'ಪಂಪ್‌ವೆಲ್ underpass ನೀರು ತುಂಬಿದೆ, auto stuck',
      normalizedSummary:
        'Pumpwell underpass flooded with water and auto-rickshaw stuck inside the passage.',
      category: 'Water_Drainage',
      coords: { lat: 12.8914, lng: 74.8537 },
      reportedAt: hoursAgo(5),
      photoUrl: null,
      status: 'Submitted',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: 'AST-1005',
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Ganesh Bhat',
      citizenPhone: '99012-XXXX7',
      fieldNotes: null,
    },

    // 8. AST-1008
    {
      id: 'AST-1008',
      rawText:
        'Deep pothole crater exposed in waterlogged road near Pumpwell, bike skidded',
      normalizedSummary:
        'Deep pothole crater exposed by waterlogging near Pumpwell caused a bike to skid.',
      category: 'Roads',
      coords: { lat: 12.8919, lng: 74.8536 },
      reportedAt: hoursAgo(1),
      photoUrl: '/photos/crater-road-01.jpg',
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Arun Kumar K',
      citizenPhone: '94481-XXXX8',
      fieldNotes: null,
    },

    // 9. AST-1009 — MOST URGENT
    {
      id: 'AST-1009',
      rawText:
        'MESCOM feeder pillar box sparking submerged in flood water near Pumpwell circle',
      normalizedSummary:
        'MESCOM feeder pillar box submerged in floodwater and actively sparking at Pumpwell Circle.',
      category: 'Electrical',
      coords: { lat: 12.8915, lng: 74.8542 },
      reportedAt: hoursAgo(0.5),
      photoUrl: '/photos/sparking-feeder-01.jpg',
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: 98,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: 'CLU-MONSOON-01',
      citizenName: 'Naveen Shettigar',
      citizenPhone: '97425-XXXX9',
      fieldNotes: null,
    },

    // =========================================================================
    // CLUSTER 2 — Jyothi Circle Duplicate Burst (6 reports)
    //   clusterId: 'CLU-WIRE-JYOTHI'
    //   Center ≈ lat 12.8662, lng 74.8430 (within 70 m)
    // =========================================================================

    // 10. AST-1010 (MASTER)
    {
      id: 'AST-1010',
      rawText:
        'Overhead electric wire snapped and sparking continuously near Jyothi Circle, very dangerous for schoolchildren',
      normalizedSummary:
        'Snapped overhead electric wire sparking continuously near Jyothi Circle endangering schoolchildren.',
      category: 'Electrical',
      coords: { lat: 12.8662, lng: 74.843 },
      reportedAt: hoursAgo(3),
      photoUrl: '/photos/wire-spark-01.jpg',
      status: 'Triaged',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 6,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-03', distanceMeters: 55 },
      clusterId: 'CLU-WIRE-JYOTHI',
      citizenName: 'Vinod Kamath',
      citizenPhone: '98452-XXXX0',
      fieldNotes: null,
    },

    // 11. AST-1011 (merged → AST-1010)
    {
      id: 'AST-1011',
      rawText:
        'URGENT!! Sparking wire hanging near school gate at Jyothi circle. Kids in danger!!',
      normalizedSummary:
        'Urgent sparking wire hanging near school gate at Jyothi Circle posing child danger.',
      category: 'Electrical',
      coords: { lat: 12.8664, lng: 74.8432 },
      reportedAt: hoursAgo(2.8),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: 'AST-1010',
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-03', distanceMeters: 70 },
      clusterId: 'CLU-WIRE-JYOTHI',
      citizenName: 'Shobha Pai',
      citizenPhone: '99441-XXXX1',
      fieldNotes: null,
    },

    // 12. AST-1012 (merged → AST-1010)
    {
      id: 'AST-1012',
      rawText:
        'Current wire cut ho gaya near school, bahut danger hai yaar, bacche wapas aa rahe hain',
      normalizedSummary:
        'Hinglish report of snapped current wire near school gate with children returning home.',
      category: 'Electrical',
      coords: { lat: 12.866, lng: 74.8428 },
      reportedAt: hoursAgo(2.5),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: 'AST-1010',
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-03', distanceMeters: 48 },
      clusterId: 'CLU-WIRE-JYOTHI',
      citizenName: 'Rajesh Gupta',
      citizenPhone: '97410-XXXX2',
      fieldNotes: null,
    },

    // 13. AST-1013 (merged → AST-1010)
    {
      id: 'AST-1013',
      rawText:
        'ಕರೆಂಟ್ ವೈರ್ ತುಂಡಾಗಿ spark ಆಗ್ತಿದೆ Jyothi circle school gate ಹತ್ರ',
      normalizedSummary:
        'Kannada report of broken electric wire sparking near Jyothi Circle school gate area.',
      category: 'Electrical',
      coords: { lat: 12.8665, lng: 74.8433 },
      reportedAt: hoursAgo(2.2),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: 'AST-1010',
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-03', distanceMeters: 82 },
      clusterId: 'CLU-WIRE-JYOTHI',
      citizenName: 'Lakshmi Acharya',
      citizenPhone: '94480-XXXX3',
      fieldNotes: null,
    },

    // 14. AST-1014 (merged → AST-1010)
    {
      id: 'AST-1014',
      rawText:
        'Live wire down near jyothi circle. Saw sparks. Called mescom no response',
      normalizedSummary:
        'Live wire down near Jyothi Circle with sparks observed and MESCOM unresponsive.',
      category: 'Electrical',
      coords: { lat: 12.8659, lng: 74.8427 },
      reportedAt: hoursAgo(2),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: 'AST-1010',
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-03', distanceMeters: 40 },
      clusterId: 'CLU-WIRE-JYOTHI',
      citizenName: 'Faisal Khan',
      citizenPhone: '96320-XXXX4',
      fieldNotes: null,
    },

    // 15. AST-1015 (merged → AST-1010)
    {
      id: 'AST-1015',
      rawText:
        'Wire sparking at jyothi circle school area pls fix ASAP',
      normalizedSummary:
        'Wire sparking at Jyothi Circle school area with citizen requesting immediate fix.',
      category: 'Electrical',
      coords: { lat: 12.8663, lng: 74.8431 },
      reportedAt: hoursAgo(1.5),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 1,
      mergedIntoMasterId: 'AST-1010',
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-03', distanceMeters: 60 },
      clusterId: 'CLU-WIRE-JYOTHI',
      citizenName: 'Asha Bhandary',
      citizenPhone: '87620-XXXX5',
      fieldNotes: null,
    },

    // =========================================================================
    // STORYLINE 3 — Pairwise Contrast (2 reports)
    // =========================================================================

    // 16. AST-1016 — High-priority near hospital
    {
      id: 'AST-1016',
      rawText:
        'Uncovered deep drainage manhole on footpath near KMC Hospital emergency entrance, someone will fall in',
      normalizedSummary:
        'Uncovered deep manhole on footpath near KMC Hospital emergency entrance posing fall risk.',
      category: 'Sanitation',
      coords: { lat: 12.8744, lng: 74.8428 },
      reportedAt: hoursAgo(4),
      photoUrl: '/photos/manhole-open-01.jpg',
      status: 'Triaged',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: 93,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-01', distanceMeters: 55 },
      clusterId: null,
      citizenName: 'Dr. Vishwas Shenoy',
      citizenPhone: '98440-XXXX6',
      fieldNotes: null,
    },

    // 17. AST-1017 — Low-priority
    {
      id: 'AST-1017',
      rawText: 'Uncollected dry leaves and minor litter in Kadri Park',
      normalizedSummary:
        'Minor dry leaf litter and uncollected waste in Kadri Park requiring routine cleanup.',
      category: 'Solid_Waste',
      coords: { lat: 12.882, lng: 74.853 },
      reportedAt: hoursAgo(12),
      photoUrl: null,
      status: 'Submitted',
      trustTag: 'Standard',
      reportVolumeCount: 5,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: 46,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Rekha Pinto',
      citizenPhone: '94483-XXXX7',
      fieldNotes: null,
    },

    // =========================================================================
    // STORYLINE 4 — Adversarial Spam (1 report)
    // =========================================================================

    // 18. AST-1018 — Spam / Needs_Verification
    {
      id: 'AST-1018',
      rawText:
        'ENTIRE ROAD COLLAPSED 100 FEET DEEP NEAR BENDOORWELL!!! 500 VEHICLES TRAPPED IN MASSIVE SINKHOLE!!! EMERGENCY!!!',
      normalizedSummary:
        'Unverified exaggerated claim of massive road collapse and sinkhole near Bendoorwell area.',
      category: 'Roads',
      coords: { lat: 12.875, lng: 74.851 },
      reportedAt: hoursAgo(0.33),
      photoUrl: null,
      status: 'Submitted',
      trustTag: 'Needs_Verification',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Anonymous',
      citizenPhone: '00000-XXXX0',
      fieldNotes: null,
    },

    // =========================================================================
    // STORYLINE 5 — 20 Scattered Ward Reports (AST-1019 to AST-1038)
    // =========================================================================

    // 19. AST-1019
    {
      id: 'AST-1019',
      rawText:
        'Broken streetlight near Kottara Chowki bus stop, dark and unsafe at night',
      normalizedSummary:
        'Broken streetlight near Kottara Chowki bus stop making area dark and unsafe.',
      category: 'Electrical',
      coords: { lat: 12.896, lng: 74.856 },
      reportedAt: hoursAgo(36),
      photoUrl: null,
      status: 'Assigned',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'MESCOM_Electrical',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Anand Salian',
      citizenPhone: '98451-XXXX1',
      fieldNotes: null,
    },

    // 20. AST-1020
    {
      id: 'AST-1020',
      rawText:
        'Raste ಗುಂಡಿ very bad pothole near Bendoorwell junction, bikes skidding daily',
      normalizedSummary:
        'Severe pothole near Bendoorwell junction causing daily bike skidding incidents reported.',
      category: 'Roads',
      coords: { lat: 12.8752, lng: 74.8515 },
      reportedAt: hoursAgo(72),
      photoUrl: null,
      status: 'In_Progress',
      trustTag: 'Corroborated',
      reportVolumeCount: 3,
      mergedIntoMasterId: null,
      assignedDept: 'Civil_Roads',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Sachin Shetty',
      citizenPhone: '97420-XXXX2',
      fieldNotes: null,
    },

    // 21. AST-1021
    {
      id: 'AST-1021',
      rawText:
        'Garbage not collected since 3 days in Lalbagh, bad smell',
      normalizedSummary:
        'Garbage uncollected for three days in Lalbagh area producing foul smell for residents.',
      category: 'Solid_Waste',
      coords: { lat: 12.863, lng: 74.84 },
      reportedAt: hoursAgo(60),
      photoUrl: null,
      status: 'Assigned',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'Solid_Waste_SWM',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Meena Suvarna',
      citizenPhone: '94481-XXXX3',
      fieldNotes: null,
    },

    // 22. AST-1022
    {
      id: 'AST-1022',
      rawText:
        'Open drain near Surathkal railway station, mosquito breeding',
      normalizedSummary:
        'Open drain near Surathkal railway station becoming mosquito breeding ground reported.',
      category: 'Sanitation',
      coords: { lat: 12.995, lng: 74.789 },
      reportedAt: hoursAgo(48),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Prasad Kini',
      citizenPhone: '96321-XXXX4',
      fieldNotes: null,
    },

    // 23. AST-1023
    {
      id: 'AST-1023',
      rawText:
        'Tree fallen on compound wall near Bejai church road after last night wind',
      normalizedSummary:
        'Tree fallen on compound wall near Bejai church road due to strong overnight wind.',
      category: 'Vegetation',
      coords: { lat: 12.886, lng: 74.8485 },
      reportedAt: hoursAgo(18),
      photoUrl: '/photos/tree-fall-01.jpg',
      status: 'Triaged',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-08', distanceMeters: 75 },
      clusterId: null,
      citizenName: "George D'Souza",
      citizenPhone: '98862-XXXX5',
      fieldNotes: null,
    },

    // 24. AST-1024
    {
      id: 'AST-1024',
      rawText:
        'Water pipe burst near Kankanady market, road flooded',
      normalizedSummary:
        'Water pipe burst near Kankanady market flooding the road and disrupting traffic flow.',
      category: 'Water_Drainage',
      coords: { lat: 12.889, lng: 74.855 },
      reportedAt: hoursAgo(8),
      photoUrl: '/photos/pipe-burst-01.jpg',
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Hameed Bava',
      citizenPhone: '99013-XXXX6',
      fieldNotes: null,
    },

    // 25. AST-1025
    {
      id: 'AST-1025',
      rawText:
        'Stray cattle on NH near Surathkal, traffic hazard',
      normalizedSummary:
        'Stray cattle on national highway near Surathkal creating a serious traffic hazard.',
      category: 'Public_Safety',
      coords: { lat: 12.992, lng: 74.792 },
      reportedAt: hoursAgo(14),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Rohan Ballal',
      citizenPhone: '87621-XXXX7',
      fieldNotes: null,
    },

    // 26. AST-1026
    {
      id: 'AST-1026',
      rawText:
        'Street light flickering dangerously near Hampankatta post office',
      normalizedSummary:
        'Streetlight flickering dangerously near Hampankatta post office requiring electrical repair work.',
      category: 'Electrical',
      coords: { lat: 12.8698, lng: 74.8442 },
      reportedAt: hoursAgo(40),
      photoUrl: null,
      status: 'Resolved',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'MESCOM_Electrical',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-06', distanceMeters: 40 },
      clusterId: null,
      citizenName: 'Jayashree Shetty',
      citizenPhone: '94484-XXXX8',
      fieldNotes: null,
    },

    // 27. AST-1027
    {
      id: 'AST-1027',
      rawText:
        'Construction debris dumped on footpath near Bendoorwell',
      normalizedSummary:
        'Construction debris illegally dumped on footpath near Bendoorwell obstructing pedestrian movement.',
      category: 'Solid_Waste',
      coords: { lat: 12.8745, lng: 74.8505 },
      reportedAt: hoursAgo(30),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Vijay Poojary',
      citizenPhone: '97424-XXXX9',
      fieldNotes: null,
    },

    // 28. AST-1028
    {
      id: 'AST-1028',
      rawText:
        'Manhola overflowing on MG Road, sewage on road surface',
      normalizedSummary:
        'Manhole overflowing on MG Road with raw sewage spreading onto the road surface.',
      category: 'Sanitation',
      coords: { lat: 12.867, lng: 74.844 },
      reportedAt: hoursAgo(10),
      photoUrl: '/photos/sewage-mg-01.jpg',
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-04', distanceMeters: 155 },
      clusterId: null,
      citizenName: 'Kavitha Rao',
      citizenPhone: '98453-XXXX0',
      fieldNotes: null,
    },

    // 29. AST-1029
    {
      id: 'AST-1029',
      rawText:
        'Speed breaker not painted, vehicles braking suddenly near school zone Dongerkery',
      normalizedSummary:
        'Unpainted speed breaker near Dongerkery school zone causing sudden braking by vehicles.',
      category: 'Roads',
      coords: { lat: 12.8683, lng: 74.8455 },
      reportedAt: hoursAgo(120),
      photoUrl: null,
      status: 'Resolved',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'Civil_Roads',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-04', distanceMeters: 50 },
      clusterId: null,
      citizenName: 'Prakash Nayak',
      citizenPhone: '99442-XXXX1',
      fieldNotes: null,
    },

    // 30. AST-1030
    {
      id: 'AST-1030',
      rawText:
        'Transformer humming very loudly near residential area Kottara',
      normalizedSummary:
        'Transformer humming loudly near Kottara residential area indicating potential electrical fault.',
      category: 'Electrical',
      coords: { lat: 12.8955, lng: 74.8555 },
      reportedAt: hoursAgo(48),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Sunitha Shetty',
      citizenPhone: '96322-XXXX2',
      fieldNotes: null,
    },

    // 31. AST-1031
    {
      id: 'AST-1031',
      rawText:
        'Bus shelter roof damaged, dangerous during rain near Lalbagh',
      normalizedSummary:
        'Damaged bus shelter roof near Lalbagh posing danger to commuters during rainy weather.',
      category: 'Public_Safety',
      coords: { lat: 12.8625, lng: 74.8395 },
      reportedAt: hoursAgo(72),
      photoUrl: null,
      status: 'Assigned',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'Civil_Roads',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Abdul Rehman',
      citizenPhone: '94485-XXXX3',
      fieldNotes: null,
    },

    // 32. AST-1032
    {
      id: 'AST-1032',
      rawText:
        'Waterlogging at Bendoorwell every rain since drainage blocked',
      normalizedSummary:
        'Recurring waterlogging at Bendoorwell during every rain due to blocked drainage system.',
      category: 'Water_Drainage',
      coords: { lat: 12.8755, lng: 74.852 },
      reportedAt: hoursAgo(6),
      photoUrl: null,
      status: 'Submitted',
      trustTag: 'Corroborated',
      reportVolumeCount: 2,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: "Nisha D'Souza",
      citizenPhone: '98863-XXXX4',
      fieldNotes: null,
    },

    // 33. AST-1033
    {
      id: 'AST-1033',
      rawText:
        'Dead animal on road near Surathkal bridge, health hazard',
      normalizedSummary:
        'Dead animal carcass on road near Surathkal bridge posing a public health hazard.',
      category: 'Sanitation',
      coords: { lat: 12.994, lng: 74.791 },
      reportedAt: hoursAgo(15),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Mohan Shetty',
      citizenPhone: '97411-XXXX5',
      fieldNotes: null,
    },

    // 34. AST-1034
    {
      id: 'AST-1034',
      rawText:
        'Playground equipment broken and rusty near Kadri Park, child injury risk',
      normalizedSummary:
        'Broken and rusty playground equipment near Kadri Park posing child injury risk.',
      category: 'Public_Safety',
      coords: { lat: 12.8825, lng: 74.8525 },
      reportedAt: hoursAgo(96),
      photoUrl: null,
      status: 'In_Progress',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'MCC_Health',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Divya Acharya',
      citizenPhone: '87622-XXXX6',
      fieldNotes: null,
    },

    // 35. AST-1035
    {
      id: 'AST-1035',
      rawText:
        'Overgrown vegetation blocking footpath visibility near Hampankatta junction',
      normalizedSummary:
        'Overgrown vegetation blocking footpath visibility near Hampankatta junction creating pedestrian hazard.',
      category: 'Vegetation',
      coords: { lat: 12.8705, lng: 74.8448 },
      reportedAt: hoursAgo(48),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-06', distanceMeters: 62 },
      clusterId: null,
      citizenName: 'Sunil Pai',
      citizenPhone: '99014-XXXX7',
      fieldNotes: null,
    },

    // 36. AST-1036
    {
      id: 'AST-1036',
      rawText:
        'Fire hydrant broken and leaking near Central Bus Stand',
      normalizedSummary:
        'Fire hydrant broken and leaking continuously near Central Bus Stand wasting water supply.',
      category: 'Water_Drainage',
      coords: { lat: 12.8692, lng: 74.843 },
      reportedAt: hoursAgo(20),
      photoUrl: null,
      status: 'Assigned',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'MCC_Storm_Water',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-05', distanceMeters: 60 },
      clusterId: null,
      citizenName: 'Bharath Kumar',
      citizenPhone: '98454-XXXX8',
      fieldNotes: null,
    },

    // 37. AST-1037
    {
      id: 'AST-1037',
      rawText:
        'Illegal banner blocking traffic signal view near Hampankatta',
      normalizedSummary:
        'Illegal banner blocking traffic signal visibility near Hampankatta causing road safety concern.',
      category: 'Public_Safety',
      coords: { lat: 12.8702, lng: 74.845 },
      reportedAt: hoursAgo(24),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-06', distanceMeters: 55 },
      clusterId: null,
      citizenName: 'Padma Shetty',
      citizenPhone: '94486-XXXX9',
      fieldNotes: null,
    },

    // 38. AST-1038
    {
      id: 'AST-1038',
      rawText:
        'Muddy slippery stretch on service road after pipe work, no barricade',
      normalizedSummary:
        'Muddy slippery stretch on service road after pipe work without any safety barricade.',
      category: 'Roads',
      coords: { lat: 12.888, lng: 74.8545 },
      reportedAt: hoursAgo(16),
      photoUrl: null,
      status: 'Submitted',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: null,
      clusterId: null,
      citizenName: 'Raghavendra Kamath',
      citizenPhone: '97425-XXXX0',
      fieldNotes: null,
    },

    // =========================================================================
    // ADDITIONAL REPORTS (AST-1039 to AST-1042)
    // =========================================================================

    // 39. AST-1039
    {
      id: 'AST-1039',
      rawText:
        'Broken footpath tiles near Father Muller Hospital causing elderly people to trip',
      normalizedSummary:
        'Broken footpath tiles near Father Muller Hospital causing elderly pedestrians to trip frequently.',
      category: 'Roads',
      coords: { lat: 12.88, lng: 74.853 },
      reportedAt: hoursAgo(28),
      photoUrl: null,
      status: 'Triaged',
      trustTag: 'Corroborated',
      reportVolumeCount: 2,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-02', distanceMeters: 45 },
      clusterId: null,
      citizenName: 'Christina Pinto',
      citizenPhone: '98864-XXXX1',
      fieldNotes: null,
    },

    // 40. AST-1040
    {
      id: 'AST-1040',
      rawText:
        'Public toilet near market not cleaned, unusable condition',
      normalizedSummary:
        'Public toilet near Hampankatta market in unusable and unsanitary condition needing cleaning.',
      category: 'Sanitation',
      coords: { lat: 12.8695, lng: 74.8438 },
      reportedAt: hoursAgo(32),
      photoUrl: null,
      status: 'Assigned',
      trustTag: 'Standard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: 'MCC_Health',
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-05', distanceMeters: 35 },
      clusterId: null,
      citizenName: 'Ismail Beary',
      citizenPhone: '96324-XXXX2',
      fieldNotes: null,
    },

    // 41. AST-1041
    {
      id: 'AST-1041',
      rawText:
        'Electric pole tilted dangerously near Lalbagh road after truck hit',
      normalizedSummary:
        'Electric pole tilted dangerously near Lalbagh road after being struck by a truck.',
      category: 'Electrical',
      coords: { lat: 12.8635, lng: 74.8405 },
      reportedAt: hoursAgo(7),
      photoUrl: '/photos/pole-tilted-01.jpg',
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-07', distanceMeters: 570 },
      clusterId: null,
      citizenName: 'Ramesh Bhat',
      citizenPhone: '99443-XXXX3',
      fieldNotes: null,
    },

    // 42. AST-1042
    {
      id: 'AST-1042',
      rawText:
        'Drainage cover missing near Bejai playground, children play area',
      normalizedSummary:
        'Drainage cover missing near Bejai playground where children play posing serious fall risk.',
      category: 'Sanitation',
      coords: { lat: 12.8858, lng: 74.8488 },
      reportedAt: hoursAgo(9),
      photoUrl: '/photos/drain-cover-01.jpg',
      status: 'Submitted',
      trustTag: 'Verified_Hazard',
      reportVolumeCount: 1,
      mergedIntoMasterId: null,
      assignedDept: null,
      priorityScore: null,
      escalation24hScore: null,
      costOfDelayText: null,
      nearestLandmark: { id: 'LM-08', distanceMeters: 40 },
      clusterId: null,
      citizenName: 'Sneha Kamath',
      citizenPhone: '94487-XXXX4',
      fieldNotes: null,
    },
  ];
}

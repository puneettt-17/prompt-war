'use client';

// =============================================================================
// ASTRA-GRID — Stage 1: CAPTURE
// Mobile Field Reporter + Live AI X-Ray Pipeline Telemetry
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import {
  checkPlausibility,
  findDuplicates,
  computePriority,
  computeEscalation,
  computeLandmarkProximityScore,
  computeSemanticSimilarity,
  haversineMeters,
  POLICY_PRESETS,
} from '@/lib/aiEngine';
import {
  CivicReport,
  HazardDomain,
  VULNERABLE_LANDMARKS,
} from '@/lib/seedData';
import {
  Mic,
  MicOff,
  Camera,
  MapPin,
  Send,
  Zap,
  Waves,
  Building2,
  Shield,
  ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Web Speech API type declarations
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: Event) => void) | null;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HAZARD_DOMAINS: HazardDomain[] = [
  'Electrical',
  'Roads',
  'Water_Drainage',
  'Solid_Waste',
  'Sanitation',
  'Public_Safety',
  'Vegetation',
];

const DOMAIN_COLORS: Record<HazardDomain, string> = {
  Electrical: 'bg-amber-500 text-white',
  Roads: 'bg-stone-600 text-white',
  Water_Drainage: 'bg-blue-500 text-white',
  Solid_Waste: 'bg-lime-600 text-white',
  Sanitation: 'bg-purple-500 text-white',
  Public_Safety: 'bg-red-500 text-white',
  Vegetation: 'bg-green-600 text-white',
};

const TRUST_COLORS: Record<string, string> = {
  Verified_Hazard: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  Corroborated: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Standard: 'bg-amber-50 text-amber-700 border-amber-300',
  Needs_Verification: 'bg-red-50 text-red-600 border-red-300',
};

function priorityColor(score: number): string {
  if (score >= 80) return 'text-[#D92D20]'; // Crimson
  if (score >= 60) return 'text-[#D97706]'; // Amber
  if (score >= 40) return 'text-[#FF4F00]'; // Safety Orange
  return 'text-[#059669]'; // Emerald
}

function priorityBgColor(score: number): string {
  if (score >= 80) return 'bg-[#D92D20]';
  if (score >= 60) return 'bg-[#D97706]';
  if (score >= 40) return 'bg-[#FF4F00]';
  return 'bg-[#059669]';
}

// ---------------------------------------------------------------------------
// Telemetry result shape (local to this component)
// ---------------------------------------------------------------------------

interface TelemetryResult {
  id: string;
  category: HazardDomain;
  summary: string;
  trustTag: string;
  nearestLandmark: { name: string; distanceMeters: number } | null;
  duplicateMatch: { id: string; similarity: number; distanceMeters: number } | null;
  priorityBreakdown: {
    safety: number;
    vulnerability: number;
    volume: number;
    cascade: number;
    total: number;
  };
  priorityScore: number;
  escalationText: string;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

interface PresetData {
  icon: string;
  label: string;
  rawText: string;
  category: HazardDomain;
  lat: number;
  lng: number;
  photo: string | null;
}

const PRESETS: PresetData[] = [
  {
    icon: '⚡',
    label: 'Preset A: 7th Multilingual Duplicate (School Wire)',
    rawText:
      'Wire sparking at jyothi circle school area, very dangerous for children walking',
    category: 'Electrical',
    lat: 12.8664,
    lng: 74.8432,
    photo: null,
  },
  {
    icon: '🌊',
    label: 'Preset B: Downstream Road Crater (Pumpwell Flood)',
    rawText:
      'Deep pothole filled with flood water near Pumpwell, my scooter fell into it',
    category: 'Roads',
    lat: 12.8918,
    lng: 74.8542,
    photo: null,
  },
  {
    icon: '🏥',
    label: 'Preset C: Uncovered Manhole near Hospital',
    rawText:
      'Open manhole without cover near KMC Hospital back gate, patients walking on this footpath',
    category: 'Sanitation',
    lat: 12.8743,
    lng: 74.843,
    photo: null,
  },
  {
    icon: '🛡️',
    label: 'Preset D: Exaggerated Spam Claim',
    rawText:
      'ENTIRE HIGHWAY COLLAPSED INTO THE SEA!!! TSUNAMI OF SEWAGE!!! 1000 PEOPLE STRANDED!!!',
    category: 'Public_Safety',
    lat: 12.875,
    lng: 74.85,
    photo: null,
  },
];

// ---------------------------------------------------------------------------
// Next report ID counter (starts after seed max AST-1042)
// ---------------------------------------------------------------------------

let nextIdCounter = 1043;

function nextReportId(): string {
  const id = `AST-${nextIdCounter}`;
  nextIdCounter += 1;
  return id;
}

// ---------------------------------------------------------------------------
// Generate a 15-word summary from raw text
// ---------------------------------------------------------------------------

function generateSummary(rawText: string): string {
  const words = rawText.trim().split(/\s+/);
  if (words.length <= 15) return rawText.trim();
  return words.slice(0, 15).join(' ') + '...';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CaptureView() {
  const { state, dispatch } = useAppState();

  // --- Form state ---
  const [rawText, setRawText] = useState('');
  const [category, setCategory] = useState<HazardDomain>('Electrical');
  const [lat, setLat] = useState(12.87);
  const [lng, setLng] = useState(74.845);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [useMapPin, setUseMapPin] = useState(false);

  // --- Voice state ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // --- Telemetry state ---
  const [telemetry, setTelemetry] = useState<TelemetryResult | null>(null);
  const [telemetryStep, setTelemetryStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- File input ref ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // Voice recognition
  // =========================================================================

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // supports English / Hinglish; Kannada may fall back

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setRawText((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, []);

  // =========================================================================
  // Process a report through the AI pipeline
  // =========================================================================

  const processReport = useCallback(
    (report: CivicReport) => {
      const existingReports = state.reports;
      const weights = state.weights;

      // 1. Plausibility / trust tag
      const plausibility = checkPlausibility(report, existingReports);
      const trustTag = plausibility.trustTag;

      // 2. Nearest landmark
      const landmarkProx = computeLandmarkProximityScore(
        report,
        VULNERABLE_LANDMARKS
      );
      let nearestLandmarkResult: TelemetryResult['nearestLandmark'] = null;
      let landmarkId: string | null = null;
      let landmarkDist = Infinity;

      if (landmarkProx.nearest) {
        landmarkId = landmarkProx.nearest.id;
        landmarkDist = landmarkProx.nearest.distanceMeters;
        const found = VULNERABLE_LANDMARKS.find((l) => l.id === landmarkId);
        nearestLandmarkResult = {
          name: found ? found.name : landmarkId,
          distanceMeters: Math.round(landmarkDist),
        };
      }

      // 3. Duplicate scan — find best cosine-sim match
      let duplicateMatch: TelemetryResult['duplicateMatch'] = null;
      const duplicates = findDuplicates(report, existingReports);
      if (duplicates.length > 0) {
        const best = duplicates[0];
        duplicateMatch = {
          id: best.targetId,
          similarity: parseFloat(best.cosineSim.toFixed(2)),
          distanceMeters: Math.round(best.distance),
        };
      }

      // 4. Priority waterfall
      const priorityBreakdown = computePriority(
        report,
        existingReports,
        VULNERABLE_LANDMARKS,
        weights
      );
      const priorityScore = priorityBreakdown.finalPriority;

      // Build breakdown for UI
      const breakdown = {
        safety: Math.round(priorityBreakdown.safetyWeighted * 100),
        vulnerability: Math.round(priorityBreakdown.landmarkWeighted * 100),
        volume: Math.round(priorityBreakdown.volumeWeighted * 100),
        cascade: Math.round(priorityBreakdown.cascadeWeighted * 100),
        total: priorityScore,
      };

      // 5. Escalation forecast
      const escalation = computeEscalation(report, priorityBreakdown);
      const escalationText = escalation.costOfDelayText;

      // 6. Update the report with computed fields
      const enrichedReport: CivicReport = {
        ...report,
        trustTag,
        priorityScore: Math.round(priorityScore),
        normalizedSummary: generateSummary(report.rawText),
        nearestLandmark: landmarkId
          ? { id: landmarkId, distanceMeters: Math.round(landmarkDist) }
          : null,
        escalation24hScore: escalation.escalation24hScore,
        costOfDelayText: escalationText,
        mergedIntoMasterId: duplicateMatch ? duplicateMatch.id : null,
      };

      // 7. Dispatch to store
      dispatch({ type: 'ADD_REPORT', payload: enrichedReport });

      // 8. Build telemetry
      const result: TelemetryResult = {
        id: report.id,
        category: report.category,
        summary: generateSummary(report.rawText),
        trustTag,
        nearestLandmark: nearestLandmarkResult,
        duplicateMatch,
        priorityBreakdown: breakdown,
        priorityScore: Math.round(priorityScore),
        escalationText,
      };

      return result;
    },
    [state.reports, state.weights, dispatch]
  );

  // =========================================================================
  // Animate telemetry steps
  // =========================================================================

  useEffect(() => {
    if (!isAnimating || !telemetry) return;

    if (telemetryStep >= 9) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      setTelemetryStep((s) => s + 1);
    }, 350);

    return () => clearTimeout(timer);
  }, [isAnimating, telemetryStep, telemetry]);

  // =========================================================================
  // Submit handler
  // =========================================================================

  const handleSubmit = useCallback(
    (overrideText?: string, overrideCategory?: HazardDomain, overrideLat?: number, overrideLng?: number, overridePhoto?: string | null) => {
      const text = overrideText ?? rawText;
      const cat = overrideCategory ?? category;
      const rLat = overrideLat ?? lat;
      const rLng = overrideLng ?? lng;
      const photo = overridePhoto !== undefined ? overridePhoto : photoName;

      if (!text.trim()) return;

      const id = nextReportId();

      const report: CivicReport = {
        id,
        rawText: text,
        normalizedSummary: generateSummary(text),
        category: cat,
        coords: { lat: rLat, lng: rLng },
        reportedAt: new Date().toISOString(),
        photoUrl: photo,
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
        citizenName: 'Citizen Reporter',
        citizenPhone: '99999-XXXX0',
        fieldNotes: null,
      };

      // Reset telemetry animation
      setTelemetryStep(0);
      setIsAnimating(true);

      const result = processReport(report);
      setTelemetry(result);

      // Reset form
      setRawText('');
      setPhotoName(null);
    },
    [rawText, category, lat, lng, photoName, processReport]
  );

  // =========================================================================
  // Preset click
  // =========================================================================

  const handlePreset = useCallback(
    (preset: PresetData) => {
      setRawText(preset.rawText);
      setCategory(preset.category);
      setLat(preset.lat);
      setLng(preset.lng);
      setPhotoName(preset.photo);

      // Auto-submit after a tick so state reflects
      setTimeout(() => {
        handleSubmit(preset.rawText, preset.category, preset.lat, preset.lng, preset.photo);
      }, 50);
    },
    [handleSubmit]
  );

  // =========================================================================
  // Render helpers
  // =========================================================================

  const presetIcons = [Zap, Waves, Building2, Shield];

  // =========================================================================
  // JSX
  // =========================================================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0 p-1">
      {/* ================================================================= */}
      {/* LEFT PANEL — Mobile Capture Interface                             */}
      {/* ================================================================= */}
      <div className="flex flex-col items-center gap-4 overflow-y-auto pr-2">
        {/* Phone frame */}
        <div className="max-w-[375px] w-full mx-auto rounded-2xl border border-[#D6D3CD] shadow-lg bg-white overflow-hidden">
          {/* Phone top bar */}
          <div className="bg-[#111315] text-white px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">
              ASTRA-GRID Citizen Reporter
            </span>
            <span className="text-[10px] font-mono opacity-50">
              09:41
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* 1. Text Input Area */}
            <div>
              <label
                htmlFor="complaint-text-input"
                className="block text-xs font-semibold text-[#111315] mb-1"
              >
                Describe the issue
              </label>
              <textarea
                id="complaint-text-input"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Describe the issue... (English / Hinglish / ಕನ್ನಡ supported)"
                rows={4}
                aria-required="true"
                className="w-full rounded-lg border border-[#D6D3CD] bg-[#F4F3EF] px-3 py-2 text-sm text-[#111315] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 focus:border-[#FF4F00] resize-none"
              />
            </div>

            {/* 2. Voice Mic Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? 'Stop live voice dictation' : 'Start live voice dictation in browser'}
                aria-live="polite"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4F00] ${
                  isListening
                    ? 'bg-[#D92D20] text-white animate-pulse shadow-lg shadow-red-300'
                    : 'bg-[#F4F3EF] text-[#111315] border border-[#D6D3CD] hover:border-[#FF4F00] hover:text-[#FF4F00]'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff size={16} aria-hidden="true" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic size={16} aria-hidden="true" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
              {isListening && (
                <span className="text-xs text-[#D92D20] font-semibold animate-pulse" role="status">
                  🎙️ Listening...
                </span>
              )}
            </div>

            {/* 3. Category Selector */}
            <div role="radiogroup" aria-label="Hazard Category Selection">
              <span className="block text-xs font-semibold text-[#111315] mb-1.5">
                Hazard Category
              </span>
              <div className="flex flex-wrap gap-1.5">
                {HAZARD_DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    role="radio"
                    aria-checked={category === domain}
                    onClick={() => setCategory(domain)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4F00] ${
                      category === domain
                        ? DOMAIN_COLORS[domain] + ' border-transparent ring-2 ring-offset-1 ring-[#FF4F00]/40 font-semibold'
                        : 'bg-white text-[#111315] border-[#D6D3CD] hover:border-[#FF4F00]/50'
                    }`}
                  >
                    {domain.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Photo Picker */}
            <div>
              <input
                ref={fileInputRef}
                id="photo-evidence-upload"
                type="file"
                accept="image/*"
                aria-label="Upload photo evidence of municipal hazard"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPhotoName(file.name);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach photo evidence"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#F4F3EF] text-[#111315] border border-[#D6D3CD] hover:border-[#FF4F00] hover:text-[#FF4F00] transition-all w-full justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4F00]"
              >
                <Camera size={16} aria-hidden="true" />
                <span>📷 Attach Photo Evidence</span>
              </button>
              {photoName && (
                <p className="text-[11px] text-gray-600 mt-1 truncate" role="status">
                  📎 {photoName}
                </p>
              )}
            </div>

            {/* 5. Location */}
            <fieldset>
              <div className="flex items-center justify-between mb-1.5">
                <legend className="text-xs font-semibold text-[#111315] flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  Incident Geographic Location
                </legend>
                <button
                  type="button"
                  onClick={() => setUseMapPin(!useMapPin)}
                  aria-pressed={useMapPin}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4F00] ${
                    useMapPin
                      ? 'bg-[#FF4F00] text-white border-[#FF4F00]'
                      : 'bg-white text-gray-600 border-[#D6D3CD]'
                  }`}
                >
                  📍 Click Map to Pin
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="latitude-input" className="text-[10px] text-gray-500 font-medium">Latitude</label>
                  <input
                    id="latitude-input"
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-[#D6D3CD] bg-[#F4F3EF] px-2 py-1.5 text-xs font-mono text-[#111315] focus:outline-none focus:ring-1 focus:ring-[#FF4F00]"
                  />
                </div>
                <div>
                  <label htmlFor="longitude-input" className="text-[10px] text-gray-500 font-medium">Longitude</label>
                  <input
                    id="longitude-input"
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-[#D6D3CD] bg-[#F4F3EF] px-2 py-1.5 text-xs font-mono text-[#111315] focus:outline-none focus:ring-1 focus:ring-[#FF4F00]"
                  />
                </div>
              </div>
            </fieldset>

            {/* 6. Submit Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!rawText.trim()}
              aria-label="Submit civic report to autonomous triage pipeline"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#FF4F00] text-white hover:bg-[#e64600] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF4F00]"
            >
              <Send size={16} aria-hidden="true" />
              Submit Civic Report
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PRESET BUTTONS                                                     */}
        {/* ================================================================= */}
        <div className="max-w-[375px] w-full mx-auto space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 px-1">
            Instant Judge Demo Presets
          </p>
          {PRESETS.map((preset, idx) => {
            const Icon = presetIcons[idx];
            return (
              <button
                key={idx}
                onClick={() => handlePreset(preset)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#D6D3CD] bg-white hover:border-[#FF4F00] hover:bg-[#FF4F00]/5 transition-all text-left group"
              >
                <span className="text-lg flex-shrink-0">{preset.icon}</span>
                <span className="text-xs font-medium text-[#111315] flex-1 leading-tight">
                  {preset.label}
                </span>
                <ChevronRight
                  size={14}
                  className="text-gray-300 group-hover:text-[#FF4F00] transition-colors flex-shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* RIGHT PANEL — Live AI X-Ray Pipeline Telemetry                    */}
      {/* ================================================================= */}
      <div className="overflow-y-auto pr-2">
        {!telemetry ? (
          // Empty state
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3 opacity-40">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F4F3EF] border border-[#D6D3CD] flex items-center justify-center">
                <Zap size={24} className="text-[#FF4F00]" />
              </div>
              <p className="text-sm font-medium text-[#111315]">
                Submit a report or click a preset
              </p>
              <p className="text-xs text-gray-400">
                The AI X-Ray pipeline will appear here
              </p>
            </div>
          </div>
        ) : (
          // Telemetry card
          <div className="rounded-xl border border-[#D6D3CD] bg-white shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="bg-[#111315] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]" />
                </span>
                <span className="text-xs font-mono tracking-widest text-white uppercase">
                  Pipeline Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                {telemetry.id}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Step 1: Category Detection */}
              <TelemetryRow visible={telemetryStep >= 1} delay={0}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    01 — Category Detection
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      DOMAIN_COLORS[telemetry.category]
                    }`}
                  >
                    {telemetry.category.replace(/_/g, ' ')}
                  </span>
                </div>
              </TelemetryRow>

              {/* Step 2: Summary */}
              <TelemetryRow visible={telemetryStep >= 2} delay={1}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    02 — Normalized Summary
                  </span>
                  <p className="text-sm text-[#111315] mt-1 leading-relaxed">
                    &ldquo;{telemetry.summary}&rdquo;
                  </p>
                </div>
              </TelemetryRow>

              {/* Step 3: Plausibility Check */}
              <TelemetryRow visible={telemetryStep >= 3} delay={2}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    03 — Plausibility Check
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      TRUST_COLORS[telemetry.trustTag] || TRUST_COLORS['Standard']
                    }`}
                  >
                    {telemetry.trustTag.replace(/_/g, ' ')}
                  </span>
                </div>
              </TelemetryRow>

              {/* Step 4: Nearest Landmark */}
              <TelemetryRow visible={telemetryStep >= 4} delay={3}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    04 — Nearest Vulnerable Landmark
                  </span>
                  <p className="text-sm font-mono text-[#111315] mt-1">
                    {telemetry.nearestLandmark
                      ? `${telemetry.nearestLandmark.name} — ${telemetry.nearestLandmark.distanceMeters}m`
                      : 'No vulnerable landmark within range'}
                  </p>
                </div>
              </TelemetryRow>

              {/* Step 5: Duplicate Scan */}
              <TelemetryRow visible={telemetryStep >= 5} delay={4}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    05 — Duplicate Scan
                  </span>
                  <p className="text-sm font-mono text-[#111315] mt-1">
                    {telemetry.duplicateMatch
                      ? `${telemetry.duplicateMatch.id} | cos: ${telemetry.duplicateMatch.similarity.toFixed(
                          2
                        )} | ${telemetry.duplicateMatch.distanceMeters}m`
                      : 'No duplicates found'}
                  </p>
                </div>
              </TelemetryRow>

              {/* Step 6: 4-Factor Priority Waterfall */}
              <TelemetryRow visible={telemetryStep >= 6} delay={5}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    06 — 4-Factor Priority Waterfall
                  </span>
                  <div className="mt-2 space-y-2">
                    {([
                      { label: 'Safety', value: telemetry.priorityBreakdown.safety, weight: 'w₁=0.40', color: 'bg-[#D92D20]' },
                      { label: 'Vulnerability', value: telemetry.priorityBreakdown.vulnerability, weight: 'w₂=0.25', color: 'bg-[#D97706]' },
                      { label: 'Volume', value: telemetry.priorityBreakdown.volume, weight: 'w₃=0.20', color: 'bg-[#FF4F00]' },
                      { label: 'Cascade', value: telemetry.priorityBreakdown.cascade, weight: 'w₄=0.15', color: 'bg-[#059669]' },
                    ] as const).map((factor) => (
                      <div key={factor.label} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-500 w-24 flex-shrink-0">
                          {factor.label}{' '}
                          <span className="text-gray-300">{factor.weight}</span>
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${factor.color} transition-all duration-700`}
                            style={{
                              width: `${Math.min(
                                (factor.value / telemetry.priorityBreakdown.total) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-[#111315] w-8 text-right">
                          {factor.value}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1 border-t border-dashed border-[#D6D3CD]">
                      <span className="text-[10px] font-mono text-gray-500 w-24 flex-shrink-0">
                        Total
                      </span>
                      <div className="flex-1" />
                      <span className="text-xs font-mono font-bold text-[#111315] w-8 text-right">
                        {telemetry.priorityBreakdown.total}
                      </span>
                    </div>
                  </div>
                </div>
              </TelemetryRow>

              {/* Step 7: Final Priority Score */}
              <TelemetryRow visible={telemetryStep >= 7} delay={6}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    07 — Final Priority Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-3xl font-mono font-black ${priorityColor(
                        telemetry.priorityScore
                      )}`}
                    >
                      {telemetry.priorityScore}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full text-white font-semibold ${priorityBgColor(
                        telemetry.priorityScore
                      )}`}
                    >
                      {telemetry.priorityScore >= 80
                        ? 'CRITICAL'
                        : telemetry.priorityScore >= 60
                        ? 'HIGH'
                        : telemetry.priorityScore >= 40
                        ? 'MEDIUM'
                        : 'LOW'}
                    </span>
                  </div>
                </div>
              </TelemetryRow>

              {/* Step 8: Tracking ID */}
              <TelemetryRow visible={telemetryStep >= 8} delay={7}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    08 — Tracking ID Assigned
                  </span>
                  <span className="text-sm font-mono font-bold text-[#FF4F00] bg-[#FF4F00]/10 px-3 py-1 rounded-md">
                    {telemetry.id}
                  </span>
                </div>
              </TelemetryRow>

              {/* Step 9: Escalation Forecast */}
              <TelemetryRow visible={telemetryStep >= 9} delay={8}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    09 — Escalation Forecast (24h)
                  </span>
                  <p className="text-xs text-[#D92D20] mt-1 font-medium leading-relaxed">
                    ⏱ {telemetry.escalationText}
                  </p>
                </div>
              </TelemetryRow>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Telemetry row animation wrapper
// ---------------------------------------------------------------------------

function TelemetryRow({
  visible,
  delay,
  children,
}: {
  visible: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  if (!visible) return null;

  return (
    <div
      className="animate-in slide-in-from-bottom-2 fade-in duration-300 border-b border-[#F4F3EF] pb-3 last:border-b-0 last:pb-0"
      style={{ animationDelay: `${delay * 50}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

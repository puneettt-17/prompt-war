'use client';

// =============================================================================
// ASTRA-GRID — Stage 2: UNDERSTAND
// Triage Queue, Policy Weight Sliders, and Pairwise "Why #A Beats #B" Comparator
// =============================================================================

import { useState, useMemo, useCallback } from 'react';
import { useAppState } from '@/lib/store';
import { compareReports, POLICY_PRESETS, PolicyWeights } from '@/lib/aiEngine';
import { CivicReport, VULNERABLE_LANDMARKS } from '@/lib/seedData';
import {
  SlidersHorizontal,
  GitCompare,
  Clock,
  MapPin,
  AlertTriangle,
  Shield,
  Zap,
  Droplets,
  Wrench,
  Trash2,
  TreePine,
  Eye,
  X,
  ChevronRight,
  Users,
  TrendingUp,
  Link,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function priorityColor(score: number | null): string {
  if (score === null) return 'bg-gray-400';
  if (score >= 80) return 'bg-[#D92D20]';
  if (score >= 60) return 'bg-[#FF4F00]';
  if (score >= 40) return 'bg-[#D97706]';
  return 'bg-[#059669]';
}

function priorityTextColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 80) return 'text-[#D92D20]';
  if (score >= 60) return 'text-[#FF4F00]';
  if (score >= 40) return 'text-[#D97706]';
  return 'text-[#059669]';
}

function categoryIcon(cat: string) {
  switch (cat) {
    case 'Electrical': return <Zap className="w-3.5 h-3.5" />;
    case 'Water_Drainage': return <Droplets className="w-3.5 h-3.5" />;
    case 'Roads': return <Wrench className="w-3.5 h-3.5" />;
    case 'Solid_Waste': return <Trash2 className="w-3.5 h-3.5" />;
    case 'Vegetation': return <TreePine className="w-3.5 h-3.5" />;
    case 'Public_Safety': return <Shield className="w-3.5 h-3.5" />;
    case 'Sanitation': return <AlertTriangle className="w-3.5 h-3.5" />;
    default: return <Eye className="w-3.5 h-3.5" />;
  }
}

function categoryBadgeColor(cat: string): string {
  switch (cat) {
    case 'Electrical': return 'bg-yellow-900/40 text-yellow-300 border-yellow-700';
    case 'Water_Drainage': return 'bg-blue-900/40 text-blue-300 border-blue-700';
    case 'Roads': return 'bg-orange-900/40 text-orange-300 border-orange-700';
    case 'Solid_Waste': return 'bg-green-900/40 text-green-300 border-green-700';
    case 'Vegetation': return 'bg-lime-900/40 text-lime-300 border-lime-700';
    case 'Public_Safety': return 'bg-red-900/40 text-red-300 border-red-700';
    case 'Sanitation': return 'bg-purple-900/40 text-purple-300 border-purple-700';
    default: return 'bg-gray-800 text-gray-300 border-gray-600';
  }
}

function trustBadge(tag: string) {
  switch (tag) {
    case 'Verified_Hazard': return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#059669]/20 text-[#059669] border border-[#059669]/30 font-mono">VERIFIED</span>;
    case 'Corroborated': return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-700 font-mono">CORROBORATED</span>;
    case 'Needs_Verification': return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D92D20]/20 text-[#D92D20] border border-[#D92D20]/30 font-mono">⚠ UNVERIFIED</span>;
    default: return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-600 font-mono">STANDARD</span>;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnderstandView() {
  const { state, dispatch } = useAppState();
  const { reports, weights, policyMode, selectedReportA, selectedReportB, lastPipelineRun } = state;

  // Slider local state for smooth dragging
  const [localWeights, setLocalWeights] = useState<PolicyWeights>(weights);

  // Separate master reports from merged children
  const masterReports = useMemo(() =>
    reports.filter((r) => r.mergedIntoMasterId === null)
      .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0)),
    [reports]
  );

  const mergedChildren = useMemo(() =>
    reports.filter((r) => r.mergedIntoMasterId !== null),
    [reports]
  );

  // Pairwise comparison
  const comparison = useMemo(() => {
    if (!selectedReportA || !selectedReportB) return null;
    const a = reports.find((r) => r.id === selectedReportA);
    const b = reports.find((r) => r.id === selectedReportB);
    if (!a || !b) return null;
    return compareReports(a, b, reports, VULNERABLE_LANDMARKS, weights);
  }, [selectedReportA, selectedReportB, reports, weights]);

  // Handle preset click
  const handlePreset = useCallback((mode: string) => {
    const preset = POLICY_PRESETS[mode];
    if (preset) {
      setLocalWeights(preset);
      dispatch({ type: 'SET_POLICY_MODE', payload: mode });
    }
  }, [dispatch]);

  // Handle slider change — redistribute proportionally
  const handleSliderChange = useCallback((key: keyof PolicyWeights, rawValue: number) => {
    const newVal = rawValue / 100;
    const otherKeys = (['safety', 'vulnerability', 'volume', 'cascade'] as (keyof PolicyWeights)[]).filter(k => k !== key);
    const otherSum = otherKeys.reduce((s, k) => s + localWeights[k], 0);
    const remaining = 1 - newVal;

    const newWeights: PolicyWeights = { ...localWeights, [key]: newVal };
    if (otherSum > 0) {
      for (const k of otherKeys) {
        newWeights[k] = Math.max(0, (localWeights[k] / otherSum) * remaining);
      }
    } else {
      for (const k of otherKeys) {
        newWeights[k] = remaining / otherKeys.length;
      }
    }
    setLocalWeights(newWeights);
    dispatch({ type: 'SET_WEIGHTS', payload: newWeights });
  }, [localWeights, dispatch]);

  // Report selection for comparison
  const handleReportClick = useCallback((id: string) => {
    if (!selectedReportA) {
      dispatch({ type: 'SELECT_REPORT_A', payload: id });
    } else if (selectedReportA === id) {
      dispatch({ type: 'SELECT_REPORT_A', payload: null });
    } else if (!selectedReportB) {
      dispatch({ type: 'SELECT_REPORT_B', payload: id });
    } else {
      dispatch({ type: 'SELECT_REPORT_A', payload: id });
      dispatch({ type: 'SELECT_REPORT_B', payload: null });
    }
  }, [selectedReportA, selectedReportB, dispatch]);

  const clearComparison = useCallback(() => {
    dispatch({ type: 'SELECT_REPORT_A', payload: null });
    dispatch({ type: 'SELECT_REPORT_B', payload: null });
  }, [dispatch]);

  const presets = [
    { key: 'standard', label: '⚙️ Standard Civic', desc: 'S:35 V:25 Vol:20 C:20' },
    { key: 'monsoon', label: '🌊 Monsoon Emergency', desc: 'C:45 S:35 V:15 Vol:5' },
    { key: 'school_hospital', label: '🏥 School/Hospital Guard', desc: 'V:45 S:35 Vol:10 C:10' },
  ];

  const sliderConfig = [
    { key: 'safety' as const, label: '🛡️ Safety', color: '#D92D20' },
    { key: 'vulnerability' as const, label: '📍 Vulnerability', color: '#FF4F00' },
    { key: 'volume' as const, label: '📊 Volume', color: '#D97706' },
    { key: 'cascade' as const, label: '🔗 Cascade', color: '#059669' },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Policy Weight Control Bar */}
      <div className="bg-[#111315] rounded-lg p-4 border border-[#3a3d40]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#FF4F00]" />
            <span className="font-mono text-xs text-[#FF4F00] tracking-wider uppercase">Triage Policy Mode</span>
          </div>
          <span className="font-mono text-[10px] text-gray-500">
            {policyMode === 'custom' ? 'CUSTOM WEIGHTS' : policyMode.toUpperCase()} MODE
          </span>
        </div>

        {/* Preset Buttons */}
        <div className="flex gap-2 mb-4">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                policyMode === p.key
                  ? 'bg-[#FF4F00] text-white'
                  : 'border border-[#3a3d40] text-gray-400 hover:border-[#FF4F00]/50 hover:text-gray-200'
              }`}
            >
              <div>{p.label}</div>
              <div className="font-mono text-[10px] mt-0.5 opacity-70">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* Weight Sliders */}
        <div className="grid grid-cols-4 gap-4">
          {sliderConfig.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-400">{s.label}</span>
                <span className="font-mono text-[11px] text-gray-300">
                  {Math.round(localWeights[s.key] * 100)}%
                  <span className="text-gray-600 ml-1">({localWeights[s.key].toFixed(2)})</span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(localWeights[s.key] * 100)}
                onChange={(e) => handleSliderChange(s.key, parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${s.color} ${localWeights[s.key] * 100}%, #3a3d40 ${localWeights[s.key] * 100}%)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Queue + Comparator */}
      <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">
        {/* Left: Priority Queue */}
        <div className="col-span-3 flex flex-col bg-white rounded-lg border border-[#D6D3CD] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#D6D3CD] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF4F00]" />
              <span className="font-mono text-xs tracking-wider uppercase text-[#111315] font-semibold">Priority Queue</span>
              <span className="bg-[#111315] text-white font-mono text-[10px] px-2 py-0.5 rounded-full">
                {masterReports.length} reports
              </span>
            </div>
            <span className="font-mono text-[10px] text-gray-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {lastPipelineRun ? new Date(lastPipelineRun).toLocaleTimeString('en-IN', { hour12: false }) : '—'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {masterReports.map((report, idx) => {
              const isSelectedA = selectedReportA === report.id;
              const isSelectedB = selectedReportB === report.id;
              const children = mergedChildren.filter((c) => c.mergedIntoMasterId === report.id);

              return (
                <div key={report.id}>
                  {/* Master Report Card */}
                  <div
                    onClick={() => handleReportClick(report.id)}
                    className={`flex items-stretch border-b border-[#D6D3CD] cursor-pointer transition-all hover:bg-gray-50 ${
                      isSelectedA || isSelectedB ? 'ring-2 ring-inset ring-[#FF4F00] bg-[#FF4F00]/5' : ''
                    }`}
                  >
                    {/* Priority stripe */}
                    <div className={`w-1.5 flex-shrink-0 ${priorityColor(report.priorityScore)}`} />

                    <div className="flex-1 px-3 py-2.5">
                      {/* Top row */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#111315]">{report.id}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${categoryBadgeColor(report.category)}`}>
                          {categoryIcon(report.category)}
                          {report.category.replace('_', ' ')}
                        </span>
                        {trustBadge(report.trustTag)}
                        {report.reportVolumeCount > 1 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#111315] text-white font-mono">
                            <Users className="w-3 h-3" />×{report.reportVolumeCount}
                          </span>
                        )}
                        {(isSelectedA || isSelectedB) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF4F00] text-white font-mono">
                            {isSelectedA ? 'A' : 'B'}
                          </span>
                        )}
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                        {report.normalizedSummary || report.rawText.slice(0, 80)}
                      </p>

                      {/* Bottom row */}
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                        <span className={`text-sm font-bold ${priorityTextColor(report.priorityScore)}`}>
                          {report.priorityScore ?? '—'}
                        </span>
                        {report.nearestLandmark && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {report.nearestLandmark.distanceMeters}m
                          </span>
                        )}
                        <span>{timeAgo(report.reportedAt)}</span>
                        <span className="text-gray-300">{report.status}</span>
                      </div>
                    </div>

                    {/* Rank number */}
                    <div className="flex items-center px-3">
                      <span className="font-mono text-lg font-bold text-gray-200">#{idx + 1}</span>
                    </div>
                  </div>

                  {/* Merged children */}
                  {children.length > 0 && children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => handleReportClick(child.id)}
                      className={`flex items-stretch border-b border-[#D6D3CD] cursor-pointer transition-all hover:bg-gray-50 bg-gray-50/50 ${
                        selectedReportA === child.id || selectedReportB === child.id ? 'ring-2 ring-inset ring-[#FF4F00] bg-[#FF4F00]/5' : ''
                      }`}
                    >
                      <div className="w-1.5 flex-shrink-0 bg-gray-300" />
                      <div className="flex-1 px-3 py-1.5 pl-8">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-[10px]">↳</span>
                          <span className="font-mono text-[10px] text-gray-500">{child.id}</span>
                          <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                            {child.rawText.slice(0, 50)}...
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">→ {report.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Pairwise Comparator */}
        <div className="col-span-2 bg-[#111315] rounded-lg border border-[#3a3d40] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#3a3d40] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#FF4F00]" />
              <span className="font-mono text-xs tracking-wider uppercase text-[#FF4F00]">
                {comparison ? `WHY ${comparison.reportA} vs ${comparison.reportB}` : 'PAIRWISE COMPARATOR'}
              </span>
            </div>
            {comparison && (
              <button
                onClick={clearComparison}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {comparison ? (
              <div className="space-y-4 animate-fade-in">
                {/* Waterfall Chart */}
                <div className="space-y-3">
                  {comparison.deltas.map((d, i) => {
                    const maxDelta = Math.max(...comparison.deltas.map(dd => Math.abs(dd.delta)), 1);
                    const barWidth = Math.min(Math.abs(d.delta) / maxDelta * 100, 100);
                    const isPositive = d.delta >= 0;

                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{d.factor}</span>
                          <span className={`font-mono text-xs font-bold ${isPositive ? 'text-[#059669]' : 'text-[#D92D20]'}`}>
                            {isPositive ? '+' : ''}{d.delta.toFixed(1)} pts
                          </span>
                        </div>
                        
                        {/* Bar */}
                        <div className="flex items-center h-5">
                          <div className="flex-1 flex items-center">
                            {!isPositive && (
                              <div className="flex-1 flex justify-end">
                                <div
                                  className="h-4 rounded-l bg-[#D92D20]/80 transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            )}
                            <div className="w-px h-5 bg-gray-600 flex-shrink-0" />
                            {isPositive && (
                              <div className="flex-1">
                                <div
                                  className="h-4 rounded-r bg-[#059669]/80 transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Explanation */}
                        <p className="text-[10px] text-gray-500 leading-tight">{d.explanation}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Net Delta */}
                <div className="border-t border-[#3a3d40] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-300">Net Priority Delta</span>
                    <span className={`font-mono text-xl font-bold ${comparison.netDelta >= 0 ? 'text-[#059669]' : 'text-[#D92D20]'}`}>
                      {comparison.netDelta >= 0 ? '+' : ''}{comparison.netDelta.toFixed(1)} pts
                    </span>
                  </div>
                </div>

                {/* Verdict */}
                <div className="bg-[#1a1d20] border border-[#FF4F00]/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {comparison.verdict}
                    </p>
                  </div>
                </div>

                {/* Individual scores */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[comparison.reportA, comparison.reportB].map((rid, i) => {
                    const r = reports.find(rr => rr.id === rid);
                    if (!r) return null;
                    return (
                      <div key={rid} className="bg-[#1a1d20] rounded p-2 border border-[#3a3d40]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-gray-300">{rid}</span>
                          <span className={`font-mono text-sm font-bold ${priorityTextColor(r.priorityScore)}`}>
                            {r.priorityScore ?? '—'}
                          </span>
                        </div>
                        <p className="text-gray-500 line-clamp-2">{r.rawText.slice(0, 60)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <GitCompare className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-sm text-gray-500 mb-2">Click any two reports in the queue</p>
                <p className="text-xs text-gray-600">
                  to compare their priority rankings factor by factor with a Shapley-value waterfall visualization
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="px-2 py-1 bg-[#1a1d20] rounded text-[10px] text-gray-400 border border-[#3a3d40] font-mono">
                    1st click → Report A
                  </span>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  <span className="px-2 py-1 bg-[#1a1d20] rounded text-[10px] text-gray-400 border border-[#3a3d40] font-mono">
                    2nd click → Report B
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


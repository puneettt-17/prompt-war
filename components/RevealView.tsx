'use client';

// =============================================================================
// ASTRA-GRID — Stage 3: REVEAL
// Tactical Hotspot Map & Causal Domino Graph
// =============================================================================

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppState } from '@/lib/store';
import { CausalCluster } from '@/lib/aiEngine';
import {
  AlertTriangle,
  ArrowDown,
  Target,
  DollarSign,
  Layers,
  ChevronRight,
  Zap,
  Droplets,
  Trash2,
  Construction,
  MapPin,
  Eye,
  EyeOff,
  Play,
  Shield,
  TreePine,
} from 'lucide-react';

// Dynamically import Leaflet map (no SSR)
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#F4F3EF] rounded-lg border border-[#D6D3CD]">
      <div className="text-center">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
        <p className="text-xs text-gray-500 font-mono">Loading Tactical Map...</p>
      </div>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categoryEmoji(cat: string): string {
  switch (cat) {
    case 'Solid_Waste': return '🗑️';
    case 'Water_Drainage': return '💧';
    case 'Roads': return '🛣️';
    case 'Electrical': return '⚡';
    case 'Sanitation': return '🚽';
    case 'Public_Safety': return '🛡️';
    case 'Vegetation': return '🌳';
    default: return '📋';
  }
}

function categoryNodeColor(cat: string): string {
  switch (cat) {
    case 'Solid_Waste': return 'border-green-600 bg-green-900/30';
    case 'Water_Drainage': return 'border-blue-600 bg-blue-900/30';
    case 'Roads': return 'border-orange-600 bg-orange-900/30';
    case 'Electrical': return 'border-yellow-500 bg-yellow-900/30';
    case 'Sanitation': return 'border-purple-600 bg-purple-900/30';
    default: return 'border-gray-600 bg-gray-900/30';
  }
}

function edgeLabel(fromCat: string, toCat: string): string {
  if (fromCat === 'Solid_Waste' && toCat === 'Water_Drainage') return 'Waste accumulation chokes drainage system';
  if (fromCat === 'Water_Drainage' && toCat === 'Roads') return 'Prolonged flooding erodes road surface';
  if (fromCat === 'Roads' && toCat === 'Electrical') return 'Submerged infrastructure exposes electrical hazards';
  if (fromCat === 'Water_Drainage' && toCat === 'Electrical') return 'Floodwater reaches electrical installations';
  if (fromCat === 'Solid_Waste' && toCat === 'Sanitation') return 'Waste blocks sanitation infrastructure';
  return 'Causal connection detected';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RevealView() {
  const { state, dispatch } = useAppState();
  const { reports, landmarks, clusters, selectedClusterId } = state;

  const [showVulnerabilityRings, setShowVulnerabilityRings] = useState(true);
  const [showClusterZones, setShowClusterZones] = useState(true);

  const selectedCluster = clusters.find((c) => c.clusterId === selectedClusterId) || null;

  const handleClusterClick = useCallback((clusterId: string) => {
    dispatch({ type: 'SELECT_CLUSTER', payload: clusterId });
  }, [dispatch]);

  return (
    <div className="h-full grid grid-cols-5 gap-4">
      {/* Left Panel: Map */}
      <div className="col-span-3 flex flex-col gap-2">
        {/* Map Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#FF4F00]" />
            <span className="font-mono text-xs tracking-wider uppercase text-[#111315] font-semibold">
              Tactical Hotspot Map
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D92D20]" />≥80</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF4F00]" />60-79</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D97706]" />40-59</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#059669]" />&lt;40</span>
            </div>
            {/* Toggles */}
            <button
              onClick={() => setShowVulnerabilityRings(v => !v)}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-all ${
                showVulnerabilityRings
                  ? 'border-[#FF4F00] text-[#FF4F00] bg-[#FF4F00]/5'
                  : 'border-[#D6D3CD] text-gray-400'
              }`}
            >
              {showVulnerabilityRings ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Vulnerability Rings
            </button>
            <button
              onClick={() => setShowClusterZones(v => !v)}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-all ${
                showClusterZones
                  ? 'border-[#D92D20] text-[#D92D20] bg-[#D92D20]/5'
                  : 'border-[#D6D3CD] text-gray-400'
              }`}
            >
              {showClusterZones ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Cluster Zones
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-lg border border-[#D6D3CD] overflow-hidden" style={{ minHeight: '400px' }}>
          <MapComponent
            reports={reports}
            landmarks={landmarks}
            clusters={clusters}
            showVulnerabilityRings={showVulnerabilityRings}
            showClusterZones={showClusterZones}
            onClusterClick={handleClusterClick}
            selectedClusterId={selectedClusterId}
          />
        </div>
      </div>

      {/* Right Panel: Causal Domino Inspector */}
      <div className="col-span-2 flex flex-col bg-[#111315] rounded-lg border border-[#3a3d40] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#3a3d40] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#FF4F00]" />
          <span className="font-mono text-xs tracking-wider uppercase text-[#FF4F00]">
            Causal Domino Inspector
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedCluster ? (
            <div className="space-y-4 animate-fade-in">
              {/* Cluster Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedCluster.clusterId}</h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {selectedCluster.affectedReportCount} linked reports within 250m
                  </p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SELECT_CLUSTER', payload: null })}
                  className="text-gray-500 hover:text-white text-xs"
                >
                  ✕ Close
                </button>
              </div>

              {/* Visual Causal Chain */}
              <div className="space-y-0">
                {selectedCluster.nodes.map((node, idx) => {
                  const edge = idx < selectedCluster.edges.length ? selectedCluster.edges[idx] : null;
                  const report = reports.find(r => r.id === node.reportId);

                  return (
                    <div key={node.reportId}>
                      {/* Node */}
                      <div className={`rounded-lg border-l-4 p-3 ${categoryNodeColor(node.category)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{categoryEmoji(node.category)}</span>
                          <span className="font-mono text-xs font-bold text-white">{node.reportId}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{node.category.replace('_', ' ')}</span>
                          <span className="text-[10px] text-gray-500 font-mono ml-auto">
                            {node.hoursAgo < 1 ? `${Math.round(node.hoursAgo * 60)}m ago` : `${Math.round(node.hoursAgo)}h ago`}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          {node.label}
                        </p>
                        {idx === 0 && (
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-[#FF4F00]/20 text-[#FF4F00] font-mono">
                            ROOT CAUSE
                          </span>
                        )}
                        {idx === selectedCluster.nodes.length - 1 && idx > 0 && (
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-[#D92D20]/20 text-[#D92D20] font-mono">
                            CRITICAL DOWNSTREAM
                          </span>
                        )}
                      </div>

                      {/* Edge arrow */}
                      {edge && (
                        <div className="flex items-center gap-2 py-1 pl-6">
                          <ArrowDown className="w-4 h-4 text-[#FF4F00]" />
                          <span className="text-[10px] text-gray-500 italic">
                            {edge.label || edgeLabel(
                              selectedCluster.nodes[idx]?.category || '',
                              selectedCluster.nodes[idx + 1]?.category || ''
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Why Single-Ticket Dispatch Fails */}
              <div className="border border-[#D92D20]/40 rounded-lg p-3 bg-[#D92D20]/5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D92D20] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#D92D20] mb-1">Why Single-Ticket Dispatch Fails</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Dispatching separate crews for each complaint wastes resources and fails to resolve the root cause.
                      The downstream hazards will recur within 48h unless the upstream root cause is cleared first.
                    </p>
                  </div>
                </div>
              </div>

              {/* Crew ROI */}
              <div className="border border-[#059669]/40 rounded-lg p-3 bg-[#059669]/5">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#059669] mb-1">Crew ROI Metric</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {selectedCluster.crewRoiText}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1 font-mono">
                      Estimated savings: {selectedCluster.estimatedSavings}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Brief */}
              <div className="bg-[#1a1d20] rounded-lg p-3 border border-[#3a3d40]">
                <p className="text-xs font-semibold text-[#FF4F00] mb-2 font-mono">1-MINUTE ACTION BRIEF</p>
                <div className="space-y-2 text-[11px] text-gray-300">
                  {selectedCluster.actionBrief.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF4F00]/20 text-[#FF4F00] flex items-center justify-center text-[10px] font-mono font-bold">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{line.replace(/^STEP \d+:\s*/i, '').replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execute Button */}
              <button className="w-full py-2.5 bg-[#FF4F00] hover:bg-[#cc3f00] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Execute Sequenced Multi-Dept Dispatch
              </button>
            </div>
          ) : (
            /* Cluster List */
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">
                Select a causal cluster to inspect the root-cause chain and generate dispatch plans.
              </p>
              {clusters.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No causal clusters detected</p>
                </div>
              ) : (
                clusters.map((cluster) => (
                  <button
                    key={cluster.clusterId}
                    onClick={() => handleClusterClick(cluster.clusterId)}
                    className="w-full text-left bg-[#1a1d20] rounded-lg p-3 border border-[#3a3d40] hover:border-[#FF4F00]/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-white">{cluster.clusterId}</span>
                      <span className="bg-[#D92D20]/20 text-[#D92D20] text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {cluster.affectedReportCount} reports
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-2">
                      {cluster.nodes.map(n => categoryEmoji(n.category)).join(' → ')} Causal chain detected
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#FF4F00] group-hover:text-[#FF4F00]">
                      View Chain <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


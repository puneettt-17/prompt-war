'use client';

// =============================================================================
// ASTRA-GRID — Stage 4: ACT & TRACK
// Command Dispatch + Citizen Live Tracker
// =============================================================================

import { useState, useMemo, useCallback } from 'react';
import { useAppState } from '@/lib/store';
import { CivicReport, Department } from '@/lib/seedData';
import {
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Users,
  FileText,
  Shield,
  RefreshCw,
  Camera,
  Truck,
  Radio,
  Zap,
  Droplets,
  Wrench,
  Trash2,
  Stethoscope,
  CircleDot,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEPARTMENTS: { value: Department; label: string; icon: React.ReactNode }[] = [
  { value: 'MESCOM_Electrical', label: 'MESCOM Electrical', icon: <Zap className="w-3.5 h-3.5" /> },
  { value: 'MCC_Storm_Water', label: 'MCC Storm Water Drain', icon: <Droplets className="w-3.5 h-3.5" /> },
  { value: 'Civil_Roads', label: 'Civil Roads Division', icon: <Wrench className="w-3.5 h-3.5" /> },
  { value: 'Solid_Waste_SWM', label: 'Solid Waste SWM', icon: <Trash2 className="w-3.5 h-3.5" /> },
  { value: 'MCC_Health', label: 'MCC Health', icon: <Stethoscope className="w-3.5 h-3.5" /> },
  { value: 'Traffic_Police', label: 'Traffic Police', icon: <Shield className="w-3.5 h-3.5" /> },
];

const STATUS_FLOW: CivicReport['status'][] = ['Submitted', 'Triaged', 'Assigned', 'In_Progress', 'Resolved'];

function statusColor(status: string): string {
  switch (status) {
    case 'Submitted': return 'text-gray-400 bg-gray-800';
    case 'Triaged': return 'text-[#D97706] bg-[#D97706]/10';
    case 'Assigned': return 'text-blue-400 bg-blue-900/30';
    case 'In_Progress': return 'text-[#FF4F00] bg-[#FF4F00]/10';
    case 'Resolved': return 'text-[#059669] bg-[#059669]/10';
    default: return 'text-gray-400 bg-gray-800';
  }
}

function timeAgo(iso: string): string {
  const diffMs = Math.max(0, 1793354400000 - new Date(iso).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function priorityColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 80) return 'text-[#D92D20]';
  if (score >= 60) return 'text-[#FF4F00]';
  if (score >= 40) return 'text-[#D97706]';
  return 'text-[#059669]';
}

// SLA countdown: 24h from reportedAt
function slaCountdown(reportedAt: string): { text: string; isOverdue: boolean } {
  const deadline = new Date(reportedAt).getTime() + 24 * 3600000;
  const remaining = deadline - 1793354400000;
  if (remaining <= 0) {
    const overHrs = Math.floor(-remaining / 3600000);
    return { text: `OVERDUE by ${overHrs}h`, isOverdue: true };
  }
  const hrs = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  return { text: `${hrs}h ${mins}m remaining`, isOverdue: false };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActView() {
  const { state, dispatch } = useAppState();
  const { reports } = state;

  // Dispatch panel state
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null);
  const [dispatchDept, setDispatchDept] = useState<Department>('MESCOM_Electrical');
  const [fieldNotes, setFieldNotes] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Citizen tracker state
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackedReport, setTrackedReport] = useState<CivicReport | null>(null);

  // Actionable reports (not resolved, sorted by priority)
  const actionableReports = useMemo(() =>
    reports
      .filter(r => r.mergedIntoMasterId === null && r.status !== 'Resolved')
      .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0)),
    [reports]
  );

  const selectedReport = useMemo(() =>
    reports.find(r => r.id === selectedDispatchId) || null,
    [reports, selectedDispatchId]
  );

  // Handle status advance
  const handleAdvanceStatus = useCallback(() => {
    if (!selectedReport) return;
    const currentIdx = STATUS_FLOW.indexOf(selectedReport.status);
    const nextStatus = STATUS_FLOW[Math.min(currentIdx + 1, STATUS_FLOW.length - 1)];

    dispatch({
      type: 'CASCADE_STATUS',
      payload: {
        masterId: selectedReport.id,
        status: nextStatus,
        dept: dispatchDept,
        notes: fieldNotes,
      },
    });

    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 3000);
  }, [selectedReport, dispatchDept, fieldNotes, dispatch]);

  // Handle citizen search
  const handleTrackSearch = useCallback(() => {
    const searchTerm = trackingSearch.trim().toUpperCase();
    const found = reports.find(r => r.id === searchTerm);
    setTrackedReport(found || null);
  }, [trackingSearch, reports]);

  // Get master report for a tracked child
  const trackedMaster = useMemo(() => {
    if (!trackedReport?.mergedIntoMasterId) return null;
    return reports.find(r => r.id === trackedReport.mergedIntoMasterId) || null;
  }, [trackedReport, reports]);

  // Children of tracked master
  const trackedChildren = useMemo(() => {
    const masterId = trackedReport?.mergedIntoMasterId || trackedReport?.id;
    if (!masterId) return [];
    return reports.filter(r => r.mergedIntoMasterId === masterId);
  }, [trackedReport, reports]);

  return (
    <div className="h-full grid grid-cols-2 gap-4">
      {/* Left: Authority Dispatch Workflow */}
      <div className="flex flex-col bg-white rounded-lg border border-[#D6D3CD] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#D6D3CD] flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#FF4F00]" />
          <span className="font-mono text-xs tracking-wider uppercase text-[#111315] font-semibold">
            Authority Dispatch Workflow
          </span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Report List */}
          <div className="w-2/5 border-r border-[#D6D3CD] overflow-y-auto">
            {actionableReports.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedDispatchId(r.id); setDispatchSuccess(false); }}
                className={`w-full text-left px-3 py-2.5 border-b border-[#D6D3CD] transition-all hover:bg-gray-50 ${
                  selectedDispatchId === r.id ? 'bg-[#FF4F00]/5 border-l-2 border-l-[#FF4F00]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-xs font-bold">{r.id}</span>
                  <span className={`font-mono text-xs font-bold ${priorityColor(r.priorityScore)}`}>
                    {r.priorityScore}
                  </span>
                </div>
                <p className="text-[10px] text-gray-700 font-medium line-clamp-1">{r.rawText.slice(0, 60)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${statusColor(r.status)}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">{timeAgo(r.reportedAt)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Dispatch Form */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedReport ? (
              <div className="space-y-4">
                {/* Report Detail */}
                <div className="bg-[#111315] rounded-lg p-3 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-bold">{selectedReport.id}</span>
                    <span className={`font-mono text-sm font-bold ${priorityColor(selectedReport.priorityScore)}`}>
                      Score: {selectedReport.priorityScore}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">{selectedReport.rawText}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                    <span>{selectedReport.category.replace('_', ' ')}</span>
                    <span>{selectedReport.citizenName}</span>
                    <span>{selectedReport.citizenPhone}</span>
                  </div>
                </div>

                {/* Status Flow */}
                <div>
                  <span className="text-xs font-semibold text-[#111315] mb-2 block">Status Pipeline</span>
                  <div role="list" aria-label="Incident resolution lifecycle steps" className="flex items-center gap-1">
                    {STATUS_FLOW.map((s, i) => {
                      const currentIdx = STATUS_FLOW.indexOf(selectedReport.status);
                      const isActive = i <= currentIdx;
                      const isCurrent = s === selectedReport.status;
                      return (
                        <div key={s} role="listitem" aria-current={isCurrent ? 'step' : undefined} className="flex items-center gap-1">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
                            isCurrent ? 'bg-[#FF4F00] text-white font-bold shadow-sm' :
                            isActive ? 'bg-[#059669]/20 text-[#059669]' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {isActive && i < currentIdx && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                            {isCurrent && <CircleDot className="w-3 h-3" aria-hidden="true" />}
                            {s.replace('_', ' ')}
                          </div>
                          {i < STATUS_FLOW.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400" aria-hidden="true" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Department Assignment */}
                <fieldset>
                  <legend className="text-xs font-semibold text-[#111315] mb-2 block">Assign Municipal Department</legend>
                  <div role="radiogroup" aria-label="Municipal Department Selection" className="grid grid-cols-2 gap-2">
                    {DEPARTMENTS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        role="radio"
                        aria-checked={dispatchDept === d.value}
                        onClick={() => setDispatchDept(d.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4F00] ${
                          dispatchDept === d.value
                            ? 'bg-[#FF4F00] text-white font-semibold'
                            : 'border border-[#D6D3CD] text-gray-700 hover:border-[#FF4F00]'
                        }`}
                      >
                        <span aria-hidden="true">{d.icon}</span>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Field Notes */}
                <div>
                  <label htmlFor="dispatch-field-notes" className="text-xs font-semibold text-[#111315] mb-2 block">
                    Field Dispatch Notes
                  </label>
                  <textarea
                    id="dispatch-field-notes"
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D6D3CD] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/30 focus:border-[#FF4F00]"
                    rows={3}
                    placeholder="Enter dispatch notes, crew instructions, or special equipment requirements..."
                  />
                </div>

                {/* Cascade info */}
                {reports.filter(r => r.mergedIntoMasterId === selectedReport.id).length > 0 && (
                  <div className="bg-[#FF4F00]/5 border border-[#FF4F00]/20 rounded-lg p-2">
                    <p className="text-[10px] text-[#FF4F00] flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Status update will cascade to {reports.filter(r => r.mergedIntoMasterId === selectedReport.id).length} merged child reports
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAdvanceStatus}
                    disabled={selectedReport.status === 'Resolved'}
                    className={`flex-1 py-2.5 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
                      selectedReport.status === 'Resolved'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#FF4F00] hover:bg-[#cc3f00] text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {selectedReport.status === 'Resolved'
                      ? 'Already Resolved'
                      : `Advance to ${STATUS_FLOW[Math.min(STATUS_FLOW.indexOf(selectedReport.status) + 1, STATUS_FLOW.length - 1)].replace('_', ' ')}`
                    }
                  </button>
                </div>

                {/* Success notification */}
                {dispatchSuccess && (
                  <div className="bg-[#059669]/10 border border-[#059669]/30 rounded-lg p-2 animate-slide-in">
                    <p className="text-xs text-[#059669] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status updated successfully. All merged reports cascaded.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Truck className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm">Select a report to begin dispatch</p>
                <p className="text-[10px] mt-1">Choose from the priority queue on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Citizen Transparency Portal */}
      <div className="flex flex-col bg-[#111315] rounded-lg border border-[#3a3d40] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#3a3d40] flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#FF4F00]" />
          <span className="font-mono text-xs tracking-wider uppercase text-[#FF4F00]">
            Citizen Transparency Portal
          </span>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#3a3d40]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrackSearch();
            }}
            className="flex gap-2"
          >
            <label htmlFor="citizen-tracking-search-input" className="sr-only">
              Search by Report ID to track status
            </label>
            <input
              id="citizen-tracking-search-input"
              type="text"
              value={trackingSearch}
              onChange={(e) => setTrackingSearch(e.target.value)}
              placeholder="Enter Report ID (e.g., AST-1001)"
              className="flex-1 px-3 py-2 bg-[#1a1d20] border border-[#3a3d40] rounded text-xs text-white font-mono placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 focus:border-[#FF4F00]"
            />
            <button
              type="submit"
              aria-label="Search and track complaint status"
              className="px-4 py-2 bg-[#FF4F00] hover:bg-[#cc3f00] text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#FF4F00]"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              Track
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {trackedReport ? (
            <div className="space-y-4 animate-fade-in">
              {/* Merge Banner */}
              {trackedReport.mergedIntoMasterId && trackedMaster && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                  <p className="text-xs text-blue-400 flex items-center gap-1 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    Duplicate Detected & Merged
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Your report <span className="font-mono text-white">{trackedReport.id}</span> has been merged into master ticket
                    <span className="font-mono text-[#FF4F00] ml-1">{trackedMaster.id}</span>.
                    All updates below reflect the master ticket status.
                  </p>
                </div>
              )}

              {/* Report Header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-lg font-bold text-white">
                    {trackedReport.mergedIntoMasterId ? trackedMaster?.id : trackedReport.id}
                  </span>
                  <span className={`text-lg font-bold font-mono ${priorityColor(
                    trackedReport.mergedIntoMasterId ? trackedMaster?.priorityScore ?? null : trackedReport.priorityScore
                  )}`}>
                    {trackedReport.mergedIntoMasterId ? trackedMaster?.priorityScore : trackedReport.priorityScore}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {trackedReport.rawText}
                </p>
              </div>

              {/* Status Timeline */}
              <div>
                <p className="text-xs font-semibold text-gray-300 mb-3">Progress Timeline</p>
                <div className="space-y-3">
                  {STATUS_FLOW.map((s, i) => {
                    const activeReport = trackedReport.mergedIntoMasterId ? trackedMaster : trackedReport;
                    const currentIdx = STATUS_FLOW.indexOf(activeReport?.status || 'Submitted');
                    const isPast = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    const isFuture = i > currentIdx;

                    return (
                      <div key={s} className="flex items-start gap-3">
                        {/* Timeline dot + line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            isPast ? 'bg-[#059669]' : isCurrent ? 'bg-[#FF4F00] animate-pulse-orange' : 'bg-[#3a3d40]'
                          }`} />
                          {i < STATUS_FLOW.length - 1 && (
                            <div className={`w-0.5 h-8 ${isPast ? 'bg-[#059669]' : 'bg-[#3a3d40]'}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pb-2 ${isFuture ? 'opacity-40' : ''}`}>
                          <p className={`text-xs font-medium ${
                            isCurrent ? 'text-[#FF4F00]' : isPast ? 'text-[#059669]' : 'text-gray-600'
                          }`}>
                            {s.replace('_', ' ')}
                            {isCurrent && <span className="ml-2 text-[10px] font-mono">← Current</span>}
                          </p>
                          {isPast && (
                            <p className="text-[10px] text-gray-500 mt-0.5">Completed</p>
                          )}
                          {isCurrent && activeReport?.assignedDept && (
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Assigned to: {activeReport.assignedDept.replace(/_/g, ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SLA Countdown */}
              {(() => {
                const sla = slaCountdown(trackedReport.reportedAt);
                return (
                  <div className={`rounded-lg p-3 border ${
                    sla.isOverdue ? 'bg-[#D92D20]/10 border-[#D92D20]/30' : 'bg-[#1a1d20] border-[#3a3d40]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${sla.isOverdue ? 'text-[#D92D20]' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-400">SLA Timer (24h target):</span>
                      <span className={`font-mono text-xs font-bold ${sla.isOverdue ? 'text-[#D92D20]' : 'text-[#D97706]'}`}>
                        {sla.text}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Merged reports count */}
              {trackedChildren.length > 0 && (
                <div className="bg-[#1a1d20] rounded-lg p-3 border border-[#3a3d40]">
                  <p className="text-xs text-gray-400 mb-2">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    {trackedChildren.length + 1} total reports merged into this ticket
                  </p>
                  <div className="space-y-1">
                    {trackedChildren.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="font-mono">{c.id}</span>
                        <span className="text-gray-600">—</span>
                        <span className="truncate">{c.rawText.slice(0, 40)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citizen Actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-2 border border-[#059669] text-[#059669] rounded text-xs font-semibold hover:bg-[#059669]/10 transition-colors flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify Fix
                </button>
                <button className="flex-1 py-2 border border-[#D92D20] text-[#D92D20] rounded text-xs font-semibold hover:bg-[#D92D20]/10 transition-colors flex items-center justify-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  Re-Open with Photo
                </button>
              </div>

              {/* Escalation */}
              {trackedReport.costOfDelayText && (
                <div className="bg-[#D97706]/5 border border-[#D97706]/20 rounded-lg p-2">
                  <p className="text-[10px] text-[#D97706] flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>Escalation: {trackedReport.costOfDelayText}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <Search className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-sm text-gray-500 mb-2">Track Your Complaint</p>
              <p className="text-xs text-gray-600 mb-4">
                Enter your Report ID (e.g., AST-1001) to view real-time status,
                including merged duplicate tickets
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['AST-1005', 'AST-1012', 'AST-1016', 'AST-1018'].map(id => (
                  <button
                    key={id}
                    onClick={() => { setTrackingSearch(id); setTrackedReport(reports.find(r => r.id === id) || null); }}
                    className="text-[10px] px-2 py-1 rounded bg-[#1a1d20] border border-[#3a3d40] text-gray-400 hover:border-[#FF4F00]/50 hover:text-gray-200 font-mono transition-all"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


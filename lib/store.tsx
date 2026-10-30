'use client';

import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { CivicReport, VulnerableLandmark, VULNERABLE_LANDMARKS, generateSeedReports } from './seedData';
import { PolicyWeights, POLICY_PRESETS, PriorityBreakdown, runFullPipeline, computePriority, buildCausalClusters, CausalCluster } from './aiEngine';

// Active view/stage
export type ActiveView = 'capture' | 'understand' | 'reveal' | 'act';

export interface AppState {
  reports: CivicReport[];
  landmarks: VulnerableLandmark[];
  activeView: ActiveView;
  policyMode: string; // 'standard' | 'monsoon' | 'school_hospital' | 'custom'
  weights: PolicyWeights;
  selectedReportA: string | null; // for pairwise comparison
  selectedReportB: string | null;
  selectedClusterId: string | null;
  selectedReportId: string | null; // for detail view
  clusters: CausalCluster[];
  searchTrackingId: string; // citizen tracking search
  isProcessing: boolean;
  lastPipelineRun: string | null;
}

export type AppAction =
  | { type: 'SET_VIEW'; payload: ActiveView }
  | { type: 'SET_POLICY_MODE'; payload: string }
  | { type: 'SET_WEIGHTS'; payload: PolicyWeights }
  | { type: 'SET_REPORTS'; payload: CivicReport[] }
  | { type: 'ADD_REPORT'; payload: CivicReport }
  | { type: 'UPDATE_REPORT'; payload: { id: string; updates: Partial<CivicReport> } }
  | { type: 'SELECT_REPORT_A'; payload: string | null }
  | { type: 'SELECT_REPORT_B'; payload: string | null }
  | { type: 'SELECT_CLUSTER'; payload: string | null }
  | { type: 'SELECT_REPORT'; payload: string | null }
  | { type: 'SET_CLUSTERS'; payload: CausalCluster[] }
  | { type: 'SET_SEARCH_ID'; payload: string }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'RESET_DEMO'; }
  | { type: 'RUN_PIPELINE'; }
  | { type: 'CASCADE_STATUS'; payload: { masterId: string; status: CivicReport['status']; dept: CivicReport['assignedDept']; notes: string } };

function initState(): AppState {
  const reports = generateSeedReports();
  const landmarks = VULNERABLE_LANDMARKS;
  const weights = POLICY_PRESETS.standard;
  const processed = runFullPipeline(reports, landmarks, weights);
  const clusters = buildCausalClusters(processed);
  return {
    reports: processed,
    landmarks,
    activeView: 'capture',
    policyMode: 'standard',
    weights,
    selectedReportA: null,
    selectedReportB: null,
    selectedClusterId: null,
    selectedReportId: null,
    clusters,
    searchTrackingId: '',
    isProcessing: false,
    lastPipelineRun: '2026-10-30T11:00:00.000Z',
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_POLICY_MODE': {
      const preset = (POLICY_PRESETS as Record<string, PolicyWeights>)[action.payload];
      if (!preset) return state;
      const weights = preset;
      const processed = runFullPipeline(state.reports, state.landmarks, weights);
      const clusters = buildCausalClusters(processed);
      return { ...state, policyMode: action.payload, weights, reports: processed, clusters, lastPipelineRun: new Date().toISOString() };
    }
    case 'SET_WEIGHTS': {
      const processed = runFullPipeline(state.reports, state.landmarks, action.payload);
      const clusters = buildCausalClusters(processed);
      return { ...state, weights: action.payload, policyMode: 'custom', reports: processed, clusters, lastPipelineRun: new Date().toISOString() };
    }
    case 'SET_REPORTS':
      return { ...state, reports: action.payload };
    case 'ADD_REPORT': {
      const newReports = [...state.reports, action.payload];
      const processed = runFullPipeline(newReports, state.landmarks, state.weights);
      const clusters = buildCausalClusters(processed);
      return { ...state, reports: processed, clusters, lastPipelineRun: new Date().toISOString() };
    }
    case 'UPDATE_REPORT': {
      const updated = state.reports.map(r => r.id === action.payload.id ? { ...r, ...action.payload.updates } : r);
      return { ...state, reports: updated };
    }
    case 'SELECT_REPORT_A':
      return { ...state, selectedReportA: action.payload };
    case 'SELECT_REPORT_B':
      return { ...state, selectedReportB: action.payload };
    case 'SELECT_CLUSTER':
      return { ...state, selectedClusterId: action.payload };
    case 'SELECT_REPORT':
      return { ...state, selectedReportId: action.payload };
    case 'SET_CLUSTERS':
      return { ...state, clusters: action.payload };
    case 'SET_SEARCH_ID':
      return { ...state, searchTrackingId: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'RESET_DEMO': {
      return initState();
    }
    case 'RUN_PIPELINE': {
      const processed = runFullPipeline(state.reports, state.landmarks, state.weights);
      const clusters = buildCausalClusters(processed);
      return { ...state, reports: processed, clusters, lastPipelineRun: new Date().toISOString() };
    }
    case 'CASCADE_STATUS': {
      const { masterId, status, dept, notes } = action.payload;
      const updated = state.reports.map(r => {
        if (r.id === masterId || r.mergedIntoMasterId === masterId) {
          return { ...r, status, assignedDept: dept || r.assignedDept, fieldNotes: notes || r.fieldNotes };
        }
        return r;
      });
      return { ...state, reports: updated };
    }
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, initState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

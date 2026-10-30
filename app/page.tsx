'use client';

// =============================================================================
// ASTRA-GRID — Main Page
// Municipal Triage & Causal Infrastructure Workbench
// =============================================================================

import { AppProvider, useAppState } from '@/lib/store';
import TopBar from '@/components/TopBar';
import CaptureView from '@/components/CaptureView';
import UnderstandView from '@/components/UnderstandView';
import RevealView from '@/components/RevealView';
import ActView from '@/components/ActView';

function WorkbenchContent() {
  const { state } = useAppState();

  return (
    <div className="min-h-screen bg-[#F4F3EF]">
      <TopBar />

      {/* Main content area below the top bar */}
      <main
        id={`stage-panel-${state.activeView}`}
        role="tabpanel"
        aria-labelledby={`tab-${state.activeView}`}
        className="pt-[72px] px-4 pb-4"
        style={{ height: '100vh' }}
      >
        <div className="h-full">
          {state.activeView === 'capture' && <CaptureView />}
          {state.activeView === 'understand' && <UnderstandView />}
          {state.activeView === 'reveal' && <RevealView />}
          {state.activeView === 'act' && <ActView />}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <WorkbenchContent />
    </AppProvider>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppState } from '@/lib/store';
import { Shield, RotateCcw, Clock, X } from 'lucide-react';

type ViewId = 'capture' | 'understand' | 'reveal' | 'act';

interface NavTab {
  id: ViewId;
  label: string;
}

const NAV_TABS: NavTab[] = [
  { id: 'capture', label: '01 // CAPTURE' },
  { id: 'understand', label: '02 // UNDERSTAND' },
  { id: 'reveal', label: '03 // REVEAL' },
  { id: 'act', label: '04 // ACT & TRACK' },
];

const HONESTY_SECTIONS = [
  {
    icon: '✅',
    title: 'What Is Real',
    items: [
      'Haversine geodesic spatial math (exact meter calculations)',
      'Multilingual civic-synonym TF-IDF cosine similarity',
      'Dynamic 4-factor priority matrix with live policy weight tuning',
      'Causal DAG solver with directed root-cause analysis',
      'Spatio-temporal duplicate detection & merge',
      'Adversarial hyperbole & plausibility guard',
      'Cross-modal trust scoring',
      'Gemini 2.5 Flash API integration (when API key provided)',
    ],
  },
  {
    icon: '⚠️',
    title: 'What Is Simulated',
    items: [
      '42 synthetic reports (zero real citizen data)',
      'SMS/WhatsApp notification dispatch',
      'Municipal ERP crew assignment integration',
      'Photo hazard analysis (placeholder images)',
    ],
  },
  {
    icon: '🔍',
    title: 'Where AI Can Be Wrong',
    items: [
      'GPS urban canyon drift (±15-30m in dense areas)',
      'Staged or recycled photos could fool visual verification',
      'Co-located but unrelated hazards may be incorrectly merged',
      'Fix: 1-click "Unmerge Ticket" override for human operators',
    ],
  },
];

function formatIST(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function TopBar() {
  const { state, dispatch } = useAppState();
  const [showHonestyModal, setShowHonestyModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(formatIST(new Date()));
    const interval = setInterval(() => {
      setCurrentTime(formatIST(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard accessibility: ESC key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHonestyModal) {
        setShowHonestyModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHonestyModal]);

  const handleTabClick = useCallback(
    (viewId: ViewId) => {
      dispatch({ type: 'SET_VIEW', payload: viewId });
    },
    [dispatch]
  );

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' });
  }, [dispatch]);

  const toggleModal = useCallback(() => {
    setShowHonestyModal((prev) => !prev);
  }, []);

  return (
    <>
      {/* Top Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5"
        style={{
          backgroundColor: '#111315',
          height: '56px',
          borderBottom: '1px solid #2a2d31',
        }}
      >
        {/* Left: Logo */}
        <div className="flex flex-col justify-center shrink-0">
          <h1 className="text-lg font-bold tracking-widest leading-tight">
            <span style={{ color: '#FF4F00' }}>ASTRA</span>
            <span style={{ color: '#F4F3EF' }}>-GRID</span>
          </h1>
          <span
            className="text-[9px] tracking-wider leading-none"
            style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}
          >
            MUNICIPAL TRIAGE &amp; CAUSAL INFRASTRUCTURE WORKBENCH
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav
          className="flex items-center gap-1 h-full"
          role="tablist"
          aria-label="Triage workbench stages"
        >
          {NAV_TABS.map((tab) => {
            const isActive = state.activeView === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`stage-panel-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  h-full px-4 text-xs font-medium uppercase tracking-wider
                  transition-colors duration-150 border-b-2
                  focus-visible:ring-2 focus-visible:ring-[#FF4F00] focus-visible:outline-none
                  ${
                    isActive
                      ? 'border-[#FF4F00] text-[#FF4F00]'
                      : 'border-transparent text-[#9CA3AF] hover:text-[#F4F3EF]'
                  }
                `}
                style={{ background: 'transparent' }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Action Buttons & Clock */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Honesty & Limits */}
          <button
            onClick={toggleModal}
            aria-label="Open Honesty and Architecture Limits Modal"
            aria-haspopup="dialog"
            aria-expanded={showHonestyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#FF4F00] focus-visible:outline-none"
            style={{
              color: '#F4F3EF',
              border: '1px solid #3a3d41',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF4F00';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3a3d41';
            }}
          >
            <Shield size={13} aria-hidden="true" />
            <span>Honesty &amp; Limits</span>
          </button>

          {/* Reset Demo */}
          <button
            onClick={handleReset}
            aria-label="Reset demo state and reseed 42 reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#FF4F00] focus-visible:outline-none"
            style={{
              color: '#F4F3EF',
              border: '1px solid #3a3d41',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF4F00';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3a3d41';
            }}
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Reset Demo</span>
          </button>

          {/* Live Clock IST */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
            aria-label="Indian Standard Time"
            role="status"
            aria-live="off"
            style={{
              color: '#F4F3EF',
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid #2a2d31',
              background: '#1a1d20',
              minWidth: '100px',
              justifyContent: 'center',
            }}
          >
            <Clock size={12} style={{ color: '#FF4F00' }} aria-hidden="true" />
            <span>{currentTime || '--:--:--'}</span>
            <span style={{ color: '#9CA3AF', fontSize: '9px' }}>IST</span>
          </div>
        </div>
      </header>

      {/* Honesty & Limitations Modal */}
      {showHonestyModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="honesty-modal-title"
          onClick={toggleModal}
        >
          <div
            className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl"
            style={{
              backgroundColor: '#111315',
              border: '1px solid #3a3d41',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 flex items-center justify-between px-6 py-4"
              style={{
                backgroundColor: '#111315',
                borderBottom: '1px solid #2a2d31',
              }}
            >
              <h2
                id="honesty-modal-title"
                className="text-lg font-semibold"
                style={{ color: '#F4F3EF' }}
              >
                ⚖️ Architecture Honesty &amp; Limitations
              </h2>
              <button
                onClick={toggleModal}
                aria-label="Close honesty modal"
                className="p-1 rounded transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#FF4F00] focus-visible:outline-none"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#F4F3EF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 flex flex-col gap-6">
              {HONESTY_SECTIONS.map((section) => (
                <div
                  key={section.title}
                  className="pl-4"
                  style={{ borderLeft: '3px solid #FF4F00' }}
                >
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: '#F4F3EF' }}
                  >
                    {section.icon} {section.title}
                  </h3>
                  <ul className="flex flex-col gap-1.5">
                    {section.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs leading-relaxed flex items-start gap-2"
                        style={{ color: '#9ca3af' }}
                      >
                        <span
                          className="mt-1.5 shrink-0 inline-block w-1 h-1 rounded-full"
                          style={{ backgroundColor: '#4b5563' }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div
              className="px-6 py-4"
              style={{ borderTop: '1px solid #2a2d31' }}
            >
              <button
                onClick={toggleModal}
                className="w-full py-2 rounded text-xs font-medium tracking-wider uppercase transition-colors duration-150"
                style={{
                  backgroundColor: '#FF4F00',
                  color: '#111315',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#e64500';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#FF4F00';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React from 'react';
import { Camera, CameraOff, Volume2, VolumeX, ShieldAlert } from 'lucide-react';

interface TopNavProps {
  activeTab: 'dashboard' | 'telemetry' | 'calibration' | 'overview' | 'guide';
  setActiveTab: (tab: 'dashboard' | 'telemetry' | 'calibration' | 'overview' | 'guide') => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerAlarmTest: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  isCameraActive,
  onToggleCamera,
  isMuted,
  onToggleMute,
  onTriggerAlarmTest,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#F2EBDD] border-b-2 border-[#111111] px-6 py-3.5 flex items-center justify-between gap-8">
      {/* Zone 1: Brand Wordmark (Single Text Element with Bauhaus Emblem) */}
      <a
        href="#dashboard"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('dashboard');
        }}
        className="text-2xl font-display tracking-tight text-[#111111] whitespace-nowrap shrink-0 flex items-center gap-3.5 hover:opacity-90 transition-opacity"
      >
        <span className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
          <span className="w-4 h-4 rounded-full bg-[#D7263D] border border-[#111111]" />
          <span className="w-4 h-4 bg-[#1E4CA1] border border-[#111111]" />
          <svg width="16" height="16" viewBox="0 0 100 100" className="overflow-visible">
            <polygon points="50,10 92,90 8,90" fill="#F4B400" stroke="#111111" strokeWidth="12" />
          </svg>
        </span>
        <span>AVISODRIVE</span>
      </a>

      {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
      <nav className="hidden lg:flex items-center gap-7 text-xs uppercase font-geometric font-bold tracking-widest text-[#111111]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-1 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#D7263D] underline font-black' : 'text-[#111111]'
          }`}
        >
          Live Dashboard
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`py-1 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'telemetry' ? 'text-[#1E4CA1] underline font-black' : 'text-[#111111]'
          }`}
        >
          EAR Telemetry
        </button>
        <button
          onClick={() => setActiveTab('calibration')}
          className={`py-1 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'calibration' ? 'text-[#F4B400] underline font-black' : 'text-[#111111]'
          }`}
        >
          Precision Calibration
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-1 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'overview' ? 'text-[#D7263D] underline font-black' : 'text-[#111111]'
          }`}
        >
          Project Overview
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`py-1 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'guide' ? 'text-[#1E4CA1] underline font-black' : 'text-[#111111]'
          }`}
        >
          Presentation Guide
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action (with compact sound controls) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Alarm' : 'Mute Audio Alarm'}
          className="p-2 border-2 border-[#111111] bg-white hover:bg-[#F2EBDD] text-[#111111] transition-colors shrink-0 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#D7263D]" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onTriggerAlarmTest}
          title="Emergency Sound Test"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-geometric font-bold uppercase border-2 border-[#111111] bg-[#F4B400] text-[#111111] hover:bg-[#e0a500] transition-colors shrink-0 cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Test Alarm</span>
        </button>

        <button
          onClick={onToggleCamera}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-geometric font-bold uppercase tracking-wider text-white border-2 border-[#111111] transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[2px_2px_0px_#111111] hover:shadow-[3px_3px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 ${
            isCameraActive ? 'bg-[#D7263D] hover:bg-[#c22035]' : 'bg-[#1E4CA1] hover:bg-[#183e85]'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

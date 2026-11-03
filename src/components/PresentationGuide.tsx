import React, { useState } from 'react';
import { BauhausCircle, BauhausSquare, BauhausTriangle, BauhausEmblem } from './GeometricShapes';
import { Presentation, CheckCircle, ArrowRight, Play, Eye, Bell, Activity, Compass } from 'lucide-react';

interface PresentationGuideProps {
  onJumpToDashboard: () => void;
  onRunDemoPreset: (preset: 'blink' | 'microsleep' | 'yawn' | 'nod') => void;
}

export const PresentationGuide: React.FC<PresentationGuideProps> = ({
  onJumpToDashboard,
  onRunDemoPreset,
}) => {
  const [activeSection, setActiveSection] = useState<'concept' | 'parameters' | 'demo' | 'bauhaus'>('concept');

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bauhaus-box p-5 bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#111111]">
          <div className="flex items-center gap-3">
            <BauhausEmblem />
            <div>
              <span className="text-[11px] font-mono-telemetry font-bold text-[#D7263D] uppercase">
                Academic & Industry Briefing
              </span>
              <h2 className="font-display text-xl sm:text-2xl text-[#111111] uppercase tracking-tight">
                AVISODRIVE: PROJECT OVERVIEW & PRESENTATION GUIDE
              </h2>
            </div>
          </div>

          <button
            onClick={onJumpToDashboard}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#111111] bg-[#1E4CA1] text-white font-geometric font-bold text-xs uppercase tracking-wider hover:bg-[#183e85] transition-colors cursor-pointer shadow-[2px_2px_0px_#111111]"
          >
            <span>Launch Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {[
            { id: 'concept', label: '1. Project Concept' },
            { id: 'parameters', label: '2. The 3 Key Parameters' },
            { id: 'demo', label: '3. Live Demo Features' },
            { id: 'bauhaus', label: '4. Bauhaus UI/UX Design' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`px-3 py-1.5 text-xs font-geometric font-bold uppercase border-2 border-[#111111] cursor-pointer transition-all ${
                activeSection === tab.id
                  ? 'bg-[#111111] text-white shadow-[2px_2px_0px_#D7263D]'
                  : 'bg-[#F2EBDD] text-[#111111] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: PROJECT CONCEPT */}
      {activeSection === 'concept' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bauhaus-box p-6 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[#111111] mb-4">
                <BauhausCircle size={18} color="#D7263D" />
                <h3 className="font-display text-base uppercase text-[#111111]">
                  THE CORE PROBLEM: MICRO-SLEEP
                </h3>
              </div>
              <p className="text-sm font-geometric text-[#111111] leading-relaxed mb-4">
                When drivers, students, or night-shift operators drive late at night, they frequently experience{' '}
                <strong>micro-sleep</strong>—a sudden, involuntary state of unconsciousness lasting from{' '}
                <span className="font-mono-telemetry font-bold text-[#D7263D]">2 to 5 seconds</span>.
              </p>
              <div className="p-4 bg-[#F2EBDD] border-2 border-[#111111] mb-4">
                <h4 className="font-display text-xs uppercase text-[#D7263D] mb-1">
                  Why Existing Safety Systems Fail:
                </h4>
                <p className="text-xs font-geometric text-[#111111]/90 leading-relaxed">
                  Conventional automotive systems trigger an alarm only <em>after</em> the driver's eyes have already shut or <em>after</em> the vehicle has drifted across highway lane markers. At 100 km/h, a 3-second micro-sleep carries a vehicle over <strong>83 meters completely unpiloted</strong>. Reacting post-closure is often fatal.
                </p>
              </div>
            </div>
          </div>

          <div className="bauhaus-box p-6 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[#111111] mb-4">
                <BauhausSquare size={18} color="#1E4CA1" />
                <h3 className="font-display text-base uppercase text-[#111111]">
                  THE AVISODRIVE SOLUTION: 2-5S PREDICTIVE LEAD
                </h3>
              </div>
              <p className="text-sm font-geometric text-[#111111] leading-relaxed mb-4">
                AVISODRIVE solves this fundamental timing deficit by predicting micro-sleep{' '}
                <strong className="text-[#1E4CA1]">2 to 5 seconds BEFORE</strong> the driver's eyes actually stay closed.
              </p>
              <div className="p-4 bg-[#1E4CA1]/10 border-2 border-[#1E4CA1] mb-4">
                <h4 className="font-display text-xs uppercase text-[#1E4CA1] mb-1">
                  How Prediction is Achieved:
                </h4>
                <p className="text-xs font-geometric text-[#111111]/90 leading-relaxed">
                  Before permanent eyelid lock occurs, the human nervous system displays involuntary neuromuscular degradation: blink recovery velocity decelerates, PERCLOS begins climbing, downward neck-muscle pitch nods occur, and prolonged mouth yawns release cortisol. AVISODRIVE cross-correlates these three biometric streams at 60 FPS.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: THE 3 KEY PARAMETERS */}
      {activeSection === 'parameters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameter 1 */}
          <div className="bauhaus-box p-5 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[#111111] mb-3">
                <BauhausCircle size={20} color="#D7263D" />
                <h4 className="font-display text-sm uppercase text-[#111111]">
                  01. Eye Aspect Ratio (EAR)
                </h4>
              </div>
              <p className="text-xs font-geometric text-[#111111]/90 mb-3 leading-relaxed">
                Measures instantaneous eye vertical aperture relative to horizontal inter-canthal width using 6 coordinates per eye:
              </p>
              <div className="p-3 bg-[#F2EBDD] border border-[#111111] font-mono-telemetry text-xs mb-3 text-center">
                EAR = (||p2 - p6|| + ||p3 - p5||) / (2 · ||p1 - p4||)
              </div>
              <ul className="text-xs font-geometric space-y-1.5 text-[#111111]/85">
                <li>• <strong>Alert Baseline:</strong> EAR ≈ 0.28 – 0.38</li>
                <li>• <strong>Blink Closure:</strong> EAR drops below 0.21</li>
                <li>• <strong>Drowsy Velocity:</strong> Recovery rate drops from 8.5 EAR/s down to &lt; 2.2 EAR/s</li>
              </ul>
            </div>
          </div>

          {/* Parameter 2 */}
          <div className="bauhaus-box p-5 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[#111111] mb-3">
                <BauhausTriangle size={20} color="#F4B400" />
                <h4 className="font-display text-sm uppercase text-[#111111]">
                  02. Yawn & Head-Nod Velocity
                </h4>
              </div>
              <p className="text-xs font-geometric text-[#111111]/90 mb-3 leading-relaxed">
                Tracks mouth opening frequency (MAR) and downward cervical spine nodding caused by muscular fatigue:
              </p>
              <div className="p-3 bg-[#F2EBDD] border border-[#111111] font-mono-telemetry text-xs mb-3 text-center">
                MAR = ||p_top - p_bottom|| / ||p_left - p_right||
              </div>
              <ul className="text-xs font-geometric space-y-1.5 text-[#111111]/85">
                <li>• <strong>Normal MAR:</strong> 0.15 – 0.30</li>
                <li>• <strong>Yawn Trigger:</strong> MAR &gt; 0.55 sustained for &gt; 1.2s</li>
                <li>• <strong>Head Nod:</strong> Downward pitch &gt; 14° indicates sudden loss of neck tonus</li>
              </ul>
            </div>
          </div>

          {/* Parameter 3 */}
          <div className="bauhaus-box p-5 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[#111111] mb-3">
                <BauhausSquare size={20} color="#1E4CA1" />
                <h4 className="font-display text-sm uppercase text-[#111111]">
                  03. PERCLOS Index
                </h4>
              </div>
              <p className="text-xs font-geometric text-[#111111]/90 mb-3 leading-relaxed">
                Percentage of Eye Closure over a moving temporal window (30 to 60 seconds). Globally recognized by NHTSA:
              </p>
              <div className="p-3 bg-[#F2EBDD] border border-[#111111] font-mono-telemetry text-xs mb-3 text-center">
                PERCLOS = (t_closure / t_window) × 100%
              </div>
              <ul className="text-xs font-geometric space-y-1.5 text-[#111111]/85">
                <li>• <strong>Alert State:</strong> PERCLOS &lt; 6%</li>
                <li>• <strong>Fatigue Warning:</strong> 6% – 15% (Yellow Alert)</li>
                <li>• <strong>Imminent Micro-Sleep:</strong> &gt; 15% (Red Critical Siren)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LIVE DEMO PROTOCOL */}
      {activeSection === 'demo' && (
        <div className="bauhaus-box p-6 bg-white">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-[#111111] mb-4">
            <Presentation className="w-5 h-5 text-[#D7263D]" />
            <h3 className="font-display text-base uppercase text-[#111111]">
              WEB DASHBOARD & DEMONSTRATION WALKTHROUGH
            </h3>
          </div>

          <p className="text-sm font-geometric text-[#111111] mb-6">
            During your project demo or viva presentation, showcase the three dynamic safety stages with real-time feedback:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Green State */}
            <div className="p-4 border-2 border-[#111111] bg-white">
              <div className="flex items-center gap-2 mb-2">
                <BauhausCircle size={16} color="#1E4CA1" />
                <span className="font-display text-xs uppercase text-[#1E4CA1]">Green: Alert</span>
              </div>
              <p className="text-xs font-geometric text-[#111111]/85">
                Normal active driving. Eyes tracked with Cobalt Blue calipers, steady EAR ~0.30, zero audio alert.
              </p>
            </div>

            {/* Yellow State */}
            <div className="p-4 border-2 border-[#111111] bg-[#F4B400]/20">
              <div className="flex items-center gap-2 mb-2">
                <BauhausTriangle size={16} color="#F4B400" />
                <span className="font-display text-xs uppercase text-[#111111]">Yellow: Warning</span>
              </div>
              <p className="text-xs font-geometric text-[#111111]/85">
                Early fatigue detected. Triggered by yawning or slow blinks. Rest advisory banner displays with gentle warning chime.
              </p>
            </div>

            {/* Red State */}
            <div className="p-4 border-2 border-[#111111] bg-[#D7263D]/20">
              <div className="flex items-center gap-2 mb-2">
                <BauhausSquare size={16} color="#D7263D" />
                <span className="font-display text-xs uppercase text-[#D7263D]">Red: Critical Alarm</span>
              </div>
              <p className="text-xs font-geometric text-[#111111]/85">
                Micro-sleep onset detected! Triggers loud Web Audio synthesizer siren, red flashing borders, and instant metric logging.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#F2EBDD] border border-[#111111]">
            <h4 className="font-display text-xs uppercase text-[#111111] mb-2">
              Instant One-Click Preset Demos for Judges & Audiences:
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  onRunDemoPreset('blink');
                  onJumpToDashboard();
                }}
                className="px-3 py-1.5 bg-[#D7263D] text-white text-xs font-geometric font-bold uppercase border border-[#111111] hover:bg-[#c22035] cursor-pointer"
              >
                Demonstrate Rapid Blink Alarm
              </button>
              <button
                onClick={() => {
                  onRunDemoPreset('microsleep');
                  onJumpToDashboard();
                }}
                className="px-3 py-1.5 bg-[#D7263D] text-white text-xs font-geometric font-bold uppercase border border-[#111111] hover:bg-[#c22035] cursor-pointer"
              >
                Demonstrate Micro-Sleep Episode (Eyes Shut 3s)
              </button>
              <button
                onClick={() => {
                  onRunDemoPreset('yawn');
                  onJumpToDashboard();
                }}
                className="px-3 py-1.5 bg-[#F4B400] text-[#111111] text-xs font-geometric font-bold uppercase border border-[#111111] hover:bg-[#e0a500] cursor-pointer"
              >
                Demonstrate Heavy Yawn
              </button>
              <button
                onClick={() => {
                  onRunDemoPreset('nod');
                  onJumpToDashboard();
                }}
                className="px-3 py-1.5 bg-[#F4B400] text-[#111111] text-xs font-geometric font-bold uppercase border border-[#111111] hover:bg-[#e0a500] cursor-pointer"
              >
                Demonstrate Head Nod / Droop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: BAUHAUS DESIGN PRINCIPLES */}
      {activeSection === 'bauhaus' && (
        <div className="bauhaus-box p-6 bg-white">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-[#111111] mb-4">
            <Compass className="w-5 h-5 text-[#1E4CA1]" />
            <h3 className="font-display text-base uppercase text-[#111111]">
              BAUHAUS MINIMALIST UI/UX ARCHITECTURE
            </h3>
          </div>

          <p className="text-sm font-geometric text-[#111111] mb-6">
            AVISODRIVE adopts the classic Walter Gropius & Wassily Kandinsky Bauhaus philosophy: <em>Form follows function</em>. Every shape, color, and typographic choice serves functional telemetry:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 border-2 border-[#111111] bg-[#F2EBDD]">
              <div className="flex items-center gap-2 mb-2">
                <BauhausCircle size={24} color="#D7263D" />
                <h4 className="font-display text-sm uppercase text-[#111111]">The Circle</h4>
              </div>
              <p className="text-xs font-geometric text-[#111111]/85">
                Represents continuous circular vision, eye pupils, and organic biological vigilance. Used for EAR dials, pupil calipers, and alertness gauges.
              </p>
            </div>

            <div className="p-4 border-2 border-[#111111] bg-[#F2EBDD]">
              <div className="flex items-center gap-2 mb-2">
                <BauhausSquare size={24} color="#1E4CA1" />
                <h4 className="font-display text-sm uppercase text-[#111111]">The Square</h4>
              </div>
              <p className="text-xs font-geometric text-[#111111]/85">
                Represents stability, constructivist precision, and algorithmic rigor. Used for modular telemetry tiles, camera framing, and tabular cards.
              </p>
            </div>

            <div className="p-4 border-2 border-[#111111] bg-[#F2EBDD]">
              <div className="flex items-center gap-2 mb-2">
                <BauhausTriangle size={24} color="#F4B400" />
                <h4 className="font-display text-sm uppercase text-[#111111]">The Triangle</h4>
              </div>
              <p className="text-xs font-geometric text-[#111111]/85">
                Represents tension, directional vector force, and urgency. Used for warning flags, head pitch vectors, and critical alarms.
              </p>
            </div>
          </div>

          <div className="p-4 border border-[#111111] bg-white">
            <h4 className="font-display text-xs uppercase text-[#111111] mb-2">
              Color Palette & Typographic Hierarchy:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono-telemetry mb-3">
              <div className="p-2 border border-[#111111] bg-[#F2EBDD]">
                <strong className="block">#F2EBDD</strong>
                <span className="text-[10px] text-[#111111]/70">Parchment Canvas</span>
              </div>
              <div className="p-2 border border-[#111111] bg-[#D7263D] text-white">
                <strong className="block">#D7263D</strong>
                <span className="text-[10px] text-white/80">Critical Alarm</span>
              </div>
              <div className="p-2 border border-[#111111] bg-[#F4B400] text-[#111111]">
                <strong className="block">#F4B400</strong>
                <span className="text-[10px] text-[#111111]/70">Fatigue Warning</span>
              </div>
              <div className="p-2 border border-[#111111] bg-[#1E4CA1] text-white">
                <strong className="block">#1E4CA1</strong>
                <span className="text-[10px] text-white/80">Cobalt Vigilance</span>
              </div>
              <div className="p-2 border border-[#111111] bg-[#111111] text-white">
                <strong className="block">#111111</strong>
                <span className="text-[10px] text-white/80">Constructivist Ink</span>
              </div>
            </div>
            <p className="text-xs font-geometric text-[#111111]/80">
              Typefaces: <strong>Archivo Black</strong> (Primary display titles), <strong>Josefin Sans / Futura</strong> (Geometric body copy), and <strong>Space Mono</strong> (Tabular telemetry data).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

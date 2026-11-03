import React from 'react';
import { FacialTelemetry, SystemConfig } from '../types';
import { BauhausCircle, BauhausSquare, BauhausTriangle } from './GeometricShapes';
import { Activity, Clock, Gauge, TrendingDown, Eye, AlertCircle } from 'lucide-react';

interface TelemetryChartsProps {
  telemetry: FacialTelemetry;
  config: SystemConfig;
  earHistory: number[]; // Array of last 60 EAR values
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  telemetry,
  config,
  earHistory,
}) => {
  const {
    avgEar,
    leftEar,
    rightEar,
    earBaseline,
    blinkVelocity,
    blinkDurationMs,
    blinkRatePerMin,
    mar,
    headPitch,
    nodVelocity,
    perclos,
    alertnessScore,
    microSleepRisk,
    timeToMicroSleepSec,
  } = telemetry;

  // SVG dimensions for real-time EAR wave
  const svgWidth = 420;
  const svgHeight = 120;
  const minEar = 0.05;
  const maxEar = 0.42;

  // Build SVG polyline points from earHistory
  const points = earHistory
    .map((val, idx) => {
      const x = (idx / Math.max(1, earHistory.length - 1)) * svgWidth;
      const normalizedY = Math.max(0, Math.min(1, (val - minEar) / (maxEar - minEar)));
      const y = svgHeight - normalizedY * (svgHeight - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Calculate threshold Y coordinate
  const thresholdNormalized = (config.earThreshold - minEar) / (maxEar - minEar);
  const thresholdY = svgHeight - thresholdNormalized * (svgHeight - 16) - 8;

  // Calculate baseline Y coordinate
  const baselineNormalized = (earBaseline - minEar) / (maxEar - minEar);
  const baselineY = svgHeight - baselineNormalized * (svgHeight - 16) - 8;

  return (
    <div className="flex flex-col gap-4">
      {/* SECTION 1: LIVE TIME-SERIES EAR TELEMETRY CHART */}
      <div className="bauhaus-box p-4 bg-white">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111] mb-3">
          <div className="flex items-center gap-2">
            <BauhausCircle size={16} color="#D7263D" />
            <h3 className="font-display text-sm tracking-wider uppercase text-[#111111]">
              REAL-TIME EAR (EYE ASPECT RATIO) WAVEFORM
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono-telemetry">
            <span className="flex items-center gap-1.5 text-[#1E4CA1]">
              <span className="w-2.5 h-0.5 bg-[#1E4CA1]" />
              <span>BASELINE {earBaseline.toFixed(2)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#D7263D]">
              <span className="w-2.5 h-0.5 bg-[#D7263D]" />
              <span>TRIGGER {config.earThreshold.toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* The Waveform Canvas / SVG Container */}
        <div className="relative w-full h-[120px] bg-[#111111] border-2 border-[#111111] overflow-hidden">
          {/* Subtle grid lines */}
          <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            {/* Grid background lines */}
            <line x1="0" y1="30" x2={svgWidth} y2="30" stroke="#222222" strokeWidth="1" />
            <line x1="0" y1="60" x2={svgWidth} y2="60" stroke="#222222" strokeWidth="1" />
            <line x1="0" y1="90" x2={svgWidth} y2="90" stroke="#222222" strokeWidth="1" />

            {/* Threshold line in Bauhaus Red */}
            <line
              x1="0"
              y1={thresholdY}
              x2={svgWidth}
              y2={thresholdY}
              stroke="#D7263D"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Baseline line in Bauhaus Blue */}
            <line
              x1="0"
              y1={baselineY}
              x2={svgWidth}
              y2={baselineY}
              stroke="#1E4CA1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />

            {/* Real-time continuous curve */}
            {earHistory.length > 1 && (
              <polyline
                fill="none"
                stroke={avgEar < config.earThreshold ? '#D7263D' : '#F2EBDD'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            )}
          </svg>

          {/* Real-time floating current EAR badge on chart */}
          <div className="absolute top-2 right-2 bg-[#F2EBDD] border border-[#111111] px-2 py-0.5 text-xs font-mono-telemetry font-bold text-[#111111]">
            EAR: <span className={avgEar < config.earThreshold ? 'text-[#D7263D]' : 'text-[#1E4CA1]'}>{avgEar.toFixed(3)}</span>
          </div>
        </div>

        {/* Timing and Blink Velocity strip below waveform */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs font-mono-telemetry">
          <div className="p-2 border border-[#111111] bg-[#F2EBDD]">
            <span className="text-[10px] uppercase text-[#111111]/70 block">Closure Latency</span>
            <strong className="text-sm font-bold text-[#111111]">{blinkDurationMs} ms</strong>
          </div>
          <div className="p-2 border border-[#111111] bg-[#F2EBDD]">
            <span className="text-[10px] uppercase text-[#111111]/70 block">Blink Velocity</span>
            <strong className="text-sm font-bold text-[#111111]">{blinkVelocity} EAR/s</strong>
          </div>
          <div className="p-2 border border-[#111111] bg-[#F2EBDD]">
            <span className="text-[10px] uppercase text-[#111111]/70 block">Blink Frequency</span>
            <strong className="text-sm font-bold text-[#111111]">{blinkRatePerMin} / min</strong>
          </div>
          <div className="p-2 border border-[#111111] bg-[#F2EBDD]">
            <span className="text-[10px] uppercase text-[#111111]/70 block">Eye Symmetry</span>
            <strong className="text-sm font-bold text-[#111111]">
              L:{leftEar.toFixed(2)} · R:{rightEar.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* SECTION 2: THE 3 KEY PARAMETERS (BAUHAUS 3-COLUMN METRICS GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PARAMETER 1: EYE ASPECT RATIO (EAR) */}
        <div className="bauhaus-box p-4 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111] mb-2">
              <div className="flex items-center gap-1.5">
                <BauhausCircle size={14} color="#D7263D" />
                <span className="font-display text-xs tracking-wider uppercase text-[#111111]">
                  PARAMETER 01
                </span>
              </div>
              <span className="text-[10px] font-mono-telemetry font-bold text-[#D7263D]">
                PRIMARY METRIC
              </span>
            </div>

            <h4 className="font-display text-base text-[#111111]">EYE ASPECT RATIO (EAR)</h4>
            <p className="text-xs font-geometric text-[#111111]/80 mt-1">
              Geometric ratio of eye height to horizontal width. As drowsiness sets in, blink velocity slows down.
            </p>

            <div className="my-3 p-3 bg-[#F2EBDD] border border-[#111111] flex items-baseline justify-between">
              <span className="text-xs uppercase font-geometric font-bold text-[#111111]/70">Live EAR Value</span>
              <span className="text-3xl font-display font-black text-[#111111] tracking-tight">
                {avgEar.toFixed(3)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono-telemetry text-[#111111]/90">
              <div className="flex justify-between border-b border-[#111111]/10 pb-1">
                <span>Baseline EAR</span>
                <span className="font-bold">{earBaseline.toFixed(3)}</span>
              </div>
              <div className="flex justify-between border-b border-[#111111]/10 pb-1">
                <span>Alarm EAR Threshold</span>
                <span className="font-bold text-[#D7263D]">{config.earThreshold.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-bold ${avgEar < config.earThreshold ? 'text-[#D7263D]' : 'text-[#1E4CA1]'}`}>
                  {avgEar < config.earThreshold ? 'EYE CLOSED / BLINK' : 'EYE OPEN'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PARAMETER 2: YAWN & HEAD-NOD VELOCITY */}
        <div className="bauhaus-box p-4 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111] mb-2">
              <div className="flex items-center gap-1.5">
                <BauhausTriangle size={14} color="#F4B400" />
                <span className="font-display text-xs tracking-wider uppercase text-[#111111]">
                  PARAMETER 02
                </span>
              </div>
              <span className="text-[10px] font-mono-telemetry font-bold text-[#F4B400]">
                FATIGUE VECTOR
              </span>
            </div>

            <h4 className="font-display text-base text-[#111111]">YAWN & HEAD-NOD</h4>
            <p className="text-xs font-geometric text-[#111111]/80 mt-1">
              Mouth aperture frequency (MAR) and downward neck tilt velocity caused by sleepiness muscle fatigue.
            </p>

            <div className="my-3 p-3 bg-[#F2EBDD] border border-[#111111] flex items-baseline justify-between">
              <span className="text-xs uppercase font-geometric font-bold text-[#111111]/70">Mouth MAR / Head Pitch</span>
              <span className="text-2xl font-display font-black text-[#111111] tracking-tight">
                {mar.toFixed(2)} <span className="text-xs font-mono-telemetry text-[#111111]/60">/ {headPitch}°</span>
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono-telemetry text-[#111111]/90">
              <div className="flex justify-between border-b border-[#111111]/10 pb-1">
                <span>Yawn Frequency</span>
                <span className="font-bold">{telemetry.yawnCount} recorded</span>
              </div>
              <div className="flex justify-between border-b border-[#111111]/10 pb-1">
                <span>Head Nod Velocity</span>
                <span className="font-bold">{nodVelocity} deg/s</span>
              </div>
              <div className="flex justify-between">
                <span>Neck Muscle Status</span>
                <span className={`font-bold ${telemetry.isHeadNodding ? 'text-[#D7263D]' : 'text-[#1E4CA1]'}`}>
                  {telemetry.isHeadNodding ? 'DOWNWARD NOD DROOP' : 'UPRIGHT POSTURE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PARAMETER 3: PERCLOS INDEX */}
        <div className="bauhaus-box p-4 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#111111] mb-2">
              <div className="flex items-center gap-1.5">
                <BauhausSquare size={14} color="#1E4CA1" />
                <span className="font-display text-xs tracking-wider uppercase text-[#111111]">
                  PARAMETER 03
                </span>
              </div>
              <span className="text-[10px] font-mono-telemetry font-bold text-[#1E4CA1]">
                CUMULATIVE
              </span>
            </div>

            <h4 className="font-display text-base text-[#111111]">PERCLOS INDEX</h4>
            <p className="text-xs font-geometric text-[#111111]/80 mt-1">
              Percentage of Eye Closure over moving window. Gold standard metric for pre-sleep drowsiness.
            </p>

            <div className="my-3 p-3 bg-[#F2EBDD] border border-[#111111] flex items-baseline justify-between">
              <span className="text-xs uppercase font-geometric font-bold text-[#111111]/70">PERCLOS %</span>
              <span className="text-3xl font-display font-black text-[#111111] tracking-tight">
                {perclos.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono-telemetry text-[#111111]/90">
              <div className="flex justify-between border-b border-[#111111]/10 pb-1">
                <span>Drowsiness Risk</span>
                <span className="font-bold text-[#D7263D]">{microSleepRisk}%</span>
              </div>
              <div className="flex justify-between border-b border-[#111111]/10 pb-1">
                <span>Pre-Sleep Warning Window</span>
                <span className="font-bold text-[#1E4CA1]">{timeToMicroSleepSec}s ahead</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Alertness Score</span>
                <span className="font-bold text-[#111111]">{alertnessScore} / 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { FacialTelemetry, BlinkAlarmMode } from '../types';
import { BauhausCircle, BauhausSquare, BauhausTriangle } from './GeometricShapes';
import { AlertTriangle, BellRing, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  telemetry: FacialTelemetry;
  blinkAlarmMode: BlinkAlarmMode;
  isAlarmPlaying: boolean;
  onDisarmAlarm?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  telemetry,
  blinkAlarmMode,
  isAlarmPlaying,
  onDisarmAlarm,
}) => {
  const { alertLevel, avgEar, earBaseline, isBlinking, blinkDurationMs, microSleepRisk } = telemetry;

  // Bauhaus status styling
  if (alertLevel === 'CRITICAL') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full bg-[#D7263D] text-white border-2 border-[#111111] p-4 sm:p-5 shadow-[4px_4px_0px_#111111] animate-pulse transition-all"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Bauhaus Red Square Primitive */}
            <BauhausSquare size={36} color="#ffffff" borderColor="#111111">
              <span className="w-4 h-4 bg-[#D7263D]" />
            </BauhausSquare>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-geometric font-black bg-[#111111] text-white px-2 py-0.5">
                  Critical Alarm
                </span>
                <span className="text-xs font-mono-telemetry font-bold text-white/90">
                  {blinkAlarmMode === 'instant' ? 'Instant Blink Trigger Mode' : 'Micro-Sleep Pre-Closure Trigger'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display uppercase tracking-tight text-white mt-0.5">
                {isBlinking
                  ? `EYE CLOSURE DETECTED (${blinkDurationMs}ms)`
                  : 'MICRO-SLEEP RISK EXCEEDED (CRITICAL)'}
              </h2>
              <p className="text-xs sm:text-sm font-geometric text-white/90 mt-0.5">
                Current EAR: <span className="font-mono-telemetry font-bold">{avgEar.toFixed(3)}</span> (Baseline:{' '}
                {earBaseline.toFixed(3)}) · Micro-Sleep Hazard:{' '}
                <span className="font-mono-telemetry font-bold">{microSleepRisk}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-[#111111] text-white px-3 py-1.5 border border-white text-xs font-mono-telemetry">
              <BellRing className="w-4 h-4 text-[#F4B400] animate-bounce" />
              <span>SIREN ACTIVE</span>
            </div>

            {onDisarmAlarm && isAlarmPlaying && (
              <button
                onClick={onDisarmAlarm}
                className="px-3 py-1.5 text-xs font-geometric font-bold uppercase tracking-wider bg-white text-[#111111] border-2 border-[#111111] hover:bg-[#F2EBDD] cursor-pointer"
              >
                Mute Alarm
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (alertLevel === 'WARNING') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="w-full bg-[#F4B400] text-[#111111] border-2 border-[#111111] p-4 sm:p-5 shadow-[4px_4px_0px_#111111] transition-all"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Bauhaus Yellow Triangle Primitive */}
            <BauhausTriangle size={36} color="#111111" borderColor="#111111" direction="up" />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-geometric font-black bg-[#111111] text-[#F4B400] px-2 py-0.5">
                  Early Warning
                </span>
                <span className="text-xs font-mono-telemetry font-bold text-[#111111]/80">
                  Pre-Sleep Fatigue Detected (2-5s Advantage)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display uppercase tracking-tight text-[#111111] mt-0.5">
                {telemetry.isYawning
                  ? 'FREQUENT YAWN & MOUTH APERTURE'
                  : telemetry.isHeadNodding
                  ? 'HEAD NOD VELOCITY DRIFT'
                  : 'BLINK RECOVERY VELOCITY SLOWING'}
              </h2>
              <p className="text-xs sm:text-sm font-geometric text-[#111111]/90 mt-0.5">
                Blink Speed: <span className="font-mono-telemetry font-bold">{telemetry.blinkVelocity} EAR/s</span> · PERCLOS:{' '}
                <span className="font-mono-telemetry font-bold">{telemetry.perclos}%</span> · Alertness Index:{' '}
                <span className="font-mono-telemetry font-bold">{telemetry.alertnessScore}/100</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#111111] text-[#F4B400] px-3 py-1.5 border border-[#111111] text-xs font-mono-telemetry shrink-0">
            <AlertTriangle className="w-4 h-4" />
            <span>REST ADVISORY</span>
          </div>
        </div>
      </div>
    );
  }

  // Normal Alert (Green / Bauhaus Cobalt Blue)
  return (
    <div className="w-full bg-white text-[#111111] border-2 border-[#111111] p-4 sm:p-5 shadow-[4px_4px_0px_#111111] transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Bauhaus Blue Circle Primitive */}
          <BauhausCircle size={36} color="#1E4CA1" borderColor="#111111">
            <div className="w-3.5 h-3.5 rounded-full bg-white" />
          </BauhausCircle>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-geometric font-black bg-[#1E4CA1] text-white px-2 py-0.5">
                Active & Alert
              </span>
              <span className="text-xs font-mono-telemetry text-[#111111]/70">
                Driver Vigilance Optimal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display uppercase tracking-tight text-[#111111] mt-0.5">
              NORMAL DRIVING STATE MAINTAINED
            </h2>
            <p className="text-xs sm:text-sm font-geometric text-[#111111]/80 mt-0.5">
              Live EAR: <span className="font-mono-telemetry font-bold text-[#1E4CA1]">{avgEar.toFixed(3)}</span> · Blink
              Rate: <span className="font-mono-telemetry font-bold">{telemetry.blinkRatePerMin} /min</span> · PERCLOS:{' '}
              <span className="font-mono-telemetry font-bold">{telemetry.perclos}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-telemetry text-[#1E4CA1] border border-[#1E4CA1] px-3 py-1.5 bg-[#1E4CA1]/5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[#1E4CA1]" />
          <span>REAL-TIME 60FPS TELEMETRY</span>
        </div>
      </div>
    </div>
  );
};

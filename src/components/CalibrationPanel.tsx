import React from 'react';
import { SystemConfig, FacialTelemetry, CalibrationData } from '../types';
import { BauhausCircle, BauhausSquare, BauhausTriangle } from './GeometricShapes';
import { Sliders, Volume2, ShieldCheck, Zap, Crosshair, Play, Eye } from 'lucide-react';

interface CalibrationPanelProps {
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  telemetry: FacialTelemetry;
  calibration: CalibrationData;
  onStartCalibration: () => void;
  onTestAudio: () => void;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  config,
  setConfig,
  telemetry,
  calibration,
  onStartCalibration,
  onTestAudio,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="bauhaus-box p-4 bg-white">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
          <div className="flex items-center gap-2">
            <BauhausSquare size={18} color="#D7263D" />
            <h3 className="font-display text-base tracking-wider uppercase text-[#111111]">
              PRECISION CALIBRATION & TIMING MATRIX
            </h3>
          </div>
          <span className="text-xs font-mono-telemetry bg-[#D7263D] text-white px-2 py-0.5 font-bold">
            ACCURACY CALIBRATOR
          </span>
        </div>
        <p className="text-xs sm:text-sm font-geometric text-[#111111]/80 mt-2">
          Tune algorithmic thresholds, blink detection sensitivity, and micro-sleep predictive lead time with millisecond precision.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: BLINK ALARM ACCURACY & TIMING MODE */}
        <div className="bauhaus-box p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111] mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D7263D]" />
                <h4 className="font-display text-sm uppercase text-[#111111]">
                  BLINK DETECTION TIMING MODE
                </h4>
              </div>
              <span className="text-[11px] font-mono-telemetry font-bold text-[#1E4CA1]">
                CORE SENSITIVITY
              </span>
            </div>

            <p className="text-xs font-geometric text-[#111111]/80 mb-4">
              Select between instantaneous blink verification or predictive micro-sleep driver safety mode:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {/* Option A: Instant Blink Trigger */}
              <button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    blinkAlarmMode: 'instant',
                    instantAlarmDelayMs: 0,
                  }))
                }
                className={`p-3 text-left border-2 border-[#111111] transition-all cursor-pointer ${
                  config.blinkAlarmMode === 'instant'
                    ? 'bg-[#D7263D] text-white shadow-[3px_3px_0px_#111111]'
                    : 'bg-[#F2EBDD] text-[#111111] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-xs uppercase tracking-wide">
                    Instant Blink Alarm
                  </span>
                  <BauhausCircle size={10} color={config.blinkAlarmMode === 'instant' ? '#ffffff' : '#D7263D'} />
                </div>
                <p className="text-[11px] font-geometric opacity-90">
                  Every blink instantly triggers Red Alert & siren (&lt; 30ms latency). Ideal for live demonstrations.
                </p>
              </button>

              {/* Option B: Predictive Micro-Sleep Mode */}
              <button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    blinkAlarmMode: 'predictive',
                  }))
                }
                className={`p-3 text-left border-2 border-[#111111] transition-all cursor-pointer ${
                  config.blinkAlarmMode === 'predictive'
                    ? 'bg-[#1E4CA1] text-white shadow-[3px_3px_0px_#111111]'
                    : 'bg-[#F2EBDD] text-[#111111] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-xs uppercase tracking-wide">
                    Micro-Sleep Predictive
                  </span>
                  <BauhausSquare size={10} color={config.blinkAlarmMode === 'predictive' ? '#ffffff' : '#1E4CA1'} />
                </div>
                <p className="text-[11px] font-geometric opacity-90">
                  Detects micro-sleep 2 to 5 seconds before eyes lock shut. Allows normal quick blinks.
                </p>
              </button>
            </div>

            {/* Micro-sleep trigger delay slider */}
            {config.blinkAlarmMode === 'predictive' ? (
              <div className="p-3 bg-[#F2EBDD] border border-[#111111] mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-geometric font-bold uppercase text-[#111111]">
                    Continuous Eye Closure Trigger Latency
                  </label>
                  <span className="text-xs font-mono-telemetry font-bold text-[#D7263D]">
                    {config.microSleepDelayMs} ms ({ (config.microSleepDelayMs / 1000).toFixed(1) }s)
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={config.microSleepDelayMs}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      microSleepDelayMs: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#D7263D] cursor-pointer"
                />
                <span className="text-[10px] font-mono-telemetry text-[#111111]/70 block mt-1">
                  Standard micro-sleep duration is 2.0s to 5.0s. Alarms trigger once closure exceeds this delay.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#F2EBDD] border border-[#111111] mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-geometric font-bold uppercase text-[#111111]">
                    Instant Trigger Frame Buffer
                  </label>
                  <span className="text-xs font-mono-telemetry font-bold text-[#D7263D]">
                    {config.instantAlarmDelayMs} ms (Zero Frame Delay)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="25"
                  value={config.instantAlarmDelayMs}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      instantAlarmDelayMs: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#D7263D] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Automated 5-Second Eye Calibrator */}
          <div className="pt-4 border-t-2 border-[#111111]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h5 className="font-display text-xs uppercase text-[#111111] flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-[#1E4CA1]" />
                  <span>5-Second Personalized Calibration</span>
                </h5>
                <p className="text-[11px] font-geometric text-[#111111]/80 mt-0.5">
                  Measures your natural open-eye geometry to optimize EAR threshold.
                </p>
              </div>

              <button
                onClick={onStartCalibration}
                disabled={calibration.isCalibrating}
                className="w-full sm:w-auto px-4 py-2 border-2 border-[#111111] bg-[#1E4CA1] text-white font-geometric font-bold text-xs uppercase tracking-wider hover:bg-[#183e85] disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_#111111]"
              >
                {calibration.isCalibrating ? `Calibrating (${calibration.progressPercent}%)` : 'Run 5s Auto-Calibrate'}
              </button>
            </div>

            {calibration.isCalibrating && (
              <div className="w-full bg-[#111111] h-2 mt-2 border border-[#111111] overflow-hidden">
                <div
                  className="bg-[#D7263D] h-full transition-all duration-100"
                  style={{ width: `${calibration.progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: EAR THRESHOLD TUNER & AUDIO SYNTHESIZER */}
        <div className="bauhaus-box p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111] mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#1E4CA1]" />
                <h4 className="font-display text-sm uppercase text-[#111111]">
                  EAR THRESHOLD & AUDIO CONFIGURATION
                </h4>
              </div>
              <span className="text-[11px] font-mono-telemetry font-bold text-[#D7263D]">
                PHYSICAL SPECS
              </span>
            </div>

            {/* Real-time comparison bar: Live EAR vs Threshold */}
            <div className="p-3 bg-[#F2EBDD] border border-[#111111] mb-5">
              <div className="flex justify-between items-center mb-1 text-xs font-mono-telemetry font-bold">
                <span>LIVE EYE EAR: <strong className="text-[#1E4CA1]">{telemetry.avgEar.toFixed(3)}</strong></span>
                <span>THRESHOLD: <strong className="text-[#D7263D]">{config.earThreshold.toFixed(3)}</strong></span>
              </div>

              <div className="relative w-full h-5 bg-[#111111] border border-[#111111] overflow-hidden my-2">
                {/* Live EAR meter width */}
                <div
                  className={`h-full transition-all duration-75 ${
                    telemetry.avgEar < config.earThreshold ? 'bg-[#D7263D]' : 'bg-[#1E4CA1]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (telemetry.avgEar / 0.45) * 100))}%` }}
                />
                {/* Threshold vertical tick line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-[#F4B400] z-10"
                  style={{ left: `${(config.earThreshold / 0.45) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono-telemetry text-[#111111]/70">
                <span>0.00 (Closed)</span>
                <span className="text-[#F4B400] font-bold">▲ Cutoff Trigger</span>
                <span>0.45 (Wide Open)</span>
              </div>
            </div>

            {/* Slider for EAR Threshold */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1 text-xs font-geometric font-bold uppercase">
                <label>EAR Closure Threshold Sensitivity</label>
                <span className="font-mono-telemetry font-bold text-[#D7263D]">
                  {config.earThreshold.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0.160"
                max="0.320"
                step="0.005"
                value={config.earThreshold}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    earThreshold: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#D7263D] cursor-pointer"
              />
              <span className="text-[10px] font-mono-telemetry text-[#111111]/70 block mt-0.5">
                Increase if blinks are missed; decrease if natural squints trigger false alarms.
              </span>
            </div>

            {/* Audio Alarm Synthesizer Tuning */}
            <div className="space-y-3 pt-3 border-t border-[#111111]/20">
              <div className="flex justify-between items-center">
                <label className="text-xs font-geometric font-bold uppercase text-[#111111] flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#D7263D]" />
                  <span>Auditory Alarm Volume</span>
                </label>
                <span className="text-xs font-mono-telemetry font-bold">
                  {Math.round(config.alarmVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.alarmVolume}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    alarmVolume: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#111111] cursor-pointer"
              />

              {/* Sound Type Selection */}
              <div className="flex items-center gap-2 pt-1">
                {(['siren', 'pulse', 'chime'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setConfig((prev) => ({ ...prev, soundType: type }))}
                    className={`flex-1 py-1.5 text-xs font-geometric font-bold uppercase border-2 border-[#111111] cursor-pointer transition-colors ${
                      config.soundType === type
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#F2EBDD] text-[#111111] hover:bg-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Sound Button */}
          <div className="pt-4 border-t-2 border-[#111111] mt-4">
            <button
              onClick={onTestAudio}
              className="w-full py-2.5 border-2 border-[#111111] bg-[#F4B400] text-[#111111] font-display font-bold text-xs uppercase tracking-wider hover:bg-[#e0a500] cursor-pointer flex items-center justify-center gap-2 shadow-[2px_2px_0px_#111111]"
            >
              <Play className="w-4 h-4 fill-[#111111]" />
              <span>TEST EMERGENCY AUDIO ALARM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

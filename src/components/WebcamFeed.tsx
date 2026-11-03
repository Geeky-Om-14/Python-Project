import React, { useRef, useEffect } from 'react';
import { DetectionOutput } from '../services/faceDetector';
import { FacialTelemetry, SystemConfig } from '../types';
import { BauhausCircle, BauhausSquare, BauhausTriangle } from './GeometricShapes';
import { Eye, Layers, RefreshCw, Sparkles, Video, VideoOff } from 'lucide-react';

interface WebcamFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  detection: DetectionOutput;
  telemetry: FacialTelemetry;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  simulationScenario: string;
  onSelectSimulation: (scenario: 'none' | 'normal' | 'blink' | 'microsleep' | 'yawn' | 'nod') => void;
  onStartCalibration: () => void;
}

export const WebcamFeed: React.FC<WebcamFeedProps> = ({
  videoRef,
  detection,
  telemetry,
  config,
  setConfig,
  isCameraActive,
  onToggleCamera,
  simulationScenario,
  onSelectSimulation,
  onStartCalibration,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render facial mesh and Bauhaus HUD overlays onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // If camera is off and not in simulation, show clean Bauhaus standby state
    if (!isCameraActive && simulationScenario === 'none') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, w, h);

      // Bauhaus grid lines
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Standby emblem
      ctx.fillStyle = '#F2EBDD';
      ctx.font = 'bold 16px "Archivo Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAMERA STANDBY // CLICK START OR RUN SIMULATION', w / 2, h / 2 + 10);
      return;
    }

    if (!detection.hasFace) {
      // Searching for face indicator
      ctx.fillStyle = 'rgba(17, 17, 17, 0.4)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#F4B400';
      ctx.font = 'bold 14px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SEARCHING DRIVER FACE LANDMARKS...', w / 2, h / 2);
      return;
    }

    const { leftEye, rightEye, mouth, noseTip, chin, landmarks } = detection;
    const isClosed = telemetry.avgEar < config.earThreshold;

    // 1. Draw Facial Mesh Connections (if enabled)
    if (config.showMeshOverlay && landmarks && landmarks.length > 0) {
      ctx.strokeStyle = isClosed ? '#D7263D' : '#1E4CA1';
      ctx.lineWidth = 1.5;

      // Draw Eye Outlines
      const drawClosedLoop = (pts: { x: number; y: number }[], strokeColor: string, fillColor?: string) => {
        if (!pts || pts.length < 3) return;
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        if (fillColor) ctx.fillStyle = fillColor;
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * w, pts[i].y * h);
        }
        ctx.closePath();
        ctx.stroke();
        if (fillColor) ctx.fill();
      };

      // Left Eye
      drawClosedLoop(leftEye, isClosed ? '#D7263D' : '#1E4CA1', isClosed ? 'rgba(215, 38, 61, 0.25)' : 'rgba(30, 76, 161, 0.15)');

      // Right Eye
      drawClosedLoop(rightEye, isClosed ? '#D7263D' : '#1E4CA1', isClosed ? 'rgba(215, 38, 61, 0.25)' : 'rgba(30, 76, 161, 0.15)');

      // Mouth Loop
      drawClosedLoop(
        mouth,
        telemetry.isYawning ? '#F4B400' : '#111111',
        telemetry.isYawning ? 'rgba(244, 180, 0, 0.25)' : undefined
      );

      // Connect Nose to Chin (Head vertical vector)
      if (noseTip && chin) {
        ctx.beginPath();
        ctx.strokeStyle = telemetry.isHeadNodding ? '#D7263D' : '#1E4CA1';
        ctx.lineWidth = 2;
        ctx.moveTo(noseTip.x * w, noseTip.y * h);
        ctx.lineTo(chin.x * w, chin.y * h);
        ctx.stroke();
      }

      // Draw all 68 landmark points
      if (config.showLandmarkPoints) {
        ctx.fillStyle = isClosed ? '#D7263D' : '#1E4CA1';
        for (const pt of landmarks) {
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Precision EAR Caliper Over Eyes
    if (leftEye.length > 0 && rightEye.length > 0) {
      const lx = (leftEye[0].x + leftEye[3].x) / 2 * w;
      const ly = (leftEye[0].y + leftEye[3].y) / 2 * h;
      const rx = (rightEye[0].x + rightEye[3].x) / 2 * w;
      const ry = (rightEye[0].y + rightEye[3].y) / 2 * h;

      // Bauhaus crosshairs on pupils
      const drawCrosshair = (cx: number, cy: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        const s = 10;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy);
        ctx.lineTo(cx + s, cy);
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx, cy + s);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();
      };

      const eyeColor = isClosed ? '#D7263D' : '#1E4CA1';
      drawCrosshair(lx, ly, eyeColor);
      drawCrosshair(rx, ry, eyeColor);

      // Floating Live EAR Box between the eyes
      const midX = (lx + rx) / 2;
      const midY = (ly + ry) / 2 - 28;

      ctx.fillStyle = isClosed ? '#D7263D' : '#111111';
      ctx.fillRect(midX - 52, midY - 14, 104, 24);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - 52, midY - 14, 104, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isClosed ? `BLINK ${telemetry.avgEar.toFixed(3)}` : `EAR: ${telemetry.avgEar.toFixed(3)}`,
        midX,
        midY + 3
      );
    }

    // 3. Floating Yawn / MAR Box near mouth
    if (mouth.length > 0 && (telemetry.isYawning || telemetry.mar > 0.4)) {
      const mx = mouth[0].x * w;
      const my = mouth[0].y * h + 30;
      ctx.fillStyle = '#F4B400';
      ctx.fillRect(mx - 45, my - 12, 90, 22);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx - 45, my - 12, 90, 22);

      ctx.fillStyle = '#111111';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`MAR: ${telemetry.mar.toFixed(3)}`, mx, my + 4);
    }
  }, [detection, telemetry, config, isCameraActive, simulationScenario]);

  return (
    <div className="bauhaus-box p-4 bg-white flex flex-col justify-between">
      {/* Header bar of video module */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111] mb-3">
        <div className="flex items-center gap-2">
          <BauhausSquare size={16} color="#1E4CA1" />
          <h3 className="font-display text-sm tracking-wider uppercase text-[#111111]">
            FACIAL LANDMARK VISION FEED
          </h3>
        </div>

        {/* Engine and status markers */}
        <div className="flex items-center gap-3 text-xs font-mono-telemetry">
          <span className="hidden sm:inline text-xs text-[#111111]/70">
            ENGINE: <strong className="text-[#1E4CA1] uppercase">{detection.engine}</strong>
          </span>
          <span className="text-xs font-bold text-[#111111] bg-[#F2EBDD] border border-[#111111] px-2 py-0.5">
            {detection.hasFace ? 'FACE TRACKED' : 'NO TARGET'}
          </span>
        </div>
      </div>

      {/* Main Video & Canvas Container */}
      <div className="relative aspect-4/3 w-full bg-[#111111] border-2 border-[#111111] overflow-hidden flex items-center justify-center">
        {/* 4 Bauhaus Geometric Framing Corners */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
          <BauhausCircle size={14} color="#D7263D" />
        </div>
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          <BauhausSquare size={14} color="#1E4CA1" />
        </div>
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
          <BauhausTriangle size={14} color="#F4B400" direction="up" />
        </div>
        <div className="absolute bottom-2 right-2 z-20 pointer-events-none text-white text-xs font-mono-telemetry font-black">
          +
        </div>

        {/* Video Element (mirrored) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover scale-x-[-1] ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Canvas Landmark Overlay (mirrored to match video) */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-x-[-1] z-10"
        />

        {/* Instant Alert Flash Rim */}
        {telemetry.alertLevel === 'CRITICAL' && (
          <div className="absolute inset-0 border-4 border-[#D7263D] z-30 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Control Strip & Simulation Switchers */}
      <div className="mt-3 pt-3 border-t-2 border-[#111111] flex flex-col gap-3">
        {/* Row 1: Overlays and Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-geometric font-bold uppercase">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setConfig((prev) => ({ ...prev, showMeshOverlay: !prev.showMeshOverlay }))
              }
              className={`flex items-center gap-1 px-2.5 py-1.5 border-2 border-[#111111] cursor-pointer transition-colors ${
                config.showMeshOverlay ? 'bg-[#1E4CA1] text-white' : 'bg-[#F2EBDD] text-[#111111]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Face Mesh</span>
            </button>

            <button
              onClick={() =>
                setConfig((prev) => ({ ...prev, showLandmarkPoints: !prev.showLandmarkPoints }))
              }
              className={`flex items-center gap-1 px-2.5 py-1.5 border-2 border-[#111111] cursor-pointer transition-colors ${
                config.showLandmarkPoints ? 'bg-[#1E4CA1] text-white' : 'bg-[#F2EBDD] text-[#111111]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>68 Points</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onStartCalibration}
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#111111] bg-[#F2EBDD] text-[#111111] hover:bg-white cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Calibrate Eyes (5s)</span>
            </button>
          </div>
        </div>

        {/* Row 2: Live Demo Simulation Presets (Crucial for test & presentation) */}
        <div className="bg-[#F2EBDD] p-2.5 border border-[#111111] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-telemetry font-bold text-[#111111] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D7263D]" />
              <span>Demo Scenario Simulation / Test Presets:</span>
            </span>
            <span className="text-[10px] font-mono-telemetry text-[#111111]/70">
              {simulationScenario === 'none' ? 'Live Webcam Stream' : `Active: ${simulationScenario}`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <button
              onClick={() => onSelectSimulation('none')}
              className={`px-2 py-1 text-[11px] font-geometric font-bold uppercase border border-[#111111] cursor-pointer text-center ${
                simulationScenario === 'none'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white hover:bg-white/80 text-[#111111]'
              }`}
            >
              Live Camera
            </button>
            <button
              onClick={() => onSelectSimulation('blink')}
              className={`px-2 py-1 text-[11px] font-geometric font-bold uppercase border border-[#111111] cursor-pointer text-center ${
                simulationScenario === 'blink'
                  ? 'bg-[#D7263D] text-white'
                  : 'bg-white hover:bg-white/80 text-[#111111]'
              }`}
            >
              Rapid Blinks
            </button>
            <button
              onClick={() => onSelectSimulation('microsleep')}
              className={`px-2 py-1 text-[11px] font-geometric font-bold uppercase border border-[#111111] cursor-pointer text-center ${
                simulationScenario === 'microsleep'
                  ? 'bg-[#D7263D] text-white'
                  : 'bg-white hover:bg-white/80 text-[#111111]'
              }`}
            >
              Micro-Sleep (3s)
            </button>
            <button
              onClick={() => onSelectSimulation('yawn')}
              className={`px-2 py-1 text-[11px] font-geometric font-bold uppercase border border-[#111111] cursor-pointer text-center ${
                simulationScenario === 'yawn'
                  ? 'bg-[#F4B400] text-[#111111]'
                  : 'bg-white hover:bg-white/80 text-[#111111]'
              }`}
            >
              Heavy Yawn
            </button>
            <button
              onClick={() => onSelectSimulation('nod')}
              className={`px-2 py-1 text-[11px] font-geometric font-bold uppercase border border-[#111111] cursor-pointer text-center ${
                simulationScenario === 'nod'
                  ? 'bg-[#F4B400] text-[#111111]'
                  : 'bg-white hover:bg-white/80 text-[#111111]'
              }`}
            >
              Head Droop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

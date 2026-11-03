import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FacialTelemetry, SystemConfig, CalibrationData, BlinkAlarmMode } from './types';
import { TelemetryTracker } from './services/visionEngine';
import { faceDetector, DetectionOutput } from './services/faceDetector';
import { audioAlarm } from './services/audioAlarm';
import { TopNav } from './components/TopNav';
import { AlertBanner } from './components/AlertBanner';
import { WebcamFeed } from './components/WebcamFeed';
import { TelemetryCharts } from './components/TelemetryCharts';
import { CalibrationPanel } from './components/CalibrationPanel';
import { PresentationGuide } from './components/PresentationGuide';
import { BauhausCircle, BauhausSquare, BauhausTriangle, BauhausEmblem } from './components/GeometricShapes';
import { Eye, Bell, Activity, Shield, AlertTriangle, Play, Sparkles } from 'lucide-react';

const DEFAULT_CONFIG: SystemConfig = {
  earThreshold: 0.220,
  blinkAlarmMode: 'instant', // Set to instant by default as requested: "whenever i Blink my eyes it would make alarm and red alert with more precision and accuracy"
  instantAlarmDelayMs: 0,
  microSleepDelayMs: 1500,
  yawnThreshold: 0.55,
  headNodThreshold: 14,
  alarmVolume: 0.75,
  soundType: 'siren',
  audioMuted: false,
  showMeshOverlay: true,
  showLandmarkPoints: true,
  showBauhausGrid: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'calibration' | 'overview' | 'guide'>('dashboard');
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [simulationScenario, setSimulationScenario] = useState<string>('none');
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [earHistory, setEarHistory] = useState<number[]>(() => new Array(60).fill(0.31));

  // Telemetry Tracker instance
  const trackerRef = useRef<TelemetryTracker>(new TelemetryTracker(DEFAULT_CONFIG));
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Latest telemetry state
  const [telemetry, setTelemetry] = useState<FacialTelemetry>(() =>
    trackerRef.current.processFrame(0.31, 0.31, 0.22, 0, 0, 0)
  );

  // Latest detection raw output
  const [detection, setDetection] = useState<DetectionOutput>({
    landmarks: [],
    leftEye: [],
    rightEye: [],
    mouth: [],
    noseTip: { x: 0.5, y: 0.5 },
    chin: { x: 0.5, y: 0.75 },
    leftEar: 0.31,
    rightEar: 0.31,
    avgEar: 0.31,
    mar: 0.22,
    pitch: 0,
    yaw: 0,
    roll: 0,
    hasFace: false,
    engine: 'canvas-cv',
  });

  // Calibration state
  const [calibration, setCalibration] = useState<CalibrationData>({
    isCalibrating: false,
    progressPercent: 0,
    samples: [],
    calibratedBaselineEar: 0.30,
    recommendedThreshold: 0.22,
  });

  // Keep tracker updated with config changes
  useEffect(() => {
    trackerRef.current.updateConfig(config);
  }, [config]);

  // Audio Alarm coordination effect
  useEffect(() => {
    if (config.audioMuted) {
      if (isAlarmPlaying) {
        audioAlarm.stopCriticalAlarm();
        setIsAlarmPlaying(false);
      }
      return;
    }

    if (telemetry.alertLevel === 'CRITICAL') {
      if (!isAlarmPlaying) {
        audioAlarm.startCriticalAlarm(config.alarmVolume, config.soundType);
        setIsAlarmPlaying(true);
      }
    } else {
      if (isAlarmPlaying) {
        audioAlarm.stopCriticalAlarm();
        setIsAlarmPlaying(false);
      }
      if (telemetry.alertLevel === 'WARNING' && telemetry.isYawning) {
        audioAlarm.playWarningChime(config.alarmVolume * 0.7);
      }
    }
  }, [telemetry.alertLevel, telemetry.isYawning, config.audioMuted, config.alarmVolume, config.soundType, isAlarmPlaying]);

  // 5-Second Automated Calibration Loop
  const startCalibration = useCallback(() => {
    setCalibration({
      isCalibrating: true,
      progressPercent: 0,
      samples: [],
      calibratedBaselineEar: 0.30,
      recommendedThreshold: 0.22,
    });

    const samples: number[] = [];
    const startTime = performance.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));

      // Record current non-blink EAR
      if (detection.hasFace && detection.avgEar > 0.18) {
        samples.push(detection.avgEar);
      }

      setCalibration((prev) => ({
        ...prev,
        progressPercent: progress,
        samples,
      }));

      if (progress >= 100) {
        clearInterval(interval);
        // Calculate average baseline
        const avgBaseline =
          samples.length > 5
            ? samples.reduce((a, b) => a + b, 0) / samples.length
            : 0.30;
        // Optimal threshold is ~70% of open baseline
        const recommended = Number((avgBaseline * 0.70).toFixed(3));

        trackerRef.current.setBaselineEar(avgBaseline);
        setConfig((prev) => ({ ...prev, earThreshold: recommended }));
        setCalibration({
          isCalibrating: false,
          progressPercent: 100,
          samples,
          calibratedBaselineEar: Number(avgBaseline.toFixed(3)),
          recommendedThreshold: recommended,
        });
      }
    }, 100);
  }, [detection]);

  // Main 60FPS Video Processing & Telemetry Loop
  useEffect(() => {
    let animId: number;
    let lastChartUpdate = performance.now();

    const loop = async () => {
      const now = performance.now();

      // Analyze current frame from webcam or simulation
      const currentDetection = await faceDetector.analyzeCurrentFrame();
      setDetection(currentDetection);

      // Process through telemetry tracker
      if (currentDetection.hasFace || simulationScenario !== 'none') {
        const nextTelemetry = trackerRef.current.processFrame(
          currentDetection.leftEar,
          currentDetection.rightEar,
          currentDetection.mar,
          currentDetection.pitch,
          currentDetection.yaw,
          currentDetection.roll,
          now
        );
        setTelemetry(nextTelemetry);

        // Update real-time EAR history buffer for continuous wave chart (~25 Hz)
        if (now - lastChartUpdate > 40) {
          lastChartUpdate = now;
          setEarHistory((prev) => {
            const next = [...prev.slice(1), nextTelemetry.avgEar];
            return next;
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [simulationScenario]);

  // Handle Camera Toggle
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      faceDetector.stopCamera();
      setIsCameraActive(false);
    } else {
      if (videoRef.current) {
        const ok = await faceDetector.startCamera(videoRef.current);
        if (ok) {
          setIsCameraActive(true);
          setSimulationScenario('none');
        } else {
          // Camera permission denied or not available; switch automatically to simulation mode
          setSimulationScenario('blink');
        }
      }
    }
  };

  // Handle Simulation Presets
  const handleSelectSimulation = (scenario: 'none' | 'normal' | 'blink' | 'microsleep' | 'yawn' | 'nod') => {
    if (scenario === 'none') {
      faceDetector.setSimulationScenario('none');
      setSimulationScenario('none');
      if (!isCameraActive && videoRef.current) {
        handleToggleCamera();
      }
    } else {
      faceDetector.stopCamera();
      setIsCameraActive(false);
      faceDetector.setSimulationScenario(scenario);
      setSimulationScenario(scenario);
    }
  };

  const handleTestAudio = () => {
    audioAlarm.testAudioBeep(config.alarmVolume, config.soundType);
  };

  const handleDisarmAlarm = () => {
    audioAlarm.stopCriticalAlarm();
    setIsAlarmPlaying(false);
  };

  return (
    <div className={`min-h-screen bg-[#F2EBDD] text-[#111111] flex flex-col ${config.showBauhausGrid ? 'bg-bauhaus-grid' : ''}`}>
      {/* 1. Bauhaus Top Navigation Bar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCameraActive={isCameraActive}
        onToggleCamera={handleToggleCamera}
        isMuted={config.audioMuted}
        onToggleMute={() => setConfig((prev) => ({ ...prev, audioMuted: !prev.audioMuted }))}
        onTriggerAlarmTest={handleTestAudio}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Dynamic Safety Alert Banner (Green / Yellow / Red) */}
        <AlertBanner
          telemetry={telemetry}
          blinkAlarmMode={config.blinkAlarmMode}
          isAlarmPlaying={isAlarmPlaying}
          onDisarmAlarm={handleDisarmAlarm}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live Webcam Feed & Landmark Overlay (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <WebcamFeed
                videoRef={videoRef}
                detection={detection}
                telemetry={telemetry}
                config={config}
                setConfig={setConfig}
                isCameraActive={isCameraActive}
                onToggleCamera={handleToggleCamera}
                simulationScenario={simulationScenario}
                onSelectSimulation={handleSelectSimulation}
                onStartCalibration={startCalibration}
              />

              {/* Accuracy & Precision Mode Quick Indicator */}
              <div className="bauhaus-box p-4 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BauhausCircle size={16} color={config.blinkAlarmMode === 'instant' ? '#D7263D' : '#1E4CA1'} />
                  <div>
                    <span className="text-[10px] font-mono-telemetry font-bold text-[#111111]/70 uppercase block">
                      ACTIVE ALARM SENSITIVITY
                    </span>
                    <strong className="text-xs font-display uppercase tracking-wide text-[#111111]">
                      {config.blinkAlarmMode === 'instant'
                        ? 'Instant Blink Trigger (< 30ms)'
                        : 'Micro-Sleep Predictive (2-5s lead)'}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('calibration')}
                  className="px-2.5 py-1 text-xs font-geometric font-bold uppercase border border-[#111111] bg-[#F2EBDD] hover:bg-white cursor-pointer"
                >
                  Adjust
                </button>
              </div>
            </div>

            {/* Right Column: Live Telemetry Charts (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <TelemetryCharts
                telemetry={telemetry}
                config={config}
                earHistory={earHistory}
              />
            </div>
          </div>
        )}

        {/* Tab: Dedicated EAR Telemetry View */}
        {activeTab === 'telemetry' && (
          <div className="flex flex-col gap-6">
            <TelemetryCharts
              telemetry={telemetry}
              config={config}
              earHistory={earHistory}
            />
          </div>
        )}

        {/* Tab: Precision Calibration & Timing Matrix */}
        {activeTab === 'calibration' && (
          <CalibrationPanel
            config={config}
            setConfig={setConfig}
            telemetry={telemetry}
            calibration={calibration}
            onStartCalibration={startCalibration}
            onTestAudio={handleTestAudio}
          />
        )}

        {/* Tab: Project Overview & Presentation Guide */}
        {(activeTab === 'overview' || activeTab === 'guide') && (
          <PresentationGuide
            onJumpToDashboard={() => setActiveTab('dashboard')}
            onRunDemoPreset={(preset) => {
              handleSelectSimulation(preset);
              setActiveTab('dashboard');
            }}
          />
        )}
      </main>

      {/* 3. Quiet Bauhaus Footer */}
      <footer className="border-t-2 border-[#111111] bg-[#F2EBDD] py-4 px-6 mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono-telemetry text-[#111111]">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <BauhausEmblem />
              <strong className="font-bold">AVISODRIVE</strong>
              <span>·</span>
              <span className="bg-[#111111] text-[#F2EBDD] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Course Project For Sem-1
              </span>
              <span>·</span>
            </div>
            <span>Project is Presented by Om Patil, Om Jorwar, Ninad Godse, Om Gujar</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#111111]/80">
            <span>EAR & PERCLOS BIOMETRICS</span>
            <span>·</span>
            <span>68-POINT FACIAL MESH</span>
            <span>·</span>
            <span>BAUHAUS MINIMALISM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

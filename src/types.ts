export type AlertLevel = 'ALERT' | 'WARNING' | 'CRITICAL';

export type EngineType = 'mediapipe' | 'canvas-cv' | 'simulated';

export type BlinkAlarmMode = 'instant' | 'predictive';

export interface FacialTelemetry {
  timestamp: number;
  // Eye Aspect Ratio
  leftEar: number;
  rightEar: number;
  avgEar: number;
  earBaseline: number;
  isBlinking: boolean;
  blinkDurationMs: number;
  blinkCount: number;
  blinkRatePerMin: number; // blinks/min
  blinkVelocity: number; // drop rate per second

  // Mouth Aspect Ratio (Yawn)
  mar: number;
  isYawning: boolean;
  yawnDurationMs: number;
  yawnCount: number;

  // Head Nod & Pose
  headPitch: number; // degrees (negative = nodding downward)
  headYaw: number;
  headRoll: number;
  isHeadNodding: boolean;
  nodVelocity: number; // deg/sec

  // Overall Index
  perclos: number; // 0 - 100%
  alertnessScore: number; // 0 - 100
  alertLevel: AlertLevel;
  microSleepRisk: number; // 0 - 100%
  timeToMicroSleepSec: number; // estimated seconds before micro-sleep
}

export interface SystemConfig {
  earThreshold: number; // default ~0.22
  blinkAlarmMode: BlinkAlarmMode; // 'instant' = alarm on any blink, 'predictive' = 2-5s micro-sleep detection
  instantAlarmDelayMs: number; // 0ms to 400ms for instant blink test
  microSleepDelayMs: number; // 1000ms - 2500ms
  yawnThreshold: number; // default ~0.55
  headNodThreshold: number; // default 14 degrees
  alarmVolume: number; // 0 - 1
  soundType: 'siren' | 'chime' | 'pulse';
  audioMuted: boolean;
  showMeshOverlay: boolean;
  showLandmarkPoints: boolean;
  showBauhausGrid: boolean;
}

export interface CalibrationData {
  isCalibrating: boolean;
  progressPercent: number;
  samples: number[];
  calibratedBaselineEar: number;
  recommendedThreshold: number;
}

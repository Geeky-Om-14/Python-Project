/**
 * Vision & Landmark Telemetry Engine for AVISODRIVE
 * Calculates EAR (Eye Aspect Ratio), MAR (Mouth Aspect Ratio), Head Nod, and PERCLOS.
 */

import { FacialTelemetry, SystemConfig, AlertLevel } from '../types';

export interface Point2D {
  x: number;
  y: number;
  z?: number;
}

export interface LandmarkResults {
  landmarks: Point2D[];
  leftEye: Point2D[];
  rightEye: Point2D[];
  mouth: Point2D[];
  noseTip: Point2D;
  chin: Point2D;
  faceBox: { x: number; y: number; width: number; height: number };
}

// MediaPipe 468 landmark indices
const MP_LEFT_EYE = [33, 160, 158, 133, 153, 144];
const MP_RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const MP_MOUTH = [61, 291, 13, 14, 78, 308];
const MP_NOSE_TIP = 1;
const MP_CHIN = 152;
const MP_FOREHEAD = 10;

function euclideanDist(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateEAR(eyePoints: Point2D[]): number {
  if (!eyePoints || eyePoints.length < 6) return 0.3;
  // Eye points: [p1, p2, p3, p4, p5, p6]
  // Horizontal: p1 (corner), p4 (corner)
  // Vertical 1: p2, p6
  // Vertical 2: p3, p5
  const p1 = eyePoints[0];
  const p2 = eyePoints[1];
  const p3 = eyePoints[2];
  const p4 = eyePoints[3];
  const p5 = eyePoints[4];
  const p6 = eyePoints[5];

  const vertical1 = euclideanDist(p2, p6);
  const vertical2 = euclideanDist(p3, p5);
  const horizontal = euclideanDist(p1, p4);

  if (horizontal <= 0.0001) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export function calculateMAR(mouthPoints: Point2D[]): number {
  if (!mouthPoints || mouthPoints.length < 6) return 0.2;
  const left = mouthPoints[0];
  const right = mouthPoints[1];
  const top = mouthPoints[2];
  const bottom = mouthPoints[3];

  const vertical = euclideanDist(top, bottom);
  const horizontal = euclideanDist(left, right);

  if (horizontal <= 0.0001) return 0.2;
  return vertical / horizontal;
}

export class TelemetryTracker {
  private config: SystemConfig;
  private closureStartTime: number | null = null;
  private yawnStartTime: number | null = null;
  private blinkTimestamps: number[] = [];
  private earHistory: { time: number; ear: number; closed: boolean }[] = [];
  private totalBlinkCount = 0;
  private totalYawnCount = 0;
  private lastPitch = 0;
  private lastPitchTime = 0;
  private lastBlinkDuration = 0;
  private lastBlinkVelocity = 0;
  private earBaseline = 0.30;

  // Smoothing filters to prevent noise jitter
  private smoothedEar = 0.30;
  private smoothedMar = 0.22;
  private smoothedPitch = 0;

  constructor(initialConfig: SystemConfig) {
    this.config = initialConfig;
  }

  public updateConfig(newConfig: SystemConfig) {
    this.config = newConfig;
  }

  public setBaselineEar(baseline: number) {
    this.earBaseline = Math.max(0.18, Math.min(0.45, baseline));
  }

  public getBaselineEar(): number {
    return this.earBaseline;
  }

  public processFrame(
    rawLeftEar: number,
    rawRightEar: number,
    rawMar: number,
    rawPitch: number,
    rawYaw: number,
    rawRoll: number,
    timestamp: number = performance.now()
  ): FacialTelemetry {
    // Fast exponential moving average for instantaneous response without frame lag
    const alphaEar = 0.65; // High responsiveness for instant blink detection
    const rawAvgEar = (rawLeftEar + rawRightEar) / 2;
    this.smoothedEar = alphaEar * rawAvgEar + (1 - alphaEar) * this.smoothedEar;
    this.smoothedMar = 0.3 * rawMar + 0.7 * this.smoothedMar;
    this.smoothedPitch = 0.35 * rawPitch + 0.65 * this.smoothedPitch;

    const currentEar = this.smoothedEar;
    const isBelowThreshold = currentEar < this.config.earThreshold;

    // Track Closure & Blinks
    let currentBlinkDuration = 0;
    let isBlinking = false;

    if (isBelowThreshold) {
      if (this.closureStartTime === null) {
        this.closureStartTime = timestamp;
      }
      currentBlinkDuration = timestamp - this.closureStartTime;
      isBlinking = true;
    } else {
      if (this.closureStartTime !== null) {
        // Blink finished
        const duration = timestamp - this.closureStartTime;
        this.lastBlinkDuration = duration;
        // Blink velocity: EAR delta over duration in seconds
        if (duration > 20) {
          this.lastBlinkVelocity = Math.abs(this.earBaseline - currentEar) / (duration / 1000);
        }
        this.totalBlinkCount++;
        this.blinkTimestamps.push(timestamp);
        this.closureStartTime = null;
      }
    }

    // Clean up blink history older than 60 seconds
    const sixtySecAgo = timestamp - 60000;
    this.blinkTimestamps = this.blinkTimestamps.filter((t) => t >= sixtySecAgo);
    const blinkRatePerMin = this.blinkTimestamps.length;

    // PERCLOS: record sample (window = 30 seconds)
    const thirtySecAgo = timestamp - 30000;
    this.earHistory.push({ time: timestamp, ear: currentEar, closed: isBelowThreshold });
    this.earHistory = this.earHistory.filter((entry) => entry.time >= thirtySecAgo);

    const closedFrames = this.earHistory.filter((e) => e.closed).length;
    const perclos = this.earHistory.length > 0 ? (closedFrames / this.earHistory.length) * 100 : 0;

    // Yawn Tracking
    const isYawning = this.smoothedMar > this.config.yawnThreshold;
    let currentYawnDuration = 0;
    if (isYawning) {
      if (this.yawnStartTime === null) {
        this.yawnStartTime = timestamp;
      }
      currentYawnDuration = timestamp - this.yawnStartTime;
      if (currentYawnDuration > 1500 && currentYawnDuration < 1600) {
        this.totalYawnCount++;
      }
    } else {
      this.yawnStartTime = null;
    }

    // Head Nod Velocity (deg/sec downward)
    let nodVelocity = 0;
    if (this.lastPitchTime > 0) {
      const dt = (timestamp - this.lastPitchTime) / 1000;
      if (dt > 0.02) {
        nodVelocity = (this.smoothedPitch - this.lastPitch) / dt;
      }
    }
    this.lastPitch = this.smoothedPitch;
    this.lastPitchTime = timestamp;
    const isHeadNodding = this.smoothedPitch < -this.config.headNodThreshold;

    // Alert Level & Prediction Formulation
    let alertLevel: AlertLevel = 'ALERT'; // Green
    let microSleepRisk = 5;
    let timeToMicroSleepSec = 10;

    // MODE 1: INSTANT BLINK ALARM (Ultra-accurate Demo & Sensitivity Testing)
    if (this.config.blinkAlarmMode === 'instant') {
      if (isBelowThreshold && currentBlinkDuration >= this.config.instantAlarmDelayMs) {
        alertLevel = 'CRITICAL';
        microSleepRisk = 98;
        timeToMicroSleepSec = 0;
      } else if (currentEar < this.config.earThreshold + 0.04) {
        alertLevel = 'WARNING';
        microSleepRisk = 55;
        timeToMicroSleepSec = 2.5;
      }
    } else {
      // MODE 2: PREDICTIVE MICRO-SLEEP PREDICTION (2-5 seconds in advance)
      // Micro-sleep condition: sustained closure > microSleepDelayMs (e.g. 1000ms - 2000ms)
      if (isBelowThreshold && currentBlinkDuration >= this.config.microSleepDelayMs) {
        alertLevel = 'CRITICAL';
        microSleepRisk = 99;
        timeToMicroSleepSec = 0;
      } else if (perclos > 20 || (isBelowThreshold && currentBlinkDuration > 600)) {
        alertLevel = 'CRITICAL';
        microSleepRisk = 90;
        timeToMicroSleepSec = 0.5;
      } else if (
        perclos > 10 ||
        (isYawning && currentYawnDuration > 1200) ||
        isHeadNodding ||
        (isBelowThreshold && currentBlinkDuration > 350) ||
        (blinkRatePerMin > 32 && this.lastBlinkVelocity < 2.0)
      ) {
        alertLevel = 'WARNING';
        microSleepRisk = 65;
        // Predicting micro-sleep 2 to 5 seconds before actual eye lock
        timeToMicroSleepSec = 2.8;
      } else if (perclos > 6 || isYawning) {
        alertLevel = 'WARNING';
        microSleepRisk = 40;
        timeToMicroSleepSec = 4.2;
      }
    }

    // Compute Overall Alertness Score (0 - 100)
    let alertness = 100;
    alertness -= perclos * 2.2;
    if (isBelowThreshold) {
      alertness -= Math.min(60, (currentBlinkDuration / 20));
    }
    if (isYawning) {
      alertness -= 25;
    }
    if (isHeadNodding) {
      alertness -= 20;
    }
    const alertnessScore = Math.max(0, Math.min(100, Math.round(alertness)));

    return {
      timestamp,
      leftEar: rawLeftEar,
      rightEar: rawRightEar,
      avgEar: currentEar,
      earBaseline: this.earBaseline,
      isBlinking,
      blinkDurationMs: isBelowThreshold ? Math.round(currentBlinkDuration) : Math.round(this.lastBlinkDuration),
      blinkCount: this.totalBlinkCount,
      blinkRatePerMin,
      blinkVelocity: Number(this.lastBlinkVelocity.toFixed(2)),
      mar: Number(this.smoothedMar.toFixed(3)),
      isYawning,
      yawnDurationMs: Math.round(currentYawnDuration),
      yawnCount: this.totalYawnCount,
      headPitch: Number(this.smoothedPitch.toFixed(1)),
      headYaw: Number(rawYaw.toFixed(1)),
      headRoll: Number(rawRoll.toFixed(1)),
      isHeadNodding,
      nodVelocity: Number(nodVelocity.toFixed(1)),
      perclos: Number(perclos.toFixed(1)),
      alertnessScore,
      alertLevel,
      microSleepRisk,
      timeToMicroSleepSec: Number(timeToMicroSleepSec.toFixed(1)),
    };
  }

  public resetStats() {
    this.totalBlinkCount = 0;
    this.totalYawnCount = 0;
    this.blinkTimestamps = [];
    this.earHistory = [];
    this.closureStartTime = null;
    this.yawnStartTime = null;
  }
}

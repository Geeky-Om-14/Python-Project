/**
 * Real-time Facial Landmark Extractor & Camera Controller
 * Supports MediaPipe FaceMesh with instant Canvas pixel-gradient fallback and simulation mode.
 */

import { Point2D, calculateEAR, calculateMAR } from './visionEngine';

export interface DetectionOutput {
  landmarks: Point2D[];
  leftEye: Point2D[];
  rightEye: Point2D[];
  mouth: Point2D[];
  noseTip: Point2D;
  chin: Point2D;
  leftEar: number;
  rightEar: number;
  avgEar: number;
  mar: number;
  pitch: number;
  yaw: number;
  roll: number;
  hasFace: boolean;
  engine: 'mediapipe' | 'canvas-cv' | 'simulated';
}

// Global declaration for MediaPipe FaceMesh loaded via CDN
declare global {
  interface Window {
    FaceMesh?: new (config: { locateFile: (file: string) => string }) => {
      setOptions: (options: Record<string, unknown>) => void;
      onResults: (callback: (results: { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>> }) => void) => void;
      send: (data: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
      close?: () => void;
    };
  }
}

export class FaceDetectorService {
  private mediaStream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasOffscreen: HTMLCanvasElement;
  private ctxOffscreen: CanvasRenderingContext2D | null;
  private mpFaceMesh: unknown = null;
  private isMpReady = false;
  private isProcessing = false;
  private simulationMode: 'none' | 'normal' | 'blink' | 'microsleep' | 'yawn' | 'nod' = 'none';
  private simStartTime = 0;

  // Tracked landmark caches
  private currentOutput: DetectionOutput = {
    landmarks: [],
    leftEye: [],
    rightEye: [],
    mouth: [],
    noseTip: { x: 0.5, y: 0.5 },
    chin: { x: 0.5, y: 0.75 },
    leftEar: 0.30,
    rightEar: 0.30,
    avgEar: 0.30,
    mar: 0.22,
    pitch: 0,
    yaw: 0,
    roll: 0,
    hasFace: false,
    engine: 'canvas-cv',
  };

  constructor() {
    this.canvasOffscreen = document.createElement('canvas');
    this.canvasOffscreen.width = 320;
    this.canvasOffscreen.height = 240;
    this.ctxOffscreen = this.canvasOffscreen.getContext('2d', { willReadFrequently: true });

    this.initMediaPipe();
  }

  private initMediaPipe() {
    if (typeof window !== 'undefined' && window.FaceMesh) {
      try {
        const fm = new window.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        fm.onResults((results) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const raw = results.multiFaceLandmarks[0];
            this.handleMediaPipeResults(raw);
          } else {
            this.currentOutput.hasFace = false;
          }
        });

        this.mpFaceMesh = fm;
        this.isMpReady = true;
      } catch (e) {
        console.warn('MediaPipe initialization fallback to Canvas CV:', e);
        this.isMpReady = false;
      }
    }
  }

  private handleMediaPipeResults(raw: Array<{ x: number; y: number; z?: number }>) {
    const leftEyeIdx = [33, 160, 158, 133, 153, 144];
    const rightEyeIdx = [362, 385, 387, 263, 373, 380];
    const mouthIdx = [61, 291, 13, 14, 78, 308];

    const leftEye = leftEyeIdx.map((i) => raw[i] || { x: 0.4, y: 0.4 });
    const rightEye = rightEyeIdx.map((i) => raw[i] || { x: 0.6, y: 0.4 });
    const mouth = mouthIdx.map((i) => raw[i] || { x: 0.5, y: 0.65 });

    const noseTip = raw[1] || { x: 0.5, y: 0.5, z: 0 };
    const chin = raw[152] || { x: 0.5, y: 0.8, z: 0 };
    const forehead = raw[10] || { x: 0.5, y: 0.2, z: 0 };

    const leftEar = calculateEAR(leftEye);
    const rightEar = calculateEAR(rightEye);
    const avgEar = (leftEar + rightEar) / 2;
    const mar = calculateMAR(mouth);

    // Approximate head pitch from nose to chin/forehead vertical projection
    const faceHeight = Math.abs(chin.y - forehead.y);
    const noseRelative = (noseTip.y - forehead.y) / (faceHeight || 0.5);
    // Standard normalized nose position is around 0.58. Lower = nodding down
    const pitch = (0.58 - noseRelative) * 80;

    // Head yaw from nose offset relative to eye midpoint
    const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
    const yaw = (noseTip.x - eyeMidX) * 90;

    // Roll from eye tilt
    const roll = Math.atan2(rightEye[0].y - leftEye[3].y, rightEye[0].x - leftEye[3].x) * (180 / Math.PI);

    // Pick 68 key representative landmarks for clean Bauhaus visualization
    const keyIndices = [
      ...leftEyeIdx,
      ...rightEyeIdx,
      ...mouthIdx,
      1, 2, 98, 327, // nose
      10, 152, 234, 454, // face bounds
      70, 63, 105, 66, 107, // left eyebrow
      336, 296, 334, 293, 300, // right eyebrow
    ];
    const landmarks = keyIndices.map((i) => raw[i] || { x: 0.5, y: 0.5 });

    this.currentOutput = {
      landmarks,
      leftEye,
      rightEye,
      mouth,
      noseTip,
      chin,
      leftEar: Number(leftEar.toFixed(3)),
      rightEar: Number(rightEar.toFixed(3)),
      avgEar: Number(avgEar.toFixed(3)),
      mar: Number(mar.toFixed(3)),
      pitch: Number(pitch.toFixed(1)),
      yaw: Number(yaw.toFixed(1)),
      roll: Number(roll.toFixed(1)),
      hasFace: true,
      engine: 'mediapipe',
    };
  }

  public async startCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    this.videoEl = videoElement;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      this.mediaStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      this.simulationMode = 'none';
      return true;
    } catch (err) {
      console.warn('Camera access error, fallback to simulated driver stream:', err);
      return false;
    }
  }

  public stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
    this.currentOutput.hasFace = false;
  }

  public setSimulationScenario(scenario: 'none' | 'normal' | 'blink' | 'microsleep' | 'yawn' | 'nod') {
    this.simulationMode = scenario;
    this.simStartTime = performance.now();
  }

  public getSimulationScenario() {
    return this.simulationMode;
  }

  /**
   * Process a single video frame with hybrid architecture
   */
  public async analyzeCurrentFrame(): Promise<DetectionOutput> {
    const now = performance.now();

    // 1. Simulation Mode Handler
    if (this.simulationMode !== 'none') {
      return this.runSimulationFrame(now);
    }

    // 2. Camera Hardware Check
    if (!this.videoEl || this.videoEl.readyState < 2) {
      return this.currentOutput;
    }

    // 3. MediaPipe Pipeline (if ready)
    if (this.isMpReady && this.mpFaceMesh && !this.isProcessing) {
      this.isProcessing = true;
      try {
        const fm = this.mpFaceMesh as { send: (data: { image: HTMLVideoElement }) => Promise<void> };
        await fm.send({ image: this.videoEl });
        this.isProcessing = false;
        return this.currentOutput;
      } catch {
        this.isProcessing = false;
      }
    }

    // 4. Instant Canvas CV Pixel Gradient Analyzer (Fallback or Instant Edge Tracking)
    return this.runCanvasPixelAnalysis(now);
  }

  /**
   * High-speed Canvas pixel analysis for eye closure detection
   */
  private runCanvasPixelAnalysis(now: number): DetectionOutput {
    if (!this.videoEl || !this.ctxOffscreen) return this.currentOutput;

    const vw = this.canvasOffscreen.width;
    const vh = this.canvasOffscreen.height;

    // Draw downsampled frame to offscreen canvas
    this.ctxOffscreen.drawImage(this.videoEl, 0, 0, vw, vh);
    const frameData = this.ctxOffscreen.getImageData(0, 0, vw, vh);
    const data = frameData.data;

    // Eye regions in normalized coordinates centered for driver view:
    // Left eye around (0.38, 0.40), Right eye around (0.62, 0.40)
    const leftEyeBox = {
      x: Math.floor(vw * 0.32),
      y: Math.floor(vh * 0.35),
      w: Math.floor(vw * 0.16),
      h: Math.floor(vh * 0.14),
    };

    const rightEyeBox = {
      x: Math.floor(vw * 0.52),
      y: Math.floor(vh * 0.35),
      w: Math.floor(vw * 0.16),
      h: Math.floor(vh * 0.14),
    };

    const leftAperture = this.computeEyeAperture(data, vw, leftEyeBox);
    const rightAperture = this.computeEyeAperture(data, vw, rightEyeBox);

    // Calibrate aperture into standard 0.10 - 0.35 EAR scale
    // Open eyes have high pupil darkness contrast and vertical variance
    const avgAperture = (leftAperture + rightAperture) / 2;
    const ear = Math.max(0.12, Math.min(0.38, 0.12 + avgAperture * 0.26));

    // Mouth region around (0.42, 0.65)
    const mouthBox = {
      x: Math.floor(vw * 0.40),
      y: Math.floor(vh * 0.62),
      w: Math.floor(vw * 0.20),
      h: Math.floor(vh * 0.16),
    };
    const mouthOpenness = this.computeMouthOpenness(data, vw, mouthBox);
    const mar = Math.max(0.15, Math.min(0.85, 0.18 + mouthOpenness * 0.6));

    // Synthetic Bauhaus landmarks matching driver face
    const landmarks = this.generateSyntheticLandmarks(ear, mar, 0, 0);

    this.currentOutput = {
      landmarks: landmarks.all,
      leftEye: landmarks.leftEye,
      rightEye: landmarks.rightEye,
      mouth: landmarks.mouth,
      noseTip: { x: 0.5, y: 0.52 },
      chin: { x: 0.5, y: 0.78 },
      leftEar: Number(ear.toFixed(3)),
      rightEar: Number(ear.toFixed(3)),
      avgEar: Number(ear.toFixed(3)),
      mar: Number(mar.toFixed(3)),
      pitch: 0,
      yaw: 0,
      roll: 0,
      hasFace: true,
      engine: 'canvas-cv',
    };

    return this.currentOutput;
  }

  /**
   * Calculates vertical darkness gradient within eye region.
   * Closed eye = uniform eyelid skin color.
   * Open eye = dark iris pupil surrounded by high vertical contrast.
   */
  private computeEyeAperture(data: Uint8ClampedArray, width: number, box: { x: number; y: number; w: number; h: number }): number {
    let darkPixelCount = 0;
    let totalPixels = 0;
    let minLum = 255;
    let maxLum = 0;

    for (let y = box.y; y < box.y + box.h; y++) {
      for (let x = box.x; x < box.x + box.w; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;

        // Dark iris threshold relative to eye patch
        if (lum < 75) {
          darkPixelCount++;
        }
        totalPixels++;
      }
    }

    const contrast = (maxLum - minLum) / 255;
    const darkRatio = totalPixels > 0 ? darkPixelCount / totalPixels : 0;
    // Combine contrast and dark pupil presence
    return Math.min(1.0, darkRatio * 3.5 + contrast * 0.5);
  }

  private computeMouthOpenness(data: Uint8ClampedArray, width: number, box: { x: number; y: number; w: number; h: number }): number {
    let oralDarkness = 0;
    let count = 0;
    for (let y = box.y; y < box.y + box.h; y++) {
      for (let x = box.x; x < box.x + box.w; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 60) oralDarkness++;
        count++;
      }
    }
    return count > 0 ? oralDarkness / count : 0;
  }

  /**
   * Generates synthetic landmarks when in Canvas CV or Simulation mode
   */
  private generateSyntheticLandmarks(ear: number, mar: number, pitch: number, yaw: number) {
    const eyeH = Math.max(0.005, ear * 0.08);
    const mouthH = Math.max(0.01, mar * 0.08);

    // Left Eye
    const lx = 0.38 + yaw * 0.1;
    const ly = 0.40 - pitch * 0.005;
    const leftEye: Point2D[] = [
      { x: lx - 0.05, y: ly }, // corner 1
      { x: lx - 0.02, y: ly - eyeH }, // top outer
      { x: lx + 0.02, y: ly - eyeH }, // top inner
      { x: lx + 0.05, y: ly }, // corner 2
      { x: lx + 0.02, y: ly + eyeH }, // bottom inner
      { x: lx - 0.02, y: ly + eyeH }, // bottom outer
    ];

    // Right Eye
    const rx = 0.62 + yaw * 0.1;
    const ry = 0.40 - pitch * 0.005;
    const rightEye: Point2D[] = [
      { x: rx - 0.05, y: ry },
      { x: rx - 0.02, y: ry - eyeH },
      { x: rx + 0.02, y: ry - eyeH },
      { x: rx + 0.05, y: ry },
      { x: rx + 0.02, y: ry + eyeH },
      { x: rx - 0.02, y: ry + eyeH },
    ];

    // Mouth
    const mx = 0.50 + yaw * 0.08;
    const my = 0.66 - pitch * 0.005;
    const mouth: Point2D[] = [
      { x: mx - 0.07, y: my },
      { x: mx + 0.07, y: my },
      { x: mx, y: my - mouthH },
      { x: mx, y: my + mouthH },
      { x: mx - 0.03, y: my },
      { x: mx + 0.03, y: my },
    ];

    // Additional contour landmarks
    const all = [
      ...leftEye,
      ...rightEye,
      ...mouth,
      { x: 0.50 + yaw * 0.1, y: 0.52 - pitch * 0.005 }, // nose tip
      { x: 0.50 + yaw * 0.05, y: 0.78 - pitch * 0.005 }, // chin
    ];

    return { all, leftEye, rightEye, mouth };
  }

  /**
   * Realistic Simulation Mode for Presentation and Demo verification
   */
  private runSimulationFrame(now: number): DetectionOutput {
    const elapsed = (now - this.simStartTime) / 1000;
    let ear = 0.32;
    let mar = 0.22;
    let pitch = 0;
    let yaw = 0;

    switch (this.simulationMode) {
      case 'normal':
        // Periodic natural alert blinks (every ~3.5 seconds, lasts 150ms)
        const cycle = elapsed % 3.5;
        if (cycle < 0.15) {
          ear = 0.13;
        } else {
          ear = 0.31 + Math.sin(elapsed * 2) * 0.02;
        }
        break;

      case 'blink':
        // User requested instant blink alert demo: rapid frequent blinks every 1.2s
        const blinkCycle = elapsed % 1.2;
        if (blinkCycle < 0.22) {
          ear = 0.12; // Closed eye triggers alarm!
        } else {
          ear = 0.32;
        }
        break;

      case 'microsleep':
        // Sustained eye closure lasting 3.5 seconds with downward head tilt
        if (elapsed < 1.0) {
          ear = 0.24 - elapsed * 0.1; // slow eye droop
        } else {
          ear = 0.11; // sustained closure micro-sleep!
          pitch = -18 - Math.sin(elapsed) * 3; // head nodding downward
        }
        break;

      case 'yawn':
        // Heavy prolonged yawn
        ear = 0.22; // drowsy eyelids
        mar = 0.68 + Math.sin(elapsed * 3) * 0.08;
        break;

      case 'nod':
        // Head drooping and jerk back
        const nodCycle = elapsed % 2.5;
        if (nodCycle < 1.8) {
          pitch = -10 - nodCycle * 8; // nodding down
          ear = 0.18;
        } else {
          pitch = 2; // sudden startle back
          ear = 0.34;
        }
        break;
    }

    const landmarks = this.generateSyntheticLandmarks(ear, mar, pitch, yaw);

    return {
      landmarks: landmarks.all,
      leftEye: landmarks.leftEye,
      rightEye: landmarks.rightEye,
      mouth: landmarks.mouth,
      noseTip: { x: 0.5 + yaw * 0.1, y: 0.52 - pitch * 0.005 },
      chin: { x: 0.5 + yaw * 0.05, y: 0.78 - pitch * 0.005 },
      leftEar: Number(ear.toFixed(3)),
      rightEar: Number(ear.toFixed(3)),
      avgEar: Number(ear.toFixed(3)),
      mar: Number(mar.toFixed(3)),
      pitch: Number(pitch.toFixed(1)),
      yaw: Number(yaw.toFixed(1)),
      roll: 0,
      hasFace: true,
      engine: 'simulated',
    };
  }

  public isUsingMediaPipe(): boolean {
    return this.isMpReady && this.currentOutput.engine === 'mediapipe';
  }
}

export const faceDetector = new FaceDetectorService();

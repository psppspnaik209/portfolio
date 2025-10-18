export type KeyAction = 'throttle' | 'brake' | 'left' | 'right' | 'restart';

export type KeyBindings = Record<KeyAction, string[]>;

export type InputState = Record<KeyAction, boolean>;

export interface GameSettings {
  bloom: boolean;
  motionBlur: boolean;
  renderScale: number;
}

export interface HUDData {
  boost: number;
  speedKph: number;
  currentTime: number;
  bestTime: number | null;
  lapProgress: number;
  boostUptimeRatio: number;
  offTrackRatio: number;
  runActive: boolean;
}

export interface TelemetrySample {
  runId: number;
  duration: number;
  boostUptimeRatio: number;
  offTrackRatio: number;
  retries: number;
  dnf: boolean;
  timestamp: number;
}

export interface RacerGameCallbacks {
  onHUDUpdate: (data: HUDData) => void;
  onRunComplete: (sample: TelemetrySample, bestTime: number | null) => void;
}

export interface CenterlineSample {
  point: { x: number; y: number; z: number };
  tangent: { x: number; y: number; z: number };
  distance: number;
  t: number;
}

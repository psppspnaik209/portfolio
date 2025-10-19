import type { TrackDefinition } from './types';

type TrackConfig = {
  id: string;
  name: string;
  description: string;
  difficulty: 'arcade' | 'balanced' | 'technical';
  color: string;
  theme?: TrackDefinition['theme'];
  targetLapTime: number;
  lapLength: number;
  trackWidth?: number;
  basePoints: Array<[number, number]>;
  densify?: number;
};

const densifyPoints = (
  points: Array<[number, number]>,
  subdivisions = 0,
): Array<[number, number]> => {
  if (subdivisions <= 0) {
    return points.slice();
  }
  const result: Array<[number, number]> = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[i + 1];
    result.push([x1, z1]);
    for (let s = 1; s <= subdivisions; s += 1) {
      const t = s / (subdivisions + 1);
      result.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

const closeLoop = (points: Array<[number, number]>): Array<[number, number]> => {
  if (points.length < 2) {
    return points;
  }
  const [firstX, firstZ] = points[0];
  const [lastX, lastZ] = points[points.length - 1];
  if (firstX === lastX && firstZ === lastZ) {
    return points.slice();
  }
  return [...points, [firstX, firstZ]];
};

const recenterPoints = (points: Array<[number, number]>): Array<[number, number]> => {
  const sum = points.reduce(
    (acc, [x, z]) => {
      acc.x += x;
      acc.z += z;
      return acc;
    },
    { x: 0, z: 0 },
  );
  const cx = sum.x / points.length;
  const cz = sum.z / points.length;
  return points.map(([x, z]) => [x - cx, z - cz]);
};

const computePolylineLength = (points: Array<[number, number]>): number => {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [x1, z1] = points[i - 1];
    const [x2, z2] = points[i];
    length += Math.hypot(x2 - x1, z2 - z1);
  }
  return length;
};

const scaleToLength = (
  points: Array<[number, number]>,
  targetLength: number,
): Array<[number, number]> => {
  const current = computePolylineLength(points);
  const scale = targetLength / Math.max(current, Number.EPSILON);
  return points.map(([x, z]) => [x * scale, z * scale]);
};

const createTrack = (config: TrackConfig): TrackDefinition => {
  const densified = densifyPoints(config.basePoints, config.densify ?? 1);
  const looped = closeLoop(densified);
  const centered = recenterPoints(looped);
  const scaled = scaleToLength(centered, config.lapLength);
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    color: config.color,
    centerline: scaled,
    theme: config.theme,
    targetLapTime: config.targetLapTime,
    lapLength: computePolylineLength(scaled),
    trackWidth: config.trackWidth,
  };
};

const monzaBase: Array<[number, number]> = [
  [0, 0],
  [30, -8],
  [90, -25],
  [145, -65],
  [160, -110],
  [140, -170],
  [70, -220],
  [-10, -240],
  [-90, -220],
  [-145, -180],
  [-165, -120],
  [-158, -60],
  [-120, -10],
  [-60, 20],
  [0, 30],
  [60, 20],
  [110, -10],
  [150, -60],
  [165, -110],
  [155, -160],
  [120, -200],
  [60, -215],
  [10, -205],
  [-40, -170],
  [-60, -120],
  [-40, -60],
  [-10, -20],
  [0, 0],
];

const monacoBase: Array<[number, number]> = [
  [0, 0],
  [18, -8],
  [42, -18],
  [68, -32],
  [80, -55],
  [70, -78],
  [40, -95],
  [5, -105],
  [-28, -104],
  [-52, -92],
  [-72, -70],
  [-78, -38],
  [-70, -8],
  [-52, 18],
  [-24, 34],
  [6, 44],
  [36, 48],
  [62, 40],
  [78, 20],
  [80, -4],
  [60, -18],
  [30, -22],
  [8, -12],
  [0, 0],
];

const silverstoneBase: Array<[number, number]> = [
  [0, 0],
  [42, -8],
  [88, -25],
  [128, -48],
  [158, -78],
  [168, -120],
  [150, -165],
  [120, -195],
  [70, -215],
  [12, -220],
  [-42, -206],
  [-92, -176],
  [-128, -132],
  [-146, -82],
  [-144, -30],
  [-120, 18],
  [-80, 48],
  [-30, 68],
  [18, 80],
  [62, 98],
  [92, 130],
  [100, 168],
  [78, 198],
  [32, 210],
  [-24, 204],
  [-64, 180],
  [-88, 142],
  [-98, 94],
  [-90, 48],
  [-60, 12],
  [-20, -4],
  [0, 0],
];

export const TRACKS: TrackDefinition[] = [
  createTrack({
    id: 'monza',
    name: 'Monza Circuit',
    description: 'Temple of speed with long straights and forgiving chicanes.',
    difficulty: 'arcade',
    color: '#55d5ff',
    theme: {
      fogColor: 0x060118,
      horizonColor: 0x0a0c35,
      accentColor: 0x3bf2ff,
    },
    targetLapTime: 78.79,
    lapLength: 5793,
    trackWidth: 6.5,
    basePoints: monzaBase,
    densify: 2,
  }),
  createTrack({
    id: 'monaco',
    name: 'Monaco Streets',
    description: 'Tight harbourside streets demanding precision and finesse.',
    difficulty: 'technical',
    color: '#ff47c4',
    theme: {
      fogColor: 0x070118,
      horizonColor: 0x150322,
      accentColor: 0xff7be1,
    },
    targetLapTime: 69.95,
    lapLength: 3337,
    trackWidth: 5.8,
    basePoints: monacoBase,
    densify: 3,
  }),
  createTrack({
    id: 'silverstone',
    name: 'Silverstone GP',
    description: 'Flowing high-speed corners with light technical sectors.',
    difficulty: 'balanced',
    color: '#7aff6d',
    theme: {
      fogColor: 0x050614,
      horizonColor: 0x07102c,
      accentColor: 0x8dffb2,
    },
    targetLapTime: 87.097,
    lapLength: 5891,
    trackWidth: 6.5,
    basePoints: silverstoneBase,
    densify: 2,
  }),
];

export const DEFAULT_TRACK = TRACKS[0];

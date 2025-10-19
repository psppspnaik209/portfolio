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
  assets?: TrackDefinition['assets'];
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
    assets: config.assets,
  };
};

const australianBase: Array<[number, number]> = [
  [0, 0],
  [26, -6],
  [58, -18],
  [90, -46],
  [104, -78],
  [96, -116],
  [68, -148],
  [30, -168],
  [-18, -174],
  [-60, -162],
  [-98, -134],
  [-120, -92],
  [-122, -46],
  [-106, -4],
  [-74, 24],
  [-32, 38],
  [16, 42],
  [58, 36],
  [86, 20],
  [104, -6],
  [102, -38],
  [84, -60],
  [56, -72],
  [26, -70],
  [2, -54],
  [-10, -26],
  [-4, -4],
  [0, 0],
];

const monacoBase: Array<[number, number]> = [
  [0, 0],
  [16, -10],
  [38, -20],
  [60, -32],
  [74, -50],
  [70, -74],
  [46, -96],
  [12, -104],
  [-20, -100],
  [-46, -86],
  [-64, -64],
  [-72, -32],
  [-62, -4],
  [-40, 22],
  [-18, 36],
  [10, 46],
  [38, 48],
  [60, 38],
  [74, 18],
  [76, -6],
  [58, -18],
  [32, -22],
  [8, -12],
  [0, 0],
];

const jeddahBase: Array<[number, number]> = [
  [0, 0],
  [28, -6],
  [70, -18],
  [108, -38],
  [138, -66],
  [152, -100],
  [144, -136],
  [116, -168],
  [74, -188],
  [22, -196],
  [-24, -190],
  [-62, -170],
  [-90, -140],
  [-102, -102],
  [-94, -64],
  [-70, -30],
  [-36, -10],
  [-4, -6],
  [30, -10],
  [60, -24],
  [84, -46],
  [98, -74],
  [94, -102],
  [74, -128],
  [40, -142],
  [6, -140],
  [-26, -124],
  [-46, -96],
  [-48, -62],
  [-32, -28],
  [0, 0],
];

export const TRACKS: TrackDefinition[] = [
  createTrack({
    id: 'albert-park',
    name: 'Albert Park',
    description: 'Bumpy parkland sweepers demanding rhythm and precision.',
    difficulty: 'balanced',
    color: '#61f0ff',
    theme: {
      fogColor: 0x031028,
      horizonColor: 0x021c36,
      accentColor: 0x4ae0ff,
    },
    targetLapTime: 80.097,
    lapLength: 5278,
    trackWidth: 6.2,
    basePoints: australianBase,
    densify: 3,
    assets: {
      modelUrl: '/assets/racer/tracks/australian-gp.glb',
      scaleMultiplier: 1.02,
      positionOffset: [0, -0.45, 0],
    },
  }),
  createTrack({
    id: 'monaco',
    name: 'Monaco Streets',
    description: 'Tight harbourside streets demanding finesse and daring.',
    difficulty: 'technical',
    color: '#ff47c4',
    theme: {
      fogColor: 0x070118,
      horizonColor: 0x150322,
      accentColor: 0xff7be1,
    },
    targetLapTime: 72.415,
    lapLength: 3337,
    trackWidth: 5.6,
    basePoints: monacoBase,
    densify: 3,
    assets: {
      modelUrl: '/assets/racer/tracks/monaco.glb',
      scaleMultiplier: 1.04,
      positionOffset: [0, -0.38, 0],
      rotationOffset: [0, Math.PI, 0],
    },
  }),
  createTrack({
    id: 'jeddah',
    name: 'Jeddah Corniche',
    description: 'High-speed waterfront ribbon lined with sweeping esses.',
    difficulty: 'arcade',
    color: '#8dff6b',
    theme: {
      fogColor: 0x02130f,
      horizonColor: 0x042424,
      accentColor: 0xa8ff8c,
    },
    targetLapTime: 87.95,
    lapLength: 6174,
    trackWidth: 6.8,
    basePoints: jeddahBase,
    densify: 3,
    assets: {
      modelUrl: '/assets/racer/tracks/jeddah.glb',
      scaleMultiplier: 1.05,
      positionOffset: [0, -0.5, 0],
    },
  }),
];

export const DEFAULT_TRACK = TRACKS[0];

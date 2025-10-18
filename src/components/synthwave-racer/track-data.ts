import type { TrackDefinition } from './types';

const scalePoints = (points: Array<[number, number]>, scale: number) =>
  points.map(([x, z]) => [x * scale, z * scale] as [number, number]);

const densifyPoints = (
  points: Array<[number, number]>,
  subdivisions: number,
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
      result.push([
        x1 + (x2 - x1) * t,
        z1 + (z2 - z1) * t,
      ]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

const monzaPoints = scalePoints(
  densifyPoints([
    [0, 0],
    [0, -40],
    [6, -120],
    [32, -170],
    [58, -210],
    [42, -260],
    [10, -305],
    [-24, -330],
    [-58, -350],
    [-74, -390],
    [-46, -430],
    [-10, -452],
    [36, -472],
    [70, -498],
    [84, -540],
    [68, -578],
    [28, -600],
    [-12, -590],
    [-34, -540],
    [-46, -470],
    [-52, -390],
    [-40, -300],
    [-18, -210],
    [-4, -120],
    [0, 0],
  ], 2),
  0.85,
);

const monacoPoints = scalePoints(
  densifyPoints([
    [0, 0],
    [24, -12],
    [58, -26],
    [82, -46],
    [90, -74],
    [70, -104],
    [38, -126],
    [-4, -142],
    [-38, -128],
    [-62, -96],
    [-78, -56],
    [-86, -6],
    [-72, 36],
    [-46, 70],
    [-10, 92],
    [30, 102],
    [68, 94],
    [90, 68],
    [94, 32],
    [82, 4],
    [58, -10],
    [34, -14],
    [10, -6],
    [0, 0],
  ], 3),
  1.1,
);

const silverstonePoints = scalePoints(
  densifyPoints([
    [0, 0],
    [46, -18],
    [94, -42],
    [128, -74],
    [140, -118],
    [130, -166],
    [98, -206],
    [52, -232],
    [0, -240],
    [-52, -226],
    [-100, -198],
    [-138, -160],
    [-160, -112],
    [-158, -58],
    [-140, -8],
    [-110, 28],
    [-70, 48],
    [-24, 58],
    [18, 66],
    [56, 84],
    [76, 112],
    [68, 146],
    [38, 172],
    [0, 182],
    [-34, 170],
    [-54, 140],
    [-66, 104],
    [-76, 64],
    [-74, 24],
    [-58, -4],
    [-32, -14],
    [0, 0],
  ], 2),
  0.95,
);

export const TRACKS: TrackDefinition[] = [
  {
    id: 'monza',
    name: 'Monza Circuit',
    description: 'Temple of speed with long straights and forgiving chicanes.',
    difficulty: 'arcade',
    color: '#55d5ff',
    centerline: monzaPoints,
    theme: {
      fogColor: 0x060118,
      horizonColor: 0x0a0c35,
      accentColor: 0x3bf2ff,
    },
  },
  {
    id: 'monaco',
    name: 'Monaco Streets',
    description: 'Tight harbourside streets demanding precision and finesse.',
    difficulty: 'technical',
    color: '#ff47c4',
    centerline: monacoPoints,
    theme: {
      fogColor: 0x070118,
      horizonColor: 0x150322,
      accentColor: 0xff7be1,
    },
  },
  {
    id: 'silverstone',
    name: 'Silverstone GP',
    description: 'Flowing high-speed corners with light technical sectors.',
    difficulty: 'balanced',
    color: '#7aff6d',
    centerline: silverstonePoints,
    theme: {
      fogColor: 0x050614,
      horizonColor: 0x07102c,
      accentColor: 0x8dffb2,
    },
  },
];

export const DEFAULT_TRACK = TRACKS[0];

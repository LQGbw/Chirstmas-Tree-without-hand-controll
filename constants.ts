import * as THREE from 'three';

// Configuration
export const FOLIAGE_COUNT = 15000;
export const ORNAMENT_COUNT = 400;
export const PHOTO_COUNT = 24;
export const TREE_HEIGHT = 14;
export const TREE_RADIUS = 5.5;

// Helper to generate random point in sphere (Chaos state)
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// Helper to generate point on cone (Tree state)
export const getTreePoint = (heightRatio: number, angle: number, radiusRatio = 1.0): [number, number, number] => {
  const y = (heightRatio * TREE_HEIGHT) - (TREE_HEIGHT / 2);
  // Cone radius at this height (tapering to top)
  const r = (1 - heightRatio) * TREE_RADIUS * radiusRatio;
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  return [x, y, z];
};

// Math lerp helper
export const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

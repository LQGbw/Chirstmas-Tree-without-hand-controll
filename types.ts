export interface PositionData {
  target: [number, number, number];
  chaos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface TreeState {
  progress: number; // 0 (Chaos) to 1 (Formed)
}

export type ViewMode = 'default' | 'topDown';

export const TREE_COLORS = {
  EMERALD: "#004225",
  GOLD: "#FFD700",
  RIBBON_RED: "#8B0000",
  WARM_WHITE: "#FFFDD0",
  SHIMMER: "#F5E6C8"
};
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Container {
  width: number;
  height: number;
  depth: number;
}

export interface PackingParams {
  count: number;
  minScale: number;
  maxScale: number;
  container: Container;
  maxAttempts: number;
  spacing: number;
  targetFill: number;
  autoContainer: boolean;
  packingPasses?: number;
  cellSize?: number;
}

export interface PackedObject {
  position: Vector3;
  quaternion: Quaternion;
  scale: number;
  radius: number;
  shapeIndex?: number;
}

export interface GridIndex {
  x: number;
  y: number;
  z: number;
}

export interface RotationEuler {
  x: number;
  y: number;
  z: number;
}

export interface PlacementCandidate extends PackedObject {
  score: number;
}

export interface SupportSample {
  position: Vector3;
  radius: number;
}

declare global {
  interface Window {
    TEST_PACK?: () => PackedObject[];
  }
}

export interface UIState extends PackingParams {
  enablePhysics: boolean;
  shapeMode: "dodeca" | "brick";
}

export interface Exporter {
  exportGLTF(filename: string): void;
}

export {};

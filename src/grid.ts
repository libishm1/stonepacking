import { Container, GridIndex, PackedObject, Vector3 } from "./types";

interface GridParams {
  container: Container;
  cellSize: number;
}

interface GridItem {
  position: Vector3;
  radius: number;
}

const neighborOffsets: GridIndex[] = buildNeighborOffsets();

export class SpatialGrid {
  private readonly cellSize: number;
  private readonly container: Container;
  private readonly cells = new Map<string, GridItem[]>();

  constructor(params: GridParams) {
    this.cellSize = params.cellSize;
    this.container = params.container;
  }

  insert(object: PackedObject): void {
    const key = this.cellKey(this.indexFromPosition(object.position));
    const bucket = this.cells.get(key) ?? [];
    bucket.push({ position: object.position, radius: object.radius });
    this.cells.set(key, bucket);
  }

  neighbors(position: Vector3): GridItem[] {
    const baseIndex = this.indexFromPosition(position);
    const nearby: GridItem[] = [];

    for (const offset of neighborOffsets) {
      const idx = { x: baseIndex.x + offset.x, y: baseIndex.y + offset.y, z: baseIndex.z + offset.z };
      const key = this.cellKey(idx);
      const cell = this.cells.get(key);
      if (cell) {
        nearby.push(...cell);
      }
    }

    return nearby;
  }

  private indexFromPosition(position: Vector3): GridIndex {
    const half = {
      x: this.container.width / 2,
      y: this.container.height / 2,
      z: this.container.depth / 2
    };

    return {
      x: Math.floor((position.x + half.x) / this.cellSize),
      y: Math.floor((position.y + half.y) / this.cellSize),
      z: Math.floor((position.z + half.z) / this.cellSize)
    };
  }

  private cellKey(index: GridIndex): string {
    return `${index.x}|${index.y}|${index.z}`;
  }
}

function buildNeighborOffsets(): GridIndex[] {
  const offsets: GridIndex[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        offsets.push({ x: dx, y: dy, z: dz });
      }
    }
  }

  return offsets;
}

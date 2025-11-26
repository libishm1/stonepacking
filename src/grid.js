const neighborOffsets = buildNeighborOffsets();
export class SpatialGrid {
    cellSize;
    container;
    cells = new Map();
    constructor(params) {
        this.cellSize = params.cellSize;
        this.container = params.container;
    }
    insert(object) {
        const key = this.cellKey(this.indexFromPosition(object.position));
        const bucket = this.cells.get(key) ?? [];
        bucket.push({ position: object.position, radius: object.radius });
        this.cells.set(key, bucket);
    }
    neighbors(position) {
        const baseIndex = this.indexFromPosition(position);
        const nearby = [];
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
    indexFromPosition(position) {
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
    cellKey(index) {
        return `${index.x}|${index.y}|${index.z}`;
    }
}
function buildNeighborOffsets() {
    const offsets = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
                offsets.push({ x: dx, y: dy, z: dz });
            }
        }
    }
    return offsets;
}

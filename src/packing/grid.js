const neighborOffsets = buildNeighborOffsets();
export class SpatialGrid {
    cellSize;
    half;
    cells = new Map();
    constructor(params) {
        this.cellSize = params.cellSize;
        this.half = {
            x: params.container.width / 2,
            y: params.container.height / 2,
            z: params.container.depth / 2
        };
    }
    insert(object) {
        const key = this.cellKey(this.indexFromPosition(object.position));
        const bucket = this.cells.get(key) ?? [];
        bucket.push({ position: object.position, radius: object.radius });
        this.cells.set(key, bucket);
    }
    neighbors(position) {
        const index = this.indexFromPosition(position);
        const list = [];
        for (const offset of neighborOffsets) {
            const key = this.cellKey({ x: index.x + offset.x, y: index.y + offset.y, z: index.z + offset.z });
            const bucket = this.cells.get(key);
            if (bucket) {
                list.push(...bucket);
            }
        }
        return list;
    }
    indexFromPosition(position) {
        return {
            x: Math.floor((position.x + this.half.x) / this.cellSize),
            y: Math.floor((position.y + this.half.y) / this.cellSize),
            z: Math.floor((position.z + this.half.z) / this.cellSize)
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

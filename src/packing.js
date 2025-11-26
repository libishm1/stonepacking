import { SpatialGrid } from "./packing/grid";
import { collidesWithNeighbors, isInsideContainer } from "./packing/collision";
import { scorePlacement } from "./packing/scoring";
import { BASE_RADIUS, DISCRETE_ROTATIONS, computeRadius, rotationToQuaternion } from "./packing/stone";
import { clamp, randomInRange } from "./utils";
const DEFAULT_MAX_ATTEMPTS = 100;
const DEFAULT_SPACING = 0.05;
const DEFAULT_TARGET_FILL = 0.95;
const FAILURE_LIMIT_FACTOR = 0.25;
const SPACING_VOLUME_FACTOR = 0.1;
const FILL_OVERSHOOT = 0.85;
const STAGGER_ENABLED = true;
const SIZE_VARIATION_LIMIT = 0.2;
const MAX_COUNT = 1000;
const MAX_ATTEMPTS_LIMIT = 100;
export { BASE_RADIUS } from "./packing/stone";
export function createDefaultParams() {
    return {
        count: 100,
        minScale: 1,
        maxScale: 1.2,
        container: { width: 12, height: 12, depth: 12 },
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        spacing: DEFAULT_SPACING,
        targetFill: DEFAULT_TARGET_FILL,
        autoContainer: false,
        packingPasses: 3
    };
}
export function deriveContainer(params) {
    if (!params.autoContainer) {
        return params.container;
    }
    const averageScale = (params.minScale + params.maxScale) / 2;
    const averageRadius = BASE_RADIUS * averageScale;
    const averageVolume = (4 / 3) * Math.PI * Math.pow(averageRadius, 3);
    const totalVolume = averageVolume * params.count * (1 + params.spacing * SPACING_VOLUME_FACTOR);
    const effectiveTarget = Math.min(0.95, Math.max(0.1, (params.targetFill || DEFAULT_TARGET_FILL) / FILL_OVERSHOOT));
    const desiredContainerVolume = totalVolume / effectiveTarget;
    const edge = Math.cbrt(desiredContainerVolume);
    const minEdge = BASE_RADIUS * 4;
    const size = Math.max(edge, minEdge);
    return { width: size, height: size, depth: size };
}
export function packObjects(params, seeded = []) {
    const normalized = normalizeParams(params);
    let masonry = buildMasonryConfig(normalized);
    const cellSize = computeCellSize(normalized);
    const grid = new SpatialGrid({ container: normalized.container, cellSize });
    const placed = [...seeded];
    seeded.forEach((item) => grid.insert(item));
    let consecutiveFailures = 0;
    const failureLimit = Math.max(3, Math.floor(normalized.count * FAILURE_LIMIT_FACTOR));
    let firstPlacedRadius = null;
    for (let i = 0; i < normalized.count; i++) {
        const placement = placeStone(normalized, masonry, grid, placed);
        if (!placement) {
            consecutiveFailures++;
            if (consecutiveFailures > failureLimit) {
                break;
            }
            continue;
        }
        consecutiveFailures = 0;
        grid.insert(placement);
        placed.push(placement);
        if (firstPlacedRadius === null) {
            firstPlacedRadius = placement.radius;
            masonry = adjustMasonryAfterFirst(masonry, firstPlacedRadius, normalized);
        }
    }
    return placed;
}
function placeStone(params, masonry, grid, placed) {
    const scale = randomInRange(params.minScale, params.maxScale);
    const radius = computeRadius(scale);
    const neighbors = placed.map(toSupportSample);
    const candidate = findBestPlacement(params, masonry, grid, neighbors, radius, scale);
    if (!candidate) {
        return null;
    }
    return {
        position: candidate.position,
        quaternion: candidate.quaternion,
        scale,
        radius
    };
}
function findBestPlacement(params, masonry, grid, supportList, radius, scale) {
    let best = null;
    for (const rotation of DISCRETE_ROTATIONS) {
        const quaternion = rotationToQuaternion(rotation);
        const candidate = searchPlacementForRotation(params, masonry, grid, supportList, radius, quaternion, scale);
        if (candidate && (!best || candidate.score > best.score)) {
            best = candidate;
        }
    }
    return best;
}
function searchPlacementForRotation(params, masonry, grid, supportList, radius, quaternion, scale) {
    const bounds = samplingBounds(params.container, radius, params.spacing);
    let best = null;
    for (let attempt = 0; attempt < params.maxAttempts; attempt++) {
        const baseXZ = randomXZ(bounds);
        const supportY = computeSupportHeight(baseXZ, radius, params.spacing, supportList, params.container);
        const y = snapToCourse(supportY, masonry);
        const layerIndex = computeLayerIndex(y, masonry);
        const snapped2d = applyStagger(baseXZ, masonry, layerIndex, bounds);
        const position = { x: snapped2d.x, y, z: snapped2d.z };
        if (!isInsideContainer(position, radius, params.spacing, params.container)) {
            continue;
        }
        const neighbors = grid.neighbors(position);
        if (collidesWithNeighbors(position, radius, params.spacing, neighbors)) {
            continue;
        }
        const score = scorePlacement(position, radius, params.spacing, params.container, neighbors);
        const candidate = {
            position,
            quaternion,
            radius,
            scale,
            score
        };
        if (!best || score > best.score) {
            best = candidate;
        }
    }
    return best;
}
function computeSupportHeight(point, radius, spacing, supportList, container) {
    const floor = -container.height / 2 + radius + spacing;
    let height = floor;
    const limitPadding = radius + spacing;
    for (const neighbor of supportList) {
        const dx = point.x - neighbor.position.x;
        const dz = point.z - neighbor.position.z;
        const horizontal = Math.sqrt(dx * dx + dz * dz);
        const maxReach = limitPadding + neighbor.radius;
        if (horizontal <= maxReach) {
            const candidateHeight = neighbor.position.y + neighbor.radius + spacing + radius;
            if (candidateHeight > height) {
                height = candidateHeight;
            }
        }
    }
    return height;
}
function samplingBounds(container, radius, spacing) {
    const margin = radius + spacing;
    return {
        minX: -container.width / 2 + margin,
        maxX: container.width / 2 - margin,
        minZ: -container.depth / 2 + margin,
        maxZ: container.depth / 2 - margin
    };
}
function randomXZ(bounds) {
    return {
        x: randomInRange(bounds.minX, bounds.maxX),
        z: randomInRange(bounds.minZ, bounds.maxZ)
    };
}
function normalizeParams(params) {
    const minScale = clamp(params.minScale, 0.05, params.maxScale || 1);
    const cappedMax = minScale * (1 + SIZE_VARIATION_LIMIT);
    const maxScale = Math.min(Math.max(minScale, params.maxScale), cappedMax);
    const spacing = Math.max(0, params.spacing);
    const targetFill = clamp(params.targetFill ?? DEFAULT_TARGET_FILL, 0.1, 0.95);
    const packingPasses = params.packingPasses ? Math.max(1, Math.floor(params.packingPasses)) : 1;
    return {
        count: Math.max(0, Math.min(MAX_COUNT, Math.floor(params.count))),
        minScale,
        maxScale,
        spacing,
        targetFill,
        autoContainer: params.autoContainer ?? true,
        packingPasses,
        container: {
            width: Math.max(params.container.width, BASE_RADIUS * 2),
            height: Math.max(params.container.height, BASE_RADIUS * 2),
            depth: Math.max(params.container.depth, BASE_RADIUS * 2)
        },
        maxAttempts: clamp(Math.floor(params.maxAttempts || DEFAULT_MAX_ATTEMPTS), 1, MAX_ATTEMPTS_LIMIT),
        cellSize: params.cellSize
    };
}
function computeCellSize(params) {
    const averageScale = (params.minScale + params.maxScale) / 2;
    const averageRadius = BASE_RADIUS * averageScale;
    const target = averageRadius * 2 + params.spacing;
    const maxRadius = BASE_RADIUS * params.maxScale * 2 + params.spacing;
    if (params.cellSize && params.cellSize > 0) {
        return params.cellSize;
    }
    return Math.max(target, maxRadius, BASE_RADIUS * 0.5);
}
function toSupportSample(object) {
    return { position: object.position, radius: object.radius };
}
export function computeFillRatio(objects, container) {
    if (container.width <= 0 || container.height <= 0 || container.depth <= 0) {
        return 0;
    }
    const totalVolume = objects.reduce((sum, obj) => sum + (4 / 3) * Math.PI * Math.pow(obj.radius, 3), 0);
    const containerVolume = container.width * container.height * container.depth;
    return totalVolume / containerVolume;
}
function buildMasonryConfig(params) {
    const averageScale = (params.minScale + params.maxScale) / 2;
    const averageRadius = BASE_RADIUS * averageScale;
    const courseHeight = computeCourseHeightFromRadius(averageRadius, params.spacing);
    const cellWidth = Math.max(averageRadius * 2 + params.spacing, BASE_RADIUS);
    // Align floor with support calculation (radius + spacing from bottom)
    const floor = -params.container.height / 2 + averageRadius + params.spacing;
    return { courseHeight, cellWidth, floor };
}
function snapToCourse(height, config) {
    const relative = height - config.floor;
    const layer = Math.max(0, Math.round(relative / config.courseHeight));
    return config.floor + layer * config.courseHeight;
}
function computeLayerIndex(y, config) {
    return Math.max(0, Math.round((y - config.floor) / config.courseHeight));
}
function applyStagger(base, config, layerIndex, bounds) {
    if (!STAGGER_ENABLED) {
        return clampToBounds(base, bounds);
    }
    const offset = layerIndex % 2 === 0 ? 0 : config.cellWidth * 0.5;
    const staggered = { x: base.x + offset, z: base.z };
    return clampToBounds(staggered, bounds);
}
function clampToBounds(position, bounds) {
    return {
        x: clamp(position.x, bounds.minX, bounds.maxX),
        z: clamp(position.z, bounds.minZ, bounds.maxZ)
    };
}
function adjustMasonryAfterFirst(config, firstRadius, params) {
    const courseHeight = computeCourseHeightFromRadius(firstRadius, params.spacing);
    const cellWidth = Math.max(firstRadius * 2 + params.spacing, BASE_RADIUS);
    return {
        courseHeight,
        cellWidth,
        floor: config.floor
    };
}
function computeCourseHeightFromRadius(radius, spacing) {
    return Math.max(radius * 2 + spacing * 0.02, BASE_RADIUS * 0.6);
}

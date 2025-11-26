import { minDistanceToNeighbors } from "./collision";
const CENTER_WEIGHT = 0.4;
const PROXIMITY_WEIGHT = 0.6;
const HEIGHT_WEIGHT = 0.8;
export function scorePlacement(position, radius, spacing, container, neighbors) {
    const proximity = proximityScore(position, radius, spacing, neighbors);
    const height = heightScore(position, container);
    const centering = centeringScore(position, radius, spacing, container);
    return PROXIMITY_WEIGHT * proximity + HEIGHT_WEIGHT * height + CENTER_WEIGHT * centering;
}
function proximityScore(position, radius, spacing, neighbors) {
    if (neighbors.length === 0) {
        return 0;
    }
    const min = minDistanceToNeighbors(position, radius, spacing, neighbors);
    return -min;
}
function heightScore(position, container) {
    const heightAboveFloor = position.y + container.height / 2;
    return -heightAboveFloor;
}
function centeringScore(position, radius, spacing, container) {
    const marginX = container.width / 2 - (radius + spacing);
    const marginZ = container.depth / 2 - (radius + spacing);
    const nx = Math.abs(position.x) / Math.max(marginX, 0.0001);
    const nz = Math.abs(position.z) / Math.max(marginZ, 0.0001);
    return -(nx + nz);
}

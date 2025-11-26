import { distanceSquared } from "../utils";
export function isInsideContainer(position, radius, spacing, container) {
    const margin = radius + spacing;
    if (Math.abs(position.x) + margin > container.width / 2) {
        return false;
    }
    if (Math.abs(position.y) + margin > container.height / 2) {
        return false;
    }
    if (Math.abs(position.z) + margin > container.depth / 2) {
        return false;
    }
    return true;
}
export function collidesWithNeighbors(position, radius, spacing, neighbors) {
    const limitPadding = radius + spacing;
    for (const neighbor of neighbors) {
        const limit = limitPadding + neighbor.radius;
        if (distanceSquared(position, neighbor.position) < limit * limit) {
            return true;
        }
    }
    return false;
}
export function minDistanceToNeighbors(position, radius, spacing, neighbors) {
    let min = Number.POSITIVE_INFINITY;
    const limitPadding = radius + spacing;
    for (const neighbor of neighbors) {
        const centerDist = Math.sqrt(distanceSquared(position, neighbor.position));
        const separation = centerDist - (limitPadding + neighbor.radius);
        if (separation < min) {
            min = separation;
        }
    }
    return min;
}

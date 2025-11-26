import { Container, SupportSample, Vector3 } from "../types";
import { distanceSquared } from "../utils";

export function isInsideContainer(position: Vector3, radius: number, spacing: number, container: Container): boolean {
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

export function collidesWithNeighbors(
  position: Vector3,
  radius: number,
  spacing: number,
  neighbors: SupportSample[]
): boolean {
  const limitPadding = radius + spacing;

  for (const neighbor of neighbors) {
    const limit = limitPadding + neighbor.radius;
    if (distanceSquared(position, neighbor.position) < limit * limit) {
      return true;
    }
  }

  return false;
}

export function minDistanceToNeighbors(position: Vector3, radius: number, spacing: number, neighbors: SupportSample[]): number {
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

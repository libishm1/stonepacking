import { distanceSquared } from "./utils";
const neighborOffsets = buildNeighborOffsets();
const GRAVITY = -9.81;
const DAMPING = 0.98;
const RESTITUTION = 0.5;
const MAX_DT = 1 / 30;
export class PhysicsEngine {
    bodies = [];
    container;
    spacing;
    cellSize;
    constructor(objects, container, spacing) {
        this.container = container;
        this.spacing = Math.max(0, spacing);
        this.cellSize = computeCellSize(objects, spacing);
        this.bodies = objects.map((object) => ({
            ...object,
            velocity: { x: 0, y: 0, z: 0 },
            mass: Math.max(0.0001, object.scale)
        }));
    }
    step(dt) {
        const clampedDt = Math.min(dt, MAX_DT);
        applyGravity(this.bodies, clampedDt);
        integrate(this.bodies, clampedDt);
        resolveContainerCollisions(this.bodies, this.container, this.spacing);
        resolveBodyCollisions(this.bodies, this.cellSize, this.spacing);
        dampVelocities(this.bodies);
        return this.bodies.map((body) => ({
            position: body.position,
            quaternion: body.quaternion,
            scale: body.scale,
            radius: body.radius
        }));
    }
}
function applyGravity(bodies, dt) {
    for (const body of bodies) {
        body.velocity.y += GRAVITY * dt;
    }
}
function integrate(bodies, dt) {
    for (const body of bodies) {
        body.position.x += body.velocity.x * dt;
        body.position.y += body.velocity.y * dt;
        body.position.z += body.velocity.z * dt;
    }
}
function resolveContainerCollisions(bodies, container, spacing) {
    const half = {
        x: container.width / 2,
        y: container.height / 2,
        z: container.depth / 2
    };
    for (const body of bodies) {
        const limit = body.radius + spacing;
        if (body.position.x + limit > half.x) {
            body.position.x = half.x - limit;
            body.velocity.x *= -RESTITUTION;
        }
        else if (body.position.x - limit < -half.x) {
            body.position.x = -half.x + limit;
            body.velocity.x *= -RESTITUTION;
        }
        if (body.position.y + limit > half.y) {
            body.position.y = half.y - limit;
            body.velocity.y *= -RESTITUTION;
        }
        else if (body.position.y - limit < -half.y) {
            body.position.y = -half.y + limit;
            body.velocity.y *= -RESTITUTION;
        }
        if (body.position.z + limit > half.z) {
            body.position.z = half.z - limit;
            body.velocity.z *= -RESTITUTION;
        }
        else if (body.position.z - limit < -half.z) {
            body.position.z = -half.z + limit;
            body.velocity.z *= -RESTITUTION;
        }
    }
}
function resolveBodyCollisions(bodies, cellSize, spacing) {
    const grid = new Map();
    for (let i = 0; i < bodies.length; i++) {
        const index = indexFromPosition(bodies[i].position, cellSize);
        const key = cellKey(index);
        const bucket = grid.get(key) ?? [];
        bucket.push(i);
        grid.set(key, bucket);
    }
    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        const baseIndex = indexFromPosition(body.position, cellSize);
        for (const offset of neighborOffsets) {
            const key = cellKey({ x: baseIndex.x + offset.x, y: baseIndex.y + offset.y, z: baseIndex.z + offset.z });
            const bucket = grid.get(key);
            if (!bucket) {
                continue;
            }
            for (const neighborIndex of bucket) {
                if (neighborIndex <= i) {
                    continue;
                }
                resolvePair(body, bodies[neighborIndex], spacing);
            }
        }
    }
}
function resolvePair(a, b, spacing) {
    const minDistance = a.radius + b.radius + spacing;
    const distSq = distanceSquared(a.position, b.position);
    if (distSq >= minDistance * minDistance) {
        return;
    }
    const distance = Math.max(Math.sqrt(distSq), 0.0001);
    const overlap = (minDistance - distance) * 0.5;
    const normal = {
        x: (a.position.x - b.position.x) / distance,
        y: (a.position.y - b.position.y) / distance,
        z: (a.position.z - b.position.z) / distance
    };
    a.position.x += normal.x * overlap;
    a.position.y += normal.y * overlap;
    a.position.z += normal.z * overlap;
    b.position.x -= normal.x * overlap;
    b.position.y -= normal.y * overlap;
    b.position.z -= normal.z * overlap;
    const relativeVelocity = {
        x: a.velocity.x - b.velocity.x,
        y: a.velocity.y - b.velocity.y,
        z: a.velocity.z - b.velocity.z
    };
    const separatingVelocity = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y + relativeVelocity.z * normal.z;
    if (separatingVelocity > 0) {
        return;
    }
    const impulse = -(1 + RESTITUTION) * separatingVelocity;
    const impulseDivisor = a.mass + b.mass;
    const impulseScalarA = impulse * (b.mass / impulseDivisor);
    const impulseScalarB = impulse * (a.mass / impulseDivisor);
    a.velocity.x += normal.x * impulseScalarA;
    a.velocity.y += normal.y * impulseScalarA;
    a.velocity.z += normal.z * impulseScalarA;
    b.velocity.x -= normal.x * impulseScalarB;
    b.velocity.y -= normal.y * impulseScalarB;
    b.velocity.z -= normal.z * impulseScalarB;
}
function dampVelocities(bodies) {
    for (const body of bodies) {
        body.velocity.x *= DAMPING;
        body.velocity.y *= DAMPING;
        body.velocity.z *= DAMPING;
    }
}
function computeCellSize(objects, spacing) {
    const maxRadius = objects.reduce((max, obj) => Math.max(max, obj.radius), 0);
    return Math.max(maxRadius * 2 + spacing, 0.5);
}
function indexFromPosition(position, cellSize) {
    return {
        x: Math.floor(position.x / cellSize),
        y: Math.floor(position.y / cellSize),
        z: Math.floor(position.z / cellSize)
    };
}
function cellKey(index) {
    return `${index.x}|${index.y}|${index.z}`;
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

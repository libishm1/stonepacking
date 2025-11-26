export function clamp(value, min, max) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}
export function randomInRange(min, max) {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return low + Math.random() * (high - low);
}
export function randomQuaternion() {
    const u1 = Math.random();
    const u2 = Math.random();
    const u3 = Math.random();
    const sqrt1 = Math.sqrt(1 - u1);
    const sqrt2 = Math.sqrt(u1);
    return {
        x: sqrt1 * Math.sin(2 * Math.PI * u2),
        y: sqrt1 * Math.cos(2 * Math.PI * u2),
        z: sqrt2 * Math.sin(2 * Math.PI * u3),
        w: sqrt2 * Math.cos(2 * Math.PI * u3)
    };
}
export function randomPositionInContainer(container, radius, spacing) {
    const margin = radius + spacing;
    if (margin * 2 > container.width || margin * 2 > container.height || margin * 2 > container.depth) {
        return null;
    }
    return {
        x: randomInRange(-container.width / 2 + margin, container.width / 2 - margin),
        y: randomInRange(-container.height / 2 + margin, container.height / 2 - margin),
        z: randomInRange(-container.depth / 2 + margin, container.depth / 2 - margin)
    };
}
export function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
}

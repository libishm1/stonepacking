export const BASE_RADIUS = 1;
export const DISCRETE_ROTATIONS = [
    { x: 0, y: 0, z: 0 },
    { x: Math.PI / 2, y: 0, z: 0 },
    { x: -Math.PI / 2, y: 0, z: 0 },
    { x: Math.PI, y: 0, z: 0 },
    { x: 0, y: Math.PI / 2, z: 0 },
    { x: 0, y: -Math.PI / 2, z: 0 }
];
export function rotationToQuaternion(rotation) {
    const cx = Math.cos(rotation.x / 2);
    const sx = Math.sin(rotation.x / 2);
    const cy = Math.cos(rotation.y / 2);
    const sy = Math.sin(rotation.y / 2);
    const cz = Math.cos(rotation.z / 2);
    const sz = Math.sin(rotation.z / 2);
    return {
        x: sx * cy * cz - cx * sy * sz,
        y: cx * sy * cz + sx * cy * sz,
        z: cx * cy * sz - sx * sy * cz,
        w: cx * cy * cz + sx * sy * sz
    };
}
export function computeRadius(scale) {
    return BASE_RADIUS * scale;
}

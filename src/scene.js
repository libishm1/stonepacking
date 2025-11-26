import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { BASE_RADIUS } from "./packing";
export function createScene(target, initialContainer) {
    const renderer = createRenderer(target);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1220");
    const camera = createCamera(target);
    const controls = createControls(camera, renderer);
    addLights(scene);
    const dodecaGeometry = new THREE.DodecahedronGeometry(BASE_RADIUS, 0);
    const brickGeometry = buildBrickGeometry();
    const material = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        flatShading: true,
        metalness: 0.1,
        roughness: 0.65
    });
    let containerHelper = buildContainerHelper(initialContainer);
    scene.add(containerHelper);
    let shapeMesh = null;
    let instanceCount = 0;
    let frameHandler = null;
    let shapeMode = "dodeca";
    const exporter = new GLTFExporter();
    resizeToTarget(renderer, camera, target);
    startRenderLoop(renderer, scene, camera, controls, () => frameHandler);
    window.addEventListener("resize", () => resizeToTarget(renderer, camera, target));
    return {
        setContainer(container) {
            scene.remove(containerHelper);
            containerHelper.geometry.dispose();
            containerHelper.material.dispose();
            containerHelper = buildContainerHelper(container);
            scene.add(containerHelper);
            repositionCamera(camera, controls, container);
        },
        setShapeMode(mode) {
            shapeMode = mode;
        },
        renderObjects(objects) {
            disposeSingle(shapeMesh);
            shapeMesh = null;
            instanceCount = 0;
            if (objects.length === 0) {
                return;
            }
            if (shapeMode === "dodeca") {
                const mesh = new THREE.InstancedMesh(dodecaGeometry, material, objects.length);
                const matrix = new THREE.Matrix4();
                objects.forEach((object, index) => {
                    composeMatrix(matrix, object);
                    mesh.setMatrixAt(index, matrix);
                });
                mesh.instanceMatrix.needsUpdate = true;
                shapeMesh = mesh;
                instanceCount = objects.length;
                scene.add(mesh);
                return;
            }
            if (shapeMode === "brick") {
                const mesh = new THREE.InstancedMesh(brickGeometry, material, objects.length);
                const matrix = new THREE.Matrix4();
                objects.forEach((object, index) => {
                    composeMatrix(matrix, object);
                    mesh.setMatrixAt(index, matrix);
                });
                mesh.instanceMatrix.needsUpdate = true;
                shapeMesh = mesh;
                instanceCount = objects.length;
                scene.add(mesh);
                return;
            }
        },
        updateInstances(objects) {
            if (!shapeMesh) {
                this.renderObjects(objects);
                return;
            }
            if (objects.length !== instanceCount) {
                this.renderObjects(objects);
                return;
            }
            const matrix = new THREE.Matrix4();
            for (let i = 0; i < objects.length; i++) {
                composeMatrix(matrix, objects[i]);
                shapeMesh.setMatrixAt(i, matrix);
            }
            shapeMesh.instanceMatrix.needsUpdate = true;
        },
        onFrame(handler) {
            frameHandler = handler;
        },
        exportGLTF(filename) {
            exporter.parse(scene, (gltf) => {
                const isBinary = gltf instanceof ArrayBuffer;
                const data = isBinary ? gltf : JSON.stringify(gltf, null, 2);
                const blob = new Blob([data], { type: isBinary ? "model/gltf-binary" : "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename || (isBinary ? "scene.glb" : "scene.gltf");
                link.click();
                URL.revokeObjectURL(url);
            }, (error) => console.error("GLTF export failed", error), { binary: true, includeCustomExtensions: true });
        },
        dispose() {
            disposeSingle(shapeMesh);
            containerHelper.geometry.dispose();
            containerHelper.material.dispose();
            renderer.dispose();
        }
    };
}
function createRenderer(target) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    target.appendChild(renderer.domElement);
    return renderer;
}
function createCamera(target) {
    const aspect = target.clientWidth / Math.max(1, target.clientHeight);
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(25, 18, 28);
    return camera;
}
function createControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();
    return controls;
}
function addLights(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(12, 16, 10);
    scene.add(ambient);
    scene.add(directional);
}
function buildContainerHelper(container) {
    const geometry = new THREE.BoxGeometry(container.width, container.height, container.depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0x334155 });
    return new THREE.LineSegments(edges, material);
}
function startRenderLoop(renderer, scene, camera, controls, handlerFactory) {
    const clock = new THREE.Clock();
    const tick = () => {
        const delta = clock.getDelta();
        const handler = handlerFactory();
        if (handler) {
            handler(delta);
        }
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    };
    tick();
}
function resizeToTarget(renderer, camera, target) {
    const width = target.clientWidth || window.innerWidth;
    const height = target.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
}
function repositionCamera(camera, controls, container) {
    const largest = Math.max(container.width, container.height, container.depth);
    const distance = largest * 1.4;
    camera.position.set(distance, distance * 0.7, distance);
    controls.target.set(0, 0, 0);
    controls.update();
}
function disposeSingle(mesh) {
    if (!mesh) {
        return;
    }
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh.removeFromParent();
}
function buildBrickGeometry() {
    // I-beam-like brick with longer X dimension to encourage wall-like stacking
    const baseWidth = BASE_RADIUS * 2.2;
    const baseHeight = BASE_RADIUS * 0.9;
    const baseDepth = BASE_RADIUS * 1.2;
    const geometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
}
function composeMatrix(matrix, object) {
    const position = new THREE.Vector3(object.position.x, object.position.y, object.position.z);
    const quaternion = new THREE.Quaternion(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w);
    const scale = new THREE.Vector3(object.scale, object.scale, object.scale);
    matrix.compose(position, quaternion, scale);
}

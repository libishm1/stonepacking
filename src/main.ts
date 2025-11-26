import "./style.css";
import { computeFillRatio, createDefaultParams, deriveContainer, packObjects } from "./packing";
import { createScene } from "./scene";
import { createUI, UIState } from "./ui";
import { PhysicsEngine } from "./physics";
import { PackedObject } from "./types";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error("Missing #app container");
}

const uiPanel = document.createElement("div");
uiPanel.className = "control-panel";

const canvasWrap = document.createElement("div");
canvasWrap.className = "canvas-wrap";

root.append(uiPanel, canvasWrap);

const defaults: UIState = { ...createDefaultParams(), enablePhysics: true, shapeMode: "dodeca" };
const initialContainer = deriveContainer(defaults);
defaults.container = initialContainer;
const scene = createScene(canvasWrap, initialContainer);
let physics: PhysicsEngine | null = null;
let activeObjects: PackedObject[] = [];
let currentContainer = initialContainer;
const stats = document.createElement("div");
stats.style.fontSize = "12px";
stats.style.opacity = "0.8";
stats.textContent = "Packed: 0";
uiPanel.appendChild(stats);

createUI(uiPanel, defaults, handleGenerate, handleExport);
handleGenerate(defaults);

window.TEST_PACK = () => {
  const result = packObjects(createDefaultParams());
  console.log(`${result.length} objects packed`);
  return result;
};

function handleGenerate(state: UIState): void {
  const { enablePhysics, packingPasses = 1, ...packingParams } = state;
  const derivedContainer = state.autoContainer ? deriveContainer(packingParams) : packingParams.container;
  currentContainer = derivedContainer;
  let packed: PackedObject[] = [];
  let remaining = state.count;

  const passes = Math.max(1, Math.floor(packingPasses));
  for (let pass = 0; pass < passes; pass++) {
    const isLast = pass === passes - 1;
    const portion = isLast ? remaining : Math.max(0, Math.ceil(remaining / (passes - pass)));
    if (portion <= 0) {
      break;
    }
    const passPacked = packObjects({ ...packingParams, count: portion, container: derivedContainer }, packed);
    packed = passPacked;
    remaining = state.count - packed.length;

    if (enablePhysics && packed.length > 0 && remaining > 0) {
      const tempPhysics = new PhysicsEngine(packed, derivedContainer, state.spacing);
      for (let i = 0; i < 8; i++) {
        tempPhysics.step(1 / 30);
      }
      packed = tempPhysics.step(1 / 30);
    }
  }

  const fillRatio = computeFillRatio(packed, derivedContainer);
  console.log(`Packed ${packed.length} objects. Fill ratio: ${(fillRatio * 100).toFixed(1)}%`);
  stats.textContent = `Packed: ${packed.length}`;
  scene.setShapeMode(state.shapeMode);
  scene.setContainer(derivedContainer);
  scene.renderObjects(packed);
  activeObjects = packed;

  physics = enablePhysics && packed.length > 0 ? new PhysicsEngine(packed, derivedContainer, state.spacing) : null;
}

scene.onFrame((delta) => {
  if (!physics) {
    return;
  }
  activeObjects = physics.step(delta);
  scene.updateInstances(activeObjects);
});

function handleExport(): void {
  if (physics) {
    for (let i = 0; i < 30; i++) {
      activeObjects = physics.step(1 / 60);
    }
    scene.updateInstances(activeObjects);
  } else if (activeObjects.length === 0) {
    // try to pack once if nothing is present
    const packed = packObjects({ ...createDefaultParams(), container: currentContainer });
    activeObjects = packed;
    scene.renderObjects(packed);
  }

  scene.exportGLTF("stonepacking.glb");
}

import { UIState } from "./types";
export type { UIState };
import { clamp } from "./utils";

export function createUI(
  root: HTMLElement,
  initial: UIState,
  onGenerate: (params: UIState) => void,
  onExport: () => void
): void {
  const title = document.createElement("h1");
  title.textContent = "StonePacking 3JS";

  const form = document.createElement("form");
  form.className = "control-form";

  const presetSelect = buildPresetSelect();
  const countInput = buildNumberInput("count", initial.count, 1, 1, 1000);
  const minScaleInput = buildNumberInput("minScale", initial.minScale, 0.05, 0.01);
  const maxScaleInput = buildNumberInput("maxScale", initial.maxScale, 0.1, 0.01);
  const spacingInput = buildNumberInput("spacing", initial.spacing, 0, 0.05);
  const targetFillInput = buildNumberInput("targetFill", initial.targetFill, 0.1, 0.05, 0.95);
  const widthInput = buildNumberInput("width", initial.container.width, 1);
  const heightInput = buildNumberInput("height", initial.container.height, 1);
  const depthInput = buildNumberInput("depth", initial.container.depth, 1);
  const attemptsInput = buildNumberInput("maxAttempts", initial.maxAttempts, 1, 1, 100);
  const passesInput = buildNumberInput("passes", initial.packingPasses ?? 1, 1, 1, 5);
  const physicsToggle = buildCheckbox("enablePhysics", initial.enablePhysics);
  const shapeSelect = buildShapeSelect(initial.shapeMode);
  const autoContainerToggle = buildCheckbox("autoContainer", initial.autoContainer);

  form.append(
    title,
    renderField("Count", countInput),
    renderField("Min scale", minScaleInput),
    renderField("Max scale", maxScaleInput),
    renderField("Spacing", spacingInput),
    renderField("Target fill (0-1)", targetFillInput),
    renderField("Container preset", presetSelect),
    renderField("Width", widthInput),
    renderField("Height", heightInput),
    renderField("Depth", depthInput),
    renderField("Max attempts", attemptsInput),
    renderField("Packing passes", passesInput),
    renderField("Auto-size container", autoContainerToggle),
    renderField("Shape", shapeSelect),
    renderField("Enable physics", physicsToggle),
    buildButtonRow(onExport)
  );

  presetSelect.addEventListener("change", () => applyPreset(presetSelect.value, { widthInput, heightInput, depthInput }));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onGenerate(readState());
  });

  root.appendChild(form);

  function readState(): UIState {
    const minScale = readNumber(minScaleInput, initial.minScale);
    const maxScaleRaw = readNumber(maxScaleInput, initial.maxScale);
    const maxScale = Math.max(minScale, maxScaleRaw);

    const state: UIState = {
      count: Math.max(0, Math.floor(readNumber(countInput, initial.count))),
      minScale,
      maxScale,
      container: {
        width: readNumber(widthInput, initial.container.width),
        height: readNumber(heightInput, initial.container.height),
        depth: readNumber(depthInput, initial.container.depth)
      },
      targetFill: Math.min(0.95, Math.max(0.1, readNumber(targetFillInput, initial.targetFill))),
      autoContainer: autoContainerToggle.checked,
      spacing: Math.max(0, readNumber(spacingInput, initial.spacing)),
      maxAttempts: Math.max(1, Math.floor(readNumber(attemptsInput, initial.maxAttempts))),
      packingPasses: Math.max(1, Math.floor(readNumber(passesInput, initial.packingPasses ?? 1))),
      enablePhysics: physicsToggle.checked,
      shapeMode: (shapeSelect.value as UIState["shapeMode"]) || initial.shapeMode
    };

    minScaleInput.value = minScale.toFixed(2);
    maxScaleInput.value = maxScale.toFixed(2);

    return state;
  }
}

function renderField(labelText: string, input: HTMLElement): HTMLLabelElement {
  const label = document.createElement("label");
  label.textContent = labelText;
  label.appendChild(input);
  return label;
}

function buildNumberInput(name: string, value: number, min: number, step = 0.1, max?: number): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.name = name;
  input.value = value.toString();
  input.min = min.toString();
  input.step = step.toString();
  if (typeof max === "number") {
    input.max = max.toString();
  }
  return input;
}

function buildCheckbox(name: string, checked: boolean): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = name;
  input.checked = checked;
  return input;
}

function buildPresetSelect(): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = "preset";

  [
    { label: "Custom", value: "custom" },
    { label: "Small (12)", value: "12" },
    { label: "Medium (20)", value: "20" },
    { label: "Large (28)", value: "28" }
  ].forEach((optionDef) => {
    const option = document.createElement("option");
    option.value = optionDef.value;
    option.textContent = optionDef.label;
    select.appendChild(option);
  });

  return select;
}

function buildShapeSelect(current: UIState["shapeMode"]): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = "shape";
  [
    { value: "dodeca", label: "Dodecahedron" },
    { value: "brick", label: "I-brick" }
  ].forEach((optionDef) => {
    const option = document.createElement("option");
    option.value = optionDef.value;
    option.textContent = optionDef.label;
    if (optionDef.value === current) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  return select;
}

function buildButtonRow(onExport: () => void): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "8px";

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Generate";

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = "Export GLTF";
  exportButton.addEventListener("click", () => onExport());

  wrapper.appendChild(button);
  wrapper.appendChild(exportButton);
  return wrapper;
}

function applyPreset(preset: string, inputs: { widthInput: HTMLInputElement; heightInput: HTMLInputElement; depthInput: HTMLInputElement }): void {
  if (preset === "custom") {
    return;
  }

  const size = clamp(parseFloat(preset), 1, 200);
  const value = size.toString();
  inputs.widthInput.value = value;
  inputs.heightInput.value = value;
  inputs.depthInput.value = value;
}

function readNumber(input: HTMLInputElement, fallback: number): number {
  const value = Number.parseFloat(input.value);
  if (Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

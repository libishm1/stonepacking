# stonepacking

Browser-based stone packing tool that ports the StonePacking logic into a Three.js + TypeScript app. It packs convex shapes (dodecahedrons or brick blocks) into an axis-aligned container with grid-accelerated collision checks, masonry-style layering, multi-pass packing, and a physics settle phase for denser fills.
try here https://libishm1.github.io/stonepacking/

## Features
- Three.js instanced rendering with shape toggle (dodecahedron or brick) and wireframe container.
- Grid-accelerated packing with course snapping, tight spacing defaults, and optional multi-pass fills to boost density.
- Physics settle after packing and before GLB export to capture the settled state.
- UI controls for count, scale range, spacing, passes, container size/auto-sizing, shape mode, physics toggle, and GLTF export.
- Packing stats display (objects packed) and console fill ratio logging.

## Getting Started
```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173
# then open http://localhost:4173
```
Build for production:
```bash
npm run build
```

## Controls
- **Count / Min-Max Scale / Spacing**: set population and size range (spacing default 0.05).
- **Packing passes**: run multiple passes; physics settles between passes when enabled.
- **Container**: set dimensions; optional auto-size toggle.
- **Shape**: switch between dodecahedrons and bricks.
- **Enable physics**: run lightweight settle; export waits for a short settle step.
- **Export GLTF**: downloads current scene (after settle if physics is on).

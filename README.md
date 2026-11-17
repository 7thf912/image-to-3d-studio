# Image to 3D Studio

A professional web application that converts a single image into a textured 3D model using AI, with in-browser editing and multi-quality, multi-format export.

## Features

- **Image → 3D** via Meshy AI (primary) or Tripo AI, plus a key-free Demo mode (Damaged Helmet sample).
- **Multi-quality export**: Low / Medium / High / Ultra, with client-side mesh decimation for the lower tiers.
- **Multi-format export**: GLB, glTF, OBJ, STL, USDZ (+ provider originals: FBX, USDZ, …).
- **In-browser editor**: transform (position/rotation/scale), material override (color, metalness, roughness, wireframe, flat shading), lighting, background, grid/axes.
- **Job history** persisted locally.
- **Settings** for API keys and defaults (stored in your browser only).

## Getting started

```bash
cd image-to-3d-studio
npm install
npm run dev
```

Open http://localhost:3000

## Using a real provider

1. Open **Settings** (⚙) and paste your API key.
   - Meshy: https://www.meshy.ai/settings/api
   - Tripo: https://platform.tripo3d.ai/
2. Upload an image, pick the provider and quality, click **Convert to 3D**.
3. Wait for completion (Meshy usually 1–3 min). The model appears in the viewer.
4. Edit, then export in the quality/format you want.

Demo mode works without any key.

## Build for production

```bash
npm run build
npm start
```

## Notes

- API keys are kept in your browser (localStorage) and sent to the local Next.js server only to proxy provider requests. They are never stored on the server.
- Meshy free plan cannot create tasks; a paid plan is required for real generation.
- Client-side decimation uses meshoptimizer (MeshoptSimplifier) and requires the model to be loaded in the viewer first for edited exports; otherwise the export fetches the model fresh.

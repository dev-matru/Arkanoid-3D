# Arkanoid 3D

> A cyberpunk 3D Arkanoid/Breakout game written in **vanilla JavaScript and WebGL 2.0**.

<p align="center">
  <img src="assets/images/logo.png" width="400" alt="Arkanoid 3D Logo">
</p>

Built as a static browser game, Arkanoid 3D combines neon WebGL rendering, responsive starfield visuals, tuned difficulty presets, persistent settings, audio controls, and cinematic camera modes.

[Try me here](https://dev-matru.github.io/Arkanoid-3D/)

---

## Features

- **Cyberpunk 3D presentation** — WebGL 2.0 rendering, Phong lighting, bloom, FXAA, neon materials, and a responsive animated starfield.
- **Physics-based gameplay** — Fixed timestep physics, sub-stepped collision detection, paddle hit-position angle control, paddle velocity transfer, and progressive ball acceleration.
- **Seven tuned difficulty presets** — Rookie, Runner, Hacker, Glitch, Overdrive, Blackout, and Singularity.
- **Custom advanced settings** — Override ball speed, block rows, block columns, block group height, and paddle width.
- **Audio controls** — Toggle music and sound effects independently, with separate percentage volume sliders.
- **In-game settings menu** — Open settings during a run, pause the game, and confirm restart only when modified settings are applied.
- **Cinematic camera** — 5 preset views with smooth transitions, screen shake effects, dynamic ball tracking, and mouse-wheel zoom.
- **Persistent settings** — Difficulty, custom gameplay parameters, audio preferences, and camera zoom are saved to localStorage.
- **Static deployment** — No package manager or build step required; serve the directory with any HTTP server.
- **Docker ready** — Deploy as a static Apache httpd container.

---

## Controls

| Input | Action |
|---|---|
| 🖱️ **Mouse move** | Move paddle |
| 🖱️ **Left click** | Launch ball / Restart on game over |
| 🔄 **Scroll wheel** | Zoom in / out (Field of View) |
| **1 – 5** | Switch camera preset view |
| **Top-left settings button** | Open in-game settings and pause |
| **Top-right fullscreen button** | Toggle fullscreen |

### Camera Presets

| Key | View | Description |
|---|---|---|
| `1` | **Default** | Classic top-down 45° view (original camera) |
| `2` | **Top-Down** | Almost overhead, full arena overview |
| `3` | **Side View** | Cinematic side angle |
| `4` | **POV Paddle** | Close-up behind the paddle |
| `5` | **Ball POV** | Camera follows the ball with trajectory anticipation |

---

## Quick Start

### Play Online

Open the permanent GitHub Pages deployment:

<https://dev-matru.github.io/Arkanoid-3D/>

### Option A: Python HTTP Server

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

### Option B: Docker

```bash
docker build -t arkanoid-3d .
docker run -p 8080:80 arkanoid-3d
```

### Option C: Any Static Server

Simply serve the project directory with any HTTP server (Apache, Nginx, XAMPP, etc.).

> ⚠️ **Note:** Opening `index.html` directly via `file://` protocol will not work — WebGL shader loading requires an HTTP server.

---

## Project Structure

```
Arkanoid-3D/
├── index.html              # Entry point
├── Dockerfile              # Apache httpd container
├── assets/
│   ├── audio/              # Music and sound effects
│   ├── icons/              # SVG icons and favicon
│   ├── images/             # UI images
│   └── textures/           # WebGL textures
├── css/
│   ├── style.css           # Main stylesheet
│   ├── space.css           # Starfield CSS variables and animation layers
│   └── font.css            # Roboto Mono font
├── shaders/
│   ├── vs.glsl             # Vertex shader (GLSL 300 es)
│   └── fs.glsl             # Fragment shader (Phong + vaporwave)
├── js/
│   ├── app.js              # Root namespace (APP)
│   ├── config.js           # Centralized game configuration
│   ├── twgl.js             # TWGL — Tiny WebGL helper library
│   ├── core/
│   │   ├── math.js         # 3D linear algebra
│   │   ├── shaders.js      # Shader compilation & linking
│   │   ├── texture.js      # Texture utilities
│   │   ├── geometry.js     # Sphere & cube mesh generators
│   │   ├── coordinates.js  # 2D game → 3D world mapping
│   │   └── storage.js      # localStorage persistence
│   ├── game/
│   │   ├── colors.js       # Randomized vaporwave palette
│   │   ├── arena.js        # Arena builder (ball, paddle, walls, blocks)
│   │   ├── state.js        # Game state machine
│   │   ├── physics.js      # Physics engine (collisions, bounce, sub-stepping)
│   │   └── input.js        # Mouse & keyboard input handling
│   ├── render/
│   │   ├── camera.js       # Cinematic camera (orbit, presets, shake)
│   │   └── renderer.js     # WebGL renderer (init, scene, draw loop)
│   └── ui/
│       ├── menu.js         # Main menu, settings, pause/restart modal
│       └── stars.js        # Responsive starfield generator
```

---

## Architecture Overview

The application follows a **namespaced modular pattern** — all modules live under the single global `APP` object.

```
APP
├── .config          ← Centralized constants & settings
├── .math            ← 3D matrix/vector math
├── .shaders         ← WebGL shader utilities
├── .texture         ← Texture loading
├── .geometry        ← Procedural mesh generation
├── .coordinates     ← Coordinate system mapping
├── .storage         ← localStorage persistence
├── .colors          ← Palette management
├── .arena           ← Game object factory
├── .game            ← State machine (start / play / pause / end)
├── .physics         ← Physics engine
├── .input           ← Mouse & keyboard handling
├── .camera          ← Cinematic camera system
├── .renderer        ← WebGL rendering pipeline
└── .ui              ← DOM-based menu, settings, modal, and starfield UI
```

---

## Development

### Requirements

- A modern browser with **WebGL 2.0** support
- An HTTP server (Python, Docker, Apache, etc.)
- No npm and no build step

### Scripts

JavaScript modules are loaded via `<script>` tags in `index.html`. Load order respects the `APP` namespace dependencies.

### Difficulty And Settings

Difficulty presets are defined in `js/config.js` under `APP.config.difficulty.levels`.

| Level | Ball speed | Rows | Columns | Block height | Paddle width |
|---|---:|---:|---:|---:|---:|
| Rookie | 0.10 | 4 | 7 | 34% | 3.00 |
| Runner | 0.13 | 5 | 8 | 40% | 2.45 |
| Hacker | 0.16 | 6 | 9 | 48% | 2.00 |
| Glitch | 0.20 | 7 | 10 | 53% | 1.75 |
| Overdrive | 0.23 | 8 | 11 | 58% | 1.50 |
| Blackout | 0.28 | 10 | 13 | 66% | 1.20 |
| Singularity | 0.34 | 12 | 14 | 72% | 1.00 |

The Advanced panel can override the active preset. When values no longer match a preset, the settings label changes to `Custom`.

### Audio Assets

The background music path is `assets/audio/song.mp3`; sound effects live in the same folder. Keep audio assets properly licensed for distribution before publishing the repository.

### Physics Engine

The ball uses **circle vs AABB** collision detection with **sub-stepping** (max 0.05 units per step) to prevent tunneling. The paddle bounce angle is dynamically calculated based on where the ball hits:

| Hit position | Bounce angle |
|---|---|
| Left edge (−1) | ~155° (up-left) |
| Center (0) | 90° (straight up) |
| Right edge (+1) | ~25° (up-right) |

Paddle velocity is partially transferred to the ball, giving the player directional control.

---

## License

MIT — feel free to use, modify, and share.

---

<p align="center">
  <sub>💛 Made by Matru with Digital Love 💛</sub>
</p>

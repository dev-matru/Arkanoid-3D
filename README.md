# Arkanoid 3D — Refactored Edition

> Un gioco Arkanoid 3D scritto interamente in vanilla WebGL 2.0, con zero build system.

![screenshot](https://user-images.githubusercontent.com/9197899/202512985-388f3bd0-6d26-41da-a029-2f285bf26638.png)

## Filosofia

- **Zero build system** — Nessun webpack, rollup, babel, npm. File statici servibili da qualsiasi HTTP server.
- **Vanilla JavaScript** — Nessun framework UI (React, Vue, etc.). Solo DOM API native.
- **WebGL diretto** — TWGL è l'unica libreria, usata solo per buffer/VAO management.
- **ES5 compatibile** — Funziona su tutti i browser con WebGL 2.0.
- **Self-contained** — Tutte le risorse sono locali (eccetto Google Fonts).
- **Estetica vaporwave/retro —** Palette di colori saturi, effetto starfield, font monospace.

## Architettura

```
Arkanoid-3D/
├── index.html           # Entry point (modulare, nessun inline handler)
├── Dockerfile           # Container Apache httpd:2.4
├── README.md
├── assets/              # Risorse statiche (audio, immagini, SVG)
├── css/                 # Fogli di stile
│   ├── font.css         # Roboto Mono (Google Fonts)
│   ├── space.css        # Starfield CSS animato
│   └── style.css        # UI principale
├── shaders/             # Shader GLSL 300 es
│   ├── vs.glsl          # Vertex shader
│   └── fs.glsl          # Fragment shader (Phong + vaporwave)
└── js/                  # 15 moduli organizzati gerarchicamente
    ├── app.js           # Namespace radice APP
    ├── config.js        # Costanti centralizzate
    ├── vendor/
    │   └── twgl.js      # TWGL (Gregg Tavares)
    ├── core/
    │   ├── math.js      # Algebra lineare 3D
    │   ├── shaders.js   # Compilazione/linking shader
    │   ├── texture.js   # Utility texture
    │   ├── geometry.js  # Geometrie (sfera, cubo)
    │   └── coordinates.js # Mapping 2D gioco → 3D mondo
    ├── game/
    │   ├── colors.js    # Palette colori randomizzata
    │   ├── arena.js     # Costruzione arena
    │   ├── state.js     # Game state machine, fisica, collisioni
    │   └── input.js     # Input mouse/tastiera/wheel
    ├── render/
    │   ├── camera.js    # Camera orbitale
    │   └── renderer.js  # WebGL init, scene, draw loop
    └── ui/
        └── menu.js      # Menu e settings panel
```

## Come eseguire

Servire la directory tramite qualsiasi HTTP server:

```bash
# Python 3
python3 -m http.server 8080
```

```bash
# Docker (produzione)
docker build -t arkanoid-3d .
docker run -p 8080:80 arkanoid-3d
```

## Comandi

| Input | Azione |
|---|---|
| Mouse move | Muovi paddle |
| Click sinistro | Lancia palla / Riavvia partita |
| Scroll | Zoom (FOV) |
| ↑ ↓ | Rotazione camera verticale |
| ← → | Rotazione camera orizzontale |
| W A S D | Sposta camera (avanti/sinistra/indietro/destra) |
| Q E | Sposta camera (giù/su) |

## Grafo dipendenze moduli

```
app.js ← (nessuna)
config.js ← app.js
core/* ← config.js
game/colors.js ← config.js
game/arena.js ← config.js, core/math.js, game/colors.js
game/state.js ← config.js, core/math.js, game/arena.js
game/input.js ← config.js, game/arena.js, game/state.js
render/camera.js ← config.js, core/math.js
render/renderer.js ← config.js, core/math.js, core/geometry.js,
                     core/shaders.js, game/arena.js, game/state.js,
                     game/input.js, render/camera.js
ui/menu.js ← config.js, game/arena.js, render/renderer.js
```

## Bug Fix Applicati (refactor v2.0)

| ID | Bug | Fix |
|---|---|---|
| B1 | HTML id duplicati (`id="blocks"` ×2) | ID univoci: `rowsSelect`, `columnsSelect` |
| B2 | Offset X palla non allineato al paddle | Allineamento coordinate game→world |
| B3 | `eyePosition` raw non trasformato | `[0,0,0]` (eye in camera space) |
| B4 | `window.location.reload()` per restart | `restartGame()` pulito |
| B5 | Chiamate multiple buildArena/main | Flag `initialized` + `cancelAnimationFrame` |
| B6 | Attributo UV mancante nella sfera | UV dummy array per sphere VAO |
| B7 | Parametri rx/ry invertiti in MakeWorld | Ordine corretto (rx→X, ry→Y) |
| B8 | Collision epsilon fisso | Epsilon scalabile dal config |
| B9 | Audio memory leak | Audio pool con cloneNode() |
| B10 | Evento `mousewheel` deprecato | `wheel` + `preventDefault()` |
| B17 | Blocchi distrutti renderizzati | Flag `visible` → skip draw call |

## Licenza

MIT

# Arkanoid 3D — Piano di Refactor Completo

> **Autore:** Analisi automatica codebase
> **Data:** 2026-06-27
> **Versione:** 2.0.0
> **Obiettivo:** Correzione bug, clean code, preservazione filosofia originale (vanilla JS + WebGL puro)

---

## 1. Panoramica della Codebase

### Struttura attuale
```
Arkanoid-3D/
├── index.html
├── Dockerfile
├── README.md
├── assets/            (12 file: audio, immagini, SVG)
├── css/
│   ├── font.css       # Roboto Mono Google Fonts
│   ├── space.css      # Starfield animato CSS (~900 righe)
│   └── style.css      # Stili UI (~170 righe)
├── shaders/
│   ├── vs.glsl        # Vertex shader GLSL 300 es
│   └── fs.glsl        # Fragment shader Phong + vaporwave
└── js/
    ├── twgl.js        # TWGL 4.17.0
    ├── utils.js       # "God object": shader, math 3D, texture, input (~420 righe)
    ├── settings.js    # Config globale (~47 righe)
    ├── colors.js      # Palette colori (~19 righe)
    ├── model.js       # Costruzione arena (~95 righe)
    ├── control.js     # Game loop, input, collisioni, audio (~150 righe)
    ├── sphere.js      # Geometria sfera (~40 righe)
    ├── cube.js        # Geometria cubo (~80 righe)
    └── view.js        # WebGL init, rendering, scene setup (~200 righe)
```

### Metriche
| Metrica | Valore |
|---|---|
| File JS totali | 9 (escluso twgl.js) |
| Righe totali JS | ~1150 |
| Variabili globali | 35+ |
| Funzioni globali | 25+ |
| File senza `'use strict'` | 9/9 |
| Dipendenze esterne | 1 (twgl.js) |
| Build system | Nessuno |

## 2. Filosofia Originale da Preservare

1. **Zero build system** — Nessun webpack, rollup, babel, npm
2. **Vanilla JavaScript** — Nessun framework UI
3. **WebGL diretto** — TWGL solo per buffer/VAO management
4. **ES5 compatibilità**
5. **Self-contained** — Risorse locali
6. **Estetica vaporwave/retro**

### Cosa CAMBIA nella filosofia
- Da variabili globali a **namespace pattern** (singolo oggetto globale `APP`)
- Da funzioni sparse a **moduli con responsabilità chiara** (IIFE/Revealing Module)
- Da configurazione hardcoded a **costanti centralizzate**
- Da HTML inline handlers a **event listener in JS**
- **Nessuna nuova dipendenza esterna**, nessun build step

## 3. Bug Identificati

### 3.1 Bug Critici (P0)

| ID | Bug | File | Impatto | Fix |
|----|-----|------|---------|-----|
| B1 | Due elementi `<select>` con `id="blocks"` duplicato | index.html:29,38 | HTML invalido, getElementById fallisce | ID univoci: rowsSelect, columnsSelect |
| B2 | Offset X palla `+arena.wallSize` non presente nel paddle | view.js | Disallineamento visivo palla/paddle | Rimuovere offset o allineare |
| B3 | `eyePosition` = raw camera, non trasformato | view.js:~165 | Illuminazione speculare errata | Inviare `[0,0,0]` (eye nello spazio camera) |
| B4 | `window.location.reload()` per restart | control.js:~70 | UX pessima, nessun reset pulito | Implementare `restartGame()` |
| B5 | `buildArena()` e `main()` non protette da chiamate multiple | model.js, view.js | Loop concorrenti, memory leak | Flag initialized + cancelAnimationFrame |

### 3.2 Bug Medi (P1)

| ID | Bug | File | Impatto | Fix |
|----|-----|------|---------|-----|
| B6 | Attributo `inUV` non presente nel VAO della sfera | vs.glsl, sphere.js | UV garbage nel FS (funziona solo perché textureWeight=0) | UV dummy o branching nel shader |
| B7 | `MakeWorld`: parametri rx/ry semanticamente invertiti | utils.js:~315 | Confusione, potenziali bug futuri | Scambiare assegnazioni |
| B8 | Collision epsilon fisso = 0.1 | control.js:~120 | Tunneling a velocità hard (0.2) | Epsilon proporzionale a speed |
| B9 | `playSound()` crea nuovi Audio ogni volta | control.js:~90 | Memory leak | Audio pool |
| B10 | Evento `mousewheel` deprecato | view.js:~190 | Non funziona su Firefox/Chrome futuri | Sostituire con `wheel` |

### 3.3 Bug Minori (P2)

| ID | Bug | File | Fix |
|----|-----|------|-----|
| B11 | `initInteraction()` in utils.js è dead code | utils.js:~100 | Rimuovere funzione |
| B12 | `radius` definito in sphere.js ma usato in model.js e view.js | sphere.js, model.js, view.js | Centralizzare in config |
| B13 | `shuffle()` muta l'array colors in-place | colors.js | Copia array prima di mutare |
| B14 | `ambientLightColor` e `vaporwaveColor` hardcoded nello shader | fs.glsl | Rendere uniform |
| B15 | Animation loop non si ferma a gioco finito | view.js | Fermare loop quando status='end' |
| B16 | Nessun `'use strict'` | Tutti i .js | Aggiungere dappertutto |
| B17 | Blocchi distrutti renderizzati (scalati a 0) | view.js:~138 | Skippare con flag visible |

## 4. Problemi Architetturali

1. **Inquinamento Globale Totale**: 35+ variabili globali, rischio collisioni
2. **Violazione SRP**: utils.js (420 righe, 5 responsabilità), view.js (update+render+mix), control.js (4 domain logic mix)
3. **Coordinate Ibride 2D/3D**: Game 2D (x,y) → 3D (x, 0, -z) non centralizzato
4. **No Game Loop strutturato**: update e render nello stesso frame
5. **Configurazione sparsa**: costanti magiche in 5 file diversi

## 5. Nuova Architettura

```
js/
├── vendor/
│   └── twgl.js
├── app.js              # Namespace root APP
├── config.js           # Tutte le costanti centralizzate
├── core/
│   ├── math.js         # Algebra lineare 3D
│   ├── shaders.js      # Compilazione/linking shader
│   ├── texture.js      # Utility texture
│   ├── geometry.js     # Generazione geometrie
│   └── coordinates.js  # Mapping 2D gioco → 3D mondo
├── game/
│   ├── colors.js       # Palette colori
│   ├── arena.js        # Costruzione arena
│   ├── state.js        # Game state machine, fisica, collisioni
│   └── input.js        # Gestione input
├── render/
│   ├── camera.js       # Camera orbitale
│   └── renderer.js     # WebGL init, scene setup, draw loop
└── ui/
    └── menu.js         # Menu, settings panel
```

### Grafo Dipendenze
```
config.js ← (nessuna)
core/math.js ← config.js
core/coordinates.js ← config.js
game/colors.js ← config.js
game/arena.js ← config.js, core/math.js, game/colors.js
game/state.js ← config.js, core/math.js, game/arena.js
game/input.js ← config.js, game/arena.js, game/state.js
render/camera.js ← config.js, core/math.js
render/renderer.js ← config.js, core/math.js, core/coordinates.js, core/geometry.js,
                     core/shaders.js, game/arena.js, game/state.js, game/input.js,
                     render/camera.js
ui/menu.js ← config.js, game/arena.js, render/renderer.js
```

## 6. Piano di Implementazione

### FASE 1: Hotfix Bug Critici (7 commit)

| # | Commit | Descrizione |
|---|--------|-------------|
| 1.1 | fix: HTML id duplicati in selects (B1) | rowsSelect, columnsSelect |
| 1.2 | fix: eyePosition errato nello shader (B3) | [0,0,0] |
| 1.3 | fix: offset X palla non allineato al paddle (B2) | Rimuovo +arena.wallSize |
| 1.4 | feat: implementa restartGame() senza reload (B4) | reset pulito |
| 1.5 | fix: proteggi buildArena/main da chiamate multiple (B5) | flag initialized |
| 1.6 | fix: audio memory leak con pool (B9) | audioPool caching |
| 1.7 | fix: evento mousewheel deprecato → wheel (B10) | wheel + preventDefault |

### FASE 2: Riorganizzazione Moduli (8 commit)

| # | Commit | Descrizione |
|---|--------|-------------|
| 2.1 | refactor: aggiungi 'use strict' e namespace APP | strict mode + app.js |
| 2.2 | refactor: crea config.js centralizzata | unisce settings.js + constants |
| 2.3 | refactor: crea core/math.js da utils.js | estrae algebra lineare |
| 2.4 | refactor: crea core/shaders.js e core/texture.js | estrae da utils.js |
| 2.5 | refactor: crea core/geometry.js e core/coordinates.js | unisce sphere.js+cube.js |
| 2.6 | refactor: crea game/arena.js e game/colors.js | da model.js + colors.js |
| 2.7 | refactor: crea game/state.js e game/input.js | da control.js |
| 2.8 | refactor: crea render/ + ui/ | da view.js |

### FASE 3: Refactor Architetturale (5 commit)

| # | Commit | Descrizione |
|---|--------|-------------|
| 3.1 | refactor: camera orbitale con vincoli e fix (B3, B7) | camera.js |
| 3.2 | refactor: sistema coordinate centralizzato | coordinates.js |
| 3.3 | feat: skippa rendering blocchi distrutti (B17) | flag visible |
| 3.4 | feat: collision epsilon dinamico (B8) | proporzionale a speed |
| 3.5 | perf: stop animation loop a gioco finito (B15) | |

### FASE 4: Pulizia Finale (3 commit)

| # | Commit | Descrizione |
|---|--------|-------------|
| 4.1 | chore: rimuovi file js obsoleti | utils, settings, model, control, sphere, cube, view, colors |
| 4.2 | feat: aggiorna index.html con nuova struttura | script tag ordinati |
| 4.3 | docs: aggiorna README.md | architettura nuova |

## 7. Test Checklist

### Funzionali
- [ ] La pagina si carica senza errori in console
- [ ] Menu principale con logo e pulsanti
- [ ] PLAY GAME → canvas WebGL visibile
- [ ] SETTINGS → pannello laterale apre/chiude
- [ ] Difficulty Easy/Medium/Hard funziona
- [ ] Righe/colonne cambiabili
- [ ] Palla segue paddle prima del lancio
- [ ] Click lancia palla
- [ ] Mouse controlla paddle
- [ ] Rimbalzi su pareti (sx, dx, top)
- [ ] Rimbalzo sul paddle
- [ ] Blocchi si rompono
- [ ] Punteggio si aggiorna
- [ ] Game Over quando palla cade
- [ ] Vittoria quando tutti i blocchi distrutti
- [ ] Click dopo fine → restart senza reload
- [ ] Scroll wheel → zoom FOV
- [ ] WASD/QE → camera move
- [ ] Frecce → camera rotate
- [ ] Suoni funzionano

### Regressione
- [ ] Stesse impostazioni → stesso layout arena
- [ ] Colori randomizzati ma consistenti
- [ ] Difficoltà influenza velocità
- [ ] Dimensioni arena scalano con righe/colonne

### Performance
- [ ] 60 FPS stabili
- [ ] Nessun memory leak dopo 5 minuti
- [ ] Draw call solo per oggetti visibili
- [ ] Loop fermo a game over

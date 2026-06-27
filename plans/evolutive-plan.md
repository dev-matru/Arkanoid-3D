# Piano Evolutivo — Arkanoid 3D

> **Data:** 2026-06-28
> **Versione:** 3.0.0 — ✅ COMPLETATO
> **Obiettivo:** Settings persistenti, fisica realistica, camera cinematica

---

## Riepilogo Implementazione

| # | Descrizione | Stato | Commit | Moduli |
|---|-------------|-------|--------|--------|
| 1 | localStorage persistence | ✅ | `615bd7b` | `core/storage.js`, `menu.js`, `input.js` |
| 2 | Fixed timestep + deltaTime | ✅ | `3372d7d` | `game/physics.js`, `state.js`, `renderer.js` |
| 3 | Paddle bounce realistico (hit position) | ✅ | `3372d7d` | `game/physics.js` |
| 4 | Sub-stepping anti-tunneling | ✅ | `3372d7d` | `game/physics.js` |
| 5 | Progressive speed + paddle velocity transfer | ✅ | `3372d7d` | `game/physics.js` |
| 6 | Camera orbitale automatica | ✅ | `a9b4f7a` | `render/camera.js` |
| 7 | Preset views 1-5 | ✅ | `a9b4f7a` | `render/camera.js`, `input.js` |
| 8 | Dynamic follow + screen shake | ✅ | `a9b4f7a` | `render/camera.js`, `physics.js` |

## Log Commit

```
a9b4f7a feat(3): camera cinematica con orbita automatica, preset, screen shake
3372d7d feat(2.1): fisica con fixed timestep, deltaTime, sub-stepping
615bd7b feat(1): settings persistenti via localStorage
```

## Dettaglio Implementazione

### 1. localStorage Persistence

- **Modulo:** `js/core/storage.js`
- **Chiavi persistite:** `gameMode`, `numOfRows`, `numOfColumns`, `fieldOfView`
- **Salvataggio:** chiamato da ogni setter in `menu.js` + zoom rotellina in `input.js`
- **Caricamento:** automatico all'inizializzazione (chiamata `load()` subito dopo la definizione del modulo)

### 2. Physics Overhaul

- **Modulo:** `js/game/physics.js`
- **Fixed timestep:** 1/120s con accumulator pattern nel `gameLoop` di `renderer.js`
- **DeltaTime normalizzato:** movimento palla moltiplicato per `dt * 60` (normalizzato a 60fps)
- **Hit position paddle:** da -1 (sinistra) a +1 (destra) → mappato ad angolo 205°-335°
- **Paddle velocity transfer:** 50% della velocità orizzontale del paddle trasferito alla palla
- **Sub-stepping:** movimento diviso in step di max 0.05 unità per anti-tunneling
- **Accelerazione progressiva:** +1% per rimbalzo, capped a `maxBallSpeed: 0.5`
- **Collisione:** AABB vs punto-centro con raggio, invece di 8 punti perimetrali

### 3. Camera Cinematica

- **Modulo:** `js/render/camera.js`
- **Orbita automatica:** rotazione Y a 0.15°/frame
- **5 preset camera (tasti 1-5):**
  - [1] Orbit — orbita automatica attorno al centro arena
  - [2] Top-Down — vista zenitale
  - [3] Side View — vista laterale fissa
  - [4] POV Paddle — segue il paddle da vicino
  - [5] Dynamic Follow — segue la palla con anticipazione traiettoria
- **Lerp smooth:** tutte le transizioni usano interpolazione lineare con fattore 0.03-0.06
- **Screen shake:** tremolio su blocchi rotti (0.08), game over (0.5), vittoria (0.3)
- **Controlli rimossi:** WASD/frecce sostituiti con tasti 1-5
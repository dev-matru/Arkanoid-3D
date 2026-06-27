# Piano Evolutivo — Arkanoid 3D

> **Data:** 2026-06-28
> **Versione:** 3.0.0
> **Obiettivo:** Settings persistenti, fisica realistica, camera cinematica

---

## 1. Settings Persistenti (localStorage)

**Stato attuale:** `APP.config` contiene tutti i settings ma non sono persistiti.
Ogni page reload azzera ai default di `config.js`.

**Implementazione:**
- Nuovo modulo `js/core/storage.js`: incapsula lettura/scrittura localStorage
- Chiavi da persistere: `gameMode`, `numOfRows`, `numOfColumns`, `fieldOfView`
- Hook in `menu.js`: ogni setter chiama `APP.storage.save()` dopo aver modificato il config
- Hook in `config.js`: dopo i default, chiama `APP.storage.load()` per sovrascrivere

## 2. Physics Overhaul

**Problemi attuali:**
- Movimento non framerate-independent (nessun deltaTime → scatti a fps variabili)
- Rimbalzo semplicistico (sempre stesso angolo)
- Nessuna influenza velocità paddle
- Collisione discreta (tunneling a velocità alta)
- Nessun sub-stepping

**Implementazione:**
1. Fixed timestep (1/120s) con accumulatore nel game loop
2. Delta-time normalization per movimento frame-rate indipendent
3. Hit-position sul paddle mappata ad angolo di uscita (-65° a +65°)
4. Paddle velocity trasferita alla palla
5. Sub-stepping per anti-tunneling
6. Accelerazione progressiva della palla

## 3. Camera Cinematica

**Implementazione:**
1. Rimozione controlli WASD/frecce
2. Orbita automatica intorno al campo
3. Preset camera 1-5 con transizioni smooth
4. Dynamic Follow: camera segue la palla
5. Screen shake su eventi

## Ordine Implementazione

| # | Descrizione | Moduli coinvolti |
|---|-------------|------------------|
| 1 | localStorage persistence | `js/core/storage.js` (nuovo), `js/config.js`, `js/ui/menu.js` |
| 2 | Fixed timestep + deltaTime | `js/game/physics.js` (nuovo), `js/game/state.js`, `js/render/renderer.js` |
| 3 | Paddle bounce realistico | `js/game/physics.js` |
| 4 | Continuous collision | `js/game/physics.js` |
| 5 | Progressive speed | `js/game/physics.js` |
| 6 | Camera orbitale automatica | `js/render/camera.js`, `js/game/input.js` |
| 7 | Preset views 1-5 | `js/render/camera.js`, `js/game/input.js` |
| 8 | Dynamic follow + effetti | `js/render/camera.js`, `js/game/state.js` |

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GRAVITY_PRESETS,
  GravityEngine,
  type CelestialKind,
} from './engines/GravityEngine';
import { BIO_PRESETS, BioGenesisEngine } from './engines/BioGenesisEngine';
import { CYMATICS_PRESETS, CymaticsEngine } from './engines/CymaticsEngine';
import { POLYRHYTHM_PRESETS, PolyrhythmEngine } from './engines/PolyrhythmEngine';
import { soundEngine } from './audio/SoundEngine';
import { TopBar } from './components/TopBar';
import { InspectorPanel } from './components/InspectorPanel';
import { ToolDock } from './components/ToolDock';
import { TelemetryHUD } from './components/TelemetryHUD';
import { ManifestoModal, WelcomeBanner } from './components/ManifestoModal';
import type {
  BioTool,
  CymaticsTool,
  GravityTool,
  MusicalScaleId,
  PolyrhythmTool,
  SavedUniverseRecord,
  SynthTimbreId,
  TelemetryData,
  UniverseMode,
} from './types/universe';

const DEFAULT_FALLBACK_UNIVERSES: SavedUniverseRecord[] = [
  {
    id: 'seed-kepler-symphony',
    name: 'Résonance d’Or de Kepler',
    mode: 'gravity',
    scale: 'lydian',
    createdAt: '2026-10-20T22:50:00.000Z',
    payload: { presetId: 'harmonic-solar' },
  },
  {
    id: 'seed-mitosis-garden',
    name: 'Jardin Cellulaire Mitotique',
    mode: 'biogenesis',
    scale: 'pentatonic',
    createdAt: '2026-10-20T22:51:00.000Z',
    payload: { presetId: 'mitotic-cells' },
  },
  {
    id: 'seed-young-quantum',
    name: 'Interférences Quantiques de Young',
    mode: 'cymatics',
    scale: 'hirajoshi',
    createdAt: '2026-10-20T22:52:00.000Z',
    payload: { presetId: 'double-slit' },
  },
];

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent engine instances
  const gravityRef = useRef<GravityEngine | null>(null);
  const bioRef = useRef<BioGenesisEngine | null>(null);
  const cymaticsRef = useRef<CymaticsEngine | null>(null);
  const polyRef = useRef<PolyrhythmEngine | null>(null);

  if (!gravityRef.current) gravityRef.current = new GravityEngine(1280, 800);
  if (!bioRef.current) bioRef.current = new BioGenesisEngine(1280, 800);
  if (!cymaticsRef.current) cymaticsRef.current = new CymaticsEngine();
  if (!polyRef.current) polyRef.current = new PolyrhythmEngine();

  // Primary UI state
  const [mode, setMode] = useState<UniverseMode>('gravity');
  const [activePresetId, setActivePresetId] = useState<string>('harmonic-solar');
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [manifestoOpen, setManifestoOpen] = useState<boolean>(false);
  const [welcomeVisible, setWelcomeVisible] = useState<boolean>(true);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Simulation time & audio state
  const [paused, setPaused] = useState<boolean>(false);
  const [timeScale, setTimeScale] = useState<number>(1);
  const [autoPilot, setAutoPilot] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [scale, setScale] = useState<MusicalScaleId>('lydian');
  const [timbre, setTimbre] = useState<SynthTimbreId>('celesta');
  const [volume, setVolume] = useState<number>(0.72);
  const [spectrum, setSpectrum] = useState<number[]>(() => new Array(10).fill(0.08));

  // Active tools per engine
  const [gravityTool, setGravityTool] = useState<GravityTool>('planet');
  const [bioTool, setBioTool] = useState<BioTool>('attract');
  const [cymaticsTool, setCymaticsTool] = useState<CymaticsTool>('ripple');
  const [polyTool, setPolyTool] = useState<PolyrhythmTool>('pluckRing');

  // Engine inspector mirror states
  const [gravityG, setGravityG] = useState<number>(1200);
  const [trailLength, setTrailLength] = useState<number>(85);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showHarp, setShowHarp] = useState<boolean>(true);

  const [dnaMatrix, setDnaMatrix] = useState<number[][]>(() =>
    bioRef.current!.matrix.map((r) => [...r])
  );
  const [bioRadius, setBioRadius] = useState<number>(88);
  const [bioForce, setBioForce] = useState<number>(0.72);
  const [showBonds, setShowBonds] = useState<boolean>(true);
  const [selectedSpecies, setSelectedSpecies] = useState<number>(0);

  const [emitterFreq, setEmitterFreq] = useState<number>(0.33);
  const [reflectiveCavity, setReflectiveCavity] = useState<boolean>(false);

  const [cyclePeriod, setCyclePeriod] = useState<number>(60);
  const [showChords, setShowChords] = useState<boolean>(true);

  const [savedUniverses, setSavedUniverses] =
    useState<SavedUniverseRecord[]>(DEFAULT_FALLBACK_UNIVERSES);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    fps: 60,
    entityCount: 8,
    secondaryCount: 220,
    energy: 0,
    resonanceEvents: 0,
    simTime: 0,
    zoom: 1,
  });

  // Mutable refs for 60fps loop access without restarting RAF
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const timeScaleRef = useRef(timeScale);
  timeScaleRef.current = timeScale;
  const autoPilotRef = useRef(autoPilot);
  autoPilotRef.current = autoPilot;

  const toolsRef = useRef({ gravityTool, bioTool, cymaticsTool, polyTool });
  toolsRef.current = { gravityTool, bioTool, cymaticsTool, polyTool };

  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const pointerRef = useRef<{
    down: boolean;
    button: number;
    screenX: number;
    screenY: number;
    lastScreenX: number;
    lastScreenY: number;
    startWorldX: number;
    startWorldY: number;
    currWorldX: number;
    currWorldY: number;
    slingshotActive: boolean;
  }>({
    down: false,
    button: 0,
    screenX: 0,
    screenY: 0,
    lastScreenX: 0,
    lastScreenY: 0,
    startWorldX: 0,
    startWorldY: 0,
    currWorldX: 0,
    currWorldY: 0,
    slingshotActive: false,
  });

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Collapse inspector automatically on narrow initial screens (< 900px) so canvas breathes
  useEffect(() => {
    if (window.innerWidth < 900) {
      setInspectorOpen(false);
    }
  }, []);

  // Load saved universes from backend API
  useEffect(() => {
    fetch('/api/universes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.universes) && data.universes.length > 0) {
          setSavedUniverses(data.universes);
        }
      })
      .catch(() => {
        // Fallback already seeded in state
      });
  }, []);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.clientWidth : window.innerWidth;
    const h = canvas ? canvas.clientHeight : window.innerHeight;
    const cam = cameraRef.current;
    return {
      wx: (sx - w * 0.5) / cam.zoom + cam.x,
      wy: (sy - h * 0.5) / cam.zoom + cam.y,
    };
  }, []);

  const handleToggleAudio = useCallback(async () => {
    const next = !soundEngine.isEnabled();
    const state = await soundEngine.setEnabled(next);
    setAudioEnabled(state);
    if (state) {
      showToast('Synthétiseur spatial activé');
    }
  }, [showToast]);

  const handleSelectMode = useCallback((nextMode: UniverseMode) => {
    setMode(nextMode);
    if (nextMode === 'gravity') setActivePresetId('harmonic-solar');
    else if (nextMode === 'biogenesis') {
      setActivePresetId('hunter-serpents');
      setDnaMatrix(bioRef.current!.matrix.map((r) => [...r]));
    } else if (nextMode === 'cymatics') {
      setActivePresetId('double-slit');
      setEmitterFreq(cymaticsRef.current!.emitterFreq);
      setReflectiveCavity(cymaticsRef.current!.reflectiveCavity);
    } else {
      setActivePresetId('pendulum-wave');
      setCyclePeriod(polyRef.current!.periodSeconds);
    }

    // Clear canvas cleanly when switching worlds
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#04060A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    soundEngine.triggerChordShimmer();
  }, []);

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      setActivePresetId(presetId);
      if (mode === 'gravity') {
        cameraRef.current = { x: 0, y: 0, zoom: 1 };
        gravityRef.current!.loadPreset(presetId);
      } else if (mode === 'biogenesis') {
        bioRef.current!.loadPreset(presetId);
        setDnaMatrix(bioRef.current!.matrix.map((r) => [...r]));
      } else if (mode === 'cymatics') {
        cymaticsRef.current!.loadPreset(presetId);
        setEmitterFreq(cymaticsRef.current!.emitterFreq);
        setReflectiveCavity(cymaticsRef.current!.reflectiveCavity);
      } else {
        polyRef.current!.loadPreset(presetId);
        setCyclePeriod(polyRef.current!.periodSeconds);
      }
      soundEngine.triggerChordShimmer();
    },
    [mode]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === '1') {
        handleSelectMode('gravity');
      } else if (e.key === '2') {
        handleSelectMode('biogenesis');
      } else if (e.key === '3') {
        handleSelectMode('cymatics');
      } else if (e.key === '4') {
        handleSelectMode('polyrhythm');
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleAudio();
      } else if (e.key.toLowerCase() === 'h') {
        setZenMode((z) => !z);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelectMode, handleToggleAudio]);

  // Master 60 FPS Simulation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      gravityRef.current!.resize(w, h);
      bioRef.current!.resize(w, h);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let rafId = 0;
    let lastTime = performance.now();
    let fpsFrames = 0;
    let fpsTimer = 0;
    let currentFps = 60;
    let uiSyncTimer = 0;
    let autoDirectorTimer = 0;
    let totalElapsed = 0;

    const audioCallbacks = {
      onMeridianCross: (deg: number, vel: number, pan: number) => {
        soundEngine.playDegree(deg, vel, pan, 1.1);
      },
      onCollision: (intensity: number, pan: number) => {
        soundEngine.playCollisionImpact(intensity, pan);
      },
    };

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const currentMode = modeRef.current;
      const isPaused = pausedRef.current;
      const speed = timeScaleRef.current;
      const ptr = pointerRef.current;

      fpsFrames++;
      fpsTimer += rawDt;
      if (fpsTimer >= 0.5) {
        currentFps = Math.round(fpsFrames / fpsTimer);
        fpsFrames = 0;
        fpsTimer = 0;
      }

      // Autonomous AI Démiurge Choreographer
      if (autoPilotRef.current && !isPaused) {
        autoDirectorTimer += rawDt;
        if (autoDirectorTimer >= 4.8) {
          autoDirectorTimer = 0;
          if (currentMode === 'gravity') {
            const ang = Math.random() * Math.PI * 2;
            const rad = 140 + Math.random() * 260;
            const px = Math.cos(ang) * rad;
            const py = Math.sin(ang) * rad;
            const orb = gravityRef.current!.computeAutoOrbitVelocity(px, py);
            gravityRef.current!.spawnBody('planet', px, py, orb.vx * 0.96, orb.vy * 0.96);
            soundEngine.playDegree(Math.floor(Math.random() * 10) + 4, 0.35, Math.cos(ang) * 0.6, 1.3);
          } else if (currentMode === 'biogenesis') {
            bioRef.current!.mutateMatrix(0.16);
            setDnaMatrix(bioRef.current!.matrix.map((r) => [...r]));
            soundEngine.triggerChordShimmer();
          } else if (currentMode === 'cymatics') {
            const gx = Math.floor(40 + Math.random() * (cymaticsRef.current!.cols - 80));
            const gy = Math.floor(30 + Math.random() * (cymaticsRef.current!.rows - 60));
            cymaticsRef.current!.pluckAtGrid(gx, gy, 3.0, 6);
            soundEngine.playDegree(Math.floor(Math.random() * 12) + 3, 0.36, (gx / cymaticsRef.current!.cols) * 2 - 1, 1.25);
          } else {
            soundEngine.triggerChordShimmer();
          }
        }
      }

      let currentEnergy = 0;

      if (currentMode === 'gravity') {
        const gEngine = gravityRef.current!;
        if (ptr.down && ptr.button === 0 && toolsRef.current.gravityTool === 'repulsor') {
          gEngine.applyRepulsorPulse(ptr.currWorldX, ptr.currWorldY, 1.4);
        }

        if (!isPaused) {
          const simDt = rawDt * 1.15 * speed;
          totalElapsed += simDt;
          gEngine.step(simDt, 3, audioCallbacks);
        }

        let slingshotPreview: {
          startX: number;
          startY: number;
          vx: number;
          vy: number;
          kind: CelestialKind;
        } | null = null;

        if (ptr.slingshotActive) {
          const dragDist = Math.hypot(
            ptr.currWorldX - ptr.startWorldX,
            ptr.currWorldY - ptr.startWorldY
          );
          const kind: CelestialKind =
            toolsRef.current.gravityTool === 'star'
              ? 'star'
              : toolsRef.current.gravityTool === 'blackhole'
                ? 'blackhole'
                : 'planet';
          const vel =
            dragDist < 8 / cameraRef.current.zoom
              ? gEngine.computeAutoOrbitVelocity(ptr.startWorldX, ptr.startWorldY)
              : {
                  vx: (ptr.currWorldX - ptr.startWorldX) * 1.15,
                  vy: (ptr.currWorldY - ptr.startWorldY) * 1.15,
                };
          slingshotPreview = {
            startX: ptr.startWorldX,
            startY: ptr.startWorldY,
            vx: vel.vx,
            vy: vel.vy,
            kind,
          };
        }

        gEngine.render(ctx, w, h, cameraRef.current, totalElapsed, slingshotPreview);
        currentEnergy = gEngine.computeKineticEnergy() * 0.001;
        soundEngine.modulateDrone(Math.min(1, currentEnergy / 180));
      } else if (currentMode === 'biogenesis') {
        const bEngine = bioRef.current!;
        if (ptr.down) {
          const activeBrush = ptr.button === 2 ? 'repel' : toolsRef.current.bioTool;
          bEngine.applyBrush(activeBrush, ptr.screenX, ptr.screenY);
        }

        if (!isPaused) {
          totalElapsed += rawDt * speed;
          currentEnergy = bEngine.step(speed, (deg, vel, pan) => {
            soundEngine.playDegree(deg + 5, vel, pan, 0.85);
          });
        }
        bEngine.render(ctx, w, h);
        soundEngine.modulateDrone(Math.min(1, currentEnergy / 950));
      } else if (currentMode === 'cymatics') {
        const cEngine = cymaticsRef.current!;
        if (!isPaused) {
          totalElapsed += rawDt * speed;
          const steps = speed > 1.6 ? 4 : speed < 0.6 ? 1 : 2;
          currentEnergy = cEngine.step(steps);
        }
        cEngine.render(ctx, w, h);
        soundEngine.modulateDrone(Math.min(1, currentEnergy / 140));
      } else {
        const pEngine = polyRef.current!;
        pEngine.hoveredRing = pEngine.hitTestRing(ptr.screenX, ptr.screenY, w, h);
        if (!isPaused) {
          totalElapsed += rawDt * speed;
          pEngine.step(rawDt * speed, (deg, vel, pan) => {
            soundEngine.playDegree(deg, vel, pan, 1.15);
          });
        }
        pEngine.render(ctx, w, h);
        currentEnergy = pEngine.rings.filter((r) => !r.muted).length * 4.2;
        soundEngine.modulateDrone(0.35);
      }

      // Sync lightweight UI telemetry & FFT bars at ~12 Hz to keep React ultra-light
      uiSyncTimer += rawDt;
      if (uiSyncTimer >= 0.085) {
        uiSyncTimer = 0;
        setSpectrum(soundEngine.getSpectrumLevels(10));

        if (currentMode === 'gravity') {
          setTelemetry({
            fps: currentFps,
            entityCount: gravityRef.current!.bodies.length,
            secondaryCount: gravityRef.current!.dust.length,
            energy: currentEnergy,
            resonanceEvents: gravityRef.current!.resonanceCount,
            simTime: totalElapsed,
            zoom: cameraRef.current.zoom,
          });
        } else if (currentMode === 'biogenesis') {
          setTelemetry({
            fps: currentFps,
            entityCount: bioRef.current!.count,
            secondaryCount: 6,
            energy: currentEnergy,
            resonanceEvents: gravityRef.current!.resonanceCount,
            simTime: totalElapsed,
            zoom: 1,
          });
        } else if (currentMode === 'cymatics') {
          setTelemetry({
            fps: currentFps,
            entityCount: cymaticsRef.current!.emitters.length,
            secondaryCount: 0,
            energy: currentEnergy,
            resonanceEvents: gravityRef.current!.resonanceCount,
            simTime: totalElapsed,
            zoom: 1,
          });
        } else {
          setTelemetry({
            fps: currentFps,
            entityCount: polyRef.current!.rings.length,
            secondaryCount: polyRef.current!.chords.length,
            energy: currentEnergy,
            resonanceEvents: polyRef.current!.triggerCount,
            simTime: totalElapsed,
            zoom: 1,
          });
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Interpolated stroke painting helper for watertight Cymatics walls/lenses
  const paintCymaticsStroke = useCallback(
    (x0: number, y0: number, x1: number, y1: number, tool: CymaticsTool) => {
      const cEngine = cymaticsRef.current!;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(dist / 4));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const ix = x0 + (x1 - x0) * t;
        const iy = y0 + (y1 - y0) * t;
        const { gx, gy } = cEngine.screenToGrid(ix, iy, w, h);
        if (tool === 'ripple') {
          cEngine.pluckAtGrid(gx, gy, 1.9, 4);
        } else if (tool === 'wall' || tool === 'lens' || tool === 'eraser') {
          cEngine.paintMaterial(gx, gy, tool, tool === 'lens' ? 6 : 2);
        }
      }
    },
    []
  );

  // Canvas Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    soundEngine.resumeIfUnlocked();
    e.currentTarget.setPointerCapture(e.pointerId);

    const sx = e.clientX;
    const sy = e.clientY;
    const { wx, wy } = screenToWorld(sx, sy);
    const ptr = pointerRef.current;

    ptr.down = true;
    ptr.button = e.button;
    ptr.screenX = sx;
    ptr.screenY = sy;
    ptr.lastScreenX = sx;
    ptr.lastScreenY = sy;
    ptr.startWorldX = wx;
    ptr.startWorldY = wy;
    ptr.currWorldX = wx;
    ptr.currWorldY = wy;

    if (mode === 'gravity' && e.button === 0) {
      if (gravityTool === 'nebula') {
        gravityRef.current!.spawnNebulaBurst(wx, wy);
        soundEngine.triggerChordShimmer();
      } else if (gravityTool === 'repulsor') {
        gravityRef.current!.applyRepulsorPulse(wx, wy, 2.0);
        soundEngine.playDegree(2, 0.35, (sx / window.innerWidth) * 2 - 1, 0.9);
      } else {
        ptr.slingshotActive = true;
      }
    } else if (mode === 'cymatics' && e.button === 0) {
      const cEngine = cymaticsRef.current!;
      const { gx, gy } = cEngine.screenToGrid(sx, sy, window.innerWidth, window.innerHeight);
      if (cymaticsTool === 'emitter') {
        cEngine.addEmitter(gx, gy);
        soundEngine.playDegree(7, 0.4, (sx / window.innerWidth) * 2 - 1, 1.2);
      } else {
        paintCymaticsStroke(sx, sy, sx, sy, cymaticsTool);
        if (cymaticsTool === 'ripple') {
          const deg = Math.round(((1 - sy / window.innerHeight) * 14));
          soundEngine.playDegree(deg, 0.38, (sx / window.innerWidth) * 2 - 1, 1.15);
        }
      }
    } else if (mode === 'polyrhythm' && e.button === 0) {
      const pEngine = polyRef.current!;
      const idx = pEngine.hitTestRing(sx, sy, window.innerWidth, window.innerHeight);
      if (idx >= 0) {
        const ring = pEngine.rings[idx];
        const pan = ((idx / Math.max(1, pEngine.rings.length - 1)) * 2 - 1) * 0.72;
        if (polyTool === 'toggleRing') {
          ring.muted = !ring.muted;
          if (!ring.muted) {
            ring.flash = 1.0;
            soundEngine.playDegree(idx, 0.42, pan, 1.1);
          }
        } else if (polyTool === 'phaseNudge') {
          ring.angle += Math.PI / 6;
          ring.flash = 1.0;
          soundEngine.playDegree(idx + 2, 0.4, pan, 1.0);
        } else {
          ring.flash = 1.0;
          soundEngine.playDegree(idx, 0.48, pan, 1.2);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sx = e.clientX;
    const sy = e.clientY;
    const ptr = pointerRef.current;

    // Camera pan via right-click or middle-click in Gravity mode
    if (ptr.down && (ptr.button === 2 || ptr.button === 1) && mode === 'gravity') {
      const dx = sx - ptr.lastScreenX;
      const dy = sy - ptr.lastScreenY;
      cameraRef.current.x -= dx / cameraRef.current.zoom;
      cameraRef.current.y -= dy / cameraRef.current.zoom;
    }

    if (ptr.down && ptr.button === 0 && mode === 'cymatics' && cymaticsTool !== 'emitter') {
      paintCymaticsStroke(ptr.lastScreenX, ptr.lastScreenY, sx, sy, cymaticsTool);
    }

    const { wx, wy } = screenToWorld(sx, sy);
    ptr.lastScreenX = sx;
    ptr.lastScreenY = sy;
    ptr.screenX = sx;
    ptr.screenY = sy;
    ptr.currWorldX = wx;
    ptr.currWorldY = wy;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ptr = pointerRef.current;
    if (ptr.slingshotActive && mode === 'gravity') {
      const gEngine = gravityRef.current!;
      const dragDist = Math.hypot(
        ptr.currWorldX - ptr.startWorldX,
        ptr.currWorldY - ptr.startWorldY
      );
      const kind: CelestialKind =
        gravityTool === 'star'
          ? 'star'
          : gravityTool === 'blackhole'
            ? 'blackhole'
            : 'planet';

      const vel =
        dragDist < 8 / cameraRef.current.zoom
          ? gEngine.computeAutoOrbitVelocity(ptr.startWorldX, ptr.startWorldY)
          : {
              vx: (ptr.currWorldX - ptr.startWorldX) * 1.15,
              vy: (ptr.currWorldY - ptr.startWorldY) * 1.15,
            };

      gEngine.spawnBody(kind, ptr.startWorldX, ptr.startWorldY, vel.vx, vel.vy);
      const pan = (e.clientX / window.innerWidth) * 2 - 1;
      soundEngine.playDegree(kind === 'planet' ? 8 : 1, 0.45, pan, 1.25);
    }

    ptr.down = false;
    ptr.slingshotActive = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (mode !== 'gravity') return;
    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    const prevZoom = cameraRef.current.zoom;
    const nextZoom = Math.max(0.28, Math.min(2.8, prevZoom * factor));

    const w = window.innerWidth;
    const h = window.innerHeight;
    const wxBefore = (e.clientX - w * 0.5) / prevZoom + cameraRef.current.x;
    const wyBefore = (e.clientY - h * 0.5) / prevZoom + cameraRef.current.y;

    cameraRef.current.zoom = nextZoom;
    cameraRef.current.x = wxBefore - (e.clientX - w * 0.5) / nextZoom;
    cameraRef.current.y = wyBefore - (e.clientY - h * 0.5) / nextZoom;
  };

  // Presets list for current engine
  const activePresets = useMemo(() => {
    if (mode === 'gravity') return GRAVITY_PRESETS;
    if (mode === 'biogenesis') return BIO_PRESETS;
    if (mode === 'cymatics') return CYMATICS_PRESETS;
    return POLYRHYTHM_PRESETS;
  }, [mode]);

  const activeHint = useMemo(() => {
    if (mode === 'gravity') {
      if (gravityTool === 'nebula') {
        return 'Cliquer pour générer un nuage orbital de poussières protoplanétaires · Molette pour zoomer';
      }
      if (gravityTool === 'repulsor') {
        return 'Maintenir le clic pour projeter une onde antigravitationnelle · Clic droit pour déplacer la vue';
      }
      return 'Cliquer pour mise en orbite automatique, ou glisser pour viser avec prédiction de trajectoire';
    }
    if (mode === 'biogenesis') {
      return 'Maintenir le clic pour sculpter le vivant · Modifiez la matrice ADN 6×6 à droite en direct';
    }
    if (mode === 'cymatics') {
      return 'Dessiner des parois, fentes de Young ou lentilles de verre (n = 1,70) directement sur l’eau';
    }
    return 'Survoler et cliquer sur les anneaux harmoniques pour les faire chanter ou les isoler';
  }, [mode, gravityTool]);

  // Save / Load / Delete Universe Handlers
  const handleSaveUniverse = async (name: string) => {
    const payload =
      mode === 'gravity'
        ? gravityRef.current!.serialize()
        : mode === 'biogenesis'
          ? bioRef.current!.serialize()
          : mode === 'cymatics'
            ? cymaticsRef.current!.serialize()
            : polyRef.current!.serialize();

    const fallbackEntry: SavedUniverseRecord = {
      id: `local-${Date.now().toString(36)}`,
      name,
      mode,
      scale,
      createdAt: new Date().toISOString(),
      payload,
    };

    try {
      const res = await fetch('/api/universes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mode, scale, payload }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.universes)) {
          setSavedUniverses(data.universes);
        }
        showToast(`« ${name} » archivé sur le serveur`);
        return;
      }
    } catch {
      // Fallback to in-memory state if offline
    }
    setSavedUniverses((prev) => [fallbackEntry, ...prev]);
    showToast(`« ${name} » sauvegardé`);
  };

  const handleLoadUniverse = (item: SavedUniverseRecord) => {
    setMode(item.mode);
    setScale(item.scale);
    soundEngine.setScale(item.scale);

    if (item.mode === 'gravity') {
      cameraRef.current = { x: 0, y: 0, zoom: 1 };
      gravityRef.current!.deserialize(item.payload);
      setGravityG(gravityRef.current!.G);
    } else if (item.mode === 'biogenesis') {
      bioRef.current!.deserialize(item.payload);
      setDnaMatrix(bioRef.current!.matrix.map((r) => [...r]));
    } else if (item.mode === 'cymatics') {
      cymaticsRef.current!.deserialize(item.payload);
      setReflectiveCavity(cymaticsRef.current!.reflectiveCavity);
      setEmitterFreq(cymaticsRef.current!.emitterFreq);
    } else {
      polyRef.current!.deserialize(item.payload);
      setCyclePeriod(polyRef.current!.periodSeconds);
    }

    soundEngine.triggerChordShimmer();
    showToast(`Univers « ${item.name} » restauré`);
  };

  const handleDeleteUniverse = async (id: string) => {
    setSavedUniverses((prev) => prev.filter((u) => u.id !== id));
    try {
      await fetch(`/api/universes/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Ignore network errors
    }
  };

  const handleCapturePng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `astralys-${mode}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Capture haute définition exportée');
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#04060A]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Full-Viewport Interactive Simulation Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="fixed inset-0 block cursor-crosshair touch-none"
      />

      {/* Top Instrument Navigation Header */}
      <TopBar
        mode={mode}
        onSelectMode={handleSelectMode}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        spectrum={spectrum}
        autoPilot={autoPilot}
        onToggleAutoPilot={() => {
          setAutoPilot((a) => {
            showToast(!a ? 'Mode Démiurge IA activé' : 'Mode Démiurge IA désactivé');
            return !a;
          });
        }}
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen((o) => !o)}
        onOpenManifesto={() => setManifestoOpen(true)}
        zenMode={zenMode}
        onToggleZen={() => setZenMode((z) => !z)}
      />

      {!zenMode && (
        <>
          {/* Live Scientific Telemetry */}
          <TelemetryHUD mode={mode} telemetry={telemetry} hint={activeHint} />

          {/* Floating Right Parameter & DNA Workshop */}
          {inspectorOpen && (
            <InspectorPanel
              mode={mode}
              presets={activePresets}
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
              gravityG={gravityG}
              onChangeGravityG={(val) => {
                setGravityG(val);
                gravityRef.current!.G = val;
              }}
              trailLength={trailLength}
              onChangeTrailLength={(val) => {
                setTrailLength(val);
                gravityRef.current!.trailLength = val;
              }}
              showGrid={showGrid}
              onToggleGrid={() => {
                const next = !showGrid;
                setShowGrid(next);
                gravityRef.current!.showSpacetimeGrid = next;
              }}
              showHarp={showHarp}
              onToggleHarp={() => {
                const next = !showHarp;
                setShowHarp(next);
                gravityRef.current!.showMeridianHarp = next;
              }}
              onResetCamera={() => {
                cameraRef.current = { x: 0, y: 0, zoom: 1 };
              }}
              dnaMatrix={dnaMatrix}
              onCycleDnaCell={(r, c) => {
                bioRef.current!.cycleMatrixCell(r, c);
                setDnaMatrix(bioRef.current!.matrix.map((row) => [...row]));
              }}
              onMutateDna={() => {
                bioRef.current!.mutateMatrix(0.28);
                setDnaMatrix(bioRef.current!.matrix.map((row) => [...row]));
                soundEngine.triggerChordShimmer();
              }}
              onRandomizeDna={() => {
                bioRef.current!.randomizeMatrix();
                setDnaMatrix(bioRef.current!.matrix.map((row) => [...row]));
                soundEngine.triggerChordShimmer();
              }}
              bioRadius={bioRadius}
              onChangeBioRadius={(val) => {
                setBioRadius(val);
                bioRef.current!.rMax = val;
              }}
              bioForce={bioForce}
              onChangeBioForce={(val) => {
                setBioForce(val);
                bioRef.current!.forceScale = val;
              }}
              showBonds={showBonds}
              onToggleBonds={() => {
                const next = !showBonds;
                setShowBonds(next);
                bioRef.current!.showBonds = next;
              }}
              selectedSpecies={selectedSpecies}
              onSelectSpecies={(sp) => {
                setSelectedSpecies(sp);
                bioRef.current!.selectedSpecies = sp;
                setBioTool('spawn');
              }}
              emitterFreq={emitterFreq}
              onChangeEmitterFreq={(val) => {
                setEmitterFreq(val);
                cymaticsRef.current!.emitterFreq = val;
                cymaticsRef.current!.emitters.forEach((em) => {
                  em.freq = val;
                });
              }}
              reflectiveCavity={reflectiveCavity}
              onToggleReflectiveCavity={() => {
                const next = !reflectiveCavity;
                setReflectiveCavity(next);
                cymaticsRef.current!.reflectiveCavity = next;
              }}
              onClearWaves={() => cymaticsRef.current!.clearWavesOnly()}
              onClearCymaticsAll={() => cymaticsRef.current!.clearAll()}
              cyclePeriod={cyclePeriod}
              onChangeCyclePeriod={(val) => {
                setCyclePeriod(val);
                polyRef.current!.periodSeconds = val;
              }}
              showChords={showChords}
              onToggleShowChords={() => {
                const next = !showChords;
                setShowChords(next);
                polyRef.current!.showChords = next;
              }}
              onRealignPolyrhythm={() => {
                polyRef.current!.realignPhases();
                soundEngine.triggerChordShimmer();
              }}
              onClearInk={() => polyRef.current!.clearInk()}
              scale={scale}
              onChangeScale={(s) => {
                setScale(s);
                soundEngine.setScale(s);
                soundEngine.triggerChordShimmer();
              }}
              timbre={timbre}
              onChangeTimbre={(t) => {
                setTimbre(t);
                soundEngine.setTimbre(t);
                soundEngine.triggerChordShimmer();
              }}
              volume={volume}
              onChangeVolume={(v) => {
                setVolume(v);
                soundEngine.setVolume(v);
              }}
              onTestChord={() => {
                if (!soundEngine.isEnabled()) {
                  soundEngine.setEnabled(true).then((ok) => {
                    setAudioEnabled(ok);
                  });
                } else {
                  soundEngine.triggerChordShimmer();
                }
              }}
              savedUniverses={savedUniverses}
              onSaveUniverse={handleSaveUniverse}
              onLoadUniverse={handleLoadUniverse}
              onDeleteUniverse={handleDeleteUniverse}
            />
          )}

          {/* Contextual Brush & Time Dock */}
          <ToolDock
            mode={mode}
            gravityTool={gravityTool}
            onSelectGravityTool={setGravityTool}
            bioTool={bioTool}
            onSelectBioTool={setBioTool}
            cymaticsTool={cymaticsTool}
            onSelectCymaticsTool={setCymaticsTool}
            polyTool={polyTool}
            onSelectPolyTool={setPolyTool}
            paused={paused}
            onTogglePause={() => setPaused((p) => !p)}
            timeScale={timeScale}
            onChangeTimeScale={setTimeScale}
            onCapturePng={handleCapturePng}
          />

          {/* Non-blocking Carte Blanche Welcome Card */}
          <WelcomeBanner
            visible={welcomeVisible}
            onEnableAudioAndDismiss={async () => {
              const ok = await soundEngine.setEnabled(true);
              setAudioEnabled(ok);
              setWelcomeVisible(false);
            }}
            onDismiss={() => setWelcomeVisible(false)}
          />
        </>
      )}

      {/* Subtle Ephemeral Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="hud-panel rounded-full px-4 py-1.5 text-xs font-medium text-teal-200 border-teal-400/35">
            {toastMsg}
          </div>
        </div>
      )}

      {/* Scientific & Artistic Manifesto Modal */}
      <ManifestoModal open={manifestoOpen} onClose={() => setManifestoOpen(false)} />
    </div>
  );
};

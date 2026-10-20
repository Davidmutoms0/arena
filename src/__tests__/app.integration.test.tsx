// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { App } from '../App';
import { GRAVITY_PRESETS, GravityEngine } from '../engines/GravityEngine';
import { BIO_PRESETS, BioGenesisEngine } from '../engines/BioGenesisEngine';
import { CYMATICS_PRESETS, CymaticsEngine } from '../engines/CymaticsEngine';
import { POLYRHYTHM_PRESETS, PolyrhythmEngine } from '../engines/PolyrhythmEngine';

function createStrictMockCanvas2D(): CanvasRenderingContext2D {
  const assertFinite = (...nums: number[]) => {
    for (const n of nums) {
      if (!Number.isFinite(n)) {
        throw new Error(`Non-finite canvas coordinate detected: ${n}`);
      }
    }
  };

  const gradientStub = {
    addColorStop: (offset: number, _color: string) => {
      assertFinite(offset);
      if (offset < 0 || offset > 1) throw new Error(`Invalid stop offset: ${offset}`);
    },
  };

  return {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    save: () => {},
    restore: () => {},
    setTransform: (...args: number[]) => assertFinite(...args),
    translate: (x: number, y: number) => assertFinite(x, y),
    scale: (x: number, y: number) => assertFinite(x, y),
    rotate: (a: number) => assertFinite(a),
    fillRect: (x: number, y: number, w: number, h: number) => assertFinite(x, y, w, h),
    clearRect: (x: number, y: number, w: number, h: number) => assertFinite(x, y, w, h),
    beginPath: () => {},
    closePath: () => {},
    moveTo: (x: number, y: number) => assertFinite(x, y),
    lineTo: (x: number, y: number) => assertFinite(x, y),
    stroke: () => {},
    fill: () => {},
    setLineDash: (segments: number[]) => assertFinite(...segments),
    arc: (x: number, y: number, r: number) => {
      assertFinite(x, y, r);
      if (r < 0) throw new Error(`Negative arc radius: ${r}`);
    },
    ellipse: (x: number, y: number, rx: number, ry: number) => {
      assertFinite(x, y, rx, ry);
      if (rx < 0 || ry < 0) throw new Error(`Negative ellipse radius: ${rx}, ${ry}`);
    },
    createRadialGradient: (
      x0: number,
      y0: number,
      r0: number,
      x1: number,
      y1: number,
      r1: number
    ) => {
      assertFinite(x0, y0, r0, x1, y1, r1);
      if (r0 < 0 || r1 < 0) throw new Error(`Negative radial gradient radius: ${r0}, ${r1}`);
      return gradientStub as unknown as CanvasGradient;
    },
    createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => {
      assertFinite(x0, y0, x1, y1);
      return gradientStub as unknown as CanvasGradient;
    },
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
    putImageData: () => {},
    drawImage: () => {},
  } as unknown as CanvasRenderingContext2D;
}

describe('Full UI + Strict Canvas Rendering Integration Suite', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ universes: [] }),
      })
    );

    HTMLCanvasElement.prototype.getContext = vi.fn(() =>
      createStrictMockCanvas2D()
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });
  });

  it('renders all 16 presets across all 4 engines cleanly with valid geometry & gradients', () => {
    const ctx = createStrictMockCanvas2D();

    const g = new GravityEngine(1280, 800);
    for (const p of GRAVITY_PRESETS) {
      g.loadPreset(p.id);
      for (let i = 0; i < 15; i++) g.step(0.016, 3);
      g.render(ctx, 1280, 800, { x: 0, y: 0, zoom: 1 }, 1.2, {
        startX: 120,
        startY: 80,
        vx: -25,
        vy: 60,
        kind: 'planet',
      });
    }

    const b = new BioGenesisEngine(1280, 800);
    for (const p of BIO_PRESETS) {
      b.loadPreset(p.id);
      for (let i = 0; i < 10; i++) b.step(1.0);
      b.render(ctx, 1280, 800);
    }

    const c = new CymaticsEngine();
    for (const p of CYMATICS_PRESETS) {
      c.loadPreset(p.id);
      for (let i = 0; i < 10; i++) c.step(2);
      c.render(ctx, 1280, 800);
    }

    const poly = new PolyrhythmEngine();
    for (const p of POLYRHYTHM_PRESETS) {
      poly.loadPreset(p.id);
      for (let i = 0; i < 15; i++) poly.step(0.05);
      poly.render(ctx, 1280, 800);
    }
  });

  it('mounts <App />, navigates all 4 modes, edits DNA matrix, and switches inspector tabs', () => {
    render(<App />);

    expect(screen.getByText('Bienvenue dans ASTRALYS')).toBeTruthy();

    // Switch through all 4 engines
    fireEvent.click(screen.getByText('BIO-GENÈSE'));
    expect(screen.getByText('Matrice Génétique 6×6')).toBeTruthy();

    // Mutate DNA cleanly
    fireEvent.click(screen.getByText('Muter l’ADN'));

    fireEvent.click(screen.getByText('CYMATIQUE'));
    expect(screen.getByText('Physique Ondulatoire 2D')).toBeTruthy();

    fireEvent.click(screen.getByText('POLYRHYTHMIE'));
    expect(screen.getByText('Horlogerie Astronomique')).toBeTruthy();

    fireEvent.click(screen.getByText('GRAVITÉ'));
    expect(screen.getByText('Constantes Relativistes')).toBeTruthy();

    // Switch inspector sub-tabs
    fireEvent.click(screen.getByText('Harmonie'));
    expect(screen.getByText('Gamme Musicale Cosmique')).toBeTruthy();

    fireEvent.click(screen.getByText('Archives'));
    expect(screen.getByText('Figer l’état de cet univers')).toBeTruthy();
  });
});

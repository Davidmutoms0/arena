import { describe, expect, it } from 'vitest';
import { GravityEngine } from '../engines/GravityEngine';
import { BioGenesisEngine } from '../engines/BioGenesisEngine';
import { CymaticsEngine } from '../engines/CymaticsEngine';
import { PolyrhythmEngine } from '../engines/PolyrhythmEngine';
import { degreeToFrequency } from '../audio/SoundEngine';

describe('ASTRALYS Core Physics & Generative Audio Verification', () => {
  it('conserves total orbital energy in Velocity-Verlet N-body solar system', () => {
    const engine = new GravityEngine(1280, 800);
    engine.loadPreset('harmonic-solar');

    const initialEnergy = engine.computeTotalEnergy();
    expect(Number.isFinite(initialEnergy)).toBe(true);
    expect(initialEnergy).toBeLessThan(0); // Gravitationally bound system

    for (let i = 0; i < 400; i++) {
      engine.step(0.016, 3);
    }

    const finalEnergy = engine.computeTotalEnergy();
    const relativeDrift = Math.abs(finalEnergy - initialEnergy) / Math.abs(initialEnergy);
    expect(relativeDrift).toBeLessThan(0.005);
  });

  it('predicts non-empty orbital trajectories without NaN values', () => {
    const engine = new GravityEngine(1280, 800);
    const orb = engine.computeAutoOrbitVelocity(220, 0);
    const prediction = engine.predictTrajectory(220, 0, orb.vx, orb.vy, 120, 0.02);

    expect(prediction.points.length).toBeGreaterThan(30);
    expect(prediction.collided).toBe(false);
    for (const p of prediction.points) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('maintains bounded toroidal coordinates & finite energy in BioGenesisEngine', () => {
    const bio = new BioGenesisEngine(1000, 700);
    bio.loadPreset('hunter-serpents');

    let energy = 0;
    for (let s = 0; s < 60; s++) {
      energy = bio.step(1.0);
    }

    expect(Number.isFinite(energy)).toBe(true);
    expect(energy).toBeGreaterThan(0);

    for (let i = 0; i < bio.count; i++) {
      expect(bio.px[i]).toBeGreaterThanOrEqual(0);
      expect(bio.px[i]).toBeLessThan(1000);
      expect(bio.py[i]).toBeGreaterThanOrEqual(0);
      expect(bio.py[i]).toBeLessThan(700);
    }
  });

  it('maintains strict CFL stability across 2D wave PDE presets in CymaticsEngine', () => {
    const cym = new CymaticsEngine();
    cym.loadPreset('double-slit');

    let waveEnergy = 0;
    for (let s = 0; s < 120; s++) {
      waveEnergy = cym.step(2);
    }

    expect(Number.isFinite(waveEnergy)).toBe(true);
    expect(waveEnergy).toBeGreaterThan(0);

    for (let i = 0; i < cym.size; i++) {
      expect(Math.abs(cym.uCurr[i])).toBeLessThanOrEqual(3.85);
    }
  });

  it('returns all harmonic resonators to exact phase alignment after full period T', () => {
    const poly = new PolyrhythmEngine();
    poly.loadPreset('pendulum-wave');

    // Advance exactly 60.0s in 600 steps of 0.1s
    for (let i = 0; i < 600; i++) {
      poly.step(0.1);
    }

    const baseAngle = poly.rings[0].angle % (Math.PI * 2);
    for (const ring of poly.rings) {
      const modAngle = ring.angle % (Math.PI * 2);
      const diff = Math.abs(Math.sin(modAngle - baseAngle));
      expect(diff).toBeLessThan(1e-6);
    }
  });

  it('maps scale degrees monotonically to valid audible frequencies', () => {
    const f0 = degreeToFrequency(0, 'lydian');
    const f4 = degreeToFrequency(4, 'lydian');
    const f7 = degreeToFrequency(7, 'lydian');

    expect(f0).toBeGreaterThan(60);
    expect(f4).toBeGreaterThan(f0);
    expect(f7).toBeCloseTo(f0 * 2, 2); // Octave exact doubling
  });
});

import type { PresetDefinition } from '../types/universe';

export interface PolyrhythmRing {
  index: number;
  cyclesPerPeriod: number;
  angle: number;
  muted: boolean;
  flash: number; // 1 -> 0 glow after crossing meridian
  color: string;
}

export interface ChordSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export const POLYRHYTHM_PRESETS: PresetDefinition[] = [
  {
    id: 'pendulum-wave',
    label: 'Onde de Pendules (Unisson 60s)',
    subtitle: '16 résonateurs en progression arithmétique convergeant toutes les 60 secondes',
  },
  {
    id: 'venus-rose',
    label: 'Rosace Sacrée Vénus–Terre (8:13)',
    subtitle: 'Trace la célèbre étoile à 5 pétales des conjonctions astronomiques de Vénus',
  },
  {
    id: 'laplace-galilean',
    label: 'Résonance de Laplace (1 : 2 : 4 : 8)',
    subtitle: 'Octaves géométriques pures inspirées des lunes galiléennes de Jupiter',
  },
  {
    id: 'reich-phase',
    label: 'Déphasage Minimaliste (Eno / Reich)',
    subtitle: '8 anneaux à dérive micro-temporelle tissant des polyrythmies hypnotiques',
  },
];

const RING_PALETTE = [
  '#2DD4BF',
  '#38BDF8',
  '#60A5FA',
  '#818CF8',
  '#A78BFA',
  '#F472B6',
  '#FB7185',
  '#F59E0B',
  '#FBBF24',
  '#34D399',
];

export class PolyrhythmEngine {
  public rings: PolyrhythmRing[] = [];
  public chords: ChordSegment[] = [];
  public maxChords = 1800;

  public periodSeconds = 60;
  public showChords = true;
  public showOrbitTracks = true;
  public hoveredRing = -1;
  public elapsedCycleTime = 0;
  public triggerCount = 0;

  private chordSampleAccum = 0;

  constructor() {
    this.loadPreset('pendulum-wave');
  }

  public loadPreset(presetId: string): void {
    this.rings = [];
    this.chords = [];
    this.elapsedCycleTime = 0;
    this.triggerCount = 0;

    if (presetId === 'venus-rose') {
      this.periodSeconds = 28;
      const ratios = [8, 13, 21, 34];
      ratios.forEach((r, idx) => {
        this.rings.push({
          index: idx,
          cyclesPerPeriod: r,
          angle: -Math.PI * 0.5,
          muted: false,
          flash: 1,
          color: idx % 2 === 0 ? '#F59E0B' : '#2DD4BF',
        });
      });
    } else if (presetId === 'laplace-galilean') {
      this.periodSeconds = 32;
      const ratios = [3, 6, 9, 12, 16, 24, 32, 48];
      ratios.forEach((r, idx) => {
        this.rings.push({
          index: idx,
          cyclesPerPeriod: r,
          angle: -Math.PI * 0.5,
          muted: false,
          flash: 1,
          color: RING_PALETTE[idx % RING_PALETTE.length],
        });
      });
    } else if (presetId === 'reich-phase') {
      this.periodSeconds = 90;
      for (let i = 0; i < 8; i++) {
        this.rings.push({
          index: i,
          cyclesPerPeriod: 24 + i * 0.5,
          angle: -Math.PI * 0.5,
          muted: false,
          flash: 1,
          color: RING_PALETTE[i % RING_PALETTE.length],
        });
      }
    } else {
      // Classic 16-ring Pendulum Wave
      this.periodSeconds = 60;
      for (let i = 0; i < 16; i++) {
        this.rings.push({
          index: i,
          cyclesPerPeriod: 12 + i,
          angle: -Math.PI * 0.5,
          muted: false,
          flash: 1,
          color: RING_PALETTE[i % RING_PALETTE.length],
        });
      }
    }
  }

  public realignPhases(): void {
    this.chords = [];
    this.elapsedCycleTime = 0;
    for (const r of this.rings) {
      r.angle = -Math.PI * 0.5;
      r.flash = 1.0;
    }
  }

  public clearInk(): void {
    this.chords = [];
  }

  public getRingRadii(minRadius: number, maxRadius: number): number[] {
    const n = this.rings.length;
    if (n === 0) return [];
    if (n === 1) return [(minRadius + maxRadius) * 0.5];
    return this.rings.map((_, i) => minRadius + (i / (n - 1)) * (maxRadius - minRadius));
  }

  public hitTestRing(
    sx: number,
    sy: number,
    width: number,
    height: number
  ): number {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const dist = Math.hypot(sx - cx, sy - cy);
    const maxR = Math.min(width, height) * 0.42;
    const minR = maxR * 0.16;
    const radii = this.getRingRadii(minR, maxR);

    let bestIdx = -1;
    let bestDiff = 18;
    radii.forEach((r, idx) => {
      const diff = Math.abs(dist - r);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }

  public step(
    dt: number,
    onNote?: (degree: number, velocity: number, pan: number) => void
  ): void {
    this.elapsedCycleTime += dt;
    const twoPi = Math.PI * 2;
    const topMeridian = -Math.PI * 0.5;

    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      const omega = (twoPi * r.cyclesPerPeriod) / this.periodSeconds;
      const prevShifted = r.angle - topMeridian;
      const prevRev = Math.floor(prevShifted / twoPi);

      r.angle += omega * dt;

      const currShifted = r.angle - topMeridian;
      const currRev = Math.floor(currShifted / twoPi);

      if (currRev > prevRev) {
        r.flash = 1.0;
        this.triggerCount++;
        if (!r.muted && onNote) {
          const pan = ((i / Math.max(1, this.rings.length - 1)) * 2 - 1) * 0.72;
          onNote(i, 0.38, pan);
        }
      } else {
        r.flash = Math.max(0, r.flash - dt * 2.4);
      }
    }

    // Record persistent geometric chord rose segments in normalized unit space
    if (this.showChords && this.rings.length >= 2) {
      this.chordSampleAccum += dt;
      if (this.chordSampleAccum >= 0.045) {
        this.chordSampleAccum = 0;
        const n = this.rings.length;
        for (let i = 0; i < n - 1; i++) {
          const rA = this.rings[i];
          const rB = this.rings[i + 1];
          if (rA.muted || rB.muted) continue;
          const uA = 0.16 + (i / (n - 1)) * 0.84;
          const uB = 0.16 + ((i + 1) / (n - 1)) * 0.84;
          this.chords.push({
            x1: Math.cos(rA.angle) * uA,
            y1: Math.sin(rA.angle) * uA,
            x2: Math.cos(rB.angle) * uB,
            y2: Math.sin(rB.angle) * uB,
            color: rA.color,
          });
        }
        if (this.chords.length > this.maxChords) {
          this.chords.splice(0, this.chords.length - this.maxChords);
        }
      }
    }
  }

  public serialize(): Record<string, unknown> {
    return {
      periodSeconds: this.periodSeconds,
      showChords: this.showChords,
      rings: this.rings.map((r) => ({
        index: r.index,
        cyclesPerPeriod: r.cyclesPerPeriod,
        angle: r.angle,
        muted: r.muted,
        color: r.color,
      })),
    };
  }

  public deserialize(data: Record<string, unknown>): void {
    if (typeof data.presetId === 'string') {
      this.loadPreset(data.presetId);
      return;
    }
    if (Array.isArray(data.rings) && data.rings.length > 0) {
      this.chords = [];
      if (typeof data.periodSeconds === 'number') this.periodSeconds = data.periodSeconds;
      if (typeof data.showChords === 'boolean') this.showChords = data.showChords;
      this.rings = (data.rings as PolyrhythmRing[]).map((item, idx) => ({
        index: idx,
        cyclesPerPeriod: Number(item.cyclesPerPeriod ?? 12 + idx),
        angle: Number(item.angle ?? -Math.PI * 0.5),
        muted: Boolean(item.muted),
        flash: 0,
        color: item.color ?? RING_PALETTE[idx % RING_PALETTE.length],
      }));
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#04060A';
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const maxR = Math.min(width, height) * 0.42;
    const minR = maxR * 0.16;

    // Subtle astrolabe radial glow
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, maxR * 1.15);
    glow.addColorStop(0, 'rgba(45, 212, 191, 0.11)');
    glow.addColorStop(0.55, 'rgba(15, 23, 42, 0.16)');
    glow.addColorStop(1, 'rgba(4, 6, 10, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(cx, cy);

    // Astronomical degree tick dial
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const inner = deg % 30 === 0 ? maxR * 1.03 : maxR * 1.05;
      const outer = maxR * 1.075;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * inner, Math.sin(rad) * inner);
      ctx.lineTo(Math.cos(rad) * outer, Math.sin(rad) * outer);
      ctx.stroke();
    }

    // Persistent Guilloché geometric rose chords
    if (this.showChords && this.chords.length > 0) {
      ctx.lineWidth = 0.85;
      for (let i = 0; i < this.chords.length; i++) {
        const c = this.chords[i];
        const ageAlpha = (i / this.chords.length) * 0.24;
        ctx.strokeStyle = c.color;
        ctx.globalAlpha = ageAlpha;
        ctx.beginPath();
        ctx.moveTo(c.x1 * maxR, c.y1 * maxR);
        ctx.lineTo(c.x2 * maxR, c.y2 * maxR);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    const radii = this.getRingRadii(minR, maxR);

    // Concentric orbit guide tracks
    if (this.showOrbitTracks) {
      radii.forEach((r, idx) => {
        const isHovered = idx === this.hoveredRing;
        const ring = this.rings[idx];
        ctx.strokeStyle = isHovered
          ? 'rgba(45, 212, 191, 0.55)'
          : ring.muted
            ? 'rgba(148, 163, 184, 0.04)'
            : `rgba(148, 163, 184, ${0.075 + ring.flash * 0.22})`;
        ctx.lineWidth = isHovered ? 1.6 : 1;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // Golden Top Trigger Meridian Bridge (12 o'clock)
    const bridgeGrad = ctx.createLinearGradient(0, -minR * 0.65, 0, -maxR * 1.05);
    bridgeGrad.addColorStop(0, 'rgba(245, 158, 11, 0.65)');
    bridgeGrad.addColorStop(1, 'rgba(45, 212, 191, 0.85)');
    ctx.strokeStyle = bridgeGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -minR * 0.6);
    ctx.lineTo(0, -maxR * 1.04);
    ctx.stroke();

    // Central Astrolabe Core
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Live connecting harmonic polyline across current orb positions
    ctx.beginPath();
    let started = false;
    radii.forEach((r, idx) => {
      const ring = this.rings[idx];
      if (ring.muted) return;
      const x = Math.cos(ring.angle) * r;
      const y = Math.sin(ring.angle) * r;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.34)';
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Resonator Orbs
    radii.forEach((r, idx) => {
      const ring = this.rings[idx];
      const x = Math.cos(ring.angle) * r;
      const y = Math.sin(ring.angle) * r;

      if (ring.muted) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

      if (ring.flash > 0.02) {
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.flash * 0.8;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(x, y, 6 + (1 - ring.flash) * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      const halo = ctx.createRadialGradient(x, y, 1, x, y, 13);
      halo.addColorStop(0, '#FFFFFF');
      halo.addColorStop(0.35, ring.color);
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 3.8 + ring.flash * 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

import type { PresetDefinition } from '../types/universe';

export interface WaveEmitter {
  gx: number;
  gy: number;
  freq: number;
  amplitude: number;
  phase: number;
}

export const CYMATICS_PRESETS: PresetDefinition[] = [
  {
    id: 'double-slit',
    label: 'Expérience des Fentes de Young',
    subtitle: 'Diffraction cohérente et franges d’interférence quantique en direct',
  },
  {
    id: 'chladni-mandala',
    label: 'Mandala Acoustique de Chladni',
    subtitle: 'Ondes stationnaires symétriques dans une cavité résonante fermée',
  },
  {
    id: 'optical-lens',
    label: 'Lentille de Réfraction de Snell',
    subtitle: 'Convergence d’un front d’onde à travers un verre biconvexe d’indice 1,70',
  },
  {
    id: 'elliptical-whisper',
    label: 'Miroir Elliptique aux Deux Foyers',
    subtitle: 'Toute onde émise au foyer F₁ se reconcentre exactement au foyer F₂',
  },
];

export class CymaticsEngine {
  public readonly cols = 288;
  public readonly rows = 180;
  public readonly size = 288 * 180;

  public uPrev = new Float32Array(this.size);
  public uCurr = new Float32Array(this.size);
  public uNext = new Float32Array(this.size);
  public wallMask = new Uint8Array(this.size);
  public lensMask = new Uint8Array(this.size);
  private sponge = new Float32Array(this.size);

  public emitters: WaveEmitter[] = [];
  public reflectiveCavity = false;
  public emitterFreq = 0.26;
  public damping = 0.9965;
  public simTick = 0;

  private offscreen: HTMLCanvasElement | null = null;
  private offCtx: CanvasRenderingContext2D | null = null;
  private imgData: ImageData | null = null;

  constructor() {
    this.buildSpongeLayer();
    this.initOffscreenBuffer();
    this.loadPreset('double-slit');
  }

  private initOffscreenBuffer(): void {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = this.cols;
    canvas.height = this.rows;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.offscreen = canvas;
      this.offCtx = ctx;
      this.imgData = ctx.createImageData(this.cols, this.rows);
    }
  }

  private buildSpongeLayer(): void {
    const margin = 20;
    for (let y = 0; y < this.rows; y++) {
      const dy = Math.min(y, this.rows - 1 - y);
      for (let x = 0; x < this.cols; x++) {
        const dx = Math.min(x, this.cols - 1 - x);
        const d = Math.min(dx, dy);
        if (d >= margin) {
          this.sponge[y * this.cols + x] = 1.0;
        } else {
          const norm = d / margin;
          this.sponge[y * this.cols + x] = 0.88 + 0.12 * (norm * norm);
        }
      }
    }
  }

  public clearWavesOnly(): void {
    this.uPrev.fill(0);
    this.uCurr.fill(0);
    this.uNext.fill(0);
  }

  public clearAll(): void {
    this.clearWavesOnly();
    this.wallMask.fill(0);
    this.lensMask.fill(0);
    this.emitters = [];
  }

  public loadPreset(presetId: string): void {
    this.clearAll();
    this.simTick = 0;

    const midX = Math.floor(this.cols * 0.5);
    const midY = Math.floor(this.rows * 0.5);

    if (presetId === 'chladni-mandala') {
      this.reflectiveCavity = true;
      this.emitterFreq = 0.31;
      const offsetX = 48;
      const offsetY = 34;
      this.emitters = [
        { gx: midX - offsetX, gy: midY - offsetY, freq: 0.31, amplitude: 1.45, phase: 0 },
        { gx: midX + offsetX, gy: midY - offsetY, freq: 0.31, amplitude: 1.45, phase: 0 },
        { gx: midX - offsetX, gy: midY + offsetY, freq: 0.31, amplitude: 1.45, phase: 0 },
        { gx: midX + offsetX, gy: midY + offsetY, freq: 0.31, amplitude: 1.45, phase: 0 },
      ];
    } else if (presetId === 'optical-lens') {
      this.reflectiveCavity = false;
      this.emitterFreq = 0.34;
      this.emitters = [
        { gx: 46, gy: midY, freq: 0.34, amplitude: 1.85, phase: 0 },
      ];

      // Carve a precision biconvex optical glass lens centered at x = 126
      const lensCx = 126;
      const lensRadius = 68;
      const halfThick = 17;
      const leftSphereX = lensCx + (lensRadius - halfThick);
      const rightSphereX = lensCx - (lensRadius - halfThick);

      for (let y = 12; y < this.rows - 12; y++) {
        for (let x = lensCx - halfThick - 4; x <= lensCx + halfThick + 4; x++) {
          const dLeft = Math.hypot(x - leftSphereX, y - midY);
          const dRight = Math.hypot(x - rightSphereX, y - midY);
          if (dLeft <= lensRadius && dRight <= lensRadius) {
            this.lensMask[y * this.cols + x] = 1;
          }
        }
      }
    } else if (presetId === 'elliptical-whisper') {
      this.reflectiveCavity = true;
      this.emitterFreq = 0.28;
      const rx = 116;
      const ry = 74;
      const focusC = Math.round(Math.sqrt(rx * rx - ry * ry));

      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const nx = (x - midX) / rx;
          const ny = (y - midY) / ry;
          const ell = nx * nx + ny * ny;
          if (ell >= 1.0 && ell <= 1.12) {
            this.wallMask[y * this.cols + x] = 1;
          }
        }
      }

      // Single pulse droplet right at left focus F1 + gentle slow heartbeat emitter
      this.emitters = [
        { gx: midX - focusC, gy: midY, freq: 0.25, amplitude: 1.5, phase: 0 },
      ];
      this.pluckAtGrid(midX - focusC, midY, 3.2, 5);
    } else {
      // Default: Quantum Young's Double-Slit Interference!
      this.reflectiveCavity = false;
      this.emitterFreq = 0.33;

      // Coherent planar wave generator line on left side
      for (let sy = midY - 48; sy <= midY + 48; sy += 6) {
        this.emitters.push({
          gx: 44,
          gy: sy,
          freq: 0.33,
          amplitude: 0.95,
          phase: 0,
        });
      }

      // Solid titanium barrier at x = 104 with two precision slits
      const barrierX = 104;
      const slitGap = 15;
      const slitHalfWidth = 3;
      for (let y = 0; y < this.rows; y++) {
        const inUpperSlit = Math.abs(y - (midY - slitGap)) <= slitHalfWidth;
        const inLowerSlit = Math.abs(y - (midY + slitGap)) <= slitHalfWidth;
        if (!inUpperSlit && !inLowerSlit) {
          for (let dx = -1; dx <= 1; dx++) {
            this.wallMask[y * this.cols + (barrierX + dx)] = 1;
          }
        }
      }
    }
  }

  public screenToGrid(sx: number, sy: number, width: number, height: number): { gx: number; gy: number } {
    const gx = Math.max(2, Math.min(this.cols - 3, Math.round((sx / width) * this.cols)));
    const gy = Math.max(2, Math.min(this.rows - 3, Math.round((sy / height) * this.rows)));
    return { gx, gy };
  }

  public pluckAtGrid(gx: number, gy: number, strength = 2.6, radius = 5): void {
    const rSq = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      const y = gy + dy;
      if (y <= 1 || y >= this.rows - 2) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const x = gx + dx;
        if (x <= 1 || x >= this.cols - 2) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 <= rSq) {
          const idx = y * this.cols + x;
          if (this.wallMask[idx] === 0) {
            const pulse = strength * Math.exp(-d2 / (rSq * 0.45));
            this.uCurr[idx] = Math.max(-3.5, Math.min(3.5, this.uCurr[idx] + pulse));
          }
        }
      }
    }
  }

  public addEmitter(gx: number, gy: number): void {
    if (this.emitters.length >= 24) {
      this.emitters.shift();
    }
    this.wallMask[gy * this.cols + gx] = 0;
    this.emitters.push({
      gx,
      gy,
      freq: this.emitterFreq,
      amplitude: 1.55,
      phase: 0,
    });
  }

  public paintMaterial(
    gx: number,
    gy: number,
    kind: 'wall' | 'lens' | 'eraser',
    brushRadius = 3
  ): void {
    const rSq = brushRadius * brushRadius;
    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      const y = gy + dy;
      if (y <= 1 || y >= this.rows - 2) continue;
      for (let dx = -brushRadius; dx <= brushRadius; dx++) {
        const x = gx + dx;
        if (x <= 1 || x >= this.cols - 2) continue;
        if (dx * dx + dy * dy <= rSq) {
          const idx = y * this.cols + x;
          if (kind === 'wall') {
            this.wallMask[idx] = 1;
            this.lensMask[idx] = 0;
            this.uCurr[idx] = 0;
            this.uPrev[idx] = 0;
          } else if (kind === 'lens') {
            this.wallMask[idx] = 0;
            this.lensMask[idx] = 1;
          } else {
            this.wallMask[idx] = 0;
            this.lensMask[idx] = 0;
          }
        }
      }
    }

    if (kind === 'eraser') {
      this.emitters = this.emitters.filter(
        (em) => Math.hypot(em.gx - gx, em.gy - gy) > brushRadius + 3
      );
    }
  }

  public step(substeps = 2): number {
    const cols = this.cols;
    const rows = this.rows;
    let totalWaveEnergy = 0;

    for (let s = 0; s < substeps; s++) {
      this.simTick += 1;

      // Drive coherent wave emitters
      for (let e = 0; e < this.emitters.length; e++) {
        const em = this.emitters[e];
        const idx = em.gy * cols + em.gx;
        if (this.wallMask[idx] === 0) {
          const val = Math.sin(this.simTick * em.freq + em.phase) * em.amplitude;
          this.uCurr[idx] = val;
        }
      }

      // Isotropic 9-point discrete wave PDE solver (strictly CFL-safe: c^2 = 0.38 <= 0.5)
      for (let y = 1; y < rows - 1; y++) {
        const rowOff = y * cols;
        for (let x = 1; x < cols - 1; x++) {
          const i = rowOff + x;
          if (this.wallMask[i] === 1) {
            this.uNext[i] = 0;
            continue;
          }

          const lap =
            0.5 *
              (this.uCurr[i - 1] +
                this.uCurr[i + 1] +
                this.uCurr[i - cols] +
                this.uCurr[i + cols]) +
            0.25 *
              (this.uCurr[i - cols - 1] +
                this.uCurr[i - cols + 1] +
                this.uCurr[i + cols - 1] +
                this.uCurr[i + cols + 1]) -
            3.0 * this.uCurr[i];

          const cSq = this.lensMask[i] === 1 ? 0.135 : 0.38;
          let nextVal = (2 * this.uCurr[i] - this.uPrev[i] + cSq * lap) * this.damping;

          if (!this.reflectiveCavity) {
            nextVal *= this.sponge[i];
          }

          if (nextVal > 3.8) nextVal = 3.8;
          else if (nextVal < -3.8) nextVal = -3.8;

          this.uNext[i] = nextVal;
          if (s === substeps - 1) {
            totalWaveEnergy += nextVal * nextVal;
          }
        }
      }

      // Swap ring buffers
      const tmp = this.uPrev;
      this.uPrev = this.uCurr;
      this.uCurr = this.uNext;
      this.uNext = tmp;
    }

    return totalWaveEnergy * 0.05;
  }

  public serialize(): Record<string, unknown> {
    return {
      reflectiveCavity: this.reflectiveCavity,
      emitterFreq: this.emitterFreq,
      emitters: this.emitters.map((e) => ({ ...e })),
    };
  }

  public deserialize(data: Record<string, unknown>): void {
    if (typeof data.presetId === 'string') {
      this.loadPreset(data.presetId);
      return;
    }
    this.clearAll();
    if (typeof data.reflectiveCavity === 'boolean') {
      this.reflectiveCavity = data.reflectiveCavity;
    }
    if (typeof data.emitterFreq === 'number') {
      this.emitterFreq = data.emitterFreq;
    }
    if (Array.isArray(data.emitters)) {
      this.emitters = data.emitters as WaveEmitter[];
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.offscreen || !this.offCtx || !this.imgData) {
      this.initOffscreenBuffer();
    }
    if (!this.offscreen || !this.offCtx || !this.imgData) return;

    const data = this.imgData.data;
    const len = this.size;

    for (let i = 0; i < len; i++) {
      const p = i * 4;
      if (this.wallMask[i] === 1) {
        data[p] = 48;
        data[p + 1] = 61;
        data[p + 2] = 79;
        data[p + 3] = 255;
        continue;
      }

      const u = this.uCurr[i];
      const absU = Math.min(1, Math.abs(u) * 0.72);
      const sq = absU * absU;

      let r = 4;
      let g = 7;
      let b = 12;

      if (u >= 0) {
        // Luminous cyan -> ice white wave crest
        r += absU * 42 + sq * 195;
        g += absU * 198 + sq * 52;
        b += absU * 185 + sq * 68;
      } else {
        // Warm solar amber -> gold wave trough
        r += absU * 232 + sq * 22;
        g += absU * 134 + sq * 85;
        b += absU * 24 + sq * 90;
      }

      // Frosted sapphire tint for Snell refractive lenses
      if (this.lensMask[i] === 1) {
        r = r * 0.8 + 18;
        g = g * 0.85 + 48;
        b = Math.min(255, b * 0.9 + 76);
      }

      data[p] = Math.min(255, r);
      data[p + 1] = Math.min(255, g);
      data[p + 2] = Math.min(255, b);
      data[p + 3] = 255;
    }

    this.offCtx.putImageData(this.imgData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.offscreen, 0, 0, width, height);

    // Subtle scientific coordinate grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const stepPx = 64;
    for (let x = stepPx; x < width; x += stepPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = stepPx; y < height; y += stepPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Crisp vector indicators for coherent emitters
    const scaleX = width / this.cols;
    const scaleY = height / this.rows;
    for (const em of this.emitters) {
      const sx = (em.gx + 0.5) * scaleX;
      const sy = (em.gy + 0.5) * scaleY;
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(45, 212, 191, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

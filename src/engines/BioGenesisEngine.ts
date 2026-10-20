import type { PresetDefinition } from '../types/universe';

export const SPECIES_COUNT = 6;

export const SPECIES_COLORS = [
  '#2DD4BF', // 0: Cyan-Émeraude
  '#F59E0B', // 1: Ambre Solaire
  '#FB7185', // 2: Corail Bioluminescent
  '#38BDF8', // 3: Azur Céruléen
  '#A78BFA', // 4: Iris Quantique
  '#F8FAFC', // 5: Ivoire Polaire
];

export const SPECIES_NAMES = [
  'α · Cyanobionte',
  'β · Héliophore',
  'γ · Corallide',
  'δ · Azurocyte',
  'ε · Neurospore',
  'ζ · Nucléide',
];

export const BIO_PRESETS: PresetDefinition[] = [
  {
    id: 'hunter-serpents',
    label: 'Serpents Chasseurs Cycliques',
    subtitle: 'Chaîne prédateur-proie asymétrique formant des vers nageurs vivants',
  },
  {
    id: 'mitotic-cells',
    label: 'Cellules & Membranes Mitotiques',
    subtitle: 'Auto-assemblage de noyaux cellulaires et doubles membranes lipidiques',
  },
  {
    id: 'crystal-symbiosis',
    label: 'Récif Symbiotique Tournant',
    subtitle: 'Fleurs radiales et colonies mutuellement attractives en rotation',
  },
  {
    id: 'primordial-chaos',
    label: 'Soupe Primordiale Aléatoire',
    subtitle: 'Synthétise un génome 6×6 inédit à chaque invocation',
  },
];

export class BioGenesisEngine {
  public readonly maxParticles = 1200;
  public count = 1020;

  // Flat typed arrays for zero-GC 60fps performance
  public px = new Float32Array(this.maxParticles);
  public py = new Float32Array(this.maxParticles);
  public vx = new Float32Array(this.maxParticles);
  public vy = new Float32Array(this.maxParticles);
  public species = new Uint8Array(this.maxParticles);

  public matrix: number[][] = [];
  public rMax = 88;
  public forceScale = 0.72;
  public friction = 0.85;
  public beta = 0.30; // Universal steric core repulsion threshold
  public showBonds = true;
  public selectedSpecies = 0;

  private width = 1280;
  private height = 800;

  // Zero-allocation spatial hash buffers
  private cols = 16;
  private rows = 12;
  private head = new Int32Array(4096);
  private next = new Int32Array(this.maxParticles);
  private soundCooldown = 0;

  constructor(width = 1280, height = 800) {
    this.width = Math.max(320, width);
    this.height = Math.max(240, height);
    this.initEmptyMatrix();
    this.loadPreset('hunter-serpents');
  }

  private initEmptyMatrix(): void {
    this.matrix = Array.from({ length: SPECIES_COUNT }, () =>
      new Array(SPECIES_COUNT).fill(0)
    );
  }

  public resize(width: number, height: number): void {
    const newW = Math.max(320, width);
    const newH = Math.max(240, height);
    const sx = newW / this.width;
    const sy = newH / this.height;
    for (let i = 0; i < this.count; i++) {
      this.px[i] = ((this.px[i] * sx) % newW + newW) % newW;
      this.py[i] = ((this.py[i] * sy) % newH + newH) % newH;
    }
    this.width = newW;
    this.height = newH;
  }

  public seedPositions(clustered = false): void {
    for (let i = 0; i < this.count; i++) {
      const sp = i % SPECIES_COUNT;
      this.species[i] = sp;
      if (clustered) {
        const ang = (sp / SPECIES_COUNT) * Math.PI * 2;
        const cx = this.width * 0.5 + Math.cos(ang) * this.width * 0.22;
        const cy = this.height * 0.5 + Math.sin(ang) * this.height * 0.22;
        this.px[i] = ((cx + (Math.random() - 0.5) * 210) % this.width + this.width) % this.width;
        this.py[i] = ((cy + (Math.random() - 0.5) * 210) % this.height + this.height) % this.height;
      } else {
        this.px[i] = Math.random() * this.width;
        this.py[i] = Math.random() * this.height;
      }
      this.vx[i] = (Math.random() - 0.5) * 1.2;
      this.vy[i] = (Math.random() - 0.5) * 1.2;
    }
  }

  public loadPreset(presetId: string): void {
    this.initEmptyMatrix();

    if (presetId === 'mitotic-cells') {
      // Pairs of (Nucleus, Inner Membrane, Outer Cilia) forming living gliding cells
      this.matrix = [
        [0.85, 0.52, -0.35, -0.45, 0.0, -0.25],
        [0.58, -0.18, 0.36, -0.40, -0.25, 0.0],
        [-0.22, 0.44, -0.32, 0.12, -0.30, 0.18],
        [-0.45, -0.35, 0.0, 0.86, 0.54, -0.32],
        [-0.25, -0.25, 0.0, 0.60, -0.16, 0.38],
        [0.16, -0.28, 0.14, -0.20, 0.45, -0.30],
      ];
      this.seedPositions(false);
    } else if (presetId === 'crystal-symbiosis') {
      for (let i = 0; i < SPECIES_COUNT; i++) {
        for (let j = 0; j < SPECIES_COUNT; j++) {
          if (i === j) this.matrix[i][j] = -0.32;
          else if ((j - i + SPECIES_COUNT) % SPECIES_COUNT === 1) this.matrix[i][j] = 0.72;
          else if ((i - j + SPECIES_COUNT) % SPECIES_COUNT === 1) this.matrix[i][j] = 0.34;
          else this.matrix[i][j] = -0.38;
        }
      }
      this.seedPositions(true);
    } else if (presetId === 'primordial-chaos') {
      this.randomizeMatrix();
      this.seedPositions(false);
    } else {
      // Default: Hunter-Serpents (spectacular swimming segmented worms!)
      for (let i = 0; i < SPECIES_COUNT; i++) {
        for (let j = 0; j < SPECIES_COUNT; j++) {
          const diff = (j - i + SPECIES_COUNT) % SPECIES_COUNT;
          if (diff === 0) this.matrix[i][j] = 0.56;
          else if (diff === 1) this.matrix[i][j] = 0.86;
          else if (diff === SPECIES_COUNT - 1) this.matrix[i][j] = -0.74;
          else if (diff === 2) this.matrix[i][j] = 0.22;
          else this.matrix[i][j] = -0.36;
        }
      }
      this.seedPositions(true);
    }
  }

  public randomizeMatrix(): void {
    for (let i = 0; i < SPECIES_COUNT; i++) {
      for (let j = 0; j < SPECIES_COUNT; j++) {
        this.matrix[i][j] = Math.round((Math.random() * 1.9 - 0.92) * 100) / 100;
      }
    }
  }

  public mutateMatrix(amount = 0.28): void {
    for (let i = 0; i < SPECIES_COUNT; i++) {
      for (let j = 0; j < SPECIES_COUNT; j++) {
        if (Math.random() < 0.45) {
          const nextVal = this.matrix[i][j] + (Math.random() * 2 - 1) * amount;
          this.matrix[i][j] = Math.max(-1, Math.min(1, Math.round(nextVal * 100) / 100));
        }
      }
    }
  }

  public cycleMatrixCell(row: number, col: number, delta = 0.35): void {
    if (row < 0 || row >= SPECIES_COUNT || col < 0 || col >= SPECIES_COUNT) return;
    let next = this.matrix[row][col] + delta;
    if (next > 1.01) next = -0.95;
    this.matrix[row][col] = Math.round(Math.max(-1, Math.min(1, next)) * 100) / 100;
  }

  public applyBrush(
    mode: 'attract' | 'repel' | 'spawn' | 'vortex',
    x: number,
    y: number
  ): void {
    if (mode === 'spawn') {
      for (let k = 0; k < 5; k++) {
        const idx =
          this.count < this.maxParticles
            ? this.count++
            : Math.floor(Math.random() * this.count);
        this.px[idx] = ((x + (Math.random() - 0.5) * 34) % this.width + this.width) % this.width;
        this.py[idx] = ((y + (Math.random() - 0.5) * 34) % this.height + this.height) % this.height;
        this.vx[idx] = (Math.random() - 0.5) * 2.2;
        this.vy[idx] = (Math.random() - 0.5) * 2.2;
        this.species[idx] = this.selectedSpecies;
      }
      return;
    }

    const radius = 175;
    for (let i = 0; i < this.count; i++) {
      let dx = x - this.px[i];
      let dy = y - this.py[i];
      if (dx > this.width * 0.5) dx -= this.width;
      else if (dx < -this.width * 0.5) dx += this.width;
      if (dy > this.height * 0.5) dy -= this.height;
      else if (dy < -this.height * 0.5) dy += this.height;

      const dist = Math.hypot(dx, dy);
      if (dist > 1 && dist < radius) {
        const falloff = 1 - dist / radius;
        if (mode === 'attract') {
          this.vx[i] += (dx / dist) * falloff * 1.45;
          this.vy[i] += (dy / dist) * falloff * 1.45;
        } else if (mode === 'repel') {
          this.vx[i] -= (dx / dist) * falloff * 2.2;
          this.vy[i] -= (dy / dist) * falloff * 2.2;
        } else if (mode === 'vortex') {
          this.vx[i] += (-dy / dist) * falloff * 1.85 + (dx / dist) * falloff * 0.35;
          this.vy[i] += (dx / dist) * falloff * 1.85 + (dy / dist) * falloff * 0.35;
        }
      }
    }
  }

  public computeForceFactor(normDist: number, attraction: number): number {
    if (normDist < this.beta) {
      return normDist / this.beta - 1;
    }
    if (normDist < 1) {
      return attraction * (1 - Math.abs(2 * normDist - 1 - this.beta) / (1 - this.beta));
    }
    return 0;
  }

  public step(
    dtScale = 1,
    onBioChime?: (degree: number, velocity: number, pan: number) => void
  ): number {
    const w = this.width;
    const h = this.height;
    const halfW = w * 0.5;
    const halfH = h * 0.5;
    const rMax = this.rMax;
    const rMaxSq = rMax * rMax;

    this.cols = Math.max(3, Math.floor(w / rMax));
    this.rows = Math.max(3, Math.floor(h / rMax));
    const totalCells = this.cols * this.rows;
    if (this.head.length < totalCells) {
      this.head = new Int32Array(totalCells * 2);
    }
    this.head.fill(-1, 0, totalCells);

    const cellW = w / this.cols;
    const cellH = h / this.rows;

    for (let i = 0; i < this.count; i++) {
      const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(this.px[i] / cellW)));
      const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(this.py[i] / cellH)));
      const cIdx = cy * this.cols + cx;
      this.next[i] = this.head[cIdx];
      this.head[cIdx] = i;
    }

    let totalKinetic = 0;
    let fastestIdx = 0;
    let maxSpeedSq = 0;

    const beta = this.beta;
    const invOneMinusBeta = 1 / (1 - beta);
    const strength = this.forceScale * 0.85 * dtScale;

    for (let i = 0; i < this.count; i++) {
      const ix = this.px[i];
      const iy = this.py[i];
      const spI = this.species[i];
      const rowMat = this.matrix[spI];

      const baseCx = Math.floor(ix / cellW);
      const baseCy = Math.floor(iy / cellH);

      let fx = 0;
      let fy = 0;

      for (let oy = -1; oy <= 1; oy++) {
        const ny = ((baseCy + oy) % this.rows + this.rows) % this.rows;
        const rowOffset = ny * this.cols;
        for (let ox = -1; ox <= 1; ox++) {
          const nx = ((baseCx + ox) % this.cols + this.cols) % this.cols;
          let j = this.head[rowOffset + nx];
          while (j !== -1) {
            if (j !== i) {
              let dx = this.px[j] - ix;
              let dy = this.py[j] - iy;
              if (dx > halfW) dx -= w;
              else if (dx < -halfW) dx += w;
              if (dy > halfH) dy -= h;
              else if (dy < -halfH) dy += h;

              const d2 = dx * dx + dy * dy;
              if (d2 > 0.0001 && d2 < rMaxSq) {
                const dist = Math.sqrt(d2);
                const nd = dist / rMax;
                let f: number;
                if (nd < beta) {
                  f = nd / beta - 1;
                } else {
                  f = rowMat[this.species[j]] * (1 - Math.abs(2 * nd - 1 - beta) * invOneMinusBeta);
                }
                const scale = (f / dist) * strength;
                fx += dx * scale;
                fy += dy * scale;
              }
            }
            j = this.next[j];
          }
        }
      }

      const nvx = (this.vx[i] + fx) * this.friction;
      const nvy = (this.vy[i] + fy) * this.friction;
      this.vx[i] = nvx;
      this.vy[i] = nvy;

      const spSq = nvx * nvx + nvy * nvy;
      totalKinetic += spSq;
      if (spSq > maxSpeedSq) {
        maxSpeedSq = spSq;
        fastestIdx = i;
      }
    }

    for (let i = 0; i < this.count; i++) {
      let x = this.px[i] + this.vx[i] * dtScale;
      let y = this.py[i] + this.vy[i] * dtScale;
      if (x < 0) x += w;
      else if (x >= w) x -= w;
      if (y < 0) y += h;
      else if (y >= h) y -= h;
      this.px[i] = x;
      this.py[i] = y;
    }

    // Subtle generative bio-luminescent chime driven by active colonies
    this.soundCooldown -= dtScale;
    if (onBioChime && this.soundCooldown <= 0 && maxSpeedSq > 1.2) {
      const sp = this.species[fastestIdx];
      const pan = (this.px[fastestIdx] / w) * 2 - 1;
      onBioChime(sp * 2 + (Math.random() < 0.35 ? 7 : 0), Math.min(0.32, Math.sqrt(maxSpeedSq) * 0.07), pan);
      this.soundCooldown = 14 + Math.random() * 18;
    }

    return totalKinetic * 0.5;
  }

  public serialize(): Record<string, unknown> {
    return {
      matrix: this.matrix.map((row) => [...row]),
      rMax: this.rMax,
      forceScale: this.forceScale,
      friction: this.friction,
    };
  }

  public deserialize(data: Record<string, unknown>): void {
    if (Array.isArray(data.matrix) && data.matrix.length === SPECIES_COUNT) {
      this.matrix = (data.matrix as number[][]).map((r) => r.slice(0, SPECIES_COUNT));
      if (typeof data.rMax === 'number') this.rMax = data.rMax;
      if (typeof data.forceScale === 'number') this.forceScale = data.forceScale;
      this.seedPositions(false);
    } else if (typeof data.presetId === 'string') {
      this.loadPreset(data.presetId);
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Silky dark-field motion persistence fade
    ctx.fillStyle = 'rgba(4, 6, 10, 0.34)';
    ctx.fillRect(0, 0, width, height);

    // Subtle microscopy reticle rings in center
    ctx.save();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.045)';
    ctx.lineWidth = 1;
    const cx = width * 0.5;
    const cy = height * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) * 0.38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Optional synaptic membrane filaments between nearby bonded particles
    if (this.showBonds) {
      ctx.lineWidth = 0.85;
      const bondDistSq = 34 * 34;
      const cellW = this.width / this.cols;
      const cellH = this.height / this.rows;

      for (let i = 0; i < this.count; i += 2) {
        const ix = this.px[i];
        const iy = this.py[i];
        const cxIdx = Math.min(this.cols - 1, Math.max(0, Math.floor(ix / cellW)));
        const cyIdx = Math.min(this.rows - 1, Math.max(0, Math.floor(iy / cellH)));
        const spI = this.species[i];

        let j = this.head[cyIdx * this.cols + cxIdx];
        let links = 0;
        while (j !== -1 && links < 3) {
          if (j > i) {
            const dx = this.px[j] - ix;
            const dy = this.py[j] - iy;
            const d2 = dx * dx + dy * dy;
            if (d2 < bondDistSq && this.matrix[spI][this.species[j]] > 0.35) {
              ctx.strokeStyle = SPECIES_COLORS[spI];
              ctx.globalAlpha = (1 - d2 / bondDistSq) * 0.24;
              ctx.beginPath();
              ctx.moveTo(ix, iy);
              ctx.lineTo(this.px[j], this.py[j]);
              ctx.stroke();
              links++;
            }
          }
          j = this.next[j];
        }
      }
      ctx.globalAlpha = 1;
    }

    // Batch render organisms per species color (only 6 draw calls total for 1,000+ organisms!)
    for (let sp = 0; sp < SPECIES_COUNT; sp++) {
      ctx.fillStyle = SPECIES_COLORS[sp];

      // Outer bioluminescent membrane halo batch
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      for (let i = 0; i < this.count; i++) {
        if (this.species[i] !== sp) continue;
        const x = this.px[i];
        const y = this.py[i];
        ctx.moveTo(x + 6.2, y);
        ctx.arc(x, y, 6.2, 0, Math.PI * 2);
      }
      ctx.fill();

      // Crisp cellular nucleus batch
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      for (let i = 0; i < this.count; i++) {
        if (this.species[i] !== sp) continue;
        const x = this.px[i];
        const y = this.py[i];
        ctx.moveTo(x + 2.5, y);
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

import type { PresetDefinition } from '../types/universe';

export type CelestialKind = 'star' | 'planet' | 'blackhole';

export interface CelestialBody {
  id: number;
  kind: CelestialKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  mass: number;
  radius: number;
  color: string;
  glow: string;
  hasRing?: boolean;
  trail: Array<{ x: number; y: number }>;
  prevPrimaryAngle: number | null;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export interface ResonanceWave {
  x: number;
  y: number;
  starX: number;
  starY: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number; // 1 -> 0
}

export interface GravityAudioCallbacks {
  onMeridianCross?: (degree: number, velocity: number, pan: number) => void;
  onCollision?: (intensity: number, pan: number) => void;
}

export const GRAVITY_PRESETS: PresetDefinition[] = [
  {
    id: 'harmonic-solar',
    label: 'Système Harmonique de Kepler',
    subtitle: 'Étoile dorée, 6 mondes en résonance et ceinture d’astéroïdes',
  },
  {
    id: 'binary-waltz',
    label: 'Valse Stellaire Binaire',
    subtitle: 'Deux soleils jumeaux et mondes circumbinaires stables',
  },
  {
    id: 'gargantua',
    label: 'Singularité Gargantua',
    subtitle: 'Trou noir supermassif, lentille photonique et disque d’accrétion',
  },
  {
    id: 'galaxy-collision',
    label: 'Collision de Galaxies',
    subtitle: 'Deux spirales stellaires en fusion gravitationnelle',
  },
];

const PLANET_PALETTE = [
  { color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.45)' },
  { color: '#2DD4BF', glow: 'rgba(45, 212, 191, 0.45)' },
  { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.45)' },
  { color: '#FB7185', glow: 'rgba(251, 113, 133, 0.45)' },
  { color: '#A78BFA', glow: 'rgba(167, 139, 250, 0.45)' },
  { color: '#E2E8F0', glow: 'rgba(226, 232, 240, 0.45)' },
];

export class GravityEngine {
  public bodies: CelestialBody[] = [];
  public dust: DustParticle[] = [];
  public waves: ResonanceWave[] = [];
  public starsBg: Array<{ x: number; y: number; s: number; a: number }> = [];

  public G = 1200;
  public trailLength = 85;
  public showSpacetimeGrid = true;
  public showMeridianHarp = true;
  public resonanceCount = 0;

  private softeningSq = 144; // 12^2
  private nextId = 1;
  private width = 1280;
  private height = 800;

  constructor(width = 1280, height = 800) {
    this.width = width;
    this.height = height;
    this.generateStarfield();
    this.loadPreset('harmonic-solar');
  }

  public resize(width: number, height: number): void {
    this.width = Math.max(320, width);
    this.height = Math.max(240, height);
    if (this.starsBg.length === 0) {
      this.generateStarfield();
    }
  }

  private generateStarfield(): void {
    this.starsBg = [];
    for (let i = 0; i < 220; i++) {
      this.starsBg.push({
        x: (Math.random() - 0.5) * 3400,
        y: (Math.random() - 0.5) * 2600,
        s: Math.random() < 0.85 ? 0.9 : 1.7,
        a: 0.14 + Math.random() * 0.52,
      });
    }
  }

  public loadPreset(presetId: string): void {
    this.bodies = [];
    this.dust = [];
    this.waves = [];
    this.resonanceCount = 0;

    if (presetId === 'binary-waltz') {
      const sep = 92;
      const starMass = 1450;
      // Exact mutual circular orbit speed around barycenter: v = sqrt(G * M / (4 * sep))
      const vOrb = Math.sqrt((this.G * starMass) / (4 * sep));
      this.spawnBody('star', -sep, 0, 0, -vOrb, starMass, '#FBBF24', 'rgba(251, 191, 36, 0.55)');
      this.spawnBody('star', sep, 0, 0, vOrb, starMass, '#38BDF8', 'rgba(56, 189, 248, 0.55)');

      const totalM = starMass * 2;
      const radii = [235, 305, 385, 465];
      radii.forEach((r, idx) => {
        const ang = (idx * Math.PI) / 2 + 0.35;
        const speed = Math.sqrt((this.G * totalM) / r);
        const pal = PLANET_PALETTE[idx % PLANET_PALETTE.length];
        const b = this.spawnBody(
          'planet',
          Math.cos(ang) * r,
          Math.sin(ang) * r,
          -Math.sin(ang) * speed,
          Math.cos(ang) * speed,
          10 + idx * 5,
          pal.color,
          pal.glow
        );
        b.hasRing = idx === 2;
      });

      this.spawnDustRing(0, 0, 0, 0, totalM, 520, 565, 190, '#5EEAD4');
    } else if (presetId === 'gargantua') {
      const bhMass = 4200;
      this.spawnBody('blackhole', 0, 0, 0, 0, bhMass, '#020409', 'rgba(245, 158, 11, 0.72)');
      // Accretion disk inner & outer streams
      this.spawnDustRing(0, 0, 0, 0, bhMass, 92, 235, 320, '#F59E0B');
      this.spawnDustRing(0, 0, 0, 0, bhMass, 250, 340, 110, '#38BDF8');

      const planetsR = [285, 375, 455];
      planetsR.forEach((r, idx) => {
        const ang = idx * 2.1 + 0.4;
        const v = Math.sqrt((this.G * bhMass) / r) * (idx === 1 ? 0.92 : 1.0);
        const pal = PLANET_PALETTE[(idx + 1) % PLANET_PALETTE.length];
        const p = this.spawnBody(
          'planet',
          Math.cos(ang) * r,
          Math.sin(ang) * r,
          -Math.sin(ang) * v,
          Math.cos(ang) * v,
          14 + idx * 6,
          pal.color,
          pal.glow
        );
        p.hasRing = idx === 2;
      });
    } else if (presetId === 'galaxy-collision') {
      const m1 = 2100;
      const m2 = 1750;
      this.spawnBody('blackhole', -230, -85, 26, 18, m1, '#05070B', 'rgba(45, 212, 191, 0.7)');
      this.spawnBody('star', 230, 85, -31, -21, m2, '#F59E0B', 'rgba(245, 158, 11, 0.65)');
      this.spawnDustRing(-230, -85, 26, 18, m1, 58, 175, 210, '#2DD4BF');
      this.spawnDustRing(230, 85, -31, -21, m2, 55, 165, 200, '#FBBF24');

      for (let i = 0; i < 6; i++) {
        const r = 85 + i * 22;
        const a = i * 1.15;
        const v = Math.sqrt((this.G * m1) / r);
        const pal = PLANET_PALETTE[i % PLANET_PALETTE.length];
        this.spawnBody(
          'planet',
          -230 + Math.cos(a) * r,
          -85 + Math.sin(a) * r,
          26 - Math.sin(a) * v,
          18 + Math.cos(a) * v,
          8,
          pal.color,
          pal.glow
        );
      }
    } else {
      // Default: Harmonic Kepler Solar System
      const sunMass = 2600;
      this.spawnBody('star', 0, 0, 0, 0, sunMass, '#FBBF24', 'rgba(251, 191, 36, 0.62)');

      const orbitalRadii = [92, 138, 192, 258, 355, 440];
      const masses = [5, 9, 12, 8, 28, 19];

      orbitalRadii.forEach((r, i) => {
        const angle = -0.35 - i * 0.72; // Staggered so notes chime sequentially right away!
        const speed = Math.sqrt((this.G * sunMass) / r);
        const pal = PLANET_PALETTE[i % PLANET_PALETTE.length];
        const planet = this.spawnBody(
          'planet',
          Math.cos(angle) * r,
          Math.sin(angle) * r,
          -Math.sin(angle) * speed,
          Math.cos(angle) * speed,
          masses[i],
          pal.color,
          pal.glow
        );
        if (i === 4) {
          planet.hasRing = true;
          // Add a moon orbiting the gas giant!
          const moonR = 26;
          const moonSpeed = Math.sqrt((this.G * planet.mass) / moonR) * 1.02;
          this.spawnBody(
            'planet',
            planet.x + moonR,
            planet.y,
            planet.vx,
            planet.vy + moonSpeed,
            0.8,
            '#F8FAFC',
            'rgba(248, 250, 252, 0.5)'
          );
        }
      });

      // Asteroid belt between Mars & Gas Giant
      this.spawnDustRing(0, 0, 0, 0, sunMass, 292, 318, 220, '#94A3B8');
    }

    this.computeAccelerations();
  }

  public spawnBody(
    kind: CelestialKind,
    x: number,
    y: number,
    vx: number,
    vy: number,
    mass?: number,
    color?: string,
    glow?: string
  ): CelestialBody {
    const pal = PLANET_PALETTE[this.nextId % PLANET_PALETTE.length];
    const resolvedMass =
      mass ??
      (kind === 'blackhole' ? 3800 : kind === 'star' ? 2200 : 8 + (this.nextId % 5) * 4);
    const radius =
      kind === 'blackhole'
        ? Math.max(13, Math.cbrt(resolvedMass) * 1.05)
        : kind === 'star'
          ? Math.max(15, Math.cbrt(resolvedMass) * 1.38)
          : Math.max(3.2, Math.cbrt(resolvedMass) * 2.35);

    const body: CelestialBody = {
      id: this.nextId++,
      kind,
      x,
      y,
      vx,
      vy,
      ax: 0,
      ay: 0,
      mass: resolvedMass,
      radius,
      color:
        color ??
        (kind === 'blackhole' ? '#04060A' : kind === 'star' ? '#FBBF24' : pal.color),
      glow:
        glow ??
        (kind === 'blackhole'
          ? 'rgba(245, 158, 11, 0.72)'
          : kind === 'star'
            ? 'rgba(251, 191, 36, 0.6)'
            : pal.glow),
      hasRing: kind === 'planet' && resolvedMass >= 22,
      trail: [],
      prevPrimaryAngle: null,
    };

    this.bodies.push(body);
    this.computeAccelerations();
    return body;
  }

  public spawnDustRing(
    cx: number,
    cy: number,
    cvx: number,
    cvy: number,
    centralMass: number,
    innerR: number,
    outerR: number,
    count = 160,
    tint = '#2DD4BF'
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.dust.length >= 650) {
        this.dust.shift();
      }
      const r = innerR + Math.random() * (outerR - innerR);
      const ang = Math.random() * Math.PI * 2;
      const speed = Math.sqrt((this.G * centralMass) / Math.max(18, r)) * (0.97 + Math.random() * 0.06);
      this.dust.push({
        x: cx + Math.cos(ang) * r,
        y: cy + Math.sin(ang) * r,
        vx: cvx - Math.sin(ang) * speed,
        vy: cvy + Math.cos(ang) * speed,
        color: tint,
        size: 1.0 + Math.random() * 1.3,
        alpha: 0.35 + Math.random() * 0.5,
      });
    }
  }

  public spawnNebulaBurst(x: number, y: number): void {
    const primary = this.findDominantPrimary(x, y);
    if (primary) {
      const dx = x - primary.x;
      const dy = y - primary.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 35) {
        const baseSpeed = Math.sqrt((this.G * primary.mass) / dist);
        const tx = -dy / dist;
        const ty = dx / dist;
        for (let i = 0; i < 95; i++) {
          if (this.dust.length >= 650) this.dust.shift();
          const ox = (Math.random() - 0.5) * 44;
          const oy = (Math.random() - 0.5) * 44;
          const jitter = 0.92 + Math.random() * 0.16;
          this.dust.push({
            x: x + ox,
            y: y + oy,
            vx: primary.vx + tx * baseSpeed * jitter,
            vy: primary.vy + ty * baseSpeed * jitter,
            color: i % 2 === 0 ? '#2DD4BF' : '#38BDF8',
            size: 1.1 + Math.random() * 1.4,
            alpha: 0.45 + Math.random() * 0.45,
          });
        }
        return;
      }
    }
    this.spawnDustRing(x, y, 0, 0, 900, 22, 78, 95, '#38BDF8');
  }

  public applyRepulsorPulse(wx: number, wy: number, strength = 1): void {
    for (const b of this.bodies) {
      if (b.kind === 'blackhole') continue;
      const dx = b.x - wx;
      const dy = b.y - wy;
      const d = Math.hypot(dx, dy) + 18;
      if (d < 260) {
        const force = (strength * 420) / (d * 0.12 + 1);
        b.vx += (dx / d) * force * 0.016;
        b.vy += (dy / d) * force * 0.016;
      }
    }
    for (const p of this.dust) {
      const dx = p.x - wx;
      const dy = p.y - wy;
      const d = Math.hypot(dx, dy) + 14;
      if (d < 240) {
        const force = (strength * 520) / (d * 0.1 + 1);
        p.vx += (dx / d) * force * 0.016;
        p.vy += (dy / d) * force * 0.016;
      }
    }
  }

  public findDominantPrimary(x: number, y: number): CelestialBody | null {
    let best: CelestialBody | null = null;
    let bestPull = 0;
    for (const b of this.bodies) {
      if (b.mass < 120) continue;
      const d2 = (b.x - x) ** 2 + (b.y - y) ** 2 + this.softeningSq;
      const pull = b.mass / d2;
      if (pull > bestPull) {
        bestPull = pull;
        best = b;
      }
    }
    return best;
  }

  public computeAutoOrbitVelocity(x: number, y: number): { vx: number; vy: number } {
    const primary = this.findDominantPrimary(x, y);
    if (!primary) return { vx: 0, vy: 0 };
    const dx = x - primary.x;
    const dy = y - primary.y;
    const r = Math.hypot(dx, dy);
    if (r < primary.radius + 8) return { vx: primary.vx, vy: primary.vy };

    const speed = Math.sqrt((this.G * primary.mass * r * r) / Math.pow(r * r + this.softeningSq, 0.75) / r);
    const safeSpeed = Number.isFinite(speed) ? speed : Math.sqrt((this.G * primary.mass) / r);
    return {
      vx: primary.vx - (dy / r) * safeSpeed,
      vy: primary.vy + (dx / r) * safeSpeed,
    };
  }

  public predictTrajectory(
    startX: number,
    startY: number,
    vx0: number,
    vy0: number,
    steps = 150,
    dt = 0.022
  ): { points: Array<{ x: number; y: number }>; collided: boolean } {
    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    let px = startX;
    let py = startY;
    let vx = vx0;
    let vy = vy0;
    let collided = false;

    const accelAt = (tx: number, ty: number) => {
      let ax = 0;
      let ay = 0;
      for (const b of this.bodies) {
        const dx = b.x - tx;
        const dy = b.y - ty;
        const r2 = dx * dx + dy * dy + this.softeningSq;
        const invR3 = 1 / (r2 * Math.sqrt(r2));
        const s = this.G * b.mass * invR3;
        ax += dx * s;
        ay += dy * s;
      }
      return { ax, ay };
    };

    let a = accelAt(px, py);
    for (let i = 0; i < steps; i++) {
      const hvx = vx + 0.5 * a.ax * dt;
      const hvy = vy + 0.5 * a.ay * dt;
      px += hvx * dt;
      py += hvy * dt;
      const nextA = accelAt(px, py);
      vx = hvx + 0.5 * nextA.ax * dt;
      vy = hvy + 0.5 * nextA.ay * dt;
      a = nextA;

      if (i % 2 === 0) {
        points.push({ x: px, y: py });
      }

      for (const b of this.bodies) {
        const dist = Math.hypot(b.x - px, b.y - py);
        if (dist < b.radius + 4) {
          collided = true;
          points.push({ x: px, y: py });
          return { points, collided };
        }
      }
    }

    return { points, collided };
  }

  public computeAccelerations(): void {
    const n = this.bodies.length;
    for (let i = 0; i < n; i++) {
      this.bodies[i].ax = 0;
      this.bodies[i].ay = 0;
    }

    for (let i = 0; i < n; i++) {
      const bi = this.bodies[i];
      for (let j = i + 1; j < n; j++) {
        const bj = this.bodies[j];
        const dx = bj.x - bi.x;
        const dy = bj.y - bi.y;
        const r2 = dx * dx + dy * dy + this.softeningSq;
        const invR3 = 1 / (r2 * Math.sqrt(r2));
        const f = this.G * invR3;

        bi.ax += dx * f * bj.mass;
        bi.ay += dy * f * bj.mass;
        bj.ax -= dx * f * bi.mass;
        bj.ay -= dy * f * bi.mass;
      }
    }
  }

  public step(dt: number, substeps = 3, audio?: GravityAudioCallbacks): void {
    const h = dt / substeps;

    for (let s = 0; s < substeps; s++) {
      // 1. Symplectic Velocity Verlet for heavy bodies
      for (const b of this.bodies) {
        b.vx += 0.5 * b.ax * h;
        b.vy += 0.5 * b.ay * h;
        b.x += b.vx * h;
        b.y += b.vy * h;
      }

      this.computeAccelerations();

      for (const b of this.bodies) {
        b.vx += 0.5 * b.ax * h;
        b.vy += 0.5 * b.ay * h;
      }

      // 2. Collisions & momentum-conserving mergers
      for (let i = this.bodies.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
          const a = this.bodies[j];
          const b = this.bodies[i];
          if (!a || !b) continue;
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist < (a.radius + b.radius) * 0.78) {
            const survivor = a.mass >= b.mass ? a : b;
            const absorbed = survivor === a ? b : a;
            const totalMass = survivor.mass + absorbed.mass;

            survivor.vx = (survivor.vx * survivor.mass + absorbed.vx * absorbed.mass) / totalMass;
            survivor.vy = (survivor.vy * survivor.mass + absorbed.vy * absorbed.mass) / totalMass;
            survivor.x = (survivor.x * survivor.mass + absorbed.x * absorbed.mass) / totalMass;
            survivor.y = (survivor.y * survivor.mass + absorbed.y * absorbed.mass) / totalMass;
            survivor.mass = totalMass;

            if (survivor.kind === 'planet' && survivor.mass > 1800) {
              survivor.kind = 'star';
              survivor.color = '#FBBF24';
              survivor.glow = 'rgba(251, 191, 36, 0.6)';
            }
            survivor.radius =
              survivor.kind === 'blackhole'
                ? Math.max(13, Math.cbrt(survivor.mass) * 1.05)
                : survivor.kind === 'star'
                  ? Math.max(15, Math.cbrt(survivor.mass) * 1.38)
                  : Math.max(3.2, Math.cbrt(survivor.mass) * 2.35);

            this.waves.push({
              x: survivor.x,
              y: survivor.y,
              starX: survivor.x,
              starY: survivor.y,
              radius: survivor.radius,
              maxRadius: Math.min(220, 48 + Math.cbrt(absorbed.mass) * 24),
              color: survivor.kind === 'blackhole' ? '#F59E0B' : '#FB7185',
              life: 1.0,
            });

            const pan = Math.max(-1, Math.min(1, survivor.x / (this.width * 0.45)));
            audio?.onCollision?.(Math.min(1, Math.cbrt(absorbed.mass) / 8), pan);

            const removeIdx = this.bodies.indexOf(absorbed);
            if (removeIdx !== -1) {
              this.bodies.splice(removeIdx, 1);
            }
            break;
          }
        }
      }
    }

    // 3. Dust ring particles against heavy bodies
    const heavy = this.bodies.filter((b) => b.mass >= 25);
    for (let i = this.dust.length - 1; i >= 0; i--) {
      const p = this.dust[i];
      let ax = 0;
      let ay = 0;
      let swallowed = false;

      for (let j = 0; j < heavy.length; j++) {
        const b = heavy[j];
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const r2 = dx * dx + dy * dy + 64;
        if (r2 < b.radius * b.radius * 0.85) {
          swallowed = true;
          break;
        }
        const invR3 = 1 / (r2 * Math.sqrt(r2));
        const f = this.G * b.mass * invR3;
        ax += dx * f;
        ay += dy * f;
      }

      if (swallowed || Math.abs(p.x) > 4500 || Math.abs(p.y) > 4500) {
        this.dust.splice(i, 1);
        continue;
      }

      p.vx += ax * dt;
      p.vy += ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // 4. Trails & Kepler Meridian Harp crossings
    for (const b of this.bodies) {
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > this.trailLength) {
        b.trail.shift();
      }

      if (b.kind === 'planet') {
        const primary = this.findDominantPrimary(b.x, b.y);
        if (primary) {
          const dx = b.x - primary.x;
          const dy = b.y - primary.y;
          const r = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);

          if (
            b.prevPrimaryAngle !== null &&
            r < 680 &&
            ((b.prevPrimaryAngle < 0 && ang >= 0 && Math.abs(ang - b.prevPrimaryAngle) < 1.2) ||
              (b.prevPrimaryAngle > 0 && ang <= 0 && Math.abs(ang - b.prevPrimaryAngle) < 1.2))
          ) {
            // Map radius inversely to musical degree (inner = high sparkling, outer = deep bass)
            const norm = Math.max(0, Math.min(1, (r - 65) / 440));
            const degree = Math.round((1 - norm) * 14);
            const pan = Math.max(-1, Math.min(1, b.x / (this.width * 0.45)));
            audio?.onMeridianCross?.(degree, 0.36 + (1 - norm) * 0.2, pan);
            this.resonanceCount++;

            if (this.showMeridianHarp) {
              this.waves.push({
                x: b.x,
                y: b.y,
                starX: primary.x,
                starY: primary.y,
                radius: b.radius * 1.4,
                maxRadius: 46,
                color: b.color,
                life: 1.0,
              });
            }
          }
          b.prevPrimaryAngle = ang;
        }
      }
    }

    // 5. Evolve shockwaves & resonance chords
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life -= dt * 1.45;
      w.radius += (w.maxRadius - w.radius) * Math.min(1, dt * 6);
      if (w.life <= 0) {
        this.waves.splice(i, 1);
      }
    }
  }

  public computeTotalEnergy(): number {
    let kinetic = 0;
    let potential = 0;
    const n = this.bodies.length;
    for (let i = 0; i < n; i++) {
      const bi = this.bodies[i];
      kinetic += 0.5 * bi.mass * (bi.vx * bi.vx + bi.vy * bi.vy);
      for (let j = i + 1; j < n; j++) {
        const bj = this.bodies[j];
        const dx = bj.x - bi.x;
        const dy = bj.y - bi.y;
        const dist = Math.sqrt(dx * dx + dy * dy + this.softeningSq);
        potential -= (this.G * bi.mass * bj.mass) / dist;
      }
    }
    return kinetic + potential;
  }

  public computeKineticEnergy(): number {
    let kinetic = 0;
    for (const b of this.bodies) {
      kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
    }
    return kinetic;
  }

  public serialize(): Record<string, unknown> {
    return {
      G: this.G,
      bodies: this.bodies.map((b) => ({
        kind: b.kind,
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        mass: b.mass,
        color: b.color,
        glow: b.glow,
        hasRing: b.hasRing,
      })),
    };
  }

  public deserialize(data: Record<string, unknown>): void {
    if (Array.isArray(data.bodies) && data.bodies.length > 0) {
      this.bodies = [];
      this.dust = [];
      this.waves = [];
      if (typeof data.G === 'number') this.G = data.G;
      for (const raw of data.bodies) {
        const item = raw as Partial<CelestialBody>;
        const created = this.spawnBody(
          item.kind ?? 'planet',
          Number(item.x ?? 0),
          Number(item.y ?? 0),
          Number(item.vx ?? 0),
          Number(item.vy ?? 0),
          Number(item.mass ?? 12),
          item.color,
          item.glow
        );
        created.hasRing = Boolean(item.hasRing);
      }
      this.computeAccelerations();
    } else if (typeof data.presetId === 'string') {
      this.loadPreset(data.presetId);
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: { x: number; y: number; zoom: number },
    time: number,
    slingshot?: {
      startX: number;
      startY: number;
      vx: number;
      vy: number;
      kind: CelestialKind;
    } | null
  ): void {
    ctx.fillStyle = '#04060A';
    ctx.fillRect(0, 0, width, height);

    // Subtle deep-space radial nebula glow
    const bgGrad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      10,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.72
    );
    bgGrad.addColorStop(0, 'rgba(15, 29, 48, 0.34)');
    bgGrad.addColorStop(0.55, 'rgba(8, 13, 24, 0.18)');
    bgGrad.addColorStop(1, 'rgba(4, 6, 10, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);

    // Parallax starfield
    ctx.save();
    ctx.scale(camera.zoom * 0.35 + 0.65, camera.zoom * 0.35 + 0.65);
    ctx.translate(-camera.x * 0.18, -camera.y * 0.18);
    for (const s of this.starsBg) {
      ctx.fillStyle = `rgba(226, 232, 240, ${s.a})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.restore();

    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Relativistic warped spacetime fabric grid
    if (this.showSpacetimeGrid) {
      this.renderWarpedGrid(ctx, width, height, camera);
    }

    // Kepler Meridian Harp axes around stars & black holes
    if (this.showMeridianHarp) {
      for (const b of this.bodies) {
        if (b.mass < 400) continue;
        const harpGrad = ctx.createLinearGradient(b.x - 520, b.y, b.x + 520, b.y);
        harpGrad.addColorStop(0, 'rgba(45, 212, 191, 0)');
        harpGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.22)');
        harpGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
        ctx.strokeStyle = harpGrad;
        ctx.lineWidth = 1 / camera.zoom;
        ctx.setLineDash([4 / camera.zoom, 6 / camera.zoom]);
        ctx.beginPath();
        ctx.moveTo(b.x - 520, b.y);
        ctx.lineTo(b.x + 520, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Proto-planetary & accretion dust particles
    for (const p of this.dust) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size * 1.4, p.size * 1.4);
    }
    ctx.globalAlpha = 1;

    // Orbital trails
    for (const b of this.bodies) {
      if (b.trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(b.trail[0].x, b.trail[0].y);
      for (let i = 1; i < b.trail.length; i++) {
        ctx.lineTo(b.trail[i].x, b.trail[i].y);
      }
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = Math.max(1.1 / camera.zoom, b.radius * 0.22);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Resonance chords & expanding ripples
    for (const w of this.waves) {
      if (w.starX !== w.x || w.starY !== w.y) {
        ctx.strokeStyle = w.color;
        ctx.globalAlpha = Math.max(0, w.life * 0.45);
        ctx.lineWidth = 1.4 / camera.zoom;
        ctx.beginPath();
        ctx.moveTo(w.starX, w.starY);
        ctx.lineTo(w.x, w.y);
        ctx.stroke();
      }
      ctx.strokeStyle = w.color;
      ctx.globalAlpha = Math.max(0, w.life * 0.72);
      ctx.lineWidth = 1.6 / camera.zoom;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Celestial bodies
    for (const b of this.bodies) {
      if (b.kind === 'blackhole') {
        // Gravitational lensing outer halo + swirling Doppler accretion disk
        const lensR = b.radius * 4.4;
        const grad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.92, b.x, b.y, lensR);
        grad.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
        grad.addColorStop(0.14, 'rgba(245, 158, 11, 0.72)');
        grad.addColorStop(0.42, 'rgba(225, 29, 72, 0.24)');
        grad.addColorStop(1, 'rgba(4, 6, 10, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, lensR, 0, Math.PI * 2);
        ctx.fill();

        // Tilted relativistic accretion ellipse
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(-0.32 + Math.sin(time * 0.3) * 0.04);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
        ctx.lineWidth = 2.4 / camera.zoom;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * 3.3, b.radius * 0.92, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Event horizon shadow + razor photon ring
        ctx.fillStyle = '#020307';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 1.5 / camera.zoom;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 1.04, 0, Math.PI * 2);
        ctx.stroke();
      } else if (b.kind === 'star') {
        const pulse = 1 + Math.sin(time * 2.4 + b.id) * 0.045;
        const coronaR = b.radius * 3.8 * pulse;
        const corona = ctx.createRadialGradient(b.x, b.y, b.radius * 0.4, b.x, b.y, coronaR);
        corona.addColorStop(0, '#FFFFFF');
        corona.addColorStop(0.22, b.color);
        corona.addColorStop(0.55, b.glow);
        corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = corona;
        ctx.beginPath();
        ctx.arc(b.x, b.y, coronaR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFBEB';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.92, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Planet atmospheric glow + optional Saturn ring
        const atm = ctx.createRadialGradient(b.x, b.y, b.radius * 0.5, b.x, b.y, b.radius * 2.5);
        atm.addColorStop(0, b.glow);
        atm.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = atm;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (b.hasRing) {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(-0.42);
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.52)';
          ctx.lineWidth = Math.max(1.8 / camera.zoom, b.radius * 0.28);
          ctx.beginPath();
          ctx.ellipse(0, 0, b.radius * 2.35, b.radius * 0.68, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Live orbital slingshot prediction overlay
    if (slingshot) {
      const pred = this.predictTrajectory(
        slingshot.startX,
        slingshot.startY,
        slingshot.vx,
        slingshot.vy,
        165,
        0.025
      );
      if (pred.points.length > 1) {
        ctx.strokeStyle = pred.collided ? '#FB7185' : '#2DD4BF';
        ctx.lineWidth = 1.7 / camera.zoom;
        ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
        ctx.beginPath();
        ctx.moveTo(pred.points[0].x, pred.points[0].y);
        for (let i = 1; i < pred.points.length; i++) {
          ctx.lineTo(pred.points[i].x, pred.points[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        const last = pred.points[pred.points.length - 1];
        ctx.fillStyle = pred.collided ? '#FB7185' : '#2DD4BF';
        ctx.beginPath();
        ctx.arc(last.x, last.y, 4 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ghost preview body at launch origin
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 1.4 / camera.zoom;
      ctx.beginPath();
      ctx.arc(slingshot.startX, slingshot.startY, 7 / camera.zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderWarpedGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: { x: number; y: number; zoom: number }
  ): void {
    const spacing = 64;
    const halfW = (width * 0.5) / camera.zoom + spacing * 2;
    const halfH = (height * 0.5) / camera.zoom + spacing * 2;

    const minX = Math.floor((camera.x - halfW) / spacing) * spacing;
    const maxX = Math.ceil((camera.x + halfW) / spacing) * spacing;
    const minY = Math.floor((camera.y - halfH) / spacing) * spacing;
    const maxY = Math.ceil((camera.y + halfH) / spacing) * spacing;

    const heavy = this.bodies.filter((b) => b.mass >= 250);

    const warpPoint = (gx: number, gy: number) => {
      let wx = gx;
      let wy = gy;
      for (let i = 0; i < heavy.length; i++) {
        const b = heavy[i];
        const dx = b.x - gx;
        const dy = b.y - gy;
        const d2 = dx * dx + dy * dy + 2200;
        const pull = Math.min(0.68, (b.mass * 1.15) / d2);
        wx += dx * pull;
        wy += dy * pull;
      }
      return { x: wx, y: wy };
    };

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.065)';
    ctx.lineWidth = 1 / camera.zoom;

    // Horizontal lines
    for (let y = minY; y <= maxY; y += spacing) {
      ctx.beginPath();
      let started = false;
      for (let x = minX; x <= maxX; x += spacing * 0.5) {
        const p = warpPoint(x, y);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }

    // Vertical lines
    for (let x = minX; x <= maxX; x += spacing) {
      ctx.beginPath();
      let started = false;
      for (let y = minY; y <= maxY; y += spacing * 0.5) {
        const p = warpPoint(x, y);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }
  }
}

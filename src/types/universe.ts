export type UniverseMode = 'gravity' | 'biogenesis' | 'cymatics' | 'polyrhythm';

export type MusicalScaleId = 'lydian' | 'pentatonic' | 'hirajoshi' | 'harmonicMinor' | 'fifths';

export type SynthTimbreId = 'celesta' | 'pad' | 'crystal';

export type GravityTool = 'planet' | 'star' | 'blackhole' | 'nebula' | 'repulsor';

export type BioTool = 'attract' | 'repel' | 'spawn' | 'vortex';

export type CymaticsTool = 'ripple' | 'emitter' | 'wall' | 'lens' | 'eraser';

export type PolyrhythmTool = 'toggleRing' | 'pluckRing' | 'phaseNudge';

export interface TelemetryData {
  fps: number;
  entityCount: number;
  secondaryCount: number;
  energy: number;
  resonanceEvents: number;
  simTime: number;
  zoom: number;
}

export interface PresetDefinition {
  id: string;
  label: string;
  subtitle: string;
}

export interface SavedUniverseRecord {
  id: string;
  name: string;
  mode: UniverseMode;
  scale: MusicalScaleId;
  createdAt: string;
  note?: string;
  payload: Record<string, unknown>;
}

import React from 'react';
import {
  Globe,
  Sun,
  CircleDot,
  Sparkles,
  Magnet,
  Wind,
  RefreshCw,
  PlusCircle,
  Droplets,
  Radio,
  BrickWall,
  Search,
  Eraser,
  Play,
  Pause,
  Camera,
  Bell,
  VolumeX,
} from 'lucide-react';
import type {
  BioTool,
  CymaticsTool,
  GravityTool,
  PolyrhythmTool,
  UniverseMode,
} from '../types/universe';

interface ToolDockProps {
  mode: UniverseMode;
  gravityTool: GravityTool;
  onSelectGravityTool: (t: GravityTool) => void;
  bioTool: BioTool;
  onSelectBioTool: (t: BioTool) => void;
  cymaticsTool: CymaticsTool;
  onSelectCymaticsTool: (t: CymaticsTool) => void;
  polyTool: PolyrhythmTool;
  onSelectPolyTool: (t: PolyrhythmTool) => void;

  paused: boolean;
  onTogglePause: () => void;
  timeScale: number;
  onChangeTimeScale: (s: number) => void;
  onCapturePng: () => void;
}

export const ToolDock: React.FC<ToolDockProps> = ({
  mode,
  gravityTool,
  onSelectGravityTool,
  bioTool,
  onSelectBioTool,
  cymaticsTool,
  onSelectCymaticsTool,
  polyTool,
  onSelectPolyTool,
  paused,
  onTogglePause,
  timeScale,
  onChangeTimeScale,
  onCapturePng,
}) => {
  return (
    <div className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-24px)] select-none">
      <div className="hud-panel flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 overflow-x-auto hud-scroll">
        {/* Contextual Brush Tools */}
        {mode === 'gravity' && (
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'planet', label: 'Planète', icon: Globe },
                { id: 'star', label: 'Étoile', icon: Sun },
                { id: 'blackhole', label: 'Trou Noir', icon: CircleDot },
                { id: 'nebula', label: 'Nébuleuse', icon: Sparkles },
                { id: 'repulsor', label: 'Antigrav', icon: Wind },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = gravityTool === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectGravityTool(item.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-teal-400/18 text-teal-200 border border-teal-400/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/6 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {mode === 'biogenesis' && (
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'attract', label: 'Puits Nutritif', icon: Magnet },
                { id: 'repel', label: 'Disperser', icon: Wind },
                { id: 'vortex', label: 'Tourbillon', icon: RefreshCw },
                { id: 'spawn', label: 'Ensemencer', icon: PlusCircle },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = bioTool === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectBioTool(item.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-teal-400/18 text-teal-200 border border-teal-400/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/6 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {mode === 'cymatics' && (
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'ripple', label: 'Impulsion', icon: Droplets },
                { id: 'emitter', label: 'Émetteur', icon: Radio },
                { id: 'wall', label: 'Paroi / Fente', icon: BrickWall },
                { id: 'lens', label: 'Lentille Verre', icon: Search },
                { id: 'eraser', label: 'Gomme', icon: Eraser },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = cymaticsTool === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectCymaticsTool(item.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-teal-400/18 text-teal-200 border border-teal-400/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/6 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {mode === 'polyrhythm' && (
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'pluckRing', label: 'Pincer l’Anneau', icon: Bell },
                { id: 'toggleRing', label: 'Activer / Muet', icon: VolumeX },
                { id: 'phaseNudge', label: 'Déphaser +30°', icon: RefreshCw },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = polyTool === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPolyTool(item.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-teal-400/18 text-teal-200 border border-teal-400/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/6 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="h-5 w-px bg-white/12 mx-1 shrink-0" />

        {/* Time Control Cluster */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onTogglePause}
            className={`rounded-xl p-1.5 transition cursor-pointer ${
              paused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'text-slate-200 hover:bg-white/8'
            }`}
            title="Pause / Lecture [Espace]"
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {[0.35, 1, 2.4].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeTimeScale(spd)}
              className={`rounded-lg px-2 py-1 font-mono-tech text-[10px] transition cursor-pointer ${
                Math.abs(timeScale - spd) < 0.05
                  ? 'bg-white/14 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/12 mx-0.5 shrink-0" />

        {/* Snapshot Export */}
        <button
          onClick={onCapturePng}
          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/8 transition cursor-pointer shrink-0"
          title="Télécharger une capture haute définition PNG"
        >
          <Camera className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden md:inline">Capturer</span>
        </button>
      </div>
    </div>
  );
};

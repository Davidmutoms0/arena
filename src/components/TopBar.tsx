import React from 'react';
import {
  Orbit,
  Dna,
  Waves,
  Disc3,
  Volume2,
  VolumeX,
  Sparkles,
  SlidersHorizontal,
  HelpCircle,
  EyeOff,
} from 'lucide-react';
import type { UniverseMode } from '../types/universe';

interface TopBarProps {
  mode: UniverseMode;
  onSelectMode: (mode: UniverseMode) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  spectrum: number[];
  autoPilot: boolean;
  onToggleAutoPilot: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onOpenManifesto: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
}

const MODE_ITEMS: Array<{
  id: UniverseMode;
  num: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'gravity', num: '01', label: 'GRAVITÉ', icon: Orbit },
  { id: 'biogenesis', num: '02', label: 'BIO-GENÈSE', icon: Dna },
  { id: 'cymatics', num: '03', label: 'CYMATIQUE', icon: Waves },
  { id: 'polyrhythm', num: '04', label: 'POLYRHYTHMIE', icon: Disc3 },
];

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  onSelectMode,
  audioEnabled,
  onToggleAudio,
  spectrum,
  autoPilot,
  onToggleAutoPilot,
  inspectorOpen,
  onToggleInspector,
  onOpenManifesto,
  zenMode,
  onToggleZen,
}) => {
  if (zenMode) {
    return (
      <div className="fixed top-3 right-3 z-40">
        <button
          onClick={onToggleZen}
          className="hud-panel flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
          title="Afficher l’interface (Touche H)"
        >
          <EyeOff className="w-3.5 h-3.5 text-teal-400" />
          <span>Quitter Mode Zen [H]</span>
        </button>
      </div>
    );
  }

  return (
    <header className="fixed top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none select-none">
      {/* Brand Module */}
      <div className="hud-panel pointer-events-auto flex items-center gap-2.5 rounded-xl px-3.5 py-2">
        <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/15 border border-teal-400/30">
          <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
        </div>
        <div className="leading-none hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-[0.2em] text-slate-100">ASTRALYS</span>
            <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono-tech text-[9px] text-teal-300">
              v1.0
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-400 tracking-wide hidden xl:block">
            Atelier Démiurgique &amp; Synthèse Stellaire
          </p>
        </div>
        <button
          onClick={onOpenManifesto}
          className="ml-0.5 rounded-lg p-1 text-slate-400 hover:bg-white/8 hover:text-teal-300 transition cursor-pointer"
          title="Manifeste & Raccourcis"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Central 4-Engine Switcher */}
      <nav
        aria-label="Moteurs de simulation"
        className="hud-panel pointer-events-auto flex items-center gap-1 rounded-xl p-1 overflow-x-auto max-w-full"
      >
        {MODE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectMode(item.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-teal-400/16 text-teal-200 border border-teal-400/40 shadow-[0_0_20px_-6px_rgba(45,212,191,0.5)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="font-mono-tech text-[10px] opacity-65 hidden md:inline">
                {item.num}
              </span>
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-300' : 'text-slate-400'}`} />
              <span className="tracking-wider text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Audio + Autopilot + Inspector Controls */}
      <div className="hud-panel pointer-events-auto flex items-center gap-1.5 rounded-xl px-2.5 py-1.5">
        {/* Live FFT Mini Spectrum */}
        <div
          className="hidden lg:flex items-end gap-[2px] h-5 px-1.5"
          title="Spectre harmonique temps réel"
        >
          {spectrum.slice(0, 10).map((lvl, idx) => (
            <span
              key={idx}
              style={{ height: `${Math.max(15, Math.round(lvl * 100))}%` }}
              className={`w-[2.5px] rounded-full transition-all duration-75 ${
                audioEnabled ? 'bg-teal-400' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Audio Toggle Button */}
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
            audioEnabled
              ? 'bg-teal-500/20 text-teal-200 border border-teal-400/40'
              : 'bg-amber-500/20 text-amber-200 border border-amber-400/45 audio-invite-glow hover:bg-amber-500/30'
          }`}
          title="Activer / couper le synthétiseur spatial (Touche M)"
        >
          {audioEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-teal-300" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span className="hidden sm:inline text-[11px] tracking-wide">
            {audioEnabled ? 'SON ACTIF' : 'ACTIVER SON'}
          </span>
        </button>

        {/* AI Autopilot Director */}
        <button
          onClick={onToggleAutoPilot}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
            autoPilot
              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/45'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/6 border border-transparent'
          }`}
          title="Mode Démiurge Automatique — l’IA chorégraphie le monde en continu"
        >
          <Sparkles className={`w-3.5 h-3.5 ${autoPilot ? 'text-amber-300' : ''}`} />
          <span className="hidden md:inline text-[11px]">AUTO</span>
        </button>

        {/* Zen Mode */}
        <button
          onClick={onToggleZen}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/6 transition cursor-pointer hidden sm:flex"
          title="Mode Immersion Plein Écran (Touche H)"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>

        {/* Inspector Drawer Toggle */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
            inspectorOpen
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-slate-400 hover:text-white hover:bg-white/6 border border-transparent'
          }`}
          title="Ouvrir / fermer le panneau de paramètres"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">ATELIER</span>
        </button>
      </div>
    </header>
  );
};

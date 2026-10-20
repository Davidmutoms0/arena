import React from 'react';
import type { TelemetryData, UniverseMode } from '../types/universe';

interface TelemetryHUDProps {
  mode: UniverseMode;
  telemetry: TelemetryData;
  hint: string;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ mode, telemetry, hint }) => {
  const unitLabel =
    mode === 'gravity'
      ? `${telemetry.entityCount} astres · ${telemetry.secondaryCount} poussières`
      : mode === 'biogenesis'
        ? `${telemetry.entityCount} biomorphes · 6 espèces`
        : mode === 'cymatics'
          ? `${telemetry.entityCount} émetteurs · grille 288×180`
          : `${telemetry.entityCount} anneaux · ${telemetry.secondaryCount} cordes`;

  return (
    <div className="fixed top-16 left-3 z-20 pointer-events-none select-none max-w-[330px] hidden sm:block space-y-1.5">
      <div className="hud-panel rounded-xl px-3 py-2 space-y-1">
        <div className="flex items-center gap-3 font-mono-tech text-[10.5px] text-slate-300">
          <span className="flex items-center gap-1.5 text-teal-300 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            {telemetry.fps} FPS
          </span>
          <span className="text-slate-600">|</span>
          <span className="truncate">{unitLabel}</span>
        </div>

        <div className="flex items-center gap-3 font-mono-tech text-[10px] text-slate-400">
          <span>ÉNERGIE {telemetry.energy.toFixed(1)}</span>
          {mode === 'gravity' && (
            <>
              <span className="text-slate-600">·</span>
              <span>ZOOM {Math.round(telemetry.zoom * 100)}%</span>
            </>
          )}
          <span className="text-slate-600">·</span>
          <span className="text-amber-300/90">RÉSONANCES {telemetry.resonanceEvents}</span>
        </div>
      </div>

      <p className="rounded-lg bg-black/55 backdrop-blur-md border border-white/6 px-2.5 py-1 text-[10.5px] text-slate-300/90 leading-snug">
        {hint}
      </p>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Shuffle,
  Dices,
  Save,
  Trash2,
  Music,
  Compass,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';
import type {
  MusicalScaleId,
  PresetDefinition,
  SavedUniverseRecord,
  SynthTimbreId,
  UniverseMode,
} from '../types/universe';
import { SCALES } from '../audio/SoundEngine';
import { SPECIES_COLORS, SPECIES_NAMES } from '../engines/BioGenesisEngine';

interface InspectorPanelProps {
  mode: UniverseMode;
  presets: PresetDefinition[];
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;

  // Gravity params
  gravityG: number;
  onChangeGravityG: (val: number) => void;
  trailLength: number;
  onChangeTrailLength: (val: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showHarp: boolean;
  onToggleHarp: () => void;
  onResetCamera: () => void;

  // BioGenesis params
  dnaMatrix: number[][];
  onCycleDnaCell: (r: number, c: number) => void;
  onMutateDna: () => void;
  onRandomizeDna: () => void;
  bioRadius: number;
  onChangeBioRadius: (val: number) => void;
  bioForce: number;
  onChangeBioForce: (val: number) => void;
  showBonds: boolean;
  onToggleBonds: () => void;
  selectedSpecies: number;
  onSelectSpecies: (sp: number) => void;

  // Cymatics params
  emitterFreq: number;
  onChangeEmitterFreq: (val: number) => void;
  reflectiveCavity: boolean;
  onToggleReflectiveCavity: () => void;
  onClearWaves: () => void;
  onClearCymaticsAll: () => void;

  // Polyrhythm params
  cyclePeriod: number;
  onChangeCyclePeriod: (val: number) => void;
  showChords: boolean;
  onToggleShowChords: () => void;
  onRealignPolyrhythm: () => void;
  onClearInk: () => void;

  // Audio params
  scale: MusicalScaleId;
  onChangeScale: (s: MusicalScaleId) => void;
  timbre: SynthTimbreId;
  onChangeTimbre: (t: SynthTimbreId) => void;
  volume: number;
  onChangeVolume: (v: number) => void;
  onTestChord: () => void;

  // Persistence
  savedUniverses: SavedUniverseRecord[];
  onSaveUniverse: (name: string) => void;
  onLoadUniverse: (item: SavedUniverseRecord) => void;
  onDeleteUniverse: (id: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = (props) => {
  const [customName, setCustomName] = useState('');
  const [activeTab, setActiveTab] = useState<'laws' | 'audio' | 'vault'>('laws');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim() || `Univers ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    props.onSaveUniverse(trimmed);
    setCustomName('');
  };

  return (
    <aside className="hud-panel fixed top-16 right-3 z-20 w-[288px] max-h-[calc(100vh-146px)] flex flex-col rounded-2xl overflow-hidden select-none">
      {/* Sub-navigation Tabs */}
      <div className="grid grid-cols-3 border-b border-white/8 bg-white/[0.02] p-1 gap-1">
        <button
          onClick={() => setActiveTab('laws')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition cursor-pointer ${
            activeTab === 'laws'
              ? 'bg-teal-400/15 text-teal-200 border border-teal-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Lois &amp; Mondes</span>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-teal-400/15 text-teal-200 border border-teal-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Harmonie</span>
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-teal-400/15 text-teal-200 border border-teal-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Archives</span>
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="hud-scroll overflow-y-auto p-3.5 space-y-4 text-xs">
        {activeTab === 'laws' && (
          <>
            {/* Curated Scenarios */}
            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2">
                Scénarios &amp; Genèses
              </h3>
              <div className="space-y-1.5">
                {props.presets.map((preset) => {
                  const isSelected = props.activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => props.onSelectPreset(preset.id)}
                      className={`w-full text-left rounded-xl px-2.5 py-2 transition cursor-pointer border ${
                        isSelected
                          ? 'bg-teal-400/14 border-teal-400/40 text-slate-100'
                          : 'bg-white/[0.025] border-white/6 text-slate-300 hover:bg-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="font-medium text-[11.5px] leading-snug text-slate-100">
                        {preset.label}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {preset.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Engine-Specific Controls */}
            {props.mode === 'gravity' && (
              <section className="space-y-3 pt-2 border-t border-white/8">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Constantes Relativistes
                </h3>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Gravitation universelle (G)</span>
                    <span className="font-mono-tech text-teal-300">{props.gravityG}</span>
                  </div>
                  <input
                    type="range"
                    min={300}
                    max={3000}
                    step={50}
                    value={props.gravityG}
                    onChange={(e) => props.onChangeGravityG(Number(e.target.value))}
                    className="astralys-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Persistance orbitale</span>
                    <span className="font-mono-tech text-teal-300">{props.trailLength} pts</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={10}
                    value={props.trailLength}
                    onChange={(e) => props.onChangeTrailLength(Number(e.target.value))}
                    className="astralys-slider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    onClick={props.onToggleGrid}
                    className={`rounded-lg py-1.5 px-2 text-[11px] border transition cursor-pointer ${
                      props.showGrid
                        ? 'bg-teal-400/15 border-teal-400/35 text-teal-200'
                        : 'bg-white/[0.03] border-white/8 text-slate-400'
                    }`}
                  >
                    Tissu Espace-Temps
                  </button>
                  <button
                    onClick={props.onToggleHarp}
                    className={`rounded-lg py-1.5 px-2 text-[11px] border transition cursor-pointer ${
                      props.showHarp
                        ? 'bg-amber-400/15 border-amber-400/35 text-amber-200'
                        : 'bg-white/[0.03] border-white/8 text-slate-400'
                    }`}
                  >
                    Harpe de Kepler
                  </button>
                </div>

                <button
                  onClick={props.onResetCamera}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 py-1.5 text-[11px] text-slate-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Recentrer l’objectif (Zoom 100%)</span>
                </button>
              </section>
            )}

            {props.mode === 'biogenesis' && (
              <section className="space-y-3 pt-2 border-t border-white/8">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Matrice Génétique 6×6
                  </h3>
                  <span className="text-[9.5px] text-slate-400">Cliquer une cellule</span>
                </div>

                {/* Interactive 6x6 Attraction/Repulsion Matrix */}
                <div className="rounded-xl bg-black/35 p-2 border border-white/8">
                  <div className="grid grid-cols-7 gap-1 items-center">
                    <div />
                    {SPECIES_COLORS.map((col, idx) => (
                      <div key={idx} className="flex justify-center">
                        <span
                          style={{ backgroundColor: col }}
                          className="w-2 h-2 rounded-full"
                        />
                      </div>
                    ))}
                    {props.dnaMatrix.map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        <div className="flex justify-center">
                          <span
                            style={{ backgroundColor: SPECIES_COLORS[rIdx] }}
                            className="w-2 h-2 rounded-full"
                          />
                        </div>
                        {row.map((val, cIdx) => {
                          const bg =
                            val >= 0
                              ? `rgba(45, 212, 191, ${0.12 + val * 0.68})`
                              : `rgba(251, 113, 133, ${0.12 + Math.abs(val) * 0.68})`;
                          return (
                            <button
                              key={cIdx}
                              onClick={() => props.onCycleDnaCell(rIdx, cIdx)}
                              style={{ backgroundColor: bg }}
                              title={`Espèce ${rIdx + 1} → Espèce ${cIdx + 1} : ${val.toFixed(2)}`}
                              className="h-5 rounded border border-white/10 font-mono-tech text-[8.5px] text-white/90 hover:scale-110 transition cursor-pointer"
                            >
                              {val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={props.onMutateDna}
                    className="flex items-center justify-center gap-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 py-1.5 text-[11px] text-teal-200 transition cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Muter l’ADN</span>
                  </button>
                  <button
                    onClick={props.onRandomizeDna}
                    className="flex items-center justify-center gap-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 py-1.5 text-[11px] text-amber-200 transition cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Génome Neuf</span>
                  </button>
                </div>

                <div>
                  <div className="text-[10.5px] text-slate-400 mb-1">
                    Espèce active pour l’ensemencement :
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {SPECIES_NAMES.map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => props.onSelectSpecies(idx)}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] border transition cursor-pointer ${
                          props.selectedSpecies === idx
                            ? 'bg-white/12 border-white/30 text-white'
                            : 'bg-white/[0.02] border-white/6 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: SPECIES_COLORS[idx] }}
                          className="w-2 h-2 rounded-full shrink-0"
                        />
                        <span className="truncate">{name.split('·')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Portée sensorielle</span>
                    <span className="font-mono-tech text-teal-300">{props.bioRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min={48}
                    max={135}
                    step={4}
                    value={props.bioRadius}
                    onChange={(e) => props.onChangeBioRadius(Number(e.target.value))}
                    className="astralys-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Réactivité chimique</span>
                    <span className="font-mono-tech text-teal-300">{props.bioForce.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.4}
                    step={0.05}
                    value={props.bioForce}
                    onChange={(e) => props.onChangeBioForce(Number(e.target.value))}
                    className="astralys-slider"
                  />
                </div>

                <button
                  onClick={props.onToggleBonds}
                  className={`w-full rounded-lg py-1.5 text-[11px] border transition cursor-pointer ${
                    props.showBonds
                      ? 'bg-teal-400/15 border-teal-400/35 text-teal-200'
                      : 'bg-white/[0.03] border-white/8 text-slate-400'
                  }`}
                >
                  Filaments Membranaires : {props.showBonds ? 'Visibles' : 'Masqués'}
                </button>
              </section>
            )}

            {props.mode === 'cymatics' && (
              <section className="space-y-3 pt-2 border-t border-white/8">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Physique Ondulatoire 2D
                </h3>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Fréquence des émetteurs</span>
                    <span className="font-mono-tech text-teal-300">
                      {(props.emitterFreq * 100).toFixed(0)} Hz·éq
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.12}
                    max={0.56}
                    step={0.02}
                    value={props.emitterFreq}
                    onChange={(e) => props.onChangeEmitterFreq(Number(e.target.value))}
                    className="astralys-slider"
                  />
                </div>

                <button
                  onClick={props.onToggleReflectiveCavity}
                  className={`w-full rounded-lg py-1.5 px-2.5 text-[11px] border transition cursor-pointer ${
                    props.reflectiveCavity
                      ? 'bg-amber-400/15 border-amber-400/35 text-amber-200'
                      : 'bg-teal-400/15 border-teal-400/35 text-teal-200'
                  }`}
                >
                  Bords : {props.reflectiveCavity ? 'Miroir Résonant (Chladni)' : 'Absorbants (Espace Ouvert)'}
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={props.onClearWaves}
                    className="rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 py-1.5 text-[11px] text-slate-200 transition cursor-pointer"
                  >
                    Calmer la surface
                  </button>
                  <button
                    onClick={props.onClearCymaticsAll}
                    className="rounded-lg bg-rose-500/12 hover:bg-rose-500/22 border border-rose-400/25 py-1.5 text-[11px] text-rose-200 transition cursor-pointer"
                  >
                    Table rase
                  </button>
                </div>
              </section>
            )}

            {props.mode === 'polyrhythm' && (
              <section className="space-y-3 pt-2 border-t border-white/8">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Horlogerie Astronomique
                </h3>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Période de grand alignement</span>
                    <span className="font-mono-tech text-teal-300">{props.cyclePeriod} s</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={120}
                    step={4}
                    value={props.cyclePeriod}
                    onChange={(e) => props.onChangeCyclePeriod(Number(e.target.value))}
                    className="astralys-slider"
                  />
                </div>

                <button
                  onClick={props.onToggleShowChords}
                  className={`w-full rounded-lg py-1.5 text-[11px] border transition cursor-pointer ${
                    props.showChords
                      ? 'bg-teal-400/15 border-teal-400/35 text-teal-200'
                      : 'bg-white/[0.03] border-white/8 text-slate-400'
                  }`}
                >
                  Gravure Guillochée : {props.showChords ? 'Active' : 'Désactivée'}
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={props.onRealignPolyrhythm}
                    className="rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 py-1.5 text-[11px] text-amber-200 transition cursor-pointer"
                  >
                    Unisson au Zénith
                  </button>
                  <button
                    onClick={props.onClearInk}
                    className="rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 py-1.5 text-[11px] text-slate-200 transition cursor-pointer"
                  >
                    Effacer le tracé
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'audio' && (
          <section className="space-y-3.5">
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2">
                Gamme Musicale Cosmique
              </h3>
              <div className="space-y-1.5">
                {(Object.keys(SCALES) as MusicalScaleId[]).map((scaleKey) => (
                  <button
                    key={scaleKey}
                    onClick={() => props.onChangeScale(scaleKey)}
                    className={`w-full text-left rounded-lg px-2.5 py-1.5 text-[11.5px] border transition cursor-pointer ${
                      props.scale === scaleKey
                        ? 'bg-teal-400/15 border-teal-400/40 text-teal-200 font-medium'
                        : 'bg-white/[0.025] border-white/6 text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {SCALES[scaleKey].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Architecture du Synthétiseur
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'celesta', label: 'Célesta FM' },
                    { id: 'pad', label: 'Nappe Poly' },
                    { id: 'crystal', label: 'Harmonica' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => props.onChangeTimbre(item.id)}
                    className={`rounded-lg py-1.5 px-1.5 text-[10.5px] border transition cursor-pointer ${
                      props.timbre === item.id
                        ? 'bg-amber-400/16 border-amber-400/40 text-amber-200'
                        : 'bg-white/[0.03] border-white/8 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Volume Maître + Réverbération</span>
                <span className="font-mono-tech text-teal-300">
                  {Math.round(props.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={props.volume}
                onChange={(e) => props.onChangeVolume(Number(e.target.value))}
                className="astralys-slider"
              />
            </div>

            <button
              onClick={props.onTestChord}
              className="w-full rounded-xl bg-teal-500/18 hover:bg-teal-500/28 border border-teal-400/40 py-2 text-xs font-medium text-teal-200 transition cursor-pointer"
            >
              Faire résonner l’accord fondamental
            </button>
          </section>
        )}

        {activeTab === 'vault' && (
          <section className="space-y-3">
            <form onSubmit={handleSave} className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Figer l’état de cet univers
              </h3>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nom de votre création..."
                  className="flex-1 rounded-lg bg-black/40 border border-white/12 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-400/60"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 px-2.5 py-1.5 text-xs font-medium text-teal-200 transition cursor-pointer"
                  title="Sauvegarder sur le serveur"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="space-y-1.5 pt-2 border-t border-white/8">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                Univers Archivés ({props.savedUniverses.length})
              </div>
              {props.savedUniverses.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 px-2.5 py-2 transition"
                >
                  <button
                    onClick={() => props.onLoadUniverse(item)}
                    className="flex-1 text-left cursor-pointer min-w-0"
                  >
                    <div className="font-medium text-[11.5px] text-slate-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-[9.5px] text-slate-400 uppercase tracking-wider">
                      {item.mode} · {item.scale}
                    </div>
                  </button>
                  {!item.id.startsWith('seed-') && (
                    <button
                      onClick={() => props.onDeleteUniverse(item.id)}
                      className="rounded p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};

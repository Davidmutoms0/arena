import React from 'react';
import { Volume2, X, Orbit, Dna, Waves, Disc3 } from 'lucide-react';

interface WelcomeBannerProps {
  visible: boolean;
  onEnableAudioAndDismiss: () => void;
  onDismiss: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  visible,
  onEnableAudioAndDismiss,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-3 z-30 max-w-[355px] select-none">
      <div className="hud-panel rounded-2xl p-4 space-y-3 border-teal-400/30">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono-tech uppercase tracking-[0.2em] text-amber-300">
              Carte Blanche · Journal du Maître
            </div>
            <h2 className="text-sm font-bold text-slate-100 mt-0.5">
              Bienvenue dans ASTRALYS
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Tu m’as confié ce dépôt vierge en me disant :{' '}
          <span className="italic text-teal-200">« fais-en ce que tu veux »</span>. J’y ai forgé un
          instrument de création cosmique réunissant gravité relativiste, vie artificielle,
          interférences quantiques et musique générative en temps réel.
        </p>

        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={onEnableAudioAndDismiss}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-400/20 hover:bg-teal-400/30 border border-teal-400/45 py-2 px-3 text-xs font-semibold text-teal-100 transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-teal-300" />
            <span>Éveiller le Son &amp; Explorer</span>
          </button>
          <button
            onClick={onDismiss}
            className="rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 py-2 px-3 text-xs text-slate-300 transition cursor-pointer"
          >
            Silencieux
          </button>
        </div>
      </div>
    </div>
  );
};

interface ManifestoModalProps {
  open: boolean;
  onClose: () => void;
}

export const ManifestoModal: React.FC<ManifestoModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="hud-panel max-w-xl w-full rounded-2xl p-6 space-y-5 border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-3.5">
          <div>
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-teal-300">
              Architecture &amp; Physique Temps Réel
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              ASTRALYS — Quatre Laboratoires Unifiés
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-teal-200">
              <Orbit className="w-3.5 h-3.5" />
              <span>01 · Mécanique Céleste</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Intégrateur symplectique Velocity-Verlet à N corps, prédiction de trajectoire sur 165
              pas, trous noirs lenticulaires et harpe orbitale de Kepler.
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-200">
              <Dna className="w-3.5 h-3.5" />
              <span>02 · Chimie Émergente</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              1 020 biomorphes sur grille spatiale torique gouvernés par une matrice d’affinité 6×6
              asymétrique éditable en direct.
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-sky-200">
              <Waves className="w-3.5 h-3.5" />
              <span>03 · Cymatique Quantique</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Solveur d’onde 2D isotrope à 9 points : fentes de Young, lentilles optiques de Snell
              (indice n = 1,70) et mandalas stationnaires de Chladni.
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-rose-200">
              <Disc3 className="w-3.5 h-3.5" />
              <span>04 · Horloge Polyrhythmique</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Résonateurs concentriques en progression harmonique traçant des rosaces guillochées
              vectorielles persistantes.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-black/40 border border-white/8 p-3 font-mono-tech text-[11px] text-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <span className="text-teal-300">[1–4]</span> Changer d’univers
          </div>
          <div>
            <span className="text-teal-300">[Espace]</span> Pause / Lecture
          </div>
          <div>
            <span className="text-teal-300">[M]</span> Son Spatial On/Off
          </div>
          <div>
            <span className="text-teal-300">[H]</span> Mode Zen Pur
          </div>
          <div>
            <span className="text-teal-300">[Molette]</span> Zoom Optique
          </div>
          <div>
            <span className="text-teal-300">[Clic Droit]</span> Déplacer Caméra
          </div>
        </div>
      </div>
    </div>
  );
};

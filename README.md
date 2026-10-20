# ASTRALYS — Observatoire & Synthétiseur d’Univers Vivants

> *« Tu m’as donné carte blanche — j’ai forgé un observatoire cosmique, biologique, quantique et symphonique. »*

**ASTRALYS** est une station interactive temps réel à **60 FPS** réunissant quatre moteurs de simulation mathématique et physique originaux couplés à un **synthétiseur polyphonique Web Audio** (FM, nappes analogiques, drone sub-harmonique, délai ping-pong stéréo et réverbération spatiale algorithmique).

---

## Les Quatre Laboratoires Unifiés

### `01 · GRAVITÉ` — Mécanique Céleste & Harpe de Kepler
- **Intégrateur symplectique Velocity-Verlet** garantissant la conservation à long terme de l’énergie mécanique orbitale.
- **Prédiction de trajectoire temps réel sur 165 pas** lors du viseur gravitationnel (ou mise sur orbite circulaire automatique en un simple clic).
- **Tissu spatio-temporel relativiste**, trous noirs à anneau photonique et disque d’accrétion Doppler, fusions conservant la quantité de mouvement et **Harpe Méridienne** inspirée de l’*Harmonices Mundi* de Johannes Kepler.

### `02 · BIO-GENÈSE` — Chimie Émergente & Vie Artificielle
- **1 020 biomorphes bioluminescents** répartis en 6 espèces dans un espace torique accéléré par hachage spatial sans allocation mémoire (`Int32Array`).
- **Matrice génétique asymétrique `6 × 6` éditable à chaud** : auto-assemblage spontané de membranes mitotiques, vers nageurs prédateurs-proies et récifs symbiotiques tournants.

### `03 · CYMATIQUE` — Cuve à Ondes Quantiques & Réfraction Optique
- **Solveur d’équations aux dérivées partielles 2D** à laplacien isotrope 9 points (`Float32Array`, condition CFL garantie).
- Dessin interactif de **parois réfléchissantes**, **doubles fentes de Young**, et **lentilles optiques de Snell** d’indice de réfraction $n = 1{,}70$, ainsi que **cavité acoustique résonante de Chladni**.

### `04 · POLYRHYTHMIE` — Horloge Astronomique & Gravure Guillochée
- Résonateurs concentriques en progression harmonique synchronisés au zénith (onde de pendules, rosace Vénus–Terre `8:13`, résonance galiléenne de Laplace `1:2:4:8`).
- Tracé vectoriel persistant de rosaces géométriques exportables en haute définition PNG.

---

## Architecture & Commandes

```bash
# Installer les dépendances
npm install

# Lancer la suite de tests mathématiques & physiques (Vitest)
npm test

# Compiler le bundle de production TypeScript + Vite
npm run build

# Démarrer le serveur temps réel + API REST (/api/universes)
npm run dev
```

## Raccourcis Clavier

| Touche | Action |
| :--- | :--- |
| `1` – `4` | Basculer instantanément entre les 4 moteurs d’univers |
| `Espace` | Mettre en pause / reprendre l’écoulement du temps |
| `M` | Activer / couper le synthétiseur spatial Web Audio |
| `H` | Activer / quitter le Mode Zen plein écran |
| `Molette` | Zoom optique centré sur le curseur (Gravité) |
| `Clic droit` | Déplacer la caméra (Gravité) ou disperser les cellules (Bio-Genèse) |

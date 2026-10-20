import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SAVED_FILE = path.join(DATA_DIR, 'saved-universes.json');

export interface SavedUniverseEntry {
  id: string;
  name: string;
  mode: string;
  scale: string;
  createdAt: string;
  note?: string;
  payload: Record<string, unknown>;
}

const SEED_UNIVERSES: SavedUniverseEntry[] = [
  {
    id: 'seed-kepler-symphony',
    name: 'Résonance d’Or de Kepler',
    mode: 'gravity',
    scale: 'lydian',
    createdAt: '2026-10-20T22:50:00.000Z',
    note: 'Système harmonique forgé à l’aube du dépôt — chaque orbite chante une quinte juste.',
    payload: { presetId: 'harmonic-solar' },
  },
  {
    id: 'seed-mitosis-garden',
    name: 'Jardin Cellulaire Mitotique',
    mode: 'biogenesis',
    scale: 'pentatonic',
    createdAt: '2026-10-20T22:51:00.000Z',
    note: 'Membranes auto-assemblées émergeant d’une matrice génétique asymétrique 6×6.',
    payload: { presetId: 'mitotic-cells' },
  },
  {
    id: 'seed-young-quantum',
    name: 'Interférences Quantiques de Young',
    mode: 'cymatics',
    scale: 'hirajoshi',
    createdAt: '2026-10-20T22:52:00.000Z',
    note: 'Double fente sub-longueur d’onde révélant les franges stationnaires de diffraction.',
    payload: { presetId: 'double-slit' },
  },
];

function readSavedUniverses(): SavedUniverseEntry[] {
  try {
    if (!fs.existsSync(SAVED_FILE)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(SAVED_FILE, JSON.stringify(SEED_UNIVERSES, null, 2), 'utf-8');
      return [...SEED_UNIVERSES];
    }
    const raw = fs.readFileSync(SAVED_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...SEED_UNIVERSES];
  } catch {
    return [...SEED_UNIVERSES];
  }
}

function writeSavedUniverses(entries: SavedUniverseEntry[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SAVED_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function createApiMiddleware() {
  const bootTime = Date.now();

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ? req.url.split('?')[0] : '';

    if (url === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        engine: 'ASTRALYS Core v1.0',
        uptimeSeconds: Math.round((Date.now() - bootTime) / 1000),
        savedCount: readSavedUniverses().length,
      });
      return;
    }

    if (url === '/api/universes' && req.method === 'GET') {
      sendJson(res, 200, { universes: readSavedUniverses() });
      return;
    }

    if (url === '/api/universes' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        if (body.length < 1_500_000) {
          body += chunk.toString('utf-8');
        }
      });
      req.on('end', () => {
        try {
          const incoming = JSON.parse(body || '{}');
          const entry: SavedUniverseEntry = {
            id: `univ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            name: String(incoming.name || 'Univers Sans Titre').slice(0, 60),
            mode: String(incoming.mode || 'gravity'),
            scale: String(incoming.scale || 'lydian'),
            createdAt: new Date().toISOString(),
            note: incoming.note ? String(incoming.note).slice(0, 140) : undefined,
            payload: typeof incoming.payload === 'object' && incoming.payload !== null ? incoming.payload : {},
          };
          const list = readSavedUniverses();
          list.unshift(entry);
          writeSavedUniverses(list.slice(0, 30));
          sendJson(res, 201, { universe: entry, universes: list.slice(0, 30) });
        } catch {
          sendJson(res, 400, { error: 'Charge JSON invalide' });
        }
      });
      return;
    }

    if (url.startsWith('/api/universes/') && req.method === 'DELETE') {
      const id = decodeURIComponent(url.slice('/api/universes/'.length));
      const nextList = readSavedUniverses().filter((item) => item.id !== id);
      writeSavedUniverses(nextList);
      sendJson(res, 200, { universes: nextList });
      return;
    }

    next();
  };
}

export function astralysApiPlugin(): Plugin {
  const middleware = createApiMiddleware();
  return {
    name: 'astralys-api-plugin',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

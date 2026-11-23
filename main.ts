// Ember & Tide — the hand-in program (Node 22, standard library only).
//
// The game lives beside this file: game/ is plain static files a desktop
// browser loads offline (index.html plus its ES modules, no library, no
// network request), and screenshots/ holds 3 or 4 real renders of it.
// This program hands both in: it copies them to the output directory and
// writes dossier.json with the kit's buildDossier, the summary the judge
// reads. The scorer's caps are enforced here so a bad hand-in fails loudly
// on my machine instead of quietly on theirs.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outputs are left world-readable (files 0644, folders 0755): make.fun
// collects /output as another user than the one this program runs as.

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, chmodSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function makeReadable(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      chmodSync(path, 0o755);
      makeReadable(path);
    } else if (entry.isFile()) {
      chmodSync(path, 0o644);
    }
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Fail fast when the screenshots are missing or too many: the scorer
// refuses an entry with fewer than 3 or more than 4.
const shotCount = readdirSync(join(out, 'screenshots')).filter((f) => !f.startsWith('.')).length;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`screenshots/: expected 3 or 4 images, found ${shotCount}`);
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files, or a
// path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
chmodSync(out, 0o755);
makeReadable(out);
console.log(`Handed in: game/ + screenshots/ + dossier.json under ${out}`);

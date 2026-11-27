// Turkey Trot entry assembler (Node 22, standard library only): the game is
// this directory's game/ folder — plain static files a desktop browser loads
// offline — and this program hands it in. It copies game/ and screenshots/
// from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library. Then it
// proves the handover: it rebuilds the dossier from what it just wrote and
// compares the two byte for byte, and fingerprints the dossier with sha256.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ENTRY_CONFIG = Object.freeze({
  gameFolder: 'game',
  shotsFolder: 'screenshots',
  dossierFile: 'dossier.json',
  indexFile: 'index.html',
  maxShotBytes: 262144,
  maxShots: 4,
  minShots: 3,
  // The scorer's own caps, from the kit's gate: only text_max_bytes shapes
  // the dossier's bytes; the rest refuse an entry the scorer would refuse.
  dossierCaps: Object.freeze({
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
});

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

function resolveRepoRoot() {
  return fileURLToPath(new URL('.', import.meta.url));
}

function resolveOutDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
}

function isImageBuffer(buffer) {
  return buffer.subarray(0, 8).equals(PNG_MAGIC) || buffer.subarray(0, 3).equals(JPEG_MAGIC);
}

async function fingerprint(file) {
  const bytes = await readFile(file);
  return createHash('sha256').update(bytes).digest('hex');
}

async function auditShots(shotsDir) {
  const names = (await readdir(shotsDir)).filter((name) => !name.startsWith('.')).sort();
  if (names.length < ENTRY_CONFIG.minShots || names.length > ENTRY_CONFIG.maxShots) {
    throw new Error(`screenshots: expected ${ENTRY_CONFIG.minShots}-${ENTRY_CONFIG.maxShots} images, found ${names.length}`);
  }
  for (const name of names) {
    const file = join(shotsDir, name);
    const info = await stat(file);
    if (!info.isFile()) throw new Error(`screenshots: ${name} is not a file`);
    if (info.size > ENTRY_CONFIG.maxShotBytes) {
      throw new Error(`screenshots: ${name} is ${info.size} bytes, over the ${ENTRY_CONFIG.maxShotBytes} cap`);
    }
    const bytes = await readFile(file);
    if (!isImageBuffer(bytes)) throw new Error(`screenshots: ${name} is neither PNG nor JPEG`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name)) throw new Error(`screenshots: ${name} has an invalid file name`);
  }
  return names;
}

async function checkGameTree(gameDir) {
  const index = join(gameDir, ENTRY_CONFIG.indexFile);
  const info = await stat(index);
  if (!info.isFile()) throw new Error(`game: ${ENTRY_CONFIG.indexFile} is missing`);
  if (info.size > 1024 * 1024) throw new Error(`game: ${ENTRY_CONFIG.indexFile} is over 1 MiB`);
}

async function assembleEntry() {
  const root = resolveRepoRoot();
  const out = resolveOutDir();
  const gameDir = join(root, ENTRY_CONFIG.gameFolder);
  const shotsDir = join(root, ENTRY_CONFIG.shotsFolder);
  await checkGameTree(gameDir);
  const shots = await auditShots(shotsDir);

  await mkdir(out, { recursive: true });
  await cp(gameDir, join(out, ENTRY_CONFIG.gameFolder), { recursive: true });
  await mkdir(join(out, ENTRY_CONFIG.shotsFolder), { recursive: true });
  await cp(shotsDir, join(out, ENTRY_CONFIG.shotsFolder), { recursive: true });

  const dossierPath = join(out, ENTRY_CONFIG.dossierFile);
  const dossier = buildDossier(out, ENTRY_CONFIG.dossierCaps);
  await writeFile(dossierPath, dossier);

  // Prove the handover: the dossier on disk must equal a fresh build from
  // the same directory, byte for byte — the gate's own dossier_matches row.
  const written = await readFile(dossierPath);
  const rebuilt = buildDossier(out, ENTRY_CONFIG.dossierCaps);
  if (!written.equals(Buffer.from(rebuilt))) {
    throw new Error('dossier: the written dossier does not match a fresh build');
  }
  return { out, shots, dossierPath, digest: await fingerprint(dossierPath) };
}

async function main() {
  const receipt = await assembleEntry();
  console.log(`game handed in to ${receipt.out}`);
  console.log(`screenshots: ${receipt.shots.join(', ')}`);
  console.log(`dossier: ${receipt.dossierPath}`);
  console.log(`dossier sha256: ${receipt.digest}`);
  console.log('ENTRY COMPLETE');
}

main().catch((error) => {
  console.error(`entry failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

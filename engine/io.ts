// Persistence: sanitized SVGs + PNG thumbnails go to public/gallery, the run
// manifest to public/data/gallery.json. All committed to the repo so the app
// deploys statically and the wall is full on first paint (SPEC §8, decision:
// precomputed real data).

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { GalleryData } from "./types";

const GALLERY_DIR = join(process.cwd(), "public", "gallery");
const DATA_DIR = join(process.cwd(), "public", "data");
const DATA_FILE = join(DATA_DIR, "gallery.json");

export function savePieceAssets(id: string, sanitizedSvg: string, png: Buffer) {
  mkdirSync(GALLERY_DIR, { recursive: true });
  writeFileSync(join(GALLERY_DIR, `${id}.svg`), sanitizedSvg);
  writeFileSync(join(GALLERY_DIR, `${id}.png`), png);
}

export function writeGalleryData(data: GalleryData) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function readGalleryData(): GalleryData | null {
  if (!existsSync(DATA_FILE)) return null;
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8")) as GalleryData;
  } catch {
    return null;
  }
}

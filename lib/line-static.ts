import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createStoredZip } from '@/lib/zip';
import { consumeCredits, getWallet } from '@/lib/mock-store';

export const LINE_STATIC_COUNTS = [8, 16, 24, 32, 40] as const;
export const LINE_STICKER_WIDTH = 370;
export const LINE_STICKER_HEIGHT = 320;
export const LINE_MAIN_SIZE = 240;
export const LINE_TAB_WIDTH = 96;
export const LINE_TAB_HEIGHT = 74;
export const LINE_MIN_MARGIN = 10;
export const LINE_OUTPUT_MARGIN = 40;
export const LINE_MAX_IMAGE_BYTES = 1024 * 1024;
export const LINE_MAX_ZIP_BYTES = 60 * 1024 * 1024;
export const LINE_DELIVERY_MIN_MARGIN = 24;

type LineStaticCount = (typeof LINE_STATIC_COUNTS)[number];
type QcStatus = 'pending' | 'passed' | 'failed';
type GenerationStrategy = 'sheet_crop' | 'batch_sheet' | 'independent' | 'manual_sheet' | 'manual_batch_sheet';

export type LineStaticAsset = {
  id: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  storage_key: string;
  is_demo: boolean;
  source_kind: 'material' | 'sticker_sheet';
  created_at: string;
};

export type LineStaticImage = {
  index: number;
  zip_path: string;
  url_path: string;
  width: number;
  height: number;
  byte_size: number;
  sha256: string;
  transparent_pixel_ratio: number;
  safe_margin_ratio: { left: number; right: number; top: number; bottom: number } | null;
  visual_metrics?: VisualQcMetrics;
  qc_passed: boolean;
  qc_failures: string[];
};

export type LineStaticWork = {
  id: string;
  title: string;
  source_asset_id: string;
  style_prompt: string;
  sticker_count: LineStaticCount;
  output_kind: 'line_static_png';
  provider: 'openai' | 'local_demo' | 'manual_sheet';
  generation_strategy: GenerationStrategy;
  provider_request_count: number;
  status: 'completed' | 'failed';
  qc_status: QcStatus;
  qc_failures: string[];
  qc_warnings: string[];
  credit_cost: number;
  download_url: string | null;
  images: LineStaticImage[];
  main_image: LineStaticImage | null;
  tab_image: LineStaticImage | null;
  generation_manifest_path: string | null;
  created_at: string;
  updated_at: string;
  error_message?: string;
};

type Store = {
  assets: Record<string, LineStaticAsset>;
  works: Record<string, LineStaticWork>;
};

type PngInfo = {
  width: number;
  height: number;
  colorType: number;
  hasAlpha: boolean;
  rgba: Buffer;
};

type VisualQcMetrics = {
  subject_ratio: { width: number; height: number; long_side: number; area: number } | null;
  margin_ratio: { left: number; right: number; top: number; bottom: number } | null;
  main_component_ratio: number;
  fragment_component_count: number;
  fragment_pixel_ratio: number;
  interior_hole_ratio: number;
};

type SheetCellReport = {
  index: number;
  width: number;
  height: number;
  subject_ratio: { width: number; height: number; long_side: number } | null;
  margin_ratio: { left: number; right: number; top: number; bottom: number } | null;
  visual_metrics?: VisualQcMetrics;
  qc_passed: boolean;
  qc_failures: string[];
};

const g = globalThis as typeof globalThis & { __AUTO_STICKER_LINE_STATIC_STORE__?: Store };
const now = () => new Date().toISOString();
const sha256 = (data: Buffer | string) => crypto.createHash('sha256').update(data).digest('hex');
const root = () => path.join(process.cwd(), '.stage2_store', 'line_static');
const assetDir = () => path.join(root(), 'assets');
const workDir = (workId: string) => path.join(root(), 'works', workId);
const publicImagePath = (workId: string, fileName: string) => `/api/works/${workId}/generated-images?file=${encodeURIComponent(fileName)}`;
const nextId = (prefix: string, seed = '') => `${prefix}_${sha256(`${seed}:${Date.now()}:${Math.random()}`).slice(0, 18)}`;
const SHEET_CROP_CREDIT_COST: Record<LineStaticCount, number> = { 8: 6, 16: 9, 24: 12, 32: 15, 40: 18 };
const BATCH_SHEET_SIZE: LineStaticCount = 8;
const SHEET_CANVAS_SIZE = 1024;
const SHEET_CELL_NORMALIZED_SIZE = 512;
const SHEET_CELL_TARGET_MARGIN = 92;
const SHEET_MIN_CELL_MARGIN_RATIO = 0.055;
const SHEET_MIN_SUBJECT_LONG_SIDE_RATIO = 0.28;
const SHEET_MAX_SUBJECT_LONG_SIDE_RATIO = 0.86;
const PACK_MAX_LONG_SIDE_SPREAD = 0.1;
const PACK_MAX_AREA_DEVIATION = 0.7;
const MAX_INTERIOR_HOLE_RATIO = 0.18;
const MIN_MAIN_COMPONENT_RATIO = 0.55;
const MAX_FRAGMENT_PIXEL_RATIO = 0.16;

export function lineStaticCreditCost(count: LineStaticCount, strategy: GenerationStrategy = 'sheet_crop') {
  if (strategy === 'manual_sheet' || strategy === 'manual_batch_sheet') return 1;
  if (strategy === 'batch_sheet') return SHEET_CROP_CREDIT_COST[BATCH_SHEET_SIZE] * Math.ceil(count / BATCH_SHEET_SIZE);
  return strategy === 'sheet_crop' ? SHEET_CROP_CREDIT_COST[count] : count;
}

function blankStore(): Store {
  return { assets: {}, works: {} };
}

function loadStore(): Store {
  if (g.__AUTO_STICKER_LINE_STATIC_STORE__) return g.__AUTO_STICKER_LINE_STATIC_STORE__;
  const file = path.join(root(), 'store.json');
  try {
    g.__AUTO_STICKER_LINE_STATIC_STORE__ = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    g.__AUTO_STICKER_LINE_STATIC_STORE__ = blankStore();
  }
  return g.__AUTO_STICKER_LINE_STATIC_STORE__!;
}

function persist(store = loadStore()) {
  fs.mkdirSync(root(), { recursive: true });
  fs.writeFileSync(path.join(root(), 'store.json'), JSON.stringify(store, null, 2));
}

function crc32(buf: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, crc]);
}

export function encodeRgbaPng(width: number, height: number, rgba: Buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const dst = y * (width * 4 + 1);
    raw[dst] = 0;
    rgba.copy(raw, dst + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function unfilterScanline(filter: number, scan: Buffer, prev: Buffer, bpp: number) {
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let i = 0; i < scan.length; i++) {
    const left = i >= bpp ? scan[i - bpp] : 0;
    const up = prev[i] || 0;
    const upperLeft = i >= bpp ? prev[i - bpp] || 0 : 0;
    if (filter === 1) scan[i] = (scan[i] + left) & 255;
    else if (filter === 2) scan[i] = (scan[i] + up) & 255;
    else if (filter === 3) scan[i] = (scan[i] + Math.floor((left + up) / 2)) & 255;
    else if (filter === 4) scan[i] = (scan[i] + paeth(left, up, upperLeft)) & 255;
  }
}

export function parsePng(buffer: Buffer): PngInfo {
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('INVALID_PNG_MAGIC');
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  if (!width || !height || bitDepth !== 8) throw new Error('UNSUPPORTED_PNG');
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : 0;
  if (!channels) throw new Error('UNSUPPORTED_PNG_COLOR_TYPE');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rgba = Buffer.alloc(width * height * 4);
  let pos = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const scan = Buffer.from(raw.subarray(pos, pos + stride));
    pos += stride;
    unfilterScanline(filter, scan, prev, channels);
    for (let x = 0; x < width; x++) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      if (colorType === 6) {
        rgba[dst] = scan[src];
        rgba[dst + 1] = scan[src + 1];
        rgba[dst + 2] = scan[src + 2];
        rgba[dst + 3] = scan[src + 3];
      } else if (colorType === 2) {
        rgba[dst] = scan[src];
        rgba[dst + 1] = scan[src + 1];
        rgba[dst + 2] = scan[src + 2];
        rgba[dst + 3] = 255;
      } else if (colorType === 4) {
        rgba[dst] = scan[src];
        rgba[dst + 1] = scan[src];
        rgba[dst + 2] = scan[src];
        rgba[dst + 3] = scan[src + 1];
      } else {
        rgba[dst] = scan[src];
        rgba[dst + 1] = scan[src];
        rgba[dst + 2] = scan[src];
        rgba[dst + 3] = 255;
      }
    }
    prev = scan;
  }
  return { width, height, colorType, hasAlpha: colorType === 6 || colorType === 4, rgba };
}

function bbox(info: PngInfo) {
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let transparent = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = info.rgba[(y * info.width + x) * 4 + 3];
      if (alpha < 16) transparent++;
      else {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { box: null, transparentRatio: 1 };
  return { box: { minX, minY, maxX, maxY }, transparentRatio: transparent / (info.width * info.height) };
}

function visualMetrics(info: PngInfo): VisualQcMetrics {
  const { box } = bbox(info);
  if (!box) {
    return {
      subject_ratio: null,
      margin_ratio: null,
      main_component_ratio: 0,
      fragment_component_count: 0,
      fragment_pixel_ratio: 0,
      interior_hole_ratio: 0,
    };
  }

  const subjectW = box.maxX - box.minX + 1;
  const subjectH = box.maxY - box.minY + 1;
  const subjectArea = subjectW * subjectH;
  const subject_ratio = {
    width: Number((subjectW / info.width).toFixed(6)),
    height: Number((subjectH / info.height).toFixed(6)),
    long_side: Number((Math.max(subjectW / info.width, subjectH / info.height)).toFixed(6)),
    area: Number((subjectArea / (info.width * info.height)).toFixed(6)),
  };
  const margin_ratio = {
    left: Number((box.minX / info.width).toFixed(6)),
    right: Number(((info.width - 1 - box.maxX) / info.width).toFixed(6)),
    top: Number((box.minY / info.height).toFixed(6)),
    bottom: Number(((info.height - 1 - box.maxY) / info.height).toFixed(6)),
  };

  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  let opaqueTotal = 0;
  let largestComponent = 0;
  const componentSizes: number[] = [];
  const stack: number[] = [];
  const isOpaque = (index: number) => info.rgba[index * 4 + 3] >= 16;

  for (let i = 0; i < pixelCount; i++) {
    if (!isOpaque(i)) continue;
    opaqueTotal++;
    if (visited[i]) continue;
    visited[i] = 1;
    stack.push(i);
    let size = 0;
    while (stack.length) {
      const current = stack.pop()!;
      size++;
      const x = current % info.width;
      const y = Math.floor(current / info.width);
      const neighbors = [
        x > 0 ? current - 1 : -1,
        x < info.width - 1 ? current + 1 : -1,
        y > 0 ? current - info.width : -1,
        y < info.height - 1 ? current + info.width : -1,
      ];
      for (const next of neighbors) {
        if (next >= 0 && !visited[next] && isOpaque(next)) {
          visited[next] = 1;
          stack.push(next);
        }
      }
    }
    largestComponent = Math.max(largestComponent, size);
    componentSizes.push(size);
  }
  const significantCutoff = Math.max(8, opaqueTotal * 0.0015);
  const smallCutoff = Math.max(8, opaqueTotal * 0.015);
  const fragmentComponentCount = Math.max(0, componentSizes.filter((size) => size >= significantCutoff).length - 1);
  const fragmentPixels = componentSizes.filter((size) => size < smallCutoff).reduce((sum, size) => sum + size, 0);

  const exteriorTransparent = new Uint8Array(pixelCount);
  const transparentStack: number[] = [];
  const pushTransparent = (x: number, y: number) => {
    const index = y * info.width + x;
    if (!exteriorTransparent[index] && !isOpaque(index)) {
      exteriorTransparent[index] = 1;
      transparentStack.push(index);
    }
  };
  for (let x = 0; x < info.width; x++) {
    pushTransparent(x, 0);
    pushTransparent(x, info.height - 1);
  }
  for (let y = 0; y < info.height; y++) {
    pushTransparent(0, y);
    pushTransparent(info.width - 1, y);
  }
  while (transparentStack.length) {
    const current = transparentStack.pop()!;
    const x = current % info.width;
    const y = Math.floor(current / info.width);
    if (x > 0) pushTransparent(x - 1, y);
    if (x < info.width - 1) pushTransparent(x + 1, y);
    if (y > 0) pushTransparent(x, y - 1);
    if (y < info.height - 1) pushTransparent(x, y + 1);
  }

  let interiorHoles = 0;
  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      const index = y * info.width + x;
      if (!isOpaque(index) && !exteriorTransparent[index]) interiorHoles++;
    }
  }

  return {
    subject_ratio,
    margin_ratio,
    main_component_ratio: opaqueTotal ? Number((largestComponent / opaqueTotal).toFixed(6)) : 0,
    fragment_component_count: Math.max(0, fragmentComponentCount - 1),
    fragment_pixel_ratio: opaqueTotal ? Number((fragmentPixels / opaqueTotal).toFixed(6)) : 0,
    interior_hole_ratio: Number((interiorHoles / subjectArea).toFixed(6)),
  };
}

function samplePremultipliedBilinear(info: PngInfo, x: number, y: number) {
  const x0 = Math.max(0, Math.min(info.width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(info.height - 1, Math.floor(y)));
  const x1 = Math.max(0, Math.min(info.width - 1, x0 + 1));
  const y1 = Math.max(0, Math.min(info.height - 1, y0 + 1));
  const dx = Math.max(0, Math.min(1, x - x0));
  const dy = Math.max(0, Math.min(1, y - y0));
  const points = [
    [x0, y0, (1 - dx) * (1 - dy)],
    [x1, y0, dx * (1 - dy)],
    [x0, y1, (1 - dx) * dy],
    [x1, y1, dx * dy],
  ] as const;
  let r = 0;
  let g3 = 0;
  let b = 0;
  let a = 0;
  for (const [px, py, weight] of points) {
    const i = (py * info.width + px) * 4;
    const alpha = info.rgba[i + 3] / 255;
    a += alpha * weight;
    r += info.rgba[i] * alpha * weight;
    g3 += info.rgba[i + 1] * alpha * weight;
    b += info.rgba[i + 2] * alpha * weight;
  }
  if (a <= 0.0001) return [0, 0, 0, 0] as const;
  return [
    Math.round(r / a),
    Math.round(g3 / a),
    Math.round(b / a),
    Math.round(a * 255),
  ] as const;
}

function fitToCanvas(source: Buffer, width: number, height: number, margin = LINE_MIN_MARGIN) {
  const info = parsePng(source);
  const { box } = bbox(info);
  const out = Buffer.alloc(width * height * 4);
  if (!box) return encodeRgbaPng(width, height, out);
  const boxW = box.maxX - box.minX + 1;
  const boxH = box.maxY - box.minY + 1;
  const scale = Math.min((width - margin * 2) / boxW, (height - margin * 2) / boxH);
  const drawW = Math.max(1, Math.floor(boxW * scale));
  const drawH = Math.max(1, Math.floor(boxH * scale));
  const left = Math.floor((width - drawW) / 2);
  const top = Math.floor((height - drawH) / 2);
  for (let y = 0; y < drawH; y++) {
    const sy = box.minY + Math.min(boxH - 1, (y + 0.5) / scale - 0.5);
    for (let x = 0; x < drawW; x++) {
      const sx = box.minX + Math.min(boxW - 1, (x + 0.5) / scale - 0.5);
      const dst = ((top + y) * width + left + x) * 4;
      const [r, g3, b, a] = samplePremultipliedBilinear(info, sx, sy);
      out[dst] = r;
      out[dst + 1] = g3;
      out[dst + 2] = b;
      out[dst + 3] = a;
    }
  }
  return encodeRgbaPng(width, height, out);
}

function cropPng(source: Buffer, x: number, y: number, width: number, height: number) {
  const info = parsePng(source);
  const out = Buffer.alloc(width * height * 4);
  for (let yy = 0; yy < height; yy++) {
    const sy = Math.min(info.height - 1, Math.max(0, y + yy));
    for (let xx = 0; xx < width; xx++) {
      const sx = Math.min(info.width - 1, Math.max(0, x + xx));
      const src = (sy * info.width + sx) * 4;
      const dst = (yy * width + xx) * 4;
      info.rgba.copy(out, dst, src, src + 4);
    }
  }
  return encodeRgbaPng(width, height, out);
}

function clusterCenters1D(values: number[], count: number, size: number) {
  if (!values.length) return Array.from({ length: count }, (_, i) => (i + 0.5) * (size / count));
  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  let centers = Array.from({ length: count }, (_, i) => min + ((i + 0.5) * (max - min || size)) / count);
  for (let iteration = 0; iteration < 24; iteration++) {
    const sums = Array(count).fill(0);
    const totals = Array(count).fill(0);
    for (const value of values) {
      let best = 0;
      let bestDistance = Math.abs(value - centers[0]);
      for (let i = 1; i < count; i++) {
        const distance = Math.abs(value - centers[i]);
        if (distance < bestDistance) {
          best = i;
          bestDistance = distance;
        }
      }
      sums[best] += value;
      totals[best]++;
    }
    centers = centers.map((center, i) => totals[i] ? sums[i] / totals[i] : center).sort((a, b) => a - b);
  }
  return centers;
}

function boundsFromCenters(centers: number[], size: number) {
  const sorted = [...centers].sort((a, b) => a - b);
  const bounds = [0];
  for (let i = 0; i < sorted.length - 1; i++) bounds.push(Math.round((sorted[i] + sorted[i + 1]) / 2));
  bounds.push(size);
  return bounds.map((value) => Math.max(0, Math.min(size, value)));
}

function adaptiveSheetBounds(sheet: Buffer, cols: number, rows: number) {
  const info = parsePng(sheet);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = info.rgba[(y * info.width + x) * 4 + 3];
      if (alpha >= 16) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  return {
    xBounds: boundsFromCenters(clusterCenters1D(xs, cols, info.width), info.width),
    yBounds: boundsFromCenters(clusterCenters1D(ys, rows, info.height), info.height),
  };
}

function resizePng(source: Buffer, width: number, height: number) {
  const info = parsePng(source);
  if (info.width === width && info.height === height) return source;
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(info.height - 1, ((y + 0.5) / height) * info.height - 0.5);
    for (let x = 0; x < width; x++) {
      const sx = Math.min(info.width - 1, ((x + 0.5) / width) * info.width - 0.5);
      const dst = (y * width + x) * 4;
      const [r, g3, b, a] = samplePremultipliedBilinear(info, sx, sy);
      out[dst] = r;
      out[dst + 1] = g3;
      out[dst + 2] = b;
      out[dst + 3] = a;
    }
  }
  return encodeRgbaPng(width, height, out);
}

function removeFlatBackground(source: Buffer) {
  const info = parsePng(source);
  const samples: [number, number, number][] = [
    [0, 0, 0],
    [info.width - 1, 0, 0],
    [0, info.height - 1, 0],
    [info.width - 1, info.height - 1, 0],
  ].map(([x, y]) => {
    const i = (y * info.width + x) * 4;
    return [info.rgba[i], info.rgba[i + 1], info.rgba[i + 2]];
  }) as [number, number, number][];
  const out = Buffer.from(info.rgba);
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const stack: number[] = [];
  const isBackgroundLike = (pixel: number) => {
    const i = pixel * 4;
    const alpha = info.rgba[i + 3];
    if (alpha < 16) return true;
    const r = info.rgba[i];
    const g2 = info.rgba[i + 1];
    const b = info.rgba[i + 2];
    const max = Math.max(r, g2, b);
    const min = Math.min(r, g2, b);
    const nearCorner = samples.some(([sr, sg, sb]) => Math.abs(r - sr) + Math.abs(g2 - sg) + Math.abs(b - sb) < 92);
    const nearWhite = r > 218 && g2 > 218 && b > 218 && max - min < 38;
    const nearChecker = Math.abs(r - g2) < 14 && Math.abs(g2 - b) < 14 && r > 196;
    return nearCorner || nearWhite || nearChecker;
  };
  const push = (x: number, y: number) => {
    const pixel = y * info.width + x;
    if (!visited[pixel] && isBackgroundLike(pixel)) {
      visited[pixel] = 1;
      stack.push(pixel);
    }
  };
  for (let x = 0; x < info.width; x++) {
    push(x, 0);
    push(x, info.height - 1);
  }
  for (let y = 0; y < info.height; y++) {
    push(0, y);
    push(info.width - 1, y);
  }
  while (stack.length) {
    const pixel = stack.pop()!;
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    if (x > 0) push(x - 1, y);
    if (x < info.width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < info.height - 1) push(x, y + 1);
  }
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    if (visited[pixel]) {
      out[pixel * 4 + 3] = 0;
    }
  }
  return encodeRgbaPng(info.width, info.height, out);
}

function gridForCount(count: LineStaticCount) {
  if (count === 8) return { cols: 4, rows: 2 };
  if (count === 16) return { cols: 4, rows: 4 };
  if (count === 24) return { cols: 6, rows: 4 };
  if (count === 32) return { cols: 8, rows: 4 };
  return { cols: 8, rows: 5 };
}

function analyzeSheetCell(index: number, cell: Buffer): SheetCellReport {
  const info = parsePng(cell);
  const { box } = bbox(info);
  const metrics = visualMetrics(info);
  const failures: string[] = [];
  if (!box) {
    failures.push(`images/${String(index).padStart(2, '0')}.png: source cell has no detectable subject`);
    return { index, width: info.width, height: info.height, subject_ratio: null, margin_ratio: null, visual_metrics: metrics, qc_passed: false, qc_failures: failures };
  }
  const subjectW = box.maxX - box.minX + 1;
  const subjectH = box.maxY - box.minY + 1;
  const subjectRatio = {
    width: Number((subjectW / info.width).toFixed(6)),
    height: Number((subjectH / info.height).toFixed(6)),
    long_side: Number((Math.max(subjectW / info.width, subjectH / info.height)).toFixed(6)),
  };
  const marginRatio = {
    left: Number((box.minX / info.width).toFixed(6)),
    right: Number(((info.width - 1 - box.maxX) / info.width).toFixed(6)),
    top: Number((box.minY / info.height).toFixed(6)),
    bottom: Number(((info.height - 1 - box.maxY) / info.height).toFixed(6)),
  };
  const name = `images/${String(index).padStart(2, '0')}.png`;
  if (Object.values(marginRatio).some((value) => value < SHEET_MIN_CELL_MARGIN_RATIO)) failures.push(`${name}: source subject is too close to crop edge; min cell margin ratio must be ${SHEET_MIN_CELL_MARGIN_RATIO}`);
  if (subjectRatio.long_side < SHEET_MIN_SUBJECT_LONG_SIDE_RATIO) failures.push(`${name}: source subject is too small for reliable sticker output`);
  if (subjectRatio.long_side > SHEET_MAX_SUBJECT_LONG_SIDE_RATIO) failures.push(`${name}: source subject is too large and may be clipped`);
  if (metrics.main_component_ratio < MIN_MAIN_COMPONENT_RATIO) failures.push(`${name}: background removal split the subject into fragments`);
  if (metrics.fragment_pixel_ratio > MAX_FRAGMENT_PIXEL_RATIO) failures.push(`${name}: background removal left too many loose fragments`);
  if (metrics.interior_hole_ratio > MAX_INTERIOR_HOLE_RATIO) failures.push(`${name}: background removal removed too much of the subject interior`);
  return { index, width: info.width, height: info.height, subject_ratio: subjectRatio, margin_ratio: marginRatio, visual_metrics: metrics, qc_passed: failures.length === 0, qc_failures: failures };
}

function sliceStickerSheet(sheet: Buffer, count: LineStaticCount) {
  const normalizedSheet = resizePng(sheet, SHEET_CANVAS_SIZE, SHEET_CANVAS_SIZE);
  const transparentSheet = removeFlatBackground(normalizedSheet);
  const info = parsePng(transparentSheet);
  const { cols, rows } = gridForCount(count);
  const { xBounds, yBounds } = adaptiveSheetBounds(transparentSheet, cols, rows);
  const images: Buffer[] = [];
  const sourceCellReports: SheetCellReport[] = [];
  const cellReports: SheetCellReport[] = [];
  const qcWarnings: string[] = [];
  for (let index = 0; index < count; index++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = xBounds[col];
    const y = yBounds[row];
    const cellW = Math.max(1, xBounds[col + 1] - x);
    const cellH = Math.max(1, yBounds[row + 1] - y);
    const inset = Math.max(1, Math.floor(Math.min(cellW, cellH) * 0.012));
    const transparentCell = cropPng(transparentSheet, x + inset, y + inset, Math.max(1, cellW - inset * 2), Math.max(1, cellH - inset * 2));
    const sourceReport = analyzeSheetCell(index + 1, transparentCell);
    sourceCellReports.push(sourceReport);
    const normalizedCell = fitToCanvas(transparentCell, SHEET_CELL_NORMALIZED_SIZE, SHEET_CELL_NORMALIZED_SIZE, SHEET_CELL_TARGET_MARGIN);
    images.push(normalizedCell);
    cellReports.push(analyzeSheetCell(index + 1, normalizedCell));
  }
  return {
    normalizedSheet: transparentSheet,
    images,
    cellReports,
    sourceCellReports,
    qcFailures: [
      ...sourceCellReports.flatMap((report) => report.qc_failures.map((failure) => `source sheet rejected: ${failure}`)),
      ...cellReports.flatMap((report) => report.qc_failures),
    ],
    qcWarnings,
  };
}

function renumberSheetReport(report: SheetCellReport, offset: number): SheetCellReport {
  if (!offset) return report;
  const oldName = `images/${String(report.index).padStart(2, '0')}.png`;
  const newIndex = report.index + offset;
  const newName = `images/${String(newIndex).padStart(2, '0')}.png`;
  return {
    ...report,
    index: newIndex,
    qc_failures: report.qc_failures.map((failure) => failure.replace(oldName, newName)),
  };
}

function appendSlicedSheet(
  out: {
    images: Buffer[];
    sourceSheet?: Buffer;
    sourceSheets?: { name: string; data: Buffer }[];
    sheetCellReports?: SheetCellReport[];
    sheetSourceCellReports?: SheetCellReport[];
    sheetQcFailures?: string[];
    sheetQcWarnings?: string[];
  },
  sheet: Buffer,
  count: LineStaticCount,
  batchIndex = 0,
) {
  const sliced = sliceStickerSheet(sheet, count);
  const offset = out.images.length;
  const sourceName = batchIndex > 0 ? `source_sheet_${String(batchIndex).padStart(2, '0')}.png` : 'source_sheet.png';
  out.sourceSheet ||= sliced.normalizedSheet;
  out.sourceSheets ||= [];
  out.sourceSheets.push({ name: sourceName, data: sliced.normalizedSheet });
  out.images.push(...sliced.images);
  out.sheetCellReports ||= [];
  out.sheetSourceCellReports ||= [];
  out.sheetQcFailures ||= [];
  out.sheetQcWarnings ||= [];
  out.sheetCellReports.push(...sliced.cellReports.map((report) => renumberSheetReport(report, offset)));
  out.sheetSourceCellReports.push(...sliced.sourceCellReports.map((report) => renumberSheetReport(report, offset)));
  out.sheetQcFailures.push(...sliced.qcFailures.map((failure) => {
    const match = failure.match(/images\/(\d{2})\.png/);
    if (!match) return failure;
    const oldName = `images/${match[1]}.png`;
    const newName = `images/${String(Number(match[1]) + offset).padStart(2, '0')}.png`;
    return failure.replace(oldName, newName);
  }));
  out.sheetQcWarnings.push(...sliced.qcWarnings);
}

function makeDemoSheet(seed: string, count: LineStaticCount) {
  const width = 1024;
  const height = 1024;
  const { cols, rows } = gridForCount(count);
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const sheet = Buffer.alloc(width * height * 4);
  for (let i = 0; i < count; i++) {
    const sticker = parsePng(makeDemoSticker(seed, i + 1, 512, 512));
    const col = i % cols;
    const row = Math.floor(i / cols);
    const scale = Math.min(cellW * 0.72 / sticker.width, cellH * 0.72 / sticker.height);
    const drawW = Math.max(1, Math.floor(sticker.width * scale));
    const drawH = Math.max(1, Math.floor(sticker.height * scale));
    const left = col * cellW + Math.floor((cellW - drawW) / 2);
    const top = row * cellH + Math.floor((cellH - drawH) / 2);
    for (let y = 0; y < drawH; y++) {
      const sy = Math.min(sticker.height - 1, Math.floor(y / scale));
      for (let x = 0; x < drawW; x++) {
        const sx = Math.min(sticker.width - 1, Math.floor(x / scale));
        const src = (sy * sticker.width + sx) * 4;
        const alpha = sticker.rgba[src + 3] / 255;
        if (alpha <= 0) continue;
        const dst = ((top + y) * width + left + x) * 4;
        sheet[dst] = sticker.rgba[src];
        sheet[dst + 1] = sticker.rgba[src + 1];
        sheet[dst + 2] = sticker.rgba[src + 2];
        sheet[dst + 3] = sticker.rgba[src + 3];
      }
    }
  }
  return encodeRgbaPng(width, height, sheet);
}

function rgbaPixel(buf: Buffer, width: number, x: number, y: number, color: [number, number, number, number]) {
  if (x < 0 || y < 0 || x >= width) return;
  const i = (y * width + x) * 4;
  buf[i] = color[0];
  buf[i + 1] = color[1];
  buf[i + 2] = color[2];
  buf[i + 3] = color[3];
}

function makeDemoSticker(seed: string, index: number, width = 512, height = 512) {
  const hash = crypto.createHash('sha256').update(`${seed}:${index}`).digest();
  const primary: [number, number, number, number] = [80 + (hash[0] % 120), 80 + (hash[1] % 120), 80 + (hash[2] % 120), 255];
  const accent: [number, number, number, number] = [230, 70 + (hash[3] % 120), 110 + (hash[4] % 100), 255];
  const dark: [number, number, number, number] = [42, 49, 58, 255];
  const rgba = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2 + Math.sin(index) * 8;
  const rx = width * (0.24 + (index % 3) * 0.015);
  const ry = height * 0.27;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const head = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) <= 1;
      const ear1 = Math.abs(x - (cx - rx * 0.55)) + Math.abs(y - (cy - ry * 0.85)) < width * 0.09;
      const ear2 = Math.abs(x - (cx + rx * 0.55)) + Math.abs(y - (cy - ry * 0.85)) < width * 0.09;
      if (head || ear1 || ear2) rgbaPixel(rgba, width, x, y, primary);
      if (((x - (cx - rx * 0.34)) ** 2 + (y - (cy - ry * 0.05)) ** 2) < 55) rgbaPixel(rgba, width, x, y, dark);
      if (((x - (cx + rx * 0.34)) ** 2 + (y - (cy - ry * 0.05)) ** 2) < 55) rgbaPixel(rgba, width, x, y, dark);
      if (Math.abs(y - (cy + ry * 0.26)) < 3 && Math.abs(x - cx) < width * 0.075 + index) rgbaPixel(rgba, width, x, y, dark);
      if (((x - (cx + rx * 0.72)) ** 2 + (y - (cy + ry * 0.45)) ** 2) < 1000) rgbaPixel(rgba, width, x, y, accent);
    }
  }
  return encodeRgbaPng(width, height, rgba);
}

function qcImage(name: string, png: Buffer, expectedWidth: number, expectedHeight: number) {
  const failures: string[] = [];
  let info: PngInfo | null = null;
  try {
    info = parsePng(png);
  } catch (error) {
    failures.push(`${name}: invalid PNG (${error instanceof Error ? error.message : 'unknown'})`);
  }
  if (info) {
    if (info.width !== expectedWidth || info.height !== expectedHeight) failures.push(`${name}: expected ${expectedWidth}x${expectedHeight}, got ${info.width}x${info.height}`);
    if (![2, 6].includes(info.colorType)) failures.push(`${name}: must be RGB or RGBA PNG`);
    if (!info.hasAlpha) failures.push(`${name}: transparent alpha channel is required`);
    const { box, transparentRatio } = bbox(info);
    if (!box || transparentRatio <= 0 || transparentRatio >= 0.98) failures.push(`${name}: transparent background check failed`);
    if (box) {
      const margins = { left: box.minX, right: info.width - 1 - box.maxX, top: box.minY, bottom: info.height - 1 - box.maxY };
      if (Object.values(margins).some((value) => value < LINE_MIN_MARGIN)) failures.push(`${name}: safe margin must be at least ${LINE_MIN_MARGIN}px`);
      if (name.startsWith('images/') && Object.values(margins).some((value) => value < LINE_DELIVERY_MIN_MARGIN)) failures.push(`${name}: delivery margin must be at least ${LINE_DELIVERY_MIN_MARGIN}px; subject is too close to the edge`);
      const metrics = visualMetrics(info);
      if (name.startsWith('images/') && metrics.main_component_ratio < MIN_MAIN_COMPONENT_RATIO) failures.push(`${name}: subject is broken into disconnected pieces after background removal`);
      if (name.startsWith('images/') && metrics.fragment_pixel_ratio > MAX_FRAGMENT_PIXEL_RATIO) failures.push(`${name}: background removal left visible fragments/noise`);
      if (name.startsWith('images/') && metrics.interior_hole_ratio > MAX_INTERIOR_HOLE_RATIO) failures.push(`${name}: background removal damaged the subject interior`);
    }
  }
  if (png.length > LINE_MAX_IMAGE_BYTES) failures.push(`${name}: file exceeds 1MB`);
  return failures;
}

function qcStickerPackConsistency(images: LineStaticImage[]) {
  const failures: string[] = [];
  const metrics = images.map((image) => image.visual_metrics).filter((item): item is VisualQcMetrics => Boolean(item?.subject_ratio));
  if (metrics.length !== images.length) return ['sticker pack: every sticker must contain one detectable main subject'];
  const longSides = metrics.map((item) => item.subject_ratio!.long_side);
  const areas = metrics.map((item) => item.subject_ratio!.area);
  const minLong = Math.min(...longSides);
  const maxLong = Math.max(...longSides);
  if (maxLong - minLong > PACK_MAX_LONG_SIDE_SPREAD) {
    failures.push(`sticker pack: main subject sizes are inconsistent; long-side spread ${(maxLong - minLong).toFixed(3)} exceeds ${PACK_MAX_LONG_SIDE_SPREAD}`);
  }
  const averageArea = areas.reduce((sum, value) => sum + value, 0) / areas.length;
  const worstAreaDeviation = Math.max(...areas.map((value) => Math.abs(value - averageArea) / averageArea));
  if (worstAreaDeviation > PACK_MAX_AREA_DEVIATION) {
    failures.push(`sticker pack: main subject visual area is inconsistent; worst deviation ${worstAreaDeviation.toFixed(3)} exceeds ${PACK_MAX_AREA_DEVIATION}`);
  }
  return failures;
}

function describeImage(workId: string, zipPath: string, png: Buffer, expectedWidth: number, expectedHeight: number, index = 0): LineStaticImage {
  const info = parsePng(png);
  const { box, transparentRatio } = bbox(info);
  const safe = box ? {
    left: Number((box.minX / info.width).toFixed(6)),
    right: Number(((info.width - 1 - box.maxX) / info.width).toFixed(6)),
    top: Number((box.minY / info.height).toFixed(6)),
    bottom: Number(((info.height - 1 - box.maxY) / info.height).toFixed(6)),
  } : null;
  const failures = qcImage(zipPath, png, expectedWidth, expectedHeight);
  const metrics = visualMetrics(info);
  return {
    index,
    zip_path: zipPath,
    url_path: publicImagePath(workId, zipPath),
    width: info.width,
    height: info.height,
    byte_size: png.length,
    sha256: sha256(png),
    transparent_pixel_ratio: Number(transparentRatio.toFixed(6)),
    safe_margin_ratio: safe,
    visual_metrics: metrics,
    qc_passed: failures.length === 0,
    qc_failures: failures,
  };
}

function extractImageBytes(dataUrlOrBase64: string) {
  const comma = dataUrlOrBase64.indexOf(',');
  const base64 = dataUrlOrBase64.startsWith('data:') && comma >= 0 ? dataUrlOrBase64.slice(comma + 1) : dataUrlOrBase64;
  return Buffer.from(base64, 'base64');
}

export function createLineStaticAsset(input: { dataUrl?: string; base64?: string; mimeType?: string; fileName?: string; demo?: boolean; sourceKind?: 'material' | 'sticker_sheet' }) {
  const store = loadStore();
  const isDemo = input.demo === true;
  const mimeType = input.mimeType || 'image/png';
  let bytes = isDemo ? makeDemoSticker('demo-source', 1) : extractImageBytes(input.dataUrl || input.base64 || '');
  if (!bytes.length) throw new Error('ASSET_BYTES_REQUIRED');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) throw new Error('UNSUPPORTED_FORMAT');
  if (bytes.length > 10 * 1024 * 1024) throw new Error('PHOTO_TOO_LARGE');
  const asset: LineStaticAsset = {
    id: nextId('asset', sha256(bytes)),
    file_name: input.fileName || (isDemo ? 'demo-source.png' : 'source.png'),
    mime_type: mimeType,
    byte_size: bytes.length,
    storage_key: '',
    is_demo: isDemo,
    source_kind: input.sourceKind || 'material',
    created_at: now(),
  };
  asset.storage_key = `${asset.id}.${mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'}`;
  fs.mkdirSync(assetDir(), { recursive: true });
  fs.writeFileSync(path.join(assetDir(), asset.storage_key), bytes);
  store.assets[asset.id] = asset;
  persist(store);
  return asset;
}

function openAiImageModel() {
  return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
}

function supportsTransparentBackground(model: string) {
  return !model.includes('gpt-image-2');
}

async function callOpenAI(asset: LineStaticAsset, prompt: string, index: number) {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const source = fs.readFileSync(path.join(assetDir(), asset.storage_key));
  const model = openAiImageModel();
  const form = new FormData();
  form.append('model', model);
  form.append('image', new Blob([new Uint8Array(source)], { type: asset.mime_type }), asset.file_name);
  form.append('prompt', `${prompt}. Use the uploaded source image as the character/material reference. Create exactly one independent LINE static sticker. One complete main subject only, no collage, no grid, no text, no watermark. Keep the entire subject centered and fully inside frame: no hair, hands, ears, feet, props, or outlines may touch or be cropped by the canvas edge. The subject should occupy about 62-68% of the canvas long side with a clean safety margin around every side. Keep transparent edges clean and avoid halos, checkerboard remnants, or loose fragments.${supportsTransparentBackground(model) ? ' Transparent background.' : ' Plain white or very light solid background so the app can remove it cleanly.'}`);
  form.append('n', '1');
  form.append('size', '1024x1024');
  if (supportsTransparentBackground(model)) form.append('background', 'transparent');
  form.append('output_format', 'png');
  form.append('quality', 'medium');
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `OpenAI image request failed (${res.status})`);
  const item = json?.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) {
    const imageRes = await fetch(item.url);
    if (!imageRes.ok) throw new Error(`OpenAI image download failed (${imageRes.status})`);
    return Buffer.from(await imageRes.arrayBuffer());
  }
  throw new Error(`OpenAI image edit ${index} missing image payload`);
}

async function callOpenAISheet(asset: LineStaticAsset, prompt: string, count: LineStaticCount) {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const source = fs.readFileSync(path.join(assetDir(), asset.storage_key));
  const model = openAiImageModel();
  const { cols, rows } = gridForCount(count);
  const form = new FormData();
  form.append('model', model);
  form.append('image', new Blob([new Uint8Array(source)], { type: asset.mime_type }), asset.file_name);
  form.append('prompt', `${prompt}. Use the uploaded source image as the character/material reference. Create one clean sticker sheet with exactly ${count} different LINE static sticker designs arranged in a strict ${cols} columns by ${rows} rows grid on a 1024x1024 canvas. Put exactly one complete sticker in each cell, centered in its own cell. Every cell must keep the same character scale: the visible subject should occupy about 58-66% of the cell long side and leave at least 18% empty safety padding on all four sides. Nothing may touch grid boundaries; do not crop hair, hands, ears, feet, props, or outlines. Keep each pose separated from neighboring cells, no overlapping between cells, no text, no watermark, no frames, no extra panels outside the grid. Use simple clean edges and avoid halos, checkerboard remnants, broken fragments, or partially erased interiors. ${supportsTransparentBackground(model) ? 'Transparent background.' : 'Use a plain white or very light solid background in every cell so the app can remove it cleanly.'}`);
  form.append('n', '1');
  form.append('size', '1024x1024');
  if (supportsTransparentBackground(model)) form.append('background', 'transparent');
  form.append('output_format', 'png');
  form.append('quality', 'medium');
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `OpenAI sticker sheet request failed (${res.status})`);
  const item = json?.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) {
    const imageRes = await fetch(item.url);
    if (!imageRes.ok) throw new Error(`OpenAI sticker sheet download failed (${imageRes.status})`);
    return Buffer.from(await imageRes.arrayBuffer());
  }
  throw new Error('OpenAI sticker sheet missing image payload');
}

async function generateSourceImages(asset: LineStaticAsset, prompt: string, count: LineStaticCount, strategy: GenerationStrategy, batchAssets: LineStaticAsset[] = [asset]) {
  const useLocalDemo = asset.is_demo;
  const out: { provider: LineStaticWork['provider']; images: Buffer[]; warning?: string; sourceSheet?: Buffer; sourceSheets?: { name: string; data: Buffer }[]; requestCount: number; sheetCellReports?: SheetCellReport[]; sheetSourceCellReports?: SheetCellReport[]; sheetQcFailures?: string[]; sheetQcWarnings?: string[] } = { provider: useLocalDemo ? 'local_demo' : 'openai', images: [], requestCount: 0 };
  if (strategy === 'manual_sheet') {
    if (asset.mime_type !== 'image/png') throw new Error('訂閱測試模式目前請上傳 PNG 貼圖表。');
    out.provider = 'manual_sheet';
    appendSlicedSheet(out, fs.readFileSync(path.join(assetDir(), asset.storage_key)), count);
    out.requestCount = 0;
    out.warning = '訂閱測試模式：未呼叫 OpenAI API，只裁切上傳的貼圖表。';
    return out;
  }
  if (strategy === 'manual_batch_sheet') {
    out.provider = 'manual_sheet';
    const batchCount = Math.ceil(count / BATCH_SHEET_SIZE);
    for (let batch = 0; batch < batchCount; batch++) {
      const sheetAsset = batchAssets[batch];
      if (!sheetAsset || sheetAsset.mime_type !== 'image/png') throw new Error('MANUAL_BATCH_SHEET_PNG_REQUIRED');
      appendSlicedSheet(out, fs.readFileSync(path.join(assetDir(), sheetAsset.storage_key)), BATCH_SHEET_SIZE, batch + 1);
    }
    out.requestCount = 0;
    out.warning = '訂閱生成貼圖表模式：未呼叫 OpenAI API，系統只做多張貼圖表裁切、去背、LINE QC 與 ZIP 打包。';
    return out;
  }
  if (useLocalDemo) {
    out.warning = '本機未設定 OPENAI_API_KEY，demo 素材使用本機透明 PNG 產生器。';
    if (strategy === 'sheet_crop') {
      appendSlicedSheet(out, makeDemoSheet(`${asset.id}:${prompt}`, count), count);
      out.requestCount = 1;
    } else if (strategy === 'batch_sheet') {
      const batchCount = Math.ceil(count / BATCH_SHEET_SIZE);
      for (let batch = 0; batch < batchCount; batch++) {
        appendSlicedSheet(out, makeDemoSheet(`${asset.id}:${prompt}:batch:${batch + 1}`, BATCH_SHEET_SIZE), BATCH_SHEET_SIZE, batch + 1);
      }
      out.requestCount = batchCount;
    } else {
      for (let i = 1; i <= count; i++) out.images.push(makeDemoSticker(`${asset.id}:${prompt}`, i));
      out.requestCount = count;
    }
    return out;
  }
  if (strategy === 'sheet_crop') {
    appendSlicedSheet(out, await callOpenAISheet(asset, prompt, count), count);
    out.requestCount = 1;
  } else if (strategy === 'batch_sheet') {
    const batchCount = Math.ceil(count / BATCH_SHEET_SIZE);
    for (let batch = 0; batch < batchCount; batch++) {
      const batchPrompt = `${prompt}. This is batch ${batch + 1} of ${batchCount}; create stickers ${batch * BATCH_SHEET_SIZE + 1}-${Math.min(count, (batch + 1) * BATCH_SHEET_SIZE)} of the full ${count}-sticker pack. Keep the same character design and visual style as the other batches, but use different everyday LINE chat emotions and poses.`;
      appendSlicedSheet(out, await callOpenAISheet(asset, batchPrompt, BATCH_SHEET_SIZE), BATCH_SHEET_SIZE, batch + 1);
    }
    out.requestCount = batchCount;
  } else {
    for (let i = 1; i <= count; i++) {
      const image = await callOpenAI(asset, prompt, i);
      out.images.push(supportsTransparentBackground(openAiImageModel()) ? image : removeFlatBackground(image));
    }
    out.requestCount = count;
  }
  return out;
}

export async function createLineStaticWork(input: { sourceAssetId?: string; sourceAssetIds?: string[]; stylePrompt?: string; stickerCount?: number; title?: string; generationMode?: string }) {
  const store = loadStore();
  const requestedAssetIds = Array.isArray(input.sourceAssetIds) && input.sourceAssetIds.length ? input.sourceAssetIds : input.sourceAssetId ? [input.sourceAssetId] : [];
  const sourceAssets = requestedAssetIds.map((id) => store.assets[id]).filter((asset): asset is LineStaticAsset => Boolean(asset));
  const sourceAsset = sourceAssets[0] || null;
  if (!sourceAsset) return { ok: false as const, status: 404, error: 'ASSET_NOT_FOUND', message: '找不到上傳素材。' };
  const stickerCount = Number(input.stickerCount || 8);
  if (!LINE_STATIC_COUNTS.includes(stickerCount as LineStaticCount)) return { ok: false as const, status: 400, error: 'INVALID_STICKER_COUNT', message: '張數必須是 8、16、24、32 或 40。' };
  const stylePrompt = String(input.stylePrompt || '').trim();
  if (stylePrompt.length < 4) return { ok: false as const, status: 400, error: 'STYLE_PROMPT_REQUIRED', message: '請輸入想要生成的貼圖風格。' };
  const generationStrategy: GenerationStrategy = input.generationMode === 'manual_sheet' ? 'manual_sheet' : input.generationMode === 'manual_batch_sheet' ? 'manual_batch_sheet' : input.generationMode === 'independent' ? 'independent' : input.generationMode === 'batch_sheet' ? 'batch_sheet' : 'sheet_crop';
  if (generationStrategy === 'manual_sheet' && sourceAsset.source_kind !== 'sticker_sheet') return { ok: false as const, status: 400, error: 'STICKER_SHEET_REQUIRED', message: '訂閱測試模式請先上傳已生成的貼圖表。' };
  if (generationStrategy === 'manual_batch_sheet') {
    const requiredSheets = Math.ceil((stickerCount as LineStaticCount) / BATCH_SHEET_SIZE);
    if (sourceAssets.length !== requiredSheets || sourceAssets.some((asset) => asset.source_kind !== 'sticker_sheet')) {
      return { ok: false as const, status: 400, error: 'STICKER_SHEETS_REQUIRED', message: `訂閱分批模式需要 ${requiredSheets} 張 PNG 貼圖表，每張 8 格。` };
    }
  }
  const creditCost = lineStaticCreditCost(stickerCount as LineStaticCount, generationStrategy);
  const wallet = getWallet();
  if (wallet.total < creditCost) return { ok: false as const, status: 402, error: 'INSUFFICIENT_CREDITS', message: '點數不足，請先購買額度。', required: creditCost, available: wallet.total, wallet };
  const workId = nextId('linework', `${sourceAsset.id}:${stylePrompt}:${stickerCount}:${generationStrategy}`);
  const dir = workDir(workId);
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
  const createdAt = now();
  let work: LineStaticWork = {
    id: workId,
    title: input.title || `LINE 靜態貼圖 ${stickerCount} 張`,
    source_asset_id: sourceAsset.id,
    style_prompt: stylePrompt,
    sticker_count: stickerCount as LineStaticCount,
    output_kind: 'line_static_png',
    provider: 'openai',
    generation_strategy: generationStrategy,
    provider_request_count: 0,
    status: 'failed',
    qc_status: 'pending',
    qc_failures: [],
    qc_warnings: [],
    credit_cost: creditCost,
    download_url: null,
    images: [],
    main_image: null,
    tab_image: null,
    generation_manifest_path: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
  try {
    const generated = await generateSourceImages(sourceAsset, stylePrompt, stickerCount as LineStaticCount, generationStrategy, sourceAssets);
    work.provider = generated.provider;
    work.provider_request_count = generated.requestCount;
    if (generated.warning) work.qc_warnings.push(generated.warning);
    if (generated.sheetQcWarnings?.length) work.qc_warnings.push(...generated.sheetQcWarnings);
    const zipEntries: { name: string; data: Buffer }[] = [];
    if (generated.sourceSheets?.length) {
      generated.sourceSheets.forEach((sheet) => fs.writeFileSync(path.join(dir, sheet.name), sheet.data));
    } else if (generated.sourceSheet) {
      fs.writeFileSync(path.join(dir, 'source_sheet.png'), generated.sourceSheet);
    }
    generated.images.forEach((image, index) => {
      const fitted = fitToCanvas(image, LINE_STICKER_WIDTH, LINE_STICKER_HEIGHT, LINE_OUTPUT_MARGIN);
      const fileName = `images/${String(index + 1).padStart(2, '0')}.png`;
      fs.writeFileSync(path.join(dir, fileName), fitted);
      zipEntries.push({ name: fileName, data: fitted });
      work.images.push(describeImage(workId, fileName, fitted, LINE_STICKER_WIDTH, LINE_STICKER_HEIGHT, index + 1));
    });
    const main = fitToCanvas(generated.images[0], LINE_MAIN_SIZE, LINE_MAIN_SIZE);
    const tab = fitToCanvas(generated.images[0], LINE_TAB_WIDTH, LINE_TAB_HEIGHT);
    fs.writeFileSync(path.join(dir, 'main.png'), main);
    fs.writeFileSync(path.join(dir, 'tab.png'), tab);
    work.main_image = describeImage(workId, 'main.png', main, LINE_MAIN_SIZE, LINE_MAIN_SIZE);
    work.tab_image = describeImage(workId, 'tab.png', tab, LINE_TAB_WIDTH, LINE_TAB_HEIGHT);
    const failures = [
      ...(generated.sheetQcFailures || []),
      ...work.images.flatMap((image) => image.qc_failures),
      ...qcStickerPackConsistency(work.images),
      ...(work.main_image?.qc_failures || []),
      ...(work.tab_image?.qc_failures || []),
    ];
    const lineInfo = {
      work_id: work.id,
      output_kind: work.output_kind,
      sticker_count: work.sticker_count,
      sticker_size: { max_width: LINE_STICKER_WIDTH, max_height: LINE_STICKER_HEIGHT },
      main_image: 'main.png',
      tab_image: 'tab.png',
      images: work.images.map((image) => image.zip_path),
      disclaimer: '本服務確認檔案格式符合 LINE 靜態貼圖上傳規格，但不保證 LINE Creators Market 一定審核通過。',
    };
    const sheetSpec = generated.sourceSheet ? {
      canvas_size: `${SHEET_CANVAS_SIZE}x${SHEET_CANVAS_SIZE}`,
      grid: generationStrategy === 'batch_sheet' ? gridForCount(BATCH_SHEET_SIZE) : gridForCount(stickerCount as LineStaticCount),
      batch_size: generationStrategy === 'batch_sheet' ? BATCH_SHEET_SIZE : stickerCount,
      batch_count: generated.sourceSheets?.length || (generated.sourceSheet ? 1 : 0),
      cell_normalized_size: `${SHEET_CELL_NORMALIZED_SIZE}x${SHEET_CELL_NORMALIZED_SIZE}`,
      cell_target_margin_px: SHEET_CELL_TARGET_MARGIN,
      output_margin_px: LINE_OUTPUT_MARGIN,
      delivery_min_margin_px: LINE_DELIVERY_MIN_MARGIN,
      min_cell_margin_ratio: SHEET_MIN_CELL_MARGIN_RATIO,
      subject_long_side_ratio_range: [SHEET_MIN_SUBJECT_LONG_SIDE_RATIO, SHEET_MAX_SUBJECT_LONG_SIDE_RATIO],
      pack_max_long_side_spread: PACK_MAX_LONG_SIDE_SPREAD,
      pack_max_area_deviation: PACK_MAX_AREA_DEVIATION,
      max_interior_hole_ratio: MAX_INTERIOR_HOLE_RATIO,
      min_main_component_ratio: MIN_MAIN_COMPONENT_RATIO,
    } : null;
    const manifest = { ...lineInfo, provider: work.provider, generation_strategy: generationStrategy, provider_request_count: work.provider_request_count, estimated_provider_request_savings: generationStrategy === 'sheet_crop' || generationStrategy === 'batch_sheet' ? Math.max(0, stickerCount - work.provider_request_count) : 0, source_sheet: generated.sourceSheets?.[0]?.name || (generated.sourceSheet ? 'source_sheet.png' : null), source_sheets: generated.sourceSheets?.map((sheet) => sheet.name) || (generated.sourceSheet ? ['source_sheet.png'] : []), sheet_spec: sheetSpec, source_sheet_cell_reports: generated.sheetSourceCellReports || [], sheet_cell_reports: generated.sheetCellReports || [], style_prompt: stylePrompt, images_detail: work.images, qc_failures: failures, qc_warnings: work.qc_warnings };
    const qcReport = `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>LINE Static QC</title><body><h1>${failures.length ? 'QC FAILED' : 'QC PASSED'}</h1><pre>${JSON.stringify({ sheet_spec: sheetSpec, failures, warnings: work.qc_warnings }, null, 2)}</pre></body></html>`;
    fs.writeFileSync(path.join(dir, 'line_sticker_info.json'), JSON.stringify(lineInfo, null, 2));
    fs.writeFileSync(path.join(dir, 'generation_manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(dir, 'qc_report.html'), qcReport);
    zipEntries.unshift({ name: 'tab.png', data: tab });
    zipEntries.unshift({ name: 'main.png', data: main });
    zipEntries.push({ name: 'line_sticker_info.json', data: Buffer.from(JSON.stringify(lineInfo, null, 2)) });
    zipEntries.push({ name: 'generation_manifest.json', data: Buffer.from(JSON.stringify(manifest, null, 2)) });
    zipEntries.push({ name: 'qc_report.html', data: Buffer.from(qcReport) });
    const zip = createStoredZip(zipEntries);
    if (zip.length > LINE_MAX_ZIP_BYTES) failures.push('ZIP exceeds 60MB');
    work.qc_failures = failures;
    work.qc_status = failures.length === 0 ? 'passed' : 'failed';
    work.status = failures.length === 0 ? 'completed' : 'failed';
    if (failures.length === 0) {
      fs.writeFileSync(path.join(dir, 'line-static-stickers.zip'), zip);
      work.download_url = `/api/works/${work.id}/download`;
      const consumed = consumeCredits(creditCost, work.id);
      if (!consumed.ok) throw new Error('點數扣款失敗，請重新整理後再試。');
    }
    work.generation_manifest_path = `/api/works/${work.id}/generated-images?file=generation_manifest.json`;
  } catch (error) {
    work.status = 'failed';
    work.qc_status = 'failed';
    work.error_message = error instanceof Error ? error.message : '生成失敗';
    work.qc_failures = [work.error_message];
  }
  work.updated_at = now();
  store.works[work.id] = work;
  persist(store);
  return { ok: work.status === 'completed', status: work.status === 'completed' ? 201 : 422, work, wallet: getWallet() };
}

export function listLineStaticWorks() {
  return Object.values(loadStore().works).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getLineStaticWork(id: string) {
  return loadStore().works[id] || null;
}

export function readLineStaticFile(workId: string, file: string) {
  const normalized = file.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) return null;
  const filePath = path.join(workDir(workId), normalized);
  if (!filePath.startsWith(workDir(workId))) return null;
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

export function resetLineStaticStore() {
  g.__AUTO_STICKER_LINE_STATIC_STORE__ = blankStore();
  try { fs.rmSync(root(), { recursive: true, force: true }); } catch {}
  persist(g.__AUTO_STICKER_LINE_STATIC_STORE__);
}

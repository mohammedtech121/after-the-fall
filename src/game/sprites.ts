import { TileType } from './types';

/**
 * Procedural Pixel-Art Tile & Prop Atlas Generator.
 * Pre-renders crisp offscreen pixel-art canvases once at startup so rendering runs at 60fps
 * with handcrafted lush post-collapse RPG atmosphere and zero per-frame gradient allocation.
 */

export interface TileAtlas {
  tiles: Record<TileType, HTMLCanvasElement[]>;
  waterFrames: HTMLCanvasElement[];
  toxicFrames: HTMLCanvasElement[];
  coreCircuitFrames: HTMLCanvasElement[];
  pineTreeSprite: HTMLCanvasElement;
  oakTreeSprite: HTMLCanvasElement;
  deadTreeSprite: HTMLCanvasElement;
  lightPunchSprite: HTMLCanvasElement;
  warmGlowSprite: HTMLCanvasElement;
  cyanGlowSprite: HTMLCanvasElement;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function buildRadialSprite(size: number, stops: [number, string][]): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, r * 0.08, r, r, r);
  for (const [offset, col] of stops) g.addColorStop(offset, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function buildGrass(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  // Seamless rich mossy forest green (no dark grid border!)
  px(ctx, 0, 0, 16, 16, '#365831');

  // Soft organic moss mottling
  const patches = [
    [1, 2, 4, 3, '#3c6135'],
    [9, 10, 5, 3, '#30502b'],
    [11, 2, 3, 2, '#3d6436'],
    [2, 11, 4, 3, '#31522d'],
  ] as const;
  for (let i = 0; i < patches.length; i++) {
    const p = patches[(i + variant) % patches.length];
    px(ctx, (p[0] + variant * 3) % 12, (p[1] + variant * 2) % 12, p[2], p[3], p[4]);
  }

  // Crisp pixel grass tufts
  const blades = [
    [2, 4], [8, 2], [13, 7], [5, 12], [11, 13],
  ];
  for (let i = 0; i < blades.length; i++) {
    const bx = (blades[i][0] + variant * 4) % 14 + 1;
    const by = (blades[i][1] + variant * 3) % 13 + 1;
    px(ctx, bx, by, 1, 2, '#4e7c42');
    px(ctx, bx + 1, by + 1, 1, 1, '#294526');
  }
  return c;
}

function buildGrassFlower(variant: number): HTMLCanvasElement {
  const base = buildGrass(variant);
  const ctx = base.getContext('2d')!;
  const flowerColors = ['#edd679', '#e592a6', '#b7e1f0'];
  const col = flowerColors[variant % flowerColors.length];
  px(ctx, 4, 5, 2, 2, col);
  px(ctx, 5, 5, 1, 1, '#fff9db');
  px(ctx, 11, 10, 2, 2, flowerColors[(variant + 1) % 3]);
  px(ctx, 11, 12, 1, 1, '#264223');
  return base;
}

function buildTallGrass(variant: number): HTMLCanvasElement {
  const base = buildGrass(variant);
  const ctx = base.getContext('2d')!;
  for (let i = 0; i < 7; i++) {
    const x = (i * 3 + variant * 2) % 14 + 1;
    const y = (i * 5 + variant) % 12 + 2;
    px(ctx, x, y, 1, 3, '#5d8f4a');
    px(ctx, x + 1, y + 1, 1, 2, '#284223');
  }
  return base;
}

function buildDirt(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  // Seamless warm packed earth path
  px(ctx, 0, 0, 16, 16, '#70553c');
  px(ctx, (2 + variant * 4) % 11, 2, 5, 3, '#684e36');
  px(ctx, (8 + variant * 3) % 10, 9, 5, 3, '#795d43');
  px(ctx, (5 + variant * 2) % 12, 6, 3, 2, '#644b34');
  // Subtle natural pebbles (not repetitive high-contrast dots)
  if (variant === 0) {
    px(ctx, 4, 12, 2, 1, '#876c52');
    px(ctx, 11, 4, 1, 1, '#58412d');
  } else if (variant === 1) {
    px(ctx, 12, 11, 2, 1, '#85694f');
    px(ctx, 3, 5, 1, 1, '#59422e');
  } else {
    px(ctx, 7, 13, 1, 1, '#8a7056');
  }
  return c;
}

function buildRoad(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#40454b');
  px(ctx, 2, 3, 3, 2, '#393e44');
  px(ctx, 10, 11, 4, 2, '#484d54');
  if (variant === 0) {
    px(ctx, 4, 7, 5, 1, '#292d32');
    px(ctx, 8, 8, 2, 1, '#292d32');
    px(ctx, 6, 6, 1, 2, '#4d783f');
  } else if (variant === 1) {
    px(ctx, 7, 3, 2, 4, '#948b5e'); // weathered lane stripe
  } else {
    px(ctx, 3, 12, 4, 1, '#2a2e33');
    px(ctx, 11, 4, 2, 2, '#4d783f');
  }
  return c;
}

function buildSidewalk(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#6a6d72');
  px(ctx, 0, 0, 16, 1, '#53565b');
  px(ctx, 0, 8, 16, 1, '#53565b');
  px(ctx, 0, 0, 1, 8, '#53565b');
  px(ctx, 8, 8, 1, 8, '#53565b');
  px(ctx, 1, 1, 14, 1, '#7c7f85');
  if (variant === 1) {
    px(ctx, 11, 2, 2, 2, '#4e7840');
  }
  return c;
}

function buildWater(frame: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#295b87');
  const shift = frame * 3;
  px(ctx, (2 + shift) % 13, 3, 4, 1, '#4b89ba');
  px(ctx, (9 - shift + 16) % 13, 8, 4, 1, '#4b89ba');
  px(ctx, (5 + shift) % 12, 13, 3, 1, '#72b0de');
  if (frame === 1) {
    px(ctx, 10, 4, 4, 3, '#3e8045');
    px(ctx, 11, 5, 2, 1, '#5ca858');
    px(ctx, 12, 4, 1, 1, '#eba0be');
  }
  return c;
}

function buildBridge(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#704d2f');
  for (let x = 0; x < 16; x += 4) {
    px(ctx, x, 0, 3, 16, x % 8 === 0 ? '#805a38' : '#6c4a2d');
    px(ctx, x + 3, 0, 1, 16, '#452d19');
  }
  px(ctx, 0, 0, 16, 2, '#966d48');
  px(ctx, 0, 14, 16, 2, '#543821');
  return c;
}

function buildRuinFloor(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#5c6259');
  px(ctx, 1, 1, 6, 6, '#6b7367');
  px(ctx, 9, 1, 6, 6, '#636b5f');
  px(ctx, 1, 9, 6, 6, '#636b5f');
  px(ctx, 9, 9, 6, 6, '#6f776b');
  px(ctx, 7, 0, 2, 16, '#406038');
  px(ctx, 0, 7, 16, 2, '#435d3c');
  if (variant === 1) px(ctx, 3, 3, 2, 2, '#4f7a44');
  return c;
}

function buildIndustrialFloor(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#47433e');
  px(ctx, 0, 0, 16, 1, '#59534c');
  px(ctx, 0, 15, 16, 1, '#332f2b');
  px(ctx, 0, 0, 1, 16, '#59534c');
  px(ctx, 2, 2, 1, 1, '#6e655c');
  px(ctx, 13, 2, 1, 1, '#6e655c');
  px(ctx, 2, 13, 1, 1, '#6e655c');
  px(ctx, 13, 13, 1, 1, '#6e655c');
  if (variant === 1) px(ctx, 5, 6, 6, 3, '#5c4632');
  return c;
}

function buildToxic(frame: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#27592c');
  px(ctx, 1, 1, 14, 14, '#367a34');
  const bx = (3 + frame * 4) % 11 + 2;
  const by = (4 + frame * 3) % 10 + 2;
  px(ctx, bx, by, 3, 3, '#72c949');
  px(ctx, bx + 1, by + 1, 1, 1, '#c9ff8a');
  px(ctx, (11 - frame * 2) % 12 + 1, 11, 2, 2, '#5cb03c');
  return c;
}

function buildCoreFloor(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#1a242b');
  px(ctx, 1, 1, 14, 14, '#212e36');
  px(ctx, 2, 2, 12, 1, '#2b3d47');
  if (variant === 1) px(ctx, 7, 7, 2, 2, '#2d757a');
  return c;
}

function buildCoreCircuit(frame: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#17232b');
  px(ctx, 1, 1, 14, 14, '#1d2d36');
  const glow = frame === 0 ? '#32a8a4' : frame === 1 ? '#57e3db' : '#3ec7c0';
  px(ctx, 7, 0, 2, 16, glow);
  px(ctx, 0, 7, 16, 2, glow);
  px(ctx, 6, 6, 4, 4, '#8ff7ef');
  return c;
}

// Timber cabin walls: solid planks on most variants, cozy window on variant 1 only!
function buildWallWood(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#5c3f29');
  for (let y = 0; y < 16; y += 4) {
    px(ctx, 0, y, 16, 3, y % 8 === 0 ? '#6e4d34' : '#65462f');
    px(ctx, 0, y + 3, 16, 1, '#3d2819');
  }
  // Vertical timber posts on edges
  px(ctx, 0, 0, 2, 16, '#4a321f');
  px(ctx, 14, 0, 2, 16, '#4a321f');

  if (variant === 1) {
    // Single warm lantern-lit cabin window
    px(ctx, 4, 4, 8, 7, '#291e17');
    px(ctx, 5, 5, 6, 5, '#e0a448');
    px(ctx, 5, 5, 3, 2, '#f5d284');
    px(ctx, 7, 5, 1, 5, '#3b281a');
    px(ctx, 5, 7, 6, 1, '#3b281a');
  } else if (variant === 2) {
    // Patched board / wooden bracing
    px(ctx, 3, 5, 10, 2, '#7d5a3e');
    px(ctx, 4, 9, 8, 2, '#523723');
  }
  return c;
}

function buildWallConcrete(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#585c62');
  px(ctx, 0, 0, 16, 2, '#70757d');
  // Gridded ruined apartment windows (reference city!)
  px(ctx, 2, 4, 5, 4, '#242b33');
  px(ctx, 9, 4, 5, 4, '#242b33');
  px(ctx, 2, 10, 5, 4, '#242b33');
  px(ctx, 9, 10, 5, 4, '#2f3d47');
  px(ctx, 3, 5, 2, 1, '#5f7687');
  px(ctx, 10, 11, 2, 1, '#5f7687');
  if (variant === 1) {
    px(ctx, 7, 2, 2, 9, '#42703a'); // creeping vine
    px(ctx, 6, 6, 2, 3, '#528546');
  }
  return c;
}

function buildWallBrick(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#4f544e');
  for (let y = 0; y < 16; y += 4) {
    const off = (y / 4) % 2 === 0 ? 0 : 4;
    for (let x = -4; x < 16; x += 8) {
      px(ctx, x + off + 1, y + 1, 6, 2, '#6d736a');
    }
  }
  px(ctx, 3, 1, 4, 3, '#46703c');
  return c;
}

function buildWallMetal(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#4d4a47');
  for (let x = 0; x < 16; x += 4) {
    px(ctx, x, 0, 2, 16, '#615c57');
    px(ctx, x + 2, 0, 2, 16, '#3d3a37');
  }
  px(ctx, 0, 12, 16, 3, '#b8832c');
  px(ctx, 2, 12, 3, 3, '#2b2826');
  px(ctx, 10, 12, 3, 3, '#2b2826');
  return c;
}

function buildWallCore(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#121a21');
  px(ctx, 1, 1, 14, 14, '#1e2c36');
  px(ctx, 2, 2, 12, 2, '#344c5c');
  px(ctx, 6, 5, 4, 8, '#3cc4bd');
  px(ctx, 7, 6, 2, 6, '#9cfcf5');
  return c;
}

function buildRoofCabin(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#485866');
  for (let x = 0; x < 16; x += 3) {
    px(ctx, x, 0, 1, 16, '#617688');
    px(ctx, x + 2, 0, 1, 16, '#36434f');
  }
  px(ctx, 0, 14, 16, 2, '#27313b');
  if (variant === 1) {
    px(ctx, 4, 4, 5, 4, '#70523c'); // patched rust sheet
    px(ctx, 5, 5, 3, 2, '#856248');
  }
  return c;
}

function buildRoofCity(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#3c4045');
  px(ctx, 1, 1, 14, 14, '#4b5057');
  px(ctx, 3, 3, 4, 4, '#363b40');
  px(ctx, 4, 4, 2, 2, '#5d646e');
  px(ctx, 10, 10, 3, 3, '#456b39');
  return c;
}

function buildRoofFactory(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#473e38');
  for (let y = 0; y < 16; y += 4) {
    px(ctx, 0, y, 16, 2, '#5c5048');
  }
  px(ctx, 5, 3, 6, 6, '#302b28');
  px(ctx, 6, 4, 4, 4, '#735742');
  return c;
}

function buildFence(): HTMLCanvasElement {
  const base = buildGrass(0);
  const ctx = base.getContext('2d')!;
  px(ctx, 0, 7, 16, 2, '#8a6c4d');
  px(ctx, 0, 11, 16, 2, '#6e543a');
  for (let x = 1; x < 16; x += 5) {
    px(ctx, x, 4, 2, 10, '#a3825f');
    px(ctx, x, 4, 2, 2, '#bd9c77');
  }
  return base;
}

function buildCliff(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#2d2926');
  px(ctx, 1, 1, 14, 9, '#4a433d');
  px(ctx, 2, 2, 12, 4, '#5e564e');
  px(ctx, 2, 11, 5, 4, '#3b3530');
  px(ctx, 9, 10, 5, 5, '#3d3732');
  return c;
}

// Oversized 24x28 Lush Pixel Pine Tree (drawn overlapping above tile for depth!)
function buildPineTreeSprite(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(24, 28);
  // Ground shadow
  px(ctx, 5, 24, 14, 3, 'rgba(8,14,10,0.45)');
  // Trunk
  px(ctx, 10, 20, 4, 6, '#4d311d');
  px(ctx, 11, 20, 1, 6, '#69452a');
  // Bottom tier
  px(ctx, 2, 17, 20, 5, '#1b3822');
  px(ctx, 4, 15, 16, 5, '#254d2b');
  // Mid tier
  px(ctx, 4, 11, 16, 5, '#214727');
  px(ctx, 6, 9, 12, 5, '#2f6135');
  // Top crown
  px(ctx, 7, 5, 10, 5, '#39733d');
  px(ctx, 9, 2, 6, 4, '#4c8f4c');
  px(ctx, 11, 0, 2, 3, '#68ab5d');
  // Sunlit pixel highlights
  px(ctx, 6, 16, 3, 1, '#4c8f4c');
  px(ctx, 8, 11, 3, 1, '#5ca356');
  px(ctx, 14, 14, 2, 1, '#417d43');
  return c;
}

// Oversized 24x28 Lush Pixel Oak Tree
function buildOakTreeSprite(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(24, 28);
  px(ctx, 4, 24, 16, 3, 'rgba(8,14,10,0.45)');
  // Sturdy trunk & roots
  px(ctx, 9, 18, 6, 8, '#543822');
  px(ctx, 10, 18, 2, 7, '#704d31');
  px(ctx, 8, 23, 8, 2, '#472e1b');
  // Deep shadow underside of canopy
  px(ctx, 2, 11, 20, 9, '#1f4225');
  // Mid lush foliage
  px(ctx, 3, 6, 18, 11, '#2d5e31');
  px(ctx, 5, 3, 14, 10, '#3d783d');
  // Bright sunlit leaf clusters
  px(ctx, 6, 4, 7, 5, '#54964c');
  px(ctx, 13, 6, 5, 4, '#4f8c47');
  px(ctx, 8, 3, 4, 2, '#73b560');
  px(ctx, 4, 10, 4, 3, '#478242');
  return c;
}

function buildDeadTreeSprite(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(24, 28);
  px(ctx, 6, 24, 12, 3, 'rgba(8,10,10,0.4)');
  px(ctx, 10, 9, 4, 17, '#4d4138');
  px(ctx, 5, 11, 6, 2, '#4d4138');
  px(ctx, 13, 13, 6, 2, '#4d4138');
  px(ctx, 4, 8, 2, 4, '#5e5045');
  px(ctx, 18, 10, 2, 4, '#5e5045');
  px(ctx, 11, 5, 2, 5, '#5e5045');
  return c;
}

function buildWreckCar(): HTMLCanvasElement {
  const base = buildRoad(0);
  const ctx = base.getContext('2d')!;
  px(ctx, 1, 12, 14, 3, 'rgba(0,0,0,0.45)');
  px(ctx, 1, 4, 14, 9, '#6e4738');
  px(ctx, 2, 5, 12, 7, '#875744');
  px(ctx, 4, 5, 6, 5, '#3b4f59');
  px(ctx, 5, 6, 4, 3, '#526f7d');
  px(ctx, 11, 6, 2, 3, '#593427');
  px(ctx, 2, 11, 3, 2, '#1f2124');
  px(ctx, 11, 11, 3, 2, '#1f2124');
  return base;
}

function buildCoreGate(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#151f26');
  px(ctx, 2, 0, 12, 16, '#263540');
  for (let y = 2; y < 16; y += 4) {
    px(ctx, 0, y, 16, 2, '#e68c3e');
    px(ctx, 4, y, 8, 1, '#ffd085');
  }
  return c;
}

function buildInteriorFloor(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#594230');
  for (let y = 0; y < 16; y += 4) {
    px(ctx, 0, y, 16, 3, y % 8 === 0 ? '#664c38' : '#5e4532');
    px(ctx, 0, y + 3, 16, 1, '#402e20');
  }
  return c;
}

function buildInteriorWall(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 16);
  px(ctx, 0, 0, 16, 16, '#2e2621');
  px(ctx, 0, 12, 16, 4, '#47392f');
  px(ctx, 2, 3, 12, 7, '#3b312a');
  return c;
}

let cachedAtlas: TileAtlas | null = null;

export function getTileAtlas(): TileAtlas {
  if (cachedAtlas) return cachedAtlas;

  const waterFrames = [buildWater(0), buildWater(1), buildWater(2)];
  const toxicFrames = [buildToxic(0), buildToxic(1), buildToxic(2)];
  const coreCircuitFrames = [buildCoreCircuit(0), buildCoreCircuit(1), buildCoreCircuit(2)];
  const grassVariants = [buildGrass(0), buildGrass(1), buildGrass(2)];
  const industrialVariants = [buildIndustrialFloor(0), buildIndustrialFloor(1)];

  cachedAtlas = {
    waterFrames,
    toxicFrames,
    coreCircuitFrames,
    pineTreeSprite: buildPineTreeSprite(),
    oakTreeSprite: buildOakTreeSprite(),
    deadTreeSprite: buildDeadTreeSprite(),
    lightPunchSprite: buildRadialSprite(96, [
      [0, 'rgba(0,0,0,0.96)'],
      [0.55, 'rgba(0,0,0,0.55)'],
      [1, 'rgba(0,0,0,0)'],
    ]),
    warmGlowSprite: buildRadialSprite(96, [
      [0, 'rgba(255, 196, 92, 0.34)'],
      [0.5, 'rgba(245, 158, 66, 0.14)'],
      [1, 'rgba(245, 158, 66, 0)'],
    ]),
    cyanGlowSprite: buildRadialSprite(96, [
      [0, 'rgba(94, 234, 212, 0.38)'],
      [0.5, 'rgba(56, 189, 178, 0.14)'],
      [1, 'rgba(56, 189, 178, 0)'],
    ]),
    tiles: {
      grass: grassVariants,
      grass_flower: [buildGrassFlower(0), buildGrassFlower(1), buildGrassFlower(2)],
      tall_grass: [buildTallGrass(0), buildTallGrass(1)],
      dirt: [buildDirt(0), buildDirt(1), buildDirt(2)],
      road: [buildRoad(0), buildRoad(1), buildRoad(2)],
      sidewalk: [buildSidewalk(0), buildSidewalk(1)],
      water: waterFrames,
      bridge: [buildBridge()],
      ruin_floor: [buildRuinFloor(0), buildRuinFloor(1)],
      industrial_floor: industrialVariants,
      toxic: toxicFrames,
      core_floor: [buildCoreFloor(0), buildCoreFloor(1)],
      core_circuit: coreCircuitFrames,
      wall_wood: [buildWallWood(0), buildWallWood(1), buildWallWood(2)],
      wall_brick: [buildWallBrick()],
      wall_concrete: [buildWallConcrete(0), buildWallConcrete(1)],
      wall_metal: [buildWallMetal()],
      wall_core: [buildWallCore()],
      roof_cabin: [buildRoofCabin(0), buildRoofCabin(1)],
      roof_city: [buildRoofCity()],
      roof_factory: [buildRoofFactory()],
      fence: [buildFence()],
      cliff: [buildCliff()],
      // Tree tiles render grass/industrial base underneath; oversized canopy sprite draws in depth pass!
      tree_pine: grassVariants,
      tree_oak: grassVariants,
      tree_dead: industrialVariants,
      wreck_car: [buildWreckCar()],
      core_gate: [buildCoreGate()],
      interior_floor: [buildInteriorFloor()],
      interior_wall: [buildInteriorWall()],
    },
  };

  return cachedAtlas;
}

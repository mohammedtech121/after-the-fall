import { getWeaponLevel, WEAPON_CATALOG } from './combat';
import { CRAFTING_RECIPES, ITEM_CATALOG, REGION_META } from './quests';
import {
  ControlMode,
  CraftingRecipe,
  GameSettings,
  InventoryMap,
  ItemId,
  MAX_BACKPACK_SLOTS,
  ParticleDensity,
  PlayerState,
  QuestState,
  RegionId,
  RestorationNode,
  SaveData,
  SaveSlotId,
  SaveSlotMeta,
  TeleporterId,
  TeleporterStation,
  TileType,
  UpgradeId,
  WeaponId,
  WorldStats,
} from './types';
import { CORE_RELAYS_REQUIRED, getRegionAtWorld, TILE_SIZE } from './worldData';

export const SAVE_STORAGE_KEY = 'bounce_back_after_the_fall_save_v1';
export const SAVE_SLOT_PREFIX = 'bounce_back_after_the_fall_slot_v1_';
export const SAVE_SLOTS: SaveSlotId[] = ['autosave', 'slot_1', 'slot_2', 'slot_3'];
export const SETTINGS_STORAGE_KEY = 'after_the_fall_settings_v1';
export const TUTORIAL_STORAGE_KEY = 'after_the_fall_tutorial_seen_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.85,
  musicVolume: 0.42,
  sfxVolume: 0.65,
  muted: false,
  brightness: 1.0,
  screenScale: 1.0,
  weatherEnabled: true,
  dayNightSpeed: 1,
  controlMode: 'auto',
  showQuestMarkers: true,
  showDamageNumbers: true,
  cameraShake: true,
  particleDensity: 'auto',
  visualEffects: 'high',
};

export function loadStoredSettings(): GameSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_SETTINGS };
    }
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveStoredSettings(settings: GameSettings): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function hasCompletedTutorial(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTutorialCompleted(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
  } catch {
    // Ignore storage quota errors
  }
}

export function resolveEffectiveControlMode(
  controlMode: ControlMode,
  isCoarsePointer: boolean,
  viewportWidth: number
): 'desktop' | 'mobile' {
  if (controlMode === 'desktop') return 'desktop';
  if (controlMode === 'mobile') return 'mobile';
  return isCoarsePointer || viewportWidth <= 920 ? 'mobile' : 'desktop';
}

export function getEffectiveParticleLimit(density: ParticleDensity, isMobile: boolean): number {
  if (density === 'low') return 70;
  if (density === 'high') return 220;
  return isMobile ? 95 : 170;
}

const SOLID_TILES = new Set<TileType>([
  'water',
  'wall_wood',
  'wall_brick',
  'wall_concrete',
  'wall_metal',
  'wall_core',
  'roof_cabin',
  'roof_city',
  'roof_factory',
  'fence',
  'cliff',
  'tree_pine',
  'tree_oak',
  'tree_dead',
  'wreck_car',
  'core_gate',
  'interior_wall',
]);

export function isTileSolid(tile: TileType, coreGateUnlocked = false): boolean {
  if (tile === 'core_gate' && coreGateUnlocked) return false;
  return SOLID_TILES.has(tile);
}

export function isTileHazardous(tile: TileType): boolean {
  return tile === 'toxic';
}

export interface TileGridAccessor {
  width: number;
  height: number;
  tiles: TileType[];
}

/**
 * Smooth circle-vs-tilemap collision resolution with axis sliding
 * so the player and enemies glide smoothly around corners without snagging.
 */
export function resolveCircleTileCollision(
  x: number,
  y: number,
  radius: number,
  grid: TileGridAccessor,
  coreGateUnlocked = false
): { x: number; y: number; collided: boolean } {
  let nx = Math.max(radius, Math.min(grid.width * TILE_SIZE - radius, x));
  let ny = Math.max(radius, Math.min(grid.height * TILE_SIZE - radius, y));
  let collided = nx !== x || ny !== y;

  const minTx = Math.max(0, Math.floor((nx - radius) / TILE_SIZE) - 1);
  const maxTx = Math.min(grid.width - 1, Math.floor((nx + radius) / TILE_SIZE) + 1);
  const minTy = Math.max(0, Math.floor((ny - radius) / TILE_SIZE) - 1);
  const maxTy = Math.min(grid.height - 1, Math.floor((ny + radius) / TILE_SIZE) + 1);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const tile = grid.tiles[ty * grid.width + tx];
      if (!isTileSolid(tile, coreGateUnlocked)) continue;

      const rx = tx * TILE_SIZE;
      const ry = ty * TILE_SIZE;
      const closestX = Math.max(rx, Math.min(nx, rx + TILE_SIZE));
      const closestY = Math.max(ry, Math.min(ny, ry + TILE_SIZE));

      const dx = nx - closestX;
      const dy = ny - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < radius * radius) {
        collided = true;
        if (distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          nx += (dx / dist) * overlap;
          ny += (dy / dist) * overlap;
        } else {
          // Center inside tile — push out along shallowest axis
          const centerTx = rx + TILE_SIZE * 0.5;
          const centerTy = ry + TILE_SIZE * 0.5;
          const ox = nx - centerTx;
          const oy = ny - centerTy;
          if (Math.abs(ox) > Math.abs(oy)) {
            nx = ox >= 0 ? rx + TILE_SIZE + radius : rx - radius;
          } else {
            ny = oy >= 0 ? ry + TILE_SIZE + radius : ry - radius;
          }
        }
      }
    }
  }

  return { x: nx, y: ny, collided };
}

/**
 * Stepped raycast against solid tiles so melee slashes and AoE pulses
 * never damage enemies through walls.
 */
export function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  grid: TileGridAccessor,
  coreGateUnlocked = false
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return true;
  const steps = Math.ceil(dist / 12);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sx = x1 + dx * t;
    const sy = y1 + dy * t;
    const tx = Math.floor(sx / TILE_SIZE);
    const ty = Math.floor(sy / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= grid.width || ty >= grid.height) return false;
    const tile = grid.tiles[ty * grid.width + tx];
    // Allow slashing across water/fences? Keep water transparent to attacks, block solid walls/cliffs/buildings!
    if (tile !== 'water' && isTileSolid(tile, coreGateUnlocked)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a target circle lies within a melee swing cone.
 */
export function isTargetInMeleeArc(
  attackerX: number,
  attackerY: number,
  attackAngle: number,
  range: number,
  arcHalfAngle: number,
  targetX: number,
  targetY: number,
  targetRadius: number
): boolean {
  const dx = targetX - attackerX;
  const dy = targetY - attackerY;
  const dist = Math.hypot(dx, dy);
  if (dist > range + targetRadius) return false;
  if (dist <= targetRadius + 8) return true; // Point-blank always hits

  const angleToTarget = Math.atan2(dy, dx);
  let diff = angleToTarget - attackAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= arcHalfAngle;
}

export function canAffordCost(
  inventory: InventoryMap,
  cost: Partial<Record<ItemId, number>>
): boolean {
  for (const [k, qty] of Object.entries(cost)) {
    const needed = qty ?? 0;
    if ((inventory[k as ItemId] ?? 0) < needed) return false;
  }
  return true;
}

export function deductCost(
  inventory: InventoryMap,
  cost: Partial<Record<ItemId, number>>
): InventoryMap {
  const next = { ...inventory };
  for (const [k, qty] of Object.entries(cost)) {
    const id = k as ItemId;
    next[id] = Math.max(0, (next[id] ?? 0) - (qty ?? 0));
  }
  return next;
}

export function addItems(
  inventory: InventoryMap,
  items: Partial<Record<ItemId, number>>
): InventoryMap {
  const next = { ...inventory };
  for (const [k, qty] of Object.entries(items)) {
    const id = k as ItemId;
    next[id] = (next[id] ?? 0) + (qty ?? 0);
  }
  return next;
}

export interface BackpackSlotEntry {
  slotKey: string;
  itemId: ItemId;
  qty: number;
  maxStack: number;
}

export function getItemStackLimit(itemId: ItemId): number {
  return ITEM_CATALOG[itemId]?.maxStack ?? 20;
}

export function getBackpackUsedSlots(inventory: InventoryMap): number {
  let slots = 0;
  for (const [k, rawQty] of Object.entries(inventory)) {
    const qty = rawQty ?? 0;
    if (qty <= 0) continue;
    slots += Math.ceil(qty / getItemStackLimit(k as ItemId));
  }
  return slots;
}

export function getBackpackRemainingSlots(inventory: InventoryMap): number {
  return Math.max(0, MAX_BACKPACK_SLOTS - getBackpackUsedSlots(inventory));
}

export function canAddItemsToBackpack(
  inventory: InventoryMap,
  items: Partial<Record<ItemId, number>>
): boolean {
  const candidate = addItems(inventory, items);
  return getBackpackUsedSlots(candidate) <= MAX_BACKPACK_SLOTS;
}

export function tryAddItemsToBackpack(
  inventory: InventoryMap,
  items: Partial<Record<ItemId, number>>
): { ok: boolean; inventory: InventoryMap; usedSlots: number; reason?: string } {
  const candidate = addItems(inventory, items);
  const candidateSlots = getBackpackUsedSlots(candidate);
  if (candidateSlots > MAX_BACKPACK_SLOTS) {
    return {
      ok: false,
      inventory,
      usedSlots: getBackpackUsedSlots(inventory),
      reason: `Backpack is full (${getBackpackUsedSlots(inventory)}/${MAX_BACKPACK_SLOTS} slots).`,
    };
  }
  return { ok: true, inventory: candidate, usedSlots: candidateSlots };
}

export function buildBackpackSlots(inventory: InventoryMap): BackpackSlotEntry[] {
  const entries: BackpackSlotEntry[] = [];
  for (const [k, rawQty] of Object.entries(inventory)) {
    let remaining = rawQty ?? 0;
    if (remaining <= 0) continue;
    const itemId = k as ItemId;
    const maxStack = getItemStackLimit(itemId);
    let stackIndex = 0;
    while (remaining > 0) {
      const stackQty = Math.min(maxStack, remaining);
      entries.push({
        slotKey: `${itemId}_${stackIndex}`,
        itemId,
        qty: stackQty,
        maxStack,
      });
      remaining -= stackQty;
      stackIndex += 1;
    }
  }
  return entries;
}

export function computeMitigatedDamage(rawDamage: number, defense: number): number {
  if (rawDamage <= 0) return 0;
  const reduction = Math.floor(Math.max(0, defense) * 0.65);
  return Math.max(1, rawDamage - reduction);
}

/**
 * 5-Stage Boss Defeat Timeline (4.3s total, zero graphic gore):
 * 1. 0.0s–1.1s ('stagger'): Destabilizing shudder & energy sparks
 * 2. 1.1s–1.9s ('fall'): Heavy collapse onto arena ground
 * 3. 1.9s–2.9s ('fallen'): Briefly visible resting on ground with embers
 * 4. 2.9s–4.3s ('ash_fade'): Smoothly dissolves into rising pale ash
 * 5. >=4.3s ('vanished'): Fully gone; boss loot chest/rewards materialize
 */
export const BOSS_DEFEAT_TOTAL_DURATION = 4.3;

export interface BossDefeatVisualState {
  stage: 'stagger' | 'fall' | 'fallen' | 'ash_fade' | 'vanished';
  elapsed: number;
  stageProgress: number;
  tiltRadians: number;
  fallOffsetY: number;
  ashDissolve: number; // 0 = solid, 1 = fully turned to ash
  alpha: number;
  shouldReleaseLoot: boolean;
}

export function getBossDefeatState(
  koTimerRemaining: number,
  totalDuration = BOSS_DEFEAT_TOTAL_DURATION
): BossDefeatVisualState {
  const elapsed = Math.max(0, totalDuration - Math.max(0, koTimerRemaining));
  if (elapsed < 1.1) {
    const p = elapsed / 1.1;
    return {
      stage: 'stagger',
      elapsed,
      stageProgress: p,
      tiltRadians: Math.sin(elapsed * 32) * 0.08 * (1 + p * 0.8),
      fallOffsetY: 0,
      ashDissolve: 0,
      alpha: 1,
      shouldReleaseLoot: false,
    };
  }
  if (elapsed < 1.9) {
    const p = (elapsed - 1.1) / 0.8;
    const eased = 1 - Math.pow(1 - p, 3);
    return {
      stage: 'fall',
      elapsed,
      stageProgress: p,
      tiltRadians: eased * 0.72,
      fallOffsetY: eased * 14,
      ashDissolve: 0,
      alpha: 1,
      shouldReleaseLoot: false,
    };
  }
  if (elapsed < 2.9) {
    const p = (elapsed - 1.9) / 1.0;
    return {
      stage: 'fallen',
      elapsed,
      stageProgress: p,
      tiltRadians: 0.72,
      fallOffsetY: 14,
      ashDissolve: 0,
      alpha: 1,
      shouldReleaseLoot: false,
    };
  }
  if (elapsed < totalDuration) {
    const p = Math.min(1, (elapsed - 2.9) / Math.max(0.01, totalDuration - 2.9));
    return {
      stage: 'ash_fade',
      elapsed,
      stageProgress: p,
      tiltRadians: 0.72,
      fallOffsetY: 14,
      ashDissolve: p,
      alpha: Math.max(0, 1 - p * 0.96),
      shouldReleaseLoot: false,
    };
  }
  return {
    stage: 'vanished',
    elapsed: totalDuration,
    stageProgress: 1,
    tiltRadians: 0.72,
    fallOffsetY: 14,
    ashDissolve: 1,
    alpha: 0,
    shouldReleaseLoot: true,
  };
}

export const BOSS_MUSIC_ENGAGE_RADIUS = 385;
export const BOSS_MUSIC_DISENGAGE_RADIUS = 460;

export interface BossMusicTransitionResult {
  nextBossTrackId: string | null;
  activeTrack: RegionId | 'title' | 'boss';
}

/**
 * Pure music transition resolver with enter/exit hysteresis so boss battle
 * soundtracks never flicker, restart unnecessarily, or get stuck after defeat,
 * fleeing, game over, or returning to the title screen.
 */
export function resolveBossMusicState(input: {
  mode: 'title' | 'playing' | 'paused' | 'gameover' | 'victory';
  currentRegion: RegionId;
  activeBossTrackId: string | null;
  nearestLivingBoss: { trackId: string; distance: number } | null;
}): BossMusicTransitionResult {
  if (input.mode === 'title') {
    return { nextBossTrackId: null, activeTrack: 'title' };
  }
  if (input.mode === 'gameover' || input.mode === 'victory') {
    return { nextBossTrackId: null, activeTrack: input.currentRegion };
  }
  if (!input.nearestLivingBoss) {
    return { nextBossTrackId: null, activeTrack: input.currentRegion };
  }

  const { trackId, distance } = input.nearestLivingBoss;
  if (input.activeBossTrackId === trackId) {
    if (distance > BOSS_MUSIC_DISENGAGE_RADIUS) {
      return { nextBossTrackId: null, activeTrack: input.currentRegion };
    }
    return { nextBossTrackId: trackId, activeTrack: 'boss' };
  }

  if (distance <= BOSS_MUSIC_ENGAGE_RADIUS) {
    return { nextBossTrackId: trackId, activeTrack: 'boss' };
  }

  return { nextBossTrackId: null, activeTrack: input.currentRegion };
}

export function canCraftRecipe(
  recipe: CraftingRecipe,
  inventory: InventoryMap,
  ownedUpgrades: UpgradeId[]
): boolean {
  if (recipe.resultType === 'upgrade' && recipe.resultUpgradeId) {
    if (ownedUpgrades.includes(recipe.resultUpgradeId)) return false;
  }
  return canAffordCost(inventory, recipe.ingredients);
}

export function applyCraftRecipe(
  recipeId: string,
  inventory: InventoryMap,
  player: PlayerState
): { ok: boolean; inventory: InventoryMap; player: PlayerState; message: string } {
  const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) {
    return { ok: false, inventory, player, message: 'Recipe not found.' };
  }
  if (!canCraftRecipe(recipe, inventory, player.upgrades)) {
    return { ok: false, inventory, player, message: 'Missing ingredients or already owned.' };
  }

  const nextInv = deductCost(inventory, recipe.ingredients);
  const nextPlayer: PlayerState = {
    ...player,
    upgrades: [...player.upgrades],
  };

  if (recipe.resultType === 'item' && recipe.resultItemId) {
    const added = tryAddItemsToBackpack(nextInv, { [recipe.resultItemId]: recipe.resultQty ?? 1 });
    if (!added.ok) {
      return { ok: false, inventory, player, message: 'Backpack is full (40/40 slots).' };
    }
    return { ok: true, inventory: added.inventory, player: nextPlayer, message: `Crafted ${recipe.name}.` };
  }

  if (recipe.resultType === 'upgrade' && recipe.resultUpgradeId) {
    nextPlayer.upgrades.push(recipe.resultUpgradeId);
    applyUpgradeStats(nextPlayer, recipe.resultUpgradeId);
    return {
      ok: true,
      inventory: nextInv,
      player: nextPlayer,
      message: `Upgraded: ${recipe.name}!`,
    };
  }

  return { ok: false, inventory, player, message: 'Invalid recipe configuration.' };
}

export function applyUpgradeStats(player: PlayerState, upgrade: UpgradeId): void {
  if (upgrade === 'arc_blade_mk2') {
    player.attackDamage += 14;
  } else if (upgrade === 'kinetic_boots') {
    player.moveSpeed = Math.round(player.moveSpeed * 1.22);
  } else if (upgrade === 'aegis_vest') {
    player.maxHp += 45;
    player.hp = Math.min(player.maxHp, player.hp + 45);
    player.trailingHp = player.hp;
  } else if (upgrade === 'energy_capacitor') {
    player.maxEnergy += 40;
    player.energy = Math.min(player.maxEnergy, player.energy + 40);
  }
}

export function useConsumableItem(
  itemId: ItemId,
  inventory: InventoryMap,
  player: PlayerState
): { ok: boolean; inventory: InventoryMap; player: PlayerState; message: string } {
  const def = ITEM_CATALOG[itemId];
  if (!def?.usable || (inventory[itemId] ?? 0) <= 0) {
    return { ok: false, inventory, player, message: 'Cannot use this item.' };
  }

  const nextInv = deductCost(inventory, { [itemId]: 1 });
  const nextPlayer = { ...player };
  if (def.healAmount) {
    nextPlayer.hp = Math.min(nextPlayer.maxHp, nextPlayer.hp + def.healAmount);
    nextPlayer.trailingHp = Math.max(nextPlayer.trailingHp, nextPlayer.hp);
  }
  if (def.staminaAmount) {
    nextPlayer.stamina = Math.min(nextPlayer.maxStamina, nextPlayer.stamina + def.staminaAmount);
  }
  if (def.energyAmount) {
    nextPlayer.energy = Math.min(nextPlayer.maxEnergy, nextPlayer.energy + def.energyAmount);
  }

  return { ok: true, inventory: nextInv, player: nextPlayer, message: `Used ${def.name}.` };
}

export function canRestoreNode(
  node: RestorationNode,
  inventory: InventoryMap,
  playerEnergy: number,
  bossDefeated: boolean
): { ok: boolean; reason?: string } {
  if (node.restored) return { ok: false, reason: 'Already restored.' };
  if (node.kind === 'world_core' && !bossDefeated) {
    return { ok: false, reason: 'Defeat the Aegis Core Sentinel first!' };
  }
  if (playerEnergy < node.energyCost) {
    return { ok: false, reason: `Needs ${node.energyCost} Arc Energy` };
  }
  if (!canAffordCost(inventory, node.cost)) {
    return { ok: false, reason: 'Insufficient resources' };
  }
  return { ok: true };
}

export function shouldUnlockCoreGate(restoredNodes: RestorationNode[]): boolean {
  const nonCoreRestored = restoredNodes.filter((n) => n.restored && n.kind !== 'world_core').length;
  return nonCoreRestored >= CORE_RELAYS_REQUIRED;
}

export function awardPlayerXp(
  player: PlayerState,
  xpGain: number
): { leveledUp: boolean; newLevel: number } {
  player.xp += xpGain;
  let leveledUp = false;
  while (player.xp >= player.nextLevelXp) {
    player.xp -= player.nextLevelXp;
    player.level += 1;
    player.skillPoints += 1;
    player.nextLevelXp = Math.round(player.nextLevelXp * 1.45);
    player.maxHp += 15;
    player.hp = player.maxHp;
    player.trailingHp = player.maxHp;
    player.maxStamina += 10;
    player.stamina = player.maxStamina;
    player.attackDamage += 4;
    leveledUp = true;
  }
  return { leveledUp, newLevel: player.level };
}

export interface QuestProgressContext {
  talkedNpcIds: Set<string>;
  restoredNodeIds: Set<string>;
  discoveredLandmarkIds: Set<string>;
  visitedRegions: Set<string>;
  enemiesDefeated: number;
  bossDefeated: boolean;
  inventory?: Partial<Record<ItemId, number>>;
  blacksmithHammerRecovered?: boolean;
  blacksmithUnlocked?: boolean;
}

/**
 * Pure quest evaluator: synchronizes objective progress, completes quests,
 * unlocks dependent quests, and returns newly completed quests.
 */
export function evaluateQuests(
  quests: QuestState[],
  ctx: QuestProgressContext
): { updatedQuests: QuestState[]; newlyCompleted: QuestState[]; newlyUnlocked: QuestState[] } {
  const next = quests.map((q) => ({
    ...q,
    objectives: q.objectives.map((o) => ({ ...o })),
  }));
  const newlyCompleted: QuestState[] = [];
  const newlyUnlocked: QuestState[] = [];

  // Run 2 passes so chained unlocks immediately reflect already-satisfied conditions
  for (let pass = 0; pass < 2; pass++) {
    for (const q of next) {
      if (q.status !== 'active') continue;

      let allDone = true;
      for (const obj of q.objectives) {
        if (obj.type === 'talk_npc' && obj.targetId && ctx.talkedNpcIds.has(obj.targetId)) {
          obj.current = obj.required;
        } else if (obj.type === 'collect_item' && obj.targetId) {
          const itemId = obj.targetId as ItemId;
          const ownedQty = ctx.inventory?.[itemId] ?? 0;
          if (itemId === 'blacksmith_hammer' && (ctx.blacksmithHammerRecovered || ctx.blacksmithUnlocked)) {
            obj.current = obj.required;
          } else {
            obj.current = Math.min(obj.required, Math.max(obj.current, ownedQty));
          }
        } else if (obj.type === 'unlock_blacksmith' && ctx.blacksmithUnlocked) {
          obj.current = obj.required;
        } else if (
          obj.type === 'restore_node' &&
          obj.targetId &&
          ctx.restoredNodeIds.has(obj.targetId)
        ) {
          obj.current = obj.required;
        } else if (
          obj.type === 'discover_landmark' &&
          obj.targetId &&
          ctx.discoveredLandmarkIds.has(obj.targetId)
        ) {
          obj.current = obj.required;
        } else if (
          obj.type === 'reach_region' &&
          obj.targetId &&
          ctx.visitedRegions.has(obj.targetId)
        ) {
          obj.current = obj.required;
        } else if (obj.type === 'defeat_enemies') {
          obj.current = Math.min(obj.required, ctx.enemiesDefeated);
        } else if (obj.type === 'defeat_boss' && ctx.bossDefeated) {
          obj.current = obj.required;
        }
        if (obj.current < obj.required) allDone = false;
      }

      if (allDone) {
        q.status = 'completed';
        newlyCompleted.push(q);
        if (q.unlocksQuestIds) {
          for (const unlockId of q.unlocksQuestIds) {
            const target = next.find((item) => item.id === unlockId);
            if (target && target.status === 'locked') {
              target.status = 'active';
              newlyUnlocked.push(target);
            }
          }
        }
      }
    }
  }

  return { updatedQuests: next, newlyCompleted, newlyUnlocked };
}

export interface DaylightState {
  phase: 'Dawn' | 'Day' | 'Dusk' | 'Night';
  darknessAlpha: number; // 0 (bright noon) .. 0.60 (midnight)
  tintRgb: [number, number, number];
  nightAggroBoost: number; // 1.0 during day, 1.25 at night
  shadowOffsetX: number; // directional long shadow bias at Dawn/Dusk
  shadowAlpha: number;
}

/**
 * Smooth day/night cycle over 24-hour clock with warm golden Dawn
 * and rich orange-to-violet Dusk sunset transitions.
 */
export function getDaylightState(timeOfDay: number): DaylightState {
  const t = ((timeOfDay % 24) + 24) % 24;
  if (t >= 8 && t < 17) {
    return {
      phase: 'Day',
      darknessAlpha: 0.02,
      tintRgb: [22, 30, 38],
      nightAggroBoost: 1.0,
      shadowOffsetX: 0,
      shadowAlpha: 0.38,
    };
  }
  if (t >= 5 && t < 8) {
    const f = (t - 5) / 3; // 0 at 5am -> 1 at 8am
    return {
      phase: 'Dawn',
      darknessAlpha: 0.52 * (1 - f) + 0.04,
      tintRgb: [Math.round(42 + 68 * f), Math.round(28 + 38 * f), Math.round(58 - 18 * f)],
      nightAggroBoost: 1.05,
      shadowOffsetX: -4 * (1 - f * 0.5),
      shadowAlpha: 0.34,
    };
  }
  if (t >= 17 && t < 20.5) {
    const f = (t - 17) / 3.5; // 0 at 5pm -> 1 at 8:30pm
    // Orange sunset peak around 18:15 blending into violet twilight before Night
    const sunsetPeak = Math.sin(f * Math.PI);
    return {
      phase: 'Dusk',
      darknessAlpha: 0.08 + 0.48 * f,
      tintRgb: [
        Math.round(126 * sunsetPeak + 14 * f + 24 * (1 - f)),
        Math.round(52 * sunsetPeak + 18 * f + 26 * (1 - f)),
        Math.round(64 * f + 42 * sunsetPeak),
      ],
      nightAggroBoost: 1.12,
      shadowOffsetX: 4.5 * (0.4 + f * 0.6),
      shadowAlpha: 0.32,
    };
  }
  return {
    phase: 'Night',
    darknessAlpha: 0.58,
    tintRgb: [12, 18, 36],
    nightAggroBoost: 1.25,
    shadowOffsetX: 0,
    shadowAlpha: 0.25,
  };
}

export function canActivateTeleporter(
  tp: TeleporterStation,
  inventory: InventoryMap,
  playerEnergy: number,
  coreGateUnlocked: boolean
): { ok: boolean; reason?: string } {
  if (tp.activated) return { ok: false, reason: 'Already activated.' };
  if (tp.requiresCoreGate && !coreGateUnlocked) {
    return { ok: false, reason: 'Unseal The Lost Core Gate first.' };
  }
  if (playerEnergy < tp.energyCost) {
    return { ok: false, reason: `Needs ${tp.energyCost} Arc Energy` };
  }
  if (!canAffordCost(inventory, tp.activationCost)) {
    return { ok: false, reason: 'Insufficient activation materials' };
  }
  return { ok: true };
}

export function canTravelToTeleporter(dest: TeleporterStation): { ok: boolean; reason?: string } {
  if (!dest.discovered) {
    return { ok: false, reason: 'Station not yet discovered' };
  }
  if (!dest.activated) {
    return { ok: false, reason: 'Activate this gateway before travelling' };
  }
  return { ok: true };
}

export function serializeSaveData(data: SaveData): string {
  return JSON.stringify(data);
}

export function deserializeSaveData(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== 1 ||
      !parsed.player ||
      typeof parsed.player.x !== 'number' ||
      typeof parsed.player.y !== 'number' ||
      !Number.isFinite(parsed.player.x) ||
      !Number.isFinite(parsed.player.y)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getSaveSlotKey(slotId: SaveSlotId): string {
  return `${SAVE_SLOT_PREFIX}${slotId}`;
}

export function getDefaultSlotLabel(slotId: SaveSlotId): string {
  switch (slotId) {
    case 'autosave':
      return 'Autosave';
    case 'slot_1':
      return 'Save Slot 1';
    case 'slot_2':
      return 'Save Slot 2';
    case 'slot_3':
      return 'Save Slot 3';
  }
}

export function extractSaveSlotMeta(slotId: SaveSlotId, data: SaveData): SaveSlotMeta {
  const region: RegionId = data.interiorId
    ? 'haven'
    : getRegionAtWorld(data.player.x, data.player.y);
  const weaponId: WeaponId = data.player.equippedWeapon ?? 'scrap_blade';
  const weaponRanks = data.player.weaponUpgrades?.[weaponId];
  const weaponLevel = weaponRanks ? getWeaponLevel(weaponRanks) : 1;
  return {
    slotId,
    label: data.slotLabel || getDefaultSlotLabel(slotId),
    savedAt: data.savedAt || new Date().toISOString(),
    region,
    regionName: REGION_META[region]?.name ?? 'The Last Haven',
    level: data.player.level ?? 1,
    weaponId,
    weaponName: WEAPON_CATALOG[weaponId]?.name ?? 'Scrap Blade',
    weaponLevel,
    restoredCount: data.restoredNodeIds?.length ?? 0,
    activatedTeleportersCount: data.activatedTeleporterIds?.length ?? 0,
    timePlayedSec: data.stats?.timePlayedSec ?? 0,
    isAutosave: slotId === 'autosave',
  };
}

export function readSaveSlot(
  slotId: SaveSlotId,
  storage?: Pick<Storage, 'getItem'>
): SaveData | null {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return null;
    const raw = store.getItem(getSaveSlotKey(slotId));
    return deserializeSaveData(raw);
  } catch {
    return null;
  }
}

export function writeSaveSlot(
  slotId: SaveSlotId,
  data: SaveData,
  storage?: Pick<Storage, 'setItem'>
): boolean {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return false;
    const payload = serializeSaveData({
      ...data,
      slotLabel: data.slotLabel ?? getDefaultSlotLabel(slotId),
    });
    store.setItem(getSaveSlotKey(slotId), payload);
    // Keep legacy key mirrored with latest save for compatibility
    store.setItem(SAVE_STORAGE_KEY, payload);
    return true;
  } catch {
    return false;
  }
}

export function deleteSaveSlot(
  slotId: SaveSlotId,
  storage?: Pick<Storage, 'removeItem'>
): void {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return;
    store.removeItem(getSaveSlotKey(slotId));
  } catch {
    // ignore storage errors
  }
}

export function listSaveSlots(
  storage?: Pick<Storage, 'getItem'>
): { slotId: SaveSlotId; data: SaveData | null; meta: SaveSlotMeta | null }[] {
  const results = SAVE_SLOTS.map((slotId) => {
    const data = readSaveSlot(slotId, storage);
    return {
      slotId,
      data,
      meta: data ? extractSaveSlotMeta(slotId, data) : null,
    };
  });

  // Migrate legacy single-slot save into slot_1 view if no slot saves exist yet
  const anySlot = results.some((r) => r.data !== null);
  if (!anySlot) {
    try {
      const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
      const legacy = store ? deserializeSaveData(store.getItem(SAVE_STORAGE_KEY)) : null;
      if (legacy) {
        const s1 = results.find((r) => r.slotId === 'slot_1');
        if (s1) {
          s1.data = legacy;
          s1.meta = extractSaveSlotMeta('slot_1', legacy);
        }
      }
    } catch {
      // ignore
    }
  }
  return results;
}

export function getLatestValidSave(
  storage?: Pick<Storage, 'getItem'>
): { slotId: SaveSlotId; data: SaveData; meta: SaveSlotMeta } | null {
  const slots = listSaveSlots(storage).filter(
    (s): s is { slotId: SaveSlotId; data: SaveData; meta: SaveSlotMeta } =>
      s.data !== null && s.meta !== null
  );
  if (slots.length === 0) return null;
  slots.sort((a, b) => {
    const ta = Date.parse(a.data.savedAt || '') || 0;
    const tb = Date.parse(b.data.savedAt || '') || 0;
    return tb - ta;
  });
  return slots[0];
}

export function createInitialStats(totalNodes: number, totalLandmarks: number): WorldStats {
  return {
    enemiesDefeated: 0,
    nodesRestored: 0,
    totalNodes,
    landmarksDiscovered: 1,
    totalLandmarks,
    questsCompleted: 0,
    timePlayedSec: 0,
    talkedNpcIds: [],
    visitedRegions: ['haven'],
    coreGateUnlocked: false,
    unlockedAchievements: [],
    craftedCount: 0,
  };
}

export interface RespawnTarget {
  checkpointId: TeleporterId | null;
  name: string;
  region: RegionId;
  x: number;
  y: number;
}

/**
 * Resolves the player's respawn location on defeat:
 * 1. The last activated/visited teleporter checkpoint (if still valid & activated)
 * 2. Otherwise the latest activated teleporter in the world
 * 3. Otherwise the safe starting camp in The Last Haven
 */
export function resolveRespawnPoint(
  teleporters: TeleporterStation[],
  lastCheckpointId: TeleporterId | null | undefined,
  fallbackSpawn: { x: number; y: number }
): RespawnTarget {
  if (lastCheckpointId) {
    const matched = teleporters.find((tp) => tp.id === lastCheckpointId && tp.activated);
    if (matched) {
      return {
        checkpointId: matched.id,
        name: matched.name,
        region: matched.region,
        x: matched.x,
        y: matched.y + 34,
      };
    }
  }

  const activated = teleporters.filter((tp) => tp.activated);
  if (activated.length > 0) {
    const latest = activated[activated.length - 1];
    return {
      checkpointId: latest.id,
      name: latest.name,
      region: latest.region,
      x: latest.x,
      y: latest.y + 34,
    };
  }

  return {
    checkpointId: null,
    name: 'The Last Haven (Safe Camp)',
    region: 'haven',
    x: fallbackSpawn.x,
    y: fallbackSpawn.y,
  };
}

/**
 * Computes sensible post-respawn vitals so the player recovers cleanly at their checkpoint
 * without wiping progression or spawning critically injured.
 */
export function computeRespawnVitals(player: {
  maxHp: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
}): { hp: number; stamina: number; energy: number } {
  return {
    hp: Math.max(1, Math.round(player.maxHp)),
    stamina: Math.max(1, Math.round(player.maxStamina)),
    energy: Math.min(
      Math.max(1, Math.round(player.maxEnergy)),
      Math.max(Math.round(player.energy), Math.round(player.maxEnergy * 0.5))
    ),
  };
}

/**
 * Determines whether the non-blocking mobile rotate-to-landscape prompt should show.
 * Never blocks desktop, never blocks landscape, and respects manual user dismissal so
 * players are never trapped on unsupported mobile browsers.
 */
export function shouldShowRotateOverlay(input: {
  isMobileDevice: boolean;
  mode: 'title' | 'playing' | 'paused' | 'gameover' | 'victory';
  width: number;
  height: number;
  dismissed: boolean;
}): boolean {
  if (!input.isMobileDevice) return false;
  if (input.mode !== 'playing') return false;
  if (input.dismissed) return false;
  return input.height > input.width;
}


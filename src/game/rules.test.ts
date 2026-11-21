import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAchievements } from './achievements';
import {
  applyCraftRecipe,
  awardPlayerXp,
  BOSS_DEFEAT_TOTAL_DURATION,
  BOSS_MUSIC_DISENGAGE_RADIUS,
  BOSS_MUSIC_ENGAGE_RADIUS,
  buildBackpackSlots,
  canRestoreNode,
  computeMitigatedDamage,
  computeRespawnVitals,
  createInitialStats,
  DEFAULT_SETTINGS,
  deserializeSaveData,
  evaluateQuests,
  getBackpackUsedSlots,
  getBossDefeatState,
  getDaylightState,
  getEffectiveParticleLimit,
  isTargetInMeleeArc,
  isTileSolid,
  resolveBossMusicState,
  resolveCircleTileCollision,
  resolveEffectiveControlMode,
  resolveRespawnPoint,
  serializeSaveData,
  shouldShowRotateOverlay,
  shouldUnlockCoreGate,
  tryAddItemsToBackpack,
  useConsumableItem,
} from './rules';
import { BOSS_SOUNDTRACK_REGISTRY } from './audio';
import {
  ARMOUR_CATALOG,
  canCraftArmour,
  canUnlockWeapon,
  canUpgradeArmour,
  canUpgradeWeaponStat,
  computeCombatStats,
  createInitialAllWeaponUpgrades,
  createInitialArmourUpgrades,
  createInitialSkillRanks,
  getArmourEffectiveStats,
  WEAPON_CATALOG,
} from './combat';
import { createInitialInventory, createInitialQuests } from './quests';
import { createWorldBlueprint, TILE_SIZE } from './worldData';
import { MAX_BACKPACK_SLOTS, PlayerState, SaveData, TileType } from './types';

function makePlayer(): PlayerState {
  return {
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    facing: 'down',
    aimAngle: 0,
    hp: 80,
    maxHp: 100,
    trailingHp: 80,
    stamina: 60,
    maxStamina: 100,
    energy: 50,
    maxEnergy: 100,
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    gold: 30,
    defense: 0,
    attackDamage: 20,
    moveSpeed: 150,
    walkCycle: 0,
    isSprinting: false,
    attackTimer: 0,
    attackDuration: 0.24,
    attackCooldown: 0,
    attackAngle: 0,
    attackStyle: 'basic',
    attackHitIds: [],
    isCharging: false,
    chargeTime: 0,
    energyStrikeCooldown: 0,
    weaponSwitchTimer: 0,
    energyRegenAnimTimer: 0,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    dodgeDirX: 0,
    dodgeDirY: 0,
    invulnTimer: 0,
    hitFlashTimer: 0,
    pulseTimer: 0,
    pulseCooldown: 0,
    squashX: 1,
    squashY: 1,
    footstepDist: 0,
    upgrades: [],
    equippedWeapon: 'scrap_blade',
    unlockedWeapons: ['scrap_blade'],
    weaponUpgrades: createInitialAllWeaponUpgrades(),
    equippedArmour: 'none',
    unlockedArmour: [],
    armourUpgrades: createInitialArmourUpgrades(),
    skills: createInitialSkillRanks(),
    skillPoints: 0,
  };
}

test('world blueprint spawns player and all NPCs on walkable non-solid tiles', () => {
  const world = createWorldBlueprint();
  const ptx = Math.floor(world.playerSpawn.x / TILE_SIZE);
  const pty = Math.floor(world.playerSpawn.y / TILE_SIZE);
  const spawnTile = world.tiles[pty * world.width + ptx];
  assert.equal(isTileSolid(spawnTile), false, `Player spawned on solid tile ${spawnTile}`);

  for (const npc of world.npcs) {
    const tx = Math.floor(npc.x / TILE_SIZE);
    const ty = Math.floor(npc.y / TILE_SIZE);
    const tile = world.tiles[ty * world.width + tx];
    assert.equal(isTileSolid(tile), false, `NPC ${npc.name} spawned on solid tile ${tile}`);
  }
});

test('circle-tile collision blocks solid wall and respects core gate unlock', () => {
  const tiles: TileType[] = [
    'grass', 'grass', 'grass',
    'grass', 'core_gate', 'grass',
    'grass', 'wall_wood', 'grass',
  ];
  const grid = { width: 3, height: 3, tiles };

  // Trying to move into wall_wood at (1, 2) -> pushed out
  const hitWall = resolveCircleTileCollision(1.5 * TILE_SIZE, 2.2 * TILE_SIZE, 10, grid, false);
  assert.equal(hitWall.collided, true);

  // Core gate is solid when locked, walkable when unlocked
  const hitGateLocked = resolveCircleTileCollision(1.5 * TILE_SIZE, 1.5 * TILE_SIZE, 10, grid, false);
  assert.equal(hitGateLocked.collided, true);

  const hitGateOpen = resolveCircleTileCollision(1.5 * TILE_SIZE, 1.5 * TILE_SIZE, 10, grid, true);
  assert.equal(hitGateOpen.collided, false);
});

test('melee arc hit detection matches cone angle and range', () => {
  // Target directly east (angle 0) within range
  assert.equal(isTargetInMeleeArc(0, 0, 0, 50, Math.PI / 3, 40, 0, 12), true);
  // Target directly west (angle PI) while swinging east
  assert.equal(isTargetInMeleeArc(0, 0, 0, 50, Math.PI / 3, -40, 0, 12), false);
  // Target out of range
  assert.equal(isTargetInMeleeArc(0, 0, 0, 50, Math.PI / 3, 90, 0, 12), false);
});

test('crafting deducts resources and applies permanent upgrade stats', () => {
  const player = makePlayer();
  const inv = { ...createInitialInventory(), scrap: 6, parts: 3, crystal: 2 };
  const res = applyCraftRecipe('upgrade_arc_blade', inv, player);
  assert.equal(res.ok, true);
  assert.equal(res.inventory.scrap, 1);
  assert.equal(res.inventory.parts, 1);
  assert.equal(res.inventory.crystal, 1);
  assert.equal(res.player.attackDamage, 34);
  assert.ok(res.player.upgrades.includes('arc_blade_mk2'));

  // Crafting the same upgrade twice is rejected
  const dup = applyCraftRecipe('upgrade_arc_blade', { ...res.inventory, scrap: 10, parts: 10, crystal: 5 }, res.player);
  assert.equal(dup.ok, false);
});

test('consumables restore HP and energy without exceeding max', () => {
  const player = makePlayer();
  player.hp = 60;
  const inv = createInitialInventory();
  const res = useConsumableItem('ration', inv, player);
  assert.equal(res.ok, true);
  assert.equal(res.player.hp, 95);
  assert.equal(res.inventory.ration, 1);
});

test('world restoration eligibility and Core Gate unlock threshold', () => {
  const world = createWorldBlueprint();
  const gen = world.restorationNodes.find((n) => n.id === 'node_haven_generator')!;
  const core = world.restorationNodes.find((n) => n.id === 'node_world_core')!;
  const inv = { ...createInitialInventory(), scrap: 5, crystal: 3, rare_alloy: 2 };

  assert.equal(canRestoreNode(gen, inv, 50, false).ok, true);
  assert.equal(canRestoreNode(gen, inv, 5, false).ok, false);

  // World Core blocked until boss is defeated
  assert.equal(canRestoreNode(core, inv, 100, false).ok, false);
  assert.equal(canRestoreNode(core, inv, 100, true).ok, true);

  // Core gate unlocks at 4 non-core restored relays
  assert.equal(shouldUnlockCoreGate(world.restorationNodes), false);
  for (let i = 0; i < 4; i++) {
    world.restorationNodes[i].restored = true;
  }
  assert.equal(shouldUnlockCoreGate(world.restorationNodes), true);
});

test('quest evaluator completes Wake Up and unlocks Find the Survivors & Light Up Haven', () => {
  const quests = createInitialQuests();
  const result = evaluateQuests(quests, {
    talkedNpcIds: new Set(['npc_mara']),
    restoredNodeIds: new Set(),
    discoveredLandmarkIds: new Set(['lm_haven_plaza']),
    visitedRegions: new Set(['haven']),
    enemiesDefeated: 0,
    bossDefeated: false,
  });

  assert.equal(result.newlyCompleted.length, 1);
  assert.equal(result.newlyCompleted[0].id, 'm1_wake_up');
  const q2 = result.updatedQuests.find((q) => q.id === 'm2_find_survivors')!;
  const s1 = result.updatedQuests.find((q) => q.id === 's1_haven_lights')!;
  assert.equal(q2.status, 'active');
  assert.equal(s1.status, 'active');
});

test('day/night cycle and XP leveling behave predictably', () => {
  assert.equal(getDaylightState(12).phase, 'Day');
  assert.equal(getDaylightState(22).phase, 'Night');
  assert.ok(getDaylightState(22).darknessAlpha > getDaylightState(12).darknessAlpha);

  const player = makePlayer();
  const lvl = awardPlayerXp(player, 120);
  assert.equal(lvl.leveledUp, true);
  assert.equal(player.level, 2);
  assert.equal(player.hp, player.maxHp);
});

test('save data serializes and deserializes cleanly', () => {
  const sample: SaveData = {
    version: 1,
    savedAt: '2026-11-20T04:00:00Z',
    player: {
      x: 500,
      y: 600,
      hp: 90,
      maxHp: 100,
      stamina: 100,
      energy: 80,
      maxEnergy: 100,
      level: 2,
      xp: 15,
      nextLevelXp: 145,
      upgrades: ['kinetic_boots'],
    },
    interiorId: null,
    inventory: createInitialInventory(),
    restoredNodeIds: ['node_haven_generator'],
    collectedNodeIds: ['c_h1'],
    discoveredLandmarkIds: ['lm_haven_plaza'],
    quests: { m1_wake_up: { status: 'completed', currents: [1] } },
      stats: {
        enemiesDefeated: 2,
        nodesRestored: 1,
        totalNodes: 9,
        landmarksDiscovered: 1,
        totalLandmarks: 15,
        questsCompleted: 1,
        timePlayedSec: 120,
        talkedNpcIds: ['npc_mara'],
        visitedRegions: ['haven'],
        coreGateUnlocked: false,
        unlockedAchievements: ['first_spark'],
        craftedCount: 1,
      },
      timeOfDay: 14.5,
      weather: 'clear',
      settings: {
        ...DEFAULT_SETTINGS,
        musicVolume: 0.5,
        sfxVolume: 0.7,
      },
    };
  const encoded = serializeSaveData(sample);
  const decoded = deserializeSaveData(encoded);
  assert.deepEqual(decoded, sample);
  assert.equal(deserializeSaveData('corrupted-json'), null);
});

test('control mode resolution and particle density caps adapt for PC and mobile', () => {
  assert.equal(resolveEffectiveControlMode('auto', false, 1440), 'desktop');
  assert.equal(resolveEffectiveControlMode('auto', true, 1440), 'mobile');
  assert.equal(resolveEffectiveControlMode('auto', false, 844), 'mobile');
  assert.equal(resolveEffectiveControlMode('desktop', true, 667), 'desktop');
  assert.equal(resolveEffectiveControlMode('mobile', false, 1440), 'mobile');

  assert.ok(getEffectiveParticleLimit('low', false) < getEffectiveParticleLimit('auto', false));
  assert.ok(getEffectiveParticleLimit('auto', true) < getEffectiveParticleLimit('auto', false));
  assert.ok(getEffectiveParticleLimit('high', true) > getEffectiveParticleLimit('auto', true));
});

test('achievements unlock deterministically without duplicates', () => {
  const stats = createInitialStats(9, 15);
  stats.nodesRestored = 1;
  stats.craftedCount = 1;
  stats.enemiesDefeated = 5;

  const ids = evaluateAchievements(stats, false);
  assert.ok(ids.includes('ach_first_spark'));
  assert.ok(ids.includes('ach_artisan'));
  assert.ok(ids.includes('ach_scrap_hunter'));
  assert.equal(ids.includes('ach_bounce_back'), false);

  stats.unlockedAchievements.push(...ids);
  const secondPass = evaluateAchievements(stats, true);
  assert.deepEqual(secondPass, ['ach_bounce_back']);
});

test('Abandoned Survivor House restoration node is walkable and Dusk lighting adds warm sunset tint', () => {
  const world = createWorldBlueprint();
  const cabin = world.restorationNodes.find((n) => n.id === 'node_haven_cabin');
  assert.ok(cabin, 'Expected node_haven_cabin in world blueprint');
  assert.equal(cabin.kind, 'house');
  const tx = Math.floor(cabin.x / TILE_SIZE);
  const ty = Math.floor(cabin.y / TILE_SIZE);
  assert.equal(isTileSolid(world.tiles[ty * world.width + tx]), false);

  const dusk = getDaylightState(18.5);
  assert.equal(dusk.phase, 'Dusk');
  assert.ok(dusk.shadowOffsetX > 0);
  assert.ok(dusk.tintRgb[0] > dusk.tintRgb[1]);
});

test('40-slot Backpack enforces stack limits (25 arrows, 20 materials, 5 consumables) and never overwrites items when full', () => {
  const empty = Object.fromEntries(
    Object.keys(createInitialInventory()).map((k) => [k, 0])
  ) as ReturnType<typeof createInitialInventory>;
  assert.equal(getBackpackUsedSlots(empty), 0);

  // 30 arrows = 2 slots (25 + 5), 25 scrap = 2 slots (20 + 5), 6 rations = 2 slots (5 + 1)
  const mixed = { ...empty, arrow: 30, scrap: 25, ration: 6 };
  assert.equal(getBackpackUsedSlots(mixed), 6);
  const slots = buildBackpackSlots(mixed);
  const arrowSlots = slots.filter((s) => s.itemId === 'arrow');
  assert.equal(arrowSlots.length, 2);
  assert.equal(arrowSlots[0].qty, 25);
  assert.equal(arrowSlots[1].qty, 5);

  // Fill all 40 slots exactly with 800 scrap (40 * 20)
  const full = { ...empty, scrap: MAX_BACKPACK_SLOTS * 20 };
  assert.equal(getBackpackUsedSlots(full), 40);

  // Attempting to add 1 arrow must fail without mutating existing scrap
  const rejected = tryAddItemsToBackpack(full, { arrow: 1 });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.inventory.scrap, 800);
  assert.equal(rejected.inventory.arrow, 0);

  // Partial stack top-off works even at 40/40 slots
  const partialFull = { ...empty, scrap: 39 * 20 + 15 };
  assert.equal(getBackpackUsedSlots(partialFull), 40);
  const topped = tryAddItemsToBackpack(partialFull, { scrap: 5 });
  assert.equal(topped.ok, true);
  assert.equal(topped.inventory.scrap, 800);
});

test('Blacksmith Bram NPC, Missing Hammer collectible, and quest progression unlock workshop cleanly', () => {
  const world = createWorldBlueprint();
  const bram = world.npcs.find((n) => n.id === 'npc_bram');
  const hammerNode = world.collectibles.find((c) => c.id === 'c_blacksmith_hammer');
  assert.ok(bram, 'Blacksmith Bram NPC must exist in world');
  assert.equal(bram.role, 'Blacksmith');
  assert.ok(hammerNode, 'Missing Hammer collectible must exist in world');
  assert.equal(hammerNode.itemId, 'blacksmith_hammer');

  // Verify walkability of both Bram and Hammer node
  assert.equal(
    isTileSolid(world.tiles[Math.floor(bram.y / TILE_SIZE) * world.width + Math.floor(bram.x / TILE_SIZE)]),
    false
  );
  assert.equal(
    isTileSolid(world.tiles[Math.floor(hammerNode.y / TILE_SIZE) * world.width + Math.floor(hammerNode.x / TILE_SIZE)]),
    false
  );

  // Step 1: Activate quest when speaking to Bram
  const quests = createInitialQuests();
  const qHammer = quests.find((q) => q.id === 's6_missing_hammer')!;
  qHammer.status = 'active';
  const step1 = evaluateQuests(quests, {
    talkedNpcIds: new Set(['npc_bram']),
    restoredNodeIds: new Set(),
    discoveredLandmarkIds: new Set(),
    visitedRegions: new Set(['haven']),
    enemiesDefeated: 0,
    bossDefeated: false,
    inventory: createInitialInventory(),
    blacksmithHammerRecovered: false,
    blacksmithUnlocked: false,
  });
  const afterTalk = step1.updatedQuests.find((q) => q.id === 's6_missing_hammer')!;
  assert.equal(afterTalk.status, 'active');
  assert.equal(afterTalk.objectives[0].current, 1);
  assert.equal(afterTalk.objectives[1].current, 0);

  // Step 2: Recover hammer on Haven Comm Ridge
  const invWithHammer = { ...createInitialInventory(), blacksmith_hammer: 1 };
  const step2 = evaluateQuests(step1.updatedQuests, {
    talkedNpcIds: new Set(['npc_bram']),
    restoredNodeIds: new Set(),
    discoveredLandmarkIds: new Set(),
    visitedRegions: new Set(['haven']),
    enemiesDefeated: 0,
    bossDefeated: false,
    inventory: invWithHammer,
    blacksmithHammerRecovered: true,
    blacksmithUnlocked: false,
  });
  const afterFind = step2.updatedQuests.find((q) => q.id === 's6_missing_hammer')!;
  assert.equal(afterFind.status, 'active');
  assert.equal(afterFind.objectives[1].current, 1);
  assert.equal(afterFind.objectives[2].current, 0);

  // Step 3: Return hammer to Bram and unlock workshop
  const step3 = evaluateQuests(step2.updatedQuests, {
    talkedNpcIds: new Set(['npc_bram']),
    restoredNodeIds: new Set(),
    discoveredLandmarkIds: new Set(),
    visitedRegions: new Set(['haven']),
    enemiesDefeated: 0,
    bossDefeated: false,
    inventory: createInitialInventory(),
    blacksmithHammerRecovered: true,
    blacksmithUnlocked: true,
  });
  assert.ok(step3.newlyCompleted.some((q) => q.id === 's6_missing_hammer'));
  assert.equal(step3.updatedQuests.find((q) => q.id === 's6_missing_hammer')!.status, 'completed');
});

test('Weapon & Armour crafting and upgrades validate materials and Gold and mitigate enemy damage', () => {
  const player = makePlayer();
  const stats = createInitialStats(9, 15);
  const poorInv = { ...createInitialInventory(), scrap: 1, parts: 0, crystal: 0, rare_alloy: 0 };

  // Weapon crafting: Axe & Bow require materials AND Gold
  assert.equal(WEAPON_CATALOG.scrap_axe.category, 'axe');
  assert.equal(WEAPON_CATALOG.hunter_bow.category, 'bow');
  assert.equal(WEAPON_CATALOG.hunter_bow.usesAmmo, 'arrow');

  const axeFailMat = canUnlockWeapon('scrap_axe', { ...player, gold: 100 }, poorInv, stats);
  assert.equal(axeFailMat.ok, false);
  const richInv = { ...createInitialInventory(), scrap: 12, parts: 8, crystal: 6, rare_alloy: 4 };
  const axeFailGold = canUnlockWeapon('scrap_axe', { ...player, gold: 5 }, richInv, stats);
  assert.equal(axeFailGold.ok, false);
  const axeOk = canUnlockWeapon('scrap_axe', { ...player, gold: 40 }, richInv, stats);
  assert.equal(axeOk.ok, true);

  // Weapon upgrade validates Gold & materials
  const upgFailGold = canUpgradeWeaponStat('scrap_blade', 'damage', { ...player, gold: 0 }, richInv);
  assert.equal(upgFailGold.ok, false);
  const upgOk = canUpgradeWeaponStat('scrap_blade', 'damage', { ...player, gold: 100 }, richInv);
  assert.equal(upgOk.ok, true);
  assert.ok(upgOk.goldCost > 0);

  // Armour crafting & upgrading
  const armourFailGold = canCraftArmour('scout_tunic', { unlockedArmour: [], gold: 5 }, richInv, stats);
  assert.equal(armourFailGold.ok, false);
  const armourOk = canCraftArmour('scout_tunic', { unlockedArmour: [], gold: 50 }, richInv, stats);
  assert.equal(armourOk.ok, true);

  const armourUpgOk = canUpgradeArmour(
    'scout_tunic',
    { unlockedArmour: ['scout_tunic'], armourUpgrades: createInitialArmourUpgrades(), gold: 100 },
    richInv
  );
  assert.equal(armourUpgOk.ok, true);

  // Armour stats & Defense damage mitigation
  const lv1Armour = getArmourEffectiveStats('iron_plate', 0);
  const lv3Armour = getArmourEffectiveStats('iron_plate', 2);
  assert.ok(lv3Armour.defense > lv1Armour.defense);
  assert.ok(lv3Armour.maxHpBonus > lv1Armour.maxHpBonus);
  assert.equal(ARMOUR_CATALOG.core_sentinel_plate.tier, 5);

  const combatWithArmour = computeCombatStats(
    1,
    [],
    'scrap_blade',
    player.weaponUpgrades.scrap_blade,
    player.skills,
    'iron_plate',
    { ...createInitialArmourUpgrades(), iron_plate: 2 }
  );
  assert.equal(combatWithArmour.defense, lv3Armour.defense);
  assert.equal(combatWithArmour.maxHp, 100 + lv3Armour.maxHpBonus);

  // Defense meaningfully mitigates raw damage while always keeping >= 1 minimum damage
  assert.equal(computeMitigatedDamage(20, 0), 20);
  assert.ok(computeMitigatedDamage(20, 12) < 20);
  assert.equal(computeMitigatedDamage(5, 50), 1);
});

test('Save data round-trips Blacksmith unlock, Gold, Arrows, crafted Weapons & Armour, and upgrade ranks', () => {
  const upgrades = createInitialAllWeaponUpgrades();
  upgrades.scrap_axe.damage = 2;
  const armourUpgrades = createInitialArmourUpgrades();
  armourUpgrades.reinforced_vest = 3;

  const sample: SaveData = {
    version: 1,
    savedAt: '2026-11-21T00:00:00Z',
    player: {
      x: 800,
      y: 1900,
      hp: 130,
      maxHp: 155,
      stamina: 100,
      energy: 90,
      maxEnergy: 100,
      level: 3,
      xp: 40,
      nextLevelXp: 200,
      gold: 145,
      upgrades: [],
      equippedWeapon: 'scrap_axe',
      unlockedWeapons: ['scrap_blade', 'scrap_axe', 'hunter_bow'],
      weaponUpgrades: upgrades,
      equippedArmour: 'reinforced_vest',
      unlockedArmour: ['scout_tunic', 'reinforced_vest'],
      armourUpgrades,
      skills: createInitialSkillRanks(),
      skillPoints: 2,
    },
    interiorId: null,
    inventory: { ...createInitialInventory(), arrow: 18, scrap: 9 },
    restoredNodeIds: ['node_haven_generator'],
    collectedNodeIds: ['c_blacksmith_hammer'],
    discoveredLandmarkIds: ['lm_haven_plaza', 'lm_haven_ridge'],
    blacksmithUnlocked: true,
    blacksmithHammerRecovered: true,
    quests: { s6_missing_hammer: { status: 'completed', currents: [1, 1, 1] } },
    stats: createInitialStats(9, 15),
    timeOfDay: 11.5,
    weather: 'clear',
    settings: DEFAULT_SETTINGS,
  };

  const decoded = deserializeSaveData(serializeSaveData(sample));
  assert.deepEqual(decoded, sample);
  assert.equal(decoded?.blacksmithUnlocked, true);
  assert.equal(decoded?.player.gold, 145);
  assert.equal(decoded?.player.equippedArmour, 'reinforced_vest');
  assert.equal(decoded?.player.armourUpgrades?.reinforced_vest, 3);
  assert.equal(decoded?.inventory.arrow, 18);
});

test('Boss defeat choreography progresses cleanly through all 5 stages and delays loot until ash disappearance', () => {
  const total = BOSS_DEFEAT_TOTAL_DURATION;
  assert.equal(total, 4.3);

  // Stage 1: stagger (0.0s .. 1.1s elapsed)
  const s1 = getBossDefeatState(total - 0.5, total);
  assert.equal(s1.stage, 'stagger');
  assert.equal(s1.ashDissolve, 0);
  assert.equal(s1.alpha, 1);
  assert.equal(s1.shouldReleaseLoot, false);

  // Stage 2: fall (1.1s .. 1.9s elapsed)
  const s2 = getBossDefeatState(total - 1.5, total);
  assert.equal(s2.stage, 'fall');
  assert.ok(s2.tiltRadians > 0 && s2.tiltRadians < 0.72);
  assert.ok(s2.fallOffsetY > 0 && s2.fallOffsetY < 14);
  assert.equal(s2.shouldReleaseLoot, false);

  // Stage 3: fallen / resting on ground (1.9s .. 2.9s elapsed)
  const s3 = getBossDefeatState(total - 2.4, total);
  assert.equal(s3.stage, 'fallen');
  assert.equal(s3.tiltRadians, 0.72);
  assert.equal(s3.fallOffsetY, 14);
  assert.equal(s3.ashDissolve, 0);
  assert.equal(s3.shouldReleaseLoot, false);

  // Stage 4: ash_fade (2.9s .. 4.3s elapsed)
  const s4 = getBossDefeatState(total - 3.6, total);
  assert.equal(s4.stage, 'ash_fade');
  assert.ok(s4.ashDissolve > 0 && s4.ashDissolve < 1);
  assert.ok(s4.alpha > 0 && s4.alpha < 1);
  assert.equal(s4.shouldReleaseLoot, false);

  // Stage 5: vanished (koTimerRemaining <= 0) -> loot is finally released
  const s5 = getBossDefeatState(0, total);
  assert.equal(s5.stage, 'vanished');
  assert.equal(s5.ashDissolve, 1);
  assert.equal(s5.alpha, 0);
  assert.equal(s5.shouldReleaseLoot, true);
});

test('Boss battle music state machine handles engagement, hysteresis, defeat, retreat, and multiple bosses cleanly', () => {
  // Modular registry has core_sentinel and default_boss entries
  assert.ok(BOSS_SOUNDTRACK_REGISTRY.core_sentinel);
  assert.ok(BOSS_SOUNDTRACK_REGISTRY.default_boss);
  assert.ok(BOSS_SOUNDTRACK_REGISTRY.core_sentinel.bassNotes.length >= 4);

  // Outside engage radius -> stays on region track
  const far = resolveBossMusicState({
    mode: 'playing',
    currentRegion: 'core',
    activeBossTrackId: null,
    nearestLivingBoss: { trackId: 'core_sentinel', distance: BOSS_MUSIC_ENGAGE_RADIUS + 20 },
  });
  assert.equal(far.activeTrack, 'core');
  assert.equal(far.nextBossTrackId, null);

  // Entering engage radius -> transitions to boss music
  const engaged = resolveBossMusicState({
    mode: 'playing',
    currentRegion: 'core',
    activeBossTrackId: null,
    nearestLivingBoss: { trackId: 'core_sentinel', distance: BOSS_MUSIC_ENGAGE_RADIUS - 10 },
  });
  assert.equal(engaged.activeTrack, 'boss');
  assert.equal(engaged.nextBossTrackId, 'core_sentinel');

  // Inside hysteresis buffer (between engage and disengage radii) -> keeps boss music without flicker
  const buffer = resolveBossMusicState({
    mode: 'playing',
    currentRegion: 'core',
    activeBossTrackId: 'core_sentinel',
    nearestLivingBoss: {
      trackId: 'core_sentinel',
      distance: (BOSS_MUSIC_ENGAGE_RADIUS + BOSS_MUSIC_DISENGAGE_RADIUS) / 2,
    },
  });
  assert.equal(buffer.activeTrack, 'boss');
  assert.equal(buffer.nextBossTrackId, 'core_sentinel');

  // Fleeing past disengage radius -> returns cleanly to region music
  const fled = resolveBossMusicState({
    mode: 'playing',
    currentRegion: 'core',
    activeBossTrackId: 'core_sentinel',
    nearestLivingBoss: { trackId: 'core_sentinel', distance: BOSS_MUSIC_DISENGAGE_RADIUS + 5 },
  });
  assert.equal(fled.activeTrack, 'core');
  assert.equal(fled.nextBossTrackId, null);

  // Boss defeated (no living boss) -> returns to region music
  const defeated = resolveBossMusicState({
    mode: 'playing',
    currentRegion: 'core',
    activeBossTrackId: 'core_sentinel',
    nearestLivingBoss: null,
  });
  assert.equal(defeated.activeTrack, 'core');
  assert.equal(defeated.nextBossTrackId, null);

  // Player defeat or returning to title screen -> never leaves boss music stuck
  const lost = resolveBossMusicState({
    mode: 'gameover',
    currentRegion: 'core',
    activeBossTrackId: 'core_sentinel',
    nearestLivingBoss: { trackId: 'core_sentinel', distance: 120 },
  });
  assert.equal(lost.activeTrack, 'core');
  assert.equal(lost.nextBossTrackId, null);

  const title = resolveBossMusicState({
    mode: 'title',
    currentRegion: 'core',
    activeBossTrackId: 'core_sentinel',
    nearestLivingBoss: { trackId: 'core_sentinel', distance: 120 },
  });
  assert.equal(title.activeTrack, 'title');
  assert.equal(title.nextBossTrackId, null);

  // Multi-boss support: switching to another boss ID works seamlessly
  const otherBoss = resolveBossMusicState({
    mode: 'playing',
    currentRegion: 'wasteland',
    activeBossTrackId: null,
    nearestLivingBoss: { trackId: 'default_boss', distance: 200 },
  });
  assert.equal(otherBoss.activeTrack, 'boss');
  assert.equal(otherBoss.nextBossTrackId, 'default_boss');
});

test('Checkpoint respawn resolver picks last activated teleporter or falls back safely to Haven camp, restoring sensible vitals', () => {
  const world = createWorldBlueprint();

  // No teleporters activated yet -> falls back to The Last Haven safe spawn
  const fallback = resolveRespawnPoint(world.teleporters, null, world.playerSpawn);
  assert.equal(fallback.checkpointId, null);
  assert.equal(fallback.region, 'haven');
  assert.equal(fallback.x, world.playerSpawn.x);
  assert.equal(fallback.y, world.playerSpawn.y);

  // Activate Haven & City gateways; set City as lastCheckpointId
  const tpHaven = world.teleporters.find((t) => t.id === 'tp_haven')!;
  const tpCity = world.teleporters.find((t) => t.id === 'tp_city')!;
  tpHaven.activated = true;
  tpCity.activated = true;

  const atCity = resolveRespawnPoint(world.teleporters, 'tp_city', world.playerSpawn);
  assert.equal(atCity.checkpointId, 'tp_city');
  assert.equal(atCity.name, tpCity.name);
  assert.equal(atCity.region, 'city');
  assert.equal(atCity.x, tpCity.x);
  assert.equal(atCity.y, tpCity.y + 34);

  // If saved checkpoint ID is missing/unactivated, falls back to latest activated teleporter
  const atLatest = resolveRespawnPoint(world.teleporters, 'tp_core', world.playerSpawn);
  assert.equal(atLatest.checkpointId, 'tp_city');

  // Respawn vitals restore full HP & stamina and at least 50% Arc Energy
  const vitalsLowEnergy = computeRespawnVitals({ maxHp: 180, maxStamina: 130, energy: 10, maxEnergy: 120 });
  assert.equal(vitalsLowEnergy.hp, 180);
  assert.equal(vitalsLowEnergy.stamina, 130);
  assert.equal(vitalsLowEnergy.energy, 60);

  const vitalsHighEnergy = computeRespawnVitals({ maxHp: 180, maxStamina: 130, energy: 105, maxEnergy: 120 });
  assert.equal(vitalsHighEnergy.energy, 105);

  // SaveData round-trips lastCheckpointId & bossDefeated cleanly
  const sample: SaveData = {
    version: 1,
    savedAt: '2026-11-21T05:00:00Z',
    player: {
      x: tpCity.x,
      y: tpCity.y + 34,
      hp: 180,
      maxHp: 180,
      stamina: 130,
      energy: 80,
      maxEnergy: 120,
      level: 4,
      xp: 20,
      nextLevelXp: 250,
      gold: 210,
      upgrades: [],
    },
    interiorId: null,
    inventory: createInitialInventory(),
    restoredNodeIds: ['node_haven_generator'],
    collectedNodeIds: ['c_blacksmith_hammer'],
    discoveredLandmarkIds: ['lm_haven_plaza'],
    discoveredTeleporterIds: ['tp_haven', 'tp_city'],
    activatedTeleporterIds: ['tp_haven', 'tp_city'],
    lastCheckpointId: 'tp_city',
    bossDefeated: true,
    blacksmithUnlocked: true,
    quests: { m1_wake_up: { status: 'completed', currents: [1] } },
    stats: createInitialStats(9, 15),
    timeOfDay: 12,
    weather: 'clear',
    settings: DEFAULT_SETTINGS,
  };
  const decoded = deserializeSaveData(serializeSaveData(sample));
  assert.equal(decoded?.lastCheckpointId, 'tp_city');
  assert.equal(decoded?.bossDefeated, true);
  assert.equal(decoded?.quests.m1_wake_up.status, 'completed');
});

test('Mobile landscape orientation overlay guides portrait phones during gameplay without trapping users or affecting desktop', () => {
  // Portrait mobile while playing -> shows rotate overlay
  assert.equal(
    shouldShowRotateOverlay({ isMobileDevice: true, mode: 'playing', width: 390, height: 844, dismissed: false }),
    true
  );
  // Rotating to landscape -> automatically hides overlay
  assert.equal(
    shouldShowRotateOverlay({ isMobileDevice: true, mode: 'playing', width: 844, height: 390, dismissed: false }),
    false
  );
  // User manually dismissed -> never traps player in portrait
  assert.equal(
    shouldShowRotateOverlay({ isMobileDevice: true, mode: 'playing', width: 390, height: 844, dismissed: true }),
    false
  );
  // Title screen stays usable in portrait before entering gameplay
  assert.equal(
    shouldShowRotateOverlay({ isMobileDevice: true, mode: 'title', width: 390, height: 844, dismissed: false }),
    false
  );
  // Desktop never sees rotate overlay
  assert.equal(
    shouldShowRotateOverlay({ isMobileDevice: false, mode: 'playing', width: 600, height: 800, dismissed: false }),
    false
  );
});



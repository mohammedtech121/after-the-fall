import { ACHIEVEMENTS, evaluateAchievements } from './achievements';
import { SoundEngine } from './audio';
import {
  ARMOUR_CATALOG,
  ARMOUR_ORDER,
  canCraftArmour,
  canLearnSkill,
  canUnlockWeapon,
  canUpgradeArmour,
  canUpgradeWeaponStat,
  computeCombatStats,
  createInitialAllWeaponUpgrades,
  createInitialArmourUpgrades,
  createInitialSkillRanks,
  getArmourEffectiveStats,
  getWeaponLevel,
  WEAPON_CATALOG,
  WEAPON_ORDER,
} from './combat';
import {
  drawCampfire,
  drawCollectible,
  drawEnemySprite,
  drawNpcSprite,
  drawPlayerSprite,
  drawPortalDoor,
  drawProjectile,
  drawRestorationNode,
  drawTeleporter,
  drawWorkbench,
  FloatingText,
  Particle,
} from './entityRenderer';
import { createInitialInventory, createInitialQuests, ITEM_CATALOG, REGION_META } from './quests';
import {
  addItems,
  applyCraftRecipe,
  awardPlayerXp,
  BOSS_DEFEAT_TOTAL_DURATION,
  canActivateTeleporter,
  canAffordCost,
  canRestoreNode,
  canTravelToTeleporter,
  computeMitigatedDamage,
  computeRespawnVitals,
  createInitialStats,
  deductCost,
  DEFAULT_SETTINGS,
  deleteSaveSlot,
  evaluateQuests,
  getBackpackUsedSlots,
  getBossDefeatState,
  getDaylightState,
  getEffectiveParticleLimit,
  getLatestValidSave,
  hasCompletedTutorial,
  hasLineOfSight,
  isTargetInMeleeArc,
  isTileHazardous,
  listSaveSlots,
  loadStoredSettings,
  markTutorialCompleted,
  readSaveSlot,
  resolveBossMusicState,
  resolveCircleTileCollision,
  resolveRespawnPoint,
  saveStoredSettings,
  shouldUnlockCoreGate,
  tryAddItemsToBackpack,
  useConsumableItem,
  writeSaveSlot,
} from './rules';
import { getTileAtlas, TileAtlas } from './sprites';
import {
  ActiveOverlay,
  ArmourId,
  AttackStyle,
  CollectibleNode,
  EnemyEntity,
  GameMode,
  GameSettings,
  HudSnapshot,
  InteractionPrompt,
  InventoryMap,
  ItemId,
  MAX_BACKPACK_SLOTS,
  NpcEntity,
  OwnedArmourId,
  PlayerState,
  PortalDoor,
  Projectile,
  QuestState,
  RestorationNode,
  SaveData,
  SaveSlotId,
  SaveSlotMeta,
  SkillId,
  TeleporterId,
  TeleporterStation,
  TeleportTransitionState,
  ToastMessage,
  TradeOffer,
  WeaponId,
  WeaponUpgradeStat,
  WeatherType,
  WorkbenchProp,
  WorldStats,
} from './types';
import {
  CORE_RELAYS_REQUIRED,
  createWorldBlueprint,
  getRegionAtWorld,
  TILE_SIZE,
  WorldBlueprint,
} from './worldData';

const PARTICLE_POOL_SIZE = 260;
const PIXEL_ZOOM = 1.65;

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onToast: (toast: ToastMessage) => void;
  onOpenDialogue: (npc: NpcEntity) => void;
  onOpenTeleporter?: (tp: TeleporterStation) => void;
  onTeleportTransition?: (state: TeleportTransitionState | null) => void;
  onOpenOverlay: (overlay: ActiveOverlay) => void;
  onModeChange: (mode: GameMode) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private atlas: TileAtlas;
  private sound = new SoundEngine();
  private callbacks: EngineCallbacks;

  private world: WorldBlueprint;
  private player: PlayerState;
  private inventory: InventoryMap;
  private quests: QuestState[];
  private stats: WorldStats;
  private interiorId: string | null = null;
  private settings: GameSettings = loadStoredSettings();

  private mode: GameMode = 'title';
  private overlay: ActiveOverlay = 'none';
  private time = 0;
  private timeOfDay = 10.5; // Pleasant morning light on start
  private weather: WeatherType = 'clear';
  private weatherTimer = 55;

  private camX = 0;
  private camY = 0;
  private shakeTrauma = 0;
  private hitstopTimer = 0;
  private hudEmitAccum = 0;
  private lastHudSig = '';
  private toxicTickTimer = 0;
  private toastIdCounter = 1;
  private bossDefeated = false;
  private blacksmithUnlocked = false;
  private blacksmithHammerRecovered = false;
  private autosaveIndicatorTimer = 0;
  private lastSavedLabel: string | null = null;
  private teleportLocked = false;
  private activeTeleporterId: TeleporterId | null = null;
  private lastCheckpointId: TeleporterId | null = null;
  private bossKoBurstAccum = 0;

  // Input state (continuous held vs edge-triggered + buffered + mobile virtual)
  private heldKeys = new Set<string>();
  private virtualMoveX = 0;
  private virtualMoveY = 0;
  private virtualSprinting = false;
  private lastAttackFromTouch = false;
  private mouseScreenX = 0;
  private mouseScreenY = 0;
  private attackBufferTimer = 0;
  private heavyAttackBufferTimer = 0;
  private energyStrikeQueued = false;
  private dodgeBufferTimer = 0;
  private interactQueued = false;
  private pulseQueued = false;
  private mouseLeftDown = false;
  private mouseDownTime = 0;

  // Entities & pools
  private projectiles: Projectile[] = [];
  private floatingTexts: FloatingText[] = [];
  private particles: Particle[] = [];
  private particleCursor = 0;
  private rainDrops: { x: number; y: number; speed: number; len: number }[] = [];

  private rafId = 0;
  private lastFrameMs = 0;
  private resizeObserver: ResizeObserver | null = null;
  private viewportW = 1280;
  private viewportH = 720;
  private terrainCanvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = 320;
    this.lightCanvas.height = 180;
    this.lightCtx = this.lightCanvas.getContext('2d')!;

    this.terrainCanvas = document.createElement('canvas');
    this.atlas = getTileAtlas();
    this.callbacks = callbacks;

    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 1,
      });
    }
    for (let i = 0; i < 85; i++) {
      this.rainDrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        speed: 380 + Math.random() * 180,
        len: 10 + Math.random() * 8,
      });
    }

    this.world = createWorldBlueprint();
    this.bakeOverworldTerrain();
    this.player = this.createInitialPlayer(this.world.playerSpawn.x, this.world.playerSpawn.y);
    this.inventory = createInitialInventory();
    this.quests = createInitialQuests();
    this.stats = createInitialStats(this.world.restorationNodes.length, this.world.landmarks.length);
    this.sound.applySettings(this.settings);
    this.camX = this.player.x;
    this.camY = this.player.y;

    this.bindEvents();
    this.handleResize();
    this.emitHud();
    this.lastFrameMs = performance.now();
    this.loop(this.lastFrameMs);
  }

  private getZoom(): number {
    // Keep uniform 1:1 pixel ratio across all aspect ratios; gently zoom out on compact mobile landscape heights
    const compactFactor = this.viewportH < 480 ? Math.max(0.74, this.viewportH / 500) : 1;
    return PIXEL_ZOOM * compactFactor * (this.settings.screenScale || 1);
  }

  private bakeOverworldTerrain(): void {
    this.terrainCanvas.width = this.world.width * 16;
    this.terrainCanvas.height = this.world.height * 16;
    const tctx = this.terrainCanvas.getContext('2d')!;
    tctx.imageSmoothingEnabled = false;
    for (let ty = 0; ty < this.world.height; ty++) {
      for (let tx = 0; tx < this.world.width; tx++) {
        const tile = this.world.tiles[ty * this.world.width + tx];
        const variants = this.atlas.tiles[tile];
        let sprite: HTMLCanvasElement;
        if (tile === 'wall_wood') {
          sprite = variants[(tx + ty * 2) % 3 === 1 ? 1 : tx % 2 === 0 ? 0 : 2];
        } else {
          sprite = variants[(tx * 7 + ty * 13) % variants.length];
        }
        tctx.drawImage(sprite, tx * 16, ty * 16, 16, 16);
      }
    }
  }

  private createInitialPlayer(x: number, y: number): PlayerState {
    const p: PlayerState = {
      x,
      y,
      vx: 0,
      vy: 0,
      facing: 'right',
      aimAngle: 0,
      hp: 100,
      maxHp: 100,
      trailingHp: 100,
      stamina: 100,
      maxStamina: 100,
      energy: 65,
      maxEnergy: 100,
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      gold: 30,
      defense: 0,
      attackDamage: 20,
      moveSpeed: 158,
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
      dodgeDirX: 1,
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
      skillPoints: 1,
    };
    this.syncPlayerStatsObj(p, false);
    return p;
  }

  private getCombatStats(p: PlayerState = this.player) {
    return computeCombatStats(
      p.level,
      p.upgrades,
      p.equippedWeapon,
      p.weaponUpgrades[p.equippedWeapon],
      p.skills,
      p.equippedArmour,
      p.armourUpgrades
    );
  }

  private syncPlayerStatsObj(p: PlayerState, healDelta = false): void {
    const c = this.getCombatStats(p);
    const hpDiff = c.maxHp - p.maxHp;
    const stamDiff = c.maxStamina - p.maxStamina;
    const engDiff = c.maxEnergy - p.maxEnergy;
    p.maxHp = c.maxHp;
    p.maxStamina = c.maxStamina;
    p.maxEnergy = c.maxEnergy;
    p.attackDamage = c.weaponDamage;
    p.defense = c.defense;
    p.moveSpeed = p.upgrades.includes('kinetic_boots') ? Math.round(158 * 1.22) : 158;
    if (healDelta) {
      if (hpDiff > 0) p.hp = Math.min(p.maxHp, p.hp + hpDiff);
      if (stamDiff > 0) p.stamina = Math.min(p.maxStamina, p.stamina + stamDiff);
      if (engDiff > 0) p.energy = Math.min(p.maxEnergy, p.energy + engDiff);
    }
    p.hp = Math.min(p.maxHp, p.hp);
    p.trailingHp = Math.min(p.maxHp, Math.max(p.hp, p.trailingHp));
    p.stamina = Math.min(p.maxStamina, p.stamina);
    p.energy = Math.min(p.maxEnergy, p.energy);
  }

  // =========================================================================
  // PUBLIC API FOR REACT SHELL
  // =========================================================================
  public startNewGame(): void {
    this.sound.unlock();
    this.sound.playUiClick();
    this.world = createWorldBlueprint();
    this.bakeOverworldTerrain();
    this.player = this.createInitialPlayer(this.world.playerSpawn.x, this.world.playerSpawn.y);
    this.inventory = createInitialInventory();
    this.quests = createInitialQuests();
    this.stats = createInitialStats(this.world.restorationNodes.length, this.world.landmarks.length);
    this.interiorId = null;
    this.bossDefeated = false;
    this.blacksmithUnlocked = false;
    this.blacksmithHammerRecovered = false;
    this.lastCheckpointId = null;
    this.projectiles = [];
    this.floatingTexts = [];
    this.timeOfDay = 10.0;
    this.weather = 'clear';
    this.camX = this.player.x;
    this.camY = this.player.y;
    this.clearInputs();
    this.setMode('playing');
    this.overlay = 'none';
    this.callbacks.onOpenOverlay('none');
    this.sound.setTrack('haven');
    this.emitToast(
      'The Last Haven',
      'Speak with Elder Mara [E] by the campfire to begin.',
      'discovery'
    );
    this.emitHud();
  }

  public hasSavedGame(): boolean {
    return getLatestValidSave() !== null;
  }

  public getSaveSlots(): { slotId: SaveSlotId; meta: SaveSlotMeta | null }[] {
    return listSaveSlots().map((s) => ({ slotId: s.slotId, meta: s.meta }));
  }

  public deleteSlot(slotId: SaveSlotId): void {
    deleteSaveSlot(slotId);
    this.emitHud();
  }

  public loadSavedGame(slotId?: SaveSlotId): boolean {
    this.sound.unlock();
    try {
      const data = slotId ? readSaveSlot(slotId) : getLatestValidSave()?.data ?? null;
      if (!data) return false;

      this.world = createWorldBlueprint();
      this.player = this.createInitialPlayer(data.player.x, data.player.y);
      this.player.level = data.player.level ?? 1;
      this.player.xp = data.player.xp ?? 0;
      this.player.nextLevelXp = data.player.nextLevelXp ?? 100;
      this.player.gold = typeof data.player.gold === 'number' ? Math.max(0, data.player.gold) : 30;
      this.player.upgrades = [...(data.player.upgrades ?? [])];

      // Restore weapon progression, armour progression & skill tree (backward-compatible with older saves!)
      const defaultUpgrades = createInitialAllWeaponUpgrades();
      if (data.player.weaponUpgrades) {
        for (const wid of WEAPON_ORDER) {
          if (data.player.weaponUpgrades[wid]) {
            defaultUpgrades[wid] = { ...defaultUpgrades[wid], ...data.player.weaponUpgrades[wid] };
          }
        }
      }
      this.player.weaponUpgrades = defaultUpgrades;
      this.player.unlockedWeapons =
        data.player.unlockedWeapons && data.player.unlockedWeapons.length > 0
          ? [...new Set<WeaponId>(['scrap_blade', ...data.player.unlockedWeapons])]
          : ['scrap_blade'];
      this.player.equippedWeapon =
        data.player.equippedWeapon && this.player.unlockedWeapons.includes(data.player.equippedWeapon)
          ? data.player.equippedWeapon
          : 'scrap_blade';

      const defaultArmourUpgrades = createInitialArmourUpgrades();
      if (data.player.armourUpgrades) {
        for (const aid of ARMOUR_ORDER) {
          if (typeof data.player.armourUpgrades[aid] === 'number') {
            defaultArmourUpgrades[aid] = Math.max(0, data.player.armourUpgrades[aid]);
          }
        }
      }
      this.player.armourUpgrades = defaultArmourUpgrades;
      this.player.unlockedArmour = Array.isArray(data.player.unlockedArmour)
        ? [...new Set<OwnedArmourId>(data.player.unlockedArmour.filter((id) => ARMOUR_ORDER.includes(id)))]
        : [];
      this.player.equippedArmour =
        data.player.equippedArmour &&
        data.player.equippedArmour !== 'none' &&
        this.player.unlockedArmour.includes(data.player.equippedArmour)
          ? data.player.equippedArmour
          : 'none';

      this.player.skills = { ...createInitialSkillRanks(), ...(data.player.skills ?? {}) };
      this.player.skillPoints =
        typeof data.player.skillPoints === 'number' ? data.player.skillPoints : Math.max(0, this.player.level);

      this.syncPlayerStatsObj(this.player, false);
      this.player.hp = Math.min(this.player.maxHp, data.player.hp ?? this.player.maxHp);
      this.player.trailingHp = this.player.hp;
      this.player.stamina = Math.min(this.player.maxStamina, data.player.stamina ?? this.player.maxStamina);
      this.player.energy = Math.min(this.player.maxEnergy, data.player.energy ?? this.player.maxEnergy);

      this.interiorId = data.interiorId ?? null;
      this.inventory = { ...createInitialInventory(), ...(data.inventory ?? {}) };

      const restoredSet = new Set(data.restoredNodeIds ?? []);
      for (const rn of this.world.restorationNodes) {
        rn.restored = restoredSet.has(rn.id);
        if (rn.restored) {
          this.applyWorldRestorationVisuals(rn, false);
        }
      }
      this.bakeOverworldTerrain();

      const collectedSet = new Set(data.collectedNodeIds ?? []);
      for (const col of this.world.collectibles) {
        col.collected = collectedSet.has(col.id);
      }
      const lmSet = new Set(data.discoveredLandmarkIds ?? []);
      for (const lm of this.world.landmarks) {
        lm.discovered = lmSet.has(lm.id);
      }

      // Restore Teleportation Network state (no duplicates, preserve exact discovery/activation)
      const discTpSet = new Set(data.discoveredTeleporterIds ?? []);
      const actTpSet = new Set(data.activatedTeleporterIds ?? []);
      for (const tp of this.world.teleporters) {
        tp.activated = actTpSet.has(tp.id);
        tp.discovered = tp.activated || discTpSet.has(tp.id);
      }

      // Restore last activated checkpoint (backward-compatible with saves created before checkpoint tracking)
      if (
        data.lastCheckpointId &&
        this.world.teleporters.some((t) => t.id === data.lastCheckpointId && t.activated)
      ) {
        this.lastCheckpointId = data.lastCheckpointId;
      } else {
        const lastActivated = [...this.world.teleporters].reverse().find((t) => t.activated);
        this.lastCheckpointId = lastActivated ? lastActivated.id : null;
      }

      // Guard against loading a save with 0 HP: recover cleanly at resolved checkpoint
      if (this.player.hp <= 0) {
        const safeTarget = resolveRespawnPoint(
          this.world.teleporters,
          this.lastCheckpointId,
          this.world.playerSpawn
        );
        const vitals = computeRespawnVitals(this.player);
        this.interiorId = null;
        this.player.x = safeTarget.x;
        this.player.y = safeTarget.y;
        this.player.hp = vitals.hp;
        this.player.trailingHp = vitals.hp;
        this.player.stamina = vitals.stamina;
        this.player.energy = vitals.energy;
      }

      this.quests = createInitialQuests();
      for (const q of this.quests) {
        const savedQ = data.quests?.[q.id];
        if (savedQ) {
          q.status = savedQ.status;
          q.objectives.forEach((o, i) => {
            o.current = savedQ.currents?.[i] ?? o.current;
          });
        }
      }

      this.stats = {
        ...createInitialStats(this.world.restorationNodes.length, this.world.landmarks.length),
        ...(data.stats ?? {}),
        totalNodes: this.world.restorationNodes.length,
        totalLandmarks: this.world.landmarks.length,
        unlockedAchievements: data.stats?.unlockedAchievements ?? [],
        craftedCount: data.stats?.craftedCount ?? 0,
      };
      this.bossDefeated =
        Boolean(data.bossDefeated) ||
        this.quests.find((q) => q.id === 'm8_restore_world')?.objectives[0].current === 1;
      const hammerQuest = this.quests.find((q) => q.id === 's6_missing_hammer');
      this.blacksmithUnlocked =
        Boolean(data.blacksmithUnlocked) || hammerQuest?.status === 'completed';
      this.blacksmithHammerRecovered =
        Boolean(data.blacksmithHammerRecovered) ||
        this.blacksmithUnlocked ||
        (this.inventory.blacksmith_hammer ?? 0) > 0 ||
        this.world.collectibles.some((c) => c.id === 'c_blacksmith_hammer' && c.collected);
      if (this.bossDefeated) {
        const boss = this.world.enemies.find((e) => e.id === 'enemy_core_boss');
        if (boss) {
          boss.hp = 0;
          boss.aiState = 'ko';
          boss.koTimer = 0;
        }
      }

      if (data.tutorialCompleted) {
        markTutorialCompleted();
      }

      this.timeOfDay = data.timeOfDay ?? 10.5;
      this.weather = data.weather ?? 'clear';
      this.settings = { ...DEFAULT_SETTINGS, ...loadStoredSettings(), ...(data.settings ?? {}) };
      this.sound.applySettings(this.settings);

      this.camX = this.player.x;
      this.camY = this.player.y;
      this.clearInputs();
      this.setMode('playing');
      this.overlay = 'none';
      this.callbacks.onOpenOverlay('none');
      this.sound.setTrack(getRegionAtWorld(this.player.x, this.player.y));
      this.emitToast('Save Loaded', `Resumed in ${REGION_META[getRegionAtWorld(this.player.x, this.player.y)].name}.`, 'discovery');
      this.emitHud();
      return true;
    } catch {
      return false;
    }
  }

  private buildSaveData(slotLabel?: string): SaveData {
    const questsMap: SaveData['quests'] = {};
    for (const q of this.quests) {
      questsMap[q.id] = {
        status: q.status,
        currents: q.objectives.map((o) => o.current),
      };
    }
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      slotLabel,
      player: {
        x: this.player.x,
        y: this.player.y,
        hp: this.player.hp > 0 ? this.player.hp : this.player.maxHp,
        maxHp: this.player.maxHp,
        stamina: this.player.stamina,
        energy: this.player.energy,
        maxEnergy: this.player.maxEnergy,
        level: this.player.level,
        xp: this.player.xp,
        nextLevelXp: this.player.nextLevelXp,
        gold: this.player.gold,
        upgrades: [...this.player.upgrades],
        equippedWeapon: this.player.equippedWeapon,
        unlockedWeapons: [...this.player.unlockedWeapons],
        weaponUpgrades: JSON.parse(JSON.stringify(this.player.weaponUpgrades)),
        equippedArmour: this.player.equippedArmour,
        unlockedArmour: [...this.player.unlockedArmour],
        armourUpgrades: { ...this.player.armourUpgrades },
        skills: { ...this.player.skills },
        skillPoints: this.player.skillPoints,
      },
      interiorId: this.interiorId,
      inventory: { ...this.inventory },
      restoredNodeIds: this.world.restorationNodes.filter((n) => n.restored).map((n) => n.id),
      collectedNodeIds: this.world.collectibles.filter((c) => c.collected).map((c) => c.id),
      discoveredLandmarkIds: this.world.landmarks.filter((l) => l.discovered).map((l) => l.id),
      discoveredTeleporterIds: this.world.teleporters.filter((t) => t.discovered).map((t) => t.id),
      activatedTeleporterIds: this.world.teleporters.filter((t) => t.activated).map((t) => t.id),
      lastCheckpointId: this.lastCheckpointId,
      bossDefeated: this.bossDefeated,
      blacksmithUnlocked: this.blacksmithUnlocked,
      blacksmithHammerRecovered: this.blacksmithHammerRecovered,
      tutorialCompleted: hasCompletedTutorial(),
      quests: questsMap,
      stats: { ...this.stats },
      timeOfDay: this.timeOfDay,
      weather: this.weather,
      settings: { ...this.settings },
    };
  }

  private isInActiveCombat(): boolean {
    if (this.interiorId) return false;
    return this.world.enemies.some(
      (e) =>
        e.aiState !== 'ko' &&
        (e.aiState === 'chase' || e.aiState === 'telegraph' || e.aiState === 'attack') &&
        Math.hypot(e.x - this.player.x, e.y - this.player.y) < 280
    );
  }

  public saveGame(slotId: SaveSlotId = 'slot_1', silent = false): boolean {
    const label =
      slotId === 'autosave'
        ? 'Autosave'
        : slotId === 'slot_1'
          ? 'Save Slot 1'
          : slotId === 'slot_2'
            ? 'Save Slot 2'
            : 'Save Slot 3';
    const ok = writeSaveSlot(slotId, this.buildSaveData(label));
    if (ok) {
      this.autosaveIndicatorTimer = 2.0;
      this.lastSavedLabel = slotId === 'autosave' ? 'Autosaved' : `Saved (${label})`;
      if (!silent) {
        this.sound.playPickup();
        this.emitToast('Game Saved', `${label} stored locally in browser.`, 'quest');
      }
      this.emitHud();
    }
    return ok;
  }

  private triggerAutosave(): void {
    // Never overwrite autosave while defeated/dead; healthy respawn triggers its own autosave
    if (this.player.hp <= 0 || this.mode === 'gameover') return;
    writeSaveSlot('autosave', this.buildSaveData('Autosave'));
    this.autosaveIndicatorTimer = 2.2;
    this.lastSavedLabel = this.isInActiveCombat() ? 'Saved' : 'Autosaved';
    this.emitHud();
  }

  /**
   * Non-destructive respawn at the last activated checkpoint/teleporter (or Haven safe camp).
   * Preserves 100% of completed & active quests, defeated bosses, Blacksmith unlock, Gold,
   * arrows, crafted weapons/armour, upgrades, skills, inventory, and unlocked regions.
   */
  public respawnAtCheckpoint(): void {
    if (this.teleportLocked) return;
    const target = resolveRespawnPoint(
      this.world.teleporters,
      this.lastCheckpointId,
      this.world.playerSpawn
    );
    const regionName = REGION_META[target.region].name;
    const vitals = computeRespawnVitals(this.player);

    this.teleportLocked = true;
    this.clearInputs();
    this.sound.unlock();
    this.sound.playRestore();

    this.callbacks.onTeleportTransition?.({
      active: true,
      phase: 'out',
      destinationName: target.name,
      destinationRegionName: regionName,
      accentColor: '#5eead4',
    });

    window.setTimeout(() => {
      this.interiorId = null;
      this.player.x = target.x;
      this.player.y = target.y;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.facing = 'down';
      this.player.hp = vitals.hp;
      this.player.trailingHp = vitals.hp;
      this.player.stamina = vitals.stamina;
      this.player.energy = vitals.energy;
      this.player.invulnTimer = 2.2;
      this.player.hitFlashTimer = 0;
      this.player.dodgeTimer = 0;
      this.player.attackTimer = 0;
      this.player.isCharging = false;
      this.player.chargeTime = 0;
      this.camX = this.player.x;
      this.camY = this.player.y;

      // Clear enemy projectiles & disengage any aggro'd living enemies without reviving KO'd bosses
      this.projectiles = [];
      for (const en of this.world.enemies) {
        if (en.aiState === 'ko') continue;
        en.x = en.homeX;
        en.y = en.homeY;
        en.vx = 0;
        en.vy = 0;
        en.aiState = en.isBoss || en.archetype === 'turret_denial' ? 'idle' : 'patrol';
        en.stateTimer = 1.2;
        if (en.isBoss) {
          en.bossEncounterAnnounced = false;
        }
      }

      this.overlay = 'none';
      this.callbacks.onOpenOverlay('none');
      this.setMode('playing');
      this.sound.setTrack(target.region);
      this.spawnBurst(this.player.x, this.player.y, 26, '#5eead4', 120);
      this.triggerAutosave();

      this.callbacks.onTeleportTransition?.({
        active: true,
        phase: 'hold',
        destinationName: target.name,
        destinationRegionName: regionName,
        accentColor: '#5eead4',
      });

      window.setTimeout(() => {
        this.callbacks.onTeleportTransition?.({
          active: true,
          phase: 'in',
          destinationName: target.name,
          destinationRegionName: regionName,
          accentColor: '#5eead4',
        });
        window.setTimeout(() => {
          this.teleportLocked = false;
          this.callbacks.onTeleportTransition?.(null);
          this.emitToast(
            `Respawned at ${target.name}`,
            'All quests, Gold, gear, and world progress remain intact.',
            'restore'
          );
          this.emitHud();
        }, 200);
      }, 180);
    }, 220);
  }

  public setMode(mode: GameMode): void {
    this.mode = mode;
    document.body.dataset.state = mode === 'victory' ? 'gameover' : mode;
    if (mode === 'playing') {
      this.clearInputs();
    } else if (mode === 'title') {
      this.sound.exitBossEncounter('title', 0.65);
    } else if (mode === 'gameover' || mode === 'victory') {
      const region = getRegionAtWorld(this.player.x, this.player.y);
      this.sound.exitBossEncounter(region, 0.75);
    }
    this.callbacks.onModeChange(mode);
    this.emitHud();
  }

  public setOverlay(overlay: ActiveOverlay): void {
    if (overlay === 'workbench' && !this.blacksmithUnlocked) {
      this.sound.playPlayerHurt();
      this.emitToast(
        'Blacksmith Workshop Locked',
        'Speak to Blacksmith Bram in Haven and return his Missing Hammer first.',
        'warning'
      );
      return;
    }
    this.overlay = overlay;
    if (overlay !== 'none') {
      this.clearInputs();
    }
    this.callbacks.onOpenOverlay(overlay);
    this.emitHud();
  }

  public toggleMute(): void {
    this.sound.unlock();
    this.settings.muted = !this.settings.muted;
    saveStoredSettings(this.settings);
    this.sound.applySettings(this.settings);
    this.emitHud();
  }

  public updateSettings(patch: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...patch };
    saveStoredSettings(this.settings);
    this.sound.applySettings(this.settings);
    this.emitHud();
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public getQuests(): QuestState[] {
    return this.quests;
  }

  public getWorldOverview() {
    return {
      width: this.world.width,
      height: this.world.height,
      restorationNodes: this.world.restorationNodes,
      teleporters: this.world.teleporters,
      workbenches: this.world.workbenches,
      landmarks: this.world.landmarks,
      npcs: this.world.npcs,
      quests: this.quests,
      talkedNpcIds: this.stats.talkedNpcIds,
      visitedRegions: this.stats.visitedRegions,
      coreGateUnlocked: this.stats.coreGateUnlocked,
      playerX: this.player.x,
      playerY: this.player.y,
    };
  }

  public getTeleporters(): TeleporterStation[] {
    return this.world.teleporters.map((t) => ({ ...t }));
  }

  public getActiveTeleporter(): TeleporterStation | null {
    if (!this.activeTeleporterId) return null;
    const found = this.world.teleporters.find((t) => t.id === this.activeTeleporterId);
    return found ? { ...found } : null;
  }

  public getProgressionState() {
    return {
      equippedWeapon: this.player.equippedWeapon,
      unlockedWeapons: [...this.player.unlockedWeapons],
      weaponUpgrades: JSON.parse(JSON.stringify(this.player.weaponUpgrades)) as PlayerState['weaponUpgrades'],
      equippedArmour: this.player.equippedArmour,
      unlockedArmour: [...this.player.unlockedArmour],
      armourUpgrades: { ...this.player.armourUpgrades },
      gold: this.player.gold,
      defense: this.player.defense,
      blacksmithUnlocked: this.blacksmithUnlocked,
      blacksmithHammerRecovered: this.blacksmithHammerRecovered,
      skills: { ...this.player.skills },
      skillPoints: this.player.skillPoints,
      level: this.player.level,
      xp: this.player.xp,
      nextLevelXp: this.player.nextLevelXp,
      upgrades: [...this.player.upgrades],
      inventory: { ...this.inventory },
      stats: { ...this.stats },
      combatStats: this.getCombatStats(),
    };
  }

  public returnBlacksmithHammer(): { ok: boolean; message: string } {
    if (this.blacksmithUnlocked) {
      return { ok: true, message: 'Blacksmith workshop is already unlocked!' };
    }
    if ((this.inventory.blacksmith_hammer ?? 0) < 1) {
      return {
        ok: false,
        message: "Find Bram's Forging Hammer on Haven Comm Ridge north of town first.",
      };
    }
    this.inventory = deductCost(this.inventory, { blacksmith_hammer: 1 });
    this.blacksmithHammerRecovered = true;
    this.blacksmithUnlocked = true;
    const hammerQuest = this.quests.find((q) => q.id === 's6_missing_hammer');
    if (hammerQuest && hammerQuest.status === 'locked') {
      hammerQuest.status = 'active';
    }
    this.syncQuests();
    this.sound.playForgeUpgrade();
    this.spawnBurst(this.player.x, this.player.y, 26, '#f59e0b', 120);
    this.emitToast(
      'Blacksmith Workshop Unlocked!',
      'Craft Weapons & Armour and temper upgrades at any Blacksmith Anvil [B].',
      'restore'
    );
    this.triggerAutosave();
    this.emitHud();
    return { ok: true, message: 'Returned Forging Hammer! Blacksmith Workshop unlocked!' };
  }

  // Weapon & Armour Forging, Equipping, Upgrading & Skill Tree API
  public equipWeapon(weaponId: WeaponId): boolean {
    if (!this.player.unlockedWeapons.includes(weaponId)) return false;
    if (this.player.equippedWeapon === weaponId) return true;
    this.player.equippedWeapon = weaponId;
    this.player.weaponSwitchTimer = 0.26;
    this.syncPlayerStatsObj(this.player, false);
    this.sound.playWeaponSwitch();
    this.spawnBurst(this.player.x, this.player.y - 4, 8, WEAPON_CATALOG[weaponId].glowColor, 65);
    this.emitHud();
    return true;
  }

  public cycleWeapon(): void {
    const unlocked = this.player.unlockedWeapons;
    if (unlocked.length <= 1) return;
    const idx = unlocked.indexOf(this.player.equippedWeapon);
    const next = unlocked[(idx + 1) % unlocked.length];
    this.equipWeapon(next);
  }

  public forgeWeapon(weaponId: WeaponId): { ok: boolean; message: string } {
    if (!this.blacksmithUnlocked) {
      return { ok: false, message: 'Unlock Blacksmith Bram’s workshop by returning his hammer first.' };
    }
    const check = canUnlockWeapon(weaponId, this.player, this.inventory, this.stats);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Cannot craft weapon yet.' };
    }
    const def = WEAPON_CATALOG[weaponId];
    this.inventory = deductCost(this.inventory, def.unlockCost);
    this.player.gold = Math.max(0, this.player.gold - def.goldCost);
    this.player.unlockedWeapons = [...this.player.unlockedWeapons, weaponId];
    this.player.equippedWeapon = weaponId;
    this.player.weaponSwitchTimer = 0.3;
    this.stats.craftedCount += 1;
    this.syncPlayerStatsObj(this.player, true);
    this.sound.playForgeUpgrade();
    this.spawnBurst(this.player.x, this.player.y, 24, def.glowColor, 120);
    this.emitToast(`Crafted ${def.name}!`, def.tagline, 'restore');
    this.checkAchievements();
    this.triggerAutosave();
    this.emitHud();
    return { ok: true, message: `Crafted and equipped ${def.name}!` };
  }

  public upgradeWeapon(weaponId: WeaponId, stat: WeaponUpgradeStat): { ok: boolean; message: string } {
    if (!this.blacksmithUnlocked) {
      return { ok: false, message: 'Unlock Blacksmith Bram’s workshop first.' };
    }
    const check = canUpgradeWeaponStat(weaponId, stat, this.player, this.inventory);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Cannot upgrade stat.' };
    }
    this.inventory = deductCost(this.inventory, check.cost);
    this.player.gold = Math.max(0, this.player.gold - check.goldCost);
    this.player.weaponUpgrades[weaponId][stat] += 1;
    this.stats.craftedCount += 1;
    this.syncPlayerStatsObj(this.player, true);
    this.sound.playForgeUpgrade();
    this.spawnBurst(this.player.x, this.player.y, 16, WEAPON_CATALOG[weaponId].glowColor, 95);
    const newLv = getWeaponLevel(this.player.weaponUpgrades[weaponId]);
    this.emitToast(`${WEAPON_CATALOG[weaponId].name} Lv.${newLv}`, 'Weapon upgraded permanently.', 'loot');
    this.checkAchievements();
    this.triggerAutosave();
    this.emitHud();
    return { ok: true, message: `${WEAPON_CATALOG[weaponId].name} upgraded to Lv.${newLv}!` };
  }

  public equipArmour(armourId: ArmourId): boolean {
    if (armourId !== 'none' && !this.player.unlockedArmour.includes(armourId)) return false;
    if (this.player.equippedArmour === armourId) return true;
    this.player.equippedArmour = armourId;
    this.syncPlayerStatsObj(this.player, true);
    this.sound.playWeaponSwitch();
    if (armourId !== 'none') {
      this.spawnBurst(this.player.x, this.player.y - 4, 10, ARMOUR_CATALOG[armourId].accentColor, 70);
    }
    this.emitHud();
    return true;
  }

  public craftArmour(armourId: OwnedArmourId): { ok: boolean; message: string } {
    if (!this.blacksmithUnlocked) {
      return { ok: false, message: 'Unlock Blacksmith Bram’s workshop by returning his hammer first.' };
    }
    const check = canCraftArmour(armourId, this.player, this.inventory, this.stats);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Cannot craft armour yet.' };
    }
    const def = ARMOUR_CATALOG[armourId];
    this.inventory = deductCost(this.inventory, def.craftCost);
    this.player.gold = Math.max(0, this.player.gold - def.goldCost);
    this.player.unlockedArmour = [...this.player.unlockedArmour, armourId];
    this.player.equippedArmour = armourId;
    this.stats.craftedCount += 1;
    this.syncPlayerStatsObj(this.player, true);
    this.sound.playForgeUpgrade();
    this.spawnBurst(this.player.x, this.player.y, 24, def.accentColor, 115);
    this.emitToast(`Crafted ${def.name}!`, `+${def.baseDefense} DEF · +${def.baseMaxHpBonus} Max HP`, 'restore');
    this.checkAchievements();
    this.triggerAutosave();
    this.emitHud();
    return { ok: true, message: `Crafted and equipped ${def.name}!` };
  }

  public upgradeArmour(armourId: OwnedArmourId): { ok: boolean; message: string } {
    if (!this.blacksmithUnlocked) {
      return { ok: false, message: 'Unlock Blacksmith Bram’s workshop first.' };
    }
    const check = canUpgradeArmour(armourId, this.player, this.inventory);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Cannot upgrade armour.' };
    }
    this.inventory = deductCost(this.inventory, check.cost);
    this.player.gold = Math.max(0, this.player.gold - check.goldCost);
    this.player.armourUpgrades[armourId] = (this.player.armourUpgrades[armourId] ?? 0) + 1;
    this.stats.craftedCount += 1;
    this.syncPlayerStatsObj(this.player, true);
    this.sound.playForgeUpgrade();
    const def = ARMOUR_CATALOG[armourId];
    const eff = getArmourEffectiveStats(armourId, this.player.armourUpgrades[armourId]);
    this.spawnBurst(this.player.x, this.player.y, 18, def.accentColor, 95);
    this.emitToast(
      `${def.name} Lv.${eff.level}`,
      `DEF ${eff.defense} · +${eff.maxHpBonus} Max HP`,
      'loot'
    );
    this.checkAchievements();
    this.triggerAutosave();
    this.emitHud();
    return { ok: true, message: `${def.name} upgraded to Lv.${eff.level}!` };
  }

  public learnSkill(skillId: SkillId): { ok: boolean; message: string } {
    const check = canLearnSkill(skillId, this.player);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Cannot learn skill.' };
    }
    this.player.skillPoints -= 1;
    this.player.skills[skillId] = (this.player.skills[skillId] ?? 0) + 1;
    this.syncPlayerStatsObj(this.player, true);
    this.sound.playDiscovery();
    this.spawnBurst(this.player.x, this.player.y, 18, '#5eead4', 90);
    this.triggerAutosave();
    this.emitHud();
    return { ok: true, message: 'Skill rank unlocked!' };
  }

  // Teleportation Network Activation & Smooth Animated World Travel
  public activateTeleporter(tpId: TeleporterId): { ok: boolean; message: string } {
    const tp = this.world.teleporters.find((t) => t.id === tpId);
    if (!tp) return { ok: false, message: 'Teleporter not found.' };
    const check = canActivateTeleporter(tp, this.inventory, this.player.energy, this.stats.coreGateUnlocked);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Cannot activate gateway.' };
    }
    this.inventory = deductCost(this.inventory, tp.activationCost);
    this.player.energy = Math.max(0, this.player.energy - tp.energyCost);
    tp.discovered = true;
    tp.activated = true;
    this.lastCheckpointId = tp.id;
    this.sound.playTeleporterActivate();
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.35);
    this.spawnBurst(tp.x, tp.y - 8, 32, tp.accentColor, 150);
    this.spawnBurst(tp.x, tp.y - 8, 16, tp.secondaryColor, 95);
    this.emitToast(`${tp.name} Activated!`, 'Fast travel & respawn checkpoint permanently unlocked.', 'restore');
    this.triggerAutosave();
    this.emitHud();
    return { ok: true, message: `${tp.name} is now online!` };
  }

  public travelToTeleporter(destId: TeleporterId): { ok: boolean; message: string } {
    if (this.teleportLocked) return { ok: false, message: 'Teleport already in progress.' };
    const dest = this.world.teleporters.find((t) => t.id === destId);
    if (!dest) return { ok: false, message: 'Destination not found.' };
    const check = canTravelToTeleporter(dest);
    if (!check.ok) {
      return { ok: false, message: check.reason ?? 'Destination is locked.' };
    }

    this.teleportLocked = true;
    this.setOverlay('none');
    this.clearInputs();
    this.sound.playTeleportWarp();
    this.spawnBurst(this.player.x, this.player.y, 26, dest.accentColor, 130);

    const regionName = REGION_META[dest.region].name;
    this.callbacks.onTeleportTransition?.({
      active: true,
      phase: 'out',
      destinationName: dest.name,
      destinationRegionName: regionName,
      accentColor: dest.accentColor,
    });

    window.setTimeout(() => {
      // Relocate player accurately to the destination teleporter pad
      this.interiorId = null;
      this.player.x = dest.x;
      this.player.y = dest.y + 34;
      this.player.facing = 'down';
      this.lastCheckpointId = dest.id;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
      this.player.trailingHp = Math.max(this.player.trailingHp, this.player.hp);
      this.camX = this.player.x;
      this.camY = this.player.y;
      if (!this.stats.visitedRegions.includes(dest.region)) {
        this.stats.visitedRegions.push(dest.region);
      }
      this.sound.setTrack(dest.region);
      this.triggerAutosave();
      this.spawnBurst(this.player.x, this.player.y, 28, dest.accentColor, 125);
      this.callbacks.onTeleportTransition?.({
        active: true,
        phase: 'hold',
        destinationName: dest.name,
        destinationRegionName: regionName,
        accentColor: dest.accentColor,
      });
      this.emitHud();

      window.setTimeout(() => {
        this.callbacks.onTeleportTransition?.({
          active: true,
          phase: 'in',
          destinationName: dest.name,
          destinationRegionName: regionName,
          accentColor: dest.accentColor,
        });
        window.setTimeout(() => {
          this.teleportLocked = false;
          this.callbacks.onTeleportTransition?.(null);
          this.emitToast(`Arrived: ${dest.name}`, regionName, 'discovery');
          this.emitHud();
        }, 280);
      }, 280);
    }, 320);

    return { ok: true, message: `Travelling to ${dest.name}...` };
  }

  public returnToHaven(): { ok: boolean; message: string } {
    return this.travelToTeleporter('tp_haven');
  }

  // Mobile / Virtual Touch Control Hooks
  public setVirtualMove(dx: number, dy: number, sprinting = false): void {
    this.virtualMoveX = Math.max(-1, Math.min(1, dx));
    this.virtualMoveY = Math.max(-1, Math.min(1, dy));
    this.virtualSprinting = sprinting;
  }

  public triggerAttack(): void {
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.sound.unlock();
    this.lastAttackFromTouch = true;
    this.attackBufferTimer = 0.16;
  }

  public triggerHeavyAttack(): void {
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.sound.unlock();
    this.lastAttackFromTouch = true;
    this.heavyAttackBufferTimer = 0.18;
  }

  public triggerEnergyStrike(): void {
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.sound.unlock();
    this.lastAttackFromTouch = true;
    this.energyStrikeQueued = true;
  }

  public triggerDodge(): void {
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.sound.unlock();
    this.dodgeBufferTimer = 0.16;
  }

  public triggerInteract(): void {
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.sound.unlock();
    this.interactQueued = true;
  }

  public triggerPulse(): void {
    if (this.mode !== 'playing' || this.overlay !== 'none') return;
    this.sound.unlock();
    this.pulseQueued = true;
  }

  public useItem(itemId: ItemId): string {
    const res = useConsumableItem(itemId, this.inventory, this.player);
    if (res.ok) {
      this.inventory = res.inventory;
      this.player = res.player;
      this.sound.playPickup();
      this.spawnBurst(this.player.x, this.player.y, 12, '#6ee7b7', 75);
      this.emitHud();
    }
    return res.message;
  }

  public craft(recipeId: string): string {
    const res = applyCraftRecipe(recipeId, this.inventory, this.player);
    if (res.ok) {
      this.inventory = res.inventory;
      this.player = res.player;
      this.syncPlayerStatsObj(this.player, true);
      this.stats.craftedCount += 1;
      this.sound.playRestore();
      this.spawnBurst(this.player.x, this.player.y, 18, '#fbbf24', 95);
      this.emitToast('Crafted', res.message, 'loot');
      this.checkAchievements();
      this.triggerAutosave();
      this.emitHud();
    }
    return res.message;
  }

  public executeTrade(offer: TradeOffer): string {
    // Validate payment first (never mutate inventory/Gold on failure)
    if (offer.giveGold && this.player.gold < offer.giveGold) {
      return `Need ${offer.giveGold} Gold (you have ${this.player.gold} Gold).`;
    }
    const itemCost = offer.giveItem && offer.giveQty ? { [offer.giveItem]: offer.giveQty } : {};
    if (offer.giveItem && offer.giveQty && !canAffordCost(this.inventory, itemCost)) {
      return `Need ${offer.giveQty} ${ITEM_CATALOG[offer.giveItem].name}.`;
    }

    // Simulate item deduction before testing 40-slot Backpack capacity
    const afterDeduct = offer.giveItem && offer.giveQty ? deductCost(this.inventory, itemCost) : { ...this.inventory };
    if (offer.receiveItem && offer.receiveQty) {
      const addRes = tryAddItemsToBackpack(afterDeduct, { [offer.receiveItem]: offer.receiveQty });
      if (!addRes.ok) {
        this.emitToast('Backpack Full', addRes.reason ?? 'Free up a backpack slot first.', 'warning');
        return addRes.reason ?? 'Backpack full (40/40 slots).';
      }
      this.inventory = addRes.inventory;
    } else {
      this.inventory = afterDeduct;
    }

    if (offer.giveGold) {
      this.player.gold = Math.max(0, this.player.gold - offer.giveGold);
    }
    if (offer.receiveGold) {
      this.player.gold += offer.receiveGold;
    }

    this.sound.playPickup();
    const rewardLabel = offer.receiveItem && offer.receiveQty
      ? `${offer.receiveQty}× ${ITEM_CATALOG[offer.receiveItem].name}`
      : `${offer.receiveGold ?? 0} Gold`;
    this.emitToast('Trade Complete', `Received ${rewardLabel}`, 'loot');
    this.triggerAutosave();
    this.emitHud();
    return `Received ${rewardLabel}!`;
  }

  public fastTravelToNode(nodeId: string): boolean {
    // Support both legacy restored relays AND activated Teleporter Stations
    const tp = this.world.teleporters.find((t) => t.id === nodeId);
    if (tp) {
      return this.travelToTeleporter(tp.id).ok;
    }
    const node = this.world.restorationNodes.find((n) => n.id === nodeId);
    if (!node || !node.restored || !node.fastTravelUnlocked) return false;
    this.interiorId = null;
    this.player.x = node.x;
    this.player.y = node.y + 42;
    this.camX = this.player.x;
    this.camY = this.player.y;
    this.setOverlay('none');
    this.sound.playRestore();
    this.spawnBurst(this.player.x, this.player.y, 20, '#5eead4', 110);
    this.emitToast('Fast Traveled', node.name, 'discovery');
    this.emitHud();
    return true;
  }

  public continueAfterVictory(): void {
    this.setMode('playing');
    this.emitHud();
  }

  public destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.sound.stop();
    this.unbindEvents();
    this.resizeObserver?.disconnect();
  }

  // =========================================================================
  // INPUT & RESIZE HANDLERS
  // =========================================================================
  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;

    // Title screen Enter/Space start handshake
    if (this.mode === 'title') {
      if (this.overlay === 'none' && (code === 'Enter' || code === 'Space')) {
        e.preventDefault();
        this.startNewGame();
      } else if (this.overlay !== 'none' && code === 'Escape') {
        this.setOverlay('none');
      }
      return;
    }

    if (this.mode === 'gameover') {
      if (code === 'Enter') {
        e.preventDefault();
        this.respawnAtCheckpoint();
      }
      return;
    }
    if (this.mode === 'victory') return;

    // Escape closes active overlay or toggles pause
    if (code === 'Escape') {
      e.preventDefault();
      if (this.overlay !== 'none') {
        this.setOverlay('none');
      } else if (this.mode === 'paused') {
        this.setMode('playing');
      } else {
        this.setMode('paused');
      }
      return;
    }

    if (this.mode === 'paused') {
      if (code === 'KeyP') {
        this.setMode('playing');
      }
      return;
    }

    // Menu shortcut toggles during playing
    if (code === 'KeyI') {
      e.preventDefault();
      this.sound.playUiClick();
      this.setOverlay(this.overlay === 'inventory' ? 'none' : 'inventory');
      return;
    }
    if (code === 'KeyM') {
      e.preventDefault();
      this.sound.playUiClick();
      this.setOverlay(this.overlay === 'map' ? 'none' : 'map');
      return;
    }
    if (code === 'KeyJ') {
      e.preventDefault();
      this.sound.playUiClick();
      this.setOverlay(this.overlay === 'quests' ? 'none' : 'quests');
      return;
    }
    if (code === 'KeyB') {
      e.preventDefault();
      this.sound.playUiClick();
      this.setOverlay(this.overlay === 'workbench' ? 'none' : 'workbench');
      return;
    }
    if (code === 'KeyK') {
      e.preventDefault();
      this.sound.playUiClick();
      this.setOverlay(this.overlay === 'skills' ? 'none' : 'skills');
      return;
    }
    if (code === 'KeyT') {
      e.preventDefault();
      this.sound.playUiClick();
      this.setOverlay(this.overlay === 'travel' ? 'none' : 'travel');
      return;
    }
    if (code === 'KeyP' && this.overlay === 'none') {
      e.preventDefault();
      this.setMode('paused');
      return;
    }

    if (this.overlay !== 'none' || this.teleportLocked) return;

    this.sound.unlock();

    // Prevent scrolling on arrow/space/tab
    if (
      code === 'Space' ||
      code === 'Tab' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight'
    ) {
      e.preventDefault();
    }

    const wasHeld = this.heldKeys.has(code);
    this.heldKeys.add(code);

    // Edge-triggered one-shot actions with buffering
    if (!wasHeld) {
      if (code === 'Space') this.dodgeBufferTimer = 0.14;
      if (code === 'KeyE') this.interactQueued = true;
      if (code === 'KeyQ') this.pulseQueued = true;
      if (code === 'KeyF') {
        this.lastAttackFromTouch = false;
        this.attackBufferTimer = 0.14;
      }
      if (code === 'KeyR') {
        this.lastAttackFromTouch = false;
        this.heavyAttackBufferTimer = 0.16;
      }
      if (code === 'KeyC') {
        this.lastAttackFromTouch = false;
        this.energyStrikeQueued = true;
      }
      if (code === 'Tab') {
        this.cycleWeapon();
      }
      if (code.startsWith('Digit')) {
        const idx = parseInt(code.slice(5), 10) - 1;
        if (idx >= 0 && idx < WEAPON_ORDER.length) {
          this.equipWeapon(WEAPON_ORDER[idx]);
        }
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreenX = e.clientX - rect.left;
    this.mouseScreenY = e.clientY - rect.top;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.mode !== 'playing' || this.overlay !== 'none' || this.teleportLocked) return;
    if ((e.target as HTMLElement)?.closest('button, input, [role="dialog"]')) return;
    this.sound.unlock();
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreenX = e.clientX - rect.left;
    this.mouseScreenY = e.clientY - rect.top;
    this.lastAttackFromTouch = false;

    if (e.button === 0) {
      this.mouseLeftDown = true;
      this.mouseDownTime = 0;
      this.player.isCharging = true;
      this.player.chargeTime = 0;
    } else if (e.button === 2) {
      this.heavyAttackBufferTimer = 0.16;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button !== 0 || !this.mouseLeftDown) return;
    this.mouseLeftDown = false;
    const held = this.mouseDownTime;
    this.mouseDownTime = 0;
    this.player.isCharging = false;
    this.player.chargeTime = 0;

    if (this.mode !== 'playing' || this.overlay !== 'none' || this.teleportLocked) return;
    if (held >= 0.36) {
      this.heavyAttackBufferTimer = 0.16;
      this.player.attackStyle = 'charged';
    } else {
      this.attackBufferTimer = 0.14;
    }
  };

  private onContextMenu = (e: MouseEvent) => {
    if (this.mode === 'playing' && this.overlay === 'none') {
      e.preventDefault();
    }
  };

  private onWindowBlur = () => {
    this.clearInputs();
  };

  private onVisibilityChange = () => {
    if (document.hidden) this.clearInputs();
  };

  private clearInputs(): void {
    this.heldKeys.clear();
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.virtualSprinting = false;
    this.attackBufferTimer = 0;
    this.heavyAttackBufferTimer = 0;
    this.energyStrikeQueued = false;
    this.dodgeBufferTimer = 0;
    this.interactQueued = false;
    this.pulseQueued = false;
    this.mouseLeftDown = false;
    this.mouseDownTime = 0;
    if (this.player) {
      this.player.isCharging = false;
      this.player.chargeTime = 0;
    }
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  private unbindEvents(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private handleResize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    this.viewportW = Math.max(320, Math.floor(rect.width));
    this.viewportH = Math.max(240, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.viewportW * dpr);
    this.canvas.height = Math.floor(this.viewportH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const zoom = this.getZoom();
    return {
      x: (sx - this.viewportW / 2) / zoom + this.camX,
      y: (sy - this.viewportH / 2) / zoom + this.camY,
    };
  }

  // =========================================================================
  // MAIN 60 FPS SIMULATION LOOP
  // =========================================================================
  private loop = (nowMs: number) => {
    const rawDt = (nowMs - this.lastFrameMs) / 1000;
    this.lastFrameMs = nowMs;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.time += dt;
    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 1.9);
    if (this.autosaveIndicatorTimer > 0) {
      this.autosaveIndicatorTimer = Math.max(0, this.autosaveIndicatorTimer - dt);
    }

    if (this.mode === 'title') {
      this.updateTitleTour(dt);
    } else if (this.mode === 'playing' && this.overlay === 'none' && !this.teleportLocked) {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      } else {
        this.updateGameplay(dt);
      }
    }

    this.updateParticles(dt);
    this.render();

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.18) {
      this.hudEmitAccum = 0;
      this.emitHud(false);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private updateTitleTour(dt: number): void {
    // Gentle scenic camera glide across Haven Plaza, cabins, campfire & Forest edge
    const tourX = 21 * TILE_SIZE + Math.sin(this.time * 0.14) * 210;
    const tourY = 60 * TILE_SIZE + Math.cos(this.time * 0.11) * 120;
    const k = 1 - Math.exp(-3 * dt);
    this.camX += (tourX - this.camX) * k;
    this.camY += (tourY - this.camY) * k;
    this.timeOfDay = 17.8; // Atmospheric golden dusk on title screen!
    // Ambient campfire embers
    if (Math.random() < dt * 10) {
      const cf = this.world.campfires[0];
      this.spawnParticle(cf.x + (Math.random() - 0.5) * 10, cf.y - 6, (Math.random() - 0.5) * 14, -22 - Math.random() * 18, 2.5, '#fbbf24', 0.9);
    }
  }

  private updateGameplay(dt: number): void {
    this.stats.timePlayedSec += dt;

    // Day/night progression (1 full day ~ 6.5 minutes at speed 1)
    if (this.settings.dayNightSpeed > 0 && !this.interiorId) {
      this.timeOfDay = (this.timeOfDay + dt * 0.062 * this.settings.dayNightSpeed) % 24;
    }

    // Weather transitions
    if (this.settings.weatherEnabled && !this.interiorId) {
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        const pool: WeatherType[] = ['clear', 'clear', 'wind', 'rain', 'fog'];
        this.weather = pool[Math.floor(Math.random() * pool.length)];
        this.weatherTimer = 42 + Math.random() * 38;
      }
    } else {
      this.weather = 'clear';
    }

    this.updatePlayer(dt);
    if (!this.interiorId) {
      this.updateEnemies(dt);
      this.updateLandmarksAndRegion();
    }
    this.updateProjectiles(dt);
    this.updateFloatingTexts(dt);

    // Ambient regional particles & campfire embers
    this.updateAmbientParticles(dt);

    // Smooth camera follow clamped to active map
    const mapGrid = this.getActiveGrid();
    const zoom = this.getZoom();
    const halfViewW = this.viewportW / (2 * zoom);
    const halfViewH = this.viewportH / (2 * zoom);
    const maxCamX = Math.max(halfViewW, mapGrid.width * TILE_SIZE - halfViewW);
    const maxCamY = Math.max(halfViewH, mapGrid.height * TILE_SIZE - halfViewH);

    let targetCamX = this.player.x;
    let targetCamY = this.player.y;
    if (mapGrid.width * TILE_SIZE <= halfViewW * 2) {
      targetCamX = (mapGrid.width * TILE_SIZE) / 2;
    } else {
      targetCamX = Math.max(halfViewW, Math.min(maxCamX, targetCamX));
    }
    if (mapGrid.height * TILE_SIZE <= halfViewH * 2) {
      targetCamY = (mapGrid.height * TILE_SIZE) / 2;
    } else {
      targetCamY = Math.max(halfViewH, Math.min(maxCamY, targetCamY));
    }

    const damp = 1 - Math.exp(-9 * dt);
    this.camX += (targetCamX - this.camX) * damp;
    this.camY += (targetCamY - this.camY) * damp;
  }

  private updateAmbientParticles(dt: number): void {
    const densityMult = this.settings.particleDensity === 'low' ? 0.45 : this.settings.particleDensity === 'high' ? 1.35 : this.viewportW <= 920 ? 0.65 : 1.0;

    // Campfire flames & rising embers
    if (Math.random() < dt * 9 * densityMult) {
      for (const cf of this.world.campfires) {
        if ((cf.interiorId ?? null) !== this.interiorId) continue;
        if (Math.hypot(cf.x - this.player.x, cf.y - this.player.y) < 380) {
          this.spawnParticle(
            cf.x + (Math.random() - 0.5) * 8,
            cf.y - 5,
            (Math.random() - 0.5) * 12,
            -20 - Math.random() * 20,
            2,
            Math.random() > 0.4 ? '#fb923c' : '#fde047',
            0.8
          );
        }
      }
    }

    if (this.interiorId) return;

    const region = getRegionAtWorld(this.player.x, this.player.y);
    const daylight = getDaylightState(this.timeOfDay);
    const spanX = 290;
    const spanY = 180;
    const rx = this.player.x + (Math.random() - 0.5) * spanX * 2;
    const ry = this.player.y + (Math.random() - 0.5) * spanY * 2;

    // Dusk & Night fireflies in Haven and Overgrown Forest
    if ((region === 'haven' || region === 'forest') && (daylight.phase === 'Dusk' || daylight.phase === 'Night')) {
      if (Math.random() < dt * 7 * densityMult) {
        this.spawnParticle(
          rx,
          ry,
          (Math.random() - 0.5) * 18,
          -6 - Math.random() * 10,
          2.5,
          region === 'forest' ? '#bef264' : '#fde047',
          1.4 + Math.random() * 0.9
        );
      }
    } else if (region === 'forest' && Math.random() < dt * 6 * densityMult) {
      // Drifting forest leaves during daylight
      this.spawnParticle(
        rx,
        ry - 40,
        (this.weather === 'wind' ? 32 : 12) + Math.random() * 10,
        14 + Math.random() * 12,
        2.5,
        Math.random() > 0.5 ? '#86efac' : '#d9f99d',
        1.5
      );
    } else if ((region === 'city' || region === 'wasteland') && Math.random() < dt * 6.5 * densityMult) {
      // Smoke wisps & wind-blown dust/sparks around ruins & factories
      const isSmoke = Math.random() < 0.65;
      this.spawnParticle(
        rx,
        ry,
        (this.weather === 'wind' ? 28 : 6) + (Math.random() - 0.5) * 10,
        isSmoke ? -18 - Math.random() * 14 : (Math.random() - 0.5) * 8,
        isSmoke ? 4 : 2,
        isSmoke
          ? region === 'wasteland'
            ? 'rgba(130, 146, 128, 0.55)'
            : 'rgba(150, 158, 166, 0.45)'
          : '#d6c5a3',
        1.3 + Math.random() * 0.7
      );
    } else if (region === 'core' && Math.random() < dt * 8 * densityMult) {
      // Luminous floating Core energy motes
      this.spawnParticle(
        rx,
        ry,
        (Math.random() - 0.5) * 14,
        -24 - Math.random() * 20,
        2.5,
        Math.random() > 0.35 ? '#5eead4' : '#e0f2fe',
        1.2 + Math.random() * 0.7
      );
    } else if (region === 'haven' && Math.random() < dt * 3.5 * densityMult) {
      // Warm sunlit dust motes in The Last Haven
      this.spawnParticle(
        rx,
        ry,
        8 + Math.random() * 8,
        -4 - Math.random() * 6,
        2,
        'rgba(254, 240, 185, 0.55)',
        1.4
      );
    }
  }

  private getActiveGrid() {
    if (this.interiorId && this.world.interiors[this.interiorId]) {
      return this.world.interiors[this.interiorId];
    }
    return { width: this.world.width, height: this.world.height, tiles: this.world.tiles };
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    const c = this.getCombatStats();
    const grid = this.getActiveGrid();

    // Timers & regen
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.energyStrikeCooldown = Math.max(0, p.energyStrikeCooldown - dt);
    p.weaponSwitchTimer = Math.max(0, p.weaponSwitchTimer - dt);
    p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);
    p.pulseTimer = Math.max(0, p.pulseTimer - dt);
    p.pulseCooldown = Math.max(0, p.pulseCooldown - dt);
    this.attackBufferTimer = Math.max(0, this.attackBufferTimer - dt);
    this.heavyAttackBufferTimer = Math.max(0, this.heavyAttackBufferTimer - dt);
    this.dodgeBufferTimer = Math.max(0, this.dodgeBufferTimer - dt);

    // Smooth trailing damage bar
    if (p.trailingHp > p.hp) {
      p.trailingHp = Math.max(p.hp, p.trailingHp - dt * 42);
    } else {
      p.trailingHp = p.hp;
    }

    // Damped squash & stretch recovery
    const sqDamp = 1 - Math.exp(-14 * dt);
    p.squashX += (1 - p.squashX) * sqDamp;
    p.squashY += (1 - p.squashY) * sqDamp;

    // Stamina & passive Arc Energy regeneration (boosted near restored relays & activated teleporters)
    if (p.dodgeTimer <= 0) {
      p.stamina = Math.min(p.maxStamina, p.stamina + c.staminaRegen * dt);
    }
    const nearRestored =
      !this.interiorId &&
      (this.world.restorationNodes.some(
        (n) => n.restored && Math.hypot(n.x - p.x, n.y - p.y) < 145
      ) ||
        this.world.teleporters.some(
          (t) => t.activated && Math.hypot(t.x - p.x, t.y - p.y) < 145
        ));
    if (nearRestored) {
      p.energyRegenAnimTimer = Math.min(1, p.energyRegenAnimTimer + dt * 2.5);
    } else {
      p.energyRegenAnimTimer = Math.max(0, p.energyRegenAnimTimer - dt * 1.8);
    }
    p.energy = Math.min(
      p.maxEnergy,
      p.energy + (nearRestored ? c.energyRegen * 3.5 : c.energyRegen) * dt
    );
    if ((p.celebrateTimer ?? 0) > 0) {
      p.celebrateTimer = Math.max(0, (p.celebrateTimer ?? 0) - dt);
    }
    if ((p.energyCastTimer ?? 0) > 0) {
      p.energyCastTimer = Math.max(0, (p.energyCastTimer ?? 0) - dt);
    }

    // Hold-left-click charging for Charged Heavy Attack
    if (this.mouseLeftDown && this.overlay === 'none' && !this.teleportLocked) {
      this.mouseDownTime += dt;
      p.isCharging = this.mouseDownTime > 0.14;
      p.chargeTime = Math.min(0.6, this.mouseDownTime);
      if (p.isCharging && this.settings.visualEffects !== 'low' && Math.random() < 0.35) {
        const w = WEAPON_CATALOG[p.equippedWeapon];
        const ang = Math.random() * Math.PI * 2;
        this.spawnParticle(
          p.x + Math.cos(ang) * 18,
          p.y + Math.sin(ang) * 14,
          -Math.cos(ang) * 28,
          -Math.sin(ang) * 28,
          2.2,
          w.glowColor,
          0.26
        );
      }
    } else {
      p.isCharging = false;
      p.chargeTime = 0;
    }

    // Movement vector (keyboard + mobile virtual joystick)
    let ix = this.virtualMoveX;
    let iy = this.virtualMoveY;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) iy -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) iy += 1;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) ix -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) ix += 1;
    const len = Math.hypot(ix, iy);
    if (len > 0.08) {
      const mag = Math.min(1, len);
      ix = (ix / len) * mag;
      iy = (iy / len) * mag;
      if (Math.abs(ix) > Math.abs(iy)) {
        p.facing = ix > 0 ? 'right' : 'left';
      } else {
        p.facing = iy > 0 ? 'down' : 'up';
      }
    } else {
      ix = 0;
      iy = 0;
    }

    // Sprint (Shift or virtual joystick full-tilt / sprint toggle)
    const wantsSprint =
      this.heldKeys.has('ShiftLeft') || this.heldKeys.has('ShiftRight') || this.virtualSprinting;
    const sprinting = wantsSprint && len > 0.15 && p.stamina > 8;
    p.isSprinting = sprinting;
    if (sprinting) {
      p.stamina = Math.max(0, p.stamina - 18 * dt);
    }

    // Dodge roll (buffered Space)
    if (this.dodgeBufferTimer > 0 && p.dodgeCooldown <= 0 && p.stamina >= 22) {
      this.dodgeBufferTimer = 0;
      p.stamina -= 22;
      p.dodgeTimer = 0.22;
      p.dodgeCooldown = 0.55;
      p.invulnTimer = 0.28;
      if (len > 0) {
        p.dodgeDirX = ix;
        p.dodgeDirY = iy;
      } else {
        p.dodgeDirX = p.facing === 'right' ? 1 : p.facing === 'left' ? -1 : 0;
        p.dodgeDirY = p.facing === 'down' ? 1 : p.facing === 'up' ? -1 : 0;
      }
      p.squashX = 1.24;
      p.squashY = 0.78;
      this.sound.playDodge();
      this.spawnBurst(p.x, p.y + 6, 6, '#94a3b8', 55);
    }

    // Apply velocity
    if (p.dodgeTimer > 0) {
      p.dodgeTimer = Math.max(0, p.dodgeTimer - dt);
      p.vx = p.dodgeDirX * p.moveSpeed * 2.45;
      p.vy = p.dodgeDirY * p.moveSpeed * 2.45;
    } else {
      const chargeSlow = p.isCharging ? 0.65 : 1;
      const spd = p.moveSpeed * (sprinting ? 1.32 : 1) * chargeSlow;
      p.vx = ix * spd;
      p.vy = iy * spd;
    }

    // Move & resolve smooth wall-sliding collisions
    const prevX = p.x;
    const prevY = p.y;
    const res = resolveCircleTileCollision(
      p.x + p.vx * dt,
      p.y + p.vy * dt,
      10,
      grid,
      this.stats.coreGateUnlocked
    );
    p.x = res.x;
    p.y = res.y;

    const moved = Math.hypot(p.x - prevX, p.y - prevY);
    if (moved > 0.2) {
      p.walkCycle += moved * (sprinting ? 0.2 : 0.16);
      p.footstepDist += moved;
      if (p.footstepDist >= (sprinting ? 28 : 34) && p.dodgeTimer <= 0) {
        p.footstepDist = 0;
        this.sound.playFootstep();
        this.spawnParticle(
          p.x,
          p.y + 9,
          (Math.random() - 0.5) * 16,
          -6,
          2.5,
          'rgba(195,185,160,0.65)',
          0.35
        );
      }
    } else {
      // Keep idle stance planted cleanly rather than frozen mid-stride
      p.walkCycle = 0;
    }

    // Toxic sludge hazard check in Wasteland
    if (!this.interiorId && !p.upgrades.includes('hazmat_filter')) {
      const tx = Math.floor(p.x / TILE_SIZE);
      const ty = Math.floor(p.y / TILE_SIZE);
      const tile = this.world.tiles[ty * this.world.width + tx];
      if (isTileHazardous(tile)) {
        this.toxicTickTimer -= dt;
        if (this.toxicTickTimer <= 0) {
          this.toxicTickTimer = 0.65;
          this.damagePlayer(8, p.x, p.y, 'Toxic Sludge!');
        }
      }
    }

    // Aim angle toward mouse pointer
    const worldMouse = this.screenToWorld(this.mouseScreenX, this.mouseScreenY);
    p.aimAngle = Math.atan2(worldMouse.y - p.y, worldMouse.x - p.x);

    const resolveAttackAngle = (): number => {
      if (this.lastAttackFromTouch) {
        let nearest: EnemyEntity | null = null;
        let bestDist = 200;
        if (!this.interiorId) {
          for (const en of this.world.enemies) {
            if (en.aiState === 'ko') continue;
            const d = Math.hypot(en.x - p.x, en.y - p.y);
            if (d < bestDist) {
              bestDist = d;
              nearest = en;
            }
          }
        }
        return nearest
          ? Math.atan2(nearest.y - p.y, nearest.x - p.x)
          : p.facing === 'right'
            ? 0
            : p.facing === 'left'
              ? Math.PI
              : p.facing === 'down'
                ? Math.PI / 2
                : -Math.PI / 2;
      }
      return this.mouseScreenX > 0 || this.mouseScreenY > 0
        ? p.aimAngle
        : p.facing === 'right'
          ? 0
          : p.facing === 'left'
            ? Math.PI
            : p.facing === 'down'
              ? Math.PI / 2
              : -Math.PI / 2;
    };

    const fireBowArrow = (style: AttackStyle, angle: number) => {
      const wDef = WEAPON_CATALOG[p.equippedWeapon];
      if ((this.inventory.arrow ?? 0) <= 0) {
        this.sound.playPlayerHurt();
        this.spawnFloatingText(p.x, p.y - 24, 'No Arrows!', '#f87171');
        this.emitToast('Out of Arrows', 'Buy Arrows from Tinker Jax or Herbalist Moss using Gold.', 'warning');
        return;
      }
      this.inventory = deductCost(this.inventory, { arrow: 1 });
      const isCharged = style === 'charged';
      const isHeavy = style === 'heavy';
      p.attackStyle = style;
      p.attackDuration = 0.2;
      p.attackTimer = p.attackDuration;
      p.attackCooldown = isCharged || isHeavy ? c.heavyCooldown : c.attackCooldown;
      p.attackAngle = angle;
      p.facing =
        Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))
          ? Math.cos(angle) >= 0
            ? 'right'
            : 'left'
          : Math.sin(angle) >= 0
            ? 'down'
            : 'up';
      p.attackHitIds = [];
      p.squashX = 1.12;
      p.squashY = 0.9;
      this.sound.playWeaponSwing(p.equippedWeapon, style);

      const arrowSpeed = (wDef.projectileSpeed ?? 390) * (isCharged ? 1.2 : isHeavy ? 1.1 : 1);
      const arrowDamage = isCharged ? c.chargedDamage : isHeavy ? c.heavyDamage : c.weaponDamage;
      const life = Math.max(0.45, c.attackRange / arrowSpeed);
      this.projectiles.push({
        id: `arrow_${Math.random().toString(36).slice(2)}`,
        fromPlayer: true,
        kind: 'player_arrow',
        x: p.x + Math.cos(angle) * 14,
        y: p.y + Math.sin(angle) * 14,
        vx: Math.cos(angle) * arrowSpeed,
        vy: Math.sin(angle) * arrowSpeed,
        angle,
        radius: 5.5,
        damage: arrowDamage,
        life,
        maxLife: life,
        color: wDef.slashPrimaryColor,
        accentColor: wDef.glowColor,
        piercing: false,
        hitIds: [],
      });
      this.emitHud();
    };

    // Buffered Heavy / Charged Attack (Right-Click / R / Hold Left-Click >= 0.36s)
    if (this.heavyAttackBufferTimer > 0 && p.attackCooldown <= 0 && p.dodgeTimer <= 0) {
      this.heavyAttackBufferTimer = 0;
      const isCharged = p.attackStyle === 'charged';
      const wDef = WEAPON_CATALOG[p.equippedWeapon];
      const angle = resolveAttackAngle();
      if (wDef.category === 'bow') {
        fireBowArrow(isCharged ? 'charged' : 'heavy', angle);
      } else {
        const isAxe = wDef.category === 'axe';
        p.attackStyle = isCharged ? 'charged' : 'heavy';
        p.attackDuration = isCharged ? (isAxe ? 0.38 : 0.32) : isAxe ? 0.34 : 0.28;
        p.attackTimer = p.attackDuration;
        p.attackCooldown = c.heavyCooldown;
        p.attackAngle = angle;
        p.facing =
          Math.abs(Math.cos(p.attackAngle)) > Math.abs(Math.sin(p.attackAngle))
            ? Math.cos(p.attackAngle) >= 0
              ? 'right'
              : 'left'
            : Math.sin(p.attackAngle) >= 0
              ? 'down'
              : 'up';
        p.attackHitIds = [];
        p.squashX = isAxe ? 1.3 : 1.24;
        p.squashY = isAxe ? 0.76 : 0.8;
        this.sound.playWeaponSwing(p.equippedWeapon, p.attackStyle);
        this.shakeTrauma = Math.min(1, this.shakeTrauma + (isCharged || isAxe ? 0.3 : 0.18));
        if (this.settings.visualEffects !== 'low') {
          this.spawnBurst(
            p.x + Math.cos(p.attackAngle) * 18,
            p.y + Math.sin(p.attackAngle) * 18,
            isCharged || isAxe ? 14 : 8,
            wDef.glowColor,
            95
          );
        }
      }
    } else if (this.attackBufferTimer > 0 && p.attackCooldown <= 0 && p.dodgeTimer <= 0) {
      // Buffered Basic Attack (Sword / Axe melee cleave OR Bow arrow shot)
      this.attackBufferTimer = 0;
      const wDef = WEAPON_CATALOG[p.equippedWeapon];
      const angle = resolveAttackAngle();
      if (wDef.category === 'bow') {
        fireBowArrow('basic', angle);
      } else {
        const isAxe = wDef.category === 'axe';
        p.attackStyle = 'basic';
        p.attackDuration = isAxe ? 0.28 : 0.22;
        p.attackTimer = p.attackDuration;
        p.attackCooldown = c.attackCooldown;
        p.attackAngle = angle;
        p.facing =
          Math.abs(Math.cos(p.attackAngle)) > Math.abs(Math.sin(p.attackAngle))
            ? Math.cos(p.attackAngle) >= 0
              ? 'right'
              : 'left'
            : Math.sin(p.attackAngle) >= 0
              ? 'down'
              : 'up';
        p.attackHitIds = [];
        p.squashX = isAxe ? 1.22 : 1.15;
        p.squashY = isAxe ? 0.82 : 0.87;
        this.sound.playWeaponSwing(p.equippedWeapon, 'basic');
        if (isAxe) {
          this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.14);
        }
      }
    }

    // Active melee swing hit check (skipped for Bows; enforces wall Line-of-Sight!)
    if (p.attackTimer > 0) {
      p.attackTimer = Math.max(0, p.attackTimer - dt);
      const wDef = WEAPON_CATALOG[p.equippedWeapon];
      if (!this.interiorId && wDef.category !== 'bow') {
        const isAxe = wDef.category === 'axe';
        const range = p.attackStyle === 'basic' ? c.attackRange : c.heavyRange;
        const halfArc =
          p.attackStyle === 'charged'
            ? isAxe ? 1.6 : 1.48
            : p.attackStyle === 'heavy'
              ? isAxe ? 1.45 : 1.32
              : isAxe ? 1.28 : 1.12;
        const baseDmg =
          p.attackStyle === 'charged'
            ? c.chargedDamage
            : p.attackStyle === 'heavy'
              ? c.heavyDamage
              : c.weaponDamage;
        for (const en of this.world.enemies) {
          if (en.aiState === 'ko' || p.attackHitIds.includes(en.id)) continue;
          if (
            isTargetInMeleeArc(p.x, p.y, p.attackAngle, range, halfArc, en.x, en.y, en.radius) &&
            hasLineOfSight(p.x, p.y, en.x, en.y, grid, this.stats.coreGateUnlocked)
          ) {
            p.attackHitIds.push(en.id);
            this.damageEnemy(
              en,
              baseDmg,
              Math.cos(p.attackAngle),
              Math.sin(p.attackAngle),
              p.attackStyle !== 'basic' || isAxe
            );
          }
        }
      }
    }

    // Energy Strike Wave [C] — piercing directional blade wave
    if (this.energyStrikeQueued) {
      this.energyStrikeQueued = false;
      if (p.energyStrikeCooldown <= 0 && p.energy >= c.energyStrikeCost) {
        p.energy -= c.energyStrikeCost;
        p.energyStrikeCooldown = 1.05;
        const angle = resolveAttackAngle();
        const wDef = WEAPON_CATALOG[p.equippedWeapon];
        p.attackStyle = 'heavy';
        p.attackDuration = 0.24;
        p.attackTimer = 0.24;
        p.energyCastTimer = 0.28;
        p.attackAngle = angle;
        p.facing =
          Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))
            ? Math.cos(angle) >= 0
              ? 'right'
              : 'left'
            : Math.sin(angle) >= 0
              ? 'down'
              : 'up';
        p.attackHitIds = [];
        p.squashX = 1.18;
        p.squashY = 0.84;
        this.sound.playEnergyStrike(p.equippedWeapon);
        this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.2);
        this.projectiles.push({
          id: `wave_${Math.random().toString(36).slice(2)}`,
          fromPlayer: true,
          kind: 'energy_wave',
          x: p.x + Math.cos(angle) * 16,
          y: p.y + Math.sin(angle) * 16,
          vx: Math.cos(angle) * 360,
          vy: Math.sin(angle) * 360,
          angle,
          radius: p.equippedWeapon === 'coreblade' ? 16 : 12,
          damage: c.energyStrikeDamage,
          life: 0.72,
          maxLife: 0.72,
          color: wDef.slashPrimaryColor,
          accentColor: wDef.glowColor,
          piercing: true,
          hitIds: [],
        });
        if (this.settings.visualEffects !== 'low') {
          this.spawnBurst(
            p.x + Math.cos(angle) * 14,
            p.y + Math.sin(angle) * 14,
            10,
            wDef.glowColor,
            100
          );
        }
      } else if (p.energy < c.energyStrikeCost) {
        this.spawnFloatingText(p.x, p.y - 24, `Need ${c.energyStrikeCost} Energy`, '#f59e0b');
      }
    }

    // Arc Pulse AoE skill [Q] (enforces wall LOS!)
    if (this.pulseQueued) {
      this.pulseQueued = false;
      if (p.pulseCooldown <= 0 && p.energy >= 25) {
        p.energy -= 25;
        p.pulseTimer = 0.44;
        p.pulseCooldown = 2.0;
        this.sound.playPulse();
        this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.38);
        const wDef = WEAPON_CATALOG[p.equippedWeapon];
        this.spawnBurst(
          p.x,
          p.y,
          this.settings.visualEffects === 'low' ? 12 : 24,
          wDef.glowColor,
          145
        );
        if (!this.interiorId) {
          for (const en of this.world.enemies) {
            if (en.aiState === 'ko') continue;
            const d = Math.hypot(en.x - p.x, en.y - p.y);
            if (
              d <= c.pulseRadius + en.radius &&
              hasLineOfSight(p.x, p.y, en.x, en.y, grid, this.stats.coreGateUnlocked)
            ) {
              const nx = d > 1 ? (en.x - p.x) / d : 1;
              const ny = d > 1 ? (en.y - p.y) / d : 0;
              this.damageEnemy(en, c.pulseDamage, nx, ny, true);
            }
          }
        }
      } else if (p.energy < 25) {
        this.spawnFloatingText(p.x, p.y - 24, 'Need 25 Energy', '#f59e0b');
      }
    }

    // Interact [E]
    if (this.interactQueued) {
      this.interactQueued = false;
      this.performInteraction();
    }
  }

  private damageEnemy(
    en: EnemyEntity,
    baseDmg: number,
    dirX: number,
    dirY: number,
    isHeavy = false
  ): void {
    const c = this.getCombatStats();
    const isCrit = Math.random() < c.critChance;
    const dmg = Math.round(baseDmg * (isCrit ? c.critMultiplier : 1));

    en.hp = Math.max(0, en.hp - dmg);
    en.hitFlashTimer = isCrit ? 0.12 : 0.08;

    // Smooth velocity knockback (damped in updateEnemies)
    const kb = en.archetype === 'turret_denial' ? 18 : en.isBoss ? 36 : isHeavy ? 210 : 145;
    en.knockbackVx = (en.knockbackVx ?? 0) + dirX * kb;
    en.knockbackVy = (en.knockbackVy ?? 0) + dirY * kb;

    if (this.settings.showDamageNumbers) {
      this.spawnFloatingText(
        en.x,
        en.y - en.radius - 6,
        isCrit ? `CRIT! -${dmg}` : `-${dmg}`,
        isCrit ? '#facc15' : '#fde047'
      );
    }

    const vfxMult = this.settings.visualEffects === 'low' ? 0.5 : 1;
    const burstCount = Math.max(
      4,
      Math.round((en.hp <= 0 ? 22 : isCrit ? 16 : 10) * vfxMult)
    );
    this.spawnBurst(
      en.x,
      en.y,
      burstCount,
      en.hp <= 0 ? '#fb923c' : isCrit ? '#facc15' : WEAPON_CATALOG[this.player.equippedWeapon].glowColor,
      isCrit ? 135 : 110
    );
    if (isCrit) {
      this.sound.playCritHit();
    } else {
      this.sound.playHit(en.hp <= 0 || !!en.isBoss);
    }
    this.hitstopTimer = en.hp <= 0 ? 0.055 : isCrit || isHeavy ? 0.042 : 0.028;
    this.shakeTrauma = Math.min(
      1,
      this.shakeTrauma + (en.hp <= 0 ? 0.42 : isCrit ? 0.3 : isHeavy ? 0.26 : 0.18)
    );

    // 3-Phase Boss transitions: Phase 2 at <=65% HP, Phase 3 at <=30% HP
    if (en.isBoss && en.hp > 0) {
      if ((en.bossPhase ?? 1) === 1 && en.hp <= en.maxHp * 0.65) {
        en.bossPhase = 2;
        en.speed = 98;
        en.telegraphDuration = 0.6;
        this.sound.setBossPhase(2);
        this.sound.playBossPhaseShift();
        this.emitToast(
          'Sentinel Phase 2: Surge Mode',
          'Watch out for plasma beam dashes and faster volleys!',
          'warning'
        );
        this.spawnBurst(en.x, en.y, 28, '#f59e0b', 160);
      } else if ((en.bossPhase ?? 1) === 2 && en.hp <= en.maxHp * 0.3) {
        en.bossPhase = 3;
        en.speed = 114;
        en.telegraphDuration = 0.5;
        this.sound.setBossPhase(3);
        this.sound.playBossPhaseShift();
        this.emitToast(
          'Sentinel Phase 3: Core Overload!',
          'Double-ring Overload Novas incoming — dodge and strike!',
          'warning'
        );
        this.spawnBurst(en.x, en.y, 34, '#ef4444', 185);
      }
    }

    if (en.hp <= 0) {
      en.aiState = 'ko';
      en.respawnTimer = en.isBoss ? 999999 : 65;
      this.stats.enemiesDefeated += 1;

      if (en.isBoss) {
        // Begin 5-stage defeat presentation (stagger -> fall -> fallen -> ash fade -> loot release)
        en.koTimer = BOSS_DEFEAT_TOTAL_DURATION;
        en.bossLootPending = true;
        en.bossImpactPlayed = false;
        this.bossKoBurstAccum = 0;
        this.bossDefeated = true;
        // Fade boss soundtrack cleanly back to region music
        this.sound.exitBossEncounter(en.region, 1.15);
        this.sound.playBossPhaseShift();
        this.emitToast(
          `${en.name} Defeated!`,
          'Its corrupted chassis collapses and fades into ash...',
          'restore'
        );
        this.syncQuests();
        this.triggerAutosave();
        return;
      }

      en.koTimer = 0.45;
      this.grantEnemyDefeatRewards(en, c.bonusLootChance);
      this.syncQuests();
    }
  }

  private grantEnemyDefeatRewards(en: EnemyEntity, bonusLootChance: number): void {
    const goldDrop = en.goldReward ?? 10;
    this.player.gold += goldDrop;

    const bonusLoot = { ...en.loot };
    if (bonusLootChance > 0 && Math.random() < bonusLootChance) {
      const firstKey = Object.keys(bonusLoot)[0] as ItemId | undefined;
      if (firstKey) {
        bonusLoot[firstKey] = (bonusLoot[firstKey] ?? 0) + 1;
      }
    }
    const lootRes = tryAddItemsToBackpack(this.inventory, bonusLoot);
    if (lootRes.ok) {
      this.inventory = lootRes.inventory;
      const lootSummary = [
        `+${goldDrop}g`,
        ...Object.entries(bonusLoot).map(([k, v]) => `+${v} ${ITEM_CATALOG[k as ItemId].name}`),
      ].join(', ');
      this.spawnFloatingText(en.x, en.y - 26, lootSummary, '#86efac');
    } else {
      this.spawnFloatingText(en.x, en.y - 26, `+${goldDrop}g (Backpack Full!)`, '#fbbf24');
      this.emitToast('Backpack Full', 'Some enemy loot could not fit in your 40-slot backpack.', 'warning');
    }

    const xpRes = awardPlayerXp(this.player, en.xpReward);
    if (xpRes.leveledUp) {
      this.syncPlayerStatsObj(this.player, true);
      this.sound.playQuestComplete();
      this.emitToast(
        `Level ${xpRes.newLevel}!`,
        '+1 Skill Point earned! Press [K] to open the Skill Tree.',
        'restore'
      );
    }

    if (en.isBoss) {
      this.sound.playQuestComplete();
      this.spawnBurst(en.x, en.y, 34, '#fde047', 165);
      this.spawnBurst(en.x, en.y, 24, '#5eead4', 135);
      this.emitToast(
        'Boss Spoils Claimed!',
        'Coreblade blueprint unlocked at Blacksmith Bram’s Workshop! Restore the World Core Altar.',
        'loot'
      );
      this.triggerAutosave();
    }
  }

  private damagePlayer(dmg: number, srcX: number, srcY: number, customLabel?: string): void {
    const p = this.player;
    if (p.invulnTimer > 0 || this.mode !== 'playing') return;
    const actualDmg = customLabel === 'Toxic Sludge!' ? dmg : computeMitigatedDamage(dmg, p.defense);
    p.hp = Math.max(0, p.hp - actualDmg);
    p.invulnTimer = 0.65;
    p.hitFlashTimer = 0.12;
    p.squashX = 1.2;
    p.squashY = 0.8;
    const dx = p.x - srcX;
    const dy = p.y - srcY;
    const d = Math.hypot(dx, dy) || 1;
    const pushed = resolveCircleTileCollision(
      p.x + (dx / d) * 16,
      p.y + (dy / d) * 16,
      10,
      this.getActiveGrid(),
      this.stats.coreGateUnlocked
    );
    p.x = pushed.x;
    p.y = pushed.y;

    this.sound.playPlayerHurt();
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.45);
    this.hitstopTimer = 0.04;
    this.spawnBurst(p.x, p.y, 12, '#ef4444', 90);
    if (customLabel || this.settings.showDamageNumbers) {
      this.spawnFloatingText(p.x, p.y - 22, customLabel ?? `-${actualDmg}`, '#f87171');
    }
    this.emitHud();

    if (p.hp <= 0) {
      this.setMode('gameover');
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    const daylight = getDaylightState(this.timeOfDay);
    const grid = this.getActiveGrid();

    // Attack token pool: at most 3 concurrent enemies telegraphing/attacking
    let activeAttackers = this.world.enemies.filter(
      (e) => e.aiState === 'telegraph' || e.aiState === 'attack'
    ).length;

    let nearestLivingBoss: { enemy: EnemyEntity; trackId: string; distance: number } | null = null;

    for (const en of this.world.enemies) {
      en.animTime += dt;
      en.hitFlashTimer = Math.max(0, en.hitFlashTimer - dt);
      en.attackAnimTimer = Math.max(0, (en.attackAnimTimer ?? 0) - dt);
      if (en.isBoss) {
        const curTrail = en.trailingHp ?? en.hp;
        en.trailingHp = curTrail > en.hp ? Math.max(en.hp, curTrail - (curTrail - en.hp) * Math.min(1, dt * 4.5) - 12 * dt) : en.hp;
      }

      // Integrate damped knockback velocity with tile collision
      if (en.knockbackVx || en.knockbackVy) {
        const kvx = en.knockbackVx ?? 0;
        const kvy = en.knockbackVy ?? 0;
        if (Math.hypot(kvx, kvy) > 4) {
          const pushed = resolveCircleTileCollision(
            en.x + kvx * dt,
            en.y + kvy * dt,
            en.radius,
            grid,
            this.stats.coreGateUnlocked
          );
          en.x = pushed.x;
          en.y = pushed.y;
          const damp = Math.exp(-11 * dt);
          en.knockbackVx = kvx * damp;
          en.knockbackVy = kvy * damp;
        } else {
          en.knockbackVx = 0;
          en.knockbackVy = 0;
        }
      }

      if (en.aiState === 'ko') {
        if (en.koTimer > 0) {
          const prevStage = en.isBoss ? getBossDefeatState(en.koTimer).stage : null;
          en.koTimer = Math.max(0, en.koTimer - dt);

          // 5-stage Boss Defeat choreography: stagger -> fall -> fallen -> ash fade -> loot release
          if (en.isBoss) {
            const defeatState = getBossDefeatState(en.koTimer);
            this.bossKoBurstAccum += dt;

            if (defeatState.stage === 'stagger' && this.bossKoBurstAccum >= 0.2) {
              this.bossKoBurstAccum = 0;
              const ox = (Math.random() - 0.5) * 44;
              const oy = (Math.random() - 0.5) * 44;
              this.spawnBurst(en.x + ox, en.y + oy, 10, '#5eead4', 110);
              this.spawnBurst(en.x + ox, en.y + oy, 8, '#f59e0b', 95);
              this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.16);
            } else if (defeatState.stage === 'fall' && !en.bossImpactPlayed) {
              en.bossImpactPlayed = true;
              this.sound.playBossFall();
              this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.52);
              this.spawnBurst(en.x, en.y + 14, 24, '#94a3b8', 110);
            } else if (defeatState.stage === 'fallen' && this.bossKoBurstAccum >= 0.28) {
              this.bossKoBurstAccum = 0;
              this.spawnParticle(
                en.x + (Math.random() - 0.5) * 34,
                en.y + 8,
                (Math.random() - 0.5) * 14,
                -22 - Math.random() * 14,
                3.2,
                '#9ca3af',
                0.65
              );
            } else if (defeatState.stage === 'ash_fade') {
              if (prevStage !== 'ash_fade') {
                this.sound.playBossAshDissolve();
              }
              if (this.bossKoBurstAccum >= 0.08) {
                this.bossKoBurstAccum = 0;
                for (let k = 0; k < 3; k++) {
                  this.spawnParticle(
                    en.x + (Math.random() - 0.5) * 52,
                    en.y + 10 - Math.random() * 34,
                    (Math.random() - 0.5) * 22,
                    -28 - Math.random() * 26,
                    2.6 + Math.random() * 2,
                    k === 0 ? '#d1d5db' : '#9ca3af',
                    0.85
                  );
                }
              }
            }

            if (en.koTimer <= 0 && en.bossLootPending) {
              en.bossLootPending = false;
              const c = this.getCombatStats();
              this.grantEnemyDefeatRewards(en, c.bonusLootChance);
              this.emitHud(true);
            }
          }
        } else if (!en.isBoss) {
          en.respawnTimer -= dt;
          if (en.respawnTimer <= 0 && Math.hypot(en.homeX - p.x, en.homeY - p.y) > 420) {
            en.hp = en.maxHp;
            en.x = en.homeX;
            en.y = en.homeY;
            en.aiState = 'patrol';
          }
        }
        continue;
      }

      const distToPlayer = Math.hypot(p.x - en.x, p.y - en.y);
      const angleToPlayer = Math.atan2(p.y - en.y, p.x - en.x);
      const effAggro = en.aggroRange * daylight.nightAggroBoost;

      if (en.isBoss) {
        if (!nearestLivingBoss || distToPlayer < nearestLivingBoss.distance) {
          nearestLivingBoss = {
            enemy: en,
            trackId: en.bossTrackId ?? 'core_sentinel',
            distance: distToPlayer,
          };
        }
        if (distToPlayer <= 385 && !en.bossEncounterAnnounced) {
          en.bossEncounterAnnounced = true;
          this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.25);
          this.sound.playBossPhaseShift();
          this.emitToast(
            `BOSS ENCOUNTER: ${en.name}`,
            en.bossTitle ?? 'Prepare for battle!',
            'warning'
          );
        }
      }

      if (en.aiState === 'idle' || en.aiState === 'patrol') {
        en.stateTimer -= dt;
        if (distToPlayer < effAggro) {
          en.aiState = 'chase';
        } else if (en.speed > 0) {
          const patAngle = en.animTime * 0.6;
          const tx = en.homeX + Math.cos(patAngle) * 32;
          const ty = en.homeY + Math.sin(patAngle) * 24;
          const pd = Math.hypot(tx - en.x, ty - en.y);
          if (pd > 3) {
            const mv = resolveCircleTileCollision(
              en.x + ((tx - en.x) / pd) * en.speed * 0.35 * dt,
              en.y + ((ty - en.y) / pd) * en.speed * 0.35 * dt,
              en.radius,
              grid,
              this.stats.coreGateUnlocked
            );
            en.x = mv.x;
            en.y = mv.y;
          }
        }
      } else if (en.aiState === 'chase') {
        if (distToPlayer > effAggro * 1.65) {
          en.aiState = 'patrol';
          continue;
        }
        en.telegraphAngle = angleToPlayer;

        if (en.archetype === 'drone_kiter') {
          const desiredDist = 135;
          const radial = distToPlayer < desiredDist - 20 ? -1 : distToPlayer > desiredDist + 25 ? 1 : 0;
          const strafe = Math.sin(en.animTime * 1.4) >= 0 ? 1 : -1;
          const mx = (Math.cos(angleToPlayer) * radial - Math.sin(angleToPlayer) * 0.75 * strafe) * en.speed;
          const my = (Math.sin(angleToPlayer) * radial + Math.cos(angleToPlayer) * 0.75 * strafe) * en.speed;
          const mv = resolveCircleTileCollision(en.x + mx * dt, en.y + my * dt, en.radius, grid, this.stats.coreGateUnlocked);
          en.x = mv.x;
          en.y = mv.y;
        } else if (en.archetype === 'turret_denial') {
          // Stationary area-denial turret
        } else if (en.archetype === 'crawler_swarmer') {
          const weave = Math.sin(en.animTime * 5) * 0.55;
          const a = angleToPlayer + weave;
          const mv = resolveCircleTileCollision(
            en.x + Math.cos(a) * en.speed * dt,
            en.y + Math.sin(a) * en.speed * dt,
            en.radius,
            grid,
            this.stats.coreGateUnlocked
          );
          en.x = mv.x;
          en.y = mv.y;
        } else {
          if (distToPlayer > en.attackRange * 0.72) {
            const mv = resolveCircleTileCollision(
              en.x + Math.cos(angleToPlayer) * en.speed * dt,
              en.y + Math.sin(angleToPlayer) * en.speed * dt,
              en.radius,
              grid,
              this.stats.coreGateUnlocked
            );
            en.x = mv.x;
            en.y = mv.y;
          }
        }

        en.stateTimer -= dt;
        if (distToPlayer <= en.attackRange && en.stateTimer <= 0 && (activeAttackers < 3 || en.isBoss)) {
          en.aiState = 'telegraph';
          en.stateTimer = en.telegraphDuration;
          en.telegraphAngle = angleToPlayer;
          if (en.archetype === 'core_boss') {
            const idx = (en.bossPatternIndex ?? 0) + 1;
            en.bossPatternIndex = idx;
            const phase = en.bossPhase ?? 1;
            if (phase === 1) {
              en.bossPattern = 'radial';
            } else if (phase === 2) {
              en.bossPattern = idx % 2 === 0 ? 'beam_dash' : 'radial';
            } else {
              const patterns: ('radial' | 'beam_dash' | 'overload_nova')[] = [
                'radial',
                'beam_dash',
                'overload_nova',
              ];
              en.bossPattern = patterns[idx % patterns.length];
            }
          }
          activeAttackers++;
          this.sound.playTelegraph();
        }
      } else if (en.aiState === 'telegraph') {
        if (
          en.stateTimer > en.telegraphDuration * 0.35 &&
          en.archetype !== 'stalker_charger' &&
          !(en.archetype === 'core_boss' && en.bossPattern === 'beam_dash')
        ) {
          en.telegraphAngle = angleToPlayer;
        }
        en.stateTimer -= dt;
        if (en.stateTimer <= 0) {
          en.aiState = 'attack';
          this.executeEnemyAttack(en);
        }
      } else if (en.aiState === 'attack') {
        en.stateTimer -= dt;
        if (en.archetype === 'stalker_charger') {
          const mv = resolveCircleTileCollision(
            en.x + Math.cos(en.telegraphAngle) * 320 * dt,
            en.y + Math.sin(en.telegraphAngle) * 320 * dt,
            en.radius,
            grid,
            this.stats.coreGateUnlocked
          );
          en.x = mv.x;
          en.y = mv.y;
          if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + 14) {
            this.damagePlayer(en.damage, en.x, en.y);
          }
        } else if (en.archetype === 'core_boss' && en.bossPattern === 'beam_dash') {
          const mv = resolveCircleTileCollision(
            en.x + Math.cos(en.telegraphAngle) * 370 * dt,
            en.y + Math.sin(en.telegraphAngle) * 370 * dt,
            en.radius,
            grid,
            this.stats.coreGateUnlocked
          );
          en.x = mv.x;
          en.y = mv.y;
          if (this.settings.visualEffects !== 'low' && Math.random() < 0.7) {
            this.spawnParticle(en.x, en.y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 3.2, '#ef4444', 0.28);
          }
          if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + 16) {
            this.damagePlayer(Math.round(en.damage * 1.15), en.x, en.y);
          }
        }
        if (en.stateTimer <= 0) {
          en.aiState = 'recover';
          const phase = en.bossPhase ?? 1;
          en.stateTimer = en.isBoss ? (phase === 3 ? 0.52 : phase === 2 ? 0.68 : 0.95) : 0.9;
        }
      } else if (en.aiState === 'recover') {
        en.stateTimer -= dt;
        if (en.stateTimer <= 0) {
          en.aiState = 'chase';
          en.stateTimer = en.isBoss ? 0.42 : 0.75;
        }
      }

      if (distToPlayer < en.radius + 9) {
        this.damagePlayer(Math.round(en.damage * 0.75), en.x, en.y);
      }
    }

    // Smooth modular Boss Battle Music transition with enter/exit hysteresis
    const currentRegion = this.interiorId ? 'haven' : getRegionAtWorld(p.x, p.y);
    const musicDecision = resolveBossMusicState({
      mode: this.mode,
      currentRegion,
      activeBossTrackId: this.sound.getActiveBossTrackId(),
      nearestLivingBoss: nearestLivingBoss
        ? { trackId: nearestLivingBoss.trackId, distance: nearestLivingBoss.distance }
        : null,
    });
    if (musicDecision.nextBossTrackId) {
      const bossPhase = nearestLivingBoss?.enemy.bossPhase ?? 1;
      this.sound.enterBossEncounter(musicDecision.nextBossTrackId, bossPhase);
    } else if (this.sound.getActiveBossTrackId() !== null) {
      this.sound.exitBossEncounter(currentRegion);
    }
  }

  private executeEnemyAttack(en: EnemyEntity): void {
    en.attackAnimTimer = 0.22;
    if (en.archetype === 'drone_kiter') {
      en.stateTimer = 0.15;
      this.spawnProjectile(false, en.x, en.y, en.telegraphAngle, 225, en.damage, '#f87171', 4.5);
    } else if (en.archetype === 'stalker_charger') {
      en.stateTimer = 0.34;
    } else if (en.archetype === 'crawler_swarmer') {
      en.stateTimer = 0.18;
      this.spawnProjectile(false, en.x, en.y, en.telegraphAngle, 185, en.damage, '#a3e635', 5);
    } else if (en.archetype === 'turret_denial') {
      en.stateTimer = 0.25;
      for (let i = 0; i < 6; i++) {
        const a = en.telegraphAngle + (i * Math.PI * 2) / 6;
        this.spawnProjectile(false, en.x, en.y, a, 170, en.damage, '#fb923c', 5);
      }
    } else if (en.archetype === 'core_boss') {
      const phase = en.bossPhase ?? 1;
      const pattern = en.bossPattern ?? 'radial';
      if (pattern === 'beam_dash') {
        en.stateTimer = 0.42;
        this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.24);
        this.spawnBurst(en.x, en.y, 14, '#ef4444', 120);
      } else if (pattern === 'overload_nova') {
        en.stateTimer = 0.36;
        this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.34);
        // Double staggered concentric ring barrage
        for (let i = 0; i < 12; i++) {
          const a = en.telegraphAngle + (i * Math.PI * 2) / 12;
          this.spawnProjectile(false, en.x, en.y, a, 215, en.damage, '#ef4444', 6);
        }
        for (let i = 0; i < 8; i++) {
          const a = en.telegraphAngle + Math.PI / 8 + (i * Math.PI * 2) / 8;
          this.spawnProjectile(false, en.x, en.y, a, 155, en.damage, '#5eead4', 5.5);
        }
      } else {
        en.stateTimer = 0.3;
        const count = phase >= 2 ? 10 : 7;
        for (let i = 0; i < count; i++) {
          const a = en.telegraphAngle + (i * Math.PI * 2) / count;
          this.spawnProjectile(
            false,
            en.x,
            en.y,
            a,
            phase >= 2 ? 215 : 175,
            en.damage,
            phase >= 2 ? '#ef4444' : '#fbbf24',
            6
          );
        }
        this.spawnProjectile(false, en.x, en.y, en.telegraphAngle - 0.14, 245, en.damage, '#5eead4', 5.5);
        this.spawnProjectile(false, en.x, en.y, en.telegraphAngle + 0.14, 245, en.damage, '#5eead4', 5.5);
      }
    }
  }

  private spawnProjectile(
    fromPlayer: boolean,
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    color: string,
    radius: number
  ): void {
    this.projectiles.push({
      id: `p_${Math.random().toString(36).slice(2)}`,
      fromPlayer,
      kind: 'bolt',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      radius,
      damage,
      life: 2.2,
      maxLife: 2.2,
      color,
    });
  }

  private updateProjectiles(dt: number): void {
    const grid = this.getActiveGrid();
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      if (pr.kind === 'energy_wave' && this.settings.visualEffects !== 'low' && Math.random() < 0.65) {
        this.spawnParticle(
          pr.x + (Math.random() - 0.5) * 8,
          pr.y + (Math.random() - 0.5) * 8,
          -pr.vx * 0.08,
          -pr.vy * 0.08,
          2.6,
          pr.accentColor ?? pr.color,
          0.22
        );
      }

      const hitWall = resolveCircleTileCollision(
        pr.x,
        pr.y,
        pr.radius * 0.5,
        grid,
        this.stats.coreGateUnlocked
      ).collided;

      if (pr.life <= 0 || hitWall) {
        this.spawnBurst(pr.x, pr.y, pr.kind === 'energy_wave' ? 8 : 4, pr.color, 55);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.fromPlayer) {
        if (!this.interiorId) {
          let removed = false;
          for (const en of this.world.enemies) {
            if (en.aiState === 'ko') continue;
            if (pr.hitIds && pr.hitIds.includes(en.id)) continue;
            if (Math.hypot(pr.x - en.x, pr.y - en.y) < pr.radius + en.radius) {
              pr.hitIds = pr.hitIds ?? [];
              pr.hitIds.push(en.id);
              const spd = Math.hypot(pr.vx, pr.vy) || 1;
              this.damageEnemy(en, pr.damage, pr.vx / spd, pr.vy / spd, pr.kind !== 'player_arrow');
              this.spawnBurst(en.x, en.y, pr.kind === 'player_arrow' ? 7 : 10, pr.accentColor ?? pr.color, 110);
              if (!pr.piercing || pr.hitIds.length >= 3) {
                this.projectiles.splice(i, 1);
                removed = true;
                break;
              }
            }
          }
          if (removed) continue;
        }
      } else if (Math.hypot(pr.x - p.x, pr.y - p.y) < pr.radius + 10) {
        this.damagePlayer(pr.damage, pr.x, pr.y);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateLandmarksAndRegion(): void {
    const p = this.player;
    const region = getRegionAtWorld(p.x, p.y);
    if (!this.stats.visitedRegions.includes(region)) {
      this.stats.visitedRegions.push(region);
      this.sound.playDiscovery();
      this.emitToast(`Entered ${REGION_META[region].name}`, REGION_META[region].subtitle, 'discovery');
      this.syncQuests();
      this.triggerAutosave();
    }

    // Track regional music unless boss battle soundtrack is currently active
    if (this.sound.getActiveBossTrackId() === null) {
      this.sound.setTrack(region);
    }

    // Check discoverable landmarks
    for (const lm of this.world.landmarks) {
      if (lm.discovered) continue;
      if (Math.hypot(lm.x - p.x, lm.y - p.y) <= lm.radius) {
        lm.discovered = true;
        this.stats.landmarksDiscovered += 1;
        this.player.celebrateTimer = 0.65;
        this.sound.playDiscovery();
        const xpRes = awardPlayerXp(this.player, 20);
        if (xpRes.leveledUp) this.syncPlayerStatsObj(this.player, true);
        this.emitToast(`Discovered: ${lm.name}`, lm.subtitle, 'discovery');
        this.syncQuests();
      }
    }

    // Check proximity discovery for regional Teleporter Stations
    for (const tp of this.world.teleporters) {
      if (tp.discovered) continue;
      if (Math.hypot(tp.x - p.x, tp.y - p.y) <= 135) {
        tp.discovered = true;
        this.sound.playDiscovery();
        this.emitToast(
          `Discovered: ${tp.name}`,
          'Press [E] near the gateway to inspect and activate.',
          'discovery'
        );
      }
    }
  }

  // =========================================================================
  // INTERACTIONS, WORLD RESTORATION & QUESTS
  // =========================================================================
  private findNearestInteractable(): {
    prompt: InteractionPrompt | null;
    npc?: NpcEntity;
    collectible?: CollectibleNode;
    node?: RestorationNode;
    door?: PortalDoor;
    workbench?: WorkbenchProp;
    teleporter?: TeleporterStation;
    coreGateHint?: boolean;
  } {
    const p = this.player;

    // 1. Enter/Exit Doors
    for (const door of this.world.doors) {
      if (door.fromInterior !== this.interiorId) continue;
      if (Math.hypot(door.x - p.x, door.y - p.y) <= 44) {
        return {
          prompt: { id: door.id, label: door.label, kind: 'door' },
          door,
        };
      }
    }

    // 2. Collectibles
    for (const col of this.world.collectibles) {
      if (col.collected) continue;
      if ((col.interiorId ?? null) !== this.interiorId) continue;
      if (Math.hypot(col.x - p.x, col.y - p.y) <= 44) {
        return {
          prompt: {
            id: col.id,
            label: `Collect ${col.label}`,
            sublabel: `+${col.qty} ${ITEM_CATALOG[col.itemId].name}`,
            kind: 'collectible',
          },
          collectible: col,
        };
      }
    }

    // 3. Blacksmith Anvils / Workshops (overworld + interiors)
    for (const wb of this.world.workbenches) {
      if ((wb.interiorId ?? null) !== this.interiorId) continue;
      if (Math.hypot(wb.x - p.x, wb.y - p.y) <= 52) {
        return {
          prompt: {
            id: wb.id,
            label: this.blacksmithUnlocked ? `Use ${wb.name}` : `${wb.name} (Locked)`,
            sublabel: this.blacksmithUnlocked
              ? 'Weapons, Armour & Upgrades [B]'
              : 'Help Blacksmith Bram find his Hammer first',
            kind: 'workbench',
            canAfford: this.blacksmithUnlocked,
          },
          workbench: wb,
        };
      }
    }

    if (this.interiorId) return { prompt: null };

    // 4. Regional Teleporter Stations
    for (const tp of this.world.teleporters) {
      if (Math.hypot(tp.x - p.x, tp.y - p.y) <= 58) {
        if (!tp.discovered) {
          tp.discovered = true;
        }
        if (tp.activated) {
          return {
            prompt: {
              id: tp.id,
              label: tp.name,
              sublabel: 'Travel · Save Game · Return to Haven',
              kind: 'teleporter',
              canAfford: true,
            },
            teleporter: tp,
          };
        }
        const check = canActivateTeleporter(
          tp,
          this.inventory,
          this.player.energy,
          this.stats.coreGateUnlocked
        );
        const costText = [
          ...Object.entries(tp.activationCost).map(
            ([k, v]) => `${v} ${ITEM_CATALOG[k as ItemId].name}`
          ),
          `${tp.energyCost} Energy`,
        ].join(' · ');
        return {
          prompt: {
            id: tp.id,
            label: `Inspect ${tp.name}`,
            sublabel: check.ok ? `Activate (${costText})` : `${check.reason} (${costText})`,
            kind: 'teleporter',
            canAfford: check.ok,
          },
          teleporter: tp,
        };
      }
    }

    // 5. NPCs
    for (const npc of this.world.npcs) {
      if (Math.hypot(npc.x - p.x, npc.y - p.y) <= 56) {
        return {
          prompt: {
            id: npc.id,
            label: `Talk to ${npc.name}`,
            sublabel: npc.role,
            kind: 'npc',
          },
          npc,
        };
      }
    }

    // 6. World Restoration Nodes
    for (const rn of this.world.restorationNodes) {
      if (Math.hypot(rn.x - p.x, rn.y - p.y) <= rn.radius + 14) {
        if (rn.restored) {
          return {
            prompt: {
              id: rn.id,
              label: `${rn.name} (Restored)`,
              sublabel: 'Press [E] to recharge Arc Energy & rest',
              kind: 'restore',
              canAfford: true,
            },
            node: rn,
          };
        }
        const check = canRestoreNode(rn, this.inventory, this.player.energy, this.bossDefeated);
        const costText = [
          ...Object.entries(rn.cost).map(([k, v]) => `${v} ${ITEM_CATALOG[k as ItemId].name}`),
          `${rn.energyCost} Energy`,
        ].join(' · ');
        return {
          prompt: {
            id: rn.id,
            label: `Restore ${rn.name}`,
            sublabel: check.ok ? costText : `${check.reason} (${costText})`,
            kind: 'restore',
            canAfford: check.ok,
          },
          node: rn,
        };
      }
    }

    // 7. Sealed Core Gate hint
    if (!this.stats.coreGateUnlocked) {
      const gateX = 85.5 * TILE_SIZE;
      const gateY = 60 * TILE_SIZE;
      if (Math.hypot(gateX - p.x, gateY - p.y) <= 78) {
        const done = this.world.restorationNodes.filter((n) => n.restored && n.kind !== 'world_core').length;
        return {
          prompt: {
            id: 'core_gate_locked',
            label: 'Sealed Lost Core Gate',
            sublabel: `Restore ${done}/${CORE_RELAYS_REQUIRED} Regional Relays to unseal`,
            kind: 'gate',
            canAfford: false,
          },
          coreGateHint: true,
        };
      }
    }

    return { prompt: null };
  }

  private performInteraction(): void {
    const found = this.findNearestInteractable();
    if (!found.prompt) return;

    if (found.door) {
      this.sound.playUiClick();
      this.interiorId = found.door.toInterior;
      this.player.x = found.door.destX;
      this.player.y = found.door.destY;
      this.camX = this.player.x;
      this.camY = this.player.y;
      this.emitHud();
      return;
    }

    if (found.collectible) {
      const col = found.collectible;
      const c = this.getCombatStats();
      const isQuestItem = ITEM_CATALOG[col.itemId].category === 'quest';
      const bonus = !isQuestItem && c.bonusLootChance > 0 && Math.random() < c.bonusLootChance ? 1 : 0;
      const totalQty = col.qty + bonus;
      const addRes = tryAddItemsToBackpack(this.inventory, { [col.itemId]: totalQty });
      if (!addRes.ok) {
        this.sound.playPlayerHurt();
        this.spawnFloatingText(col.x, col.y - 18, 'Backpack Full (40/40)', '#f87171');
        this.emitToast('Backpack Full', addRes.reason ?? 'Free up space in your 40-slot Backpack first.', 'warning');
        return;
      }
      col.collected = true;
      this.inventory = addRes.inventory;
      this.sound.playPickup();
      this.spawnBurst(col.x, col.y, 12, isQuestItem ? '#f59e0b' : '#6ee7b7', 75);
      this.spawnFloatingText(
        col.x,
        col.y - 16,
        `+${totalQty} ${ITEM_CATALOG[col.itemId].name}${bonus > 0 ? ' (Bonus!)' : ''}`,
        isQuestItem ? '#fcd34d' : '#86efac'
      );
      if (col.itemId === 'blacksmith_hammer') {
        this.blacksmithHammerRecovered = true;
        this.emitToast(
          "Found Bram's Forging Hammer!",
          'Return to Blacksmith Bram in Haven Plaza to unlock his Workshop.',
          'quest'
        );
        this.syncQuests();
        this.triggerAutosave();
      } else {
        this.emitToast(col.label, `Collected ${totalQty}× ${ITEM_CATALOG[col.itemId].name}`, 'loot');
        if (col.itemId === 'rare_alloy' || col.itemId === 'crystal' || col.hidden) {
          this.triggerAutosave();
        }
      }
      this.emitHud();
      return;
    }

    if (found.workbench) {
      if (!this.blacksmithUnlocked) {
        this.sound.playPlayerHurt();
        this.emitToast(
          'Blacksmith Workshop Locked',
          'Speak to Blacksmith Bram beside the anvil and recover his Missing Hammer first.',
          'warning'
        );
        return;
      }
      this.sound.playUiClick();
      this.setOverlay('workbench');
      return;
    }

    if (found.teleporter) {
      const tp = found.teleporter;
      tp.discovered = true;
      if (tp.activated && this.lastCheckpointId !== tp.id) {
        this.lastCheckpointId = tp.id;
        this.triggerAutosave();
      }
      this.activeTeleporterId = tp.id;
      this.sound.playUiClick();
      this.overlay = 'teleporter';
      this.clearInputs();
      this.callbacks.onOpenTeleporter?.({ ...tp });
      this.callbacks.onOpenOverlay('teleporter');
      this.emitHud();
      return;
    }

    if (found.npc) {
      const npc = found.npc;
      this.sound.playUiClick();
      let changed = false;
      if (!this.stats.talkedNpcIds.includes(npc.id)) {
        this.stats.talkedNpcIds.push(npc.id);
        changed = true;
      }
      if (npc.id === 'npc_bram') {
        const hammerQuest = this.quests.find((q) => q.id === 's6_missing_hammer');
        if (hammerQuest && hammerQuest.status === 'locked') {
          hammerQuest.status = 'active';
          changed = true;
          this.emitToast(
            'New Quest: The Missing Hammer',
            "Find Bram's Forging Hammer on Haven Comm Ridge north of town.",
            'quest'
          );
        }
      }
      if (changed) {
        this.syncQuests();
      }
      this.overlay = 'dialogue';
      this.clearInputs();
      this.callbacks.onOpenDialogue(npc);
      this.callbacks.onOpenOverlay('dialogue');
      this.emitHud();
      return;
    }

    if (found.node) {
      const node = found.node;
      if (node.restored) {
        this.player.hp = this.player.maxHp;
        this.player.trailingHp = this.player.maxHp;
        this.player.energy = this.player.maxEnergy;
        this.sound.playPickup();
        this.spawnBurst(this.player.x, this.player.y, 16, '#5eead4', 85);
        this.spawnFloatingText(this.player.x, this.player.y - 24, 'Fully Restored!', '#5eead4');
        this.emitHud();
        return;
      }

      const check = canRestoreNode(node, this.inventory, this.player.energy, this.bossDefeated);
      if (!check.ok) {
        this.sound.playPlayerHurt();
        this.emitToast('Cannot Restore Yet', check.reason ?? 'Missing requirements', 'warning');
        return;
      }

      // RESTORE THE WORLD NODE!
      this.inventory = deductCost(this.inventory, node.cost);
      this.player.energy = Math.max(0, this.player.energy - node.energyCost);
      node.restored = true;
      this.applyWorldRestorationVisuals(node, true);
      this.stats.nodesRestored = this.world.restorationNodes.filter((n) => n.restored).length;
      this.player.celebrateTimer = 0.95;
      this.sound.playRestore();
      this.shakeTrauma = 0.55;
      this.hitstopTimer = 0.06;
      this.spawnBurst(node.x, node.y, 38, '#5eead4', 180);
      this.spawnBurst(node.x, node.y, 20, '#fde047', 110);
      const xpRes = awardPlayerXp(this.player, 65);
      if (xpRes.leveledUp) {
        this.syncPlayerStatsObj(this.player, true);
      }

      this.emitToast(`Restored: ${node.name}!`, node.restoredEffect, 'restore');

      if (!this.stats.coreGateUnlocked && shouldUnlockCoreGate(this.world.restorationNodes)) {
        this.stats.coreGateUnlocked = true;
        this.sound.playQuestComplete();
        this.emitToast(
          'The Lost Core Gate Unsealed!',
          'The ancient barrier east of The Overgrown Forest is now open.',
          'restore'
        );
      }

      this.syncQuests();
      this.triggerAutosave();

      if (node.kind === 'world_core') {
        this.timeOfDay = 11.5;
        this.weather = 'clear';
        this.saveGame('autosave', true);
        setTimeout(() => {
          this.setMode('victory');
        }, 900);
      }

      this.emitHud();
    }
  }

  /**
   * Visibly transforms terrain around restored world nodes so players see
   * wildflowers blooming, toxic sludge purifying, and circuits re-energizing.
   */
  private applyWorldRestorationVisuals(node: RestorationNode, rebakeNow: boolean): void {
    const cx = Math.floor(node.x / TILE_SIZE);
    const cy = Math.floor(node.y / TILE_SIZE);
    let dirty = false;

    if (node.kind === 'house' || node.kind === 'grove_conduit' || node.kind === 'waterwheel') {
      const r = node.kind === 'grove_conduit' ? 6 : 4;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx <= 0 || ty <= 0 || tx >= this.world.width - 1 || ty >= this.world.height - 1) continue;
          if (dx * dx + dy * dy > r * r) continue;
          const idx = ty * this.world.width + tx;
          const tile = this.world.tiles[idx];
          if ((tile === 'grass' || tile === 'dirt') && (tx * 3 + ty * 5) % 2 === 0) {
            this.world.tiles[idx] = 'grass_flower';
            dirty = true;
          }
        }
      }
    } else if (node.kind === 'air_purifier') {
      const r = 12;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx <= 0 || ty <= 0 || tx >= this.world.width - 1 || ty >= this.world.height - 1) continue;
          if (dx * dx + dy * dy > r * r) continue;
          const idx = ty * this.world.width + tx;
          if (this.world.tiles[idx] === 'toxic') {
            this.world.tiles[idx] = 'industrial_floor';
            dirty = true;
          }
        }
      }
    } else if (node.kind === 'world_core') {
      const r = 6;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx <= 0 || ty <= 0 || tx >= this.world.width - 1 || ty >= this.world.height - 1) continue;
          if (dx * dx + dy * dy > r * r) continue;
          const idx = ty * this.world.width + tx;
          if (this.world.tiles[idx] === 'core_floor' && (tx + ty) % 2 === 0) {
            this.world.tiles[idx] = 'core_circuit';
            dirty = true;
          }
        }
      }
    }

    if (dirty && rebakeNow) {
      this.bakeOverworldTerrain();
    }
  }

  private checkAchievements(): void {
    const coreRestored = this.world.restorationNodes.some(
      (n) => n.kind === 'world_core' && n.restored
    );
    const newlyUnlockedIds = evaluateAchievements(this.stats, coreRestored);
    for (const id of newlyUnlockedIds) {
      this.stats.unlockedAchievements.push(id);
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) {
        this.sound.playDiscovery();
        this.emitToast(`Achievement: ${def.title}`, def.description, 'achievement');
      }
    }
  }

  private syncQuests(): void {
    const res = evaluateQuests(this.quests, {
      talkedNpcIds: new Set(this.stats.talkedNpcIds),
      restoredNodeIds: new Set(this.world.restorationNodes.filter((n) => n.restored).map((n) => n.id)),
      discoveredLandmarkIds: new Set(this.world.landmarks.filter((l) => l.discovered).map((l) => l.id)),
      visitedRegions: new Set(this.stats.visitedRegions),
      enemiesDefeated: this.stats.enemiesDefeated,
      bossDefeated: this.bossDefeated,
      inventory: this.inventory,
      blacksmithHammerRecovered: this.blacksmithHammerRecovered,
      blacksmithUnlocked: this.blacksmithUnlocked,
    });
    this.quests = res.updatedQuests;
    this.stats.questsCompleted = this.quests.filter((q) => q.status === 'completed').length;

    for (const q of res.newlyCompleted) {
      if (q.rewards.items) {
        const rewardAdd = tryAddItemsToBackpack(this.inventory, q.rewards.items);
        this.inventory = rewardAdd.ok ? rewardAdd.inventory : addItems(this.inventory, q.rewards.items);
      }
      if (q.rewards.gold && q.rewards.gold > 0) {
        this.player.gold += q.rewards.gold;
      }
      const xpRes = awardPlayerXp(this.player, q.rewards.xp);
      if (xpRes.leveledUp) {
        this.syncPlayerStatsObj(this.player, true);
      }
      this.sound.playQuestComplete();
      const goldSuffix = q.rewards.gold ? ` · +${q.rewards.gold} Gold` : '';
      this.emitToast(`Mission Complete: ${q.title}`, `+${q.rewards.xp} XP${goldSuffix}`, 'quest');
    }

    if (res.newlyCompleted.length > 0) {
      this.triggerAutosave();
    }

    for (const u of res.newlyUnlocked) {
      this.emitToast(`New Mission: ${u.title}`, u.objectives[0]?.label, 'quest');
    }

    this.checkAchievements();
  }

  // =========================================================================
  // POOLED PARTICLES & FLOATING TEXT
  // =========================================================================
  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number
  ): void {
    const limit = Math.min(
      PARTICLE_POOL_SIZE,
      getEffectiveParticleLimit(this.settings.particleDensity, this.viewportW <= 920)
    );
    const p = this.particles[this.particleCursor % limit];
    this.particleCursor = (this.particleCursor + 1) % limit;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.alpha = 1;
    p.life = maxLife;
    p.maxLife = maxLife;
  }

  private spawnBurst(x: number, y: number, count: number, color: string, speed: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.3 + Math.random() * 0.85) * speed;
      this.spawnParticle(
        x,
        y,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        2 + Math.random() * 3,
        color,
        0.3 + Math.random() * 0.4
      );
    }
  }

  private updateParticles(dt: number): void {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha = p.life / p.maxLife;
    }

    // Weather rain update
    if (this.weather === 'rain') {
      for (const drop of this.rainDrops) {
        drop.x -= 95 * dt;
        drop.y += drop.speed * dt;
        if (drop.y > this.viewportH + 20) {
          drop.y = -20;
          drop.x = Math.random() * (this.viewportW + 200);
        }
      }
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({ x, y, vy: -34, text, color, life: 0.95, maxLife: 0.95 });
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  // =========================================================================
  // RENDERING PIPELINE (60 FPS PIXEL ART + DYNAMIC LIGHTING + WEATHER)
  // =========================================================================
  private render(): void {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0e1311';
    ctx.fillRect(0, 0, this.viewportW, this.viewportH);

    // Camera shake offset (trauma^2), gated by settings.cameraShake
    const shakeAmt = this.settings.cameraShake ? this.shakeTrauma * this.shakeTrauma * 9 : 0;
    const shakeX = shakeAmt > 0.1 ? (Math.random() * 2 - 1) * shakeAmt : 0;
    const shakeY = shakeAmt > 0.1 ? (Math.random() * 2 - 1) * shakeAmt : 0;

    const zoom = this.getZoom();
    ctx.save();
    ctx.translate(
      Math.round(this.viewportW / 2 + shakeX),
      Math.round(this.viewportH / 2 + shakeY)
    );
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(this.camX), -Math.round(this.camY));

    // 1. Visible Tilemap Chunk Culling
    const grid = this.getActiveGrid();
    const halfW = this.viewportW / (2 * zoom) + TILE_SIZE * 2;
    const halfH = this.viewportH / (2 * zoom) + TILE_SIZE * 2;
    const minTx = Math.max(0, Math.floor((this.camX - halfW) / TILE_SIZE));
    const maxTx = Math.min(grid.width - 1, Math.ceil((this.camX + halfW) / TILE_SIZE));
    const minTy = Math.max(0, Math.floor((this.camY - halfH) / TILE_SIZE));
    const maxTy = Math.min(grid.height - 1, Math.ceil((this.camY + halfH) / TILE_SIZE));

    const animFrame = Math.floor(this.time * 3) % 3;
    const windSway = this.weather === 'wind' ? Math.sin(this.time * 4.5) * 1.8 : Math.sin(this.time * 1.8) * 0.6;
    const drawables: { y: number; draw: () => void }[] = [];

    if (!this.interiorId) {
      // Blit visible static overworld terrain slice in ONE fast drawImage call!
      const srcX = minTx * 16;
      const srcY = minTy * 16;
      const srcW = (maxTx - minTx + 1) * 16;
      const srcH = (maxTy - minTy + 1) * 16;
      ctx.drawImage(
        this.terrainCanvas,
        srcX,
        srcY,
        srcW,
        srcH,
        minTx * TILE_SIZE,
        minTy * TILE_SIZE,
        (maxTx - minTx + 1) * TILE_SIZE,
        (maxTy - minTy + 1) * TILE_SIZE
      );
    }

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        let tile = grid.tiles[ty * grid.width + tx];
        if (tile === 'core_gate' && this.stats.coreGateUnlocked) {
          tile = 'core_circuit';
        }
        const wx = tx * TILE_SIZE;
        const wy = ty * TILE_SIZE;

        if (this.interiorId || tile === 'water' || tile === 'toxic' || tile === 'core_circuit' || tile === 'core_gate') {
          const variants = this.atlas.tiles[tile];
          const sprite =
            tile === 'water' || tile === 'toxic' || tile === 'core_circuit'
              ? variants[(animFrame + ((tx + ty) % 3)) % variants.length]
              : variants[(tx * 7 + ty * 13) % variants.length];
          ctx.drawImage(sprite, wx, wy, TILE_SIZE, TILE_SIZE);
        }

        // Queue oversized layered pixel tree canopy into Y-sorted depth pass
        if (tile === 'tree_pine' || tile === 'tree_oak' || tile === 'tree_dead') {
          const treeImg =
            tile === 'tree_pine'
              ? this.atlas.pineTreeSprite
              : tile === 'tree_oak'
                ? this.atlas.oakTreeSprite
                : this.atlas.deadTreeSprite;
          const swayOffset = tile === 'tree_dead' ? 0 : Math.round(windSway * ((tx + ty) % 2 === 0 ? 1 : -0.7));
          drawables.push({
            y: wy + TILE_SIZE - 2,
            draw: () => {
              ctx.drawImage(treeImg, wx - 8 + swayOffset, wy - 24, 48, 56);
            },
          });
        }
      }
    }

    // 2. Doors, Campfires & Ground Light Blooms
    for (const door of this.world.doors) {
      if (door.fromInterior !== this.interiorId) continue;
      drawPortalDoor(ctx, door, this.time);
    }
    for (const cf of this.world.campfires) {
      if ((cf.interiorId ?? null) !== this.interiorId) continue;
      const flicker = 68 + Math.sin(this.time * 9 + cf.x) * 4;
      ctx.drawImage(this.atlas.warmGlowSprite, cf.x - flicker, cf.y - flicker, flicker * 2, flicker * 2);
      drawCampfire(ctx, cf, this.time);
    }

    // 3. Restoration Nodes, Teleporters, Workbenches & Collectibles
    for (const wb of this.world.workbenches) {
      if ((wb.interiorId ?? null) !== this.interiorId) continue;
      if (Math.abs(wb.x - this.camX) > halfW + 64 || Math.abs(wb.y - this.camY) > halfH + 64) continue;
      ctx.drawImage(this.atlas.warmGlowSprite, wb.x - 42, wb.y - 42, 84, 84);
      drawWorkbench(ctx, wb, this.time);
    }

    if (!this.interiorId) {
      for (const tp of this.world.teleporters) {
        if (Math.abs(tp.x - this.camX) > halfW + 96 || Math.abs(tp.y - this.camY) > halfH + 96) continue;
        if (tp.activated) {
          ctx.drawImage(this.atlas.cyanGlowSprite, tp.x - 95, tp.y - 95, 190, 190);
        }
        const isNearby = Math.hypot(this.player.x - tp.x, this.player.y - tp.y) < 120;
        drawTeleporter(ctx, tp, this.time, isNearby);
      }
      for (const rn of this.world.restorationNodes) {
        if (Math.abs(rn.x - this.camX) > halfW + 96 || Math.abs(rn.y - this.camY) > halfH + 96) continue;
        if (rn.restored) {
          const isWarm = rn.kind === 'streetlights' || rn.kind === 'house';
          const g = isWarm ? 115 : 95;
          const glowImg = isWarm ? this.atlas.warmGlowSprite : this.atlas.cyanGlowSprite;
          ctx.drawImage(glowImg, rn.x - g, rn.y - g, g * 2, g * 2);
        }
        drawRestorationNode(ctx, rn, this.time);
      }
    }
    for (const col of this.world.collectibles) {
      if ((col.interiorId ?? null) !== this.interiorId) continue;
      if (Math.abs(col.x - this.camX) > halfW || Math.abs(col.y - this.camY) > halfH) continue;
      if (col.kind === 'crystal' && !col.collected) {
        ctx.drawImage(this.atlas.cyanGlowSprite, col.x - 28, col.y - 28, 56, 56);
      }
      drawCollectible(ctx, col, this.time);
    }

    // 4. Y-sorted Characters & Oversized Trees
    const activeQuestNpcIds = new Set(
      this.quests
        .filter((q) => q.status === 'active')
        .flatMap((q) => q.objectives.filter((o) => o.type === 'talk_npc' && o.current < o.required).map((o) => o.targetId))
    );

    drawables.push({
      y: this.player.y,
      draw: () => drawPlayerSprite(ctx, this.player, this.time, this.settings.visualEffects),
    });

    if (!this.interiorId) {
      for (const npc of this.world.npcs) {
        if (Math.abs(npc.x - this.camX) > halfW || Math.abs(npc.y - this.camY) > halfH) continue;
        const nearby = Math.hypot(npc.x - this.player.x, npc.y - this.player.y) < 110;
        drawables.push({
          y: npc.y,
          draw: () =>
            drawNpcSprite(
              ctx,
              npc,
              this.time,
              activeQuestNpcIds.has(npc.id),
              nearby,
              this.settings.showQuestMarkers
            ),
        });
      }
      for (const en of this.world.enemies) {
        if (Math.abs(en.x - this.camX) > halfW + 64 || Math.abs(en.y - this.camY) > halfH + 64) continue;
        drawables.push({
          y: en.y,
          draw: () => drawEnemySprite(ctx, en, this.time),
        });
      }
    }

    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    // 5. Projectiles & Pooled Particles
    for (const pr of this.projectiles) drawProjectile(ctx, pr);
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const pt = this.particles[i];
      if (!pt.active) continue;
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x - pt.size / 2), Math.round(pt.y - pt.size / 2), pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // 6. Floating combat/loot numbers
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillStyle = '#090d0b';
      ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 7. Atmospheric Day/Night Dynamic Lightmap Pass
    this.renderLightingPass(ctx);

    // 8. Lightweight Weather Overlay (Rain / Fog / Wind)
    this.renderWeatherOverlay(ctx);

    // 9. Low-HP subtle peripheral red vignette
    if (this.mode === 'playing' && this.player.hp <= this.player.maxHp * 0.3) {
      const pulse = 0.25 + Math.sin(this.time * 6) * 0.12;
      const vg = ctx.createRadialGradient(
        this.viewportW / 2,
        this.viewportH / 2,
        this.viewportH * 0.35,
        this.viewportW / 2,
        this.viewportH / 2,
        this.viewportW * 0.65
      );
      vg.addColorStop(0, 'rgba(180, 20, 20, 0)');
      vg.addColorStop(1, `rgba(185, 28, 28, ${pulse})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, this.viewportW, this.viewportH);
    }
  }

  private renderLightingPass(ctx: CanvasRenderingContext2D): void {
    const daylight = this.interiorId
      ? { darknessAlpha: 0.22, tintRgb: [28, 20, 14] as [number, number, number] }
      : getDaylightState(this.timeOfDay);

    if (daylight.darknessAlpha <= 0.03) return;

    const lw = this.lightCanvas.width;
    const lh = this.lightCanvas.height;
    const lctx = this.lightCtx;
    const scaleX = lw / this.viewportW;
    const scaleY = lh / this.viewportH;

    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, lw, lh);
    const [r, g, b] = daylight.tintRgb;
    lctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${daylight.darknessAlpha})`;
    lctx.fillRect(0, 0, lw, lh);

    // Punch warm/cyan light circles out of the darkness mask using cached sprite (zero gradient allocs!)
    const zoom = this.getZoom();
    lctx.globalCompositeOperation = 'destination-out';
    const punchLight = (wx: number, wy: number, worldRadius: number) => {
      const sx = ((wx - this.camX) * zoom + this.viewportW / 2) * scaleX;
      const sy = ((wy - this.camY) * zoom + this.viewportH / 2) * scaleY;
      const rad = worldRadius * zoom * scaleX;
      if (sx + rad < 0 || sx - rad > lw || sy + rad < 0 || sy - rad > lh) return;
      lctx.drawImage(this.atlas.lightPunchSprite, sx - rad, sy - rad, rad * 2, rad * 2);
    };

    // Player's Arc-Device lantern aura
    punchLight(this.player.x, this.player.y, 130);

    // Campfires
    for (const cf of this.world.campfires) {
      if ((cf.interiorId ?? null) !== this.interiorId) continue;
      punchLight(cf.x, cf.y, 145 + Math.sin(this.time * 8 + cf.x) * 5);
    }

    // Workbenches warm forge light
    for (const wb of this.world.workbenches) {
      if ((wb.interiorId ?? null) !== this.interiorId) continue;
      punchLight(wb.x, wb.y, 110);
    }

    // Restored World Nodes & Teleporters illuminate surrounding areas!
    if (!this.interiorId) {
      for (const rn of this.world.restorationNodes) {
        punchLight(rn.x, rn.y, rn.restored ? 245 : 65);
      }
      for (const tp of this.world.teleporters) {
        punchLight(tp.x, tp.y, tp.activated ? 210 : 65);
      }
    }

    ctx.drawImage(this.lightCanvas, 0, 0, this.viewportW, this.viewportH);
  }

  private renderWeatherOverlay(ctx: CanvasRenderingContext2D): void {
    if (this.weather === 'rain') {
      ctx.strokeStyle = 'rgba(176, 214, 240, 0.36)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const d of this.rainDrops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 3, d.y + d.len);
      }
      ctx.stroke();
    } else if (this.weather === 'fog') {
      ctx.fillStyle = 'rgba(182, 200, 192, 0.13)';
      ctx.fillRect(0, 0, this.viewportW, this.viewportH);
    }
  }

  // =========================================================================
  // HUD SNAPSHOT & TOASTS
  // =========================================================================
  private emitToast(title: string, subtitle: string | undefined, tone: ToastMessage['tone']): void {
    this.callbacks.onToast({
      id: this.toastIdCounter++,
      title,
      subtitle,
      tone,
    });
  }

  private emitHud(force = true): void {
    const region = this.interiorId ? 'haven' : getRegionAtWorld(this.player.x, this.player.y);
    const activeMain =
      this.quests.find((q) => q.category === 'main' && q.status === 'active') ??
      this.quests.find((q) => q.status === 'active');
    const currentStep =
      activeMain?.objectives.find((o) => o.current < o.required)?.label ??
      (this.stats.nodesRestored >= this.world.restorationNodes.length
        ? 'All Relays Restored — Explore Freely'
        : 'Continue exploring the valley');

    const boss = this.world.enemies.find(
      (e) =>
        e.isBoss &&
        (e.aiState !== 'ko' || e.koTimer > 1.4) &&
        Math.hypot(e.x - this.player.x, e.y - this.player.y) < 420
    );
    const bossWarning =
      boss && boss.aiState === 'telegraph'
        ? boss.bossPattern === 'beam_dash'
          ? 'INCOMING: PLASMA BEAM DASH'
          : boss.bossPattern === 'overload_nova'
            ? 'INCOMING: CORE OVERLOAD NOVA'
            : 'INCOMING: RADIAL CORE VOLLEY'
        : null;

    const found = this.mode === 'playing' && this.overlay === 'none' ? this.findNearestInteractable() : { prompt: null };
    const daylight = getDaylightState(this.timeOfDay);
    const clockMin = Math.floor(this.timeOfDay * 60);

    const c = this.getCombatStats();
    const pulseReady = this.player.pulseCooldown <= 0 && this.player.energy >= 25;
    const heavyReady = this.player.attackCooldown <= 0;
    const energyStrikeReady =
      this.player.energyStrikeCooldown <= 0 && this.player.energy >= c.energyStrikeCost;
    const equippedWeaponLevel = getWeaponLevel(
      this.player.weaponUpgrades[this.player.equippedWeapon]
    );
    const chargeProgress = this.player.isCharging
      ? Math.min(1, this.player.chargeTime / 0.36)
      : 0;
    const activatedTeleporterCount = this.world.teleporters.filter((t) => t.activated).length;
    const autosaving = this.autosaveIndicatorTimer > 0;
    const backpackUsedSlots = getBackpackUsedSlots(this.inventory);
    const arrowCount = this.inventory.arrow ?? 0;
    const equippedWeaponDef = WEAPON_CATALOG[this.player.equippedWeapon];
    const equippedArmourName =
      this.player.equippedArmour === 'none'
        ? 'No Armour'
        : ARMOUR_CATALOG[this.player.equippedArmour].name;
    const activeMusicTrack = this.sound.getActiveTrack();

    // Dirty-check visible HUD fields so React stays completely idle when nothing changed
    const sig = [
      this.mode,
      this.overlay,
      Math.round(this.player.hp),
      Math.round(this.player.trailingHp),
      Math.round(this.player.stamina),
      Math.round(this.player.energy),
      this.player.level,
      this.player.gold,
      this.player.defense,
      region,
      this.interiorId ?? '',
      clockMin,
      daylight.phase,
      this.weather,
      this.inventory.scrap,
      this.inventory.crystal,
      this.inventory.parts,
      this.inventory.ration,
      this.inventory.rare_alloy,
      this.inventory.medkit,
      this.inventory.energy_cell,
      arrowCount,
      this.inventory.blacksmith_hammer ?? 0,
      backpackUsedSlots,
      this.player.upgrades.length,
      this.player.equippedWeapon,
      equippedWeaponLevel,
      this.player.unlockedWeapons.length,
      this.player.equippedArmour,
      this.player.unlockedArmour.length,
      this.blacksmithUnlocked ? 1 : 0,
      this.blacksmithHammerRecovered ? 1 : 0,
      this.player.skillPoints,
      Math.round(chargeProgress * 10),
      heavyReady ? 1 : 0,
      energyStrikeReady ? 1 : 0,
      activeMain?.id ?? '',
      currentStep,
      found.prompt?.id ?? '',
      found.prompt?.sublabel ?? '',
      boss ? `${Math.round(boss.hp)}:${Math.round(boss.trailingHp ?? boss.hp)}:${boss.bossPhase ?? 1}:${bossWarning ?? ''}:${boss.aiState === 'ko' ? 1 : 0}` : '-1',
      activeMusicTrack,
      this.stats.nodesRestored,
      activatedTeleporterCount,
      autosaving ? 1 : 0,
      this.lastSavedLabel ?? '',
      this.settings.muted ? 1 : 0,
      pulseReady ? 1 : 0,
      this.stats.unlockedAchievements.length,
    ].join('|');

    if (!force && sig === this.lastHudSig) return;
    this.lastHudSig = sig;

    const snapshot: HudSnapshot = {
      mode: this.mode,
      hp: Math.round(this.player.hp),
      maxHp: Math.round(this.player.maxHp),
      trailingHp: Math.round(this.player.trailingHp),
      stamina: Math.round(this.player.stamina),
      maxStamina: Math.round(this.player.maxStamina),
      energy: Math.round(this.player.energy),
      maxEnergy: Math.round(this.player.maxEnergy),
      level: this.player.level,
      xp: this.player.xp,
      nextLevelXp: this.player.nextLevelXp,
      gold: this.player.gold,
      backpackUsedSlots,
      backpackMaxSlots: MAX_BACKPACK_SLOTS,
      arrowCount,
      region,
      regionName: REGION_META[region].name,
      interiorName: this.interiorId ? this.world.interiors[this.interiorId]?.name ?? null : null,
      timeOfDay: this.timeOfDay,
      dayPhase: daylight.phase,
      weather: this.weather,
      inventory: { ...this.inventory },
      upgrades: [...this.player.upgrades],
      equippedWeapon: this.player.equippedWeapon,
      equippedWeaponName: equippedWeaponDef.name,
      equippedWeaponCategory: equippedWeaponDef.category,
      equippedWeaponLevel,
      unlockedWeapons: [...this.player.unlockedWeapons],
      equippedArmour: this.player.equippedArmour,
      equippedArmourName,
      defense: this.player.defense,
      blacksmithUnlocked: this.blacksmithUnlocked,
      blacksmithHammerRecovered: this.blacksmithHammerRecovered,
      skillPoints: this.player.skillPoints,
      chargeProgress,
      heavyReady,
      energyStrikeReady,
      activeQuestTitle: activeMain?.title ?? 'The Valley Restored',
      activeQuestStep: currentStep,
      prompt: found.prompt,
      bossBar: boss
        ? {
            name: boss.name,
            title: boss.bossTitle ?? 'Guardian Threat',
            hp: Math.round(boss.hp),
            trailingHp: Math.round(boss.trailingHp ?? boss.hp),
            maxHp: Math.round(boss.maxHp),
            phase: boss.bossPhase ?? 1,
            telegraphWarning: bossWarning,
            defeated: boss.aiState === 'ko',
          }
        : null,
      activeMusicTrack,
      restoredCount: this.stats.nodesRestored,
      totalRestorationNodes: this.world.restorationNodes.length,
      activatedTeleporterCount,
      totalTeleporters: this.world.teleporters.length,
      autosaving,
      lastSavedLabel: this.lastSavedLabel,
      playerTileX: Math.floor(this.player.x / TILE_SIZE),
      playerTileY: Math.floor(this.player.y / TILE_SIZE),
      coreGateUnlocked: this.stats.coreGateUnlocked,
      muted: this.settings.muted,
      hasSave: this.hasSavedGame(),
      respawnCheckpointName: resolveRespawnPoint(
        this.world.teleporters,
        this.lastCheckpointId,
        this.world.playerSpawn
      ).name,
      pulseReady,
      stats: { ...this.stats },
    };

    this.callbacks.onHudUpdate(snapshot);
  }
}

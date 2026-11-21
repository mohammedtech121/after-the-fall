export type GameMode = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export type ActiveOverlay =
  | 'none'
  | 'dialogue'
  | 'inventory'
  | 'map'
  | 'quests'
  | 'workbench'
  | 'skills'
  | 'teleporter'
  | 'travel'
  | 'load_game'
  | 'settings'
  | 'credits'
  | 'tutorial';

export type RegionId = 'haven' | 'city' | 'forest' | 'wasteland' | 'core';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type WeatherType = 'clear' | 'rain' | 'fog' | 'wind';

export type ControlMode = 'auto' | 'desktop' | 'mobile';
export type ParticleDensity = 'auto' | 'low' | 'high';
export type VisualEffectsQuality = 'low' | 'medium' | 'high';

export type WeaponCategory = 'sword' | 'axe' | 'bow';

export type WeaponId =
  | 'scrap_blade'
  | 'scrap_axe'
  | 'hunter_bow'
  | 'reinforced_sword'
  | 'pulse_blade'
  | 'foundry_greataxe'
  | 'arc_longbow'
  | 'ancient_blade'
  | 'coreblade';

export type WeaponUpgradeStat =
  | 'damage'
  | 'attackSpeed'
  | 'energyCapacity'
  | 'energyRecovery'
  | 'critChance'
  | 'attackRange';

export type WeaponUpgradeLevels = Record<WeaponUpgradeStat, number>;

export type ArmourId =
  | 'none'
  | 'scout_tunic'
  | 'reinforced_vest'
  | 'iron_plate'
  | 'aegis_alloy_armour'
  | 'core_sentinel_plate';

export type OwnedArmourId = Exclude<ArmourId, 'none'>;
export type ArmourUpgradeMap = Record<OwnedArmourId, number>;

export type AttackStyle = 'basic' | 'heavy' | 'charged';

export type SkillBranch = 'combat' | 'energy' | 'survival';

export type SkillId =
  | 'combat_edge'
  | 'combat_crit'
  | 'combat_heavy'
  | 'energy_pool'
  | 'energy_flow'
  | 'energy_nova'
  | 'survival_vitality'
  | 'survival_stamina'
  | 'survival_scavenger';

export type SkillRankMap = Record<SkillId, number>;

export type TileType =
  | 'grass'
  | 'grass_flower'
  | 'tall_grass'
  | 'dirt'
  | 'road'
  | 'sidewalk'
  | 'water'
  | 'bridge'
  | 'ruin_floor'
  | 'industrial_floor'
  | 'toxic'
  | 'core_floor'
  | 'core_circuit'
  | 'wall_wood'
  | 'wall_brick'
  | 'wall_concrete'
  | 'wall_metal'
  | 'wall_core'
  | 'roof_cabin'
  | 'roof_city'
  | 'roof_factory'
  | 'fence'
  | 'cliff'
  | 'tree_pine'
  | 'tree_oak'
  | 'tree_dead'
  | 'wreck_car'
  | 'core_gate'
  | 'interior_floor'
  | 'interior_wall';

export type ItemId =
  | 'scrap'
  | 'crystal'
  | 'ration'
  | 'parts'
  | 'rare_alloy'
  | 'medkit'
  | 'energy_cell'
  | 'arrow'
  | 'blacksmith_hammer';

export interface ItemDefinition {
  id: ItemId;
  name: string;
  category: 'resource' | 'consumable' | 'rare' | 'ammo' | 'quest';
  maxStack: number;
  description: string;
  usable?: boolean;
  healAmount?: number;
  energyAmount?: number;
  staminaAmount?: number;
  value: number;
}

export type UpgradeId =
  | 'arc_blade_mk2'
  | 'kinetic_boots'
  | 'aegis_vest'
  | 'energy_capacitor'
  | 'hazmat_filter';

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  resultType: 'item' | 'upgrade';
  resultItemId?: ItemId;
  resultQty?: number;
  resultUpgradeId?: UpgradeId;
  ingredients: Partial<Record<ItemId, number>>;
}

export type InventoryMap = Record<ItemId, number>;
export const MAX_BACKPACK_SLOTS = 40;

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Direction;
  aimAngle: number;
  hp: number;
  maxHp: number;
  trailingHp: number;
  stamina: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  gold: number;
  attackDamage: number;
  defense: number;
  moveSpeed: number;
  walkCycle: number;
  isSprinting: boolean;
  attackTimer: number;
  attackDuration: number;
  attackCooldown: number;
  attackAngle: number;
  attackStyle: AttackStyle;
  attackHitIds: string[];
  isCharging: boolean;
  chargeTime: number;
  energyStrikeCooldown: number;
  weaponSwitchTimer: number;
  energyRegenAnimTimer: number;
  dodgeTimer: number;
  dodgeCooldown: number;
  dodgeDirX: number;
  dodgeDirY: number;
  invulnTimer: number;
  hitFlashTimer: number;
  pulseTimer: number;
  pulseCooldown: number;
  squashX: number;
  squashY: number;
  footstepDist: number;
  upgrades: UpgradeId[];
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  weaponUpgrades: Record<WeaponId, WeaponUpgradeLevels>;
  equippedArmour: ArmourId;
  unlockedArmour: OwnedArmourId[];
  armourUpgrades: ArmourUpgradeMap;
  skills: SkillRankMap;
  skillPoints: number;
  celebrateTimer?: number;
  energyCastTimer?: number;
}

export type EnemyArchetype =
  | 'drone_kiter'
  | 'stalker_charger'
  | 'crawler_swarmer'
  | 'turret_denial'
  | 'core_boss';

export type EnemyAIState =
  | 'idle'
  | 'patrol'
  | 'chase'
  | 'telegraph'
  | 'attack'
  | 'recover'
  | 'ko';

export interface EnemyEntity {
  id: string;
  name: string;
  archetype: EnemyArchetype;
  region: RegionId;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  knockbackVx?: number;
  knockbackVy?: number;
  radius: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  aggroRange: number;
  attackRange: number;
  aiState: EnemyAIState;
  stateTimer: number;
  telegraphDuration: number;
  telegraphAngle: number;
  hitFlashTimer: number;
  attackAnimTimer?: number;
  koTimer: number;
  animTime: number;
  xpReward: number;
  goldReward?: number;
  loot: Partial<Record<ItemId, number>>;
  isBoss?: boolean;
  bossTitle?: string;
  bossTrackId?: string;
  bossPhase?: 1 | 2 | 3;
  bossPattern?: 'radial' | 'beam_dash' | 'overload_nova';
  bossPatternIndex?: number;
  trailingHp?: number;
  bossEncounterAnnounced?: boolean;
  bossLootPending?: boolean;
  bossImpactPlayed?: boolean;
  respawnTimer: number;
}

export type BossDefeatStage = 'stagger' | 'fall' | 'fallen' | 'ash_fade' | 'vanished';

export interface Projectile {
  id: string;
  fromPlayer: boolean;
  kind?: 'bolt' | 'energy_wave' | 'boss_orb' | 'player_arrow';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle?: number;
  radius: number;
  damage: number;
  life: number;
  maxLife?: number;
  color: string;
  accentColor?: string;
  piercing?: boolean;
  hitIds?: string[];
}

export interface TradeOffer {
  id: string;
  giveItem?: ItemId;
  giveQty?: number;
  giveGold?: number;
  receiveItem?: ItemId;
  receiveQty?: number;
  receiveGold?: number;
  label: string;
}

export interface NpcEntity {
  id: string;
  name: string;
  role: 'Settlement Leader' | 'Trader' | 'Blacksmith' | 'Scientist' | 'Explorer' | 'Survivor' | 'Engineer' | 'Construct';
  region: RegionId;
  x: number;
  y: number;
  facing: Direction;
  palette: {
    coat: string;
    hair: string;
    accent: string;
    skin: string;
  };
  greeting: string;
  restoredGreeting: string;
  loreLines: string[];
  questIds: string[];
  trades?: TradeOffer[];
  interiorId?: string;
}

export type RestorationKind =
  | 'house'
  | 'streetlights'
  | 'generator'
  | 'comm_tower'
  | 'substation'
  | 'grove_conduit'
  | 'waterwheel'
  | 'air_purifier'
  | 'world_core';

export interface RestorationNode {
  id: string;
  name: string;
  kind: RestorationKind;
  region: RegionId;
  x: number;
  y: number;
  radius: number;
  cost: Partial<Record<ItemId, number>>;
  energyCost: number;
  restored: boolean;
  description: string;
  restoredEffect: string;
  fastTravelUnlocked?: boolean;
}

export interface CollectibleNode {
  id: string;
  region: RegionId;
  x: number;
  y: number;
  itemId: ItemId;
  qty: number;
  kind: 'crate' | 'crystal' | 'barrel' | 'herb' | 'chest' | 'alloy';
  collected: boolean;
  hidden?: boolean;
  label: string;
  interiorId?: string;
}

export interface LandmarkZone {
  id: string;
  name: string;
  subtitle: string;
  region: RegionId;
  x: number;
  y: number;
  radius: number;
  discovered: boolean;
}

export interface PortalDoor {
  id: string;
  label: string;
  fromInterior: string | null;
  toInterior: string | null;
  x: number;
  y: number;
  destX: number;
  destY: number;
}

export interface CampfireProp {
  x: number;
  y: number;
  region: RegionId;
  interiorId?: string;
}

export interface WorkbenchProp {
  id: string;
  name: string;
  x: number;
  y: number;
  region: RegionId;
  interiorId?: string;
}

export type TeleporterId =
  | 'tp_haven'
  | 'tp_city'
  | 'tp_forest'
  | 'tp_wasteland'
  | 'tp_core';

export interface TeleporterStation {
  id: TeleporterId;
  name: string;
  region: RegionId;
  x: number;
  y: number;
  description: string;
  activationCost: Partial<Record<ItemId, number>>;
  energyCost: number;
  requiresCoreGate?: boolean;
  accentColor: string;
  secondaryColor: string;
  discovered: boolean;
  activated: boolean;
}

export type SaveSlotId = 'autosave' | 'slot_1' | 'slot_2' | 'slot_3';

export interface SaveSlotMeta {
  slotId: SaveSlotId;
  label: string;
  savedAt: string;
  region: RegionId;
  regionName: string;
  level: number;
  weaponId: WeaponId;
  weaponName: string;
  weaponLevel: number;
  restoredCount: number;
  activatedTeleportersCount: number;
  timePlayedSec: number;
  isAutosave: boolean;
}

export interface TeleportTransitionState {
  active: boolean;
  phase: 'out' | 'hold' | 'in';
  destinationName: string;
  destinationRegionName: string;
  accentColor: string;
}

export type QuestCategory = 'main' | 'side';
export type QuestStatus = 'locked' | 'active' | 'completed';

export interface QuestObjective {
  id: string;
  label: string;
  type:
    | 'collect_item'
    | 'talk_npc'
    | 'restore_node'
    | 'discover_landmark'
    | 'defeat_enemies'
    | 'defeat_boss'
    | 'reach_region'
    | 'unlock_blacksmith';
  targetId?: string;
  required: number;
  current: number;
}

export interface QuestState {
  id: string;
  title: string;
  category: QuestCategory;
  giverNpcId?: string;
  summary: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: {
    xp: number;
    gold?: number;
    items?: Partial<Record<ItemId, number>>;
  };
  unlocksQuestIds?: string[];
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export interface GameSettings {
  masterVolume: number; // 0..1
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  brightness: number; // 0.75..1.3
  screenScale: number; // 0.85 | 1 | 1.15
  weatherEnabled: boolean;
  dayNightSpeed: number; // 0 | 1 | 2
  controlMode: ControlMode;
  showQuestMarkers: boolean;
  showDamageNumbers: boolean;
  cameraShake: boolean;
  particleDensity: ParticleDensity;
  visualEffects: VisualEffectsQuality;
}

export interface WorldStats {
  enemiesDefeated: number;
  nodesRestored: number;
  totalNodes: number;
  landmarksDiscovered: number;
  totalLandmarks: number;
  questsCompleted: number;
  timePlayedSec: number;
  talkedNpcIds: string[];
  visitedRegions: RegionId[];
  coreGateUnlocked: boolean;
  unlockedAchievements: string[];
  craftedCount: number;
}

export interface SaveData {
  version: number;
  savedAt: string;
  player: {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    stamina: number;
    energy: number;
    maxEnergy: number;
    level: number;
    xp: number;
    nextLevelXp: number;
    gold?: number;
    upgrades: UpgradeId[];
    equippedWeapon?: WeaponId;
    unlockedWeapons?: WeaponId[];
    weaponUpgrades?: Record<WeaponId, WeaponUpgradeLevels>;
    equippedArmour?: ArmourId;
    unlockedArmour?: OwnedArmourId[];
    armourUpgrades?: ArmourUpgradeMap;
    skills?: SkillRankMap;
    skillPoints?: number;
  };
  interiorId: string | null;
  inventory: InventoryMap;
  restoredNodeIds: string[];
  collectedNodeIds: string[];
  discoveredLandmarkIds: string[];
  discoveredTeleporterIds?: TeleporterId[];
  activatedTeleporterIds?: TeleporterId[];
  lastCheckpointId?: TeleporterId | null;
  bossDefeated?: boolean;
  blacksmithUnlocked?: boolean;
  blacksmithHammerRecovered?: boolean;
  tutorialCompleted?: boolean;
  slotLabel?: string;
  quests: Record<string, { status: QuestStatus; currents: number[] }>;
  stats: WorldStats;
  timeOfDay: number;
  weather: WeatherType;
  settings: GameSettings;
}

export interface InteractionPrompt {
  id: string;
  label: string;
  sublabel?: string;
  kind: 'npc' | 'collectible' | 'restore' | 'door' | 'gate' | 'workbench' | 'teleporter';
  canAfford?: boolean;
}

export interface ToastMessage {
  id: number;
  title: string;
  subtitle?: string;
  tone: 'discovery' | 'quest' | 'restore' | 'loot' | 'warning' | 'achievement';
}

export interface HudSnapshot {
  mode: GameMode;
  hp: number;
  maxHp: number;
  trailingHp: number;
  stamina: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  region: RegionId;
  regionName: string;
  interiorName: string | null;
  timeOfDay: number;
  dayPhase: 'Dawn' | 'Day' | 'Dusk' | 'Night';
  weather: WeatherType;
  inventory: InventoryMap;
  gold: number;
  backpackUsedSlots: number;
  backpackMaxSlots: number;
  arrowCount: number;
  upgrades: UpgradeId[];
  equippedWeapon: WeaponId;
  equippedWeaponCategory: WeaponCategory;
  equippedWeaponName: string;
  equippedWeaponLevel: number;
  unlockedWeapons: WeaponId[];
  equippedArmour: ArmourId;
  equippedArmourName: string;
  defense: number;
  blacksmithUnlocked: boolean;
  blacksmithHammerRecovered: boolean;
  skillPoints: number;
  chargeProgress: number; // 0..1
  heavyReady: boolean;
  energyStrikeReady: boolean;
  activeQuestTitle: string;
  activeQuestStep: string;
  prompt: InteractionPrompt | null;
  bossBar: {
    name: string;
    title: string;
    hp: number;
    trailingHp: number;
    maxHp: number;
    phase: number;
    telegraphWarning: string | null;
    defeated: boolean;
  } | null;
  activeMusicTrack: RegionId | 'title' | 'boss';
  restoredCount: number;
  totalRestorationNodes: number;
  activatedTeleporterCount: number;
  totalTeleporters: number;
  autosaving: boolean;
  lastSavedLabel: string | null;
  playerTileX: number;
  playerTileY: number;
  coreGateUnlocked: boolean;
  muted: boolean;
  hasSave: boolean;
  respawnCheckpointName: string;
  pulseReady: boolean;
  stats: WorldStats;
}

import {
  ArmourId,
  ArmourUpgradeMap,
  InventoryMap,
  ItemId,
  OwnedArmourId,
  PlayerState,
  SkillBranch,
  SkillId,
  SkillRankMap,
  UpgradeId,
  WeaponCategory,
  WeaponId,
  WeaponUpgradeLevels,
  WeaponUpgradeStat,
  WorldStats,
} from './types';

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  category: WeaponCategory;
  tier: 1 | 2 | 3 | 4 | 5;
  tagline: string;
  description: string;
  baseDamage: number;
  heavyMultiplier: number;
  baseCooldown: number; // seconds
  baseRange: number; // px (melee reach or bow arrow travel distance)
  usesAmmo?: ItemId;
  projectileSpeed?: number; // px/sec for bows
  baseCritChance: number; // 0..1
  baseEnergyBonus: number;
  baseEnergyRegenBonus: number;
  energyStrikeCost: number;
  energyStrikeMultiplier: number;
  slashPrimaryColor: string;
  slashSecondaryColor: string;
  glowColor: string;
  particleColor: string;
  unlockRequirementText: string;
  requiredRelays: number;
  requiredLevel: number;
  requiresBossOrCore?: boolean;
  unlockCost: Partial<Record<ItemId, number>>;
  goldCost: number;
}

export const WEAPON_ORDER: WeaponId[] = [
  'scrap_blade',
  'scrap_axe',
  'hunter_bow',
  'reinforced_sword',
  'pulse_blade',
  'foundry_greataxe',
  'arc_longbow',
  'ancient_blade',
  'coreblade',
];

export const WEAPON_CATALOG: Record<WeaponId, WeaponDefinition> = {
  scrap_blade: {
    id: 'scrap_blade',
    name: 'Scrap Blade',
    category: 'sword',
    tier: 1,
    tagline: 'Weathered Salvage Iron',
    description:
      'A battered length of salvaged rebar honed into a nimble survival blade. Quick swings with crisp metal sparks.',
    baseDamage: 20,
    heavyMultiplier: 1.65,
    baseCooldown: 0.31,
    baseRange: 44,
    baseCritChance: 0.08,
    baseEnergyBonus: 0,
    baseEnergyRegenBonus: 0,
    energyStrikeCost: 16,
    energyStrikeMultiplier: 0.9,
    slashPrimaryColor: '#e2e8f0',
    slashSecondaryColor: '#94a3b8',
    glowColor: '#cbd5e1',
    particleColor: '#f8fafc',
    unlockRequirementText: 'Starting Survivor Weapon',
    requiredRelays: 0,
    requiredLevel: 1,
    unlockCost: {},
    goldCost: 0,
  },
  scrap_axe: {
    id: 'scrap_axe',
    name: 'Salvage Battleaxe',
    category: 'axe',
    tier: 1,
    tagline: 'Heavy Cleaving Edge',
    description:
      'A weighty iron battleaxe forged from industrial plating. Swings slower than a sword, but delivers crushing close-range cleaves.',
    baseDamage: 28,
    heavyMultiplier: 1.95,
    baseCooldown: 0.46,
    baseRange: 42,
    baseCritChance: 0.1,
    baseEnergyBonus: 0,
    baseEnergyRegenBonus: 0,
    energyStrikeCost: 16,
    energyStrikeMultiplier: 1.0,
    slashPrimaryColor: '#fdba74',
    slashSecondaryColor: '#c2410c',
    glowColor: '#fb923c',
    particleColor: '#fed7aa',
    unlockRequirementText: 'Craft at Blacksmith Workshop',
    requiredRelays: 0,
    requiredLevel: 1,
    unlockCost: { scrap: 3, parts: 1 },
    goldCost: 20,
  },
  hunter_bow: {
    id: 'hunter_bow',
    name: 'Scavenger Bow',
    category: 'bow',
    tier: 1,
    tagline: 'Precision Ranged Recurve',
    description:
      'A laminated survival recurve bow kept permanently once crafted. Fires Iron-Tipped Arrows purchased with Gold from merchants.',
    baseDamage: 24,
    heavyMultiplier: 1.65,
    baseCooldown: 0.42,
    baseRange: 260,
    usesAmmo: 'arrow',
    projectileSpeed: 480,
    baseCritChance: 0.14,
    baseEnergyBonus: 5,
    baseEnergyRegenBonus: 0.2,
    energyStrikeCost: 15,
    energyStrikeMultiplier: 1.0,
    slashPrimaryColor: '#86efac',
    slashSecondaryColor: '#16a34a',
    glowColor: '#4ade80',
    particleColor: '#dcfce7',
    unlockRequirementText: 'Craft at Blacksmith Workshop',
    requiredRelays: 0,
    requiredLevel: 1,
    unlockCost: { scrap: 3, parts: 1 },
    goldCost: 20,
  },
  reinforced_sword: {
    id: 'reinforced_sword',
    name: 'Reinforced Sword',
    category: 'sword',
    tier: 2,
    tagline: 'Tempered Steel Broadsword',
    description:
      'Forged with riveted steel fuller and brass guard. Strikes significantly harder with a forceful golden-steel arc.',
    baseDamage: 29,
    heavyMultiplier: 1.78,
    baseCooldown: 0.34,
    baseRange: 50,
    baseCritChance: 0.12,
    baseEnergyBonus: 10,
    baseEnergyRegenBonus: 0.3,
    energyStrikeCost: 16,
    energyStrikeMultiplier: 1.05,
    slashPrimaryColor: '#fde68a',
    slashSecondaryColor: '#f59e0b',
    glowColor: '#fbbf24',
    particleColor: '#fef08a',
    unlockRequirementText: 'Craft at Blacksmith Workshop',
    requiredRelays: 0,
    requiredLevel: 1,
    unlockCost: { scrap: 4, parts: 2 },
    goldCost: 35,
  },
  pulse_blade: {
    id: 'pulse_blade',
    name: 'Pulse Blade',
    category: 'sword',
    tier: 3,
    tagline: 'Arc-Charged Plasma Edge',
    description:
      'Futuristic emitter blade channeling humming cyan energy along its edge. Releases electric arcs and boosted energy waves.',
    baseDamage: 38,
    heavyMultiplier: 1.88,
    baseCooldown: 0.3,
    baseRange: 55,
    baseCritChance: 0.16,
    baseEnergyBonus: 25,
    baseEnergyRegenBonus: 1.0,
    energyStrikeCost: 14,
    energyStrikeMultiplier: 1.25,
    slashPrimaryColor: '#5eead4',
    slashSecondaryColor: '#06b6d4',
    glowColor: '#2dd4bf',
    particleColor: '#99f6e4',
    unlockRequirementText: 'Restore 2 World Relays + Blacksmith',
    requiredRelays: 2,
    requiredLevel: 2,
    unlockCost: { scrap: 4, parts: 3, crystal: 2 },
    goldCost: 75,
  },
  foundry_greataxe: {
    id: 'foundry_greataxe',
    name: 'Foundry Greataxe',
    category: 'axe',
    tier: 3,
    tagline: 'Alloy-Forged Heavy Cleaver',
    description:
      'A furnace-tempered Aegis Alloy greataxe with devastating impact. Slower swings, unmatched close-range stagger and raw force.',
    baseDamage: 46,
    heavyMultiplier: 2.15,
    baseCooldown: 0.5,
    baseRange: 52,
    baseCritChance: 0.16,
    baseEnergyBonus: 15,
    baseEnergyRegenBonus: 0.5,
    energyStrikeCost: 15,
    energyStrikeMultiplier: 1.3,
    slashPrimaryColor: '#fb923c',
    slashSecondaryColor: '#dc2626',
    glowColor: '#f97316',
    particleColor: '#ffedd5',
    unlockRequirementText: 'Restore 2 World Relays + Blacksmith',
    requiredRelays: 2,
    requiredLevel: 2,
    unlockCost: { scrap: 5, parts: 3, rare_alloy: 1 },
    goldCost: 85,
  },
  arc_longbow: {
    id: 'arc_longbow',
    name: 'Arc Recurve Bow',
    category: 'bow',
    tier: 3,
    tagline: 'Crystal-Strung Precision Bow',
    description:
      'Reinforced with Arc Crystal limbs for faster arrow velocity, extended firing range, and lethal critical precision.',
    baseDamage: 37,
    heavyMultiplier: 1.85,
    baseCooldown: 0.37,
    baseRange: 320,
    usesAmmo: 'arrow',
    projectileSpeed: 570,
    baseCritChance: 0.22,
    baseEnergyBonus: 20,
    baseEnergyRegenBonus: 0.8,
    energyStrikeCost: 14,
    energyStrikeMultiplier: 1.2,
    slashPrimaryColor: '#38bdf8',
    slashSecondaryColor: '#0284c7',
    glowColor: '#38bdf8',
    particleColor: '#bae6fd',
    unlockRequirementText: 'Restore 2 World Relays + Blacksmith',
    requiredRelays: 2,
    requiredLevel: 2,
    unlockCost: { scrap: 4, parts: 2, crystal: 2 },
    goldCost: 80,
  },
  ancient_blade: {
    id: 'ancient_blade',
    name: 'Ancient Blade',
    category: 'sword',
    tier: 4,
    tagline: 'Runic Violet-Cyan Relic',
    description:
      'Pre-Fall relic engraved with violet and cyan conduits. Excels at devastating Charged Heavy Slashes and high critical strikes.',
    baseDamage: 48,
    heavyMultiplier: 2.15,
    baseCooldown: 0.33,
    baseRange: 60,
    baseCritChance: 0.22,
    baseEnergyBonus: 35,
    baseEnergyRegenBonus: 1.5,
    energyStrikeCost: 14,
    energyStrikeMultiplier: 1.4,
    slashPrimaryColor: '#c084fc',
    slashSecondaryColor: '#38bdf8',
    glowColor: '#a855f7',
    particleColor: '#e9d5ff',
    unlockRequirementText: 'Restore 3 World Relays + Blacksmith',
    requiredRelays: 3,
    requiredLevel: 3,
    unlockCost: { parts: 3, crystal: 3, rare_alloy: 1 },
    goldCost: 120,
  },
  coreblade: {
    id: 'coreblade',
    name: 'Coreblade',
    category: 'sword',
    tier: 5,
    tagline: 'Legendary Harmonic Core Edge',
    description:
      'The pinnacle weapon harmonized with the World Core. Unleashes luminous twin-arc slashes, orbiting core motes, and piercing Core waves.',
    baseDamage: 62,
    heavyMultiplier: 2.35,
    baseCooldown: 0.28,
    baseRange: 66,
    baseCritChance: 0.28,
    baseEnergyBonus: 55,
    baseEnergyRegenBonus: 2.4,
    energyStrikeCost: 12,
    energyStrikeMultiplier: 1.65,
    slashPrimaryColor: '#67e8f9',
    slashSecondaryColor: '#fde047',
    glowColor: '#5eead4',
    particleColor: '#fef9c3',
    unlockRequirementText: 'Unseal Lost Core (4 Relays) + Blacksmith',
    requiredRelays: 4,
    requiredLevel: 4,
    requiresBossOrCore: true,
    unlockCost: { crystal: 4, rare_alloy: 2, parts: 3 },
    goldCost: 180,
  },
};

export interface ArmourDefinition {
  id: OwnedArmourId;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  tagline: string;
  description: string;
  baseDefense: number;
  baseMaxHpBonus: number;
  primaryColor: string;
  accentColor: string;
  requiredRelays: number;
  requiresCoreGate?: boolean;
  unlockRequirementText: string;
  craftCost: Partial<Record<ItemId, number>>;
  goldCost: number;
}

export const MAX_ARMOUR_UPGRADE_LEVEL = 5;

export const ARMOUR_ORDER: OwnedArmourId[] = [
  'scout_tunic',
  'reinforced_vest',
  'iron_plate',
  'aegis_alloy_armour',
  'core_sentinel_plate',
];

export const ARMOUR_CATALOG: Record<OwnedArmourId, ArmourDefinition> = {
  scout_tunic: {
    id: 'scout_tunic',
    name: 'Scavenger Leather Coat',
    tier: 1,
    tagline: 'Basic Quilted Protection',
    description:
      'Stitched leather and padded scrap plates that soften glancing blows without slowing your stride.',
    baseDefense: 3,
    baseMaxHpBonus: 15,
    primaryColor: '#8c6239',
    accentColor: '#d9a467',
    requiredRelays: 0,
    unlockRequirementText: 'Craft at Blacksmith Workshop',
    craftCost: { scrap: 3 },
    goldCost: 25,
  },
  reinforced_vest: {
    id: 'reinforced_vest',
    name: 'Reinforced Guard Vest',
    tier: 2,
    tagline: 'Riveted Field Armour',
    description:
      'Layered steel strips and mech-servo shoulder guards forged for skirmishes in The Forgotten City.',
    baseDefense: 6,
    baseMaxHpBonus: 30,
    primaryColor: '#64748b',
    accentColor: '#f59e0b',
    requiredRelays: 0,
    unlockRequirementText: 'Craft at Blacksmith Workshop',
    craftCost: { scrap: 5, parts: 2 },
    goldCost: 55,
  },
  iron_plate: {
    id: 'iron_plate',
    name: 'Foundry Iron Plate',
    tier: 3,
    tagline: 'Heavy Forged Cuirass',
    description:
      'Thick hammered iron chestplate lined with Arc Crystal filaments to absorb heavy impact.',
    baseDefense: 10,
    baseMaxHpBonus: 50,
    primaryColor: '#94a3b8',
    accentColor: '#38bdf8',
    requiredRelays: 1,
    unlockRequirementText: 'Restore 1 World Relay + Blacksmith',
    craftCost: { scrap: 4, parts: 3, crystal: 1 },
    goldCost: 95,
  },
  aegis_alloy_armour: {
    id: 'aegis_alloy_armour',
    name: 'Aegis Alloy Cuirass',
    tier: 4,
    tagline: 'Rare Composite Battlegear',
    description:
      'High-density Aegis Alloy plates built to withstand Wasteland turret fire and Stalker charges.',
    baseDefense: 15,
    baseMaxHpBonus: 75,
    primaryColor: '#475569',
    accentColor: '#c084fc',
    requiredRelays: 2,
    unlockRequirementText: 'Restore 2 World Relays + Blacksmith',
    craftCost: { parts: 4, rare_alloy: 2, crystal: 2 },
    goldCost: 150,
  },
  core_sentinel_plate: {
    id: 'core_sentinel_plate',
    name: 'Core Harmonic Mail',
    tier: 5,
    tagline: 'Masterwork Sanctum Armour',
    description:
      'Radiant titanium-crystal armour attuned to the World Core. Grants elite defense and resilience.',
    baseDefense: 22,
    baseMaxHpBonus: 110,
    primaryColor: '#0f766e',
    accentColor: '#fde047',
    requiredRelays: 4,
    requiresCoreGate: true,
    unlockRequirementText: 'Unseal Lost Core (4 Relays) + Blacksmith',
    craftCost: { rare_alloy: 3, crystal: 4, parts: 3 },
    goldCost: 240,
  },
};

export function createInitialArmourUpgrades(): ArmourUpgradeMap {
  return {
    scout_tunic: 0,
    reinforced_vest: 0,
    iron_plate: 0,
    aegis_alloy_armour: 0,
    core_sentinel_plate: 0,
  };
}

export function getArmourEffectiveStats(
  armourId: ArmourId,
  upgradeLevel: number
): { defense: number; maxHpBonus: number; level: number } {
  if (armourId === 'none') {
    return { defense: 0, maxHpBonus: 0, level: 0 };
  }
  const def = ARMOUR_CATALOG[armourId];
  const clamped = Math.max(0, Math.min(MAX_ARMOUR_UPGRADE_LEVEL, upgradeLevel));
  return {
    defense: def.baseDefense + clamped * 2,
    maxHpBonus: def.baseMaxHpBonus + clamped * 10,
    level: 1 + clamped,
  };
}

export function getArmourUpgradeCost(
  armourId: OwnedArmourId,
  currentUpgradeRank: number
): { materials: Partial<Record<ItemId, number>>; goldCost: number } {
  const tier = ARMOUR_CATALOG[armourId].tier;
  const next = currentUpgradeRank + 1;
  const materials: Partial<Record<ItemId, number>> = {
    scrap: Math.max(2, next * 2 + tier - 1),
  };
  if (next >= 2 || tier >= 2) {
    materials.parts = Math.max(1, Math.floor((next + tier) / 2));
  }
  if (tier >= 3 || next >= 3) {
    materials.crystal = Math.max(1, Math.floor((next + tier - 1) / 2));
  }
  if (tier >= 4 && next >= 3) {
    materials.rare_alloy = 1;
  }
  const goldCost = 15 + tier * 12 + next * 10;
  return { materials, goldCost };
}

export function getWeaponUpgradeGoldCost(weaponId: WeaponId, currentRank: number): number {
  const tier = WEAPON_CATALOG[weaponId].tier;
  return 12 + tier * 10 + (currentRank + 1) * 8;
}

export const MAX_WEAPON_UPGRADE_RANK = 5;

export interface WeaponUpgradeCategoryDef {
  stat: WeaponUpgradeStat;
  label: string;
  shortDesc: string;
  perRankLabel: string;
}

export const WEAPON_UPGRADE_CATEGORIES: WeaponUpgradeCategoryDef[] = [
  {
    stat: 'damage',
    label: 'Damage',
    shortDesc: 'Sharpen edge and reinforce energy output.',
    perRankLabel: '+5 DMG',
  },
  {
    stat: 'attackSpeed',
    label: 'Attack Speed',
    shortDesc: 'Reduce recovery cooldown between swings.',
    perRankLabel: '-6% Cooldown',
  },
  {
    stat: 'energyCapacity',
    label: 'Energy Capacity',
    shortDesc: 'Expand Arc-Device core capacitor cells.',
    perRankLabel: '+15 Max EN',
  },
  {
    stat: 'energyRecovery',
    label: 'Energy Recovery',
    shortDesc: 'Accelerate passive harmonic energy recharge.',
    perRankLabel: '+0.9 EN/s',
  },
  {
    stat: 'critChance',
    label: 'Critical Chance',
    shortDesc: 'Calibrate precision balance for bonus crits.',
    perRankLabel: '+6% Crit',
  },
  {
    stat: 'attackRange',
    label: 'Attack Range',
    shortDesc: 'Extend blade projection and arc reach.',
    perRankLabel: '+5 px Reach',
  },
];

export interface SkillNodeDef {
  id: SkillId;
  branch: SkillBranch;
  name: string;
  description: string;
  maxRank: number;
  effectPerRank: string;
}

export const SKILL_TREE_NODES: SkillNodeDef[] = [
  // COMBAT BRANCH
  {
    id: 'combat_edge',
    branch: 'combat',
    name: 'Blade Mastery',
    description: 'Increases all sword slash and heavy attack damage.',
    maxRank: 3,
    effectPerRank: '+14% Sword Damage',
  },
  {
    id: 'combat_crit',
    branch: 'combat',
    name: 'Precision Strikes',
    description: 'Improves critical hit chance and boosts critical hit multiplier.',
    maxRank: 3,
    effectPerRank: '+7% Crit Chance · +15% Crit DMG',
  },
  {
    id: 'combat_heavy',
    branch: 'combat',
    name: 'Titan Cleave',
    description: 'Amplifies Heavy & Charged Slashes with wider arcs and impact force.',
    maxRank: 2,
    effectPerRank: '+22% Heavy DMG · +10% Heavy Reach',
  },

  // ENERGY BRANCH
  {
    id: 'energy_pool',
    branch: 'energy',
    name: 'Resonant Core',
    description: 'Expands maximum Arc Energy capacity for more skills.',
    maxRank: 3,
    effectPerRank: '+20 Max Energy',
  },
  {
    id: 'energy_flow',
    branch: 'energy',
    name: 'Harmonic Recovery',
    description: 'Accelerates energy regeneration at all times and near relays.',
    maxRank: 3,
    effectPerRank: '+25% Energy Recovery',
  },
  {
    id: 'energy_nova',
    branch: 'energy',
    name: 'Overcharged Pulse',
    description: 'Strengthens Arc Pulse and Energy Strike damage and blast radius.',
    maxRank: 2,
    effectPerRank: '+25% Pulse & Wave DMG · +16px Radius',
  },

  // SURVIVAL BRANCH
  {
    id: 'survival_vitality',
    branch: 'survival',
    name: 'Iron Resolve',
    description: 'Reinforces survivor resilience with higher maximum health.',
    maxRank: 3,
    effectPerRank: '+25 Max HP',
  },
  {
    id: 'survival_stamina',
    branch: 'survival',
    name: 'Relentless Stride',
    description: 'Expands stamina reserve for more dodges and longer sprints.',
    maxRank: 3,
    effectPerRank: '+20 Max Stamina · +18% Regen',
  },
  {
    id: 'survival_scavenger',
    branch: 'survival',
    name: 'Master Scavenger',
    description: 'Recovers bonus scrap, parts, or crystals from crates and enemies.',
    maxRank: 2,
    effectPerRank: '+30% Bonus Resource Yield',
  },
];

export function createEmptyWeaponUpgrades(): WeaponUpgradeLevels {
  return {
    damage: 0,
    attackSpeed: 0,
    energyCapacity: 0,
    energyRecovery: 0,
    critChance: 0,
    attackRange: 0,
  };
}

export function createInitialAllWeaponUpgrades(): Record<WeaponId, WeaponUpgradeLevels> {
  return {
    scrap_blade: createEmptyWeaponUpgrades(),
    scrap_axe: createEmptyWeaponUpgrades(),
    hunter_bow: createEmptyWeaponUpgrades(),
    reinforced_sword: createEmptyWeaponUpgrades(),
    pulse_blade: createEmptyWeaponUpgrades(),
    foundry_greataxe: createEmptyWeaponUpgrades(),
    arc_longbow: createEmptyWeaponUpgrades(),
    ancient_blade: createEmptyWeaponUpgrades(),
    coreblade: createEmptyWeaponUpgrades(),
  };
}

export function createInitialSkillRanks(): SkillRankMap {
  return {
    combat_edge: 0,
    combat_crit: 0,
    combat_heavy: 0,
    energy_pool: 0,
    energy_flow: 0,
    energy_nova: 0,
    survival_vitality: 0,
    survival_stamina: 0,
    survival_scavenger: 0,
  };
}

export function getWeaponLevel(levels: WeaponUpgradeLevels): number {
  const sum =
    levels.damage +
    levels.attackSpeed +
    levels.energyCapacity +
    levels.energyRecovery +
    levels.critChance +
    levels.attackRange;
  return 1 + sum;
}

export function getWeaponUpgradeCost(
  weaponId: WeaponId,
  stat: WeaponUpgradeStat,
  currentRank: number
): Partial<Record<ItemId, number>> {
  const tier = WEAPON_CATALOG[weaponId].tier;
  const next = currentRank + 1;
  const cost: Partial<Record<ItemId, number>> = {
    scrap: Math.max(1, next * 2 + tier - 1),
  };
  if (stat === 'damage' || stat === 'attackSpeed' || stat === 'attackRange') {
    if (next >= 2 || tier >= 2) {
      cost.parts = Math.max(1, Math.floor((next + tier) / 2));
    }
  }
  if (
    stat === 'energyCapacity' ||
    stat === 'energyRecovery' ||
    stat === 'critChance' ||
    tier >= 3 ||
    next >= 3
  ) {
    cost.crystal = Math.max(1, Math.floor((next + tier - 1) / 2));
  }
  return cost;
}

export interface EffectiveCombatStats {
  weaponDamage: number;
  heavyDamage: number;
  chargedDamage: number;
  attackCooldown: number;
  heavyCooldown: number;
  attackRange: number;
  heavyRange: number;
  critChance: number;
  critMultiplier: number;
  defense: number;
  maxHp: number;
  maxStamina: number;
  staminaRegen: number;
  maxEnergy: number;
  energyRegen: number;
  pulseDamage: number;
  pulseRadius: number;
  energyStrikeCost: number;
  energyStrikeDamage: number;
  bonusLootChance: number;
}

export function computeWeaponPreviewStats(
  weaponId: WeaponId,
  ranks: WeaponUpgradeLevels
): {
  damage: number;
  cooldown: number;
  energyBonus: number;
  energyRegen: number;
  critChancePct: number;
  range: number;
} {
  const def = WEAPON_CATALOG[weaponId];
  const damage = def.baseDamage + ranks.damage * 5;
  const cooldown = Number(
    Math.max(0.16, def.baseCooldown * Math.pow(0.94, ranks.attackSpeed)).toFixed(2)
  );
  const energyBonus = def.baseEnergyBonus + ranks.energyCapacity * 15;
  const energyRegen = Number((def.baseEnergyRegenBonus + ranks.energyRecovery * 0.9).toFixed(1));
  const critChancePct = Math.min(75, Math.round((def.baseCritChance + ranks.critChance * 0.06) * 100));
  const range = def.baseRange + ranks.attackRange * (def.category === 'bow' ? 28 : 5);
  return { damage, cooldown, energyBonus, energyRegen, critChancePct, range };
}

export function computeCombatStats(
  level: number,
  upgrades: UpgradeId[],
  weaponId: WeaponId,
  weaponRanks: WeaponUpgradeLevels,
  skills: SkillRankMap,
  equippedArmour: ArmourId = 'none',
  armourUpgrades?: ArmourUpgradeMap
): EffectiveCombatStats {
  const def = WEAPON_CATALOG[weaponId];
  const levelDmgBonus = (level - 1) * 4;
  const gearBladeBonus = upgrades.includes('arc_blade_mk2') ? 14 : 0;
  const rawDamage = def.baseDamage + weaponRanks.damage * 5 + levelDmgBonus + gearBladeBonus;
  const combatEdgeMult = 1 + skills.combat_edge * 0.14;
  const weaponDamage = Math.round(rawDamage * combatEdgeMult);

  const heavySkillMult = 1 + skills.combat_heavy * 0.22;
  const heavyDamage = Math.round(weaponDamage * def.heavyMultiplier * heavySkillMult);
  const chargedDamage = Math.round(heavyDamage * 1.32);

  const attackCooldown = Math.max(0.16, def.baseCooldown * Math.pow(0.94, weaponRanks.attackSpeed));
  const heavyCooldown = attackCooldown * 1.65;

  const rangePerRank = def.category === 'bow' ? 28 : 5;
  const meleeReachBonus = def.category !== 'bow' && upgrades.includes('arc_blade_mk2') ? 6 : 0;
  const baseRange = def.baseRange + weaponRanks.attackRange * rangePerRank + meleeReachBonus;
  const heavyRange = Math.round(baseRange * (1.28 + skills.combat_heavy * 0.1));

  const critChance = Math.min(0.75, def.baseCritChance + weaponRanks.critChance * 0.06 + skills.combat_crit * 0.07);
  const critMultiplier = 1.65 + skills.combat_crit * 0.15;

  const armourRank =
    equippedArmour !== 'none' && armourUpgrades ? armourUpgrades[equippedArmour] ?? 0 : 0;
  const armourStats = getArmourEffectiveStats(equippedArmour, armourRank);

  const maxHp =
    100 +
    (level - 1) * 15 +
    (upgrades.includes('aegis_vest') ? 45 : 0) +
    armourStats.maxHpBonus +
    skills.survival_vitality * 25;

  const maxStamina = 100 + (level - 1) * 10 + skills.survival_stamina * 20;
  const baseStamRegen = upgrades.includes('kinetic_boots') ? 32 : 24;
  const staminaRegen = baseStamRegen * (1 + skills.survival_stamina * 0.18);

  const maxEnergy =
    100 +
    (upgrades.includes('energy_capacitor') ? 40 : 0) +
    def.baseEnergyBonus +
    weaponRanks.energyCapacity * 15 +
    skills.energy_pool * 20;

  const baseEnRegen =
    (upgrades.includes('energy_capacitor') ? 4.8 : 2.8) +
    def.baseEnergyRegenBonus +
    weaponRanks.energyRecovery * 0.9;
  const energyRegen = baseEnRegen * (1 + skills.energy_flow * 0.25);

  const pulseSkillMult = 1 + skills.energy_nova * 0.25;
  const pulseDamage = Math.round(weaponDamage * 1.48 * pulseSkillMult);
  const pulseRadius = 128 + skills.energy_nova * 16 + (weaponId === 'coreblade' ? 22 : 0);

  const energyStrikeCost = def.energyStrikeCost;
  const energyStrikeDamage = Math.round(
    weaponDamage * def.energyStrikeMultiplier * pulseSkillMult
  );

  const bonusLootChance = skills.survival_scavenger * 0.3;

  return {
    weaponDamage,
    heavyDamage,
    chargedDamage,
    attackCooldown,
    heavyCooldown,
    attackRange: baseRange,
    heavyRange,
    critChance,
    critMultiplier,
    defense: armourStats.defense,
    maxHp,
    maxStamina,
    staminaRegen,
    maxEnergy,
    energyRegen,
    pulseDamage,
    pulseRadius,
    energyStrikeCost,
    energyStrikeDamage,
    bonusLootChance,
  };
}

export function canUnlockWeapon(
  weaponId: WeaponId,
  player: Pick<PlayerState, 'unlockedWeapons' | 'level' | 'gold'>,
  inventory: InventoryMap,
  stats: Pick<WorldStats, 'nodesRestored' | 'coreGateUnlocked'>
): { ok: boolean; reason?: string } {
  if (player.unlockedWeapons.includes(weaponId)) {
    return { ok: false, reason: 'Already forged' };
  }
  const def = WEAPON_CATALOG[weaponId];
  if (stats.nodesRestored < def.requiredRelays) {
    return { ok: false, reason: `Restore ${def.requiredRelays} Relays (${stats.nodesRestored}/${def.requiredRelays})` };
  }
  if (def.requiresBossOrCore && !stats.coreGateUnlocked) {
    return { ok: false, reason: 'Unseal The Lost Core Gate first' };
  }
  if (player.gold < def.goldCost) {
    return { ok: false, reason: `Need ${def.goldCost} Gold` };
  }
  for (const [k, qty] of Object.entries(def.unlockCost)) {
    if ((inventory[k as ItemId] ?? 0) < (qty ?? 0)) {
      return { ok: false, reason: 'Insufficient forging materials' };
    }
  }
  return { ok: true };
}

export function canUpgradeWeaponStat(
  weaponId: WeaponId,
  stat: WeaponUpgradeStat,
  player: Pick<PlayerState, 'unlockedWeapons' | 'weaponUpgrades' | 'gold'>,
  inventory: InventoryMap
): { ok: boolean; cost: Partial<Record<ItemId, number>>; goldCost: number; reason?: string } {
  if (!player.unlockedWeapons.includes(weaponId)) {
    return { ok: false, cost: {}, goldCost: 0, reason: 'Craft this weapon first' };
  }
  const currentRank = player.weaponUpgrades[weaponId][stat];
  if (currentRank >= MAX_WEAPON_UPGRADE_RANK) {
    return { ok: false, cost: {}, goldCost: 0, reason: 'Maximum level reached' };
  }
  const cost = getWeaponUpgradeCost(weaponId, stat, currentRank);
  const goldCost = getWeaponUpgradeGoldCost(weaponId, currentRank);
  if (player.gold < goldCost) {
    return { ok: false, cost, goldCost, reason: `Need ${goldCost} Gold` };
  }
  for (const [k, qty] of Object.entries(cost)) {
    if ((inventory[k as ItemId] ?? 0) < (qty ?? 0)) {
      return { ok: false, cost, goldCost, reason: 'Insufficient resources' };
    }
  }
  return { ok: true, cost, goldCost };
}

export function canCraftArmour(
  armourId: OwnedArmourId,
  player: Pick<PlayerState, 'unlockedArmour' | 'gold'>,
  inventory: InventoryMap,
  stats: Pick<WorldStats, 'nodesRestored' | 'coreGateUnlocked'>
): { ok: boolean; reason?: string } {
  if (player.unlockedArmour.includes(armourId)) {
    return { ok: false, reason: 'Already crafted' };
  }
  const def = ARMOUR_CATALOG[armourId];
  if (stats.nodesRestored < def.requiredRelays) {
    return { ok: false, reason: `Restore ${def.requiredRelays} Relays (${stats.nodesRestored}/${def.requiredRelays})` };
  }
  if (def.requiresCoreGate && !stats.coreGateUnlocked) {
    return { ok: false, reason: 'Unseal The Lost Core Gate first' };
  }
  if (player.gold < def.goldCost) {
    return { ok: false, reason: `Need ${def.goldCost} Gold` };
  }
  for (const [k, qty] of Object.entries(def.craftCost)) {
    if ((inventory[k as ItemId] ?? 0) < (qty ?? 0)) {
      return { ok: false, reason: 'Insufficient crafting materials' };
    }
  }
  return { ok: true };
}

export function canUpgradeArmour(
  armourId: OwnedArmourId,
  player: Pick<PlayerState, 'unlockedArmour' | 'armourUpgrades' | 'gold'>,
  inventory: InventoryMap
): { ok: boolean; cost: Partial<Record<ItemId, number>>; goldCost: number; reason?: string } {
  if (!player.unlockedArmour.includes(armourId)) {
    return { ok: false, cost: {}, goldCost: 0, reason: 'Craft this armour first' };
  }
  const currentRank = player.armourUpgrades[armourId] ?? 0;
  if (currentRank >= MAX_ARMOUR_UPGRADE_LEVEL) {
    return { ok: false, cost: {}, goldCost: 0, reason: 'Maximum armour level reached' };
  }
  const { materials, goldCost } = getArmourUpgradeCost(armourId, currentRank);
  if (player.gold < goldCost) {
    return { ok: false, cost: materials, goldCost, reason: `Need ${goldCost} Gold` };
  }
  for (const [k, qty] of Object.entries(materials)) {
    if ((inventory[k as ItemId] ?? 0) < (qty ?? 0)) {
      return { ok: false, cost: materials, goldCost, reason: 'Insufficient materials' };
    }
  }
  return { ok: true, cost: materials, goldCost };
}

export function canLearnSkill(
  skillId: SkillId,
  player: Pick<PlayerState, 'skills' | 'skillPoints'>
): { ok: boolean; reason?: string } {
  const def = SKILL_TREE_NODES.find((s) => s.id === skillId);
  if (!def) return { ok: false, reason: 'Unknown skill' };
  if (player.skillPoints <= 0) return { ok: false, reason: 'No Skill Points available' };
  if ((player.skills[skillId] ?? 0) >= def.maxRank) {
    return { ok: false, reason: 'Skill maxed out' };
  }
  return { ok: true };
}

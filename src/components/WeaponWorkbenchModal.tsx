import React, { useState } from 'react';
import { Hammer, Lock, Shield, Sparkles, Swords, Wrench } from 'lucide-react';
import {
  ARMOUR_CATALOG,
  ARMOUR_ORDER,
  canCraftArmour,
  canUnlockWeapon,
  canUpgradeArmour,
  canUpgradeWeaponStat,
  computeWeaponPreviewStats,
  getArmourEffectiveStats,
  getWeaponLevel,
  MAX_ARMOUR_UPGRADE_LEVEL,
  MAX_WEAPON_UPGRADE_RANK,
  WEAPON_CATALOG,
  WEAPON_ORDER,
  WEAPON_UPGRADE_CATEGORIES,
} from '../game/combat';
import { ITEM_CATALOG } from '../game/quests';
import {
  ArmourId,
  ArmourUpgradeMap,
  InventoryMap,
  ItemId,
  OwnedArmourId,
  PlayerState,
  WeaponCategory,
  WeaponId,
  WeaponUpgradeStat,
  WorldStats,
} from '../game/types';
import { GoldCoinIcon, ShieldDefenseIcon } from './GameIcons';
import { ArmourArtwork, WeaponArtwork } from './WeaponArtwork';

type WorkshopSection = 'weapon_craft' | 'armour_craft' | 'weapon_upgrade' | 'armour_upgrade';

interface WeaponWorkbenchModalProps {
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  weaponUpgrades: PlayerState['weaponUpgrades'];
  equippedArmour: ArmourId;
  unlockedArmour: OwnedArmourId[];
  armourUpgrades: ArmourUpgradeMap;
  gold: number;
  defense: number;
  backpackUsedSlots: number;
  backpackMaxSlots: number;
  playerLevel: number;
  inventory: InventoryMap;
  stats: WorldStats;
  onEquipWeapon: (weaponId: WeaponId) => boolean;
  onForgeWeapon: (weaponId: WeaponId) => { ok: boolean; message: string };
  onUpgradeWeapon: (
    weaponId: WeaponId,
    stat: WeaponUpgradeStat
  ) => { ok: boolean; message: string };
  onEquipArmour: (armourId: ArmourId) => boolean;
  onCraftArmour: (armourId: OwnedArmourId) => { ok: boolean; message: string };
  onUpgradeArmour: (armourId: OwnedArmourId) => { ok: boolean; message: string };
  onClose: () => void;
}

const CATEGORY_LABELS: Record<WeaponCategory, string> = {
  sword: 'Sword',
  axe: 'Axe',
  bow: 'Bow',
};

export const WeaponWorkbenchModal: React.FC<WeaponWorkbenchModalProps> = ({
  equippedWeapon,
  unlockedWeapons,
  weaponUpgrades,
  equippedArmour,
  unlockedArmour,
  armourUpgrades,
  gold,
  defense,
  backpackUsedSlots,
  backpackMaxSlots,
  playerLevel,
  inventory,
  stats,
  onEquipWeapon,
  onForgeWeapon,
  onUpgradeWeapon,
  onEquipArmour,
  onCraftArmour,
  onUpgradeArmour,
  onClose,
}) => {
  const [section, setSection] = useState<WorkshopSection>('weapon_craft');
  const [categoryFilter, setCategoryFilter] = useState<'all' | WeaponCategory>('all');
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId>(equippedWeapon);
  const [selectedArmourId, setSelectedArmourId] = useState<OwnedArmourId>(
    equippedArmour !== 'none' ? equippedArmour : unlockedArmour[0] ?? 'scout_tunic'
  );
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedWeaponDef = WEAPON_CATALOG[selectedWeaponId];
  const weaponUnlocked = unlockedWeapons.includes(selectedWeaponId);
  const weaponRanks = weaponUpgrades[selectedWeaponId];
  const weaponLevel = getWeaponLevel(weaponRanks);
  const weaponPreview = computeWeaponPreviewStats(selectedWeaponId, weaponRanks);

  const filteredWeapons =
    categoryFilter === 'all'
      ? WEAPON_ORDER
      : WEAPON_ORDER.filter((wid) => WEAPON_CATALOG[wid].category === categoryFilter);

  const formatStatPreview = (
    weaponId: WeaponId,
    stat: WeaponUpgradeStat,
    nextRank: number
  ): { now: string; next: string } => {
    const ranks = weaponUpgrades[weaponId];
    const current = computeWeaponPreviewStats(weaponId, ranks);
    const nextRanks = { ...ranks, [stat]: Math.min(MAX_WEAPON_UPGRADE_RANK, nextRank) };
    const next = computeWeaponPreviewStats(weaponId, nextRanks);
    switch (stat) {
      case 'damage':
        return { now: `${current.damage} DMG`, next: `${next.damage} DMG` };
      case 'attackSpeed':
        return { now: `${current.cooldown}s`, next: `${next.cooldown}s` };
      case 'energyCapacity':
        return { now: `+${current.energyBonus} EN`, next: `+${next.energyBonus} EN` };
      case 'energyRecovery':
        return { now: `+${current.energyRegen}/s`, next: `+${next.energyRegen}/s` };
      case 'critChance':
        return { now: `${current.critChancePct}%`, next: `${next.critChancePct}%` };
      case 'attackRange':
        return { now: `${current.range}px`, next: `${next.range}px` };
    }
  };

  const tabs: { id: WorkshopSection; label: string; icon: React.ReactNode }[] = [
    { id: 'weapon_craft', label: 'Weapon Crafting', icon: <Swords className="w-3.5 h-3.5" /> },
    { id: 'armour_craft', label: 'Armour Crafting', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'weapon_upgrade', label: 'Weapon Upgrades', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'armour_upgrade', label: 'Armour Upgrades', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/78 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Blacksmith Workshop"
    >
      <div className="w-full max-w-5xl bg-[#111a17] border border-[#446152] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#17241f] border-b border-[#2b3f35]">
          <div className="flex items-center gap-2.5">
            <Hammer className="w-5 h-5 text-[#e6b865] shrink-0" />
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#f3efe2]">
                Blacksmith Bram&apos;s Workshop
              </h2>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[#9eb5a6]">
                <span className="inline-flex items-center gap-1 font-mono-num font-bold text-[#fde047]">
                  <GoldCoinIcon className="w-3.5 h-3.5" />
                  {gold}g
                </span>
                <span>·</span>
                <span className="font-mono-num text-[#f3efe2]">{inventory.scrap} Scrap</span>
                <span className="font-mono-num text-[#fde68a]">{inventory.parts} Parts</span>
                <span className="font-mono-num text-[#5eead4]">{inventory.crystal} Crystals</span>
                <span className="font-mono-num text-[#c084fc]">{inventory.rare_alloy} Alloy</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-mono-num text-[#60a5fa]">
                  <ShieldDefenseIcon className="w-3.5 h-3.5" />
                  DEF {defense}
                </span>
                <span>·</span>
                <span className="font-mono-num text-[#a9bfb0]">
                  Bag {backpackUsedSlots}/{backpackMaxSlots}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
          >
            Close [B]
          </button>
        </div>

        {/* 4 Consolidated Workshop Tabs */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#131e1a] border-b border-[#283a31] flex flex-wrap gap-1.5">
          {tabs.map((t) => {
            const active = section === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSection(t.id);
                  setNotice(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#264237] border-[#5eead4] text-[#f4efe2]'
                    : 'bg-[#0f1714] border-[#283931] text-[#9eb5a6] hover:text-white hover:bg-[#172520]'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Feedback Banner */}
        {notice && (
          <div
            className={`px-5 py-2 border-b text-xs font-semibold ${
              notice.ok
                ? 'bg-[#152922] border-[#346454] text-[#99f6e4]'
                : 'bg-[#2a1717] border-[#6b3434] text-[#fca5a5]'
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* Active Section Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* =============================================================== */}
          {/* SECTION 1: WEAPON CRAFTING (Swords, Axes, Bows & Rare Variants) */}
          {/* =============================================================== */}
          {section === 'weapon_craft' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-[#a9bfb0]">
                  Crafted Weapons:{' '}
                  <span className="font-mono-num font-bold text-[#f3efe2]">
                    {unlockedWeapons.length}/{WEAPON_ORDER.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {(['all', 'sword', 'axe', 'bow'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-[11px] font-semibold border cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-[#243d33] border-[#5eead4] text-[#f3efe2]'
                          : 'bg-[#0e1613] border-[#283a31] text-[#96aea0] hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'All Weapons' : `${CATEGORY_LABELS[cat]}s`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredWeapons.map((wId) => {
                  const def = WEAPON_CATALOG[wId];
                  const owned = unlockedWeapons.includes(wId);
                  const equipped = equippedWeapon === wId;
                  const lv = getWeaponLevel(weaponUpgrades[wId]);
                  const preview = computeWeaponPreviewStats(wId, weaponUpgrades[wId]);
                  const check = canUnlockWeapon(
                    wId,
                    { unlockedWeapons, level: playerLevel, gold },
                    inventory,
                    stats
                  );

                  return (
                    <div
                      key={wId}
                      className={`p-3.5 border flex flex-col justify-between gap-3 ${
                        equipped
                          ? 'bg-[#172822] border-[#5eead4]'
                          : 'bg-[#0e1613] border-[#2a3f35]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 shrink-0 bg-[#121f1a] border border-[#324a3e] flex items-center justify-center">
                          <WeaponArtwork weaponId={wId} level={lv} className="w-12 h-12" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-[#f3efe2] truncate">
                              {def.name}
                            </h3>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase border border-[#3a5246] bg-[#14201b] text-[#d4e0d8] shrink-0">
                              {CATEGORY_LABELS[def.category]} · T{def.tier}
                            </span>
                          </div>
                          <p className="text-xs text-[#b7cabf] mt-1 leading-snug">
                            {def.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono-num text-[#9fe6d9]">
                            <span>{preview.damage} DMG</span>
                            <span>{preview.cooldown}s Speed</span>
                            <span>{preview.range}px Range</span>
                            {def.usesAmmo && <span className="text-[#fde68a]">Uses Arrows</span>}
                          </div>
                        </div>
                      </div>

                      {!owned && (
                        <div className="bg-[#131d19] border border-[#293c33] p-2.5 space-y-1.5">
                          <div className="text-[11px] text-[#d6b372]">
                            {def.unlockRequirementText}
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[11px] font-mono-num">
                            {def.goldCost > 0 && (
                              <span
                                className={`px-2 py-0.5 border ${
                                  gold >= def.goldCost
                                    ? 'bg-[#1a281d] border-[#4c7246] text-[#fde047]'
                                    : 'bg-[#281616] border-[#6b3434] text-[#fca5a5]'
                                }`}
                              >
                                Gold: {gold}/{def.goldCost}
                              </span>
                            )}
                            {Object.entries(def.unlockCost).map(([itemId, qty]) => {
                              const have = inventory[itemId as ItemId] ?? 0;
                              const enough = have >= (qty ?? 0);
                              return (
                                <span
                                  key={itemId}
                                  className={`px-2 py-0.5 border ${
                                    enough
                                      ? 'bg-[#162821] border-[#3d6b57] text-[#a7f3d0]'
                                      : 'bg-[#281616] border-[#6b3434] text-[#fca5a5]'
                                  }`}
                                >
                                  {ITEM_CATALOG[itemId as ItemId].name}: {have}/{qty}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e2d26]">
                        {owned ? (
                          <>
                            <span className="text-[11px] font-mono-num text-[#e6b865]">
                              Crafted · Lv.{lv}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWeaponId(wId);
                                  setSection('weapon_upgrade');
                                  setNotice(null);
                                }}
                                className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#182822] hover:bg-[#22382f] border border-[#3a5749] text-[#cfe3d7] cursor-pointer"
                              >
                                Upgrades →
                              </button>
                              <button
                                type="button"
                                disabled={equipped}
                                onClick={() => {
                                  const ok = onEquipWeapon(wId);
                                  if (ok) setNotice({ ok: true, text: `Equipped ${def.name}.` });
                                }}
                                className={`px-3 py-1.5 text-xs font-bold uppercase border ${
                                  equipped
                                    ? 'bg-[#17302a] text-[#7ddcd0] border-[#32685e] cursor-default'
                                    : 'bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0c1714] border-[#99f6e4] cursor-pointer'
                                }`}
                              >
                                {equipped ? 'Equipped' : 'Equip'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span
                              className={`text-[11px] ${
                                check.ok ? 'text-[#86efac]' : 'text-[#f87171]'
                              }`}
                            >
                              {check.ok ? 'Ready to craft' : check.reason}
                            </span>
                            <button
                              type="button"
                              disabled={!check.ok}
                              onClick={() => {
                                const res = onForgeWeapon(wId);
                                setNotice({ ok: res.ok, text: res.message });
                                if (res.ok) setSelectedWeaponId(wId);
                              }}
                              className={`px-3.5 py-1.5 text-xs font-bold uppercase border shrink-0 flex items-center gap-1 ${
                                check.ok
                                  ? 'bg-[#e5a84b] hover:bg-[#f0b960] text-[#14120c] border-[#f7cf86] cursor-pointer'
                                  : 'bg-[#1a221f] text-[#6d8276] border-[#2c3a33] cursor-not-allowed'
                              }`}
                            >
                              {!check.ok && <Lock className="w-3 h-3" />}
                              <span>Craft Weapon</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 2: ARMOUR CRAFTING (5 Defensive Progression Tiers)      */}
          {/* =============================================================== */}
          {section === 'armour_craft' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#a9bfb0]">
                <span>
                  Crafted Armour Sets:{' '}
                  <span className="font-mono-num font-bold text-[#f3efe2]">
                    {unlockedArmour.length}/{ARMOUR_ORDER.length}
                  </span>
                </span>
                <span>
                  Defense mitigates incoming enemy damage and raises Max HP.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ARMOUR_ORDER.map((aId) => {
                  const def = ARMOUR_CATALOG[aId];
                  const owned = unlockedArmour.includes(aId);
                  const equipped = equippedArmour === aId;
                  const rank = armourUpgrades[aId] ?? 0;
                  const eff = getArmourEffectiveStats(aId, rank);
                  const check = canCraftArmour(
                    aId,
                    { unlockedArmour, gold },
                    inventory,
                    stats
                  );

                  return (
                    <div
                      key={aId}
                      className={`p-3.5 border flex flex-col justify-between gap-3 ${
                        equipped
                          ? 'bg-[#16272e] border-[#60a5fa]'
                          : 'bg-[#0e1613] border-[#2a3f35]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 shrink-0 bg-[#121f1a] border border-[#324a3e] flex items-center justify-center">
                          <ArmourArtwork armourId={aId} level={eff.level} className="w-12 h-12" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-[#f3efe2] truncate">
                              {def.name}
                            </h3>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase border border-[#3a5246] bg-[#14201b] text-[#93c5fd] shrink-0">
                              Tier {def.tier}
                            </span>
                          </div>
                          <p className="text-xs text-[#b7cabf] mt-1 leading-snug">
                            {def.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-mono-num">
                            <span className="text-[#60a5fa] font-bold">+{eff.defense} DEF</span>
                            <span className="text-[#86efac] font-bold">+{eff.maxHpBonus} Max HP</span>
                          </div>
                        </div>
                      </div>

                      {!owned && (
                        <div className="bg-[#131d19] border border-[#293c33] p-2.5 flex flex-wrap gap-1.5 text-[11px] font-mono-num">
                          <span
                            className={`px-2 py-0.5 border ${
                              gold >= def.goldCost
                                ? 'bg-[#1a281d] border-[#4c7246] text-[#fde047]'
                                : 'bg-[#281616] border-[#6b3434] text-[#fca5a5]'
                            }`}
                          >
                            Gold: {gold}/{def.goldCost}
                          </span>
                          {Object.entries(def.craftCost).map(([itemId, qty]) => {
                            const have = inventory[itemId as ItemId] ?? 0;
                            const enough = have >= (qty ?? 0);
                            return (
                              <span
                                key={itemId}
                                className={`px-2 py-0.5 border ${
                                  enough
                                    ? 'bg-[#162821] border-[#3d6b57] text-[#a7f3d0]'
                                    : 'bg-[#281616] border-[#6b3434] text-[#fca5a5]'
                                }`}
                              >
                                {ITEM_CATALOG[itemId as ItemId].name}: {have}/{qty}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e2d26]">
                        {owned ? (
                          <>
                            <span className="text-[11px] font-mono-num text-[#e6b865]">
                              Owned · Lv.{eff.level}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArmourId(aId);
                                  setSection('armour_upgrade');
                                  setNotice(null);
                                }}
                                className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#182822] hover:bg-[#22382f] border border-[#3a5749] text-[#cfe3d7] cursor-pointer"
                              >
                                Upgrade →
                              </button>
                              <button
                                type="button"
                                disabled={equipped}
                                onClick={() => {
                                  const ok = onEquipArmour(aId);
                                  if (ok) setNotice({ ok: true, text: `Equipped ${def.name}.` });
                                }}
                                className={`px-3 py-1.5 text-xs font-bold uppercase border ${
                                  equipped
                                    ? 'bg-[#17303a] text-[#93c5fd] border-[#3b729c] cursor-default'
                                    : 'bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0c1714] border-[#99f6e4] cursor-pointer'
                                }`}
                              >
                                {equipped ? 'Equipped' : 'Equip'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span
                              className={`text-[11px] ${
                                check.ok ? 'text-[#86efac]' : 'text-[#f87171]'
                              }`}
                            >
                              {check.ok ? 'Ready to craft' : check.reason}
                            </span>
                            <button
                              type="button"
                              disabled={!check.ok}
                              onClick={() => {
                                const res = onCraftArmour(aId);
                                setNotice({ ok: res.ok, text: res.message });
                                if (res.ok) setSelectedArmourId(aId);
                              }}
                              className={`px-3.5 py-1.5 text-xs font-bold uppercase border shrink-0 ${
                                check.ok
                                  ? 'bg-[#e5a84b] hover:bg-[#f0b960] text-[#14120c] border-[#f7cf86] cursor-pointer'
                                  : 'bg-[#1a221f] text-[#6d8276] border-[#2c3a33] cursor-not-allowed'
                              }`}
                            >
                              Craft Armour
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 3: WEAPON UPGRADES (All 6 Stat Ranks + Gold & Material) */}
          {/* =============================================================== */}
          {section === 'weapon_upgrade' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Unlocked Weapons Selector */}
              <div className="lg:col-span-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#94ae9f]">
                  Owned Weapons ({unlockedWeapons.length})
                </div>
                {unlockedWeapons.map((wId) => {
                  const def = WEAPON_CATALOG[wId];
                  const lv = getWeaponLevel(weaponUpgrades[wId]);
                  const active = selectedWeaponId === wId;
                  const eq = equippedWeapon === wId;
                  return (
                    <button
                      key={wId}
                      type="button"
                      onClick={() => {
                        setSelectedWeaponId(wId);
                        setNotice(null);
                      }}
                      className={`w-full text-left p-2.5 border flex items-center gap-2.5 cursor-pointer ${
                        active
                          ? 'bg-[#1a2c25] border-[#5eead4]'
                          : 'bg-[#0e1613] hover:bg-[#15211c] border-[#2a3f35]'
                      }`}
                    >
                      <div className="w-10 h-10 shrink-0 bg-[#101c18] border border-[#344d41] flex items-center justify-center">
                        <WeaponArtwork weaponId={wId} level={lv} className="w-8 h-8" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-xs font-bold text-[#f3efe2] truncate">
                            {def.name}
                          </span>
                          <span className="font-mono-num text-[11px] text-[#e6b865] shrink-0">
                            Lv.{lv}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#9bb3a5]">
                          {CATEGORY_LABELS[def.category]} {eq ? '· Equipped' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right: Selected Weapon 6 Upgrade Categories */}
              <div className="lg:col-span-8 space-y-3">
                {weaponUnlocked ? (
                  <>
                    <div className="bg-[#0e1613] border border-[#2f473b] p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#13221d] border border-[#3e6150] flex items-center justify-center">
                          <WeaponArtwork
                            weaponId={selectedWeaponId}
                            level={weaponLevel}
                            className="w-10 h-10"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-bold text-[#f3efe2]">
                              {selectedWeaponDef.name}
                            </h3>
                            <span className="px-2 py-0.5 bg-[#20332b] border border-[#4a7562] font-mono-num text-xs font-bold text-[#e6b865]">
                              Lv.{weaponLevel}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono-num text-[#9fe6d9] mt-0.5">
                            {weaponPreview.damage} DMG · {weaponPreview.cooldown}s ·{' '}
                            {weaponPreview.range}px · {weaponPreview.critChancePct}% Crit
                          </div>
                        </div>
                      </div>
                      {equippedWeapon !== selectedWeaponId && (
                        <button
                          type="button"
                          onClick={() => {
                            onEquipWeapon(selectedWeaponId);
                            setNotice({ ok: true, text: `Equipped ${selectedWeaponDef.name}.` });
                          }}
                          className="px-3 py-1.5 text-xs font-bold uppercase bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0c1714] border border-[#99f6e4] cursor-pointer"
                        >
                          Equip
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {WEAPON_UPGRADE_CATEGORIES.map((cat) => {
                        const rank = weaponRanks[cat.stat];
                        const isMax = rank >= MAX_WEAPON_UPGRADE_RANK;
                        const check = canUpgradeWeaponStat(
                          selectedWeaponId,
                          cat.stat,
                          { unlockedWeapons, weaponUpgrades, gold },
                          inventory
                        );
                        const preview = formatStatPreview(selectedWeaponId, cat.stat, rank + 1);

                        return (
                          <div
                            key={cat.stat}
                            className="bg-[#0e1613] border border-[#2b4036] p-3 flex flex-col justify-between gap-2.5"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#f3efe2]">{cat.label}</span>
                                <span className="font-mono-num text-[11px] text-[#5eead4]">
                                  {isMax ? preview.now : `${preview.now} → ${preview.next}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1.5">
                                {Array.from({ length: MAX_WEAPON_UPGRADE_RANK }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`h-1.5 flex-1 ${
                                      i < rank ? 'bg-[#e5a84b]' : 'bg-[#213029]'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="text-[11px] text-[#9ab0a2] mt-1">{cat.shortDesc}</div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#1e2d26]">
                              {isMax ? (
                                <span className="text-[11px] font-bold uppercase text-[#5eead4]">
                                  Maxed Out
                                </span>
                              ) : (
                                <>
                                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono-num">
                                    <span
                                      className={
                                        gold >= check.goldCost ? 'text-[#fde047]' : 'text-[#f87171]'
                                      }
                                    >
                                      {check.goldCost}g
                                    </span>
                                    {Object.entries(check.cost).map(([itemId, qty]) => {
                                      const have = inventory[itemId as ItemId] ?? 0;
                                      return (
                                        <span
                                          key={itemId}
                                          className={
                                            have >= (qty ?? 0) ? 'text-[#b7d6c3]' : 'text-[#f87171]'
                                          }
                                        >
                                          {qty}{' '}
                                          {ITEM_CATALOG[itemId as ItemId].name.split(' ')[1] ??
                                            ITEM_CATALOG[itemId as ItemId].name}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  <button
                                    type="button"
                                    disabled={!check.ok}
                                    onClick={() => {
                                      const res = onUpgradeWeapon(selectedWeaponId, cat.stat);
                                      setNotice({ ok: res.ok, text: res.message });
                                    }}
                                    aria-label={`Upgrade ${selectedWeaponDef.name} ${cat.label}`}
                                    className={`px-2.5 py-1 text-[11px] font-bold uppercase shrink-0 ${
                                      check.ok
                                        ? 'bg-[#2a5946] hover:bg-[#357058] border border-[#6ee7b7] text-[#ecfdf5] cursor-pointer'
                                        : 'bg-[#17201c] border border-[#293830] text-[#667a6f] cursor-not-allowed'
                                    }`}
                                  >
                                    Upgrade
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="p-6 bg-[#0e1613] border border-[#2b4036] text-xs text-[#9ab0a2]">
                    Select a crafted weapon on the left to temper its stats.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 4: ARMOUR UPGRADES (Level 1 → Level 6 Tempering)        */}
          {/* =============================================================== */}
          {section === 'armour_upgrade' && (
            <div className="space-y-4">
              {unlockedArmour.length === 0 ? (
                <div className="p-6 bg-[#0e1613] border border-[#2b4036] text-center space-y-3">
                  <p className="text-sm font-semibold text-[#f3efe2]">No Armour Crafted Yet</p>
                  <p className="text-xs text-[#9ab0a2]">
                    Craft a defensive armour set in the Armour Crafting tab first, then return here
                    to reinforce its Defense and Max HP bonus.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSection('armour_craft')}
                    className="px-4 py-2 text-xs font-bold uppercase bg-[#e5a84b] hover:bg-[#f0b960] text-[#14120c] border border-[#f7cf86] cursor-pointer"
                  >
                    Go to Armour Crafting
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedArmour.map((aId) => {
                    const def = ARMOUR_CATALOG[aId];
                    const rank = armourUpgrades[aId] ?? 0;
                    const eff = getArmourEffectiveStats(aId, rank);
                    const nextEff = getArmourEffectiveStats(
                      aId,
                      Math.min(MAX_ARMOUR_UPGRADE_LEVEL, rank + 1)
                    );
                    const isMax = rank >= MAX_ARMOUR_UPGRADE_LEVEL;
                    const check = canUpgradeArmour(
                      aId,
                      { unlockedArmour, armourUpgrades, gold },
                      inventory
                    );
                    const eq = equippedArmour === aId;
                    const highlighted = selectedArmourId === aId;

                    return (
                      <div
                        key={aId}
                        onClick={() => setSelectedArmourId(aId)}
                        className={`p-4 border flex flex-col justify-between gap-3 ${
                          highlighted
                            ? 'bg-[#16272e] border-[#60a5fa]'
                            : 'bg-[#0e1613] border-[#2a3f35]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 shrink-0 bg-[#121f1a] border border-[#324a3e] flex items-center justify-center">
                            <ArmourArtwork armourId={aId} level={eff.level} className="w-12 h-12" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-sm font-bold text-[#f3efe2] truncate">
                                {def.name}
                              </h3>
                              <span className="px-2 py-0.5 bg-[#1e2f38] border border-[#4a7491] font-mono-num text-xs font-bold text-[#93c5fd] shrink-0">
                                Lv.{eff.level}/{MAX_ARMOUR_UPGRADE_LEVEL + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              {Array.from({ length: MAX_ARMOUR_UPGRADE_LEVEL }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`h-1.5 flex-1 ${
                                    i < rank ? 'bg-[#60a5fa]' : 'bg-[#213029]'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="mt-2 space-y-0.5 text-xs font-mono-num">
                              <div className="text-[#93c5fd]">
                                Defense:{' '}
                                {isMax ? `${eff.defense} DEF` : `${eff.defense} → ${nextEff.defense} DEF`}
                              </div>
                              <div className="text-[#86efac]">
                                Vitality:{' '}
                                {isMax
                                  ? `+${eff.maxHpBonus} Max HP`
                                  : `+${eff.maxHpBonus} → +${nextEff.maxHpBonus} Max HP`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {!isMax && (
                          <div className="bg-[#131d19] border border-[#293c33] p-2.5 flex flex-wrap gap-1.5 text-[11px] font-mono-num">
                            <span
                              className={`px-2 py-0.5 border ${
                                gold >= check.goldCost
                                  ? 'bg-[#1a281d] border-[#4c7246] text-[#fde047]'
                                  : 'bg-[#281616] border-[#6b3434] text-[#fca5a5]'
                              }`}
                            >
                              Gold: {gold}/{check.goldCost}
                            </span>
                            {Object.entries(check.cost).map(([itemId, qty]) => {
                              const have = inventory[itemId as ItemId] ?? 0;
                              const enough = have >= (qty ?? 0);
                              return (
                                <span
                                  key={itemId}
                                  className={`px-2 py-0.5 border ${
                                    enough
                                      ? 'bg-[#162821] border-[#3d6b57] text-[#a7f3d0]'
                                      : 'bg-[#281616] border-[#6b3434] text-[#fca5a5]'
                                  }`}
                                >
                                  {ITEM_CATALOG[itemId as ItemId].name}: {have}/{qty}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e2d26]">
                          <button
                            type="button"
                            disabled={eq}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEquipArmour(aId);
                              setNotice({ ok: true, text: `Equipped ${def.name}.` });
                            }}
                            className={`px-2.5 py-1.5 text-[11px] font-bold uppercase border ${
                              eq
                                ? 'bg-[#17303a] text-[#93c5fd] border-[#3b729c] cursor-default'
                                : 'bg-[#182822] hover:bg-[#22382f] text-[#cfe3d7] border-[#3a5749] cursor-pointer'
                            }`}
                          >
                            {eq ? 'Equipped' : 'Equip'}
                          </button>

                          {isMax ? (
                            <span className="text-xs font-bold uppercase text-[#5eead4]">
                              Max Tempered
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!check.ok}
                              onClick={(e) => {
                                e.stopPropagation();
                                const res = onUpgradeArmour(aId);
                                setNotice({ ok: res.ok, text: res.message });
                              }}
                              aria-label={`Upgrade ${def.name}`}
                              className={`px-3.5 py-1.5 text-xs font-bold uppercase border ${
                                check.ok
                                  ? 'bg-[#2a5946] hover:bg-[#357058] border-[#6ee7b7] text-[#ecfdf5] cursor-pointer'
                                  : 'bg-[#17201c] border-[#293830] text-[#667a6f] cursor-not-allowed'
                              }`}
                            >
                              Temper Armour
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


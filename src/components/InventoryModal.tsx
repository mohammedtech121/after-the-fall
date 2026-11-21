import React, { useState } from 'react';
import { CRAFTING_RECIPES, ITEM_CATALOG } from '../game/quests';
import { buildBackpackSlots, canCraftRecipe } from '../game/rules';
import { InventoryMap, ItemId, MAX_BACKPACK_SLOTS, UpgradeId } from '../game/types';
import { GoldCoinIcon, ItemSvgIcon, ShieldDefenseIcon } from './GameIcons';

interface InventoryModalProps {
  inventory: InventoryMap;
  gold: number;
  equippedArmourName: string;
  defense: number;
  upgrades: UpgradeId[];
  onUseItem: (itemId: ItemId) => string;
  onCraft: (recipeId: string) => string;
  onClose: () => void;
}

const UPGRADE_LABELS: Record<UpgradeId, string> = {
  arc_blade_mk2: 'Reinforced Arc-Blade (+14 DMG)',
  kinetic_boots: 'Kinetic Stride Boots (+22% Speed)',
  aegis_vest: 'Aegis Plated Vest (+45 Max HP)',
  energy_capacitor: 'Overclocked Capacitor (+40 Max Energy)',
  hazmat_filter: 'Wasteland Filter Mask (Toxic Immune)',
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  gold,
  equippedArmourName,
  defense,
  upgrades,
  onUseItem,
  onCraft,
  onClose,
}) => {
  const [tab, setTab] = useState<'items' | 'craft'>('items');
  const [selectedItem, setSelectedItem] = useState<ItemId>('scrap');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const slots = buildBackpackSlots(inventory);
  const usedSlots = slots.length;
  const freeSlots = Math.max(0, MAX_BACKPACK_SLOTS - usedSlots);
  const selectedDef = ITEM_CATALOG[selectedItem];
  const selectedQty = inventory[selectedItem] ?? 0;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Backpack and Field Crafting"
    >
      <div className="w-full max-w-3xl bg-[#121b17] border border-[#455e50] shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-[#18241f] border-b border-[#2b3b33]">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-display text-xl font-bold text-[#f3efe2]">Backpack &amp; Gear</h2>
            <div className="flex items-center gap-1 bg-[#0e1512] p-1 border border-[#2a3b32]">
              <button
                type="button"
                onClick={() => setTab('items')}
                className={`px-3 py-1 text-xs font-semibold cursor-pointer ${
                  tab === 'items' ? 'bg-[#2a453b] text-[#f4efe2]' : 'text-[#9ab0a2] hover:text-white'
                }`}
              >
                Backpack ({usedSlots}/{MAX_BACKPACK_SLOTS})
              </button>
              <button
                type="button"
                onClick={() => setTab('craft')}
                className={`px-3 py-1 text-xs font-semibold cursor-pointer ${
                  tab === 'craft' ? 'bg-[#2a453b] text-[#f4efe2]' : 'text-[#9ab0a2] hover:text-white'
                }`}
              >
                Field Gear ({CRAFTING_RECIPES.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#101815] border border-[#3a4f43] font-mono-num text-xs font-bold text-[#fde047]">
              <GoldCoinIcon className="w-3.5 h-3.5" />
              {gold} Gold
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
            >
              Close [I]
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {statusMsg && (
            <div className="mb-4 px-3.5 py-2 bg-[#1a2e28] border border-[#3d7a6c] text-xs font-medium text-[#8ef7ea]">
              {statusMsg}
            </div>
          )}

          {tab === 'items' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* 40-Slot Stacked Backpack Grid */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#a9bfb0] bg-[#0e1512] border border-[#26362e] px-3 py-2">
                  <span className="font-mono-num font-semibold text-[#f3efe2]">
                    Slots: {usedSlots}/{MAX_BACKPACK_SLOTS}
                  </span>
                  <span className="font-mono-num text-[#86efac]">{freeSlots} free</span>
                </div>

                {slots.length === 0 ? (
                  <div className="p-6 text-center bg-[#0f1714] border border-[#293830] text-xs text-[#95ab9d]">
                    Your 40-slot Backpack is empty. Scavenge crates, defeat rogue machines, or trade
                    with Haven merchants.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
                    {slots.map((slot) => {
                      const def = ITEM_CATALOG[slot.itemId];
                      const active = selectedItem === slot.itemId;
                      return (
                        <button
                          key={slot.slotKey}
                          type="button"
                          onClick={() => setSelectedItem(slot.itemId)}
                          className={`p-2.5 text-left border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1f332c] border-[#5eead4]'
                              : 'bg-[#16211c] hover:bg-[#1c2b25] border-[#2e4036]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <ItemSvgIcon itemId={slot.itemId} className="w-5 h-5" />
                            <span className="font-mono-num text-xs font-bold text-[#f3efe2]">
                              {slot.qty}/{slot.maxStack}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-[#e6ede8] truncate">
                            {def.name}
                          </div>
                          <div className="text-[10px] text-[#95ab9d] capitalize">
                            {def.category}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Item Inspector + Equipped Armour & Field Upgrades */}
              <div className="md:col-span-5 flex flex-col justify-between bg-[#0f1714] border border-[#293830] p-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <ItemSvgIcon itemId={selectedItem} className="w-8 h-8 shrink-0" />
                    <div>
                      <h3 className="font-display text-base font-bold text-[#f3efe2]">
                        {selectedDef.name}
                      </h3>
                      <p className="text-xs text-[#95ab9d] font-mono-num">
                        Total: {selectedQty} · Stack {selectedDef.maxStack} · {selectedDef.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-[#ccd7d0] mb-4">
                    {selectedDef.description}
                  </p>

                  {selectedDef.usable && (
                    <button
                      type="button"
                      disabled={selectedQty <= 0}
                      onClick={() => setStatusMsg(onUseItem(selectedItem))}
                      className={`w-full py-2 text-xs font-bold tracking-wide border transition-colors ${
                        selectedQty > 0
                          ? 'bg-[#4cd3c2] text-[#0d1714] border-[#8ff7ef] hover:bg-[#6ae3d4] cursor-pointer'
                          : 'bg-[#1a2420] text-[#6d8075] border-[#293830] cursor-not-allowed'
                      }`}
                    >
                      Use {selectedDef.name}
                    </button>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#24332b] space-y-3">
                  <div className="bg-[#14201b] border border-[#2d4238] px-3 py-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[#cfe3d7] font-semibold">
                      <ShieldDefenseIcon className="w-3.5 h-3.5" />
                      {equippedArmourName}
                    </span>
                    <span className="font-mono-num font-bold text-[#60a5fa]">DEF {defense}</span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[#e6b865] mb-1.5">
                      Installed Field Gear ({upgrades.length}/5)
                    </div>
                    {upgrades.length === 0 ? (
                      <p className="text-xs text-[#83998c]">
                        No field gear crafted yet. Craft Arc-Device gear here or visit Blacksmith
                        Bram for Weapons &amp; Armour.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-xs text-[#cfe3d7]">
                        {upgrades.map((u) => (
                          <li key={u}>• {UPGRADE_LABELS[u]}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {CRAFTING_RECIPES.map((recipe) => {
                const owned =
                  recipe.resultType === 'upgrade' &&
                  recipe.resultUpgradeId !== undefined &&
                  upgrades.includes(recipe.resultUpgradeId);
                const craftable = canCraftRecipe(recipe, inventory, upgrades);
                return (
                  <div
                    key={recipe.id}
                    className="p-3.5 bg-[#15201b] border border-[#2d3f36] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-[#f3efe2]">
                          {recipe.name}
                        </span>
                        <span className="text-[11px] text-[#9eb5a6]">
                          · {recipe.resultType === 'upgrade' ? 'Permanent Upgrade' : 'Consumable'}
                        </span>
                      </div>
                      <p className="text-xs text-[#bfd0c5] mt-0.5">{recipe.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono-num">
                        {Object.entries(recipe.ingredients).map(([k, qty]) => {
                          const have = inventory[k as ItemId] ?? 0;
                          const enough = have >= (qty ?? 0);
                          return (
                            <span
                              key={k}
                              className={enough ? 'text-[#86efac]' : 'text-[#f87171]'}
                            >
                              {ITEM_CATALOG[k as ItemId].name}: {have}/{qty}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={owned || !craftable}
                      onClick={() => setStatusMsg(onCraft(recipe.id))}
                      className={`px-4 py-2 text-xs font-bold shrink-0 border transition-colors ${
                        owned
                          ? 'bg-[#1a2b25] text-[#5eead4] border-[#335c52] cursor-default'
                          : craftable
                            ? 'bg-[#e5a84b] text-[#141712] border-[#f7cf86] hover:bg-[#f0b960] cursor-pointer'
                            : 'bg-[#1a2420] text-[#6d8075] border-[#2b3831] cursor-not-allowed'
                      }`}
                    >
                      {owned ? 'Installed' : 'Craft'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


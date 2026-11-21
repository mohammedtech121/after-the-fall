import React, { useState } from 'react';
import { Hammer, Lock, Sparkles } from 'lucide-react';
import { ITEM_CATALOG } from '../game/quests';
import { InventoryMap, NpcEntity, QuestState, TradeOffer } from '../game/types';
import { GoldCoinIcon, ItemSvgIcon } from './GameIcons';

interface DialogueModalProps {
  npc: NpcEntity;
  inventory: InventoryMap;
  gold: number;
  quests: QuestState[];
  regionRestored: boolean;
  blacksmithUnlocked: boolean;
  onTrade: (offer: TradeOffer) => string;
  onReturnBlacksmithHammer?: () => { ok: boolean; message: string };
  onOpenBlacksmithWorkshop?: () => void;
  onOpenJournal: () => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  inventory,
  gold,
  quests,
  regionRestored,
  blacksmithUnlocked,
  onTrade,
  onReturnBlacksmithHammer,
  onOpenBlacksmithWorkshop,
  onOpenJournal,
  onClose,
}) => {
  const [loreIdx, setLoreIdx] = useState(0);
  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null);

  const isBlacksmith = npc.id === 'npc_bram' || npc.role === 'Blacksmith';
  const hasHammer = (inventory.blacksmith_hammer ?? 0) > 0;
  const mainLine = isBlacksmith
    ? blacksmithUnlocked
      ? npc.restoredGreeting
      : hasHammer
        ? "Wait—is that my Forging Hammer?! You braved Haven Comm Ridge and brought it back! Hand it over and I'll light the forge right now."
        : npc.greeting
    : regionRestored
      ? npc.restoredGreeting
      : npc.greeting;

  const relatedQuests = quests.filter(
    (q) => npc.questIds.includes(q.id) && q.status !== 'locked'
  );

  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Dialogue with ${npc.name}`}
    >
      <div className="w-full max-w-xl bg-[#121b17] border border-[#4a6355] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header with Pixel-Art Portrait SVG */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#18241f] border-b border-[#2c3d34]">
          <div className="flex items-center gap-3.5">
            <svg viewBox="0 0 24 24" className="w-12 h-12 bg-[#0d1411] border border-[#3a4f44] shrink-0">
              <rect x="6" y="13" width="12" height="10" fill={npc.palette.coat} />
              <rect x="7" y="14" width="10" height="3" fill={npc.palette.accent} />
              <rect x="7" y="5" width="10" height="8" fill={npc.palette.skin} />
              <rect x="6" y="3" width="12" height="4" fill={npc.palette.hair} />
              {npc.role === 'Construct' ? (
                <rect x="8" y="8" width="8" height="2.5" fill="#6ef2e2" />
              ) : (
                <>
                  <rect x="9" y="8" width="2" height="2" fill="#141816" />
                  <rect x="13" y="8" width="2" height="2" fill="#141816" />
                </>
              )}
            </svg>
            <div>
              <h2 className="font-display text-lg font-bold text-[#f4efe2]">{npc.name}</h2>
              <p className="text-xs text-[#a9bfb0]">{npc.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
          >
            Leave [Esc]
          </button>
        </div>

        {/* Story Dialogue */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-[15px] leading-relaxed text-[#eceae0]">{mainLine}</p>

          {/* Blacksmith Bram Workshop Quest / Access Panel */}
          {isBlacksmith && (
            <div className="bg-[#0e1612] border border-[#4a5c44] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-[#f5be4f]">
                  <Hammer className="w-3.5 h-3.5" />
                  {blacksmithUnlocked ? "Bram's Blacksmith Workshop" : 'Workshop Status: Locked'}
                </span>
                {!blacksmithUnlocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[#f87171]">
                    <Lock className="w-3 h-3" /> Hammer Missing
                  </span>
                )}
              </div>

              {blacksmithUnlocked ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <p className="text-xs text-[#b7cabf]">
                    Craft Swords, Axes, Bows, and Armour, or upgrade your gear permanently.
                  </p>
                  {onOpenBlacksmithWorkshop && (
                    <button
                      type="button"
                      onClick={onOpenBlacksmithWorkshop}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#e5a84b] hover:bg-[#f0b960] text-[#14120c] border border-[#f7cf86] cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      Open Blacksmith Workshop
                    </button>
                  )}
                </div>
              ) : hasHammer ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#a7f3d0]">
                    <ItemSvgIcon itemId="blacksmith_hammer" className="w-4 h-4 shrink-0" />
                    <span>Bram&apos;s Forging Hammer recovered! Ready to turn in.</span>
                  </div>
                  {onReturnBlacksmithHammer && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = onReturnBlacksmithHammer();
                        setTradeFeedback(res.message);
                      }}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0c1714] border border-[#99f6e4] cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Return Forging Hammer
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#c7d6cc]">
                  Objective: Head north out of Haven Plaza onto{' '}
                  <span className="text-[#fde047] font-semibold">Haven Comm Ridge</span> to recover
                  Bram&apos;s Forging Hammer, then bring it back here to unlock crafting &amp;
                  upgrades.
                </p>
              )}

              {tradeFeedback && isBlacksmith && (
                <div className="text-xs font-semibold text-[#5eead4]">{tradeFeedback}</div>
              )}
            </div>
          )}

          {npc.loreLines.length > 0 && (
            <div className="pt-3 border-t border-[#26362e]">
              <p className="text-xs text-[#9fb8a8] mb-2">{npc.loreLines[loreIdx]}</p>
              {npc.loreLines.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLoreIdx((i) => (i + 1) % npc.loreLines.length)}
                  className="text-xs font-semibold text-[#5eead4] hover:underline cursor-pointer"
                >
                  Ask more about the valley →
                </button>
              )}
            </div>
          )}

          {/* Related Survivor Missions */}
          {relatedQuests.length > 0 && (
            <div className="pt-3 border-t border-[#26362e] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#e6b865]">
                  Survivor Missions
                </h3>
                <button
                  type="button"
                  onClick={onOpenJournal}
                  className="text-[11px] font-semibold text-[#5eead4] hover:underline cursor-pointer"
                >
                  Open Journal →
                </button>
              </div>
              <div className="space-y-1.5">
                {relatedQuests.map((q) => {
                  const nextObj = q.objectives.find((o) => o.current < o.required);
                  const doneCount = q.objectives.filter((o) => o.current >= o.required).length;
                  return (
                    <div
                      key={q.id}
                      className="bg-[#0e1612] border border-[#293d33] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#f1eee4] truncate">{q.title}</div>
                        <div className="text-[11px] text-[#9eb5a6] truncate">
                          {q.status === 'completed'
                            ? 'Mission completed — thank you!'
                            : `${nextObj?.label ?? q.summary} (${doneCount}/${q.objectives.length})`}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-mono-num font-bold uppercase ${
                          q.status === 'completed' ? 'text-[#5eead4]' : 'text-[#fde047]'
                        }`}
                      >
                        {q.status === 'completed' ? 'DONE' : 'ACTIVE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Trader Exchange Section */}
          {npc.trades && npc.trades.length > 0 && (
            <div className="pt-4 border-t border-[#26362e]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-sm font-bold text-[#e6b865]">Supply Exchange</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-mono-num font-bold text-[#fde047]">
                    <GoldCoinIcon className="w-3.5 h-3.5" />
                    {gold} Gold
                  </span>
                </div>
                {tradeFeedback && <span className="text-xs text-[#5eead4]">{tradeFeedback}</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {npc.trades.map((offer) => {
                  const hasGold = offer.giveGold ? gold >= offer.giveGold : true;
                  const hasItems =
                    offer.giveItem && offer.giveQty
                      ? (inventory[offer.giveItem] ?? 0) >= offer.giveQty
                      : true;
                  const canAfford = hasGold && hasItems;

                  const costParts: string[] = [];
                  if (offer.giveGold) costParts.push(`${offer.giveGold} Gold`);
                  if (offer.giveItem && offer.giveQty) {
                    costParts.push(`${offer.giveQty} ${ITEM_CATALOG[offer.giveItem].name}`);
                  }

                  return (
                    <button
                      key={offer.id}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => setTradeFeedback(onTrade(offer))}
                      className={`p-2.5 text-left border transition-colors flex items-center justify-between gap-2 ${
                        canAfford
                          ? 'bg-[#182620] hover:bg-[#21362d] border-[#3d594b] cursor-pointer'
                          : 'bg-[#121916] border-[#24302a] opacity-55 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {offer.receiveItem ? (
                          <ItemSvgIcon itemId={offer.receiveItem} className="w-4 h-4 shrink-0" />
                        ) : (
                          <GoldCoinIcon className="w-4 h-4 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#f1eee4] truncate">
                            {offer.label}
                          </div>
                          <div className="text-[11px] font-mono-num text-[#a9bfb0]">
                            Cost: {costParts.join(' + ')}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#5eead4] shrink-0">Trade</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


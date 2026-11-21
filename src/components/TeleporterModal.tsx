import React, { useState } from 'react';
import { Compass, Home, Save, Sparkles, Zap } from 'lucide-react';
import { ITEM_CATALOG, REGION_META } from '../game/quests';
import { canActivateTeleporter } from '../game/rules';
import {
  InventoryMap,
  ItemId,
  SaveSlotId,
  SaveSlotMeta,
  TeleporterId,
  TeleporterStation,
} from '../game/types';
import { RegionThumbnailSvg } from './WeaponArtwork';

interface TeleporterModalProps {
  station: TeleporterStation;
  inventory: InventoryMap;
  playerEnergy: number;
  coreGateUnlocked: boolean;
  havenActivated: boolean;
  saveSlots: SaveSlotMeta[];
  onActivate: (id: TeleporterId) => { ok: boolean; message: string };
  onOpenWorldTravel: () => void;
  onReturnToHaven: () => { ok: boolean; message: string };
  onSaveToSlot: (slotId: SaveSlotId) => boolean;
  onClose: () => void;
}

const MANUAL_SLOTS: { id: SaveSlotId; label: string }[] = [
  { id: 'slot_1', label: 'Save Slot 1' },
  { id: 'slot_2', label: 'Save Slot 2' },
  { id: 'slot_3', label: 'Save Slot 3' },
];

export const TeleporterModal: React.FC<TeleporterModalProps> = ({
  station,
  inventory,
  playerEnergy,
  coreGateUnlocked,
  havenActivated,
  saveSlots,
  onActivate,
  onOpenWorldTravel,
  onReturnToHaven,
  onSaveToSlot,
  onClose,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSaveSlots, setShowSaveSlots] = useState(false);

  const regionInfo = REGION_META[station.region];
  const activationCheck = canActivateTeleporter(
    station,
    inventory,
    playerEnergy,
    coreGateUnlocked
  );

  const handleActivate = () => {
    const res = onActivate(station.id);
    setFeedback(res.message);
  };

  const handleSaveSlot = (slotId: SaveSlotId, label: string) => {
    const ok = onSaveToSlot(slotId);
    setFeedback(ok ? `Progress saved to ${label}.` : 'Could not save to browser storage.');
  };

  const handleReturnHaven = () => {
    const res = onReturnToHaven();
    if (!res.ok) {
      setFeedback(res.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${station.name} Teleporter Station`}
    >
      <div className="w-full max-w-xl bg-[#111a17] border border-[#426152] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#17241f] border-b border-[#2b3f35]">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 inline-block"
                style={{ backgroundColor: station.activated ? station.accentColor : '#64748b' }}
              />
              <h2 className="font-display text-xl font-bold text-[#f3efe2]">{station.name}</h2>
            </div>
            <p className="text-xs text-[#9cb5a7] mt-0.5">
              {regionInfo.name} ·{' '}
              <span className={station.activated ? 'text-[#5eead4] font-semibold' : 'text-[#f5be4f]'}>
                {station.activated ? 'Gateway Online' : 'Dormant Gateway'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Regional Artwork Banner */}
          <div className="relative border border-[#2d4539] overflow-hidden bg-[#0b120f]">
            <RegionThumbnailSvg
              region={station.region}
              activated={station.activated}
              className="w-full h-28 object-cover block"
            />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#0c1411]/90 border border-[#355244] font-mono-num text-[11px] text-[#dce8e1]">
              {regionInfo.danger}
            </div>
          </div>

          <p className="text-sm text-[#cddad1] leading-relaxed">{station.description}</p>

          {feedback && (
            <div className="px-3.5 py-2 bg-[#162922] border border-[#4cd3c2] text-xs font-medium text-[#b5f7ee]">
              {feedback}
            </div>
          )}

          {!station.activated ? (
            /* DORMANT STATE: Inspect & Activate */
            <div className="bg-[#0d1512] border border-[#2c4237] p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#e6b865]">
                Activation Requirements
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(station.activationCost).map(([itemId, qty]) => {
                  const have = inventory[itemId as ItemId] ?? 0;
                  const enough = have >= (qty ?? 0);
                  return (
                    <span
                      key={itemId}
                      className={`px-2.5 py-1 border font-mono-num ${
                        enough
                          ? 'bg-[#162821] border-[#3d6b57] text-[#a7f3d0]'
                          : 'bg-[#261616] border-[#6b3434] text-[#fca5a5]'
                      }`}
                    >
                      {ITEM_CATALOG[itemId as ItemId].name}: {have}/{qty}
                    </span>
                  );
                })}
                <span
                  className={`px-2.5 py-1 border font-mono-num inline-flex items-center gap-1 ${
                    playerEnergy >= station.energyCost
                      ? 'bg-[#13292b] border-[#2e6b6b] text-[#99f6e4]'
                      : 'bg-[#261616] border-[#6b3434] text-[#fca5a5]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {Math.round(playerEnergy)}/{station.energyCost} Energy
                </span>
              </div>
              {!activationCheck.ok && activationCheck.reason && (
                <p className="text-xs text-[#f87171]">{activationCheck.reason}</p>
              )}
              <button
                type="button"
                disabled={!activationCheck.ok}
                onClick={handleActivate}
                className={`w-full py-2.5 px-4 font-display text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-colors ${
                  activationCheck.ok
                    ? 'bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0b1613] border border-[#99f6e4] cursor-pointer'
                    : 'bg-[#1a2420] text-[#6d8276] border border-[#2c3b34] cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Activate {station.name}</span>
              </button>
            </div>
          ) : (
            /* ACTIVATED STATE: Travel · Save Game · Return to Haven · Close */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onOpenWorldTravel}
                  className="py-3 px-4 font-display text-sm font-bold text-[#0b1613] bg-[#4cd3c2] hover:bg-[#6ae3d4] border border-[#99f6e4] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>World Travel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveSlots((s) => !s)}
                  className="py-3 px-4 font-display text-sm font-bold text-[#141712] bg-[#e5a84b] hover:bg-[#f0b960] border border-[#f7cf86] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Game</span>
                </button>
              </div>

              {showSaveSlots && (
                <div className="bg-[#0d1512] border border-[#2f473b] p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9db8a9]">
                    Choose Save Slot
                  </div>
                  {MANUAL_SLOTS.map((slot) => {
                    const existing = saveSlots.find((s) => s.slotId === slot.id);
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between gap-3 bg-[#15211c] border border-[#2b4036] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#f3efe2]">{slot.label}</div>
                          <div className="text-[11px] text-[#9ab0a2] truncate">
                            {existing
                              ? `${existing.regionName} · Lv.${existing.level} · ${existing.weaponName} Lv.${existing.weaponLevel}`
                              : 'Empty Slot'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveSlot(slot.id, slot.label)}
                          className="px-3 py-1.5 text-xs font-bold bg-[#285242] hover:bg-[#346954] border border-[#6ee7b7] text-[#ecfdf5] shrink-0 cursor-pointer"
                        >
                          {existing ? 'Overwrite' : 'Save Here'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {station.id !== 'tp_haven' && (
                  <button
                    type="button"
                    disabled={!havenActivated}
                    onClick={handleReturnHaven}
                    className={`py-2.5 px-4 text-xs font-bold border flex items-center justify-center gap-2 ${
                      havenActivated
                        ? 'bg-[#1a2b24] hover:bg-[#233a30] border-[#4d7562] text-[#e6f2ec] cursor-pointer'
                        : 'bg-[#151d1a] border-[#293630] text-[#6d8276] cursor-not-allowed'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>
                      {havenActivated ? 'Return to The Last Haven' : 'Haven Gateway Not Active'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className={`py-2.5 px-4 text-xs font-semibold bg-[#18221e] hover:bg-[#22302a] border border-[#354b40] text-[#cbd7cf] cursor-pointer ${
                    station.id === 'tp_haven' ? 'sm:col-span-2' : ''
                  }`}
                >
                  Close Station
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

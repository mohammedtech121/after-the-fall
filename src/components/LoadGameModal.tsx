import React, { useState } from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';
import { SaveSlotId, SaveSlotMeta } from '../game/types';
import { WeaponArtwork } from './WeaponArtwork';

interface LoadGameModalProps {
  slots: SaveSlotMeta[];
  onLoadSlot: (slotId: SaveSlotId) => void;
  onDeleteSlot: (slotId: SaveSlotId) => void;
  onClose: () => void;
}

const ALL_SLOT_ORDER: { id: SaveSlotId; defaultLabel: string }[] = [
  { id: 'autosave', defaultLabel: 'Autosave' },
  { id: 'slot_1', defaultLabel: 'Save Slot 1' },
  { id: 'slot_2', defaultLabel: 'Save Slot 2' },
  { id: 'slot_3', defaultLabel: 'Save Slot 3' },
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatSavedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Saved';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const LoadGameModal: React.FC<LoadGameModalProps> = ({
  slots,
  onLoadSlot,
  onDeleteSlot,
  onClose,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<SaveSlotId | null>(null);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/78 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Load Saved Game"
    >
      <div className="w-full max-w-2xl bg-[#111a17] border border-[#426152] shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#17241f] border-b border-[#2b3f35]">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#5eead4]" />
            <h2 className="font-display text-xl font-bold text-[#f3efe2]">Load Game</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Save Slots List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {ALL_SLOT_ORDER.map(({ id, defaultLabel }) => {
            const meta = slots.find((s) => s.slotId === id);
            return (
              <div
                key={id}
                className={`border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  meta
                    ? 'bg-[#15211c] border-[#385747]'
                    : 'bg-[#0e1512] border-[#23322b] opacity-75'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {meta ? (
                    <div className="w-12 h-12 shrink-0 bg-[#0c1411] border border-[#2c4538] flex items-center justify-center">
                      <WeaponArtwork
                        weaponId={meta.weaponId}
                        level={meta.weaponLevel}
                        className="w-10 h-10"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 shrink-0 bg-[#0b110e] border border-[#223029] flex items-center justify-center text-[#51675b] text-xs font-mono-num">
                      --
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-[#f3efe2]">
                        {meta?.label ?? defaultLabel}
                      </span>
                      {meta?.isAutosave && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-[#133834] border border-[#4cd3c2] text-[#99f6e4]">
                          Auto
                        </span>
                      )}
                      {meta && (
                        <span className="text-[11px] text-[#8fa799]">
                          {formatSavedDate(meta.savedAt)}
                        </span>
                      )}
                    </div>

                    {meta ? (
                      <div className="text-xs text-[#c2d4c8] mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                        <span className="text-[#e6b865] font-semibold">{meta.regionName}</span>
                        <span>Lv.{meta.level}</span>
                        <span>
                          {meta.weaponName} Lv.{meta.weaponLevel}
                        </span>
                        <span className="text-[#5eead4]">
                          {meta.activatedTeleportersCount}/5 Gates
                        </span>
                        <span>{meta.restoredCount} Relays</span>
                        <span className="font-mono-num text-[#9ab0a2]">
                          {formatDuration(meta.timePlayedSec)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-[#6f8578] mt-1">No save data stored</div>
                    )}
                  </div>
                </div>

                {meta && (
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmDelete === id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSlot(id);
                            setConfirmDelete(null);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold bg-[#7f1d1d] hover:bg-[#991b1b] border border-[#f87171] text-white cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="px-2.5 py-1.5 text-xs text-[#c9d6cd] bg-[#1c2823] border border-[#354b40] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onLoadSlot(id)}
                          aria-label={`Load ${meta.label}`}
                          className="px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0b1613] border border-[#99f6e4] cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(id)}
                          aria-label={`Delete ${meta.label}`}
                          className="p-1.5 bg-[#231818] hover:bg-[#362222] border border-[#5a3232] text-[#f87171] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

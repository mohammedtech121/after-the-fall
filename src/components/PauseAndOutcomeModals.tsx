import React, { useState } from 'react';
import { GameSettings, SaveSlotId, SaveSlotMeta, WorldStats } from '../game/types';
import { LoadGameModal } from './LoadGameModal';
import { SettingsModal } from './SettingsModal';

interface PauseModalProps {
  settings: GameSettings;
  effectiveControlMode: 'desktop' | 'mobile';
  saveSlots: SaveSlotMeta[];
  onResume: () => void;
  onSaveSlot: (slotId: SaveSlotId) => boolean;
  onLoadSlot: (slotId: SaveSlotId) => void;
  onDeleteSlot: (slotId: SaveSlotId) => void;
  onOpenInventory: () => void;
  onOpenTutorial: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  settings,
  effectiveControlMode,
  saveSlots,
  onResume,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  onOpenInventory,
  onOpenTutorial,
  onUpdateSettings,
  onMainMenu,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  if (showSettings) {
    return (
      <SettingsModal
        settings={settings}
        effectiveControlMode={effectiveControlMode}
        onUpdateSettings={onUpdateSettings}
        onOpenTutorial={() => {
          setShowSettings(false);
          onOpenTutorial();
        }}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  if (showLoad) {
    return (
      <LoadGameModal
        slots={saveSlots}
        onLoadSlot={(slotId) => {
          setShowLoad(false);
          onLoadSlot(slotId);
        }}
        onDeleteSlot={onDeleteSlot}
        onClose={() => setShowLoad(false)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
    >
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#121b17] border border-[#455e50] p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#293830]">
          <h2 className="font-display text-2xl font-bold text-[#f3efe2]">Paused</h2>
        </div>

        {saveNotice && (
          <div className="mb-3 px-3 py-2 bg-[#162922] border border-[#4cd3c2] text-xs font-semibold text-[#99f6e4]">
            {saveNotice}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 px-4 font-display text-sm font-bold text-[#111512] bg-[#e5a84b] hover:bg-[#f0b960] border border-[#f7cf86] cursor-pointer"
          >
            Resume Adventure
          </button>
          <button
            type="button"
            onClick={() => setShowSavePicker((v) => !v)}
            className="w-full py-2.5 px-4 font-display text-sm font-bold text-[#0d1714] bg-[#4cd3c2] hover:bg-[#6ae3d4] border border-[#8ff7ef] cursor-pointer"
          >
            Save Game
          </button>

          {showSavePicker && (
            <div className="bg-[#0d1512] border border-[#2f473b] p-2.5 space-y-1.5">
              {(['slot_1', 'slot_2', 'slot_3'] as SaveSlotId[]).map((slotId, idx) => {
                const existing = saveSlots.find((s) => s.slotId === slotId);
                return (
                  <button
                    key={slotId}
                    type="button"
                    onClick={() => {
                      const ok = onSaveSlot(slotId);
                      setSaveNotice(ok ? `Saved to Save Slot ${idx + 1}.` : 'Save failed.');
                      setShowSavePicker(false);
                    }}
                    className="w-full px-3 py-1.5 text-left bg-[#16231e] hover:bg-[#1f332c] border border-[#314c3f] text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-bold text-[#f3efe2]">Save Slot {idx + 1}</span>
                    <span className="text-[11px] text-[#9eb5a6]">
                      {existing ? `${existing.regionName} · Lv.${existing.level}` : 'Empty'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {saveSlots.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLoad(true)}
              className="w-full py-2.5 px-4 text-sm font-semibold text-[#e6ede8] bg-[#1a2621] hover:bg-[#23332c] border border-[#384e43] cursor-pointer"
            >
              Load Game
            </button>
          )}

          <button
            type="button"
            onClick={onOpenInventory}
            className="w-full py-2.5 px-4 text-sm font-semibold text-[#e6ede8] bg-[#1a2621] hover:bg-[#23332c] border border-[#384e43] cursor-pointer"
          >
            Inventory &amp; Crafting
          </button>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="w-full py-2.5 px-4 text-sm font-semibold text-[#e6ede8] bg-[#1a2621] hover:bg-[#23332c] border border-[#384e43] cursor-pointer"
          >
            How to Play
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-full py-2.5 px-4 text-sm font-semibold text-[#e6ede8] bg-[#1a2621] hover:bg-[#23332c] border border-[#384e43] cursor-pointer"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-2.5 px-4 text-sm font-semibold text-[#e5a3a3] bg-[#241919] hover:bg-[#332222] border border-[#593333] cursor-pointer mt-2"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface OutcomeModalProps {
  victory: boolean;
  stats: WorldStats;
  hasSave: boolean;
  respawnCheckpointName?: string;
  onRespawn: () => void;
  onRestart: () => void;
  onLoadSave: () => void;
  onContinueExploring: () => void;
  onMainMenu: () => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  victory,
  stats,
  hasSave,
  respawnCheckpointName = 'The Last Haven (Safe Camp)',
  onRespawn,
  onRestart,
  onLoadSave,
  onContinueExploring,
  onMainMenu,
}) => {
  const mins = Math.floor(stats.timePlayedSec / 60);
  const secs = Math.floor(stats.timePlayedSec % 60);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={victory ? 'World Restored Victory' : 'Survivor Defeated'}
    >
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-[#121b17] border border-[#4a6958] p-5 sm:p-7 shadow-2xl text-center">
        <h2
          className={`font-display text-2xl sm:text-3xl font-bold ${
            victory ? 'text-[#5eead4]' : 'text-[#f87171]'
          }`}
        >
          {victory ? 'The World Bounced Back' : 'Fallen in the Valley'}
        </h2>
        <p className="text-xs sm:text-sm text-[#cbd8cf] mt-2 leading-relaxed">
          {victory
            ? 'The World Core pulses with renewed light across all five regions. Civilization is rising again.'
            : 'Your Arc-Device overloaded, pulling you back to safety. All quests, Gold, crafted gear, unlocked regions, and defeated bosses remain preserved.'}
        </p>

        {!victory && (
          <div className="mt-3 px-3 py-2 bg-[#0d1613] border border-[#2f4b40] text-xs text-[#99f6e4] flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[#9eb5a6] uppercase tracking-wider font-mono-num text-[10px]">
              Respawn Checkpoint:
            </span>
            <span className="font-display font-bold text-[#f3efe2]">{respawnCheckpointName}</span>
          </div>
        )}

        {/* Mastery Stat Tiles */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 my-4 sm:my-6">
          <div className="bg-[#0e1512] border border-[#293830] p-2.5 sm:p-3">
            <div className="font-mono-num text-lg sm:text-xl font-bold text-[#5eead4]">
              {stats.nodesRestored}/{stats.totalNodes}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9eb5a6] mt-0.5">Relays Restored</div>
          </div>
          <div className="bg-[#0e1512] border border-[#293830] p-2.5 sm:p-3">
            <div className="font-mono-num text-lg sm:text-xl font-bold text-[#e6b865]">
              {stats.landmarksDiscovered}/{stats.totalLandmarks}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9eb5a6] mt-0.5">Landmarks Found</div>
          </div>
          <div className="bg-[#0e1512] border border-[#293830] p-2.5 sm:p-3">
            <div className="font-mono-num text-lg sm:text-xl font-bold text-[#f3efe2]">
              {mins}:{String(secs).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9eb5a6] mt-0.5">Journey Time</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 justify-center">
          {victory ? (
            <>
              <button
                type="button"
                onClick={onContinueExploring}
                className="px-5 py-2.5 font-display text-sm font-bold text-[#0d1714] bg-[#4cd3c2] hover:bg-[#6ae3d4] border border-[#8ff7ef] cursor-pointer"
              >
                Continue Exploring
              </button>
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="px-5 py-2.5 font-display text-sm font-bold text-[#141712] bg-[#e5a84b] hover:bg-[#f0b960] border border-[#f7cf86] cursor-pointer"
              >
                New Journey
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                data-testid="respawn-btn"
                onClick={onRespawn}
                className="px-5 py-2.5 font-display text-sm font-bold text-[#0d1714] bg-[#4cd3c2] hover:bg-[#6ae3d4] border border-[#8ff7ef] cursor-pointer"
              >
                Respawn at Checkpoint
              </button>
              {hasSave && (
                <button
                  type="button"
                  onClick={onLoadSave}
                  className="px-4 py-2.5 text-sm font-semibold text-[#e6ede8] bg-[#1a2621] hover:bg-[#24342d] border border-[#3a5044] cursor-pointer"
                >
                  Load Saved Slot
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onMainMenu}
            className="px-5 py-2.5 text-sm font-semibold text-[#d4ded7] bg-[#1a2621] hover:bg-[#24342d] border border-[#3a5044] cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

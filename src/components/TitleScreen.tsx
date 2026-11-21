import React, { useState } from 'react';
import { ActiveOverlay, GameSettings, SaveSlotId, SaveSlotMeta } from '../game/types';
import { LoadGameModal } from './LoadGameModal';
import { SettingsModal } from './SettingsModal';

interface TitleScreenProps {
  hasSave: boolean;
  saveSlots: SaveSlotMeta[];
  overlay: ActiveOverlay;
  settings: GameSettings;
  effectiveControlMode: 'desktop' | 'mobile';
  onNewGame: () => void;
  onContinue: () => void;
  onLoadSlot: (slotId: SaveSlotId) => void;
  onDeleteSlot: (slotId: SaveSlotId) => void;
  onOpenOverlay: (overlay: ActiveOverlay) => void;
  onOpenTutorial: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSave,
  saveSlots,
  overlay,
  settings,
  effectiveControlMode,
  onNewGame,
  onContinue,
  onLoadSlot,
  onDeleteSlot,
  onOpenOverlay,
  onOpenTutorial,
  onUpdateSettings,
}) => {
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const latestSave = saveSlots[0] ?? null;

  const handleNewGameClick = () => {
    if (hasSave) {
      setConfirmNewGame(true);
    } else {
      onNewGame();
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none">
      {/* Asymmetric calm dark negative-space scrim on left third so live pixel world shines on right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(100deg, rgba(10, 15, 13, 0.94) 0%, rgba(12, 18, 15, 0.84) 38%, rgba(12, 18, 15, 0.28) 72%, rgba(10, 15, 13, 0.14) 100%)',
        }}
      />

      {/* Main Left-Third Title Lockup & Menu Actions */}
      <div className="relative z-10 flex-1 flex items-center px-8 sm:px-14 lg:px-20">
        <div className="max-w-lg w-full pointer-events-auto">
          {/* Bespoke Inline SVG Title Emblem Lockup */}
          <svg
            viewBox="0 0 460 156"
            className="w-full max-w-[440px] h-auto mb-5 drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]"
            role="img"
            aria-label="Bounce Back: After the Fall"
          >
            {/* Weathered Arc-Core Crest */}
            <g transform="translate(8, 16)">
              <polygon
                points="28,2 54,28 28,54 2,28"
                fill="#132422"
                stroke="#4cd3c2"
                strokeWidth="2.5"
              />
              <polygon points="28,11 43,28 28,45 13,28" fill="#299c92" />
              <polygon points="28,17 36,28 28,39 20,28" fill="#a7fff4" />
              <path d="M28 0v-9M23 -4l5-5 5 5" stroke="#f5be4f" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Primary Display Wordmark */}
            <text
              x="76"
              y="56"
              fill="#f7f4e8"
              stroke="#0d1411"
              strokeWidth="4"
              paintOrder="stroke fill"
              fontFamily="'Chakra Petch', sans-serif"
              fontWeight="700"
              fontSize="48"
              letterSpacing="1.5"
            >
              BOUNCE BACK
            </text>

            <line x1="78" y1="74" x2="432" y2="74" stroke="#4cd3c2" strokeOpacity="0.45" strokeWidth="1.5" />
            <polygon points="78,74 84,69 90,74 84,79" fill="#f5be4f" />

            <text
              x="100"
              y="102"
              fill="#e6b865"
              stroke="#0d1411"
              strokeWidth="3"
              paintOrder="stroke fill"
              fontFamily="'Chakra Petch', sans-serif"
              fontWeight="600"
              fontSize="22"
              letterSpacing="5.5"
            >
              AFTER THE FALL
            </text>

            <text
              x="12"
              y="142"
              fill="#d2ded6"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontWeight="500"
              fontSize="14.5"
              letterSpacing="0.5"
            >
              The world fell. You can make it rise again.
            </text>
          </svg>

          {/* Primary Menu Buttons */}
          <div className="flex flex-col items-start gap-2.5 mt-2">
            {hasSave && (
              <button
                type="button"
                onClick={onContinue}
                className="w-72 px-5 py-3 text-left font-display text-base font-bold tracking-wide text-[#0d1714] bg-[#4cd3c2] hover:bg-[#6ae3d4] active:scale-[0.99] transition-all border border-[#8ff7ef] shadow-[0_6px_20px_rgba(76,211,194,0.28)] cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="leading-tight">Continue</div>
                  {latestSave && (
                    <div className="text-[11px] font-sans font-semibold opacity-80 truncate">
                      {latestSave.regionName} · Lv.{latestSave.level} · {latestSave.activatedTeleportersCount}/5 Gates
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono-num opacity-80 shrink-0">RESUME</span>
              </button>
            )}

            {hasSave && (
              <button
                type="button"
                onClick={() => onOpenOverlay('load_game')}
                className="w-72 px-5 py-2.5 text-left font-display text-sm font-bold tracking-wide text-[#e8f2ec] bg-[#172621] hover:bg-[#21362f] border border-[#426656] transition-all cursor-pointer flex items-center justify-between"
              >
                <span>Load Game</span>
                <span className="text-[11px] font-mono-num text-[#5eead4]">
                  {saveSlots.length} {saveSlots.length === 1 ? 'SAVE' : 'SAVES'}
                </span>
              </button>
            )}

            <button
              type="button"
              data-start="true"
              onClick={handleNewGameClick}
              className={`w-72 px-5 py-3 text-left font-display text-base font-bold tracking-wide transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between ${
                hasSave
                  ? 'bg-[#1a2621] text-[#f0efe8] border border-[#527060] hover:bg-[#23332c]'
                  : 'bg-[#e5a84b] text-[#141712] border border-[#f7cf86] hover:bg-[#f0b960] shadow-[0_6px_22px_rgba(229,168,75,0.3)]'
              }`}
            >
              <span>New Game</span>
              <span className="text-xs font-mono-num opacity-75">ENTER</span>
            </button>

            <div className="flex items-center gap-2.5 w-72">
              <button
                type="button"
                onClick={() => onOpenOverlay('settings')}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#d7dfd9] bg-[#141e1a]/90 hover:bg-[#1e2c26] border border-[#3a4f44] transition-colors cursor-pointer"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => onOpenOverlay('credits')}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#d7dfd9] bg-[#141e1a]/90 hover:bg-[#1e2c26] border border-[#3a4f44] transition-colors cursor-pointer"
              >
                Credits
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
      <div className="relative z-10 px-8 sm:px-14 lg:px-20 pb-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#bcc9c0] hud-text-shadow">
        <p className="font-mono-num tracking-tight">
          WASD Move · LMB Slash · RMB/Hold Heavy · C Wave · Q Pulse · Space Dodge · E Interact · B Forge · K Skills · T Travel
        </p>
        <span className="text-[#9cb0a3]">Harvest Game Jam 2026</span>
      </div>

      {/* New Game Overwrite Confirmation Dialog */}
      {confirmNewGame && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm New Game"
        >
          <div className="w-full max-w-md bg-[#121b17] border border-[#5a4a32] p-6 shadow-2xl space-y-4">
            <h2 className="font-display text-xl font-bold text-[#f5be4f]">Start a New Journey?</h2>
            <p className="text-sm text-[#cdd8d0] leading-relaxed">
              You have saved progress stored locally. Starting a new adventure will reset your active
              session and update Autosave when you reach your next milestone. Manual slots remain
              accessible via Load Game until overwritten.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmNewGame(false)}
                className="px-4 py-2 text-xs font-semibold text-[#d4ded7] bg-[#1c2823] hover:bg-[#263730] border border-[#3a5246] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmNewGame(false);
                  onNewGame();
                }}
                className="px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#14120c] bg-[#e5a84b] hover:bg-[#f0b960] border border-[#f7cf86] cursor-pointer"
              >
                Start New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Game Sub-Modal */}
      {overlay === 'load_game' && (
        <div className="pointer-events-auto">
          <LoadGameModal
            slots={saveSlots}
            onLoadSlot={onLoadSlot}
            onDeleteSlot={onDeleteSlot}
            onClose={() => onOpenOverlay('none')}
          />
        </div>
      )}

      {/* Settings Sub-Modal */}
      {overlay === 'settings' && (
        <div className="pointer-events-auto">
          <SettingsModal
            settings={settings}
            effectiveControlMode={effectiveControlMode}
            onUpdateSettings={onUpdateSettings}
            onOpenTutorial={onOpenTutorial}
            onClose={() => onOpenOverlay('none')}
          />
        </div>
      )}

      {/* Credits Sub-Modal */}
      {overlay === 'credits' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Credits"
        >
          <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto bg-[#131c18] border border-[#3c5246] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#293830]">
              <h2 className="font-display text-xl font-bold text-[#f3efe2]">Credits</h2>
              <button
                type="button"
                onClick={() => onOpenOverlay('none')}
                className="px-2.5 py-1 text-xs font-semibold text-[#c9d6cd] hover:text-white bg-[#1e2b25] border border-[#364a3f] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-sm text-[#cdd8d0] leading-relaxed">
              <div className="bg-[#0e1512] border border-[#2a3d33] p-3.5 space-y-1">
                <p className="font-display text-base font-bold tracking-wide text-[#e6b865]">
                  BOUNCE BACK: AFTER THE FALL
                </p>
                <p className="text-xs font-semibold text-[#f3efe2]">
                  Created by: Mohammed Kahn
                </p>
                <p className="text-xs text-[#9fb8a8]">
                  Built for Hack Club Harvest Game Jam 2026.
                </p>
                <p className="text-xs text-[#5eead4] font-semibold">
                  Theme: BOUNCE BACK!
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#e6b865]">
                  About the Game
                </h3>
                <p className="text-xs text-[#cdd8d0]">
                  A top-down 2D pixel-art Action RPG set across five interconnected regions—The Last
                  Haven, The Forgotten City, The Overgrown Forest, The Industrial Wasteland, and
                  The Lost Core. Explore ruins, fight rogue machines and the Aegis Core Sentinel,
                  help Blacksmith Bram restore his workshop, craft and upgrade Swords, Axes, Bows,
                  and Armour, manage your 40-slot Backpack and Gold economy, and restore the Valley&apos;s
                  relays to help the world bounce back.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#26362e]">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#e6b865]">
                  Contributions, Tools &amp; Transparency
                </h3>
                <ul className="text-xs text-[#b7cabf] space-y-1 list-disc list-inside">
                  <li>
                    <strong className="text-[#e6ede8]">Creator (Mohammed Kahn):</strong> Game
                    concept, world &amp; quest design, feature planning, playtesting, direction,
                    and final curation.
                  </li>
                  <li>
                    <strong className="text-[#e6ede8]">Engine &amp; Libraries:</strong> React,
                    TypeScript, HTML5 Canvas 2D, Vite, Tailwind CSS, and Lucide Icons.
                  </li>
                  <li>
                    <strong className="text-[#e6ede8]">Visuals &amp; Audio:</strong> Procedural
                    HTML5 Canvas pixel-art rendering, inline SVG equipment icons, and Web Audio API
                    sound synthesis (with support for custom licensed boss tracks).
                  </li>
                  <li>
                    <strong className="text-[#e6ede8]">AI Assistance Disclosure:</strong> AI coding
                    tools assisted with TypeScript implementation, procedural rendering/audio code,
                    refactoring, and bug fixes under developer direction and review, disclosed in
                    accordance with Hack Club Harvest Game Jam 2026 rules.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

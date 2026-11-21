import React, { useState } from 'react';
import { Monitor, Smartphone, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  initialLayout: 'desktop' | 'mobile';
  isFirstTime: boolean;
  onStartAdventure: () => void;
  onSkip: () => void;
}

const DESKTOP_BINDINGS = [
  { key: 'WASD / Arrows', action: 'Move through the open world' },
  { key: 'Left Click / F', action: 'Basic Slash (Hold to Charge Heavy)' },
  { key: 'Right Click / R', action: 'Heavy Cleave attack' },
  { key: 'C / Q', action: 'Energy Wave projectile / Arc Pulse AoE' },
  { key: 'Space / Shift', action: 'Dodge Roll / Sprint' },
  { key: 'E', action: 'Interact, inspect gateways & restore relays' },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  initialLayout,
  isFirstTime,
  onStartAdventure,
  onSkip,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(initialLayout);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to After the Fall Controls Tutorial"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a08]/88 p-4"
    >
      <div className="w-full max-w-2xl bg-[#111916] border-2 border-[#3f6452] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1411] border-b border-[#2a4136] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.22em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Survivor Field Guide</span>
            </div>
            <h2
              className="mt-1 text-xl sm:text-2xl font-bold tracking-wider uppercase text-[#f6f1dc]"
              style={{ fontFamily: 'Chakra Petch, sans-serif' }}
            >
              WELCOME TO AFTER THE FALL
            </h2>
            <p className="text-xs sm:text-sm text-[#b9c8be] mt-0.5">
              Your world has fallen. Your journey starts now.
            </p>
          </div>

          {/* Control Layout Switcher */}
          <div className="flex shrink-0 bg-[#090e0c] border border-[#2a4136] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-[#26473a] text-[#ecfdf5]'
                  : 'text-[#8ea196] hover:text-[#dce7e0]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-[#26473a] text-[#ecfdf5]'
                  : 'text-[#8ea196] hover:text-[#dce7e0]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {viewMode === 'desktop' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DESKTOP_BINDINGS.map((b) => (
                  <div
                    key={b.key}
                    className="flex items-center gap-3 bg-[#16211d] border border-[#2c4438] px-3 py-2.5"
                  >
                    <kbd className="shrink-0 min-w-[84px] text-center px-2 py-1 bg-[#0b110e] border border-[#4a6f5d] text-[#fde047] font-mono text-[11px] font-bold">
                      {b.key}
                    </kbd>
                    <span className="text-xs text-[#e2ece5] leading-snug">{b.action}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0c1310] border border-[#24382f] px-3.5 py-2.5 text-[11px] text-[#a7b9ae] flex flex-wrap items-center justify-between gap-2">
                <span>
                  Shortcuts: <strong className="text-[#f3efe0]">B</strong> Forge ·{' '}
                  <strong className="text-[#f3efe0]">K</strong> Skills ·{' '}
                  <strong className="text-[#f3efe0]">T</strong> World Travel ·{' '}
                  <strong className="text-[#f3efe0]">I</strong> Bag ·{' '}
                  <strong className="text-[#f3efe0]">M</strong> Map ·{' '}
                  <strong className="text-[#f3efe0]">J</strong> Quests
                </span>
                <span className="text-[#5eead4]">Tab / 1-5 swaps weapons</span>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {/* Mobile Touch-Control Visual Diagram */}
              <div className="bg-[#0b110f] border border-[#2c4438] p-4">
                <svg
                  viewBox="0 0 560 200"
                  className="w-full h-auto max-h-44"
                  role="img"
                  aria-label="Mobile touch control layout diagram"
                >
                  {/* Landscape device outline */}
                  <rect
                    x="10"
                    y="10"
                    width="540"
                    height="180"
                    rx="14"
                    fill="#131e19"
                    stroke="#3b5a4a"
                    strokeWidth="2"
                  />
                  {/* Center playfield hint */}
                  <text
                    x="280"
                    y="82"
                    textAnchor="middle"
                    fill="#6c8577"
                    fontSize="11"
                    fontFamily="Chakra Petch, sans-serif"
                    letterSpacing="2"
                  >
                    OPEN-WORLD PLAYFIELD
                  </text>
                  <circle cx="280" cy="108" r="8" fill="#5eead4" opacity="0.7" />
                  <text x="280" y="132" textAnchor="middle" fill="#9fb5a8" fontSize="10">
                    Push joystick far edge or tap Run to Sprint
                  </text>

                  {/* Left Virtual Joystick */}
                  <circle cx="95" cy="132" r="42" fill="#0d1512" stroke="#4d7360" strokeWidth="2" />
                  <circle cx="95" cy="132" r="18" fill="#3ba88f" stroke="#99f6e4" strokeWidth="2" />
                  <text x="95" y="76" textAnchor="middle" fill="#f3efe0" fontSize="11" fontWeight="700">
                    MOVE STICK
                  </text>

                  {/* Sprint toggle */}
                  <circle cx="158" cy="154" r="18" fill="#1c362c" stroke="#6ee7b7" strokeWidth="1.5" />
                  <text x="158" y="158" textAnchor="middle" fill="#ecfdf5" fontSize="9" fontWeight="700">
                    RUN
                  </text>

                  {/* Right Action Cluster */}
                  <circle cx="482" cy="144" r="28" fill="#c9762c" stroke="#fcd34d" strokeWidth="2" />
                  <text x="482" y="148" textAnchor="middle" fill="#fffbeb" fontSize="10" fontWeight="700">
                    ATTACK
                  </text>

                  <circle cx="422" cy="148" r="21" fill="#1d2e26" stroke="#537866" strokeWidth="1.5" />
                  <text x="422" y="152" textAnchor="middle" fill="#dce7e0" fontSize="9" fontWeight="700">
                    DODGE
                  </text>

                  <circle cx="428" cy="96" r="21" fill="#9e5a1f" stroke="#fde047" strokeWidth="1.5" />
                  <text x="428" y="100" textAnchor="middle" fill="#fffbeb" fontSize="9" fontWeight="700">
                    ACT
                  </text>

                  <circle cx="484" cy="88" r="21" fill="#0e5f5a" stroke="#5eead4" strokeWidth="1.5" />
                  <text x="484" y="92" textAnchor="middle" fill="#ccfbf1" fontSize="9" fontWeight="700">
                    PULSE
                  </text>
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#cad7ce]">
                <div className="bg-[#16211d] border border-[#2a4136] px-3 py-2">
                  <strong className="text-[#fde047]">Joystick + Run:</strong> Move smoothly and sprint.
                </div>
                <div className="bg-[#16211d] border border-[#2a4136] px-3 py-2">
                  <strong className="text-[#fde047]">Attack / Dodge:</strong> Auto-aims nearest threat.
                </div>
                <div className="bg-[#16211d] border border-[#2a4136] px-3 py-2">
                  <strong className="text-[#fde047]">Act Button:</strong> Glows gold near NPCs & Relays.
                </div>
                <div className="bg-[#16211d] border border-[#2a4136] px-3 py-2">
                  <strong className="text-[#5eead4]">Arc Pulse:</strong> AoE burst when 25+ Energy ready.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#0d1411] border-t border-[#2a4136] flex items-center justify-end gap-3">
          {isFirstTime ? (
            <>
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2.5 bg-[#18231e] hover:bg-[#22322b] border border-[#324b3f] text-xs font-semibold text-[#c5d4ca] transition-colors cursor-pointer"
              >
                Skip Tutorial
              </button>
              <button
                type="button"
                onClick={onStartAdventure}
                className="px-6 py-2.5 bg-[#d9883b] hover:bg-[#e5984b] border border-[#fcd34d] text-xs sm:text-sm font-bold uppercase tracking-wider text-[#14100a] transition-colors cursor-pointer"
                style={{ fontFamily: 'Chakra Petch, sans-serif' }}
              >
                Start Adventure
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onStartAdventure}
              className="px-6 py-2.5 bg-[#2a5443] hover:bg-[#356954] border border-[#6ee7b7] text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ecfdf5] transition-colors cursor-pointer"
              style={{ fontFamily: 'Chakra Petch, sans-serif' }}
            >
              Back to Adventure
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

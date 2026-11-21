import React, { useEffect, useState } from 'react';
import { BookOpen, Gamepad2, Maximize2, Minimize2, Sliders, Wrench, X } from 'lucide-react';
import { ControlMode, GameSettings, ParticleDensity, VisualEffectsQuality } from '../game/types';

interface SettingsModalProps {
  settings: GameSettings;
  effectiveControlMode: 'desktop' | 'mobile';
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onOpenTutorial: () => void;
  onClose: () => void;
}

type SettingsTab = 'general' | 'controls' | 'gameplay';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  effectiveControlMode,
  onUpdateSettings,
  onOpenTutorial,
  onClose,
}) => {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== 'undefined' && Boolean(document.fullscreenElement)
  );
  const [fsNotice, setFsNotice] = useState<string | null>(null);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    setFsNotice(null);
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else {
          setFsNotice('Fullscreen is not supported by this browser.');
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      setFsNotice('Fullscreen was blocked by the browser container.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a08]/85 p-4"
    >
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#111916] border-2 border-[#395547] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0d1411] border-b border-[#2a4136]">
          <h2
            className="text-lg font-bold tracking-wider uppercase text-[#f6f1dc]"
            style={{ fontFamily: 'Chakra Petch, sans-serif' }}
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="p-1.5 text-[#a7b9ae] hover:text-[#f6f1dc] hover:bg-[#1e2d26] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 bg-[#0c1310] border-b border-[#283d33]">
          <button
            type="button"
            onClick={() => setTab('general')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              tab === 'general'
                ? 'border-[#fde047] bg-[#16221d] text-[#f6f1dc]'
                : 'border-transparent text-[#8fa498] hover:text-[#dce7e0]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('controls')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              tab === 'controls'
                ? 'border-[#fde047] bg-[#16221d] text-[#f6f1dc]'
                : 'border-transparent text-[#8fa498] hover:text-[#dce7e0]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Controls</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('gameplay')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              tab === 'gameplay'
                ? 'border-[#fde047] bg-[#16221d] text-[#f6f1dc]'
                : 'border-transparent text-[#8fa498] hover:text-[#dce7e0]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Gameplay</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {tab === 'general' && (
            <div className="space-y-4">
              {/* Audio Sliders */}
              <div className="bg-[#15201b] border border-[#2a4136] p-4 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#94ad9f]">
                  Audio
                </div>
                <label className="block">
                  <div className="flex justify-between text-[#e2ece5] mb-1">
                    <span>Master Volume</span>
                    <span className="font-mono text-[#fde047]">
                      {Math.round(settings.masterVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.masterVolume}
                    onChange={(e) =>
                      onUpdateSettings({ masterVolume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#d9883b] cursor-pointer"
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between text-[#e2ece5] mb-1">
                    <span>Music Volume</span>
                    <span className="font-mono text-[#fde047]">
                      {Math.round(settings.musicVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.musicVolume}
                    onChange={(e) =>
                      onUpdateSettings({ musicVolume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#d9883b] cursor-pointer"
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between text-[#e2ece5] mb-1">
                    <span>Sound Effects Volume</span>
                    <span className="font-mono text-[#fde047]">
                      {Math.round(settings.sfxVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.sfxVolume}
                    onChange={(e) =>
                      onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#d9883b] cursor-pointer"
                  />
                </label>
              </div>

              {/* Display & Atmosphere */}
              <div className="bg-[#15201b] border border-[#2a4136] p-4 space-y-3.5">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#94ad9f]">
                  Display &amp; World
                </div>

                <label className="block">
                  <div className="flex justify-between text-[#e2ece5] mb-1">
                    <span>Brightness</span>
                    <span className="font-mono text-[#5eead4]">
                      {Math.round(settings.brightness * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.3}
                    step={0.05}
                    value={settings.brightness}
                    onChange={(e) =>
                      onUpdateSettings({ brightness: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#5eead4] cursor-pointer"
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#e2ece5]">Screen Scaling</span>
                  <div className="flex gap-1.5">
                    {[
                      { val: 0.85, label: '85%' },
                      { val: 1.0, label: '100%' },
                      { val: 1.15, label: '115%' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => onUpdateSettings({ screenScale: opt.val })}
                        className={`px-3 py-1.5 border font-mono text-[11px] cursor-pointer ${
                          Math.abs(settings.screenScale - opt.val) < 0.02
                            ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                            : 'bg-[#0f1714] border-[#2c4237] text-[#9eb2a6] hover:text-[#e2ece5]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[#e2ece5]">Fullscreen Mode</div>
                    {fsNotice && <div className="text-[10px] text-[#f59e0b] mt-0.5">{fsNotice}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2b24] hover:bg-[#233a30] border border-[#3e604f] text-[#e2ece5] cursor-pointer"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Exit Fullscreen</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Enter Fullscreen</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#e2ece5]">Dynamic Weather</span>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ weatherEnabled: !settings.weatherEnabled })}
                    className={`px-3 py-1 border font-semibold cursor-pointer ${
                      settings.weatherEnabled
                        ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                        : 'bg-[#1a221f] border-[#394b42] text-[#9eb2a6]'
                    }`}
                  >
                    {settings.weatherEnabled ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#e2ece5]">Day / Night Speed</span>
                  <div className="flex gap-1.5">
                    {[
                      { val: 0, label: 'Paused' },
                      { val: 1, label: 'Normal' },
                      { val: 2, label: 'Fast' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => onUpdateSettings({ dayNightSpeed: opt.val })}
                        className={`px-2.5 py-1 border text-[11px] cursor-pointer ${
                          settings.dayNightSpeed === opt.val
                            ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                            : 'bg-[#0f1714] border-[#2c4237] text-[#9eb2a6]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'controls' && (
            <div className="space-y-4">
              {/* Control Mode Selector */}
              <div className="bg-[#15201b] border border-[#2a4136] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-[#f3efe0]">Control Layout</div>
                    <div className="text-[11px] text-[#9eb2a6]">
                      Currently active:{' '}
                      <strong className="text-[#5eead4] uppercase">{effectiveControlMode}</strong>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {(['auto', 'desktop', 'mobile'] as ControlMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateSettings({ controlMode: mode })}
                        className={`px-3 py-1.5 border text-[11px] font-semibold uppercase tracking-wider cursor-pointer ${
                          settings.controlMode === mode
                            ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                            : 'bg-[#0f1714] border-[#2c4237] text-[#9eb2a6] hover:text-[#e2ece5]'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Layout Preview */}
                <div className="bg-[#0c1310] border border-[#24382f] p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#89a295] mb-2">
                    {effectiveControlMode === 'mobile'
                      ? 'Mobile Touch Layout Preview'
                      : 'Desktop Keyboard & Mouse Preview'}
                  </div>
                  {effectiveControlMode === 'mobile' ? (
                    <div className="flex items-center justify-between gap-4 py-1 text-[11px] text-[#c7d6cc]">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#4d7360] bg-[#13201b] flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-[#3ba88f]" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#f3efe0]">Left Stick + Run</div>
                          <div className="text-[10px] text-[#94ab9e]">Move &amp; sprint</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
                        <span className="px-2 py-1 bg-[#9e5a1f]/80 border border-[#fde047] text-[#fffbeb] text-center">
                          ACT
                        </span>
                        <span className="px-2 py-1 bg-[#0e5f5a]/80 border border-[#5eead4] text-[#ccfbf1] text-center">
                          PULSE
                        </span>
                        <span className="px-2 py-1 bg-[#1e3128] border border-[#4d7360] text-[#dce7e0] text-center">
                          DODGE
                        </span>
                        <span className="px-2 py-1 bg-[#c9762c] border border-[#fcd34d] text-[#fffbeb] text-center">
                          ATTACK
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      {[
                        ['WASD / Arrows', 'Move'],
                        ['Mouse Click / F', 'Attack'],
                        ['Space', 'Dodge Roll'],
                        ['Shift', 'Sprint'],
                        ['E', 'Interact / Restore'],
                        ['Q', 'Arc Pulse'],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between gap-1 bg-[#141f1a] border border-[#263c32] px-2 py-1.5"
                        >
                          <span className="font-mono text-[#fde047] font-bold">{k}</span>
                          <span className="text-[#c5d4ca]">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reopen Tutorial Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-[#a7b9ae]">
                    Need a refresher on movement, combat, or touch buttons?
                  </div>
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#d9883b] hover:bg-[#e5984b] border border-[#fcd34d] text-[#14100a] font-bold uppercase tracking-wider text-[11px] cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Reopen Tutorial</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'gameplay' && (
            <div className="bg-[#15201b] border border-[#2a4136] p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[#e2ece5] font-medium">Quest Markers</div>
                  <div className="text-[11px] text-[#8fa498]">
                    Display floating ! markers above quest NPCs.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ showQuestMarkers: !settings.showQuestMarkers })
                  }
                  className={`px-3.5 py-1.5 border font-semibold cursor-pointer ${
                    settings.showQuestMarkers
                      ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                      : 'bg-[#1a221f] border-[#394b42] text-[#9eb2a6]'
                  }`}
                >
                  {settings.showQuestMarkers ? 'Shown' : 'Hidden'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[#e2ece5] font-medium">Damage Numbers</div>
                  <div className="text-[11px] text-[#8fa498]">
                    Show floating hit numbers during combat.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ showDamageNumbers: !settings.showDamageNumbers })
                  }
                  className={`px-3.5 py-1.5 border font-semibold cursor-pointer ${
                    settings.showDamageNumbers
                      ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                      : 'bg-[#1a221f] border-[#394b42] text-[#9eb2a6]'
                  }`}
                >
                  {settings.showDamageNumbers ? 'Shown' : 'Hidden'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[#e2ece5] font-medium">Camera Shake</div>
                  <div className="text-[11px] text-[#8fa498]">
                    Impact screen shake on heavy hits and restorations.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ cameraShake: !settings.cameraShake })}
                  className={`px-3.5 py-1.5 border font-semibold cursor-pointer ${
                    settings.cameraShake
                      ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                      : 'bg-[#1a221f] border-[#394b42] text-[#9eb2a6]'
                  }`}
                >
                  {settings.cameraShake ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[#e2ece5] font-medium">Touch Controls Visibility</div>
                  <div className="text-[11px] text-[#8fa498]">
                    Auto-detects touch screens, or force on/off manually.
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['auto', 'mobile', 'desktop'] as ControlMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onUpdateSettings({ controlMode: m })}
                      className={`px-2.5 py-1 border text-[11px] cursor-pointer ${
                        settings.controlMode === m
                          ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                          : 'bg-[#0f1714] border-[#2c4237] text-[#9eb2a6]'
                      }`}
                    >
                      {m === 'auto' ? 'Auto' : m === 'mobile' ? 'Show' : 'Hide'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[#e2ece5] font-medium">Environmental Particles</div>
                  <div className="text-[11px] text-[#8fa498]">
                    Fireflies, falling leaves, smoke, and Core energy motes.
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['low', 'auto', 'high'] as ParticleDensity[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onUpdateSettings({ particleDensity: d })}
                      className={`px-2.5 py-1 border text-[11px] uppercase cursor-pointer ${
                        settings.particleDensity === d
                          ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                          : 'bg-[#0f1714] border-[#2c4237] text-[#9eb2a6]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[#e2ece5] font-medium">Visual Effects Intensity</div>
                  <div className="text-[11px] text-[#8fa498]">
                    Sword trails, energy waves, shockwave rings, and hit sparks.
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['low', 'medium', 'high'] as VisualEffectsQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onUpdateSettings({ visualEffects: q })}
                      className={`px-2.5 py-1 border text-[11px] uppercase cursor-pointer ${
                        settings.visualEffects === q
                          ? 'bg-[#2a5443] border-[#6ee7b7] text-[#ecfdf5]'
                          : 'bg-[#0f1714] border-[#2c4237] text-[#9eb2a6]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0d1411] border-t border-[#2a4136] flex items-center justify-between">
          <span className="text-[11px] text-[#7f968a]">All settings save automatically.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#2a5443] hover:bg-[#356954] border border-[#6ee7b7] text-xs font-bold uppercase tracking-wider text-[#ecfdf5] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

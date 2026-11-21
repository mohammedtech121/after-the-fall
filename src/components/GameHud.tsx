import React from 'react';
import { Lock, Maximize2, Minimize2 } from 'lucide-react';
import { ActiveOverlay, HudSnapshot, ToastMessage } from '../game/types';
import {
  EnergyCoreIcon,
  GoldCoinIcon,
  HeartIcon,
  ItemSvgIcon,
  ShieldDefenseIcon,
  StaminaIcon,
  WeatherGlyph,
} from './GameIcons';
import { WeaponArtwork } from './WeaponArtwork';

interface GameHudProps {
  hud: HudSnapshot;
  toasts: ToastMessage[];
  isMobileLayout?: boolean;
  fullscreenSupported?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenOverlay: (overlay: ActiveOverlay) => void;
  onToggleMute: () => void;
  onPause: () => void;
}

function formatClock(hours: number): string {
  const h = Math.floor(((hours % 24) + 24) % 24);
  const m = Math.floor((hours - Math.floor(hours)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  toasts,
  isMobileLayout = false,
  fullscreenSupported = false,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenOverlay,
  onToggleMute,
  onPause,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const trailPct = Math.max(hpPct, Math.min(100, (hud.trailingHp / Math.max(1, hud.maxHp)) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / Math.max(1, hud.maxStamina)) * 100));
  const engPct = Math.max(0, Math.min(100, (hud.energy / Math.max(1, hud.maxEnergy)) * 100));

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between safe-area-hud sm:p-4">
      {/* TOP BAR: Left Vitals Cluster · Center Boss Bar · Right Region & Utility Cluster */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left: Vitals & Quick Resource Readout */}
        <div
          className={`flex flex-col ${
            isMobileLayout ? 'gap-1.5 max-w-[205px]' : 'gap-2 max-w-[270px]'
          }`}
        >
          <div
            className={`bg-[#101815]/90 border border-[#34483d] shadow-[0_4px_14px_rgba(0,0,0,0.45)] ${
              isMobileLayout ? 'px-2 py-1.5' : 'px-3 py-2.5'
            }`}
          >
            {/* HP Bar with delayed trailing damage bar */}
            <div className="flex items-center gap-2 mb-1.5">
              <HeartIcon className="w-4 h-4 shrink-0" />
              <div className="flex-1 h-2.5 bg-[#1e2623] border border-[#0b100e] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#f59e0b]/80"
                  style={{ width: `${trailPct}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-[#dc4c4c]"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="font-mono-num text-xs font-bold text-[#f4efe4] w-14 text-right">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>

            {/* Stamina Bar */}
            <div className="flex items-center gap-2 mb-1.5">
              <StaminaIcon className="w-4 h-4 shrink-0" />
              <div className="flex-1 h-2 bg-[#1e2623] border border-[#0b100e] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#eab308]"
                  style={{ width: `${stamPct}%` }}
                />
              </div>
              <span className="font-mono-num text-[11px] text-[#d9d5c5] w-14 text-right">
                {hud.stamina} ST
              </span>
            </div>

            {/* Arc Energy Bar */}
            <div className="flex items-center gap-2">
              <EnergyCoreIcon className="w-4 h-4 shrink-0" />
              <div className="flex-1 h-2 bg-[#1e2623] border border-[#0b100e] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#38d9c8]"
                  style={{ width: `${engPct}%` }}
                />
              </div>
              <span className="font-mono-num text-[11px] text-[#9ff5ec] w-14 text-right">
                {hud.energy} EN
              </span>
            </div>

            {/* Compact Resource, Gold, Defense & Level Strip */}
            <div className="mt-2 pt-2 border-t border-[#26362e] flex flex-wrap items-center justify-between gap-1.5 text-xs text-[#cfd8d2]">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-mono-num font-bold text-[#fde047]" title="Gold Coins">
                  <GoldCoinIcon className="w-3.5 h-3.5" />
                  {hud.gold}
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num" title="Salvaged Scrap">
                  <ItemSvgIcon itemId="scrap" className="w-3.5 h-3.5" />
                  {hud.inventory.scrap}
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num" title="Arc Crystals">
                  <ItemSvgIcon itemId="crystal" className="w-3.5 h-3.5" />
                  {hud.inventory.crystal}
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num" title="Mech Components">
                  <ItemSvgIcon itemId="parts" className="w-3.5 h-3.5" />
                  {hud.inventory.parts}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hud.defense > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 font-mono-num text-[11px] font-bold text-[#60a5fa]"
                    title={`${hud.equippedArmourName} (${hud.defense} Defense)`}
                  >
                    <ShieldDefenseIcon className="w-3 h-3" />
                    {hud.defense}
                  </span>
                )}
                <span className="font-mono-num text-[11px] font-bold text-[#e6b865]">
                  LV {hud.level}
                </span>
              </div>
            </div>
          </div>

          {/* Clickable Equipped Weapon Widget + Arrow Counter / Charge Meter */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Equipped weapon ${hud.equippedWeaponName} Level ${hud.equippedWeaponLevel}. ${hud.blacksmithUnlocked ? 'Open Blacksmith Workshop (B)' : 'Blacksmith Workshop Locked'}`}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenOverlay('workbench');
            }}
            className="pointer-events-auto bg-[#101815]/90 hover:bg-[#16231e] border border-[#34483d] px-2.5 py-2 shadow-md flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-9 h-9 shrink-0 bg-[#0b120f] border border-[#2d4439] flex items-center justify-center">
              <WeaponArtwork
                weaponId={hud.equippedWeapon}
                level={hud.equippedWeaponLevel}
                className="w-8 h-8"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-bold text-[#f3efe2] truncate">
                  {hud.equippedWeaponName}
                </span>
                <span className="font-mono-num text-[11px] font-bold text-[#e6b865] shrink-0">
                  Lv.{hud.equippedWeaponLevel}
                </span>
              </div>
              {hud.equippedWeaponCategory === 'bow' ? (
                <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px] font-mono-num">
                  <span
                    className={
                      hud.arrowCount > 0 ? 'text-[#86efac] font-bold' : 'text-[#f87171] font-bold'
                    }
                  >
                    Arrows: {hud.arrowCount}
                  </span>
                  <span className="text-[#9db5a7]">Tab Swap</span>
                </div>
              ) : hud.chargeProgress > 0.05 ? (
                <div className="mt-1 h-1.5 w-full bg-[#1a2520] border border-[#0b100e] overflow-hidden">
                  <div
                    className="h-full bg-[#5eead4]"
                    style={{ width: `${Math.round(hud.chargeProgress * 100)}%` }}
                  />
                </div>
              ) : (
                <div className="text-[10px] text-[#9db5a7] mt-0.5 truncate">
                  {!isMobileLayout ? 'RMB Heavy · C Wave · Tab Swap' : 'Tap Smith to Craft'}
                </div>
              )}
            </div>
          </button>

          {/* Compact Active Quest Objective */}
          <div
            className={`bg-[#101815]/85 border border-[#2f4238] shadow-md ${
              isMobileLayout ? 'px-2 py-1' : 'px-3 py-2'
            }`}
          >
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#e6b865] leading-tight truncate">
              {hud.activeQuestTitle}
            </div>
            <div className="text-[11px] sm:text-xs text-[#dce4de] leading-snug mt-0.5 line-clamp-1 sm:line-clamp-2">
              {hud.activeQuestStep}
            </div>
          </div>
        </div>

        {/* Top-Center: Boss Bar OR Toast Notifications */}
        <div className="flex-1 flex flex-col items-center gap-2 max-w-md">
          {hud.bossBar && (
            <div
              data-testid="boss-health-bar"
              className="w-full bg-[#130f14]/95 border-2 border-[#992d34] px-4 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold text-[#fecaca] tracking-wide uppercase leading-tight truncate">
                    {hud.bossBar.name}
                  </div>
                  <div className="text-[11px] text-[#d6b2a6] truncate">
                    {hud.bossBar.title}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[10px] font-mono-num font-bold uppercase border ${
                      hud.bossBar.defeated
                        ? 'bg-[#122e2a] border-[#4cd3c2] text-[#99f6e4]'
                        : hud.bossBar.phase === 3
                          ? 'bg-[#3d111a] border-[#f43f5e] text-[#fda4af]'
                          : hud.bossBar.phase === 2
                            ? 'bg-[#361a11] border-[#f97316] text-[#fdba74]'
                            : 'bg-[#2a1f12] border-[#d97706] text-[#fde68a]'
                    }`}
                  >
                    {hud.bossBar.defeated
                      ? 'DEFEATED'
                      : hud.bossBar.phase === 3
                        ? 'Phase III · Overload'
                        : hud.bossBar.phase === 2
                          ? 'Phase II · Surge'
                          : 'Phase I · Guardian'}
                  </span>
                  <div className="font-mono-num text-[11px] text-[#f5d0a9] mt-0.5">
                    {hud.bossBar.hp}/{hud.bossBar.maxHp} HP
                  </div>
                </div>
              </div>

              {/* Segmented Boss HP Bar with delayed trailing damage + Phase II (65%) & Phase III (30%) ticks */}
              <div className="w-full h-3.5 bg-[#241316] border border-[#0b0708] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#f59e0b]/75 transition-all duration-150"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.bossBar.trailingHp / Math.max(1, hud.bossBar.maxHp)) * 100))}%`,
                  }}
                />
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-100 ${
                    hud.bossBar.phase === 3
                      ? 'bg-[#f43f5e]'
                      : hud.bossBar.phase === 2
                        ? 'bg-[#ef4444]'
                        : 'bg-[#dc2626]'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.bossBar.hp / Math.max(1, hud.bossBar.maxHp)) * 100))}%`,
                  }}
                />
                {/* Phase threshold dividers */}
                <div
                  className="absolute inset-y-0 w-[2px] bg-[#0d0809]/85"
                  style={{ left: '30%' }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-y-0 w-[2px] bg-[#0d0809]/85"
                  style={{ left: '65%' }}
                  aria-hidden="true"
                />
              </div>

              {/* Readable Boss Attack Warning Banner */}
              {hud.bossBar.telegraphWarning && !hud.bossBar.defeated && (
                <div className="mt-1.5 px-2.5 py-1 bg-[#3a1216] border border-[#f87171] text-center font-mono-num text-[11px] font-bold tracking-wider text-[#fef08a]">
                  ! {hud.bossBar.telegraphWarning}
                </div>
              )}
            </div>
          )}

          {toasts.slice(-2).map((t) => (
            <div
              key={t.id}
              className={`px-4 py-2 bg-[#101815]/95 border text-center shadow-lg ${
                t.tone === 'achievement' ? 'border-[#eab308]' : 'border-[#426152]'
              }`}
            >
              <div
                className={`font-display text-sm font-bold ${
                  t.tone === 'restore'
                    ? 'text-[#5eead4]'
                    : t.tone === 'warning'
                      ? 'text-[#f87171]'
                      : t.tone === 'quest' || t.tone === 'achievement'
                        ? 'text-[#f5be4f]'
                        : 'text-[#f3efe2]'
                }`}
              >
                {t.title}
              </div>
              {t.subtitle && <div className="text-xs text-[#c9d6cd] mt-0.5">{t.subtitle}</div>}
            </div>
          ))}
        </div>

        {/* Top-Right: Region Name, Clock/Weather, Restored Progress & Compact Action Buttons */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-[#101815]/90 border border-[#34483d] px-3 py-2 text-right shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-end gap-2">
              {hud.autosaving && (
                <span
                  data-testid="autosave-indicator"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#12332d] border border-[#4cd3c2] font-mono-num text-[10px] font-bold text-[#99f6e4]"
                >
                  <span className="w-1.5 h-1.5 bg-[#5eead4] inline-block animate-pulse" />
                  SAVED
                </span>
              )}
              <span className="font-display text-sm font-bold text-[#f3efe2] leading-tight">
                {hud.interiorName ?? hud.regionName}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-end gap-2 text-xs text-[#c2cfc6]">
              <WeatherGlyph weather={hud.weather} dayPhase={hud.dayPhase} />
              <span className="font-mono-num">{formatClock(hud.timeOfDay)}</span>
              <span aria-hidden="true">·</span>
              <span>{hud.dayPhase}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#5eead4]">
                {hud.restoredCount}/{hud.totalRestorationNodes} Relays
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#e6b865]">
                {hud.activatedTeleporterCount}/{hud.totalTeleporters} Gates
              </span>
            </div>
          </div>

          {/* Clickable Square Utility Buttons (pointer-events-auto, tabIndex=-1, blur on click) */}
          <div className="flex flex-wrap justify-end items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label={
                hud.blacksmithUnlocked
                  ? 'Open Blacksmith Workshop (B)'
                  : 'Blacksmith Workshop Locked — Help Blacksmith Bram'
              }
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenOverlay('workbench');
              }}
              className={`px-2.5 h-8 border text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                hud.blacksmithUnlocked
                  ? 'bg-[#121c18]/92 hover:bg-[#1d2d26] border-[#3a5245] text-[#f3dfb6]'
                  : 'bg-[#141917]/90 hover:bg-[#1c2320] border-[#42382e] text-[#a9a396]'
              }`}
            >
              {!hud.blacksmithUnlocked && <Lock className="w-3 h-3 text-[#f59e0b]" />}
              <span>Smith</span>
              {!isMobileLayout && <span className="font-mono-num text-[10px] text-[#9eb5a6]">B</span>}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Open Skill Tree (K)"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenOverlay('skills');
              }}
              className="px-2.5 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#e6ede8] cursor-pointer flex items-center gap-1.5 relative"
            >
              <span>Skills</span>
              {hud.skillPoints > 0 ? (
                <span className="font-mono-num text-[10px] font-bold px-1 bg-[#e5a84b] text-[#14120c]">
                  +{hud.skillPoints}
                </span>
              ) : (
                !isMobileLayout && <span className="font-mono-num text-[10px] text-[#9eb5a6]">K</span>
              )}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Open World Travel (T)"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenOverlay('travel');
              }}
              className="px-2.5 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#a7f3eb] cursor-pointer flex items-center gap-1.5"
            >
              <span>Travel</span>
              {!isMobileLayout && <span className="font-mono-num text-[10px] text-[#9eb5a6]">T</span>}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Open Backpack ${hud.backpackUsedSlots}/${hud.backpackMaxSlots} (I)`}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenOverlay('inventory');
              }}
              className="px-2.5 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#e6ede8] cursor-pointer flex items-center gap-1.5"
            >
              <span>Bag</span>
              <span className="font-mono-num text-[10px] text-[#9eb5a6]">
                {hud.backpackUsedSlots}/{hud.backpackMaxSlots}
              </span>
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Open World Map (M)"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenOverlay('map');
              }}
              className="px-2.5 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#e6ede8] cursor-pointer flex items-center gap-1.5"
            >
              <span>Map</span>
              {!isMobileLayout && <span className="font-mono-num text-[10px] text-[#9eb5a6]">M</span>}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Open Quest Journal (J)"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenOverlay('quests');
              }}
              className="px-2.5 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#e6ede8] cursor-pointer flex items-center gap-1.5"
            >
              <span>Quests</span>
              {!isMobileLayout && <span className="font-mono-num text-[10px] text-[#9eb5a6]">J</span>}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-8 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#e6ede8] cursor-pointer flex items-center justify-center"
              title={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {hud.muted ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#f87171]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5eead4]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9.5 9.5 0 0 1 0 14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            {fullscreenSupported && onToggleFullscreen && (
              <button
                type="button"
                tabIndex={-1}
                data-testid="fullscreen-toggle-btn"
                aria-label={isFullscreen ? 'Exit Full-Screen' : 'Enter Full-Screen'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleFullscreen();
                }}
                className="w-8 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#5eead4] cursor-pointer flex items-center justify-center"
                title={isFullscreen ? 'Exit Full-Screen' : 'Enter Full-Screen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Game (Esc)"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-8 h-8 bg-[#121c18]/92 hover:bg-[#1d2d26] border border-[#3a5245] text-xs font-semibold text-[#e6ede8] cursor-pointer flex items-center justify-center"
              title="Pause (Esc)"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM: Contextual Interaction Prompt Only (Clean HUD — no permanent control bar) */}
      <div
        className={`flex flex-col items-center gap-2 ${
          isMobileLayout ? 'mb-20 sm:mb-16' : 'mb-1'
        }`}
      >
        {hud.prompt && (
          <div className="bg-[#101815]/95 border border-[#e5a84b] px-4 py-2 shadow-xl flex items-center gap-3">
            <span className="font-mono-num text-xs font-bold px-2 py-0.5 bg-[#e5a84b] text-[#111512]">
              {isMobileLayout ? 'ACT' : 'E'}
            </span>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#f7f4e8] leading-tight">
                {hud.prompt.label}
              </div>
              {hud.prompt.sublabel && (
                <div
                  className={`text-xs leading-tight mt-0.5 ${
                    hud.prompt.canAfford === false ? 'text-[#f87171]' : 'text-[#b7d1c3]'
                  }`}
                >
                  {hud.prompt.sublabel}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

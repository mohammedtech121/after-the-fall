import React from 'react';
import { ArmourId, RegionId, WeaponId } from '../game/types';

interface WeaponArtworkProps {
  weaponId: WeaponId;
  level?: number;
  className?: string;
}

/**
 * Distinct handcrafted pixel-art SVG illustrations for all 5 weapons.
 * Higher weapon levels add subtle honed edge highlights and energy sheen.
 */
export const WeaponArtwork: React.FC<WeaponArtworkProps> = ({
  weaponId,
  level = 1,
  className = 'w-12 h-12',
}) => {
  const enhanced = level >= 3;
  const master = level >= 6;

  if (weaponId === 'scrap_blade') {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Scrap Blade">
        {enhanced && (
          <circle cx="28" cy="20" r="14" fill="#d97706" fillOpacity="0.16" />
        )}
        <g transform="rotate(-45 24 24)">
          {/* Wrapped salvage leather handle */}
          <rect x="22" y="34" width="4" height="10" fill="#6b4426" />
          <rect x="22" y="36" width="4" height="2" fill="#9a6439" />
          <rect x="22" y="40" width="4" height="2" fill="#9a6439" />
          <rect x="21" y="43" width="6" height="3" fill="#475569" />
          {/* Bolted scrap crossguard */}
          <rect x="16" y="31" width="16" height="4" fill="#64748b" />
          <rect x="17" y="32" width="2" height="2" fill="#cbd5e1" />
          <rect x="29" y="32" width="2" height="2" fill="#cbd5e1" />
          {/* Notched salvaged steel blade */}
          <polygon points="20,31 20,10 24,4 28,10 28,31" fill="#94a3b8" />
          <polygon points="24,4 28,10 28,31 24,31" fill="#64748b" />
          <polygon points="20,17 22,19 20,21" fill="#1e293b" />
          <rect x="23" y="10" width="2" height="18" fill={master ? '#fde68a' : '#e2e8f0'} />
          {/* Copper wire lashings */}
          <rect x="20" y="27" width="8" height="2" fill="#d97706" />
        </g>
      </svg>
    );
  }

  if (weaponId === 'reinforced_sword') {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Reinforced Sword">
        {enhanced && (
          <circle cx="28" cy="20" r="15" fill="#fbbf24" fillOpacity="0.18" />
        )}
        <g transform="rotate(-45 24 24)">
          {/* Forged steel pommel & grip */}
          <rect x="22" y="35" width="4" height="9" fill="#334155" />
          <rect x="20" y="43" width="8" height="3" fill="#d97706" />
          {/* Brass-trimmed broad crossguard */}
          <polygon points="14,31 34,31 31,35 17,35" fill="#b45309" />
          <rect x="16" y="31" width="16" height="2" fill="#f59e0b" />
          {/* Broad double-edged reinforced blade */}
          <polygon points="19,31 19,10 24,3 29,10 29,31" fill="#cbd5e1" />
          <polygon points="24,3 29,10 29,31 24,31" fill="#94a3b8" />
          <rect x="23" y="8" width="2" height="21" fill={master ? '#fef08a' : '#f8fafc'} />
          {/* Reinforced collar plate */}
          <rect x="20" y="26" width="8" height="5" fill="#475569" />
          <rect x="22" y="27" width="4" height="3" fill="#fbbf24" />
        </g>
      </svg>
    );
  }

  if (weaponId === 'pulse_blade') {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Pulse Blade">
        <circle cx="27" cy="20" r={master ? 18 : 15} fill="#22d3ee" fillOpacity="0.22" />
        <g transform="rotate(-45 24 24)">
          {/* Tech grip with cyan battery cell */}
          <rect x="22" y="34" width="4" height="10" fill="#1e293b" />
          <rect x="23" y="36" width="2" height="6" fill="#22d3ee" />
          <rect x="20" y="43" width="8" height="3" fill="#0891b2" />
          {/* Emitter wings */}
          <polygon points="14,32 20,29 28,29 34,32 32,35 16,35" fill="#0f172a" />
          <rect x="17" y="31" width="14" height="2" fill="#67e8f9" />
          {/* Sleek plasma-edged blade */}
          <polygon points="20,29 20,9 24,2 28,9 28,29" fill="#0e7490" />
          <polygon points="21,29 21,10 24,4 27,10 27,29" fill="#22d3ee" />
          <polygon points="23,28 23,8 24,5 25,8 25,28" fill="#ecfeff" />
          {/* Energy vents */}
          <rect x="19" y="15" width="2" height="4" fill="#a5f3fc" />
          <rect x="27" y="15" width="2" height="4" fill="#a5f3fc" />
        </g>
      </svg>
    );
  }

  if (weaponId === 'ancient_blade') {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Ancient Blade">
        <circle cx="27" cy="20" r={master ? 19 : 16} fill="#a855f7" fillOpacity="0.24" />
        <g transform="rotate(-45 24 24)">
          {/* Obsidian rune hilt */}
          <rect x="22" y="34" width="4" height="10" fill="#3b0764" />
          <polygon points="21,44 24,47 27,44 24,41" fill="#5eead4" />
          {/* Swept relic crossguard */}
          <polygon points="13,29 24,33 35,29 33,35 24,36 15,35" fill="#581c87" />
          <polygon points="22,31 24,29 26,31 24,34" fill="#5eead4" />
          {/* Sculpted ancient rune blade */}
          <polygon points="19,31 18,12 24,2 30,12 29,31" fill="#4c1d95" />
          <polygon points="21,30 20,12 24,4 28,12 27,30" fill="#a855f7" />
          {/* Glowing cyan rune channel */}
          <rect x="23" y="9" width="2" height="18" fill="#5eead4" />
          <rect x="21" y="14" width="6" height="2" fill="#e9d5ff" />
          <rect x="21" y="21" width="6" height="2" fill="#e9d5ff" />
        </g>
      </svg>
    );
  }

  if (weaponId === 'scrap_axe' || weaponId === 'foundry_greataxe') {
    const isGreat = weaponId === 'foundry_greataxe';
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label={isGreat ? 'Foundry Greataxe' : 'Scrap Battleaxe'}>
        {(enhanced || isGreat) && (
          <circle cx="27" cy="20" r={isGreat ? 17 : 14} fill={isGreat ? '#fb923c' : '#d97706'} fillOpacity="0.2" />
        )}
        <g transform="rotate(-40 24 24)">
          {/* Heavy wood / steel haft */}
          <rect x="22" y="6" width="4" height="39" fill={isGreat ? '#3f3f46' : '#6b4226'} />
          <rect x="23" y="8" width="1.5" height="35" fill={isGreat ? '#71717a' : '#9a6439'} />
          <rect x="21" y="42" width="6" height="3" fill={isGreat ? '#ea580c' : '#475569'} />
          {/* Axe head collar */}
          <rect x="20" y="11" width="8" height="10" fill="#1e293b" />
          {/* Primary curved cleaver blade */}
          <polygon points="26,11 38,7 40,16 37,24 26,21" fill={isGreat ? '#c2410c' : '#64748b'} />
          <polygon points="35,8 39,16 36,23 33,22 36,16 33,9" fill={isGreat ? '#fed7aa' : '#f1f5f9'} />
          {/* Secondary counterweight or twin blade */}
          {isGreat ? (
            <>
              <polygon points="22,11 10,7 8,16 11,24 22,21" fill="#c2410c" />
              <polygon points="13,8 9,16 12,23 15,22 12,16 15,9" fill="#fed7aa" />
              <rect x="22.5" y="13" width="3" height="6" fill="#fde047" />
            </>
          ) : (
            <polygon points="22,13 15,15 15,18 22,19" fill="#475569" />
          )}
        </g>
      </svg>
    );
  }

  if (weaponId === 'hunter_bow' || weaponId === 'arc_longbow') {
    const isArc = weaponId === 'arc_longbow';
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label={isArc ? 'Arc Longbow' : 'Scavenger Bow'}>
        {(enhanced || isArc) && (
          <circle cx="24" cy="24" r="17" fill={isArc ? '#38bdf8' : '#84cc16'} fillOpacity="0.18" />
        )}
        <g transform="rotate(-35 24 24)">
          {/* Bowstring */}
          <line x1="16" y1="7" x2="16" y2="41" stroke={isArc ? '#a5f3fc' : '#e2e8f0'} strokeWidth="1.6" />
          {/* Curved limbs */}
          <path
            d="M16 7 C29 10, 32 18, 30 24 C32 30, 29 38, 16 41"
            fill="none"
            stroke={isArc ? '#0e7490' : '#784824'}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path
            d="M16 7 C28 10, 30 18, 29 24 C30 30, 28 38, 16 41"
            fill="none"
            stroke={isArc ? '#38bdf8' : '#b45309'}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Leather / energy grip */}
          <rect x="27.5" y="21" width="4" height="6" fill={isArc ? '#1e293b' : '#4a2e18'} />
          {/* Nocked arrow */}
          <line x1="12" y1="24" x2="39" y2="24" stroke={isArc ? '#67e8f9' : '#d6b384'} strokeWidth="2" />
          <polygon points="42,24 35,20.5 36.5,24 35,27.5" fill={isArc ? '#ffffff' : '#e2e8f0'} />
          <polygon points="10,24 14,21 15,24 14,27" fill={isArc ? '#38bdf8' : '#f8fafc'} />
        </g>
      </svg>
    );
  }

  // COREBLADE — Legendary World-Core Weapon
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Coreblade">
      <circle cx="27" cy="20" r="20" fill="#2dd4bf" fillOpacity="0.26" />
      <circle cx="27" cy="20" r="12" fill="#fde047" fillOpacity="0.2" />
      <g transform="rotate(-45 24 24)">
        {/* Golden Core hilt */}
        <rect x="22" y="35" width="4" height="9" fill="#0f172a" />
        <rect x="23" y="36" width="2" height="7" fill="#fde047" />
        <polygon points="20,44 24,48 28,44 24,41" fill="#5eead4" />
        {/* Winged Core Emitter Crossguard */}
        <polygon points="11,28 24,33 37,28 34,35 24,36 14,35" fill="#0d9488" />
        <polygon points="13,29 24,32 35,29 33,32 24,34 15,32" fill="#fde047" />
        {/* Split Radiant Coreblade */}
        <polygon points="18,30 19,9 24,1 29,9 30,30" fill="#14b8a6" />
        <polygon points="20,29 21,9 24,3 27,9 28,29" fill="#5eead4" />
        {/* Golden radiant core spine */}
        <polygon points="23,29 23,7 24,3 25,7 25,29" fill="#fef08a" />
        {/* Floating core crystal heart */}
        <polygon points="24,25 27,29 24,33 21,29" fill="#ffffff" stroke="#fde047" strokeWidth="1.2" />
      </g>
    </svg>
  );
};

interface ArmourArtworkProps {
  armourId: ArmourId;
  level?: number;
  className?: string;
}

export const ArmourArtwork: React.FC<ArmourArtworkProps> = ({
  armourId,
  level = 1,
  className = 'w-12 h-12',
}) => {
  const palette: Record<ArmourId, { plate: string; trim: string; core: string; glow: string }> = {
    none: { plate: '#334155', trim: '#64748b', core: '#94a3b8', glow: 'transparent' },
    scout_tunic: { plate: '#5c4028', trim: '#a37243', core: '#d9a468', glow: '#b45309' },
    reinforced_vest: { plate: '#475569', trim: '#94a3b8', core: '#f59e0b', glow: '#f59e0b' },
    iron_plate: { plate: '#64748b', trim: '#cbd5e1', core: '#38bdf8', glow: '#60a5fa' },
    aegis_alloy_armour: { plate: '#3b2466', trim: '#c084fc', core: '#5eead4', glow: '#a855f7' },
    core_sentinel_plate: { plate: '#115e59', trim: '#fde047', core: '#5eead4', glow: '#2dd4bf' },
  };
  const colors = palette[armourId];
  const label = armourId === 'none' ? 'Unarmoured' : armourId.replace(/_/g, ' ');

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={label}>
      {armourId !== 'none' && level >= 2 && (
        <circle cx="24" cy="24" r="18" fill={colors.glow} fillOpacity="0.18" />
      )}
      {/* Pauldrons */}
      <polygon points="8,14 16,10 18,19 10,22" fill={colors.trim} stroke="#0f1714" strokeWidth="1.5" />
      <polygon points="40,14 32,10 30,19 38,22" fill={colors.trim} stroke="#0f1714" strokeWidth="1.5" />
      {/* Cuirass body */}
      <path
        d="M15 11 L20 14 L28 14 L33 11 L35 28 L24 41 L13 28 Z"
        fill={colors.plate}
        stroke="#0f1714"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Chest ridge & trim */}
      <path d="M16 19 L24 23 L32 19" fill="none" stroke={colors.trim} strokeWidth="2" />
      <path d="M24 15 L24 38" stroke={colors.trim} strokeWidth="1.4" strokeOpacity="0.7" />
      {/* Central emblem */}
      <polygon points="24,18 28,23 24,28 20,23" fill={colors.core} stroke="#0f1714" strokeWidth="1.2" />
      {/* Waist belt plate */}
      <rect x="16" y="30" width="16" height="3.5" fill={colors.trim} />
    </svg>
  );
};

interface RegionThumbnailSvgProps {
  region: RegionId;
  activated?: boolean;
  className?: string;
}

/**
 * Handcrafted atmospheric pixel-style region thumbnail artwork for the World Travel & Teleporter UI.
 */
export const RegionThumbnailSvg: React.FC<RegionThumbnailSvgProps> = ({
  region,
  activated = true,
  className = 'w-full h-24',
}) => {
  const dimOpacity = activated ? 1 : 0.62;

  if (region === 'haven') {
    return (
      <svg viewBox="0 0 180 84" className={className} role="img" aria-label="The Last Haven">
        <defs>
          <linearGradient id="skyHaven" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b302a" />
            <stop offset="100%" stopColor="#3c5a44" />
          </linearGradient>
        </defs>
        <g opacity={dimOpacity}>
          <rect width="180" height="84" fill="url(#skyHaven)" />
          <circle cx="145" cy="22" r="11" fill="#fde68a" fillOpacity="0.85" />
          {/* Rolling hills */}
          <path d="M0 54 Q45 36 95 50 T180 46 V84 H0 Z" fill="#23422c" />
          <path d="M0 64 Q60 54 120 62 T180 58 V84 H0 Z" fill="#2f5638" />
          {/* Survivor cabin & warm campfire */}
          <rect x="28" y="42" width="32" height="20" fill="#6b4b32" />
          <polygon points="24,44 44,30 64,44" fill="#3f2b1d" />
          <rect x="38" y="48" width="8" height="8" fill="#fbbf24" />
          {/* Pine trees */}
          <polygon points="108,58 118,34 128,58" fill="#183322" />
          <polygon points="124,60 135,38 146,60" fill="#1d3c28" />
          {/* Haven Gateway ring */}
          <ellipse cx="90" cy="68" rx="16" ry="5" fill="#132420" stroke="#5eead4" strokeWidth="2" />
          <circle cx="90" cy="64" r="3" fill="#f5be4f" />
        </g>
      </svg>
    );
  }

  if (region === 'city') {
    return (
      <svg viewBox="0 0 180 84" className={className} role="img" aria-label="The Forgotten City">
        <defs>
          <linearGradient id="skyCity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#17202a" />
            <stop offset="100%" stopColor="#324759" />
          </linearGradient>
        </defs>
        <g opacity={dimOpacity}>
          <rect width="180" height="84" fill="url(#skyCity)" />
          {/* Ruined skyline */}
          <rect x="14" y="20" width="22" height="44" fill="#293640" />
          <rect x="42" y="10" width="28" height="54" fill="#32424f" />
          <polygon points="42,10 56,16 70,10 70,22 42,22" fill="#1e2933" />
          <rect x="112" y="16" width="26" height="48" fill="#2b3945" />
          <rect x="144" y="28" width="22" height="36" fill="#23303b" />
          {/* Broken glowing windows */}
          <rect x="48" y="26" width="4" height="5" fill="#60a5fa" fillOpacity="0.65" />
          <rect x="58" y="34" width="4" height="5" fill="#93c5fd" fillOpacity="0.5" />
          <rect x="120" y="30" width="4" height="5" fill="#60a5fa" fillOpacity="0.6" />
          {/* Overgrown vines */}
          <path d="M46 64 V34 M62 64 V42 M118 64 V38" stroke="#3c734c" strokeWidth="2" />
          {/* Highway & City Transit Gate */}
          <rect x="0" y="60" width="180" height="24" fill="#222a30" />
          <line x1="0" y1="72" x2="180" y2="72" stroke="#64748b" strokeDasharray="8 6" strokeWidth="1.5" />
          <ellipse cx="90" cy="64" rx="16" ry="5" fill="#172536" stroke="#60a5fa" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  if (region === 'forest') {
    return (
      <svg viewBox="0 0 180 84" className={className} role="img" aria-label="The Overgrown Forest">
        <defs>
          <linearGradient id="skyForest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#11241c" />
            <stop offset="100%" stopColor="#244d39" />
          </linearGradient>
        </defs>
        <g opacity={dimOpacity}>
          <rect width="180" height="84" fill="url(#skyForest)" />
          {/* Dense forest canopy */}
          <circle cx="24" cy="36" r="22" fill="#1a402c" />
          <circle cx="62" cy="30" r="24" fill="#1f4c34" />
          <circle cx="122" cy="32" r="25" fill="#1a402c" />
          <circle cx="158" cy="38" r="22" fill="#153625" />
          {/* Winding emerald river */}
          <rect x="0" y="54" width="180" height="30" fill="#1c422c" />
          <path d="M0 68 Q55 58 100 68 T180 62 V78 Q125 84 85 75 T0 78 Z" fill="#2c7596" />
          {/* Ancient Nature Portal & glowing spores */}
          <ellipse cx="90" cy="64" rx="16" ry="5" fill="#132e22" stroke="#4ade80" strokeWidth="2" />
          <circle cx="48" cy="46" r="2" fill="#86efac" />
          <circle cx="134" cy="44" r="2" fill="#5eead4" />
          <circle cx="90" cy="56" r="2.5" fill="#4ade80" />
        </g>
      </svg>
    );
  }

  if (region === 'wasteland') {
    return (
      <svg viewBox="0 0 180 84" className={className} role="img" aria-label="The Industrial Wasteland">
        <defs>
          <linearGradient id="skyWaste" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#261813" />
            <stop offset="100%" stopColor="#593522" />
          </linearGradient>
        </defs>
        <g opacity={dimOpacity}>
          <rect width="180" height="84" fill="url(#skyWaste)" />
          {/* Foundry smokestacks */}
          <rect x="24" y="16" width="12" height="44" fill="#382923" />
          <rect x="44" y="24" width="32" height="36" fill="#423028" />
          <rect x="128" y="14" width="14" height="46" fill="#382923" />
          <rect x="148" y="28" width="24" height="32" fill="#47332a" />
          {/* Smog plumes */}
          <circle cx="32" cy="12" r="8" fill="#785342" fillOpacity="0.45" />
          <circle cx="136" cy="10" r="9" fill="#785342" fillOpacity="0.45" />
          {/* Industrial floor & toxic canal */}
          <rect x="0" y="58" width="180" height="26" fill="#30241f" />
          <rect x="16" y="70" width="44" height="6" fill="#84cc16" fillOpacity="0.7" />
          <rect x="126" y="71" width="38" height="5" fill="#84cc16" fillOpacity="0.7" />
          {/* Industrial Transport Core */}
          <ellipse cx="90" cy="64" rx="16" ry="5" fill="#2b1b14" stroke="#fb923c" strokeWidth="2" />
          <circle cx="90" cy="60" r="3" fill="#fde047" />
        </g>
      </svg>
    );
  }

  // THE LOST CORE
  return (
    <svg viewBox="0 0 180 84" className={className} role="img" aria-label="The Lost Core">
      <defs>
        <linearGradient id="skyCore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#09131c" />
          <stop offset="100%" stopColor="#133342" />
        </linearGradient>
      </defs>
      <g opacity={dimOpacity}>
        <rect width="180" height="84" fill="url(#skyCore)" />
        {/* Obsidian monoliths */}
        <polygon points="22,60 32,14 42,60" fill="#13222e" stroke="#2dd4bf" strokeOpacity="0.4" />
        <polygon points="138,60 148,12 158,60" fill="#13222e" stroke="#2dd4bf" strokeOpacity="0.4" />
        {/* Central Core Spire */}
        <circle cx="90" cy="36" r="18" fill="#2dd4bf" fillOpacity="0.18" />
        <polygon points="90,14 102,36 90,54 78,36" fill="#14b8a6" stroke="#a7fff4" strokeWidth="1.5" />
        <polygon points="90,22 96,36 90,46 84,36" fill="#fef08a" />
        {/* Circuit sanctum floor */}
        <rect x="0" y="58" width="180" height="26" fill="#0d1b24" />
        <line x1="0" y1="68" x2="180" y2="68" stroke="#2dd4bf" strokeOpacity="0.45" strokeWidth="1.5" />
        <ellipse cx="90" cy="66" rx="18" ry="5" fill="#0f2933" stroke="#5eead4" strokeWidth="2" />
      </g>
    </svg>
  );
};

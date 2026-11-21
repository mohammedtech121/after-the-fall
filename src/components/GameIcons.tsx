import React from 'react';
import { ItemId, WeatherType } from '../game/types';

export const HeartIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 20.5s-7.5-4.7-9.3-9.2C1.4 8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.7 1.4-1.6 3-2.7 5-2.7 3.4 0 5.6 3.5 4.3 6.8-1.8 4.5-9.3 9.2-9.3 9.2z"
      fill="#dc4c4c"
      stroke="#141916"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M6.8 7.5c-1.1.3-1.8 1.2-1.9 2.3" stroke="#fca5a5" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

export const StaminaIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M13.5 2.5L4.5 13.5h6.5l-1 8 9.5-11h-6.5l.5-8z"
      fill="#eab308"
      stroke="#141916"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 6.5L8.2 11.5" stroke="#fef08a" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const EnergyCoreIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon
      points="12,2 20,12 12,22 4,12"
      fill="#2dd4bf"
      stroke="#111a18"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <polygon points="12,6 15.5,12 12,18 8.5,12" fill="#ccfbf1" />
  </svg>
);

export const GoldCoinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" fill="#f59e0b" stroke="#18140d" strokeWidth="2" />
    <circle cx="12" cy="12" r="5.5" fill="#fde047" />
    <rect x="11" y="8.5" width="2" height="7" fill="#b45309" />
  </svg>
);

export const ShieldDefenseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 2.5L4.5 5.5v6.2c0 4.6 3.1 8.5 7.5 9.8 4.4-1.3 7.5-5.2 7.5-9.8V5.5L12 2.5z"
      fill="#60a5fa"
      stroke="#101820"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 5.5v13" stroke="#dbeafe" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ItemSvgIcon: React.FC<{ itemId: ItemId; className?: string }> = ({
  itemId,
  className = 'w-4 h-4',
}) => {
  switch (itemId) {
    case 'scrap':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M4 15l5-9 6 3 5-2-3 10-7 3-6-5z"
            fill="#b88454"
            stroke="#161412"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="11" cy="12" r="2" fill="#2b241d" />
          <path d="M8.5 8.5l4 2" stroke="#f0c99e" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'crystal':
      return <EnergyCoreIcon className={className} />;
    case 'ration':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="4" y="6" width="16" height="13" rx="2" fill="#7c9a4d" stroke="#141a12" strokeWidth="2" />
          <path d="M4 10h16" stroke="#36471f" strokeWidth="2" />
          <rect x="9" y="12.5" width="6" height="3" fill="#e6f2c2" />
        </svg>
      );
    case 'parts':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="6.5" fill="#8b9aa6" stroke="#14181c" strokeWidth="2" />
          <circle cx="12" cy="12" r="2.5" fill="#1e2429" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" stroke="#d1dde6" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'rare_alloy':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <polygon points="3,16 7,7 17,7 21,16" fill="#6ca0bd" stroke="#121c21" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 10h8" stroke="#d8f1ff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'medkit':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="3" y="6" width="18" height="14" rx="2" fill="#e8ece9" stroke="#181c1a" strokeWidth="2" />
          <path d="M9 6V4h6v2" stroke="#181c1a" strokeWidth="2" fill="none" />
          <path d="M12 9.5v7M8.5 13h7" stroke="#dc2626" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case 'energy_cell':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="6" y="5" width="12" height="16" rx="2" fill="#1f4247" stroke="#0f1a1c" strokeWidth="2" />
          <rect x="9" y="2.5" width="6" height="3" fill="#94a3b8" stroke="#0f1a1c" strokeWidth="1.5" />
          <rect x="8.5" y="9" width="7" height="8" fill="#45e3d0" />
        </svg>
      );
    case 'arrow':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M5 19L18 6" stroke="#c89f6b" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="19.5,4.5 13.5,5.5 18.5,10.5" fill="#e2e8f0" stroke="#14181c" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M4.5 16l2.5 2.5M6.5 19.5L9 17" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'blacksmith_hammer':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M5 19l8-8" stroke="#8b5a2b" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M10 6l5-3 6 6-3 5-8-8z" fill="#94a3b8" stroke="#14181c" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12.5 7.5l3 3" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
};

export const WeatherGlyph: React.FC<{ weather: WeatherType; dayPhase: string }> = ({
  weather,
  dayPhase,
}) => {
  if (weather === 'rain') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 14h11a4 4 0 0 0 .5-7.9A5.5 5.5 0 0 0 6.8 7.5 3.5 3.5 0 0 0 6 14z" />
        <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" strokeLinecap="round" />
      </svg>
    );
  }
  if (weather === 'fog') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 9h16M3 13h18M6 17h12" strokeLinecap="round" />
      </svg>
    );
  }
  if (dayPhase === 'Night') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-200" fill="currentColor" aria-hidden="true">
        <path d="M18 14.5A6.5 6.5 0 0 1 9.5 6a6.5 6.5 0 1 0 8.5 8.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" strokeLinecap="round" />
    </svg>
  );
};

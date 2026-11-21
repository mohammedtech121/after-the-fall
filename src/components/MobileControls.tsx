import React, { useRef, useState } from 'react';
import { Flame, Footprints, Hand, RefreshCw, Shield, Sparkles, Swords, Zap } from 'lucide-react';
import { InteractionPrompt } from '../game/types';

interface MobileControlsProps {
  prompt: InteractionPrompt | null;
  pulseReady: boolean;
  heavyReady?: boolean;
  energyStrikeReady?: boolean;
  energy: number;
  canCycleWeapon?: boolean;
  onMove: (dx: number, dy: number, sprinting: boolean) => void;
  onAttack: () => void;
  onHeavyAttack?: () => void;
  onEnergyStrike?: () => void;
  onDodge: () => void;
  onInteract: () => void;
  onPulse: () => void;
  onCycleWeapon?: () => void;
}

const STICK_RADIUS = 44;

export const MobileControls: React.FC<MobileControlsProps> = ({
  prompt,
  pulseReady,
  heavyReady = true,
  energyStrikeReady = false,
  energy,
  canCycleWeapon = false,
  onMove,
  onAttack,
  onHeavyAttack,
  onEnergyStrike,
  onDodge,
  onInteract,
  onPulse,
  onCycleWeapon,
}) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false });
  const [sprintLocked, setSprintLocked] = useState(false);

  const updateStickFromPoint = (clientX: number, clientY: number, lockOverride?: boolean) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > STICK_RADIUS) {
      dx = (dx / dist) * STICK_RADIUS;
      dy = (dy / dist) * STICK_RADIUS;
    }
    const nx = dx / STICK_RADIUS;
    const ny = dy / STICK_RADIUS;
    const normDist = Math.min(1, dist / STICK_RADIUS);
    const isSprinting = (lockOverride ?? sprintLocked) || normDist > 0.86;
    setKnob({ x: dx, y: dy, active: true });
    onMove(nx, ny, isSprinting);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0, active: false });
    onMove(0, 0, false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateStickFromPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updateStickFromPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    resetStick();
  };

  const toggleSprint = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !sprintLocked;
    setSprintLocked(next);
    if (knob.active) {
      onMove(knob.x / STICK_RADIUS, knob.y / STICK_RADIUS, next);
    }
  };

  const fireAction = (fn?: () => void) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 pointer-events-none select-none flex items-end justify-between safe-area-controls"
      style={{ touchAction: 'none' }}
      data-testid="mobile-controls"
    >
      {/* BOTTOM-LEFT: Virtual Joystick + Sprint & Swap Weapon Controls */}
      <div className="pointer-events-auto flex items-end gap-2.5" style={{ touchAction: 'none' }}>
        <div
          ref={baseRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Movement Joystick"
          role="application"
          className="relative w-26 h-26 sm:w-28 sm:h-28 rounded-full bg-[#101814]/82 border-2 border-[#395547] shadow-lg flex items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute top-2.5 w-1.5 h-1.5 bg-[#527462]/70" />
          <div className="absolute bottom-2.5 w-1.5 h-1.5 bg-[#527462]/70" />
          <div className="absolute left-2.5 w-1.5 h-1.5 bg-[#527462]/70" />
          <div className="absolute right-2.5 w-1.5 h-1.5 bg-[#527462]/70" />

          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 shadow-md transition-colors ${
              knob.active
                ? 'bg-[#3ba88f]/90 border-[#99f6e4]'
                : 'bg-[#21332a]/90 border-[#4d6f5d]'
            }`}
            style={{
              transform: `translate(${knob.x}px, ${knob.y}px)`,
            }}
          />
        </div>

        <div className="flex flex-col gap-2 mb-0.5">
          {canCycleWeapon && onCycleWeapon && (
            <button
              type="button"
              onPointerDown={fireAction(onCycleWeapon)}
              aria-label="Swap Weapon"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 bg-[#162420]/90 border-[#4c7262] text-[#d6ece2] flex flex-col items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Swap</span>
            </button>
          )}
          <button
            type="button"
            onPointerDown={toggleSprint}
            aria-pressed={sprintLocked}
            aria-label="Toggle Sprint"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              sprintLocked
                ? 'bg-[#2b6b57]/95 border-[#6ee7b7] text-[#ecfdf5]'
                : 'bg-[#121c17]/85 border-[#385244] text-[#a7b9ae]'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Run</span>
          </button>
        </div>
      </div>

      {/* BOTTOM-RIGHT: Ergonomic 6-Button Action Arc (Zero Overlap on Landscape & Portrait Mobile) */}
      <div
        className="pointer-events-auto relative w-[212px] h-[148px] sm:w-[228px] sm:h-[160px]"
        style={{ touchAction: 'none' }}
      >
        {/* Energy Wave Button (Top-Left of arc) */}
        <button
          type="button"
          onPointerDown={fireAction(onEnergyStrike)}
          aria-label="Energy Wave"
          className={`absolute left-[26px] top-[44px] w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
            energyStrikeReady
              ? 'bg-[#134e6f]/95 border-[#38bdf8] text-[#e0f2fe]'
              : 'bg-[#121a19]/80 border-[#2b3f3c] text-[#647b76]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Wave</span>
        </button>

        {/* Interact Button (Top-Middle of arc) */}
        <button
          type="button"
          onPointerDown={fireAction(onInteract)}
          aria-label="Interact"
          className={`absolute left-[90px] top-[32px] w-[50px] h-[50px] rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
            prompt
              ? 'bg-[#b46825]/95 border-[#fde047] text-[#fffbeb]'
              : 'bg-[#121c17]/85 border-[#385244] text-[#9eb2a6]'
          }`}
        >
          <Hand className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">
            {prompt ? 'Act' : 'Use'}
          </span>
        </button>

        {/* Arc Pulse Button (Top-Right of arc) */}
        <button
          type="button"
          onPointerDown={fireAction(onPulse)}
          aria-label="Arc Pulse"
          className={`absolute right-[4px] top-[24px] w-[50px] h-[50px] rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
            pulseReady
              ? 'bg-[#0e5f5a]/95 border-[#5eead4] text-[#ccfbf1]'
              : 'bg-[#121a19]/80 border-[#2b3f3c] text-[#647b76]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">
            {pulseReady ? 'Pulse' : `${energy}E`}
          </span>
        </button>

        {/* Heavy Attack Button (Bottom-Left of arc) */}
        <button
          type="button"
          onPointerDown={fireAction(onHeavyAttack)}
          aria-label="Heavy Attack"
          className={`absolute left-[26px] bottom-[4px] w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
            heavyReady
              ? 'bg-[#7c2d12]/95 border-[#fb923c] text-[#ffedd5]'
              : 'bg-[#1a1715]/80 border-[#3f322a] text-[#7c6b60]'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Heavy</span>
        </button>

        {/* Dodge Button (Bottom-Middle of arc) */}
        <button
          type="button"
          onPointerDown={fireAction(onDodge)}
          aria-label="Dodge"
          className="absolute left-[90px] bottom-[4px] w-[50px] h-[50px] rounded-full bg-[#1a2923]/90 border-2 border-[#4d6f5d] text-[#d6e4db] flex flex-col items-center justify-center shadow-lg active:scale-95 active:bg-[#2a453a] cursor-pointer"
        >
          <Shield className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Dodge</span>
        </button>

        {/* Primary Attack Button (Bottom-Right, largest) */}
        <button
          type="button"
          onPointerDown={fireAction(onAttack)}
          aria-label="Attack"
          className="absolute right-0 bottom-0 w-[68px] h-[68px] rounded-full bg-[#c9762c]/95 border-2 border-[#fcd34d] text-[#fffbeb] flex flex-col items-center justify-center shadow-xl active:scale-95 active:bg-[#df8c3d] cursor-pointer"
        >
          <Swords className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Attack</span>
        </button>
      </div>
    </div>
  );
};


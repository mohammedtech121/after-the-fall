import React from 'react';
import { Compass, Home, Lock, Sparkles } from 'lucide-react';
import { REGION_META } from '../game/quests';
import { RegionId, TeleporterId, TeleporterStation } from '../game/types';
import { RegionThumbnailSvg } from './WeaponArtwork';

interface WorldTravelModalProps {
  teleporters: TeleporterStation[];
  currentRegion: RegionId;
  onTravel: (destId: TeleporterId) => { ok: boolean; message: string };
  onReturnToHaven: () => { ok: boolean; message: string };
  onClose: () => void;
}

export const WorldTravelModal: React.FC<WorldTravelModalProps> = ({
  teleporters,
  currentRegion,
  onTravel,
  onReturnToHaven,
  onClose,
}) => {
  const activatedCount = teleporters.filter((t) => t.activated).length;
  const havenTp = teleporters.find((t) => t.id === 'tp_haven');
  const canQuickHaven = Boolean(havenTp?.activated && currentRegion !== 'haven');

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/78 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="World Travel Network"
    >
      <div className="w-full max-w-4xl bg-[#111a17] border border-[#426152] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#17241f] border-b border-[#2b3f35]">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#5eead4]" />
              <h2 className="font-display text-xl font-bold text-[#f3efe2]">
                World Travel Network
              </h2>
            </div>
            <p className="text-xs text-[#9cb5a7] mt-0.5">
              Activated Gateways: <span className="font-mono-num text-[#5eead4]">{activatedCount}/{teleporters.length}</span>{' '}
              · Discover and activate ancient gateways in each region to unlock instant travel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canQuickHaven && (
              <button
                type="button"
                onClick={() => onReturnToHaven()}
                className="px-3 py-1.5 text-xs font-bold text-[#0b1613] bg-[#e5a84b] hover:bg-[#f0b960] border border-[#f7cf86] flex items-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Haven</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
            >
              Close [T]
            </button>
          </div>
        </div>

        {/* Regional Teleporter Cards */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {teleporters.map((tp) => {
            const meta = REGION_META[tp.region];
            const isCurrent = tp.region === currentRegion;
            const canTravel = tp.discovered && tp.activated;

            return (
              <div
                key={tp.id}
                className={`border flex flex-col overflow-hidden transition-colors ${
                  canTravel
                    ? 'bg-[#14201c] border-[#3d6352]'
                    : tp.discovered
                      ? 'bg-[#141c19] border-[#424d3d]'
                      : 'bg-[#0e1412] border-[#25332d]'
                }`}
              >
                {/* Region Artwork Thumbnail */}
                <div className="relative border-b border-[#25382f] bg-[#0a100e]">
                  <RegionThumbnailSvg
                    region={tp.region}
                    activated={tp.activated}
                    className="w-full h-24 block"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#0b1310]/90 border border-[#334b3f] text-[10px] font-bold uppercase tracking-wider text-[#dce8e1]">
                    {meta.name}
                  </div>
                  <div
                    className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      tp.activated
                        ? 'bg-[#0f3834]/95 border-[#5eead4] text-[#99f6e4]'
                        : tp.discovered
                          ? 'bg-[#332613]/95 border-[#e5a84b] text-[#fde68a]'
                          : 'bg-[#171e1b]/95 border-[#394a41] text-[#8da196]'
                    }`}
                  >
                    {tp.activated ? 'Activated' : tp.discovered ? 'Locked' : 'Undiscovered'}
                  </div>
                  {isCurrent && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#e5a84b] text-[#14120c] text-[10px] font-bold uppercase">
                      Current Region
                    </div>
                  )}
                </div>

                {/* Station Info & Travel Button */}
                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-[#f3efe2]">
                        {tp.discovered ? tp.name : 'Unknown Ancient Gateway'}
                      </h3>
                      <span className="text-[11px] text-[#9cb3a5]">{meta.danger}</span>
                    </div>
                    <p className="text-xs text-[#b5c7bc] mt-1 leading-relaxed">
                      {tp.discovered
                        ? meta.description
                        : 'Explore this region on foot to locate and reactivate its ancient teleportation station.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!canTravel}
                    onClick={() => onTravel(tp.id)}
                    aria-label={`Travel to ${tp.name}`}
                    className={`w-full py-2 px-3 font-display text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                      canTravel
                        ? 'bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0b1613] border border-[#99f6e4] cursor-pointer'
                        : 'bg-[#17201c] text-[#6d8276] border border-[#2a3932] cursor-not-allowed'
                    }`}
                  >
                    {canTravel ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isCurrent ? `Warp to ${tp.name}` : `Travel to ${tp.name}`}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {tp.discovered
                            ? 'Inspect Gateway in Region to Activate'
                            : 'Discover & Activate First'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

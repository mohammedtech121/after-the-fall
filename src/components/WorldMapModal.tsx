import React, { useRef, useState } from 'react';
import { LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import { REGION_META } from '../game/quests';
import {
  LandmarkZone,
  NpcEntity,
  QuestState,
  RegionId,
  RestorationNode,
  TeleporterStation,
} from '../game/types';
import { CORE_RELAYS_REQUIRED, TILE_SIZE, WORLD_H, WORLD_W } from '../game/worldData';

interface WorldMapModalProps {
  restorationNodes: RestorationNode[];
  teleporters?: TeleporterStation[];
  landmarks: LandmarkZone[];
  npcs: NpcEntity[];
  quests: QuestState[];
  talkedNpcIds: string[];
  visitedRegions: RegionId[];
  coreGateUnlocked: boolean;
  playerX: number;
  playerY: number;
  onFastTravel: (nodeId: string) => void;
  onClose: () => void;
}

const REGION_ZONES: {
  id: RegionId;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}[] = [
  { id: 'city', x: 0, y: 0, w: 58, h: 42, fill: '#2a343b' },
  { id: 'wasteland', x: 58, y: 0, w: 62, h: 42, fill: '#3d3028' },
  { id: 'haven', x: 0, y: 42, w: 42, h: 42, fill: '#2c472f' },
  { id: 'forest', x: 42, y: 42, w: 44, h: 42, fill: '#1f4232' },
  { id: 'core', x: 86, y: 42, w: 34, h: 42, fill: '#192b36' },
];

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  restorationNodes,
  teleporters = [],
  landmarks,
  npcs,
  quests,
  talkedNpcIds,
  visitedRegions,
  coreGateUnlocked,
  playerX,
  playerY,
  onFastTravel,
  onClose,
}) => {
  const px = (playerX / (WORLD_W * TILE_SIZE)) * 120;
  const py = (playerY / (WORLD_H * TILE_SIZE)) * 84;
  const nonCoreRestored = restorationNodes.filter((n) => n.restored && n.kind !== 'world_core').length;
  const fastTravelNodes = restorationNodes.filter((n) => n.restored && n.fastTravelUnlocked);
  const activatedTeleporters = teleporters.filter((t) => t.discovered && t.activated);
  const commTowerRestored = restorationNodes.some((n) => n.id === 'node_comm_tower' && n.restored);

  // Interactive Zoom & Pan state in SVG coordinate space (120 x 84)
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 60, y: 42 });
  const dragRef = useRef<{ startX: number; startY: number; origCx: number; origCy: number } | null>(
    null
  );

  const clampCenter = (cx: number, cy: number, z: number) => {
    const halfW = 60 / z;
    const halfH = 42 / z;
    return {
      x: Math.max(halfW, Math.min(120 - halfW, cx)),
      y: Math.max(halfH, Math.min(84 - halfH, cy)),
    };
  };

  const applyZoom = (nextZoom: number) => {
    const z = Math.max(1, Math.min(2.6, Number(nextZoom.toFixed(2))));
    setZoom(z);
    setCenter((c) => clampCenter(c.x, c.y, z));
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    applyZoom(zoom + (e.deltaY < 0 ? 0.25 : -0.25));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origCx: center.x,
      origCy: center.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const vw = 120 / zoom;
    const vh = 84 / zoom;
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * vw;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * vh;
    setCenter(clampCenter(dragRef.current.origCx - dx, dragRef.current.origCy - dy, zoom));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const centerOnPlayer = () => {
    const z = Math.max(zoom, 1.6);
    setZoom(z);
    setCenter(clampCenter(px, py, z));
  };

  const resetView = () => {
    setZoom(1);
    setCenter({ x: 60, y: 42 });
  };

  const viewW = 120 / zoom;
  const viewH = 84 / zoom;
  const viewX = center.x - viewW / 2;
  const viewY = center.y - viewH / 2;

  // Compute active quest objective pin coordinates (only revealing objectives in discovered areas or active main quest)
  const activeObjectives = quests
    .filter((q) => q.status === 'active')
    .flatMap((q) =>
      q.objectives
        .filter((o) => o.current < o.required && o.targetId)
        .map((o) => ({ questTitle: q.title, category: q.category, obj: o }))
    );

  const questPins: { id: string; x: number; y: number; label: string }[] = [];
  for (const item of activeObjectives) {
    const { obj } = item;
    if (obj.type === 'talk_npc') {
      const npc = npcs.find((n) => n.id === obj.targetId);
      if (npc && (visitedRegions.includes(npc.region) || item.category === 'main')) {
        questPins.push({
          id: obj.id,
          x: (npc.x / (WORLD_W * TILE_SIZE)) * 120,
          y: (npc.y / (WORLD_H * TILE_SIZE)) * 84,
          label: `${item.questTitle}: ${obj.label}`,
        });
      }
    } else if (obj.type === 'restore_node') {
      const rn = restorationNodes.find((n) => n.id === obj.targetId);
      if (rn && (visitedRegions.includes(rn.region) || commTowerRestored || item.category === 'main')) {
        questPins.push({
          id: obj.id,
          x: (rn.x / (WORLD_W * TILE_SIZE)) * 120,
          y: (rn.y / (WORLD_H * TILE_SIZE)) * 84,
          label: `${item.questTitle}: ${obj.label}`,
        });
      }
    }
  }

  // Discovered NPCs (visited region or previously spoken to)
  const visibleNpcs = npcs.filter(
    (n) => visitedRegions.includes(n.region) || talkedNpcIds.includes(n.id)
  );

  // Visible restoration relays (in visited regions, restored, or revealed by Haven Comm Tower)
  const visibleNodes = restorationNodes.filter(
    (n) => n.restored || visitedRegions.includes(n.region) || commTowerRestored
  );

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="World Map"
    >
      <div className="w-full max-w-4xl bg-[#121b17] border border-[#455e50] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#18241f] border-b border-[#2b3b33] gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#f3efe2]">Valley World Map</h2>
            <p className="text-xs text-[#9fb5a7]">
              Explored Regions: {visitedRegions.length}/5 · Restored Relays:{' '}
              {restorationNodes.filter((n) => n.restored).length}/{restorationNodes.length} · Core
              Gate:{' '}
              {coreGateUnlocked
                ? 'Unsealed'
                : `Locked (${nonCoreRestored}/${CORE_RELAYS_REQUIRED} Relays)`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
          >
            Close [M]
          </button>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto">
          {/* Interactive Zoomable & Pannable 5-Region SVG Map */}
          <div className="lg:col-span-8 bg-[#0b110f] border border-[#2d4036] p-2 flex flex-col">
            {/* Map Zoom/Pan Toolbar */}
            <div className="flex items-center justify-between px-1 pb-2 text-[11px] text-[#9fb5a7]">
              <span>Drag to pan · Scroll or use controls to zoom ({Math.round(zoom * 100)}%)</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyZoom(zoom - 0.35)}
                  aria-label="Zoom Out"
                  className="p-1.5 bg-[#16221d] hover:bg-[#22352d] border border-[#324a3f] text-[#dce7e0] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyZoom(zoom + 0.35)}
                  aria-label="Zoom In"
                  className="p-1.5 bg-[#16221d] hover:bg-[#22352d] border border-[#324a3f] text-[#dce7e0] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={centerOnPlayer}
                  aria-label="Center on Player"
                  title="Center on Player"
                  className="p-1.5 bg-[#16221d] hover:bg-[#22352d] border border-[#324a3f] text-[#fde047] cursor-pointer"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  aria-label="Reset Map View"
                  title="Reset View"
                  className="p-1.5 bg-[#16221d] hover:bg-[#22352d] border border-[#324a3f] text-[#dce7e0] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <svg
              viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-auto block cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: 'none' }}
            >
              {/* 5 Region Polygons with Discovery Fog */}
              {REGION_ZONES.map((z) => {
                const visited = visitedRegions.includes(z.id);
                const locked = z.id === 'core' && !coreGateUnlocked;
                return (
                  <g key={z.id}>
                    <rect
                      x={z.x + 0.5}
                      y={z.y + 0.5}
                      width={z.w - 1}
                      height={z.h - 1}
                      fill={visited ? z.fill : '#111815'}
                      fillOpacity={visited ? 0.94 : 0.92}
                      stroke={visited ? REGION_META[z.id].paletteAccent : '#2a3a32'}
                      strokeOpacity={visited ? 0.65 : 0.45}
                      strokeDasharray={visited ? undefined : '1.8 1.4'}
                      strokeWidth="0.6"
                    />
                    <text
                      x={z.x + z.w / 2}
                      y={z.y + 5.8}
                      textAnchor="middle"
                      fill={visited ? '#f3efe2' : '#6c8075'}
                      fontSize="3.1"
                      fontFamily="'Chakra Petch', sans-serif"
                      fontWeight="700"
                    >
                      {visited ? REGION_META[z.id].name : 'Undiscovered Region'}
                    </text>
                    {locked && (
                      <text
                        x={z.x + z.w / 2}
                        y={z.y + 10.4}
                        textAnchor="middle"
                        fill="#f59e0b"
                        fontSize="2.2"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        SEALED ({nonCoreRestored}/{CORE_RELAYS_REQUIRED} RELAYS)
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Main Roads & Forest River */}
              <path
                d="M21 62 V8 M6 22 H108 M21 62 H66 V22 M66 60 H108"
                stroke="#99876d"
                strokeWidth="1.2"
                strokeOpacity="0.45"
                fill="none"
              />
              <path
                d="M50 42 Q52 55 50 66 T51 83"
                stroke="#3b82b8"
                strokeWidth="2.1"
                strokeOpacity="0.7"
                fill="none"
              />

              {/* Discovered Landmarks ONLY (no spoilers) */}
              {landmarks
                .filter((l) => l.discovered)
                .map((l) => (
                  <circle
                    key={l.id}
                    cx={(l.x / (WORLD_W * TILE_SIZE)) * 120}
                    cy={(l.y / (WORLD_H * TILE_SIZE)) * 84}
                    r="1.15"
                    fill="#d4d9cf"
                    fillOpacity="0.75"
                  >
                    <title>{l.name}</title>
                  </circle>
                ))}

              {/* Discovered NPCs */}
              {visibleNpcs.map((npc) => (
                <circle
                  key={npc.id}
                  cx={(npc.x / (WORLD_W * TILE_SIZE)) * 120}
                  cy={(npc.y / (WORLD_H * TILE_SIZE)) * 84}
                  r="1.2"
                  fill="#86efac"
                  stroke="#0b110f"
                  strokeWidth="0.4"
                >
                  <title>
                    {npc.name} ({npc.role})
                  </title>
                </circle>
              ))}

              {/* Visible World Restoration Relays */}
              {visibleNodes.map((n) => {
                const nx = (n.x / (WORLD_W * TILE_SIZE)) * 120;
                const ny = (n.y / (WORLD_H * TILE_SIZE)) * 84;
                return (
                  <g key={n.id}>
                    <polygon
                      points={`${nx},${ny - 2.2} ${nx + 2.2},${ny} ${nx},${ny + 2.2} ${nx - 2.2},${ny}`}
                      fill={n.restored ? '#4cd3c2' : '#e5a84b'}
                      stroke="#0c1210"
                      strokeWidth="0.45"
                    >
                      <title>
                        {n.name} — {n.restored ? 'Restored' : 'Needs Restoration'}
                      </title>
                    </polygon>
                  </g>
                );
              })}

              {/* Discovered Regional Teleporter Gateways */}
              {teleporters
                .filter((tp) => tp.discovered)
                .map((tp) => {
                  const tx = (tp.x / (WORLD_W * TILE_SIZE)) * 120;
                  const ty = (tp.y / (WORLD_H * TILE_SIZE)) * 84;
                  return (
                    <g key={tp.id}>
                      <circle
                        cx={tx}
                        cy={ty}
                        r="2.4"
                        fill={tp.activated ? tp.accentColor : '#334155'}
                        fillOpacity={tp.activated ? 0.35 : 0.4}
                        stroke={tp.activated ? tp.accentColor : '#94a3b8'}
                        strokeWidth="0.65"
                      >
                        <title>
                          {tp.name} — {tp.activated ? 'Activated Gateway' : 'Locked Gateway'}
                        </title>
                      </circle>
                      <circle
                        cx={tx}
                        cy={ty}
                        r="0.9"
                        fill={tp.activated ? '#ffffff' : '#94a3b8'}
                      />
                    </g>
                  );
                })}

              {/* Active Quest Objective Markers */}
              {questPins.map((pin) => (
                <g key={pin.id}>
                  <circle
                    cx={pin.x}
                    cy={pin.y}
                    r="3.1"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="0.65"
                  >
                    <title>{pin.label}</title>
                  </circle>
                </g>
              ))}

              {/* Player Live Position Marker */}
              <circle cx={px} cy={py} r="2.7" fill="#ffffff" fillOpacity="0.28" />
              <circle cx={px} cy={py} r="1.5" fill="#fde047" stroke="#0c1210" strokeWidth="0.5">
                <title>Your Current Position</title>
              </circle>
            </svg>

            {/* Legend */}
            <div className="mt-2.5 px-2 flex flex-wrap items-center gap-3.5 text-[11px] text-[#b4c4b9]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fde047] inline-block" /> You
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#4cd3c2] rotate-45 inline-block" /> Restored
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#e5a84b] rotate-45 inline-block" /> Needs Repair
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#86efac] inline-block" /> Survivor
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#facc15] inline-block" />{' '}
                Active Quest
              </span>
            </div>
          </div>

          {/* Right Column: Fast Travel & Discovered Locations */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#0f1714] border border-[#293830] p-3.5">
              <h3 className="font-display text-sm font-bold text-[#5eead4] mb-2">
                Gateway &amp; Relay Fast Travel
              </h3>
              {activatedTeleporters.length === 0 && fastTravelNodes.length === 0 ? (
                <p className="text-xs text-[#91a699]">
                  Activate regional Teleporter Gateways or restore world relays to unlock instant
                  fast travel.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activatedTeleporters.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => onFastTravel(tp.id)}
                      className="w-full px-3 py-2 text-left bg-[#132927] hover:bg-[#1c3d39] border border-[#3c7a72] text-xs font-semibold text-[#e6f7f5] flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{tp.name}</span>
                      <span className="text-[11px] text-[#5eead4] shrink-0 ml-2">Gate</span>
                    </button>
                  ))}
                  {fastTravelNodes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onFastTravel(n.id)}
                      className="w-full px-3 py-2 text-left bg-[#172620] hover:bg-[#22382f] border border-[#355447] text-xs font-semibold text-[#e6f2ec] flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{n.name}</span>
                      <span className="text-[11px] text-[#e6b865] shrink-0 ml-2">Relay</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#0f1714] border border-[#293830] p-3.5 flex-1 overflow-y-auto max-h-60">
              <h3 className="font-display text-sm font-bold text-[#e6b865] mb-2">
                Discovered Landmarks ({landmarks.filter((l) => l.discovered).length}/
                {landmarks.length})
              </h3>
              <ul className="space-y-1.5 text-xs">
                {landmarks
                  .filter((l) => l.discovered)
                  .map((l) => (
                    <li
                      key={l.id}
                      className="text-[#d3ded6] flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{l.name}</span>
                      <span className="text-[11px] text-[#8ea396] shrink-0">
                        {REGION_META[l.region].name.replace('The ', '')}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

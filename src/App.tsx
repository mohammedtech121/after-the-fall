import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, RotateCw } from 'lucide-react';
import { DialogueModal } from './components/DialogueModal';
import { GameHud } from './components/GameHud';
import { InventoryModal } from './components/InventoryModal';
import { MobileControls } from './components/MobileControls';
import { OutcomeModal, PauseModal } from './components/PauseAndOutcomeModals';
import { QuestJournalModal } from './components/QuestJournalModal';
import { SkillTreeModal } from './components/SkillTreeModal';
import { TeleporterModal } from './components/TeleporterModal';
import { TitleScreen } from './components/TitleScreen';
import { TutorialModal } from './components/TutorialModal';
import { WeaponWorkbenchModal } from './components/WeaponWorkbenchModal';
import { WorldMapModal } from './components/WorldMapModal';
import { WorldTravelModal } from './components/WorldTravelModal';
import { GameEngine } from './game/engine';
import {
  enterFullscreenAndLandscape,
  isFullscreenActive,
  isFullscreenSupported,
  toggleFullscreen,
  tryLockLandscapeOrientation,
} from './game/mobileDisplay';
import {
  DEFAULT_SETTINGS,
  hasCompletedTutorial,
  listSaveSlots,
  markTutorialCompleted,
  resolveEffectiveControlMode,
  shouldShowRotateOverlay,
} from './game/rules';
import {
  ActiveOverlay,
  GameMode,
  GameSettings,
  HudSnapshot,
  NpcEntity,
  SaveSlotId,
  SaveSlotMeta,
  TeleporterStation,
  TeleportTransitionState,
  ToastMessage,
} from './game/types';

function detectCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const touchPts = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  return coarse || touchPts;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [mode, setMode] = useState<GameMode>('title');
  const [overlay, setOverlay] = useState<ActiveOverlay>('none');
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [activeNpc, setActiveNpc] = useState<NpcEntity | null>(null);
  const [activeTeleporter, setActiveTeleporter] = useState<TeleporterStation | null>(null);
  const [teleportTransition, setTeleportTransition] =
    useState<TeleportTransitionState | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlotMeta[]>(() =>
    listSaveSlots()
      .map((s) => s.meta)
      .filter((m): m is SaveSlotMeta => m !== null)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS });
  const [tutorialFirstTime, setTutorialFirstTime] = useState(false);
  const [pauseTutorialOpen, setPauseTutorialOpen] = useState(false);

  const refreshSaveSlots = useCallback(() => {
    const metas = listSaveSlots()
      .map((s) => s.meta)
      .filter((m): m is SaveSlotMeta => m !== null)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    setSaveSlots(metas);
  }, []);

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 720
  );
  const [isCoarsePointer, setIsCoarsePointer] = useState(detectCoarsePointer);
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const fullscreenSupported = isFullscreenSupported();

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
      setIsCoarsePointer(detectCoarsePointer());
    };
    const onFsChange = () => {
      setIsFullscreen(isFullscreenActive());
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const effectiveControlMode = resolveEffectiveControlMode(
    settings.controlMode,
    isCoarsePointer,
    viewportWidth
  );

  const showRotateOverlay = shouldShowRotateOverlay({
    isMobileDevice: effectiveControlMode === 'mobile',
    mode,
    width: viewportWidth,
    height: viewportHeight,
    dismissed: rotateDismissed,
  });

  // Mount GameEngine once so React HUD updates never tear down or lag the 60fps loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onToast: (toast) => {
        setToasts((prev) => [...prev.slice(-3), toast]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 3800);
      },
      onOpenDialogue: (npc) => {
        setActiveNpc(npc);
      },
      onOpenTeleporter: (tp) => {
        setActiveTeleporter(tp);
      },
      onTeleportTransition: (state) => {
        setTeleportTransition(state);
      },
      onOpenOverlay: (ov) => {
        setOverlay(ov);
        if (ov === 'load_game' || ov === 'teleporter' || ov === 'none') {
          refreshSaveSlots();
        }
      },
      onModeChange: (nextMode) => {
        setMode(nextMode);
        if (nextMode === 'title' || nextMode === 'paused') {
          refreshSaveSlots();
        }
        if (nextMode !== 'paused') {
          setPauseTutorialOpen(false);
        }
      },
    });

    engineRef.current = engine;
    setSettings(engine.getSettings());

    // Support ?autostart=1 query param for direct launch / automated testing
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startNewGame();
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<GameSettings>) => {
    engineRef.current?.updateSettings(patch);
    if (engineRef.current) {
      setSettings(engineRef.current.getSettings());
    }
  }, []);

  const handleNewGame = useCallback(() => {
    if (effectiveControlMode === 'mobile') {
      void tryLockLandscapeOrientation();
    }
    engineRef.current?.startNewGame();
    if (!hasCompletedTutorial()) {
      setTutorialFirstTime(true);
      engineRef.current?.setOverlay('tutorial');
    }
  }, [effectiveControlMode]);

  const handleContinue = useCallback(() => {
    if (effectiveControlMode === 'mobile') {
      void tryLockLandscapeOrientation();
    }
    engineRef.current?.loadSavedGame();
    refreshSaveSlots();
  }, [effectiveControlMode, refreshSaveSlots]);

  const handleLoadSlot = useCallback(
    (slotId: SaveSlotId) => {
      if (effectiveControlMode === 'mobile') {
        void tryLockLandscapeOrientation();
      }
      engineRef.current?.loadSavedGame(slotId);
      refreshSaveSlots();
    },
    [effectiveControlMode, refreshSaveSlots]
  );

  const handleToggleFullscreen = useCallback(() => {
    void toggleFullscreen(rootRef.current, effectiveControlMode === 'mobile').then((active) => {
      setIsFullscreen(active);
    });
  }, [effectiveControlMode]);

  const handleEnterFullscreenLandscape = useCallback(() => {
    void enterFullscreenAndLandscape(rootRef.current, true).then(({ fullscreen }) => {
      setIsFullscreen(fullscreen);
      if (window.innerWidth >= window.innerHeight) {
        setRotateDismissed(false);
      }
    });
  }, []);

  const handleSaveSlot = useCallback(
    (slotId: SaveSlotId): boolean => {
      const ok = engineRef.current?.saveGame(slotId) ?? false;
      refreshSaveSlots();
      return ok;
    },
    [refreshSaveSlots]
  );

  const handleDeleteSlot = useCallback(
    (slotId: SaveSlotId) => {
      engineRef.current?.deleteSlot(slotId);
      refreshSaveSlots();
    },
    [refreshSaveSlots]
  );

  const handleOpenOverlay = useCallback((ov: ActiveOverlay) => {
    engineRef.current?.setOverlay(ov);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    if (tutorialFirstTime) {
      markTutorialCompleted();
      setTutorialFirstTime(false);
    }
    if (pauseTutorialOpen) {
      setPauseTutorialOpen(false);
      return;
    }
    engineRef.current?.setOverlay('none');
  }, [tutorialFirstTime, pauseTutorialOpen]);

  const handleReopenTutorialFromTitle = useCallback(() => {
    setTutorialFirstTime(false);
    engineRef.current?.setOverlay('tutorial');
  }, []);

  const handleReopenTutorialFromPause = useCallback(() => {
    setTutorialFirstTime(false);
    setPauseTutorialOpen(true);
  }, []);

  const worldOverview =
    (overlay === 'map' || overlay === 'travel' || overlay === 'teleporter') && engineRef.current
      ? engineRef.current.getWorldOverview()
      : null;
  const progression =
    (overlay === 'workbench' || overlay === 'skills') && engineRef.current
      ? engineRef.current.getProgressionState()
      : null;
  const currentTeleporter =
    overlay === 'teleporter' && engineRef.current
      ? engineRef.current.getActiveTeleporter() ?? activeTeleporter
      : activeTeleporter;
  const quests =
    (overlay === 'quests' || overlay === 'dialogue') && engineRef.current
      ? engineRef.current.getQuests()
      : [];

  return (
    <main
      ref={rootRef}
      className="relative w-screen h-dvh overflow-hidden bg-[#0e1311] select-none"
    >
      {/* Isolated Full-Viewport 60fps Pixel-Art Game Canvas */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          filter:
            Math.abs(settings.brightness - 1) > 0.01
              ? `brightness(${settings.brightness})`
              : undefined,
        }}
      >
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          className="w-full h-full block pixel-canvas cursor-crosshair"
        />
      </div>

      {/* Title Screen */}
      {mode === 'title' && (
        <TitleScreen
          hasSave={saveSlots.length > 0 || (hud?.hasSave ?? false)}
          saveSlots={saveSlots}
          overlay={overlay}
          settings={settings}
          effectiveControlMode={effectiveControlMode}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onLoadSlot={handleLoadSlot}
          onDeleteSlot={handleDeleteSlot}
          onOpenOverlay={handleOpenOverlay}
          onOpenTutorial={handleReopenTutorialFromTitle}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Active Playing Perimeter HUD */}
      {mode === 'playing' && hud && (
        <GameHud
          hud={hud}
          toasts={toasts}
          isMobileLayout={effectiveControlMode === 'mobile'}
          fullscreenSupported={fullscreenSupported}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenOverlay={handleOpenOverlay}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onPause={() => engineRef.current?.setMode('paused')}
        />
      )}

      {/* Mobile Touch Controls (Separate from Desktop — shown only when mobile layout active) */}
      {mode === 'playing' &&
        overlay === 'none' &&
        effectiveControlMode === 'mobile' &&
        hud && (
          <MobileControls
            prompt={hud.prompt}
            pulseReady={hud.pulseReady}
            heavyReady={true}
            energyStrikeReady={hud.energyStrikeReady}
            energy={hud.energy}
            canCycleWeapon={hud.unlockedWeapons.length > 1}
            onMove={(dx, dy, sprinting) =>
              engineRef.current?.setVirtualMove(dx, dy, sprinting)
            }
            onAttack={() => engineRef.current?.triggerAttack()}
            onHeavyAttack={() => engineRef.current?.triggerHeavyAttack()}
            onEnergyStrike={() => engineRef.current?.triggerEnergyStrike()}
            onDodge={() => engineRef.current?.triggerDodge()}
            onInteract={() => engineRef.current?.triggerInteract()}
            onPulse={() => engineRef.current?.triggerPulse()}
            onCycleWeapon={() => engineRef.current?.cycleWeapon()}
          />
        )}

      {/* Non-Blocking Mobile Portrait -> Landscape Guidance Overlay */}
      {showRotateOverlay && (
        <div
          data-testid="rotate-landscape-overlay"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#09100d]/92 backdrop-blur-sm p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Rotate Device to Landscape"
        >
          <div className="w-full max-w-sm bg-[#121b17] border border-[#456657] p-6 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 bg-[#152822] border border-[#4cd3c2] flex items-center justify-center text-[#5eead4]">
              <RotateCw className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-[#f3efe2]">
              Rotate to Landscape
            </h2>
            <p className="text-xs text-[#bfd0c5] mt-2 leading-relaxed">
              After the Fall is built for horizontal widescreen play. Turn your phone sideways for
              full visibility and comfortable thumb controls.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {fullscreenSupported && (
                <button
                  type="button"
                  onClick={handleEnterFullscreenLandscape}
                  className="w-full py-2.5 px-4 font-display text-xs font-bold uppercase tracking-wider bg-[#4cd3c2] hover:bg-[#6ae3d4] text-[#0c1613] border border-[#99f6e4] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  Enter Full-Screen Landscape
                </button>
              )}
              <button
                type="button"
                data-testid="dismiss-rotate-btn"
                onClick={() => setRotateDismissed(true)}
                className="w-full py-2 px-4 text-xs font-semibold text-[#d4ded7] bg-[#1a2621] hover:bg-[#24342d] border border-[#3a5044] cursor-pointer"
              >
                Continue in Portrait Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-Time & Reopenable Control Tutorial Modal */}
      {(overlay === 'tutorial' || (mode === 'paused' && pauseTutorialOpen)) && (
        <TutorialModal
          initialLayout={effectiveControlMode}
          isFirstTime={tutorialFirstTime}
          onStartAdventure={handleCloseTutorial}
          onSkip={handleCloseTutorial}
        />
      )}

      {/* In-Game Overlays */}
      {mode === 'playing' && overlay === 'dialogue' && activeNpc && hud && (
        <DialogueModal
          npc={activeNpc}
          inventory={hud.inventory}
          gold={hud.gold}
          quests={quests}
          regionRestored={
            engineRef.current
              ?.getWorldOverview()
              .restorationNodes.some((n) => n.region === activeNpc.region && n.restored) ?? false
          }
          blacksmithUnlocked={hud.blacksmithUnlocked}
          onTrade={(offer) => engineRef.current?.executeTrade(offer) ?? 'Unavailable'}
          onReturnBlacksmithHammer={() =>
            engineRef.current?.returnBlacksmithHammer() ?? { ok: false, message: 'Unavailable' }
          }
          onOpenBlacksmithWorkshop={() => handleOpenOverlay('workbench')}
          onOpenJournal={() => handleOpenOverlay('quests')}
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {mode === 'playing' && overlay === 'inventory' && hud && (
        <InventoryModal
          inventory={hud.inventory}
          gold={hud.gold}
          equippedArmourName={hud.equippedArmourName}
          defense={hud.defense}
          upgrades={hud.upgrades}
          onUseItem={(id) => engineRef.current?.useItem(id) ?? ''}
          onCraft={(rid) => engineRef.current?.craft(rid) ?? ''}
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {mode === 'playing' && overlay === 'map' && worldOverview && (
        <WorldMapModal
          restorationNodes={worldOverview.restorationNodes}
          teleporters={worldOverview.teleporters}
          landmarks={worldOverview.landmarks}
          npcs={worldOverview.npcs}
          quests={worldOverview.quests}
          talkedNpcIds={worldOverview.talkedNpcIds}
          visitedRegions={worldOverview.visitedRegions}
          coreGateUnlocked={worldOverview.coreGateUnlocked}
          playerX={worldOverview.playerX}
          playerY={worldOverview.playerY}
          onFastTravel={(nodeId) => engineRef.current?.fastTravelToNode(nodeId)}
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {mode === 'playing' && overlay === 'quests' && hud && (
        <QuestJournalModal
          quests={quests}
          unlockedAchievements={hud.stats.unlockedAchievements}
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {mode === 'playing' && overlay === 'workbench' && progression && hud && (
        <WeaponWorkbenchModal
          equippedWeapon={progression.equippedWeapon}
          unlockedWeapons={progression.unlockedWeapons}
          weaponUpgrades={progression.weaponUpgrades}
          equippedArmour={progression.equippedArmour}
          unlockedArmour={progression.unlockedArmour}
          armourUpgrades={progression.armourUpgrades}
          gold={progression.gold}
          defense={progression.defense}
          backpackUsedSlots={hud.backpackUsedSlots}
          backpackMaxSlots={hud.backpackMaxSlots}
          playerLevel={progression.level}
          inventory={progression.inventory}
          stats={progression.stats}
          onEquipWeapon={(wid) => engineRef.current?.equipWeapon(wid) ?? false}
          onForgeWeapon={(wid) =>
            engineRef.current?.forgeWeapon(wid) ?? { ok: false, message: 'Unavailable' }
          }
          onUpgradeWeapon={(wid, stat) =>
            engineRef.current?.upgradeWeapon(wid, stat) ?? { ok: false, message: 'Unavailable' }
          }
          onEquipArmour={(aid) => engineRef.current?.equipArmour(aid) ?? false}
          onCraftArmour={(aid) =>
            engineRef.current?.craftArmour(aid) ?? { ok: false, message: 'Unavailable' }
          }
          onUpgradeArmour={(aid) =>
            engineRef.current?.upgradeArmour(aid) ?? { ok: false, message: 'Unavailable' }
          }
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {mode === 'playing' && overlay === 'skills' && progression && (
        <SkillTreeModal
          level={progression.level}
          xp={progression.xp}
          nextLevelXp={progression.nextLevelXp}
          skillPoints={progression.skillPoints}
          skills={progression.skills}
          onLearnSkill={(sid) =>
            engineRef.current?.learnSkill(sid) ?? { ok: false, message: 'Unavailable' }
          }
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {mode === 'playing' && overlay === 'teleporter' && currentTeleporter && hud && worldOverview && (
        <TeleporterModal
          station={currentTeleporter}
          inventory={hud.inventory}
          playerEnergy={hud.energy}
          coreGateUnlocked={worldOverview.coreGateUnlocked}
          havenActivated={
            worldOverview.teleporters.some((t) => t.id === 'tp_haven' && t.activated)
          }
          saveSlots={saveSlots}
          onActivate={(id) =>
            engineRef.current?.activateTeleporter(id) ?? { ok: false, message: 'Unavailable' }
          }
          onOpenWorldTravel={() => handleOpenOverlay('travel')}
          onReturnToHaven={() =>
            engineRef.current?.returnToHaven() ?? { ok: false, message: 'Unavailable' }
          }
          onSaveToSlot={handleSaveSlot}
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {mode === 'playing' && overlay === 'travel' && worldOverview && hud && (
        <WorldTravelModal
          teleporters={worldOverview.teleporters}
          currentRegion={hud.region}
          onTravel={(destId) =>
            engineRef.current?.travelToTeleporter(destId) ?? { ok: false, message: 'Unavailable' }
          }
          onReturnToHaven={() =>
            engineRef.current?.returnToHaven() ?? { ok: false, message: 'Unavailable' }
          }
          onClose={() => handleOpenOverlay('none')}
        />
      )}

      {/* Teleportation Warp Transition Banner */}
      {teleportTransition && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07110f]/90 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
          role="status"
          aria-live="polite"
        >
          <div className="w-14 h-14 rounded-full border-2 border-[#5eead4] border-t-transparent animate-spin mb-4" />
          <p className="text-xs font-mono-num uppercase tracking-[0.28em] text-[#5eead4]">
            {teleportTransition.phase === 'in'
              ? 'Synchronizing Gateway'
              : teleportTransition.phase === 'hold'
                ? 'Traversing Network'
                : 'Arriving'}
          </p>
          <h2 className="font-display text-2xl font-bold text-[#f3efe2] mt-1">
            {teleportTransition.destinationName}
          </h2>
          <p className="text-xs text-[#9eb5a6] mt-0.5">{teleportTransition.destinationRegionName}</p>
        </div>
      )}

      {/* Pause Modal */}
      {mode === 'paused' && !pauseTutorialOpen && (
        <PauseModal
          settings={settings}
          effectiveControlMode={effectiveControlMode}
          saveSlots={saveSlots}
          onResume={() => engineRef.current?.setMode('playing')}
          onSaveSlot={handleSaveSlot}
          onLoadSlot={handleLoadSlot}
          onDeleteSlot={handleDeleteSlot}
          onOpenInventory={() => {
            engineRef.current?.setMode('playing');
            engineRef.current?.setOverlay('inventory');
          }}
          onOpenTutorial={handleReopenTutorialFromPause}
          onUpdateSettings={handleUpdateSettings}
          onMainMenu={() => {
            engineRef.current?.setOverlay('none');
            engineRef.current?.setMode('title');
          }}
        />
      )}

      {/* Victory / Defeat Modal */}
      {(mode === 'victory' || mode === 'gameover') && hud && (
        <OutcomeModal
          victory={mode === 'victory'}
          stats={hud.stats}
          hasSave={hud.hasSave}
          respawnCheckpointName={hud.respawnCheckpointName}
          onRespawn={() => engineRef.current?.respawnAtCheckpoint()}
          onRestart={handleNewGame}
          onLoadSave={handleContinue}
          onContinueExploring={() => engineRef.current?.continueAfterVictory()}
          onMainMenu={() => {
            engineRef.current?.setOverlay('none');
            engineRef.current?.setMode('title');
          }}
        />
      )}
    </main>
  );
}

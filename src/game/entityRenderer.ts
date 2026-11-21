import { getWeaponLevel, WEAPON_CATALOG } from './combat';
import { getBossDefeatState } from './rules';
import {
  CampfireProp,
  CollectibleNode,
  EnemyEntity,
  NpcEntity,
  PlayerState,
  PortalDoor,
  Projectile,
  RestorationNode,
  TeleporterStation,
  VisualEffectsQuality,
  WeaponId,
  WorkbenchProp,
} from './types';

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  ring?: boolean;
}

function drawPixelSword(
  ctx: CanvasRenderingContext2D,
  weaponId: WeaponId,
  weaponLevel: number,
  time: number,
  vfxQuality: VisualEffectsQuality,
  energyFlare = 0
): void {
  const pulse = 0.72 + Math.sin(time * 7) * 0.28;
  const evolved = weaponLevel >= 4;
  const master = weaponLevel >= 8;

  ctx.save();
  // Origin (0, 0) = center of the hand grip. Pommel extends -X, crossguard & blade extend +X.
  // Proportions are intentionally grounded (13px–18px blade) to fit our RPG hero naturally.
  if (weaponId === 'scrap_blade') {
    // Pommel & leather-wrapped handle
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, -1.5, 2, 3);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(-3, -1.2, 5, 2.4);
    // Rugged riveted iron guard
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1.5, -4, 3, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(2, -3.5, 2, 7);
    // Salvaged steel blade with notch & bevel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, -2.6, 12.5, 5.2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(4, -2, 11.5, 4);
    ctx.fillStyle = evolved ? '#f8fafc' : '#e2e8f0';
    ctx.fillRect(4, -2, 12, 1.4);
    // Salvage notch
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, 1, 2, 1);
    // Tapered tip
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(15.5, -1, 2, 2);
    if (master && vfxQuality !== 'low') {
      ctx.fillStyle = `rgba(248, 250, 252, ${pulse * 0.5})`;
      ctx.fillRect(5, -2.5, 11, 1);
    }
  } else if (weaponId === 'reinforced_sword') {
    // Brass pommel & dark leather grip
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5, -1.8, 2, 3.6);
    ctx.fillStyle = '#47311e';
    ctx.fillRect(-3, -1.2, 5, 2.4);
    // Brass crossguard
    ctx.fillStyle = '#78350f';
    ctx.fillRect(1.5, -4.5, 3, 9);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(2, -4, 2, 8);
    // Tempered steel broad blade with central fuller
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, -2.8, 13.5, 5.6);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(4, -2.2, 12.5, 4.4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4, -2.2, 13, 1.5);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(5.5, -0.4, 8.5, 0.9);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(16.5, -1.2, 2.2, 2.4);
    if (evolved && vfxQuality !== 'low') {
      ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.55})`;
      ctx.fillRect(4.5, -2.8, 12, 1);
    }
  } else if (weaponId === 'pulse_blade') {
    // Gunmetal emitter hilt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, -1.6, 7, 3.2);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(1.5, -4, 2.5, 8);
    // Subtle plasma halo
    if (vfxQuality !== 'low') {
      ctx.fillStyle = `rgba(45, 212, 191, ${0.24 * pulse + (evolved ? 0.14 : 0)})`;
      ctx.fillRect(3.5, -3.8, 15.5, 7.6);
    }
    // Glowing cyan energy edge + bright spine
    ctx.fillStyle = '#0891b2';
    ctx.fillRect(4, -2.2, 14, 4.4);
    ctx.fillStyle = '#5eead4';
    ctx.fillRect(4.5, -1.2, 13.5, 2.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5.5, -0.5, 12.5, 1);
    ctx.fillStyle = '#ccfbf1';
    ctx.fillRect(18, -1, 1.8, 2);
  } else if (weaponId === 'ancient_blade') {
    // Carved obsidian hilt with violet crystal pommel
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-5.5, -1.6, 2, 3.2);
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(-3.5, -1.3, 5.5, 2.6);
    // Runic cyan crossguard
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(1.5, -4.8, 2.5, 9.6);
    if (vfxQuality !== 'low') {
      ctx.fillStyle = `rgba(168, 85, 247, ${0.25 * pulse + (evolved ? 0.15 : 0)})`;
      ctx.fillRect(3.5, -4.2, 16, 8.4);
    }
    // Dark obsidian blade with violet edge & cyan rune inlays
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(4, -2.6, 14, 5.2);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(4, -2.6, 14.5, 1.1);
    ctx.fillRect(4, 1.5, 14.5, 1.1);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(6.5, -0.8, 2, 1.6);
    ctx.fillRect(10.5, -0.8, 2, 1.6);
    ctx.fillRect(14.5, -0.8, 2, 1.6);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(18, -1.2, 2, 2.4);
  } else if (weaponId === 'scrap_axe' || weaponId === 'foundry_greataxe') {
    const isGreat = weaponId === 'foundry_greataxe';
    // Sturdy ashwood / iron-bound axe haft
    ctx.fillStyle = '#291a10';
    ctx.fillRect(-5, -1.5, 20, 3);
    ctx.fillStyle = isGreat ? '#52525b' : '#7c4a26';
    ctx.fillRect(-4, -1, 18.5, 2);
    // Double/Single heavy bearded axe head
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8.5, isGreat ? -7.5 : -6.5, 7.8, isGreat ? 15 : 10.5);
    ctx.fillStyle = isGreat ? '#c2410c' : '#94a3b8';
    ctx.fillRect(9.5, isGreat ? -6.5 : -5.5, 5.8, isGreat ? 13 : 8.5);
    // Honed cutting edge
    ctx.fillStyle = isGreat ? '#fdba74' : '#f1f5f9';
    ctx.fillRect(14.5, isGreat ? -6.5 : -5.5, 1.8, isGreat ? 13 : 8.5);
    if (isGreat && vfxQuality !== 'low') {
      ctx.fillStyle = `rgba(251, 146, 60, ${0.42 * pulse})`;
      ctx.fillRect(11, -4.5, 3, 9);
    }
  } else if (weaponId === 'hunter_bow' || weaponId === 'arc_longbow') {
    const isArc = weaponId === 'arc_longbow';
    // Curved bow limbs centered on grip
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1, -8, 3, 16);
    ctx.fillStyle = isArc ? '#0e7490' : '#784824';
    ctx.fillRect(2, -7.5, 2.4, 15);
    // Upper & lower curved tips
    ctx.fillStyle = isArc ? '#22d3ee' : '#b45309';
    ctx.fillRect(-1.5, -8.5, 4.5, 2.2);
    ctx.fillRect(-1.5, 6.3, 4.5, 2.2);
    // Taut bowstring
    ctx.fillStyle = isArc ? '#a5f3fc' : '#e2e8f0';
    ctx.fillRect(-1.5, -7, 1, 14);
    // Nocked arrow shaft & arrowhead
    ctx.fillStyle = isArc ? '#67e8f9' : '#d6b384';
    ctx.fillRect(-1.5, -0.7, 10.5, 1.4);
    ctx.fillStyle = isArc ? '#ffffff' : '#cbd5e1';
    ctx.fillRect(8.5, -1.6, 2.5, 3.2);
    if (isArc && vfxQuality !== 'low') {
      ctx.fillStyle = `rgba(56, 189, 248, ${0.32 * pulse})`;
      ctx.fillRect(0.5, -7.5, 4, 15);
    }
  } else {
    // COREBLADE — Compact, radiant twin-pronged harmonic sword
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-5.5, -1.8, 2, 3.6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3.5, -1.3, 5.5, 2.6);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(1.5, -5, 2.5, 10);
    if (vfxQuality !== 'low') {
      ctx.fillStyle = `rgba(94, 234, 212, ${0.28 * pulse})`;
      ctx.fillRect(3.5, -4.6, 17, 9.2);
    }
    // Twin cyan harmonic prongs + golden energy core
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(4, -2.8, 14.5, 1.5);
    ctx.fillRect(4, 1.3, 14.5, 1.5);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(4, -1.1, 15.5, 2.2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5.5, -0.5, 14, 1);
    ctx.fillStyle = '#a5f3fc';
    ctx.fillRect(18.5, -1.5, 2.2, 3);
    if (vfxQuality === 'high') {
      const orbX = 11 + Math.cos(time * 9) * 4.5;
      const orbY = Math.sin(time * 9) * 3.2;
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(orbX - 1, orbY - 1, 2, 2);
    }
  }

  // Energy attack / charged blade flare
  if (energyFlare > 0 && vfxQuality !== 'low') {
    ctx.fillStyle = `rgba(103, 232, 249, ${Math.min(0.8, energyFlare * 0.75)})`;
    ctx.fillRect(3, -3.5, 16, 7);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.9, energyFlare * 0.85)})`;
    ctx.fillRect(5, -1.2, 13, 2.4);
  }
  ctx.restore();
}

/**
 * Draws the connected sword-arm (sleeve + leather bracer), the sword gripped cleanly
 * inside the hand, and the hand's fingers wrapped OVER the hilt so the weapon never floats.
 */
function drawSwordArmAndWeapon(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  shoulderY: number,
  handX: number,
  handY: number,
  swordAngle: number,
  weaponId: WeaponId,
  weaponLevel: number,
  time: number,
  vfxQuality: VisualEffectsQuality,
  flash: boolean,
  energyFlare: number
): void {
  const dx = handX - shoulderX;
  const dy = handY - shoulderY;
  const armAngle = Math.atan2(dy, dx);
  const armLen = Math.max(4, Math.hypot(dx, dy));

  // 1. Connected upper sleeve + leather forearm bracer from shoulder to wrist
  ctx.save();
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(armAngle);
  // Subtle dark pixel outline
  ctx.fillStyle = flash ? '#ffffff' : '#15221b';
  ctx.fillRect(-1.5, -2.6, armLen + 2.5, 5.2);
  // Coat sleeve
  ctx.fillStyle = flash ? '#ffffff' : '#35614b';
  ctx.fillRect(-1, -2, Math.max(2, armLen * 0.62), 4);
  // Sleeve highlight edge
  ctx.fillStyle = flash ? '#ffffff' : '#4a7f64';
  ctx.fillRect(-0.5, -2, Math.max(1.5, armLen * 0.55), 1.3);
  // Leather wrist bracer
  ctx.fillStyle = flash ? '#ffffff' : '#6e472b';
  ctx.fillRect(armLen * 0.52, -1.8, Math.max(2, armLen * 0.48), 3.6);
  ctx.restore();

  // 2. Sword anchored at the exact hand grip point (handX, handY)
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(swordAngle);
  drawPixelSword(ctx, weaponId, weaponLevel, time, vfxQuality, energyFlare);

  // 3. Visible gripping hand (knuckles & wrapped fingers OVER the hilt!)
  ctx.fillStyle = flash ? '#ffffff' : '#1b1410';
  ctx.fillRect(-2.4, -2.4, 4.8, 4.8);
  ctx.fillStyle = flash ? '#ffffff' : '#efc39c';
  ctx.fillRect(-1.8, -1.8, 3.6, 3.6);
  // Thumb/finger shading gripping across the handle
  ctx.fillStyle = flash ? '#ffffff' : '#d59d74';
  ctx.fillRect(-1.8, 0.4, 3.6, 1.3);
  ctx.restore();
}

/**
 * Draws the protagonist's free (off-hand) arm and clearly visible hand.
 */
function drawOffArm(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  shoulderY: number,
  handX: number,
  handY: number,
  flash: boolean
): void {
  const dx = handX - shoulderX;
  const dy = handY - shoulderY;
  const armAngle = Math.atan2(dy, dx);
  const armLen = Math.max(4, Math.hypot(dx, dy));

  ctx.save();
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(armAngle);
  ctx.fillStyle = flash ? '#ffffff' : '#15221b';
  ctx.fillRect(-1.4, -2.4, armLen + 2, 4.8);
  ctx.fillStyle = flash ? '#ffffff' : '#2c5340';
  ctx.fillRect(-1, -1.8, Math.max(2, armLen * 0.65), 3.6);
  ctx.fillStyle = flash ? '#ffffff' : '#5e3c23';
  ctx.fillRect(armLen * 0.56, -1.6, Math.max(2, armLen * 0.44), 3.2);
  ctx.restore();

  // Visible off-hand palm/fingers
  ctx.fillStyle = flash ? '#ffffff' : '#1b1410';
  ctx.fillRect(handX - 2.2, handY - 2.2, 4.4, 4.4);
  ctx.fillStyle = flash ? '#ffffff' : '#efc39c';
  ctx.fillRect(handX - 1.6, handY - 1.6, 3.2, 3.2);
  ctx.fillStyle = flash ? '#ffffff' : '#d59d74';
  ctx.fillRect(handX - 1.6, handY + 0.3, 3.2, 1.2);
}

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number,
  vfxQuality: VisualEffectsQuality = 'high'
): void {
  const speed = Math.hypot(player.vx, player.vy);
  const isMoving = speed > 8;
  const isDodging = player.dodgeTimer > 0;
  const isRunning = isMoving && player.isSprinting && !isDodging;
  const isAttacking = player.attackTimer > 0;
  const isCharging = player.isCharging && player.chargeTime > 0.08;
  const isEnergyCast = (player.energyCastTimer ?? 0) > 0;
  const isCelebrating = (player.celebrateTimer ?? 0) > 0 && !isAttacking && !isDodging;
  const isDamaged = player.hitFlashTimer > 0;

  const weaponDef = WEAPON_CATALOG[player.equippedWeapon];
  const weaponLevel = getWeaponLevel(player.weaponUpgrades[player.equippedWeapon]);

  // Crisp animation curves: ZERO stride/bobbing when standing still!
  const stridePhase = isMoving && !isDodging ? Math.sin(player.walkCycle) : 0;
  const liftPhase = isMoving && !isDodging ? Math.abs(Math.sin(player.walkCycle)) : 0;
  const strideAmp = isRunning ? 3.8 : 2.6;
  const bodyBob = isDodging
    ? 2.2
    : isMoving
      ? liftPhase * (isRunning ? 2.2 : 1.35)
      : 0;
  // Subtle forward lean when sprinting or dodging; defensive lean back on damage
  const torsoLeanX = isDodging
    ? player.dodgeDirX * 2.5
    : isDamaged
      ? player.facing === 'right'
        ? -1.5
        : player.facing === 'left'
          ? 1.5
          : 0
      : isRunning
        ? player.facing === 'right'
          ? 1.4
          : player.facing === 'left'
            ? -1.4
            : 0
        : 0;

  ctx.save();
  ctx.translate(Math.round(player.x), Math.round(player.y));

  // 1. Grounded contact shadow beneath boots
  const shadowScale = isDodging ? 0.85 : 1 - bodyBob * 0.04;
  ctx.fillStyle = 'rgba(8, 12, 10, 0.48)';
  ctx.beginPath();
  ctx.ellipse(0, 11, 9.5 * shadowScale, 4.4 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Dodge directional afterimage silhouettes
  if (isDodging && vfxQuality !== 'low') {
    for (let i = 1; i <= 2; i++) {
      const gx = -player.dodgeDirX * i * 9;
      const gy = -player.dodgeDirY * i * 9;
      ctx.save();
      ctx.globalAlpha = 0.36 - i * 0.12;
      ctx.fillStyle = weaponDef.glowColor;
      ctx.fillRect(Math.round(gx - 5), Math.round(gy - 14), 10, 19);
      ctx.fillRect(Math.round(gx - 4), Math.round(gy - 17), 8, 5);
      ctx.restore();
    }
  }

  // 3. Energy regeneration shimmer near restored relays
  if (player.energyRegenAnimTimer > 0 && vfxQuality !== 'low') {
    const a = Math.min(0.62, player.energyRegenAnimTimer * 0.78);
    ctx.strokeStyle = `rgba(94, 234, 212, ${a * (0.65 + Math.sin(time * 10) * 0.3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 9, 13 + Math.sin(time * 8) * 1.8, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Heavy charge preparation ring
  if (isCharging) {
    const ratio = Math.min(1, player.chargeTime / 0.45);
    ctx.strokeStyle = ratio >= 1 ? weaponDef.slashPrimaryColor : 'rgba(94, 234, 212, 0.78)';
    ctx.lineWidth = ratio >= 1 ? 2.8 : 1.8;
    ctx.beginPath();
    ctx.arc(0, -2, 14 + (1 - ratio) * 13, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. Arc Pulse expanding shockwave
  if (player.pulseTimer > 0) {
    const p = 1 - player.pulseTimer / 0.44;
    ctx.strokeStyle = `rgba(94, 234, 212, ${(1 - p) * 0.92})`;
    ctx.lineWidth = 4.2 * (1 - p) + 1;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + p * 108, 0, Math.PI * 2);
    ctx.stroke();

    if (vfxQuality !== 'low') {
      ctx.strokeStyle = `rgba(254, 240, 138, ${(1 - p) * 0.7})`;
      ctx.lineWidth = 2 * (1 - p) + 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 9 + p * 80, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Apply subtle squash & stretch anchored near feet
  ctx.scale(player.squashX, player.squashY);

  const flash = isDamaged;
  const facing = player.facing;

  // Compute exact shoulder pivots & dynamic hand targets so arms + sword move as ONE connected rig
  const bodyY = -bodyBob;
  const shoulderY = -5 + bodyY;

  const swordShoulderX =
    facing === 'right'
      ? 3 + torsoLeanX
      : facing === 'left'
        ? -3 + torsoLeanX
        : facing === 'up'
          ? 5.5
          : 5.5;
  const offShoulderX =
    facing === 'right'
      ? -3.5 + torsoLeanX
      : facing === 'left'
        ? 3.5 + torsoLeanX
        : -5.5;

  // Base resting sword angle & grip hand position per facing direction (supports diagonal movement subtly)
  let swordAngle: number;
  let swordHandX = swordShoulderX;
  let swordHandY = shoulderY + 5;

  if (facing === 'right') {
    swordAngle = -0.35;
    swordHandX = swordShoulderX + 4.5 + stridePhase * 1.4;
    swordHandY = shoulderY + 4.5 - Math.abs(stridePhase) * 0.8;
  } else if (facing === 'left') {
    swordAngle = Math.PI + 0.35;
    swordHandX = swordShoulderX - 4.5 - stridePhase * 1.4;
    swordHandY = shoulderY + 4.5 - Math.abs(stridePhase) * 0.8;
  } else if (facing === 'up') {
    swordAngle = -Math.PI / 2 + 0.28;
    swordHandX = swordShoulderX + 1.5;
    swordHandY = shoulderY + 3.5 - stridePhase * 1.6;
  } else {
    // Facing south (down): right hand holds sword cleanly angled down-right
    swordAngle = Math.PI * 0.36;
    swordHandX = swordShoulderX + 1.5;
    swordHandY = shoulderY + 5.2 + stridePhase * 1.6;
  }

  // Diagonal movement tilt for natural 8-way responsiveness
  if (isMoving && !isAttacking && !isCharging && !isDodging && Math.abs(player.vx) > 15 && Math.abs(player.vy) > 15) {
    const moveAng = Math.atan2(player.vy, player.vx);
    swordAngle += Math.sin(moveAng - swordAngle) * 0.18;
  }

  // Off-hand target swings opposite the legs during walking/running and stays relaxed when idle
  let offHandX =
    facing === 'right'
      ? offShoulderX - 2.5 - stridePhase * 2.2
      : facing === 'left'
        ? offShoulderX + 2.5 + stridePhase * 2.2
        : offShoulderX - 1.2;
  let offHandY =
    facing === 'down' || facing === 'up'
      ? shoulderY + 5.2 - stridePhase * 2
      : shoulderY + 4.8;

  // Override arm + sword poses for combat, charge, dodge, run, and discovery celebration
  const energyFlare = isEnergyCast
    ? (player.energyCastTimer ?? 0) / 0.28
    : isCharging
      ? Math.min(1, player.chargeTime / 0.45) * 0.7
      : 0;

  if (isAttacking) {
    const prog = 1 - player.attackTimer / Math.max(0.01, player.attackDuration);
    const arcSpan = player.attackStyle === 'basic' ? 2.15 : 2.75;
    // Ease-out swing curve for snappy martial feel
    const eased = Math.min(1, 1 - Math.pow(1 - Math.min(1, prog * 1.25), 2.2));
    swordAngle = player.attackAngle - arcSpan * 0.52 + arcSpan * eased;
    const reach = player.attackStyle === 'basic' ? 7.5 : 8.8;
    swordHandX = swordShoulderX + Math.cos(swordAngle) * reach;
    swordHandY = shoulderY + Math.sin(swordAngle) * reach;
    // Off-arm counter-balances away from swing
    offHandX = offShoulderX - Math.cos(player.attackAngle) * 4.5;
    offHandY = shoulderY + 3.5 - Math.sin(player.attackAngle) * 2.2;
  } else if (isCharging) {
    // Wind-up preparation: pull sword arm back behind shoulder!
    const pull = Math.min(1, player.chargeTime / 0.45);
    const windAngle = player.aimAngle - 1.55 * pull;
    swordAngle = windAngle;
    swordHandX = swordShoulderX + Math.cos(windAngle) * 6;
    swordHandY = shoulderY + Math.sin(windAngle) * 6;
    offHandX = offShoulderX + Math.cos(player.aimAngle) * 4;
    offHandY = shoulderY + 2.5;
  } else if (isDodging) {
    const dodgeBack = Math.atan2(-player.dodgeDirY, -player.dodgeDirX);
    swordAngle = dodgeBack + 0.35;
    swordHandX = swordShoulderX + Math.cos(dodgeBack) * 5.2;
    swordHandY = shoulderY + 3 + Math.sin(dodgeBack) * 3;
    offHandX = offShoulderX + player.dodgeDirX * 3.5;
    offHandY = shoulderY + 3.5;
  } else if (isCelebrating) {
    // Discovery / restoration victory raise!
    swordAngle = -Math.PI / 2 - 0.12;
    swordHandX = swordShoulderX + 2;
    swordHandY = shoulderY - 6.5;
    offHandX = offShoulderX - 2.5;
    offHandY = shoulderY + 2;
  } else if (player.weaponSwitchTimer > 0) {
    const spin = (player.weaponSwitchTimer / 0.26) * Math.PI * 1.25;
    swordAngle += spin;
    swordHandX = swordShoulderX + Math.cos(swordAngle) * 6;
    swordHandY = shoulderY + Math.sin(swordAngle) * 6;
  } else if (isRunning) {
    // Swept-back energetic sprint carry
    if (facing === 'right') {
      swordAngle = -0.75 + stridePhase * 0.22;
      swordHandX = swordShoulderX + 2.2 - stridePhase * 1.2;
      swordHandY = shoulderY + 4;
    } else if (facing === 'left') {
      swordAngle = Math.PI + 0.75 - stridePhase * 0.22;
      swordHandX = swordShoulderX - 2.2 + stridePhase * 1.2;
      swordHandY = shoulderY + 4;
    } else {
      swordAngle += stridePhase * 0.25;
    }
  } else if (isMoving) {
    swordAngle += stridePhase * 0.16;
  }

  // Determine natural front/back layering for arms & weapon
  const swordBehindBody =
    (facing === 'up' && (!isAttacking || Math.sin(swordAngle) < 0)) ||
    (facing === 'left' && !isAttacking && Math.cos(swordAngle) > 0.2);
  const offArmBehindBody = facing === 'right' || facing === 'left';

  if (offArmBehindBody) {
    drawOffArm(ctx, offShoulderX, shoulderY, offHandX, offHandY, flash);
  }
  if (swordBehindBody) {
    drawSwordArmAndWeapon(
      ctx,
      swordShoulderX,
      shoulderY,
      swordHandX,
      swordHandY,
      swordAngle,
      player.equippedWeapon,
      weaponLevel,
      time,
      vfxQuality,
      flash,
      energyFlare
    );
  }

  // 6. CLEARLY SEPARATED LEGS & VISIBLE BOOTS (planted when idle, alternating stride when moving)
  const leftStepY = facing === 'left' || facing === 'right' ? 0 : stridePhase * strideAmp * 0.72;
  const rightStepY = facing === 'left' || facing === 'right' ? 0 : -stridePhase * strideAmp * 0.72;
  const leftStepX = facing === 'left' || facing === 'right' ? stridePhase * strideAmp : 0;
  const rightStepX = facing === 'left' || facing === 'right' ? -stridePhase * strideAmp : 0;
  const leftLift = isMoving && !isDodging ? Math.max(0, stridePhase) * (isRunning ? 1.8 : 1.1) : 0;
  const rightLift = isMoving && !isDodging ? Math.max(0, -stridePhase) * (isRunning ? 1.8 : 1.1) : 0;

  const drawLeg = (lx: number, ly: number, isBackLeg: boolean) => {
    const trouserMain = flash ? '#ffffff' : isBackLeg ? '#243040' : '#314154';
    const trouserShade = flash ? '#ffffff' : '#1b2430';
    const bootUpper = flash ? '#ffffff' : isBackLeg ? '#3d281a' : '#593a24';
    const bootSole = flash ? '#ffffff' : '#1b120c';

    // Dark pixel outline around leg + boot so both legs stay crisp & separated
    ctx.fillStyle = flash ? '#ffffff' : '#12181c';
    ctx.fillRect(Math.round(lx - 0.5), Math.round(ly - 0.5), 4.6, 9.2);
    // Trouser thigh & shin
    ctx.fillStyle = trouserMain;
    ctx.fillRect(Math.round(lx), Math.round(ly), 3.6, 4.6);
    ctx.fillStyle = trouserShade;
    ctx.fillRect(Math.round(lx + 2.4), Math.round(ly), 1.2, 4.6);
    // Leather boot cuff & foot
    ctx.fillStyle = bootUpper;
    ctx.fillRect(Math.round(lx - 0.2), Math.round(ly + 4.4), 4, 3.2);
    // Grounded boot sole
    ctx.fillStyle = bootSole;
    ctx.fillRect(Math.round(lx - 0.4), Math.round(ly + 7.2), 4.4, 1.4);
  };

  if (facing === 'right' || facing === 'left') {
    const sideDir = facing === 'right' ? 1 : -1;
    // Draw back leg first, then front leg with a natural grounded stance split
    drawLeg(-1.8 - sideDir * 1.9 + rightStepX + torsoLeanX * 0.3, 2.5 - rightLift, true);
    drawLeg(-1.8 + sideDir * 1.8 + leftStepX + torsoLeanX * 0.3, 2.5 - leftLift, false);
  } else {
    // North/South view: clear 2px gap between left and right legs!
    drawLeg(-4.6, 2.5 + leftStepY - leftLift, false);
    drawLeg(1, 2.5 + rightStepY - rightLift, false);
  }

  // 7. ARC-DEVICE BACKPACK (visible on back when facing north, tucked at back edge on side views)
  const corePulse = 0.72 + Math.sin(time * 5) * 0.28;
  if (facing === 'left' || facing === 'right') {
    const packX = facing === 'right' ? -7.5 + torsoLeanX : 4.5 + torsoLeanX;
    ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
    ctx.fillRect(packX, -6.5 + bodyY, 3.2, 7.5);
    ctx.fillStyle = flash ? '#ffffff' : `rgba(76, 224, 210, ${corePulse})`;
    ctx.fillRect(packX + 0.8, -4.5 + bodyY, 1.6, 3.8);
  }

  // 8. TORSO (Weathered Ranger Jacket, Tunic Hem, Leather Strap & Brass Belt Buckle)
  const tx = torsoLeanX;
  // Torso outline
  ctx.fillStyle = flash ? '#ffffff' : '#131d17';
  ctx.fillRect(-6.5 + tx, -8 + bodyY, 13, 12);
  // Ranger olive-emerald jacket body
  ctx.fillStyle = flash ? '#ffffff' : '#2d5541';
  ctx.fillRect(-5.5 + tx, -7 + bodyY, 11, 10);
  // Shoulder & chest fabric highlight
  ctx.fillStyle = flash ? '#ffffff' : '#3f7359';
  ctx.fillRect(-5 + tx, -7 + bodyY, 10, 3.2);
  // Inner tunic center / cross-body leather strap
  if (facing !== 'up') {
    ctx.fillStyle = flash ? '#ffffff' : '#1f3a2c';
    ctx.fillRect(-1.2 + tx, -5.5 + bodyY, 2.4, 7.5);
    ctx.fillStyle = flash ? '#ffffff' : '#6e472b';
    ctx.fillRect(-4 + tx, -6 + bodyY, 2, 2);
    ctx.fillRect(-2 + tx, -4 + bodyY, 2, 2);
    ctx.fillRect(0 + tx, -2 + bodyY, 2, 2);
  }
  // Waist belt & brass buckle
  ctx.fillStyle = flash ? '#ffffff' : '#5e3b22';
  ctx.fillRect(-5.5 + tx, 0.2 + bodyY, 11, 2.4);
  if (facing !== 'up') {
    ctx.fillStyle = flash ? '#ffffff' : '#e8b64d';
    ctx.fillRect(-1.4 + tx, 0.3 + bodyY, 2.8, 2.2);
  }

  // Full Arc-Device pack drawn on back when facing North
  if (facing === 'up') {
    ctx.fillStyle = flash ? '#ffffff' : '#1e282e';
    ctx.fillRect(-4.8 + tx, -6.5 + bodyY, 9.6, 8.2);
    ctx.fillStyle = flash ? '#ffffff' : '#394954';
    ctx.fillRect(-4 + tx, -5.8 + bodyY, 8, 6.8);
    ctx.fillStyle = flash ? '#ffffff' : `rgba(76, 224, 210, ${corePulse})`;
    ctx.fillRect(-2.2 + tx, -4.2 + bodyY, 4.4, 3.8);
  }

  // 9. NECK & EXPLORER SCARF
  ctx.fillStyle = flash ? '#ffffff' : '#d59d74';
  ctx.fillRect(-2 + tx, -9.8 + bodyY, 4, 2.4);

  // Warm amber scarf collar
  ctx.fillStyle = flash ? '#ffffff' : '#9c521c';
  ctx.fillRect(-5.8 + tx, -8.4 + bodyY, 11.6, 2.6);
  ctx.fillStyle = flash ? '#ffffff' : '#e08d3c';
  ctx.fillRect(-5.2 + tx, -8.2 + bodyY, 10.4, 1.8);
  // Flowing scarf tail (only sways gently with breeze/motion)
  const scarfFlutter = isMoving
    ? Math.sin(player.walkCycle * 1.4) * (isRunning ? 2.4 : 1.3)
    : Math.sin(time * 2.6) * 0.5;
  const tailX = facing === 'right' ? -8.5 + tx : facing === 'left' ? 4.8 + tx : 3.8 + tx;
  ctx.fillStyle = flash ? '#ffffff' : '#c9742a';
  ctx.fillRect(tailX, -7.2 + bodyY + scarfFlutter * 0.35, 3.6, 2.6);
  ctx.fillStyle = flash ? '#ffffff' : '#f0a64f';
  ctx.fillRect(tailX + 0.5, -7 + bodyY + scarfFlutter * 0.35, 2.2, 1.2);

  // 10. HEAD, FACE & LAYERED ADVENTURER HAIR
  // Rounded pixel head outline
  ctx.fillStyle = flash ? '#ffffff' : '#1a1512';
  ctx.fillRect(-5.5 + tx, -18.5 + bodyY, 11, 9.5);
  // Skin base + warm cheek/jaw shading
  ctx.fillStyle = flash ? '#ffffff' : '#efc39c';
  ctx.fillRect(-4.6 + tx, -17.2 + bodyY, 9.2, 7.6);
  ctx.fillStyle = flash ? '#ffffff' : '#dba67e';
  ctx.fillRect(-4.6 + tx, -11.2 + bodyY, 9.2, 1.6);

  // Layered chestnut hair cap, bangs & side locks
  ctx.fillStyle = flash ? '#ffffff' : '#3a2417';
  ctx.fillRect(-5.6 + tx, -19.5 + bodyY, 11.2, 4.6);
  ctx.fillRect(-4.4 + tx, -20.5 + bodyY, 8.8, 1.5);
  // Hair highlight crest
  ctx.fillStyle = flash ? '#ffffff' : '#5c3b25';
  ctx.fillRect(-3.6 + tx, -19.2 + bodyY, 6.8, 1.8);

  if (facing === 'up') {
    // Full back hair covering head cleanly
    ctx.fillStyle = flash ? '#ffffff' : '#3a2417';
    ctx.fillRect(-5.2 + tx, -17 + bodyY, 10.4, 7.4);
    ctx.fillStyle = flash ? '#ffffff' : '#543521';
    ctx.fillRect(-3.8 + tx, -16.5 + bodyY, 7.6, 2.2);
  } else {
    // Side hair tufts & bangs
    ctx.fillStyle = flash ? '#ffffff' : '#3a2417';
    if (facing === 'right') {
      ctx.fillRect(-5.4 + tx, -16 + bodyY, 3.6, 5.2);
      ctx.fillRect(-2 + tx, -16.5 + bodyY, 4.5, 1.8);
    } else if (facing === 'left') {
      ctx.fillRect(1.8 + tx, -16 + bodyY, 3.6, 5.2);
      ctx.fillRect(-2.5 + tx, -16.5 + bodyY, 4.5, 1.8);
    } else {
      ctx.fillRect(-5.4 + tx, -16 + bodyY, 2, 4.5);
      ctx.fillRect(3.4 + tx, -16 + bodyY, 2, 4.5);
      ctx.fillRect(-3 + tx, -16.2 + bodyY, 2.2, 1.8);
      ctx.fillRect(0.6 + tx, -16.2 + bodyY, 2.4, 1.5);
    }

    // Directional eyes with bright pixel highlight
    if (!flash) {
      if (facing === 'right') {
        ctx.fillStyle = '#14191d';
        ctx.fillRect(1.2 + tx, -13.8 + bodyY, 2, 2.4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2.1 + tx, -13.6 + bodyY, 0.9, 1);
      } else if (facing === 'left') {
        ctx.fillStyle = '#14191d';
        ctx.fillRect(-3.2 + tx, -13.8 + bodyY, 2, 2.4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3 + tx, -13.6 + bodyY, 0.9, 1);
      } else {
        // Facing south: twin clear expressive eyes
        ctx.fillStyle = '#14191d';
        ctx.fillRect(-3.1 + tx, -13.8 + bodyY, 1.9, 2.3);
        ctx.fillRect(1.2 + tx, -13.8 + bodyY, 1.9, 2.3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2.8 + tx, -13.6 + bodyY, 0.8, 0.9);
        ctx.fillRect(1.5 + tx, -13.6 + bodyY, 0.8, 0.9);
      }
    }
  }

  // 11. FOREGROUND ARMS & GRIPPED SWORD
  if (!offArmBehindBody) {
    drawOffArm(ctx, offShoulderX, shoulderY, offHandX, offHandY, flash);
  }
  if (!swordBehindBody) {
    drawSwordArmAndWeapon(
      ctx,
      swordShoulderX,
      shoulderY,
      swordHandX,
      swordHandY,
      swordAngle,
      player.equippedWeapon,
      weaponLevel,
      time,
      vfxQuality,
      flash,
      energyFlare
    );
  }

  // Weapon switch shimmer ring centered on gripping hand
  if (player.weaponSwitchTimer > 0 && vfxQuality !== 'low') {
    const a = player.weaponSwitchTimer / 0.26;
    ctx.strokeStyle = weaponDef.glowColor;
    ctx.globalAlpha = a * 0.85;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(swordHandX, swordHandY, 10 + (1 - a) * 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Victory / discovery sparkle burst above raised sword
  if (isCelebrating && vfxQuality !== 'low') {
    const a = Math.min(1, (player.celebrateTimer ?? 0) / 0.4);
    ctx.fillStyle = `rgba(253, 224, 71, ${a * 0.9})`;
    ctx.fillRect(swordHandX - 1, swordHandY - 18, 2, 6);
    ctx.fillRect(swordHandX - 3, swordHandY - 16, 6, 2);
  }

  ctx.restore();

  // 12. Directional Melee Slash Arc VFX (matches weapon & attack timing; skipped for Bows)
  if (isAttacking && weaponDef.category !== 'bow') {
    const progress = 1 - player.attackTimer / Math.max(0.01, player.attackDuration);
    const fade = Math.max(0, 1 - Math.max(0, progress - 0.55) / 0.45);
    const baseR = weaponDef.baseRange + player.weaponUpgrades[player.equippedWeapon].attackRange * 4;
    const isHeavy = player.attackStyle === 'heavy';
    const isCharged = player.attackStyle === 'charged';
    const radius = isCharged ? baseR * 1.28 : isHeavy ? baseR * 1.14 : baseR * 0.92;
    const halfArc = isCharged ? 1.45 : isHeavy ? 1.28 : 1.06;
    const sweepStart = player.attackAngle - halfArc;
    const sweepEnd = sweepStart + halfArc * 2 * Math.min(1, progress * 1.38);

    ctx.save();
    ctx.translate(player.x, player.y - 3);
    ctx.globalAlpha = fade;
    ctx.lineCap = 'round';

    if (vfxQuality !== 'low') {
      ctx.strokeStyle = weaponDef.slashSecondaryColor;
      ctx.lineWidth = isCharged ? 14 : isHeavy ? 10 : 6.5;
      ctx.globalAlpha = fade * 0.42;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 2, sweepStart, sweepEnd);
      ctx.stroke();
    }

    ctx.globalAlpha = fade * 0.92;
    ctx.strokeStyle = weaponDef.slashPrimaryColor;
    ctx.lineWidth = isCharged ? 9.5 : isHeavy ? 7 : 4.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, sweepStart, sweepEnd);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isCharged ? 3.2 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, sweepStart + 0.16, sweepEnd);
    ctx.stroke();

    // Coreblade / Charged twin harmonic inner arc
    if ((player.equippedWeapon === 'coreblade' || isCharged) && vfxQuality !== 'low') {
      ctx.strokeStyle = player.equippedWeapon === 'coreblade' ? '#fde047' : weaponDef.glowColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = fade * 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, radius - 11, sweepStart + 0.1, sweepEnd);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function drawNpcSprite(
  ctx: CanvasRenderingContext2D,
  npc: NpcEntity,
  time: number,
  hasActiveQuest: boolean,
  isNearby: boolean,
  showQuestMarkers = true
): void {
  const bob = Math.sin(time * 2.5 + npc.x * 0.05) * 1.2;
  ctx.save();
  ctx.translate(Math.round(npc.x), Math.round(npc.y));

  // Shadow
  ctx.fillStyle = 'rgba(8, 12, 10, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots
  ctx.fillStyle = '#242220';
  ctx.fillRect(-4, 5, 3, 5);
  ctx.fillRect(1, 5, 3, 5);

  // Coat & Accent sash
  ctx.fillStyle = npc.palette.coat;
  ctx.fillRect(-6, -6 - bob, 12, 11);
  ctx.fillStyle = npc.palette.accent;
  ctx.fillRect(-5, -5 - bob, 10, 3);

  // Head
  ctx.fillStyle = npc.palette.skin;
  ctx.fillRect(-5, -14 - bob, 10, 8);
  ctx.fillStyle = npc.palette.hair;
  ctx.fillRect(-6, -16 - bob, 12, 4);
  if (npc.role === 'Construct') {
    // Glowing visor for Echo-7
    ctx.fillStyle = '#6ef2e2';
    ctx.fillRect(-4, -12 - bob, 8, 3);
  } else {
    ctx.fillStyle = '#181818';
    ctx.fillRect(-3, -11 - bob, 2, 2);
    ctx.fillRect(1, -11 - bob, 2, 2);
  }

  // Quest indicator beacon
  if (hasActiveQuest && showQuestMarkers) {
    const qy = -25 - Math.sin(time * 5) * 2.5;
    ctx.fillStyle = '#1b1d1a';
    ctx.fillRect(-6, qy - 6, 12, 12);
    ctx.fillStyle = '#f5be4f';
    ctx.fillRect(-5, qy - 5, 10, 10);
    ctx.fillStyle = '#1b1d1a';
    ctx.fillRect(-1, qy - 3, 2, 4);
    ctx.fillRect(-1, qy + 2, 2, 2);
  }

  // Subtle nameplate when nearby
  if (isNearby) {
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(npc.name).width + 10;
    ctx.fillStyle = 'rgba(14, 20, 17, 0.85)';
    ctx.fillRect(-w / 2, -36, w, 14);
    ctx.fillStyle = '#f3efe0';
    ctx.fillText(npc.name, 0, -26);
  }

  ctx.restore();
}

export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyEntity,
  time: number
): void {
  if (enemy.aiState === 'ko' && enemy.koTimer <= 0) return;

  const isBoss = Boolean(enemy.isBoss);
  const bossDefeat = isBoss && enemy.aiState === 'ko' ? getBossDefeatState(enemy.koTimer) : null;
  if (bossDefeat && bossDefeat.stage === 'vanished') return;

  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));

  const isTelegraph = enemy.aiState === 'telegraph';
  const isAttacking = enemy.aiState === 'attack' || (enemy.attackAnimTimer ?? 0) > 0;
  const isMoving = enemy.aiState === 'chase' || enemy.aiState === 'patrol';
  const flash = enemy.hitFlashTimer > 0;
  const facingDir = Math.cos(enemy.telegraphAngle) >= 0 ? 1 : -1;

  // Telegraph progress (0 -> 1 as strike approaches)
  const telegraphProgress = isTelegraph
    ? Math.max(0, Math.min(1, 1 - enemy.stateTimer / Math.max(0.05, enemy.telegraphDuration)))
    : 0;

  // =========================================================================
  // 1. READABLE GROUND ATTACK WARNINGS / TELEGRAPHS (drawn beneath creature)
  // =========================================================================
  if (isTelegraph) {
    const pulse = 0.55 + Math.sin(time * 30) * 0.35;
    if (
      enemy.archetype === 'stalker_charger' ||
      (enemy.archetype === 'core_boss' && enemy.bossPattern === 'beam_dash')
    ) {
      const len = enemy.archetype === 'core_boss' ? 210 : 132;
      const halfH = enemy.archetype === 'core_boss' ? 16 : 9;
      ctx.save();
      ctx.rotate(enemy.telegraphAngle);
      // Base warning lane
      ctx.fillStyle = `rgba(220, 38, 38, ${0.22 + pulse * 0.16})`;
      ctx.fillRect(10, -halfH, len, halfH * 2);
      // Advancing charge fill bar showing exact impact timing
      ctx.fillStyle = `rgba(248, 113, 113, ${0.38 + telegraphProgress * 0.32})`;
      ctx.fillRect(10, -halfH + 2, len * telegraphProgress, halfH * 2 - 4);
      // Crisp border & directional chevrons
      ctx.strokeStyle = `rgba(254, 202, 202, ${0.65 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, -halfH, len, halfH * 2);
      ctx.strokeStyle = `rgba(254, 240, 138, ${pulse})`;
      for (let cx = 28; cx < len; cx += 34) {
        ctx.beginPath();
        ctx.moveTo(cx, -halfH + 4);
        ctx.lineTo(cx + 8, 0);
        ctx.lineTo(cx, halfH - 4);
        ctx.stroke();
      }
      ctx.restore();
    } else if (enemy.archetype === 'turret_denial' || enemy.archetype === 'core_boss') {
      const isNova = enemy.bossPattern === 'overload_nova';
      const maxRing = enemy.radius + (isNova ? 46 : 26);
      const innerRing = enemy.radius + (maxRing - enemy.radius) * telegraphProgress;
      ctx.fillStyle = isNova
        ? `rgba(239, 68, 68, ${0.14 + telegraphProgress * 0.18})`
        : `rgba(249, 115, 22, ${0.12 + telegraphProgress * 0.16})`;
      ctx.beginPath();
      ctx.arc(0, 0, maxRing, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isNova ? `rgba(252, 165, 165, ${pulse})` : `rgba(253, 186, 116, ${pulse})`;
      ctx.lineWidth = isNova ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, maxRing, 0, Math.PI * 2);
      ctx.stroke();

      // Expanding timing ring so player sees exact detonation moment
      ctx.strokeStyle = isNova ? '#fef08a' : '#fdba74';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, innerRing, 0, Math.PI * 2);
      ctx.stroke();

      // Radial spoke preview for volley patterns
      const spokes = enemy.archetype === 'turret_denial' ? 6 : isNova ? 12 : 8;
      ctx.strokeStyle = isNova ? 'rgba(248, 113, 113, 0.45)' : 'rgba(251, 146, 60, 0.42)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < spokes; i++) {
        const a = enemy.telegraphAngle + (i * Math.PI * 2) / spokes;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (enemy.radius + 4), Math.sin(a) * (enemy.radius + 4));
        ctx.lineTo(Math.cos(a) * (maxRing + 18), Math.sin(a) * (maxRing + 18));
        ctx.stroke();
      }
    } else {
      // Laser-sight / spore-spit targeting line with pulsing tip
      const len = enemy.archetype === 'crawler_swarmer' ? 76 : 96;
      const ex = Math.cos(enemy.telegraphAngle) * len;
      const ey = Math.sin(enemy.telegraphAngle) * len;
      ctx.strokeStyle =
        enemy.archetype === 'crawler_swarmer'
          ? `rgba(163, 230, 53, ${0.45 + pulse * 0.45})`
          : `rgba(248, 113, 113, ${0.45 + pulse * 0.45})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ex * telegraphProgress, ey * telegraphProgress, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // 2. DEFEAT / DAMAGE / ATTACK TRANSFORMS (No graphic gore)
  // =========================================================================
  if (bossDefeat) {
    // 5-stage Boss Defeat sequence: stagger -> fall -> fallen -> ash_fade
    const shakeX = bossDefeat.stage === 'stagger' ? (Math.sin(time * 58) * 3.5) : 0;
    const shakeY = bossDefeat.stage === 'stagger' ? (Math.cos(time * 49) * 2.2) : 0;
    ctx.translate(shakeX, bossDefeat.fallOffsetY + shakeY);
    ctx.rotate(bossDefeat.tiltRadians);
    ctx.globalAlpha = bossDefeat.alpha;
  } else if (enemy.aiState === 'ko') {
    const t = Math.max(0, enemy.koTimer / 0.45);
    ctx.globalAlpha = t;
    ctx.translate(0, (1 - t) * 7);
    ctx.rotate((1 - t) * facingDir * 0.85);
    ctx.scale(1 + (1 - t) * 0.14, Math.max(0.28, 0.35 + t * 0.65));
  } else {
    // Hit impact recoil squash & attack lunge stretch
    if (flash) {
      ctx.scale(1.16, 0.86);
    } else if (enemy.attackAnimTimer && enemy.attackAnimTimer > 0) {
      const s = 1 + (enemy.attackAnimTimer / 0.22) * 0.18;
      ctx.scale(s, 1 / s);
    } else if (isTelegraph && enemy.archetype === 'stalker_charger') {
      // Predatory coiled crouch before pouncing
      ctx.scale(1.14, 0.86);
      ctx.translate(Math.sin(time * 45) * 1.4, 2);
    }
  }

  // Ground contact shadow
  ctx.fillStyle = 'rgba(6, 9, 10, 0.46)';
  ctx.beginPath();
  ctx.ellipse(
    0,
    enemy.radius * (isBoss ? 0.92 : 0.72),
    enemy.radius * (isBoss ? 1.25 : 0.96),
    enemy.radius * (isBoss ? 0.48 : 0.44),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // =========================================================================
  // 3. DETAILED PIXEL-ART MONSTER & BOSS SILHOUETTES
  // =========================================================================
  if (enemy.archetype === 'drone_kiter') {
    // ROGUE ARC-DRONE: Armored winged interceptor with mono-optic visor & twin turbines
    const hover = Math.sin(time * 6.5 + enemy.animTime) * 3.2;
    const bank = isMoving ? facingDir * 0.14 : Math.sin(time * 2.4 + enemy.animTime) * 0.05;
    const rotorSpin = Math.sin(time * 36 + enemy.animTime) * 5;
    ctx.save();
    ctx.translate(0, hover);
    ctx.rotate(bank);

    // Thruster flame underneath
    const flameH = 4 + Math.sin(time * 28) * 2;
    ctx.fillStyle = isTelegraph ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(-4, 7, 8, flameH);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(-2, 7, 4, Math.max(2, flameH - 2));

    // Twin angled wing nacelles with dark outline
    ctx.fillStyle = flash ? '#ffffff' : '#10161d';
    ctx.fillRect(-18, -8, 9, 11);
    ctx.fillRect(9, -8, 9, 11);
    ctx.fillStyle = flash ? '#ffffff' : '#334155';
    ctx.fillRect(-17, -7, 7, 9);
    ctx.fillRect(10, -7, 7, 9);
    // Wing stripe accents
    ctx.fillStyle = flash ? '#ffffff' : '#b91c1c';
    ctx.fillRect(-16, -4, 5, 2);
    ctx.fillRect(11, -4, 5, 2);
    // Spinning top turbine blades
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-15 - Math.abs(rotorSpin) * 0.5, -10, 5 + Math.abs(rotorSpin), 2);
    ctx.fillRect(10 - Math.abs(rotorSpin) * 0.5, -10, 5 + Math.abs(rotorSpin), 2);

    // Main hexagonal armored hull + highlight bevel
    ctx.fillStyle = flash ? '#ffffff' : '#111821';
    ctx.fillRect(-11, -13, 22, 19);
    ctx.fillStyle = flash ? '#ffffff' : '#475569';
    ctx.fillRect(-10, -12, 20, 17);
    ctx.fillStyle = flash ? '#ffffff' : '#64748b';
    ctx.fillRect(-9, -12, 18, 4);
    ctx.fillStyle = flash ? '#ffffff' : '#26303d';
    ctx.fillRect(-9, 1, 18, 4);

    // Antenna spikes on crown
    ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
    ctx.fillRect(-7, -17, 2, 5);
    ctx.fillRect(5, -16, 2, 4);
    ctx.fillStyle = isTelegraph ? '#fef08a' : '#ef4444';
    ctx.fillRect(-7, -18, 2, 2);

    // Recessed visor slot + tracking crimson/amber mono-optic eye
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(-8, -7, 16, 6);
    const eyeShift = Math.round(Math.cos(enemy.telegraphAngle) * 2.5);
    ctx.fillStyle = isTelegraph ? '#facc15' : '#ef4444';
    ctx.fillRect(-4 + eyeShift, -6, 8, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1 + eyeShift, -5, 3, 2);

    // Lower plasma emitter chin cannon
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-3, 4, 6, 4);
    if (isTelegraph || isAttacking) {
      ctx.fillStyle = isAttacking ? '#ffffff' : '#fca5a5';
      ctx.fillRect(-2, 6, 4, 3);
    }
    ctx.restore();
  } else if (enemy.archetype === 'stalker_charger') {
    // RUSTED STALKER HOUND: Fierce quadrupedal wolf-like mech predator with jaws & claws
    const gallop = isMoving || isAttacking ? Math.sin(time * 16 + enemy.animTime) * 3.8 : Math.sin(time * 3 + enemy.animTime) * 0.6;
    const breath = Math.sin(time * 4.5 + enemy.animTime) * 0.8;
    ctx.save();
    ctx.scale(facingDir, 1);

    // Whip-like rear antenna tail
    ctx.fillStyle = flash ? '#ffffff' : '#271e1a';
    ctx.fillRect(-17, -9 + breath, 5, 2);
    ctx.fillRect(-19, -12 + breath, 3, 4);

    // Back legs (darker depth layer)
    ctx.fillStyle = flash ? '#ffffff' : '#1e1614';
    ctx.fillRect(-11 - gallop * 0.6, 2, 4, 9);
    ctx.fillRect(4 + gallop * 0.6, 2, 4, 9);
    // Metal claws on back feet
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-9 - gallop * 0.6, 10, 3, 2);
    ctx.fillRect(6 + gallop * 0.6, 10, 3, 2);

    // Hunched segmented armored body with dark outline
    ctx.fillStyle = flash ? '#ffffff' : '#18110f';
    ctx.fillRect(-14, -10 + breath, 24, 15);
    ctx.fillStyle = flash ? '#ffffff' : '#5c3c31';
    ctx.fillRect(-13, -9 + breath, 22, 13);
    // Rust-plated shoulder hump & dorsal spine ridge
    ctx.fillStyle = flash ? '#ffffff' : '#8c533c';
    ctx.fillRect(-9, -12 + breath, 16, 6);
    ctx.fillStyle = flash ? '#ffffff' : '#b86e4c';
    ctx.fillRect(-6, -12 + breath, 10, 2);
    // Jagged dorsal heat-fins
    ctx.fillStyle = flash ? '#ffffff' : '#2e221f';
    ctx.fillRect(-10, -14 + breath, 3, 3);
    ctx.fillRect(-4, -15 + breath, 3, 4);
    ctx.fillRect(2, -14 + breath, 3, 3);

    // Front legs (brighter foreground)
    ctx.fillStyle = flash ? '#ffffff' : '#17110f';
    ctx.fillRect(-9 + gallop, 2, 5, 10);
    ctx.fillRect(6 - gallop, 2, 5, 10);
    ctx.fillStyle = flash ? '#ffffff' : '#3d2d28';
    ctx.fillRect(-8 + gallop, 3, 3, 7);
    ctx.fillRect(7 - gallop, 3, 3, 7);
    // Sharp metallic claws
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-6 + gallop, 10, 4, 2);
    ctx.fillRect(9 - gallop, 10, 4, 2);

    // Distinct armored predator head + snapping steel jaw
    const jawOpen = isTelegraph || isAttacking ? 3 : 0;
    ctx.fillStyle = flash ? '#ffffff' : '#18110f';
    ctx.fillRect(5, -13 + breath, 14, 10);
    ctx.fillStyle = flash ? '#ffffff' : '#734535';
    ctx.fillRect(6, -12 + breath, 12, 8);
    // Swept metallic ear-blades
    ctx.fillStyle = flash ? '#ffffff' : '#3d2822';
    ctx.fillRect(5, -16 + breath, 3, 4);
    ctx.fillRect(9, -15 + breath, 3, 3);
    // Hinged lower jaw + steel fangs
    ctx.fillStyle = flash ? '#ffffff' : '#3a2b27';
    ctx.fillRect(9, -4 + breath + jawOpen, 10, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(14, -5 + breath, 2, 2 + jawOpen * 0.5);
    ctx.fillRect(17, -5 + breath, 2, 2 + jawOpen * 0.5);
    // Blazing predator optic eyes
    ctx.fillStyle = isTelegraph ? '#fef08a' : '#fb923c';
    ctx.fillRect(11, -10 + breath, 5, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, -10 + breath, 2, 2);

    ctx.restore();
  } else if (enemy.archetype === 'crawler_swarmer') {
    // BLIGHT SPORE-CRAWLER: 6-legged forest arachnid-fungus horror with mandibles & pulsing dome
    const skitter = Math.sin(time * 15 + enemy.animTime) * 2.8;
    const swell = isTelegraph ? 1.14 + Math.sin(time * 26) * 0.08 : 1;
    const bob = Math.sin(time * 7 + enemy.animTime) * 1.4;

    ctx.save();
    // 6 jointed chitin insect legs (3 per side)
    ctx.strokeStyle = flash ? '#ffffff' : '#1b2e1e';
    ctx.lineWidth = 2.6;
    for (let i = -1; i <= 1; i++) {
      const lift = (i % 2 === 0 ? skitter : -skitter) * (isMoving ? 1 : 0.25);
      // Left leg
      ctx.beginPath();
      ctx.moveTo(-7, i * 3);
      ctx.lineTo(-14, i * 4 - 2 + lift);
      ctx.lineTo(-17, i * 5 + 5 + lift);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(7, i * 3);
      ctx.lineTo(14, i * 4 - 2 - lift);
      ctx.lineTo(17, i * 5 + 5 - lift);
      ctx.stroke();
    }

    // Dark segmented chitin abdomen & thorax
    ctx.fillStyle = flash ? '#ffffff' : '#122116';
    ctx.fillRect(-12, -5, 24, 13);
    ctx.fillStyle = flash ? '#ffffff' : '#2a4d32';
    ctx.fillRect(-11, -4, 22, 11);

    // Bulbous layered bioluminescent spore dome (swells right before acid spit!)
    ctx.save();
    ctx.scale(swell, swell);
    ctx.fillStyle = flash ? '#ffffff' : '#152919';
    ctx.fillRect(-14, -15 + bob, 28, 12);
    ctx.fillStyle = flash ? '#ffffff' : '#4d8a3b';
    ctx.fillRect(-13, -14 + bob, 26, 10);
    ctx.fillStyle = flash ? '#ffffff' : '#74b84a';
    ctx.fillRect(-10, -14 + bob, 20, 4);
    // Glowing toxic spore pustules
    const sporeGlow = isTelegraph ? '#fef08a' : '#bef264';
    ctx.fillStyle = sporeGlow;
    ctx.fillRect(-9, -12 + bob, 4, 4);
    ctx.fillRect(-1, -13 + bob, 5, 4);
    ctx.fillRect(6, -11 + bob, 4, 4);
    ctx.fillStyle = '#ecfccb';
    ctx.fillRect(-8, -12 + bob, 2, 2);
    ctx.fillRect(0, -13 + bob, 2, 2);
    ctx.restore();

    // Face cluster: 4 glowing arachnid eyes + curved chitin mandibles
    ctx.fillStyle = '#0c170e';
    ctx.fillRect(-8, 1, 16, 6);
    ctx.fillStyle = isTelegraph ? '#fef08a' : '#a3e635';
    ctx.fillRect(-6, 2, 2.5, 2.5);
    ctx.fillRect(-2.5, 2.5, 2.2, 2.2);
    ctx.fillRect(1, 2.5, 2.2, 2.2);
    ctx.fillRect(4.5, 2, 2.5, 2.5);
    // Snap mandibles
    const pinch = isAttacking || isTelegraph ? 2 : 0;
    ctx.fillStyle = '#d9f99d';
    ctx.fillRect(-7 + pinch, 6, 3, 4);
    ctx.fillRect(4 - pinch, 6, 3, 4);
    ctx.restore();
  } else if (enemy.archetype === 'turret_denial') {
    // FOUNDRY BASTION TURRET: Heavy fortified bunker with hazard stripes & twin rotary cannons
    const recoil = isAttacking ? -3 : 0;
    const ventPulse = 0.65 + Math.sin(time * 9) * 0.35;

    // Reinforced octagonal steel foundation with corner anchor struts
    ctx.fillStyle = flash ? '#ffffff' : '#141211';
    ctx.fillRect(-19, -17, 38, 34);
    ctx.fillStyle = flash ? '#ffffff' : '#3b3633';
    ctx.fillRect(-17, -15, 34, 30);
    // Corner blast feet
    ctx.fillStyle = flash ? '#ffffff' : '#574e47';
    ctx.fillRect(-20, -14, 5, 8);
    ctx.fillRect(15, -14, 5, 8);
    ctx.fillRect(-20, 6, 5, 8);
    ctx.fillRect(15, 6, 5, 8);

    // Industrial yellow-black hazard stripe skirt
    ctx.fillStyle = flash ? '#ffffff' : '#d97706';
    ctx.fillRect(-15, 9, 30, 4);
    ctx.fillStyle = '#1c1917';
    for (let hx = -13; hx <= 11; hx += 6) {
      ctx.fillRect(hx, 9, 3, 4);
    }

    // Glowing furnace cooling vents
    ctx.fillStyle = `rgba(249, 115, 22, ${ventPulse})`;
    ctx.fillRect(-13, -12, 5, 3);
    ctx.fillRect(8, -12, 5, 3);

    // Elevated armored turret dome
    ctx.fillStyle = flash ? '#ffffff' : '#262220';
    ctx.fillRect(-12, -11, 24, 20);
    ctx.fillStyle = flash ? '#ffffff' : '#66574b';
    ctx.fillRect(-10, -9, 20, 16);
    ctx.fillStyle = flash ? '#ffffff' : '#857364';
    ctx.fillRect(-8, -9, 16, 4);

    // Rotating twin heavy rotary cannons
    ctx.save();
    ctx.rotate(enemy.telegraphAngle);
    ctx.fillStyle = '#181615';
    ctx.fillRect(0 + recoil, -8, 22, 16);
    ctx.fillStyle = '#3f3b38';
    ctx.fillRect(2 + recoil, -6, 18, 4);
    ctx.fillRect(2 + recoil, 2, 18, 4);
    // Heated orange muzzle brakes
    ctx.fillStyle = isTelegraph ? '#fef08a' : '#f97316';
    ctx.fillRect(18 + recoil, -6, 5, 4);
    ctx.fillRect(18 + recoil, 2, 5, 4);
    ctx.restore();

    // Central armored optic core & mini rotating radar fin
    ctx.fillStyle = '#181412';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = isTelegraph ? '#fef08a' : '#f97316';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(-1, -1, 2, 2);
  } else if (enemy.archetype === 'core_boss') {
    // AEGIS CORE SENTINEL: Imposing multi-part armored colossus (~2.2x scale) with horns, claw-gauntlets & orbiting obelisks
    const phase = enemy.bossPhase ?? 1;
    const defeated = enemy.aiState === 'ko';
    const ashLerp = bossDefeat ? bossDefeat.ashDissolve : 0;
    const hover = defeated ? 0 : Math.sin(time * 3.4) * 4.5;

    // Color palette shifts smoothly across 3 phases and desaturates to ash-gray during Stage 4
    const hullDark = flash ? '#ffffff' : ashLerp > 0.2 ? '#3f4448' : phase === 3 ? '#1e0e18' : phase === 2 ? '#23161b' : '#121c26';
    const hullMid = flash ? '#ffffff' : ashLerp > 0.2 ? '#646b70' : phase === 3 ? '#4c1d31' : phase === 2 ? '#422630' : '#26394a';
    const hullLight = flash ? '#ffffff' : ashLerp > 0.2 ? '#9ca3af' : phase === 3 ? '#882e4d' : phase === 2 ? '#6b3e4b' : '#47657d';
    const coreColor = defeated
      ? ashLerp > 0.1
        ? '#9ca3af'
        : '#78350f'
      : phase === 3
        ? '#f43f5e'
        : phase === 2
          ? '#ef4444'
          : '#f59e0b';
    const coreHot = defeated ? '#d6d3d1' : phase === 3 ? '#ffffff' : '#fef3c7';
    const pylonColor = phase === 3 ? '#fda4af' : phase === 2 ? '#f87171' : '#5eead4';

    // Clip from top down during Stage 4 ('ash_fade') so colossus dissolves cleanly into rising ash!
    ctx.save();
    if (bossDefeat && bossDefeat.stage === 'ash_fade') {
      const clipTop = -56 + bossDefeat.ashDissolve * 110;
      ctx.beginPath();
      ctx.rect(-72, clipTop, 144, 120);
      ctx.clip();
    }

    // Threatening energy aura ring beneath boss when alive
    if (!defeated) {
      const auraPulse = 0.35 + Math.sin(time * 6) * 0.15;
      ctx.strokeStyle = phase === 3 ? `rgba(244, 63, 94, ${auraPulse})` : `rgba(245, 158, 11, ${auraPulse})`;
      ctx.lineWidth = phase === 3 ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 6, 40 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Orbiting faceted crystal shield obelisks + crackling energy tethers
    if (!bossDefeat || bossDefeat.stage === 'stagger') {
      const pylonCount = phase >= 2 ? 6 : 4;
      const orbitSpeed = phase === 3 ? 3.6 : phase === 2 ? 2.5 : 1.5;
      const spread = bossDefeat ? 1 + bossDefeat.stageProgress * 0.45 : isTelegraph ? 1.16 : 1;
      for (let i = 0; i < pylonCount; i++) {
        const a = time * orbitSpeed + (i * Math.PI * 2) / pylonCount;
        const sx = Math.cos(a) * 44 * spread;
        const sy = Math.sin(a) * 32 * spread + hover;

        // Faint energy tether line to reactor core
        ctx.strokeStyle = phase === 3 ? 'rgba(251, 113, 133, 0.32)' : 'rgba(94, 234, 212, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, hover);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // Faceted diamond obelisk pylon
        ctx.fillStyle = '#0e1318';
        ctx.fillRect(sx - 6, sy - 8, 12, 16);
        ctx.fillStyle = flash ? '#ffffff' : pylonColor;
        ctx.fillRect(sx - 4, sy - 6, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 2, sy - 4, 4, 4);
      }
    }

    // Lower armored reactor thruster skirt
    ctx.fillStyle = hullDark;
    ctx.fillRect(-18, 12 + hover, 36, 15);
    ctx.fillStyle = hullMid;
    ctx.fillRect(-14, 13 + hover, 28, 12);
    if (!defeated) {
      const jet = 6 + Math.sin(time * 22) * 3;
      ctx.fillStyle = coreColor;
      ctx.fillRect(-10, 25 + hover, 7, jet);
      ctx.fillRect(3, 25 + hover, 7, jet);
    }

    // Massive broad shoulder pauldrons with armored spikes
    ctx.fillStyle = hullDark;
    ctx.fillRect(-35, -24 + hover, 70, 26);
    ctx.fillStyle = hullMid;
    ctx.fillRect(-33, -22 + hover, 66, 22);
    ctx.fillStyle = hullLight;
    ctx.fillRect(-32, -22 + hover, 22, 6);
    ctx.fillRect(10, -22 + hover, 22, 6);
    // Shoulder horn spikes
    ctx.fillStyle = hullLight;
    ctx.fillRect(-36, -29 + hover, 6, 9);
    ctx.fillRect(30, -29 + hover, 6, 9);
    ctx.fillStyle = coreColor;
    ctx.fillRect(-29, -15 + hover, 8, 4);
    ctx.fillRect(21, -15 + hover, 8, 4);

    // Ribbed armored chest chassis
    ctx.fillStyle = hullDark;
    ctx.fillRect(-22, -20 + hover, 44, 36);
    ctx.fillStyle = hullMid;
    ctx.fillRect(-20, -18 + hover, 40, 32);

    // Exposed fissured central Arc Reactor Core
    ctx.fillStyle = '#090b0f';
    ctx.fillRect(-13, -12 + hover, 26, 20);
    ctx.fillStyle = coreColor;
    ctx.fillRect(-11, -10 + hover, 22, 16);
    ctx.fillStyle = coreHot;
    const corePulse = defeated ? 0 : Math.sin(time * 12) * 1.5;
    ctx.fillRect(-6 - corePulse * 0.5, -6 - corePulse * 0.5, 12 + corePulse, 8 + corePulse);
    // Armored rib bars framing the reactor
    ctx.fillStyle = hullLight;
    ctx.fillRect(-15, -4 + hover, 6, 3);
    ctx.fillRect(9, -4 + hover, 6, 3);
    ctx.fillRect(-15, 3 + hover, 6, 3);
    ctx.fillRect(9, 3 + hover, 6, 3);

    // Articulated Floating Claw-Gauntlets (react distinctly to idle, telegraph, & attack!)
    const armSpread = isTelegraph ? 8 : isAttacking ? 12 : 0;
    const armLift = isTelegraph ? -8 : isAttacking ? 6 : Math.sin(time * 4.2) * 3;
    for (const side of [-1, 1]) {
      const gx = side * (34 + armSpread);
      const gy = 2 + hover + armLift;
      ctx.fillStyle = hullDark;
      ctx.fillRect(gx - 8, gy - 10, 16, 20);
      ctx.fillStyle = hullMid;
      ctx.fillRect(gx - 6, gy - 8, 12, 15);
      ctx.fillStyle = hullLight;
      ctx.fillRect(gx - 5, gy - 8, 10, 4);
      // 3 glowing energy claws on each gauntlet
      ctx.fillStyle = isTelegraph || isAttacking ? '#fef08a' : coreColor;
      ctx.fillRect(gx - 6, gy + 7, 3, 7);
      ctx.fillRect(gx - 1.5, gy + 8, 3, 8);
      ctx.fillRect(gx + 3, gy + 7, 3, 7);
    }

    // Crowned Horned Colossus Head & Tri-Optic Visor
    ctx.fillStyle = hullDark;
    ctx.fillRect(-14, -37 + hover, 28, 19);
    ctx.fillStyle = hullMid;
    ctx.fillRect(-12, -35 + hover, 24, 15);
    ctx.fillStyle = hullLight;
    ctx.fillRect(-10, -35 + hover, 20, 4);
    // Swept crown battle-horns
    ctx.fillStyle = hullDark;
    ctx.fillRect(-18, -44 + hover, 6, 12);
    ctx.fillRect(12, -44 + hover, 6, 12);
    ctx.fillStyle = hullLight;
    ctx.fillRect(-17, -43 + hover, 4, 9);
    ctx.fillRect(13, -43 + hover, 4, 9);
    // Blazing tri-optic visor face
    ctx.fillStyle = '#080a0d';
    ctx.fillRect(-10, -29 + hover, 20, 7);
    ctx.fillStyle = isTelegraph ? '#fef08a' : coreColor;
    ctx.fillRect(-8, -28 + hover, 4, 4);
    ctx.fillRect(-2.5, -28 + hover, 5, 5);
    ctx.fillRect(4, -28 + hover, 4, 4);
    ctx.fillStyle = coreHot;
    ctx.fillRect(-1, -27 + hover, 2, 3);

    ctx.restore();

    // Drifting pale ash speckles along the dissolve seam during Stage 4 ('ash_fade')
    if (bossDefeat && bossDefeat.stage === 'ash_fade') {
      const seamY = -52 + bossDefeat.ashDissolve * 100;
      for (let i = 0; i < 10; i++) {
        const ax = Math.sin(time * 7 + i * 2.1) * 34;
        const ay = seamY - ((time * 28 + i * 11) % 26);
        ctx.fillStyle = i % 3 === 0 ? 'rgba(251, 146, 60, 0.75)' : 'rgba(209, 213, 219, 0.8)';
        ctx.fillRect(ax - 1.5, ay - 1.5, 3, 3);
      }
    }
  }

  // =========================================================================
  // 4. OVERHEAD TELEGRAPH ALERT BADGE (!) & COMPACT ENEMY HP BAR
  // =========================================================================
  if (isTelegraph && enemy.aiState !== 'ko') {
    const wy = -enemy.radius - (isBoss ? 34 : 20) - Math.abs(Math.sin(time * 22)) * 3;
    ctx.fillStyle = '#180d0d';
    ctx.fillRect(-6, wy - 7, 12, 13);
    ctx.fillStyle = isBoss ? '#ef4444' : '#facc15';
    ctx.fillRect(-5, wy - 6, 10, 11);
    ctx.fillStyle = '#140c0c';
    ctx.fillRect(-1, wy - 4, 2, 5);
    ctx.fillRect(-1, wy + 2, 2, 2);
  }

  // World-space compact HP bar (for damaged non-boss enemies)
  if (!isBoss && enemy.aiState !== 'ko' && enemy.hp < enemy.maxHp) {
    const bw = 30;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = 'rgba(10, 14, 12, 0.88)';
    ctx.fillRect(-bw / 2 - 1, -enemy.radius - 15, bw + 2, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-bw / 2, -enemy.radius - 14, Math.round(bw * ratio), 3);
  }

  ctx.restore();
}

export function drawRestorationNode(
  ctx: CanvasRenderingContext2D,
  node: RestorationNode,
  time: number
): void {
  ctx.save();
  ctx.translate(Math.round(node.x), Math.round(node.y));

  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  const activeColor = node.kind === 'world_core' ? '#5eead4' : '#64e8d8';
  const brokenColor = '#d97736';

  // Ground pad
  ctx.fillStyle = node.restored ? 'rgba(84, 224, 208, 0.22)' : 'rgba(20, 22, 20, 0.5)';
  ctx.beginPath();
  ctx.arc(0, 4, 22, 0, Math.PI * 2);
  ctx.fill();

  if (node.kind === 'house') {
    // Porch repair bench / lantern post & planter box for survivor house
    ctx.fillStyle = node.restored ? '#6e4a2e' : '#4a3a2d';
    ctx.fillRect(-16, -6, 32, 14);
    if (node.restored) {
      // Blooming flower planter & warm porch lantern
      ctx.fillStyle = '#3d7a47';
      ctx.fillRect(-13, -4, 14, 7);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-11, -3, 3, 3);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(-5, -2, 3, 3);
      ctx.fillStyle = '#3c434a';
      ctx.fillRect(8, -22, 4, 24);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(6, -26, 8, 6);
    } else {
      // Cracked wooden boards & broken lantern
      ctx.fillStyle = '#7c5335';
      ctx.fillRect(-14, -10, 22, 4);
      ctx.fillRect(-10, -3, 18, 4);
      ctx.fillStyle = '#3c434a';
      ctx.fillRect(8, -18, 4, 20);
      ctx.fillStyle = brokenColor;
      ctx.fillRect(6, -21, 8, 5);
    }
  } else if (node.kind === 'streetlights') {
    // Twin weathered lamp posts
    ctx.fillStyle = '#3c434a';
    ctx.fillRect(-14, -22, 4, 26);
    ctx.fillRect(10, -22, 4, 26);
    ctx.fillStyle = node.restored ? '#fde047' : '#59483b';
    ctx.fillRect(-16, -26, 8, 6);
    ctx.fillRect(8, -26, 8, 6);
  } else if (node.kind === 'comm_tower') {
    // Tall lattice communication tower
    ctx.fillStyle = '#47525c';
    ctx.fillRect(-10, -8, 20, 14);
    ctx.fillStyle = '#6c7a87';
    ctx.fillRect(-4, -36, 8, 30);
    ctx.fillRect(-12, -26, 24, 3);
    ctx.fillRect(-8, -32, 16, 3);
    // Dish & blinking beacon
    ctx.fillStyle = node.restored ? activeColor : brokenColor;
    ctx.beginPath();
    ctx.arc(0, -39, node.restored ? 5 + pulse * 2 : 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.kind === 'waterwheel') {
    ctx.fillStyle = '#5e4028';
    ctx.fillRect(-16, -10, 32, 20);
    ctx.save();
    if (node.restored) ctx.rotate(time * 2.2);
    ctx.strokeStyle = '#9c7048';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7d5634';
    ctx.fillRect(-13, -2, 26, 4);
    ctx.fillRect(-2, -13, 4, 26);
    ctx.restore();
  } else if (node.kind === 'world_core') {
    // Monumental World Core Altar
    ctx.fillStyle = '#1b2b36';
    ctx.fillRect(-24, -18, 48, 36);
    ctx.fillStyle = '#2d4657';
    ctx.fillRect(-18, -14, 36, 28);
    ctx.fillStyle = node.restored ? '#7efcf2' : '#d97736';
    ctx.beginPath();
    ctx.arc(0, -4, node.restored ? 12 + pulse * 3 : 8, 0, Math.PI * 2);
    ctx.fill();
    if (node.restored) {
      ctx.strokeStyle = `rgba(126, 252, 242, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -4, 22 + Math.sin(time * 3) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Generator / Substation / Grove Conduit / Air Purifier
    ctx.fillStyle = '#38424a';
    ctx.fillRect(-15, -16, 30, 24);
    ctx.fillStyle = '#53626e';
    ctx.fillRect(-12, -13, 24, 18);
    ctx.fillStyle = node.restored ? activeColor : brokenColor;
    ctx.fillRect(-6, -10, 12, 12);
    if (node.restored) {
      ctx.fillStyle = '#e0fffc';
      ctx.fillRect(-3, -7, 6, 6);
    }
  }

  // Pulsing status ring above unrestored nodes
  if (!node.restored) {
    ctx.strokeStyle = `rgba(245, 158, 11, ${pulse * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCollectible(
  ctx: CanvasRenderingContext2D,
  col: CollectibleNode,
  time: number
): void {
  if (col.collected) return;
  const bob = Math.sin(time * 4 + col.x * 0.1) * 2;
  ctx.save();
  ctx.translate(Math.round(col.x), Math.round(col.y));

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 7, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (col.kind === 'crystal') {
    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.moveTo(0, -12 + bob);
    ctx.lineTo(7, -1 + bob);
    ctx.lineTo(0, 7 + bob);
    ctx.lineTo(-7, -1 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ccfbf1';
    ctx.fillRect(-2, -7 + bob, 3, 6);
  } else if (col.kind === 'chest') {
    ctx.fillStyle = '#6b4322';
    ctx.fillRect(-9, -6, 18, 13);
    ctx.fillStyle = '#d4a13b';
    ctx.fillRect(-9, -2, 18, 3);
    ctx.fillRect(-2, -3, 4, 5);
  } else if (col.kind === 'alloy') {
    ctx.fillStyle = '#6b7d8c';
    ctx.fillRect(-8, -5 + bob * 0.5, 16, 10);
    ctx.fillStyle = '#a8c2d6';
    ctx.fillRect(-6, -3 + bob * 0.5, 12, 4);
  } else if (col.kind === 'herb') {
    ctx.fillStyle = '#3b7d3e';
    ctx.fillRect(-7, -4, 14, 9);
    ctx.fillStyle = '#e8687a';
    ctx.fillRect(-4, -5, 3, 3);
    ctx.fillRect(2, -3, 3, 3);
  } else {
    // Wooden crate / barrel
    ctx.fillStyle = col.kind === 'barrel' ? '#5e4d42' : '#7a5634';
    ctx.fillRect(-8, -7, 16, 14);
    ctx.fillStyle = col.kind === 'barrel' ? '#3d332d' : '#573b22';
    ctx.fillRect(-8, -1, 16, 2);
    ctx.fillRect(-1, -7, 2, 14);
  }

  ctx.restore();
}

export function drawCampfire(ctx: CanvasRenderingContext2D, cf: CampfireProp, time: number): void {
  ctx.save();
  ctx.translate(Math.round(cf.x), Math.round(cf.y));
  // Stone ring & logs
  ctx.fillStyle = '#4a4d4f';
  ctx.beginPath();
  ctx.arc(0, 2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4f321c';
  ctx.fillRect(-8, 0, 16, 4);
  // Flickering pixel flames
  const f = Math.sin(time * 14 + cf.x) * 2;
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(-5, -8 + f * 0.4, 10, 10);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-3, -6 - f * 0.3, 6, 7);
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(-1, -3, 3, 3);
  ctx.restore();
}

export function drawPortalDoor(ctx: CanvasRenderingContext2D, door: PortalDoor, time: number): void {
  const pulse = 0.5 + Math.sin(time * 4) * 0.35;
  ctx.save();
  ctx.translate(Math.round(door.x), Math.round(door.y));
  ctx.fillStyle = `rgba(245, 190, 79, ${pulse * 0.45})`;
  ctx.fillRect(-12, -6, 24, 12);
  ctx.strokeStyle = `rgba(255, 224, 130, ${pulse})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-12, -6, 24, 12);
  ctx.restore();
}

export function drawWorkbench(
  ctx: CanvasRenderingContext2D,
  wb: WorkbenchProp,
  time: number
): void {
  const ember = 0.65 + Math.sin(time * 7 + wb.x * 0.05) * 0.35;
  ctx.save();
  ctx.translate(Math.round(wb.x), Math.round(wb.y));

  // Ground shadow
  ctx.fillStyle = 'rgba(8, 12, 10, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Heavy wooden forging bench base
  ctx.fillStyle = '#5c3d22';
  ctx.fillRect(-16, -6, 32, 15);
  ctx.fillStyle = '#78512d';
  ctx.fillRect(-15, -8, 30, 5);

  // Steel anvil silhouette
  ctx.fillStyle = '#334155';
  ctx.fillRect(-11, -13, 14, 7);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-13, -15, 18, 4);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-11, -15, 14, 1.5);

  // Mini glowing ember brazier on right side of bench
  ctx.fillStyle = '#292524';
  ctx.fillRect(6, -13, 9, 8);
  ctx.fillStyle = `rgba(249, 115, 22, ${ember})`;
  ctx.fillRect(7, -12, 7, 5);
  ctx.fillStyle = `rgba(253, 224, 71, ${ember})`;
  ctx.fillRect(9, -11, 3, 3);

  ctx.restore();
}

export function drawTeleporter(
  ctx: CanvasRenderingContext2D,
  tp: TeleporterStation,
  time: number,
  isNearby: boolean
): void {
  const pulse = 0.65 + Math.sin(time * 4.5 + tp.x * 0.04) * 0.35;
  const hover = Math.sin(time * 3.2) * 2.5;
  ctx.save();
  ctx.translate(Math.round(tp.x), Math.round(tp.y));

  // Outer carved stone/metal pad matching biome
  const padBase =
    tp.region === 'haven'
      ? '#47433c'
      : tp.region === 'city'
        ? '#334155'
        : tp.region === 'forest'
          ? '#274636'
          : tp.region === 'wasteland'
            ? '#47362b'
            : '#1e1b38';
  const padRim =
    tp.region === 'haven'
      ? '#a8844c'
      : tp.region === 'city'
        ? '#64748b'
        : tp.region === 'forest'
          ? '#4d7c59'
          : tp.region === 'wasteland'
            ? '#b45309'
            : '#7e22ce';

  // Contact shadow
  ctx.fillStyle = 'rgba(6, 10, 10, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 26, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Octagonal / circular stone dais
  ctx.fillStyle = padBase;
  ctx.beginPath();
  ctx.ellipse(0, 2, 23, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tp.activated ? tp.accentColor : padRim;
  ctx.lineWidth = tp.activated ? 2.5 : 1.5;
  ctx.stroke();

  // Animated concentric energy rings when activated (or faint dormant ring when locked)
  ctx.strokeStyle = tp.activated ? tp.accentColor : 'rgba(148, 163, 184, 0.35)';
  ctx.globalAlpha = tp.activated ? 0.78 * pulse : 0.45;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 9.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (tp.activated) {
    const waveR = 8 + ((time * 18) % 16);
    ctx.globalAlpha = Math.max(0, 1 - (waveR - 8) / 16) * 0.8;
    ctx.strokeStyle = tp.secondaryColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 2, waveR, waveR * 0.58, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Twin regional archway pylons
  ctx.fillStyle = padRim;
  ctx.fillRect(-19, -20, 6, 20);
  ctx.fillRect(13, -20, 6, 20);
  ctx.fillStyle = tp.activated ? tp.accentColor : '#64748b';
  ctx.fillRect(-18, -22, 4, 4);
  ctx.fillRect(14, -22, 4, 4);

  // Biome-specific crown / crystal centerpiece
  if (tp.region === 'forest') {
    // Mossy vine accents
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-20, -10, 4, 4);
    ctx.fillRect(16, -12, 4, 5);
  } else if (tp.region === 'wasteland') {
    // Industrial hazard crossbars
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-19, -6, 6, 2);
    ctx.fillRect(13, -6, 6, 2);
  } else if (tp.region === 'city') {
    // Metro transit arch header
    ctx.fillStyle = '#475569';
    ctx.fillRect(-19, -24, 38, 4);
  }

  // Levitating harmonic crystal in center
  const cy = -13 + (tp.activated ? hover : 0);
  ctx.fillStyle = tp.activated ? tp.accentColor : '#475569';
  ctx.beginPath();
  ctx.moveTo(0, cy - 9);
  ctx.lineTo(6, cy);
  ctx.lineTo(0, cy + 8);
  ctx.lineTo(-6, cy);
  ctx.closePath();
  ctx.fill();

  if (tp.activated) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.5, cy - 4, 3, 6);
    // Orbiting energy motes
    for (let i = 0; i < 3; i++) {
      const a = time * 2.8 + (i * Math.PI * 2) / 3;
      const ox = Math.cos(a) * 14;
      const oy = Math.sin(a) * 6 - 10;
      ctx.fillStyle = i % 2 === 0 ? tp.accentColor : tp.secondaryColor;
      ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
    }
  } else {
    // Subtle pulsing amber marker so undiscovered/unactivated stations stand out
    ctx.strokeStyle = `rgba(250, 204, 21, ${pulse * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, cy, 9 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Floating station nameplate when nearby or discovered
  if (isNearby) {
    const label = tp.activated ? `${tp.name} · Active` : tp.name;
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(11, 18, 16, 0.88)';
    ctx.fillRect(-w / 2, -40, w, 15);
    ctx.strokeStyle = tp.activated ? tp.accentColor : '#f5be4f';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2, -40, w, 15);
    ctx.fillStyle = tp.activated ? '#e6fffb' : '#fef3c7';
    ctx.fillText(label, 0, -29);
  }

  ctx.restore();
}

export function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile): void {
  ctx.save();
  if (p.kind === 'energy_wave') {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle ?? Math.atan2(p.vy, p.vx));
    // Outer energy crescent
    ctx.strokeStyle = p.accentColor ?? p.color;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(-4, 0, p.radius + 5, -1.05, 1.05);
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-2, 0, p.radius + 2, -0.95, 0.95);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-1, 0, p.radius, -0.75, 0.75);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (p.kind === 'player_arrow') {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle ?? Math.atan2(p.vy, p.vx));
    // Subtle streak trail
    ctx.fillStyle = p.accentColor ?? 'rgba(254, 243, 199, 0.45)';
    ctx.globalAlpha = 0.45;
    ctx.fillRect(-14, -1.2, 7, 2.4);
    ctx.globalAlpha = 1;
    // Fletching feathers
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, -2.6, 3.2, 1.4);
    ctx.fillRect(-8, 1.2, 3.2, 1.4);
    // Wooden / Arc shaft
    ctx.fillStyle = p.color;
    ctx.fillRect(-7, -1, 13, 2);
    // Steel / Arc arrowhead
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(5, -2.2, 3.5, 4.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7.5, -1, 2.5, 2);
    ctx.restore();
    return;
  }

  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

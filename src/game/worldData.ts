import {
  CampfireProp,
  CollectibleNode,
  EnemyEntity,
  LandmarkZone,
  NpcEntity,
  PortalDoor,
  RegionId,
  RestorationNode,
  TeleporterStation,
  TileType,
  WorkbenchProp,
} from './types';

export const TILE_SIZE = 32;
export const WORLD_W = 120;
export const WORLD_H = 84;
export const CORE_RELAYS_REQUIRED = 4;

export interface InteriorMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[];
}

export interface WorldBlueprint {
  width: number;
  height: number;
  tiles: TileType[];
  interiors: Record<string, InteriorMap>;
  npcs: NpcEntity[];
  enemies: EnemyEntity[];
  restorationNodes: RestorationNode[];
  collectibles: CollectibleNode[];
  landmarks: LandmarkZone[];
  doors: PortalDoor[];
  campfires: CampfireProp[];
  workbenches: WorkbenchProp[];
  teleporters: TeleporterStation[];
  playerSpawn: { x: number; y: number };
  coreGateTiles: { tx: number; ty: number }[];
}

export function getRegionAtTile(tx: number, ty: number): RegionId {
  if (ty < 42) {
    return tx < 58 ? 'city' : 'wasteland';
  }
  if (tx < 42) return 'haven';
  if (tx < 86) return 'forest';
  return 'core';
}

export function getRegionAtWorld(x: number, y: number): RegionId {
  const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(x / TILE_SIZE)));
  const ty = Math.max(0, Math.min(WORLD_H - 1, Math.floor(y / TILE_SIZE)));
  return getRegionAtTile(tx, ty);
}

// Deterministic pseudo-random helper for handcrafted organic foliage/variation
function hash2d(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function createWorldBlueprint(): WorldBlueprint {
  const tiles: TileType[] = new Array(WORLD_W * WORLD_H).fill('grass');

  const setTile = (x: number, y: number, t: TileType) => {
    if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
      tiles[y * WORLD_W + x] = t;
    }
  };
  const getTile = (x: number, y: number): TileType => {
    if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return 'cliff';
    return tiles[y * WORLD_W + x];
  };
  const fillRect = (x0: number, y0: number, w: number, h: number, t: TileType) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        setTile(x, y, t);
      }
    }
  };

  // 1. BASE BIOME TERRAIN
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const r = getRegionAtTile(x, y);
      const h = hash2d(x, y);
      if (r === 'haven') {
        setTile(x, y, h > 0.88 ? 'grass_flower' : h > 0.72 ? 'tall_grass' : 'grass');
      } else if (r === 'city') {
        setTile(x, y, h > 0.8 ? 'tall_grass' : 'sidewalk');
      } else if (r === 'forest') {
        setTile(x, y, h > 0.82 ? 'grass_flower' : h > 0.55 ? 'tall_grass' : 'grass');
      } else if (r === 'wasteland') {
        setTile(x, y, h > 0.86 ? 'dirt' : 'industrial_floor');
      } else {
        setTile(x, y, h > 0.82 ? 'core_circuit' : 'core_floor');
      }
    }
  }

  // Outer world cliff boundary
  for (let x = 0; x < WORLD_W; x++) {
    setTile(x, 0, 'cliff');
    setTile(x, 1, 'cliff');
    setTile(x, WORLD_H - 1, 'cliff');
    setTile(x, WORLD_H - 2, 'cliff');
  }
  for (let y = 0; y < WORLD_H; y++) {
    setTile(0, y, 'cliff');
    setTile(1, y, 'cliff');
    setTile(WORLD_W - 1, y, 'cliff');
    setTile(WORLD_W - 2, y, 'cliff');
  }

  // =========================================================================
  // REGION 1: THE LAST HAVEN (x: 2..41, y: 42..81)
  // =========================================================================
  // Natural tree border along west & south of Haven
  for (let y = 42; y < 82; y++) {
    for (let x = 2; x < 42; x++) {
      const h = hash2d(x * 3, y * 5);
      const edge = x < 6 || y > 76 || (y < 46 && (x < 16 || x > 32));
      if (edge && h > 0.35) {
        setTile(x, y, h > 0.65 ? 'tree_pine' : 'tree_oak');
      } else if (h > 0.92) {
        setTile(x, y, h > 0.96 ? 'tree_pine' : 'tree_oak');
      }
    }
  }

  // Dirt footpaths & Haven central plaza
  fillRect(14, 57, 15, 10, 'dirt'); // Central plaza
  fillRect(19, 42, 5, 18, 'dirt'); // North trail to Haven Ridge & City Gate
  fillRect(27, 60, 18, 4, 'dirt'); // East trail toward Forest River Bridge
  fillRect(8, 60, 8, 4, 'dirt'); // West cabin lane
  fillRect(18, 66, 4, 9, 'dirt'); // South orchard trail

  // Picket fences framing survivor settlement
  for (let x = 10; x <= 34; x++) {
    if (x < 19 || x > 23) setTile(x, 52, 'fence');
  }
  for (let x = 10; x <= 32; x++) {
    if (x < 18 || x > 21) setTile(x, 71, 'fence');
  }

  // Cabin helper (wooden walls + corrugated roof, door gap)
  const buildCabin = (x0: number, y0: number, w: number, h: number, doorOffsetX?: number) => {
    fillRect(x0, y0, w, Math.max(2, h - 2), 'roof_cabin');
    fillRect(x0, y0 + Math.max(2, h - 2), w, 2, 'wall_wood');
    if (doorOffsetX !== undefined) {
      setTile(x0 + doorOffsetX, y0 + h - 1, 'dirt');
    }
  };

  // Haven Cabins
  buildCabin(9, 54, 6, 5); // Elder's Cabin
  buildCabin(28, 53, 7, 5, 3); // Tinker Jax's Workshop (Enterable!)
  buildCabin(9, 65, 6, 5); // Survivor Bunkhouse
  buildCabin(28, 66, 6, 5); // Dr. Lin's Field Shed

  // Abandoned rusted vans/vehicles along Haven perimeter (matching reference!)
  setTile(15, 53, 'wreck_car');
  setTile(16, 53, 'wreck_car');
  setTile(34, 65, 'wreck_car');
  setTile(12, 73, 'wreck_car');

  // Haven Ridge clearing for Communication Tower
  fillRect(24, 44, 11, 7, 'dirt');
  fillRect(17, 45, 8, 4, 'dirt');

  // =========================================================================
  // REGION 2: THE FORGOTTEN CITY (x: 2..57, y: 2..41)
  // =========================================================================
  // Asphalt avenue grid
  fillRect(19, 6, 5, 36, 'road'); // Main North-South Avenue (connects directly to Haven!)
  fillRect(6, 20, 52, 5, 'road'); // Main East-West Boulevard (leads into Wasteland!)
  fillRect(39, 6, 4, 34, 'road'); // East Civic Street
  fillRect(6, 8, 36, 4, 'road'); // North Crosstown Road

  // Ruined Skyscraper / Apartment Blocks (gridded windows + roof)
  const buildCityBlock = (x0: number, y0: number, w: number, h: number) => {
    fillRect(x0, y0, w, h - 2, 'roof_city');
    fillRect(x0, y0 + h - 2, w, 2, 'wall_concrete');
  };

  buildCityBlock(6, 13, 11, 6); // West Towers
  buildCityBlock(26, 13, 11, 6); // Central Commerce Block
  buildCityBlock(6, 27, 11, 7); // South Apartments
  buildCityBlock(26, 27, 11, 7); // Civic Center Ruins
  buildCityBlock(45, 11, 9, 7); // East Skyscraper
  buildCityBlock(45, 27, 9, 7); // Substation Annex

  // Hidden northwest alley behind rubble
  fillRect(3, 3, 14, 5, 'ruin_floor');
  fillRect(17, 4, 3, 5, 'sidewalk');

  // Abandoned cars & creeping trees on city roads
  const cityCars: [number, number][] = [
    [20, 32],
    [22, 26],
    [13, 21],
    [31, 23],
    [40, 16],
    [48, 22],
  ];
  for (const [cx, cy] of cityCars) setTile(cx, cy, 'wreck_car');

  const cityTrees: [number, number][] = [
    [4, 26],
    [5, 35],
    [17, 36],
    [25, 36],
    [38, 36],
    [44, 36],
    [14, 12],
    [37, 12],
    [54, 14],
    [54, 32],
  ];
  for (const [tx, ty] of cityTrees) setTile(tx, ty, 'tree_oak');

  // Clear open plaza around City Substation
  fillRect(34, 10, 8, 8, 'sidewalk');

  // =========================================================================
  // REGION 3: THE OVERGROWN FOREST (x: 42..85, y: 42..81)
  // =========================================================================
  // Winding emerald river flowing north-to-south through Forest (matching reference!)
  for (let y = 42; y < 82; y++) {
    const wave = Math.round(Math.sin(y * 0.22) * 2.5);
    const rx = 50 + wave;
    for (let dx = -2; dx <= 2; dx++) {
      setTile(rx + dx, y, 'water');
    }
  }
  // Secondary pond near Hidden Cave
  fillRect(72, 68, 8, 7, 'water');

  // Dense handcrafted forest canopy outside paths
  for (let y = 43; y < 81; y++) {
    for (let x = 42; x < 85; x++) {
      if (getTile(x, y) === 'water') continue;
      const h = hash2d(x * 7, y * 11);
      if (h > 0.74) {
        setTile(x, y, h > 0.87 ? 'tree_oak' : 'tree_pine');
      }
    }
  }

  // Forest trails & wooden bridges across the river!
  fillRect(41, 60, 26, 4, 'dirt'); // Main West-East forest road from Haven
  // Wooden bridges over river
  for (let x = 46; x <= 55; x++) {
    for (let y = 60; y <= 63; y++) {
      if (getTile(x, y) === 'water' || (x >= 47 && x <= 54)) {
        setTile(x, y, 'bridge');
      }
    }
  }
  // Northern bridge & trail linking Forest up to Industrial Wasteland
  fillRect(62, 41, 5, 22, 'dirt');
  // Southern trail to Waterwheel & Hidden Cave
  fillRect(58, 63, 4, 13, 'dirt');
  fillRect(56, 73, 18, 4, 'dirt');

  // Sunken Forest Shrine & Ancient Ruins (matching reference!)
  fillRect(60, 50, 14, 11, 'ruin_floor');
  // Mossy shrine hut roof/walls on north edge of clearing
  fillRect(64, 49, 6, 3, 'roof_cabin');
  fillRect(64, 52, 6, 1, 'wall_wood');
  setTile(66, 52, 'ruin_floor');
  setTile(67, 52, 'ruin_floor');
  // Ruined stone pillars framing the shrine
  setTile(61, 53, 'wall_brick');
  setTile(72, 53, 'wall_brick');
  setTile(61, 59, 'wall_brick');
  setTile(72, 59, 'wall_brick');

  // Eastern road leading to The Lost Core Gate!
  fillRect(72, 58, 16, 5, 'ruin_floor');

  // Riverbank clearing for Waterwheel
  fillRect(53, 68, 7, 6, 'dirt');
  // Hidden cave clearing
  fillRect(68, 75, 13, 5, 'ruin_floor');

  // =========================================================================
  // REGION 4: THE INDUSTRIAL WASTELAND (x: 58..117, y: 2..41)
  // =========================================================================
  // Industrial highway continuing east from Forgotten City
  fillRect(57, 20, 54, 5, 'road');
  fillRect(62, 24, 5, 19, 'road'); // South connector to Overgrown Forest
  fillRect(88, 8, 5, 34, 'road'); // East Foundry Spine (leads down toward Core!)

  // Factory complexes
  const buildFactory = (x0: number, y0: number, w: number, h: number) => {
    fillRect(x0, y0, w, h - 2, 'roof_factory');
    fillRect(x0, y0 + h - 2, w, 2, 'wall_metal');
  };

  buildFactory(64, 8, 16, 9); // North Foundry Hall
  buildFactory(96, 8, 15, 9); // Coolant Refinery
  buildFactory(70, 28, 14, 9); // Heavy Assembly Plant
  buildFactory(97, 28, 14, 8); // East Turbine Warehouse

  // Toxic sludge pools (hazardous unless player crafts Hazmat Filter Mask!)
  fillRect(82, 10, 5, 8, 'toxic');
  fillRect(60, 29, 7, 7, 'toxic');
  fillRect(94, 19, 15, 1, 'industrial_floor'); // clean shoulder
  fillRect(102, 18, 8, 2, 'toxic');
  fillRect(76, 37, 9, 4, 'toxic');

  // Dead industrial trees & rusted wrecks
  const wasteProps: [number, number, TileType][] = [
    [60, 12, 'tree_dead'],
    [62, 15, 'wreck_car'],
    [84, 28, 'wreck_car'],
    [95, 37, 'tree_dead'],
    [112, 16, 'tree_dead'],
    [113, 27, 'wreck_car'],
    [72, 21, 'wreck_car'],
  ];
  for (const [wx, wy, wt] of wasteProps) setTile(wx, wy, wt);

  // Air Purifier platform clearing
  fillRect(82, 19, 12, 7, 'industrial_floor');

  // =========================================================================
  // REGION 5: THE LOST CORE (x: 86..117, y: 42..81)
  // =========================================================================
  // Ancient obsidian walls separating The Lost Core from Forest & Wasteland
  for (let y = 42; y < 82; y++) {
    setTile(85, y, 'wall_core');
    setTile(86, y, 'wall_core');
  }
  for (let x = 85; x < 118; x++) {
    setTile(x, 42, 'wall_core');
    setTile(x, 43, 'wall_core');
  }

  // The Core Gate (4 tiles wide on west entrance of Core at x=85..86, y=58..61)
  const coreGateTiles: { tx: number; ty: number }[] = [];
  for (let y = 58; y <= 61; y++) {
    for (let x = 85; x <= 86; x++) {
      setTile(x, y, 'core_gate');
      coreGateTiles.push({ tx: x, ty: y });
    }
  }

  // Glowing geometric circuit causeway leading to the central World Core Arena
  fillRect(87, 58, 26, 5, 'core_circuit');
  fillRect(96, 48, 16, 25, 'core_floor');
  // Circuit cross inside boss arena
  fillRect(102, 48, 4, 25, 'core_circuit');
  fillRect(96, 58, 16, 5, 'core_circuit');

  // Ancient glowing monolith pillars around the Core sanctum
  const monoliths: [number, number][] = [
    [93, 52],
    [93, 68],
    [112, 52],
    [112, 68],
    [98, 49],
    [109, 49],
    [98, 71],
    [109, 71],
  ];
  for (const [mx, my] of monoliths) {
    setTile(mx, my, 'wall_core');
  }

  // =========================================================================
  // ENTERABLE INTERIOR: TINKER JAX'S HAVEN WORKSHOP
  // =========================================================================
  const wsW = 16;
  const wsH = 12;
  const wsTiles: TileType[] = new Array(wsW * wsH).fill('interior_floor');
  for (let x = 0; x < wsW; x++) {
    wsTiles[0 * wsW + x] = 'interior_wall';
    wsTiles[1 * wsW + x] = 'interior_wall';
    wsTiles[(wsH - 1) * wsW + x] = 'interior_wall';
  }
  for (let y = 0; y < wsH; y++) {
    wsTiles[y * wsW + 0] = 'interior_wall';
    wsTiles[y * wsW + (wsW - 1)] = 'interior_wall';
  }
  // Exit mat at bottom center
  wsTiles[(wsH - 1) * wsW + 7] = 'interior_floor';
  wsTiles[(wsH - 1) * wsW + 8] = 'interior_floor';
  // Workbenches
  wsTiles[3 * wsW + 3] = 'wall_wood';
  wsTiles[3 * wsW + 4] = 'wall_wood';
  wsTiles[3 * wsW + 11] = 'wall_wood';
  wsTiles[3 * wsW + 12] = 'wall_wood';

  const interiors: Record<string, InteriorMap> = {
    haven_workshop: {
      id: 'haven_workshop',
      name: "Tinker's Workshop",
      width: wsW,
      height: wsH,
      tiles: wsTiles,
    },
  };

  // =========================================================================
  // ENTITIES: NPCs, RESTORATION NODES, COLLECTIBLES, LANDMARKS, ENEMIES
  // =========================================================================
  const pt = (tx: number, ty: number) => ({
    x: tx * TILE_SIZE + TILE_SIZE / 2,
    y: ty * TILE_SIZE + TILE_SIZE / 2,
  });

  // Ensure key spawn tiles are cleanly walkable
  const ensureClear = (tx: number, ty: number, tile: TileType = 'dirt') => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cur = getTile(tx + dx, ty + dy);
        if (
          cur === 'tree_pine' ||
          cur === 'tree_oak' ||
          cur === 'tree_dead' ||
          cur === 'wreck_car' ||
          cur === 'fence' ||
          cur === 'water' ||
          cur === 'cliff'
        ) {
          setTile(tx + dx, ty + dy, tile);
        }
      }
    }
  };

  const playerSpawn = pt(18, 62);
  ensureClear(18, 62, 'dirt');

  const npcs: NpcEntity[] = [
    {
      id: 'npc_mara',
      name: 'Elder Mara',
      role: 'Settlement Leader',
      region: 'haven',
      ...pt(23, 60),
      facing: 'left',
      palette: { coat: '#8a4c32', hair: '#d8d4c8', accent: '#e7b665', skin: '#e6b896' },
      greeting:
        'You finally woke up, traveler! We found you outside the valley wall clutching that glowing Arc-Device. The world fell twenty winters ago—maybe you can help us make it rise again.',
      restoredGreeting:
        'Look at the glow returning to Haven! Folks are smiling for the first time in years. Push north to the City and east into the Forest—the other relays are waiting.',
      loreLines: [
        'Before The Fall, an energy grid powered every city from a single heart called The Lost Core.',
        'Restoring local relays not only brings back light and safety—it lets you Fast Travel from your World Map [M].',
      ],
      questIds: ['m1_wake_up', 'm2_find_survivors', 's1_haven_lights'],
    },
    {
      id: 'npc_jax',
      name: 'Tinker Jax',
      role: 'Trader',
      region: 'haven',
      ...pt(30, 59),
      facing: 'down',
      palette: { coat: '#3c5a73', hair: '#4a3525', accent: '#d9913b', skin: '#d9a482' },
      greeting:
        'Hey! Watch the sparks—name is Jax. Step inside my Workshop behind me for spare supplies, or trade your salvage here. You can also craft permanent gear upgrades anytime in your Inventory [I]!',
      restoredGreeting:
        'With power humming back through Haven, my lathe runs smooth again! Bring me Scrap or Mech Parts anytime.',
      loreLines: [
        'I stashed an emergency crate in a hidden northwest alley of The Forgotten City before the drones took over.',
        'Upgrade your Arc-Blade and Kinetic Boots as soon as you collect Mech Components from hostile machines.',
      ],
      questIds: ['m2_find_survivors', 's2_missing_supplies'],
      trades: [
        {
          id: 'tr_scrap_ration',
          giveItem: 'scrap',
          giveQty: 2,
          receiveItem: 'ration',
          receiveQty: 1,
          label: 'Field Rations (+35 HP)',
        },
        {
          id: 'tr_scrap_medkit',
          giveItem: 'scrap',
          giveQty: 4,
          receiveItem: 'medkit',
          receiveQty: 1,
          label: 'Survivor Medkit (+75 HP)',
        },
        {
          id: 'tr_scrap_crystal',
          giveItem: 'scrap',
          giveQty: 5,
          receiveItem: 'crystal',
          receiveQty: 1,
          label: 'Arc Crystal (Relay Fuel)',
        },
        {
          id: 'tr_parts_alloy',
          giveItem: 'parts',
          giveQty: 3,
          receiveItem: 'rare_alloy',
          receiveQty: 1,
          label: 'Aegis Alloy (Rare)',
        },
        {
          id: 'tr_gold_arrows_10',
          giveGold: 15,
          receiveItem: 'arrow',
          receiveQty: 10,
          label: 'Quiver of 10 Arrows',
        },
        {
          id: 'tr_gold_arrows_25',
          giveGold: 35,
          receiveItem: 'arrow',
          receiveQty: 25,
          label: 'Full Bundle of 25 Arrows',
        },
        {
          id: 'tr_scrap_to_gold',
          giveItem: 'scrap',
          giveQty: 2,
          receiveGold: 12,
          label: 'Sell Scrap for 12 Gold',
        },
      ],
    },
    {
      id: 'npc_bram',
      name: 'Blacksmith Bram',
      role: 'Blacksmith',
      region: 'haven',
      ...pt(25, 59),
      facing: 'right',
      palette: { coat: '#5c3324', hair: '#40342c', accent: '#f59e0b', skin: '#d8a07a' },
      greeting:
        'Hold on, traveler—my forge is cold until I get my Forging Hammer back! A rogue drone chased me off Haven Comm Ridge north of town and I dropped it by the ridge clearing. Bring it back and my whole weapon & armour workshop is yours to use.',
      restoredGreeting:
        'There is the ring of good steel again! Step up to my workshop anytime to forge swords, axes, bows, and protective armour—or temper your favorite gear with upgrades.',
      loreLines: [
        'Swords stay swift, Axes cleave heavy through clusters, and Bows let you pick off drones from range as long as you carry Arrows.',
        'Good armour keeps you standing when the Wasteland turrets open fire. Bring me Salvage, Mech Parts, Crystals, and Gold.',
      ],
      questIds: ['s6_missing_hammer'],
    },
    {
      id: 'npc_lin',
      name: 'Dr. Lin',
      role: 'Scientist',
      region: 'haven',
      ...pt(26, 67),
      facing: 'up',
      palette: { coat: '#d2d7d9', hair: '#25292e', accent: '#49c6c6', skin: '#edd0b6' },
      greeting:
        'Fascinating! Your Arc-Device resonates on the exact harmonic frequency of the pre-Fall relays. Restore our Haven Generator first, then climb to the northern Communication Tower.',
      restoredGreeting:
        'The Communication Tower picked up active distress echoes from The Forgotten City, The Overgrown Forest, and the Foundry Wasteland. Restore 4 relays to unseal The Lost Core!',
      loreLines: [
        'Each restored relay emits a stabilizing field that pushes back the gloom and charges your Arc-Device.',
        'Press [Q] in combat to discharge an Arc Shockwave when surrounded—it costs 25 Arc Energy.',
      ],
      questIds: ['m2_find_survivors', 'm3_comm_tower'],
    },
    {
      id: 'npc_kael',
      name: 'Scout Kael',
      role: 'Explorer',
      region: 'city',
      ...pt(23, 25),
      facing: 'down',
      palette: { coat: '#4c6148', hair: '#6b4228', accent: '#c95e49', skin: '#c48f6c' },
      greeting:
        'Keep your head down, survivor! Security Drones patrol the avenues, and Scrap Stalkers charge fast once they lock on. Dodge with [Space] when you see their red attack telegraph.',
      restoredGreeting:
        'The City Substation is alive again! Streetlamps are flickering across the avenue. The eastern boulevard leads straight into the Industrial Wasteland.',
      loreLines: [
        'Check the overgrown alleys on the northwest edge—there is an old trade stash buried behind the brick blocks.',
      ],
      questIds: ['m4_forgotten_city', 's5_scrap_purge'],
    },
    {
      id: 'npc_moss',
      name: 'Herbalist Moss',
      role: 'Survivor',
      region: 'forest',
      ...pt(59, 57),
      facing: 'left',
      palette: { coat: '#386649', hair: '#523c2b', accent: '#8ad47b', skin: '#d8ad8c' },
      greeting:
        'The forest reclaimed the roads, yet the ancient stone shrine still breathes with Arc light. Watch out for Spore Crawlers near the ruins and caves.',
      restoredGreeting:
        'The Ancient Grove Conduit sings again—even the river water looks clearer! Take these medicines if you are heading toward the Wasteland or The Core.',
      loreLines: [
        'Follow the southern riverbank past the waterwheel to find a Hidden River Cave rich with Arc Crystals.',
      ],
      questIds: ['m5_energy_source', 's3_forest_herbs', 's4_river_mill'],
      trades: [
        {
          id: 'tr_moss_medkit',
          giveItem: 'scrap',
          giveQty: 3,
          receiveItem: 'medkit',
          receiveQty: 1,
          label: 'Herbal Medkit (+75 HP)',
        },
        {
          id: 'tr_moss_energy',
          giveItem: 'scrap',
          giveQty: 3,
          receiveItem: 'energy_cell',
          receiveQty: 1,
          label: 'Arc Battery Cell (+65 Energy)',
        },
        {
          id: 'tr_moss_arrows',
          giveGold: 22,
          receiveItem: 'arrow',
          receiveQty: 15,
          label: 'Fletched Forest Arrows (15×)',
        },
      ],
    },
    {
      id: 'npc_vance',
      name: 'Foreman Vance',
      role: 'Engineer',
      region: 'wasteland',
      ...pt(77, 23),
      facing: 'right',
      palette: { coat: '#7d5030', hair: '#5a5c60', accent: '#e8b339', skin: '#c99778' },
      greeting:
        'Careful where you step out here—the glowing green coolant sludge burns right through normal boots unless you craft a Wasteland Filter Mask! Help me restart the Air Purifier ahead.',
      restoredGreeting:
        'Ha! Hear those turbines spin up? The smog is clearing across the whole foundry sector. South through the Forest lies the sealed gate to The Lost Core.',
      loreLines: [
        'Heavy Defense Turrets fire radial plasma bursts. Wait for the gap between waves, dash in, and strike!',
      ],
      questIds: ['m6_wasteland'],
    },
    {
      id: 'npc_echo',
      name: 'Echo-7',
      role: 'Construct',
      region: 'core',
      ...pt(90, 60),
      facing: 'left',
      palette: { coat: '#354954', hair: '#4cd3c2', accent: '#6ef2e2', skin: '#89a3ad' },
      greeting:
        'SIGNAL RECOGNIZED. Carrier of the Arc-Device, welcome to The Lost Core. During The Fall, the Aegis Sentinel entered lockdown corruption and severed the global grid.',
      restoredGreeting:
        'HARMONIC RESTORATION COMPLETE. The grid rises across every valley and city. Humanity has bounced back.',
      loreLines: [
        'Beyond this causeway waits the Aegis Core Sentinel. Watch its phase shift at 50% integrity, then restore the World Core Altar behind it.',
      ],
      questIds: ['m7_lost_core', 'm8_restore_world'],
    },
  ];

  // Clear tiles around NPCs
  for (const n of npcs) {
    ensureClear(Math.floor(n.x / TILE_SIZE), Math.floor(n.y / TILE_SIZE), n.region === 'city' ? 'sidewalk' : 'dirt');
  }

  // 9 WORLD RESTORATION NODES (Signature "Bounce Back" Mechanic!)
  const restorationNodes: RestorationNode[] = [
    {
      id: 'node_haven_cabin',
      name: 'Abandoned Survivor House',
      kind: 'house',
      region: 'haven',
      ...pt(12, 70),
      radius: 44,
      cost: { scrap: 2 },
      energyCost: 15,
      restored: false,
      description: 'Boarded-up survivor home on the southern edge of The Last Haven.',
      restoredEffect: 'Repairs the porch lantern and blooms a wildflower garden around the cabin.',
      fastTravelUnlocked: false,
    },
    {
      id: 'node_haven_lights',
      name: 'Haven Plaza Streetlights',
      kind: 'streetlights',
      region: 'haven',
      ...pt(20, 61),
      radius: 44,
      cost: { scrap: 2 },
      energyCost: 15,
      restored: false,
      description: 'Rusted lamp grid around the central survivor square.',
      restoredEffect: 'Illuminates The Last Haven throughout Dusk and Night.',
      fastTravelUnlocked: false,
    },
    {
      id: 'node_haven_generator',
      name: 'Haven Settlement Generator',
      kind: 'generator',
      region: 'haven',
      ...pt(23, 66),
      radius: 48,
      cost: { scrap: 2, crystal: 1 },
      energyCost: 20,
      restored: false,
      description: 'Main turbine generator powering survivor cabins and workshop tools.',
      restoredEffect: 'Restores warm lights to Haven and unlocks Haven Fast Travel.',
      fastTravelUnlocked: true,
    },
    {
      id: 'node_comm_tower',
      name: 'Haven Communication Tower',
      kind: 'comm_tower',
      region: 'haven',
      ...pt(29, 47),
      radius: 50,
      cost: { scrap: 3, crystal: 1 },
      energyCost: 25,
      restored: false,
      description: 'Long-range relay antenna on Haven Ridge overlooking the valley.',
      restoredEffect: 'Broadcasts survivor beacon and reveals regional relays on the World Map.',
      fastTravelUnlocked: true,
    },
    {
      id: 'node_city_substation',
      name: 'Civic Power Substation',
      kind: 'substation',
      region: 'city',
      ...pt(38, 14),
      radius: 52,
      cost: { scrap: 4, parts: 2, crystal: 1 },
      energyCost: 30,
      restored: false,
      description: 'Pre-Fall electrical grid hub for The Forgotten City.',
      restoredEffect: 'Restores civic street lighting and unlocks City Fast Travel.',
      fastTravelUnlocked: true,
    },
    {
      id: 'node_grove_conduit',
      name: 'Ancient Grove Conduit',
      kind: 'grove_conduit',
      region: 'forest',
      ...pt(67, 56),
      radius: 52,
      cost: { crystal: 2, scrap: 2 },
      energyCost: 30,
      restored: false,
      description: 'Moss-covered obelisk pulsing faintly inside the Sunken Shrine.',
      restoredEffect: 'Revives forest bioluminescence and unlocks Forest Fast Travel.',
      fastTravelUnlocked: true,
    },
    {
      id: 'node_river_waterwheel',
      name: 'Forest River Waterwheel',
      kind: 'waterwheel',
      region: 'forest',
      ...pt(55, 70),
      radius: 48,
      cost: { scrap: 3, parts: 1 },
      energyCost: 20,
      restored: false,
      description: 'Stalled wooden hydro-wheel along the eastern riverbend.',
      restoredEffect: 'Pumps clean water to Haven and boosts regional vitality.',
      fastTravelUnlocked: false,
    },
    {
      id: 'node_air_purifier',
      name: 'Foundry Air Purifier',
      kind: 'air_purifier',
      region: 'wasteland',
      ...pt(86, 22),
      radius: 54,
      cost: { parts: 3, rare_alloy: 1, crystal: 1 },
      energyCost: 35,
      restored: false,
      description: 'Massive atmospheric scrubber tower in the heart of the Industrial Wasteland.',
      restoredEffect: 'Clears toxic haze and unlocks Wasteland Fast Travel.',
      fastTravelUnlocked: true,
    },
    {
      id: 'node_world_core',
      name: 'The World Core Altar',
      kind: 'world_core',
      region: 'core',
      ...pt(108, 60),
      radius: 60,
      cost: { crystal: 2, rare_alloy: 1 },
      energyCost: 40,
      restored: false,
      description: 'The central harmonic nexus of civilization. Defeat the Core Sentinel to unlock.',
      restoredEffect: 'Reignites the global energy grid and restores the fallen world!',
      fastTravelUnlocked: true,
    },
  ];

  for (const rn of restorationNodes) {
    ensureClear(Math.floor(rn.x / TILE_SIZE), Math.floor(rn.y / TILE_SIZE), rn.region === 'city' ? 'sidewalk' : 'dirt');
  }

  // COLLECTIBLE RESOURCES & HIDDEN STASHES (26 handcrafted pickups)
  const collectibles: CollectibleNode[] = [
    // Haven starter resources (generous so Stage 1 restoration feels super smooth!)
    { id: 'c_h1', region: 'haven', ...pt(15, 59), itemId: 'scrap', qty: 2, kind: 'crate', collected: false, label: 'Scrap Crate' },
    { id: 'c_h2', region: 'haven', ...pt(13, 64), itemId: 'ration', qty: 2, kind: 'barrel', collected: false, label: 'Supply Barrel' },
    { id: 'c_h3', region: 'haven', ...pt(26, 56), itemId: 'crystal', qty: 1, kind: 'crystal', collected: false, label: 'Arc Crystal Shard' },
    { id: 'c_h4', region: 'haven', ...pt(21, 50), itemId: 'scrap', qty: 3, kind: 'crate', collected: false, label: 'Ridge Salvage' },
    { id: 'c_h5', region: 'haven', ...pt(33, 69), itemId: 'crystal', qty: 1, kind: 'crystal', collected: false, label: 'Buried Crystal' },
    { id: 'c_h6', region: 'haven', ...pt(20, 73), itemId: 'scrap', qty: 2, kind: 'crate', collected: false, label: 'Orchard Crate' },
    { id: 'c_blacksmith_hammer', region: 'haven', ...pt(24, 48), itemId: 'blacksmith_hammer', qty: 1, kind: 'chest', collected: false, label: "Bram's Forging Hammer" },
    // Inside Tinker's Workshop interior!
    { id: 'c_ws1', region: 'haven', x: 5 * TILE_SIZE + 16, y: 5 * TILE_SIZE + 16, itemId: 'parts', qty: 2, kind: 'chest', collected: false, label: 'Workshop Toolbox', interiorId: 'haven_workshop' },
    { id: 'c_ws2', region: 'haven', x: 10 * TILE_SIZE + 16, y: 5 * TILE_SIZE + 16, itemId: 'medkit', qty: 1, kind: 'crate', collected: false, label: 'Emergency Medkit', interiorId: 'haven_workshop' },

    // Forgotten City collectibles
    { id: 'c_c1', region: 'city', ...pt(18, 35), itemId: 'scrap', qty: 3, kind: 'crate', collected: false, label: 'Highway Salvage' },
    { id: 'c_c2', region: 'city', ...pt(24, 19), itemId: 'parts', qty: 2, kind: 'crate', collected: false, label: 'Drone Parts' },
    { id: 'c_c3', region: 'city', ...pt(10, 23), itemId: 'ration', qty: 2, kind: 'barrel', collected: false, label: 'Storefront Rations' },
    { id: 'c_c4', region: 'city', ...pt(41, 29), itemId: 'crystal', qty: 2, kind: 'crystal', collected: false, label: 'Shattered Conduit Crystal' },
    { id: 'c_c5', region: 'city', ...pt(8, 5), itemId: 'rare_alloy', qty: 2, kind: 'chest', collected: false, hidden: true, label: "Jax's Hidden Supply Stash" },
    { id: 'c_c6', region: 'city', ...pt(49, 24), itemId: 'parts', qty: 2, kind: 'crate', collected: false, label: 'Substation Salvage' },

    // Overgrown Forest collectibles
    { id: 'c_f1', region: 'forest', ...pt(45, 62), itemId: 'ration', qty: 2, kind: 'herb', collected: false, label: 'Wild Harvest Berries' },
    { id: 'c_f2', region: 'forest', ...pt(64, 54), itemId: 'crystal', qty: 2, kind: 'crystal', collected: false, label: 'Shrine Crystal' },
    { id: 'c_f3', region: 'forest', ...pt(70, 58), itemId: 'scrap', qty: 3, kind: 'crate', collected: false, label: 'Ruins Relics' },
    { id: 'c_f4', region: 'forest', ...pt(57, 71), itemId: 'parts', qty: 2, kind: 'barrel', collected: false, label: 'Mill Gears' },
    { id: 'c_f5', region: 'forest', ...pt(76, 77), itemId: 'crystal', qty: 3, kind: 'chest', collected: false, hidden: true, label: 'Hidden Cave Crystal Cache' },
    { id: 'c_f6', region: 'forest', ...pt(64, 46), itemId: 'rare_alloy', qty: 1, kind: 'alloy', collected: false, label: 'Ancient Alloy Plate' },

    // Industrial Wasteland collectibles
    { id: 'c_w1', region: 'wasteland', ...pt(67, 22), itemId: 'parts', qty: 3, kind: 'crate', collected: false, label: 'Foundry Servos' },
    { id: 'c_w2', region: 'wasteland', ...pt(78, 19), itemId: 'rare_alloy', qty: 2, kind: 'alloy', collected: false, label: 'Refined Aegis Alloy' },
    { id: 'c_w3', region: 'wasteland', ...pt(91, 13), itemId: 'energy_cell', qty: 2, kind: 'chest', collected: false, label: 'Turbine Charge Cells' },
    { id: 'c_w4', region: 'wasteland', ...pt(105, 24), itemId: 'rare_alloy', qty: 2, kind: 'alloy', collected: false, label: 'Vault Alloy Ingot' },
    { id: 'c_w5', region: 'wasteland', ...pt(90, 35), itemId: 'crystal', qty: 2, kind: 'crystal', collected: false, label: 'Reactor Crystal' },

    // Lost Core collectibles
    { id: 'c_core1', region: 'core', ...pt(94, 56), itemId: 'medkit', qty: 2, kind: 'chest', collected: false, label: 'Sanctum Med Cache' },
    { id: 'c_core2', region: 'core', ...pt(94, 64), itemId: 'energy_cell', qty: 2, kind: 'crystal', collected: false, label: 'Core Charge Node' },
  ];

  for (const col of collectibles) {
    if (!col.interiorId) {
      ensureClear(Math.floor(col.x / TILE_SIZE), Math.floor(col.y / TILE_SIZE), col.region === 'city' ? 'sidewalk' : 'dirt');
    }
  }

  // 15 DISCOVERABLE LANDMARKS across all 5 regions
  const landmarks: LandmarkZone[] = [
    { id: 'lm_haven_plaza', name: 'Haven Campfire Plaza', subtitle: 'The Last Haven', region: 'haven', ...pt(20, 62), radius: 180, discovered: true },
    { id: 'lm_haven_workshop', name: "Tinker's Workshop Yard", subtitle: 'The Last Haven', region: 'haven', ...pt(31, 58), radius: 130, discovered: false },
    { id: 'lm_haven_ridge', name: 'Haven Comm Ridge', subtitle: 'The Last Haven', region: 'haven', ...pt(28, 47), radius: 150, discovered: false },
    { id: 'lm_city_gate', name: 'Collapsed Highway Overpass', subtitle: 'The Forgotten City', region: 'city', ...pt(21, 38), radius: 150, discovered: false },
    { id: 'lm_city_plaza', name: 'Civic Boulevard Crossroads', subtitle: 'The Forgotten City', region: 'city', ...pt(21, 22), radius: 170, discovered: false },
    { id: 'lm_city_substation', name: 'Ruined Power Substation', subtitle: 'The Forgotten City', region: 'city', ...pt(38, 14), radius: 150, discovered: false },
    { id: 'lm_city_hidden_alley', name: 'Hidden Vine Alley', subtitle: 'Secret Location · Forgotten City', region: 'city', ...pt(10, 5), radius: 140, discovered: false },
    { id: 'lm_forest_bridge', name: 'Mossy River Crossing', subtitle: 'The Overgrown Forest', region: 'forest', ...pt(50, 61), radius: 150, discovered: false },
    { id: 'lm_forest_shrine', name: 'Sunken Forest Shrine', subtitle: 'The Overgrown Forest', region: 'forest', ...pt(67, 55), radius: 170, discovered: false },
    { id: 'lm_forest_mill', name: 'Stalled River Waterwheel', subtitle: 'The Overgrown Forest', region: 'forest', ...pt(55, 70), radius: 140, discovered: false },
    { id: 'lm_forest_cave', name: 'Hidden River Cave', subtitle: 'Secret Location · Overgrown Forest', region: 'forest', ...pt(74, 77), radius: 150, discovered: false },
    { id: 'lm_waste_entry', name: 'Foundry Gate Boulevard', subtitle: 'The Industrial Wasteland', region: 'wasteland', ...pt(65, 22), radius: 160, discovered: false },
    { id: 'lm_waste_purifier', name: 'Atmospheric Scrubber Plaza', subtitle: 'The Industrial Wasteland', region: 'wasteland', ...pt(86, 22), radius: 170, discovered: false },
    { id: 'lm_core_gate', name: 'Threshold of the Core', subtitle: 'The Lost Core', region: 'core', ...pt(89, 60), radius: 150, discovered: false },
    { id: 'lm_core_sanctum', name: 'Sanctum of the World Core', subtitle: 'The Lost Core', region: 'core', ...pt(104, 60), radius: 220, discovered: false },
  ];

  // ENTERABLE DOORS (Workshop entrance & exit)
  const doors: PortalDoor[] = [
    {
      id: 'door_workshop_in',
      label: "Enter Tinker's Workshop",
      fromInterior: null,
      toInterior: 'haven_workshop',
      ...pt(31, 57),
      destX: 7.5 * TILE_SIZE,
      destY: 9.5 * TILE_SIZE,
    },
    {
      id: 'door_workshop_out',
      label: 'Exit to The Last Haven',
      fromInterior: 'haven_workshop',
      toInterior: null,
      x: 7.5 * TILE_SIZE,
      y: 10.6 * TILE_SIZE,
      destX: 31 * TILE_SIZE + 16,
      destY: 58.6 * TILE_SIZE,
    },
  ];

  // CAMPFIRES (animated flames + warm night lights)
  const campfires: CampfireProp[] = [
    { ...pt(21, 61), region: 'haven' },
    { ...pt(14, 61), region: 'haven' },
    { ...pt(24, 24), region: 'city' },
    { ...pt(61, 57), region: 'forest' },
    { ...pt(75, 23), region: 'wasteland' },
    { x: 3.5 * TILE_SIZE, y: 7.5 * TILE_SIZE, region: 'haven', interiorId: 'haven_workshop' },
  ];

  // WEAPON WORKBENCHES / BLACKSMITH FORGES (shared persistent progression across all regions!)
  ensureClear(27, 59, 'dirt');
  ensureClear(25, 24, 'sidewalk');
  ensureClear(63, 56, 'grass');
  ensureClear(76, 24, 'industrial_floor');
  const workbenches: WorkbenchProp[] = [
    {
      id: 'wb_haven_plaza',
      name: 'Haven Blacksmith Anvil',
      ...pt(27, 59),
      region: 'haven',
    },
    {
      id: 'wb_workshop',
      name: 'Tinker Forging Bench',
      x: 7.5 * TILE_SIZE,
      y: 4.5 * TILE_SIZE,
      region: 'haven',
      interiorId: 'haven_workshop',
    },
    {
      id: 'wb_city_outpost',
      name: 'Civic Salvage Forge',
      ...pt(25, 24),
      region: 'city',
    },
    {
      id: 'wb_forest_camp',
      name: 'Grove Field Workbench',
      ...pt(63, 56),
      region: 'forest',
    },
    {
      id: 'wb_wasteland_foundry',
      name: 'Foundry Weapon Press',
      ...pt(76, 24),
      region: 'wasteland',
    },
  ];

  // ANCIENT TELEPORTATION NETWORK (1 distinctive station per major region; none auto-unlocked!)
  ensureClear(17, 63, 'dirt');
  ensureClear(22, 34, 'road');
  ensureClear(56, 60, 'grass');
  ensureClear(68, 22, 'industrial_floor');
  ensureClear(91, 60, 'core_floor');
  const teleporters: TeleporterStation[] = [
    {
      id: 'tp_haven',
      name: 'Haven Gateway',
      region: 'haven',
      ...pt(17, 63),
      description:
        'A warm stone-and-brass waypoint ring nestled beside Haven Campfire Plaza. Anchors fast travel back to the survivor settlement.',
      activationCost: { scrap: 1 },
      energyCost: 15,
      accentColor: '#5eead4',
      secondaryColor: '#f5be4f',
      discovered: false,
      activated: false,
    },
    {
      id: 'tp_city',
      name: 'City Transit Gate',
      region: 'city',
      ...pt(22, 34),
      description:
        'A pre-Fall civic transit pylon wired into concrete metro conduits. Reconnects The Forgotten City with Haven.',
      activationCost: { scrap: 2, parts: 1 },
      energyCost: 20,
      accentColor: '#60a5fa',
      secondaryColor: '#93c5fd',
      discovered: false,
      activated: false,
    },
    {
      id: 'tp_forest',
      name: 'Ancient Nature Portal',
      region: 'forest',
      ...pt(56, 60),
      description:
        'Moss-carved monolith crystals braided with luminescent roots along the river clearing.',
      activationCost: { scrap: 2, crystal: 1 },
      energyCost: 20,
      accentColor: '#4ade80',
      secondaryColor: '#5eead4',
      discovered: false,
      activated: false,
    },
    {
      id: 'tp_wasteland',
      name: 'Industrial Transport Core',
      region: 'wasteland',
      ...pt(68, 22),
      description:
        'Heavy riveted reactor pad channeling furnace conduits for rapid transit across the Industrial Wasteland.',
      activationCost: { parts: 2, crystal: 1 },
      energyCost: 25,
      accentColor: '#fb923c',
      secondaryColor: '#fde047',
      discovered: false,
      activated: false,
    },
    {
      id: 'tp_core',
      name: 'Ancient Energy Gateway',
      region: 'core',
      ...pt(91, 60),
      description:
        'Harmonic crystalline portal etched with Lost Core circuits. Links directly to the World Core sanctum.',
      activationCost: { crystal: 2 },
      energyCost: 30,
      requiresCoreGate: true,
      accentColor: '#c084fc',
      secondaryColor: '#5eead4',
      discovered: false,
      activated: false,
    },
  ];

  // ENEMIES: 5 distinct archetypes with unique AI policies!
  const makeEnemy = (
    id: string,
    archetype: EnemyEntity['archetype'],
    region: RegionId,
    tx: number,
    ty: number
  ): EnemyEntity => {
    ensureClear(tx, ty, region === 'city' ? 'road' : 'dirt');
    const pos = pt(tx, ty);
    switch (archetype) {
      case 'drone_kiter':
        return {
          id,
          name: 'Damaged Security Drone',
          archetype,
          region,
          x: pos.x,
          y: pos.y,
          homeX: pos.x,
          homeY: pos.y,
          vx: 0,
          vy: 0,
          radius: 13,
          hp: 45,
          maxHp: 45,
          damage: 11,
          speed: 78,
          aggroRange: 230,
          attackRange: 175,
          aiState: 'patrol',
          stateTimer: 1.2,
          telegraphDuration: 0.55,
          telegraphAngle: 0,
          hitFlashTimer: 0,
          koTimer: 0,
          animTime: Math.random() * 6,
          xpReward: 25,
          goldReward: 12,
          loot: { scrap: 2, parts: 1 },
          respawnTimer: 0,
        };
      case 'stalker_charger':
        return {
          id,
          name: 'Scrap Stalker',
          archetype,
          region,
          x: pos.x,
          y: pos.y,
          homeX: pos.x,
          homeY: pos.y,
          vx: 0,
          vy: 0,
          radius: 15,
          hp: 65,
          maxHp: 65,
          damage: 16,
          speed: 96,
          aggroRange: 240,
          attackRange: 120,
          aiState: 'patrol',
          stateTimer: 1.0,
          telegraphDuration: 0.5,
          telegraphAngle: 0,
          hitFlashTimer: 0,
          koTimer: 0,
          animTime: Math.random() * 6,
          xpReward: 35,
          goldReward: 18,
          loot: { scrap: 2, parts: 2 },
          respawnTimer: 0,
        };
      case 'crawler_swarmer':
        return {
          id,
          name: 'Spore Crawler',
          archetype,
          region,
          x: pos.x,
          y: pos.y,
          homeX: pos.x,
          homeY: pos.y,
          vx: 0,
          vy: 0,
          radius: 13,
          hp: 52,
          maxHp: 52,
          damage: 13,
          speed: 88,
          aggroRange: 210,
          attackRange: 48,
          aiState: 'patrol',
          stateTimer: 0.9,
          telegraphDuration: 0.35,
          telegraphAngle: 0,
          hitFlashTimer: 0,
          koTimer: 0,
          animTime: Math.random() * 6,
          xpReward: 30,
          goldReward: 15,
          loot: { crystal: 1, ration: 1 },
          respawnTimer: 0,
        };
      case 'turret_denial':
        return {
          id,
          name: 'Foundry Defense Turret',
          archetype,
          region,
          x: pos.x,
          y: pos.y,
          homeX: pos.x,
          homeY: pos.y,
          vx: 0,
          vy: 0,
          radius: 17,
          hp: 95,
          maxHp: 95,
          damage: 18,
          speed: 0,
          aggroRange: 260,
          attackRange: 250,
          aiState: 'idle',
          stateTimer: 1.5,
          telegraphDuration: 0.65,
          telegraphAngle: 0,
          hitFlashTimer: 0,
          koTimer: 0,
          animTime: Math.random() * 6,
          xpReward: 50,
          goldReward: 26,
          loot: { parts: 2, rare_alloy: 1 },
          respawnTimer: 0,
        };
      case 'core_boss':
        return {
          id,
          name: 'Aegis Core Sentinel',
          archetype,
          region,
          x: pos.x,
          y: pos.y,
          homeX: pos.x,
          homeY: pos.y,
          vx: 0,
          vy: 0,
          radius: 26,
          hp: 460,
          maxHp: 460,
          damage: 22,
          speed: 82,
          aggroRange: 340,
          attackRange: 245,
          aiState: 'idle',
          stateTimer: 1.4,
          telegraphDuration: 0.72,
          telegraphAngle: 0,
          hitFlashTimer: 0,
          koTimer: 0,
          animTime: 0,
          xpReward: 320,
          goldReward: 250,
          loot: { crystal: 4, rare_alloy: 3, parts: 4 },
          isBoss: true,
          bossTitle: 'Corrupted Guardian of the World Core',
          bossTrackId: 'core_sentinel',
          bossPhase: 1,
          bossPattern: 'radial',
          bossPatternIndex: 0,
          trailingHp: 460,
          respawnTimer: 0,
        };
    }
  };

  const enemies: EnemyEntity[] = [
    // 1 starter rogue drone guarding Haven Comm Ridge (never enters safe plaza)
    makeEnemy('en_haven_drone1', 'drone_kiter', 'haven', 26, 47),

    // Forgotten City enemies
    makeEnemy('en_city_drone1', 'drone_kiter', 'city', 21, 31),
    makeEnemy('en_city_stalker1', 'stalker_charger', 'city', 31, 21),
    makeEnemy('en_city_drone2', 'drone_kiter', 'city', 39, 17),
    makeEnemy('en_city_stalker2', 'stalker_charger', 'city', 16, 10),
    makeEnemy('en_city_drone3', 'drone_kiter', 'city', 47, 22),

    // Overgrown Forest enemies
    makeEnemy('en_forest_crawl1', 'crawler_swarmer', 'forest', 59, 63),
    makeEnemy('en_forest_crawl2', 'crawler_swarmer', 'forest', 70, 54),
    makeEnemy('en_forest_stalker1', 'stalker_charger', 'forest', 65, 47),
    makeEnemy('en_forest_crawl3', 'crawler_swarmer', 'forest', 69, 75),

    // Industrial Wasteland enemies
    makeEnemy('en_waste_turret1', 'turret_denial', 'wasteland', 74, 21),
    makeEnemy('en_waste_stalker1', 'stalker_charger', 'wasteland', 86, 18),
    makeEnemy('en_waste_turret2', 'turret_denial', 'wasteland', 92, 26),
    makeEnemy('en_waste_drone1', 'drone_kiter', 'wasteland', 101, 22),
    makeEnemy('en_waste_turret3', 'turret_denial', 'wasteland', 88, 34),

    // Lost Core guardians & MAIN BOSS
    makeEnemy('en_core_drone1', 'drone_kiter', 'core', 96, 55),
    makeEnemy('en_core_drone2', 'drone_kiter', 'core', 96, 65),
    makeEnemy('enemy_core_boss', 'core_boss', 'core', 104, 60),
  ];

  return {
    width: WORLD_W,
    height: WORLD_H,
    tiles,
    interiors,
    npcs,
    enemies,
    restorationNodes,
    collectibles,
    landmarks,
    doors,
    campfires,
    workbenches,
    teleporters,
    playerSpawn,
    coreGateTiles,
  };
}

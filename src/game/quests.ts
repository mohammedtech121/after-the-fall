import { CraftingRecipe, InventoryMap, ItemDefinition, ItemId, QuestState, RegionId } from './types';

export const ITEM_CATALOG: Record<ItemId, ItemDefinition> = {
  scrap: {
    id: 'scrap',
    name: 'Salvaged Scrap',
    category: 'resource',
    maxStack: 20,
    description: 'Bolts, plating, and copper coils stripped from fallen pre-Collapse structures. Essential for repairs and crafting.',
    value: 1,
  },
  crystal: {
    id: 'crystal',
    name: 'Arc Crystal',
    category: 'rare',
    maxStack: 20,
    description: 'Resonant cyan crystal humming with residual energy from The Fall. Powers the Arc-Device and restores broken relays.',
    value: 5,
  },
  ration: {
    id: 'ration',
    name: 'Field Rations',
    category: 'consumable',
    maxStack: 5,
    description: 'Vacuum-sealed harvest bars and dried berries. Restores 35 Health and 40 Stamina when consumed.',
    usable: true,
    healAmount: 35,
    staminaAmount: 40,
    value: 3,
  },
  parts: {
    id: 'parts',
    name: 'Mech Components',
    category: 'resource',
    maxStack: 20,
    description: 'Precision servos, optical lenses, and micro-relays recovered from hostile machines and factories.',
    value: 4,
  },
  rare_alloy: {
    id: 'rare_alloy',
    name: 'Aegis Alloy',
    category: 'rare',
    maxStack: 20,
    description: 'High-density titanium composite found in industrial vaults and ancient ruins. Required for high-tier restoration and master armour.',
    value: 8,
  },
  medkit: {
    id: 'medkit',
    name: 'Survivor Medkit',
    category: 'consumable',
    maxStack: 5,
    description: 'Sterile bandages paired with herbal Forest salve. Restores 75 Health immediately.',
    usable: true,
    healAmount: 75,
    value: 6,
  },
  energy_cell: {
    id: 'energy_cell',
    name: 'Arc Battery Cell',
    category: 'consumable',
    maxStack: 5,
    description: 'Stabilized charge canister that instantly replenishes 65 Arc Energy for restoration and Arc Pulse.',
    usable: true,
    energyAmount: 65,
    value: 5,
  },
  arrow: {
    id: 'arrow',
    name: 'Iron-Tipped Arrow',
    category: 'ammo',
    maxStack: 25,
    description: 'Balanced scavenger arrows tipped with sharpened iron. Required to fire any Bow.',
    value: 2,
  },
  blacksmith_hammer: {
    id: 'blacksmith_hammer',
    name: "Bram's Forging Hammer",
    category: 'quest',
    maxStack: 1,
    description: 'A heavy tempered-steel smithing hammer belonging to Blacksmith Bram. Return it to him in Haven to unlock the Blacksmith Workshop.',
    value: 0,
  },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_medkit',
    name: 'Survivor Medkit',
    description: 'Craft a field medkit that restores 75 HP.',
    resultType: 'item',
    resultItemId: 'medkit',
    resultQty: 1,
    ingredients: { ration: 1, scrap: 2 },
  },
  {
    id: 'craft_energy_cell',
    name: 'Arc Battery Cell',
    description: 'Condense crystal shards into a portable +65 Energy cell.',
    resultType: 'item',
    resultItemId: 'energy_cell',
    resultQty: 1,
    ingredients: { crystal: 1, scrap: 2 },
  },
  {
    id: 'upgrade_arc_blade',
    name: 'Reinforced Arc-Blade',
    description: 'Permanent upgrade: +14 melee attack damage and wider shockwave.',
    resultType: 'upgrade',
    resultUpgradeId: 'arc_blade_mk2',
    ingredients: { scrap: 5, parts: 2, crystal: 1 },
  },
  {
    id: 'upgrade_kinetic_boots',
    name: 'Kinetic Stride Boots',
    description: 'Permanent upgrade: +22% movement speed and faster stamina recovery.',
    resultType: 'upgrade',
    resultUpgradeId: 'kinetic_boots',
    ingredients: { scrap: 4, parts: 2 },
  },
  {
    id: 'upgrade_aegis_vest',
    name: 'Aegis Plated Vest',
    description: 'Permanent upgrade: +45 Maximum Health and instant heal.',
    resultType: 'upgrade',
    resultUpgradeId: 'aegis_vest',
    ingredients: { scrap: 6, rare_alloy: 2 },
  },
  {
    id: 'upgrade_capacitor',
    name: 'Overclocked Capacitor',
    description: 'Permanent upgrade: +40 Max Energy and faster passive Energy recharge.',
    resultType: 'upgrade',
    resultUpgradeId: 'energy_capacitor',
    ingredients: { crystal: 3, parts: 3 },
  },
  {
    id: 'upgrade_hazmat',
    name: 'Wasteland Filter Mask',
    description: 'Permanent upgrade: Immunity to toxic sludge damage in the Industrial Wasteland.',
    resultType: 'upgrade',
    resultUpgradeId: 'hazmat_filter',
    ingredients: { parts: 3, rare_alloy: 1, scrap: 3 },
  },
];

export const REGION_META: Record<
  RegionId,
  {
    name: string;
    subtitle: string;
    danger: string;
    paletteAccent: string;
    description: string;
  }
> = {
  haven: {
    name: 'The Last Haven',
    subtitle: 'Survivor Valley Settlement',
    danger: 'Safe Zone',
    paletteAccent: '#e2a44e',
    description:
      'A sheltered valley of patched wooden cabins, campfires, and resilient survivors clinging to hope after The Fall.',
  },
  city: {
    name: 'The Forgotten City',
    subtitle: 'Ruined Civic District',
    danger: 'Moderate',
    paletteAccent: '#7fa7b8',
    description:
      'Cracked boulevards and vine-wrapped tower blocks patrolled by malfunctioning security drones and scrap stalkers.',
  },
  forest: {
    name: 'The Overgrown Forest',
    subtitle: 'Sunken Shrine & Riverlands',
    danger: 'Moderate',
    paletteAccent: '#5eb878',
    description:
      'Emerald canopy, winding lily-pad rivers, and moss-covered stone ruins hiding rare Arc Crystals and ancient conduits.',
  },
  wasteland: {
    name: 'The Industrial Wasteland',
    subtitle: 'Abandoned Foundry Sector',
    danger: 'High',
    paletteAccent: '#c97848',
    description:
      'Shattered factories, toxic coolant pools, and heavy automated defense turrets guarding rare Aegis Alloy.',
  },
  core: {
    name: 'The Lost Core',
    subtitle: 'Ancient Energy Sanctum',
    danger: 'Extreme',
    paletteAccent: '#4cd3c2',
    description:
      'The epicenter of The Fall. Obsidian monoliths and pulsing power conduits surrounding the dormant World Core.',
  },
};

export function createInitialInventory(): InventoryMap {
  return {
    scrap: 5,
    crystal: 2,
    ration: 2,
    parts: 1,
    rare_alloy: 0,
    medkit: 1,
    energy_cell: 1,
    arrow: 0,
    blacksmith_hammer: 0,
  };
}

export function createInitialQuests(): QuestState[] {
  return [
    // MAIN STORYLINE (8 missions)
    {
      id: 'm1_wake_up',
      title: '1. Wake Up',
      category: 'main',
      giverNpcId: 'npc_mara',
      summary:
        'You awoke near the Haven camp with an ancient Arc-Device humming on your pack. Speak with Elder Mara by the central campfire.',
      status: 'active',
      objectives: [
        {
          id: 'talk_mara',
          label: 'Speak with Elder Mara in Haven Plaza',
          type: 'talk_npc',
          targetId: 'npc_mara',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 30, items: { scrap: 2, ration: 1 } },
      unlocksQuestIds: ['m2_find_survivors', 's1_haven_lights'],
    },
    {
      id: 'm2_find_survivors',
      title: '2. Find the Survivors',
      category: 'main',
      giverNpcId: 'npc_mara',
      summary:
        'Meet Tinker Jax outside the Workshop and Dr. Lin near the Haven Generator, then use your Arc-Device to restore power to the settlement.',
      status: 'locked',
      objectives: [
        {
          id: 'talk_jax',
          label: 'Talk to Tinker Jax (Trader)',
          type: 'talk_npc',
          targetId: 'npc_jax',
          required: 1,
          current: 0,
        },
        {
          id: 'talk_lin',
          label: 'Talk to Dr. Lin (Scientist)',
          type: 'talk_npc',
          targetId: 'npc_lin',
          required: 1,
          current: 0,
        },
        {
          id: 'restore_haven_gen',
          label: 'Restore the Haven Generator',
          type: 'restore_node',
          targetId: 'node_haven_generator',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 55, items: { crystal: 1, scrap: 3 } },
      unlocksQuestIds: ['m3_comm_tower'],
    },
    {
      id: 'm3_comm_tower',
      title: '3. Restore the Communication Tower',
      category: 'main',
      giverNpcId: 'npc_lin',
      summary:
        'Dr. Lin believes the old Communication Tower on Haven Ridge can scan surviving energy relays across the valley. Gather supplies and restore it.',
      status: 'locked',
      objectives: [
        {
          id: 'restore_comm',
          label: 'Restore the Haven Communication Tower',
          type: 'restore_node',
          targetId: 'node_comm_tower',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 80, items: { medkit: 1, parts: 2, energy_cell: 1 } },
      unlocksQuestIds: ['m4_forgotten_city', 'm5_energy_source', 's2_missing_supplies', 's5_scrap_purge'],
    },
    {
      id: 'm4_forgotten_city',
      title: '4. Explore the Forgotten City',
      category: 'main',
      giverNpcId: 'npc_kael',
      summary:
        'Travel north into The Forgotten City, locate Scout Kael among the ruins, and restore the City Power Substation.',
      status: 'locked',
      objectives: [
        {
          id: 'reach_city',
          label: 'Enter The Forgotten City',
          type: 'reach_region',
          targetId: 'city',
          required: 1,
          current: 0,
        },
        {
          id: 'talk_kael',
          label: 'Meet Scout Kael in the City',
          type: 'talk_npc',
          targetId: 'npc_kael',
          required: 1,
          current: 0,
        },
        {
          id: 'restore_substation',
          label: 'Restore the City Substation',
          type: 'restore_node',
          targetId: 'node_city_substation',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 110, items: { rare_alloy: 1, crystal: 2 } },
      unlocksQuestIds: ['m6_wasteland'],
    },
    {
      id: 'm5_energy_source',
      title: '5. Discover the Energy Source',
      category: 'main',
      giverNpcId: 'npc_moss',
      summary:
        'Cross the eastern bridge into The Overgrown Forest, discover the Sunken Shrine, and reawaken the Ancient Grove Conduit.',
      status: 'locked',
      objectives: [
        {
          id: 'discover_shrine',
          label: 'Discover the Sunken Forest Shrine',
          type: 'discover_landmark',
          targetId: 'lm_forest_shrine',
          required: 1,
          current: 0,
        },
        {
          id: 'restore_grove',
          label: 'Restore the Ancient Grove Conduit',
          type: 'restore_node',
          targetId: 'node_grove_conduit',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 115, items: { crystal: 2, medkit: 1 } },
      unlocksQuestIds: ['s3_forest_herbs', 's4_river_mill'],
    },
    {
      id: 'm6_wasteland',
      title: '6. Enter the Industrial Wasteland',
      category: 'main',
      giverNpcId: 'npc_vance',
      summary:
        'Push east from the City into the Industrial Wasteland. Meet Foreman Vance and reactivate the Foundry Air Purifier to stabilize the sector.',
      status: 'locked',
      objectives: [
        {
          id: 'reach_waste',
          label: 'Enter The Industrial Wasteland',
          type: 'reach_region',
          targetId: 'wasteland',
          required: 1,
          current: 0,
        },
        {
          id: 'restore_purifier',
          label: 'Restore the Foundry Air Purifier',
          type: 'restore_node',
          targetId: 'node_air_purifier',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 140, items: { rare_alloy: 2, energy_cell: 2 } },
      unlocksQuestIds: ['m7_lost_core'],
    },
    {
      id: 'm7_lost_core',
      title: '7. Reach the Lost Core',
      category: 'main',
      giverNpcId: 'npc_echo',
      summary:
        'With at least 4 relays restored across the valley, the Core Gate opens. Enter The Lost Core and speak with Echo-7.',
      status: 'locked',
      objectives: [
        {
          id: 'reach_core',
          label: 'Cross the Core Gate into The Lost Core',
          type: 'reach_region',
          targetId: 'core',
          required: 1,
          current: 0,
        },
        {
          id: 'talk_echo',
          label: 'Consult Ancient Construct Echo-7',
          type: 'talk_npc',
          targetId: 'npc_echo',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 150, items: { medkit: 2, energy_cell: 2 } },
      unlocksQuestIds: ['m8_restore_world'],
    },
    {
      id: 'm8_restore_world',
      title: '8. Restore the World',
      category: 'main',
      giverNpcId: 'npc_echo',
      summary:
        'Defeat the corrupted Aegis Core Sentinel guarding the sanctum and reactivate the World Core to make civilization rise again.',
      status: 'locked',
      objectives: [
        {
          id: 'defeat_boss',
          label: 'Defeat the Aegis Core Sentinel',
          type: 'defeat_boss',
          targetId: 'enemy_core_boss',
          required: 1,
          current: 0,
        },
        {
          id: 'restore_core',
          label: 'Reactivate the World Core',
          type: 'restore_node',
          targetId: 'node_world_core',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 300, items: { crystal: 5 } },
    },

    // SIDE MISSIONS (5 missions)
    {
      id: 's1_haven_lights',
      title: 'Light Up Haven',
      category: 'side',
      giverNpcId: 'npc_mara',
      summary:
        'Night falls heavy over The Last Haven. Repair the plaza streetlights so survivors can work safely after dusk.',
      status: 'locked',
      objectives: [
        {
          id: 'restore_lights',
          label: 'Restore the Haven Plaza Streetlights',
          type: 'restore_node',
          targetId: 'node_haven_lights',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 45, items: { scrap: 3, ration: 2 } },
    },
    {
      id: 's2_missing_supplies',
      title: 'Missing Supply Cache',
      category: 'side',
      giverNpcId: 'npc_jax',
      summary:
        'Tinker Jax hid an emergency supply cache in a vine-choked alley on the northwest edge of The Forgotten City.',
      status: 'locked',
      objectives: [
        {
          id: 'discover_alley',
          label: 'Discover the Hidden Alley Cache',
          type: 'discover_landmark',
          targetId: 'lm_city_hidden_alley',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 65, items: { parts: 3, medkit: 1 } },
    },
    {
      id: 's3_forest_herbs',
      title: 'Echoes of the Canopy',
      category: 'side',
      giverNpcId: 'npc_moss',
      summary:
        'Herbalist Moss tracks ancient crystal blooms near the forest caves. Discover the Hidden River Cave.',
      status: 'locked',
      objectives: [
        {
          id: 'discover_cave',
          label: 'Discover the Hidden River Cave',
          type: 'discover_landmark',
          targetId: 'lm_forest_cave',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 75, items: { crystal: 2, medkit: 1 } },
    },
    {
      id: 's4_river_mill',
      title: 'Repair the Old Waterwheel',
      category: 'side',
      giverNpcId: 'npc_moss',
      summary:
        'An old hydroelectric waterwheel sits stalled along the Forest riverbend. Restore it to supply clean water back to Haven.',
      status: 'locked',
      objectives: [
        {
          id: 'restore_mill',
          label: 'Restore the Forest River Waterwheel',
          type: 'restore_node',
          targetId: 'node_river_waterwheel',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 90, items: { ration: 3, rare_alloy: 1 } },
    },
    {
      id: 's5_scrap_purge',
      title: 'Clear the Rogue Machines',
      category: 'side',
      giverNpcId: 'npc_kael',
      summary:
        'Hostile machines are encroaching on survivor routes. Destroy 5 hostile enemies anywhere outside Haven.',
      status: 'locked',
      objectives: [
        {
          id: 'defeat_5',
          label: 'Defeat 5 Hostile Enemies',
          type: 'defeat_enemies',
          required: 5,
          current: 0,
        },
      ],
      rewards: { xp: 95, gold: 45, items: { scrap: 5, parts: 3 } },
    },
    {
      id: 's6_missing_hammer',
      title: 'The Missing Hammer',
      category: 'side',
      giverNpcId: 'npc_bram',
      summary:
        'Blacksmith Bram lost his prized Forging Hammer while retreating from a rogue drone on Haven Comm Ridge. Recover it and return it to unlock his Workshop.',
      status: 'locked',
      objectives: [
        {
          id: 'talk_bram',
          label: 'Speak with Blacksmith Bram by the Haven Anvil',
          type: 'talk_npc',
          targetId: 'npc_bram',
          required: 1,
          current: 0,
        },
        {
          id: 'find_hammer',
          label: "Find Bram's Forging Hammer on Haven Comm Ridge",
          type: 'collect_item',
          targetId: 'blacksmith_hammer',
          required: 1,
          current: 0,
        },
        {
          id: 'return_hammer',
          label: 'Return the Forging Hammer to Blacksmith Bram',
          type: 'unlock_blacksmith',
          targetId: 'npc_bram',
          required: 1,
          current: 0,
        },
      ],
      rewards: { xp: 65, gold: 40, items: { scrap: 3 } },
    },
  ];
}

import { AchievementDef, WorldStats } from './types';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach_first_spark',
    title: 'First Spark',
    description: 'Restore your first damaged world system or shelter.',
  },
  {
    id: 'ach_haven_builder',
    title: 'Heart of Haven',
    description: 'Restore 3 systems across the valley.',
  },
  {
    id: 'ach_explorer',
    title: 'Pathfinder',
    description: 'Discover at least 6 named landmarks across the open world.',
  },
  {
    id: 'ach_all_regions',
    title: 'Across the Five Regions',
    description: 'Set foot in all 5 interconnected regions.',
  },
  {
    id: 'ach_scrap_hunter',
    title: 'Machine Breaker',
    description: 'Defeat 5 hostile machines or mutated creatures.',
  },
  {
    id: 'ach_artisan',
    title: 'Field Artisan',
    description: 'Craft your first survival item or permanent gear upgrade.',
  },
  {
    id: 'ach_voice_of_hope',
    title: 'Voice of Survivors',
    description: 'Speak with at least 4 survivors across the valley.',
  },
  {
    id: 'ach_bounce_back',
    title: 'A World Worth Saving',
    description: 'Unseal The Lost Core and restore the World Core.',
  },
];

export function evaluateAchievements(
  stats: WorldStats,
  worldCoreRestored: boolean
): string[] {
  const owned = new Set(stats.unlockedAchievements);
  const newlyUnlocked: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !owned.has(id)) {
      owned.add(id);
      newlyUnlocked.push(id);
    }
  };

  check('ach_first_spark', stats.nodesRestored >= 1);
  check('ach_haven_builder', stats.nodesRestored >= 3);
  check('ach_explorer', stats.landmarksDiscovered >= 6);
  check('ach_all_regions', stats.visitedRegions.length >= 5);
  check('ach_scrap_hunter', stats.enemiesDefeated >= 5);
  check('ach_artisan', stats.craftedCount >= 1);
  check('ach_voice_of_hope', stats.talkedNpcIds.length >= 4);
  check('ach_bounce_back', worldCoreRestored);

  return newlyUnlocked;
}

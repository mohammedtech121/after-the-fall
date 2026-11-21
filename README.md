# AFTER THE FALL
### A World Worth Saving

**After the Fall** (titled in-game as *Bounce Back: After the Fall*) is a 2D top-down pixel-art action RPG made for **Hack Club Harvest Game Jam 2026** around the theme **BOUNCE BACK!**.

I wanted to make an adventure game where progress actually changes the world you walk through. After a global collapse fractures the World Core, you wake up in **The Last Haven**—one of the last intact settlements left in the valley. From there, you explore five connected regions, help survivors get back on their feet, fight rogue machines, repair broken energy relays, and work your way toward the **Lost Core** to confront the **Aegis Core Sentinel**.

---

## What You Can Do

- **Restore the valley as you play:** Repairing relays, shrines, and landmarks clears corruption, restores power, and changes the look of the world around you.
- **Explore with day/night cycles and weather:** Time passes naturally across the overworld with shifting lighting, rain, fog, and wind effects.
- **Fight with multiple weapon types:** Switch between fast swords, heavy axes, and ranged bows (with limited arrows you craft or buy).
- **Progress through the Blacksmith and Crafting system:** Find Blacksmith Bram, track down his missing hammer, and unlock his workshop to craft and upgrade weapons and five tiers of armour.
- **Keep your progress when you fall:** Dying in combat does not wipe your adventure. You respawn at your last activated teleporter checkpoint (or Haven camp if none are active yet) with restored vitals and all of your quests, gear, Gold, and unlocked areas intact.
- **Save across multiple slots:** The game autosaves at key milestones and supports three manual save slots stored locally in your browser.
- **Boss encounter with dedicated boss music:** Entering the Core Sentinel arena crossfades smoothly from region ambience into a dedicated boss soundtrack, with a multi-phase boss bar and a staged defeat sequence.

---

## The Five Regions

1. **The Last Haven** — Your starting settlement and safe hub. Talk to survivors, trade with merchants, visit Tinker's Workshop, and help Blacksmith Bram rebuild his forge.
2. **The Forgotten City** — Overgrown streets, collapsed transit gates, hidden supply stashes, and patrolling drones and stalkers.
3. **The Overgrown Forest** — Dense woodland, ancient ruins, crystal caches, and fast swarmer enemies.
4. **The Industrial Wasteland** — Toxic hazards, salvageable alloy deposits, foundry ruins, and an atmospheric scrubber tower waiting to be repaired.
5. **The Lost Core** — The endgame sanctum housing the World Core Altar and the **Aegis Core Sentinel**.

As you activate fast-travel gates across each region, they double as both fast-travel destinations and respawn checkpoints.

---

## Weapons, Crafting, Quests & Combat

- **Weapons:** Start with the Scrap Blade and unlock or forge Swords, Axes (like the Scrap Axe and Foundry Greataxe), Bows (Hunter Bow and Arc Longbow), and late-game Core blades. Each weapon has its own feel, plus upgradable stats (damage, attack speed, energy capacity/recovery, crit chance, and range).
- **Arrows & Backpack:** Bows fire physical arrows tracked in your **40-slot Backpack**, alongside crafting materials, healing items, and quest items. Earn **Gold** from enemies, salvage, and quests to buy supplies from merchants.
- **Blacksmith Bram & Armour:** Speak with Bram in Haven to take on the **Missing Hammer** quest. Returning his forging hammer unlocks his full workshop for Weapon Crafting, Armour Crafting (5 tiers from Scout Tunic up to Core Sentinel Plate), Weapon Upgrades, and Armour Upgrades.
- **Quests & Skills:** Follow main restoration quests and survivor side quests in the Quest Log (`J`), level up from combat and exploration, and spend skill points across Combat, Energy, and Survival branches (`K`).
- **Combat Mechanics:** Mix light combos, charged/heavy attacks, Arc Pulse (`Q`), Energy Wave (`C`), and invulnerability-frame dodge rolls (`Space`) to read enemy telegraphs and survive boss phases.

---

## Controls

### Desktop (Keyboard & Mouse)
- **Move:** `WASD` or Arrow Keys (`Shift` to sprint)
- **Light Attack / Shoot Bow:** Left Click or `F`
- **Heavy / Charged Attack:** Right Click, hold Left Click, or `R`
- **Energy Wave:** `C`
- **Arc Pulse:** `Q`
- **Dodge Roll:** `Space`
- **Interact / Talk / Loot / Restore / Fast Travel:** `E`
- **Switch Weapons:** `Tab` or number keys `1`–`9`
- **Open Menus:** `I` (Inventory / Backpack), `B` (Blacksmith / Workbench), `J` (Quests), `K` (Skills), `M` (World Map), `T` (Fast Travel), `Esc` or `P` (Pause & Save/Load)

### Mobile / Touch
When opened on a phone or tablet (or when Mobile Controls are enabled in Settings):
- **Bottom-left:** Virtual movement joystick, **Run** (sprint toggle), and **Swap** (cycle weapon)
- **Bottom-right:** Ergonomic action buttons for **Attack**, **Heavy**, **Dodge**, **Interact (Act/Use)**, **Wave**, and **Pulse**
- **Top HUD:** Quick buttons for Inventory, Quests, Map, Pause, and Fullscreen

### Mobile Landscape & Full-Screen Support
The game plays best in **landscape mode** on mobile devices:
- Holding your phone vertically during gameplay shows a landscape rotation prompt (with an option to continue in portrait if you prefer).
- Tap the **Fullscreen** button in the top-right HUD (or the button on the rotate prompt) to enter fullscreen and request landscape orientation lock where supported by your browser.
- On iOS Safari, Apple restricts the native Fullscreen API in regular browser tabs; the game adapts automatically using full dynamic viewport height (`100dvh`) and safe-area padding so the HUD and controls stay clear of notches and gesture bars.

---

## Running Locally

### Requirements
- Node.js 18 or newer
- npm

### Setup & Development
```bash
# Install dependencies
npm install

# Start the local dev server on http://localhost:3000
npm run dev
```

### Build, Typecheck & Tests
```bash
# TypeScript typecheck
npm run lint

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run automated game-logic unit tests
npx tsx --test src/game/rules.test.ts
```

### Optional Custom Boss Audio Track
By default, the audio engine synthesizes region music and the boss theme using the Web Audio API so everything runs out of the box with no third-party audio dependencies. If you want to swap in your own original or licensed boss track:
1. Add your `.mp3` or `.ogg` file under `public/audio/bosses/` (for example, `public/audio/bosses/core_sentinel.mp3`).
2. In `src/game/audio.ts`, set `customAudioUrl` on the matching entry in `BOSS_SOUNDTRACK_REGISTRY`.
3. Add attribution to the Credits modal in `src/components/TitleScreen.tsx`.

---

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS**
- **HTML5 Canvas 2D** (procedural pixel-art tiles, lighting, and entity sprites)
- **Web Audio API** (crossfading region/boss music and procedural SFX)
- **Lucide React** (UI icons)

---

## Credits & Acknowledgements

- **Created by:** Mohammed Kahn
- **Jam:** Hack Club Harvest Game Jam 2026 (Theme: *BOUNCE BACK!*)
- **My Role:** Game concept, story and world design, quest and progression planning, playtesting, direction, and final curation.
- **Libraries & Assets:** Built with React, TypeScript, Vite, Tailwind CSS, Lucide Icons, procedural HTML5 Canvas pixel-art rendering, inline SVG equipment icons, and Web Audio API sound synthesis.
- **AI Assistance Disclosure:** In keeping with Hack Club Harvest Game Jam 2026 transparency guidelines, AI coding tools were used to assist with TypeScript implementation, procedural rendering and audio code, refactoring, and debugging alongside my direction, review, and testing. I do not claim that every line of code, procedural sprite, or audio routine was written completely without AI assistance.

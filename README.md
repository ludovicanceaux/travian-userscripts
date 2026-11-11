# Travian Legends userscripts: farm list highlighter and elephant oasis finder

Free, open-source userscripts for [Travian: Legends](https://www.travian.com/), for Tampermonkey, Violentmonkey and Greasemonkey. They run in your browser, from your own logged-in game tab, on any `*.travian.com` game world:

| Script | What it does | Talks to the game server? |
|---|---|---|
| [Farm List Highlighter](#farm-list-highlighter) | Highlights the farm list rows worth re-raiding and colours the "last raid" time by age | No, it only restyles the page |
| [Elephant Finder](#elephant-finder) | Finds oases guarded by elephants around a point on the map | Yes, it queries the map like the game does |

Each script is a single file and is installed on its own: take one, or both.

## Installation

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) or [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/).
2. Click the script you want, your userscript manager opens its install page:
   - [travian-farmlist-highlighter](https://github.com/ludovicanceaux/travian-userscripts/raw/master/travian-farmlist-highlighter.user.js)
   - [travian-elephant-finder](https://github.com/ludovicanceaux/travian-userscripts/raw/master/travian-elephant-finder.user.js)

   Or do it by hand: open the manager's dashboard, create a new script, and paste the contents of the file (or import it from the Utilities tab).
3. Reload your Travian tab.

## Farm List Highlighter

For the farm lists in the Travian rally point. It makes two things visible at a glance:

- **Rows worth re-raiding.** When the last raid on a target came back with full loot and no attack is currently on its way, the whole row is tinted red. Those targets most likely still have resources to take.
- **Stale targets.** The "last raid" time is coloured by age: amber after 6 hours, orange after 12 hours, red for "yesterday", dark red for anything older. The colour disappears while an attack is running.

Nothing is sent anywhere. The script only reads the page you are already looking at and changes its styling.

Open a farm list in the rally point: rows and times are coloured immediately, and stay up to date as the list refreshes. The script runs on every `*.travian.com` game world, on the rally point page only.

### How it works

- The highlighting of "full loot, nothing running" rows is pure CSS, using the `:has()` selector, so it follows the game's own re-rendering with no extra work. Browsers without `:has()` fall back to a small observer that tags the rows with a class.
- The age colouring parses the "last raid" time, computes how many hours ago it was, and tags the cell with a threshold. A `MutationObserver` re-runs the check whenever the list changes, plus once a minute so ages keep moving.

### Limitations

- The word for "yesterday" is matched against the French interface (`hier`). On another interface language, rows from yesterday are coloured as "older" rather than "yesterday". Change the string in the script to your language's word to fix it.
- Thresholds and colours are constants at the top of the script (`COLOR`, `AGE_COLORS`), edit them to taste.

## Elephant Finder

Finds oases guarded by elephants around a point on the map, straight from your logged-in Travian tab.

Once installed, a **🐘 Éléphants** button appears in the bottom-right corner. The script runs on every `*.travian.com` game world. It only shows up on game pages, not in the lobby.

### Usage

1. Click **🐘 Éléphants** to open the panel.
2. The center is pre-filled with your active village's coordinates. Pick another one of your villages in the **Mes villages…** dropdown (the active village is marked with ●), or type any coordinates.
3. Pick a radius, then click **Lancer le scan**.
4. Elephant oases appear as map blocks come in, sorted by distance, each with a direct link to the map. Tick **Toutes les oasis** to also list oases without elephants.
5. **Exporter CSV** saves the current table.

Settings are remembered per game world. The log and the results start fresh on every scan.

| Radius | Tiles | Map requests | Typical duration |
|---|---|---|---|
| 15 | 709 | 5 | 6 s |
| 30 | 2,821 | 13 | 12 s |
| 50 | 7,845 | about 35 | 40 s |

### Settings

| Field | Default | Purpose |
|---|---|---|
| Centre X / Y | active village | Center of the search |
| Rayon | 15 | Maximum distance in tiles |
| Pause carte | 500 to 1500 ms | Random pause between two map blocks, same as adipiciu's crop finder |
| Pause détails | 3000 to 8000 ms | Pause between two tile lookups, only used when the map did not provide the animals |

### How it works

1. **Map phase.** The script calls `api/v1/map/position` at zoom level 2, the endpoint the game uses when you scroll the map. Each response covers a 21 × 17 block. The first block, centered on the search point, measures the block size and infers the world radius. The following blocks are laid out on a grid to cover the radius without overlap.
2. **Reading oases.** A free oasis is tagged `{k.fo}` and its text already lists the animals guarding it. Occupied oases (`{k.bt}`) are skipped. Results are displayed as soon as each block arrives.
3. **Details phase.** Only when the map did not provide an oasis's animals does the script open its details through `api/v1/map/tile-details`, with long pauses. If more than 40 tiles remain uncovered, the script stops and says so rather than piling up requests.

The script handles the world edge: the Travian map wraps around, and an oasis "on the other side" is found with its true distance.

On region-based worlds, zoom level 3 only returns a per-region overview. If zoom level 2 behaved the same way, the script automatically falls back to zoom level 1.

### Diagnostics

The **Diagnostic** button issues one map request around the center and copies to the clipboard a sample of the tiles returned, one per distinct shape. That is what to share if the script fails to recognize oases on some world.

## Disclaimer

Travian's terms of service restrict third-party scripts. The two scripts do not carry the same exposure:

- **Farm List Highlighter** only restyles a page you already have open. It sends no requests and automates no action. Even so, use it knowingly.
- **Elephant Finder** sends requests to the game server. Any automation is against Travian's terms of service and can get your account banned. This script greatly reduces the exposure compared with a standalone bot, but it does not remove it. Use it knowingly, preferably while you are playing normally, and avoid chaining wide-radius scans.

These scripts are provided for educational purposes only, "as is", without warranty of any kind. You use them at your own risk and under your sole responsibility. The author disclaims all liability for any consequence of their use, including but not limited to account suspension or banning, loss of game progress, or any other damage. By installing or running one of these scripts, you acknowledge that you have read this notice and accept these terms.

## Credits and license

Elephant Finder builds on two projects:

- Original project: [tegos/travian-elephant-finder](https://github.com/tegos/travian-elephant-finder) by Ivan Mykhavko, MIT license. The tile-details parsing and the animal list come from it.
- Map scanning method inspired by the crop finder in [adipiciu/Travian-scripts](https://github.com/adipiciu/Travian-scripts), GPL-3.0 license.

These userscripts are released under the MIT license, see [LICENSE](LICENSE).

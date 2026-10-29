# Travian Farm List Highlighter

A Tampermonkey userscript for the farm lists in the Travian rally point. It makes two things visible at a glance:

- **Rows worth re-raiding.** When the last raid on a target came back with full loot and no attack is currently on its way, the whole row is tinted red. Those targets most likely still have resources to take.
- **Stale targets.** The "last raid" time is coloured by age: amber after 6 hours, orange after 12 hours, red for "yesterday", dark red for anything older. The colour disappears while an attack is running.

Nothing is sent anywhere. The script only reads the page you are already looking at and changes its styling.

## Installation

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or Violentmonkey.
2. Open the manager's dashboard, create a new script, and paste the contents of `travian-farmlist-highlighter.user.js`. Or import the file from the Utilities tab.
3. Open a farm list in the rally point. Rows and times are coloured immediately, and stay up to date as the list refreshes.

The script runs on every `*.travian.com` game world, on the rally point page only.

## How it works

- The highlighting of "full loot, nothing running" rows is pure CSS, using the `:has()` selector, so it follows the game's own re-rendering with no extra work. Browsers without `:has()` fall back to a small observer that tags the rows with a class.
- The age colouring parses the "last raid" time, computes how many hours ago it was, and tags the cell with a threshold. A `MutationObserver` re-runs the check whenever the list changes, plus once a minute so ages keep moving.

## Limitations

- The word for "yesterday" is matched against the French interface (`hier`). On another interface language, rows from yesterday are coloured as "older" rather than "yesterday". Change the string in the script to your language's word to fix it.
- Thresholds and colours are constants at the top of the script (`COLOR`, `AGE_COLORS`), edit them to taste.

## Disclaimer

This script only restyles a page you already have open. It sends no requests and automates no action. Even so, use it knowingly: Travian's terms of service restrict third-party scripts, and the author takes no responsibility for any consequence of its use.

This script is provided "as is", without warranty of any kind. You use it at your own risk and under your sole responsibility. The author disclaims all liability for any consequence of its use, including but not limited to account suspension or banning, loss of game progress, or any other damage. By installing or running this script, you acknowledge that you have read this notice and accept these terms.

## License

MIT, see [LICENSE](LICENSE).

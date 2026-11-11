// ==UserScript==
// @name         Travian Farm List Highlighter
// @namespace    travian-farmlist-highlighter
// @version      1.0.0
// @description  Highlights farm list rows whose last raid came back with full loot and no attack running, and colours the "last raid" time by age.
// @match        *://*.travian.com/build.php*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const COLOR = 'rgba(220, 30, 30, 0.35)';
  const AGE_COLORS = { 6: '#b8860b', 12: '#d35400', hier: '#c00', date: '#800' }; // seuils en heures, puis « hier », puis date

  // Voie principale : CSS pur, suit automatiquement les re-rendus React
  if (CSS.supports('selector(tr:has(i):not(:has(i)))')) {
    const style = document.createElement('style');
    style.textContent = `
              tr.slot:has(i.bounty_full_small):not(:has(td.state i)) > td {
                  background-color: ${COLOR} !important;
              }
          `;
    (document.head || document.documentElement).appendChild(style);
  }

  // Fallback : observer le DOM et poser une classe
  const style = document.createElement('style');
  style.textContent = `
      table.slots tbody tr.gm-bounty-full > td { background-color: ${COLOR} !important; }
      ${Object.entries(AGE_COLORS).map(([k, c]) =>
        `table.slots td.lastRaid[data-gm-age="${k}"] .lastRaidReport .value { color: ${c} !important; font-weight: bold; }`
      ).join('\n')}
  `;
  (document.head || document.documentElement).appendChild(style);

  // Âge du dernier pillage en heures ; « hier » ou une date = Infinity
  const ageHours = text => {
      const m = text.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
      if (!m) return Infinity;
      const d = new Date();
      d.setHours(+m[1], +m[2], +m[3], 0);
      if (d > Date.now()) d.setDate(d.getDate() - 1);
      return (Date.now() - d) / 36e5;
  };


  const mark = () => {
    document.querySelectorAll('table.slots tr.slot').forEach(tr => {
      const full = tr.querySelector('i.bounty_full_small');
      const running = tr.querySelector('td.state i');
      tr.classList.toggle('gm-bounty-full', !!full && !running);

      const value = tr.querySelector('td.lastRaid .lastRaidReport .value');
      if (!value) return;
      const h = ageHours(value.textContent.trim());
      const text = value.textContent.trim();
          value.closest('td').dataset.gmAge = running ? '' : text === 'hier' ? 'hier' : h === Infinity ? 'date' : h >= 12 ? '12' : h >= 6 ? '6' : '';
    });
  };

  new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(mark, 60000);
  mark();
})();

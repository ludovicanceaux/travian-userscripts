// ==UserScript==
// @name         Travian Helper
// @namespace    travian-helper
// @version      1.2.0
// @description  Desktop notification on incoming attacks, farm list rows worth re-raiding highlighted and "last raid" time coloured by age, fixed-width amount field in the marketplace "create offer" dialog.
// @match        *://*.travian.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ---- Alerte d'attaque : notification système à chaque nouvelle attaque entrante, sur tous les villages ----
  const CHECK_MIN = 2 * 60e3, CHECK_MAX = 5 * 60e3; // délai aléatoire entre deux vérifications en arrière-plan
  const nextDelay = () => CHECK_MIN + Math.random() * (CHECK_MAX - CHECK_MIN);

  // Nombre d'attaques entrantes par village, lu dans les données de la liste des villages (présentes dans chaque page du jeu)
  const readAttacks = html => {
    const villages = [...html.matchAll(/"id":(\d+),"name":"((?:[^"\\]|\\.)*)"/g)];
    return [...html.matchAll(/"incomingAttacksAmount":(\d+)/g)].map((m, i) => {
      const v = villages.filter(n => n.index < m.index).pop();
      return { id: v ? v[1] : 'v' + i, name: v ? JSON.parse('"' + v[2] + '"') : '?', count: +m[1] };
    });
  };

  const notify = (title, body, tag) => {
    const n = new Notification(title, { body, tag, requireInteraction: true });
    n.onclick = () => { window.focus(); n.close(); };
  };

  // Voyant en haut à droite : état de la surveillance ; clic = autoriser les notifications (ou en envoyer une de test), croix = couper l'alerte
  const badge = document.createElement('button'), led = document.createElement('span'), label = document.createElement('span'), close = document.createElement('span');
  badge.type = 'button';
  badge.style.cssText = 'position:fixed;right:10px;top:8px;z-index:99999;display:flex;align-items:center;gap:6px;width:auto;height:auto;margin:0;border:1px solid #999;border-radius:20px;box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer';
  led.style.cssText = 'width:10px;height:10px;border-radius:50%';
  close.textContent = '×';
  close.title = 'Couper les alertes d\'attaque';
  close.style.cssText = 'margin-left:4px;font-weight:bold;opacity:.7';
  badge.append(led, label, close);
  // Surveillance active = pas coupée par la croix et notifications autorisées ; sinon aucune requête en arrière-plan
  const watching = () => !localStorage.gmAttackOff && Notification.permission === 'granted';
  let blink;
  const showBadge = lost => {
    const attacks = Object.values(JSON.parse(localStorage.gmAttackSeen || '{}')).reduce((sum, n) => sum + n, 0);
    // couleur, texte, pastille pleine bien visible, clignotement (quand il faut agir)
    const [color, text, loud, blinking] =
      localStorage.gmAttackOff ? ['#999', 'Alertes d\'attaque coupées'] :
      Notification.permission === 'denied' ? ['#999', 'Alertes bloquées dans Firefox', true] :
      Notification.permission !== 'granted' ? ['#e08a00', 'Activer les alertes d\'attaque', true, true] :
      lost ? ['#e08a00', 'Session expirée', true, true] :
      attacks ? ['#d00', attacks + ' attaque(s) en route', true, true] : ['#2a9d2a', 'Alertes d\'attaque actives'];
    badge.style.background = loud ? color : '#fff';
    badge.style.color = loud ? '#fff' : '#000';
    badge.style.font = loud ? 'bold 15px/22px sans-serif' : '12px/16px sans-serif';
    badge.style.padding = loud ? '8px 16px' : '4px 10px';
    led.style.background = loud ? '#fff' : color;
    close.style.display = localStorage.gmAttackOff ? 'none' : '';
    label.textContent = text;
    if (blink) blink = blink.cancel();
    if (blinking) blink = badge.animate([{ opacity: 1 }, { opacity: 0.25 }], { duration: 500, iterations: Infinity, direction: 'alternate' });
  };

  // Une notification par village dont le nombre d'attaques a augmenté depuis la dernière vérification
  const checkAttacks = html => {
    if (watching()) {
      const seen = JSON.parse(localStorage.gmAttackSeen || '{}'), now = {};
      readAttacks(html).forEach(v => {
        now[v.id] = v.count;
        if (v.count > (seen[v.id] || 0)) notify('Travian : attaque sur ' + v.name, v.count + ' attaque(s) en route', 'gm-attack-' + v.id);
      });
      localStorage.gmAttackSeen = JSON.stringify(now);
    }
    showBadge();
  };

  let attackTimer;
  const pollAttacks = () => {
    if (!watching() || Date.now() < +(localStorage.gmAttackNext || 0)) return; // échéance commune : un seul onglet fait la requête
    localStorage.gmAttackNext = Date.now() + nextDelay();
    fetch('/resources', { credentials: 'same-origin' }).then(r => r.text()).then(html => {
      if (html.includes('incomingAttacksAmount')) return checkAttacks(html);
      // session expirée : on prévient et on arrête, la surveillance reprend au prochain chargement d'une page du jeu
      clearInterval(attackTimer);
      showBadge(true);
      if (Notification.permission === 'granted') notify('Travian : surveillance des attaques arrêtée', 'Session expirée, reconnecte-toi', 'gm-attack-lost');
    }).catch(() => {});
  };

  if (window.top === window) document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement.innerHTML;
    if (!html.includes('incomingAttacksAmount')) return; // pas une page du jeu connectée
    // Firefox n'accorde les notifications que sur un clic
    badge.onclick = () => {
      if (localStorage.gmAttackOff) localStorage.gmAttackNext = 0; // réactivation : vérification dans les secondes qui suivent
      localStorage.removeItem('gmAttackOff');
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') notify('Travian : alertes d\'attaque actives', 'Notification de test', 'gm-attack-test');
        checkAttacks(html);
      });
    };
    close.onclick = event => {
      event.stopPropagation();
      localStorage.gmAttackOff = 1;
      showBadge();
    };
    document.body.appendChild(badge);
    window.addEventListener('storage', () => showBadge()); // un autre onglet a fait la vérification
    checkAttacks(html);
    localStorage.gmAttackNext = Date.now() + nextDelay(); // la page vient d'être chargée, inutile de revérifier tout de suite
    attackTimer = setInterval(pollAttacks, 20e3);
  });

  if (!/^\/build(ing|\.php)$/.test(location.pathname)) return; // la suite ne concerne que les listes de pillage et le marché

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

      /* Marché > Créer une offre : champ quantité de largeur fixe, la fenêtre s'adapte au contenu */
      .dialog.createOfferDialog { width: max-content !important; }
      .dialog.createOfferDialog .resourcePicker .inputRatio .nominator { width: 100px; }
      .dialog.createOfferDialog .resourcePicker .inputRatio .nominator input { width: 100% !important; }
      .dialog.createOfferDialog .resourcePicker .inputRatio .denominator { white-space: nowrap; }
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

/**
 * hud.js — Interface HUD (Heads-Up Display) tática
 *
 * Responsabilidades:
 *  - Relógio em tempo real (REC timestamp)
 *  - Indicador de sincronização (IDLE / ACTIVE / DONE)
 *  - Toast de notificações
 *  - Estatísticas de dados carregados
 */

let _toastTimer = null;

/**
 * Inicializa o HUD: relógio em tempo real e animações base.
 */
export function initHUD() {
  startClock();
  console.log('[HUD] Interface inicializada');
}

/**
 * Inicia o relógio em tempo real no canto superior esquerdo.
 * Formato: HH:MM:SS
 */
function startClock() {
  const clockEl = document.getElementById('sys-clock');
  if (!clockEl) return;

  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
  }

  tick();
  setInterval(tick, 1000);
}

/**
 * Atualiza o indicador de sincronização.
 *
 * @param {'idle'|'active'|'done'} state
 */
export function setSync(state) {
  const el = document.getElementById('sync-indicator');
  if (!el) return;

  el.className = '';  // limpa classes anteriores

  switch (state) {
    case 'active':
      el.className = 'sync-active';
      el.textContent = '◉ SYNC';
      break;
    case 'done':
      el.className = 'sync-done';
      el.textContent = '◉ OK';
      break;
    case 'idle':
    default:
      el.className = 'sync-idle';
      el.textContent = '◉ IDLE';
      break;
  }
}

/**
 * Exibe uma notificação toast temporária.
 * Desaparece automaticamente após 2.5s.
 *
 * @param {string} message
 * @param {number} [duration=2500]
 */
export function toast(message, duration = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = message;
  el.classList.add('visible');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove('visible');
  }, duration);
}

/**
 * Atualiza a contagem de registros carregados por camada.
 *
 * @param {string} key    - 'ar' | 'focos' | 'saude'
 * @param {number} count  - número de registros
 */
export function updateStats(key, count) {
  const el = document.getElementById(`stat-${key}`);
  if (!el) return;
  el.textContent = `${count.toLocaleString('pt-BR')} registros`;
  el.style.color = '#ffb300';
  setTimeout(() => { el.style.color = ''; }, 1500);
}

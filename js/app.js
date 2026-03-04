/**
 * app.js — Controlador principal
 * 
 * Conecta: simulation.js → map.js → UI DOM
 * 
 * Para adicionar nova mecânica:
 *   1. Adicione âncoras em anchors.js
 *   2. Adicione camada em layers.js (se nova)
 *   3. Adicione regra em simulation.js (se afeta o estado)
 *   4. app.js não precisa de alterações para novos pontos/camadas
 */

import { LAYERS, LAYER_MAP }        from './layers.js';
import { ANCHORS_BY_LAYER, ANCHORS } from './anchors.js';
import { STATE, tick, getAlerts }   from './simulation.js';
import { initMap, renderLayer, clearLayer, clearAll, startPulse } from './map.js';

// ── Estado do app ─────────────────────────────────────────
const active = new Set(LAYERS.filter(l => l.active).map(l => l.id));
let _tickInterval = null;
let _initialized  = false;

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  buildPanel();
  setupStatusBar();

  try {
    await initMap('map');
    _initialized = true;
    startPulse();
    document.getElementById('map-status').textContent = 'ONLINE';
    document.getElementById('map-status').className = 'online';
    renderAll();
    startTick();
  } catch (err) {
    document.getElementById('map-status').textContent = 'Erro ao carregar mapa';
    console.error(err);
  }
});

// ── Painel de camadas ─────────────────────────────────────
function buildPanel() {
  const ul = document.getElementById('layer-list');
  ul.innerHTML = '';

  LAYERS.forEach(l => {
    const on  = active.has(l.id);
    const li  = document.createElement('li');
    li.className    = `layer-item ${on ? 'on' : 'off'}`;
    li.dataset.id   = l.id;
    li.style.setProperty('--lc', l.color);
    li.style.setProperty('--lg', l.glowColor + '0.35)');
    li.innerHTML = `
      <span class="li-icon">${l.icon}</span>
      <div class="li-body">
        <span class="li-name">${l.nome}</span>
        <span class="li-stat" id="stat-${l.id}">${l.statSummary(STATE)}</span>
      </div>
      <div class="li-dot ${on ? 'active' : ''}"></div>`;
    li.addEventListener('click', () => toggleLayer(l.id));
    ul.appendChild(li);
  });
}

function toggleLayer(id) {
  if (active.has(id)) {
    active.delete(id);
    clearLayer(id);
  } else {
    active.add(id);
    renderActiveLayer(id);
  }
  // Atualiza UI
  document.querySelectorAll('.layer-item').forEach(el => {
    const on = active.has(el.dataset.id);
    el.className = `layer-item ${on ? 'on' : 'off'}`;
    el.querySelector('.li-dot').className = `li-dot ${on ? 'active' : ''}`;
  });
}

// ── Renderização ──────────────────────────────────────────
function renderAll() {
  clearAll();
  active.forEach(id => renderActiveLayer(id));
}

function renderActiveLayer(id) {
  const cfg     = LAYER_MAP[id];
  const anchors = ANCHORS_BY_LAYER[id] || [];
  renderLayer(id, anchors, STATE, cfg);
}

// ── Atualiza stats sem re-renderizar (a cada tick) ────────
function updateStats() {
  LAYERS.forEach(l => {
    const el = document.getElementById(`stat-${l.id}`);
    if (el) el.textContent = l.statSummary(STATE);
  });
}

// ── Re-renderiza apenas camadas ativas ────────────────────
function refreshActive() {
  if (!_initialized) return;
  active.forEach(id => {
    clearLayer(id);
    renderActiveLayer(id);
  });
  updateStats();
  updateAlerts();
  updateClock();
}

// ── Tick timer ────────────────────────────────────────────
function startTick() {
  tick(); // roda imediatamente
  refreshActive();
  _tickInterval = setInterval(() => {
    tick();
    refreshActive();
  }, 45_000); // 45s
  // Para demo rápido: troque 45_000 → 8_000
}

// ── Alertas ───────────────────────────────────────────────
function updateAlerts() {
  const alerts = getAlerts();
  const wrap   = document.getElementById('alerts');
  if (!wrap) return;
  wrap.innerHTML = '';
  alerts.forEach(a => {
    const div = document.createElement('div');
    div.className = `alert-item ${a.sev}`;
    div.textContent = a.txt;
    wrap.appendChild(div);
  });
}

// ── Relógio ───────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

// ── Status bar ────────────────────────────────────────────
function setupStatusBar() {
  updateClock();
  setInterval(updateClock, 1000);
  document.getElementById('active-count').textContent = active.size;
  document.getElementById('map-status').textContent = 'ONLINE';
  document.getElementById('map-status').className = 'online';
  document.getElementById('anchor-count').textContent =
    ANCHORS.length;
}

// Observa mudança em active para atualizar contagem
const _origToggle = toggleLayer;
window._toggleLayer = id => {
  _origToggle(id);
  document.getElementById('active-count').textContent = active.size;
};

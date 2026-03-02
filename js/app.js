/**
 * app.js — Ponto de entrada da aplicação
 * Mapa Social SP — Coordena todos os módulos
 *
 * Fluxo de inicialização:
 *  1. HUD (relógio, animações)
 *  2. Efeitos CRT (canvas WebGL)
 *  3. Mapa MapLibre 3D
 *  4. DuckDB-WASM
 *  5. Camadas de dados
 *  6. Sistema de Rastro do Impacto
 */

import { initHUD, setSync, toast, updateStats } from './hud.js';
import { initCRT, setCRTDistortion, setCRTScanlines } from './effects.js';
import { initMap } from './map.js';
import { initDuckDB, loadParquet } from './data.js';
import { addLayer, removeLayer, toggleLayer, flashLayer, LAYER_CONFIGS } from './layers.js';
import { bindImpact } from './impact.js';

// ── Estado global ──────────────────────────────────────────
const STATE = {
  map: null,
  db: null,
  datasets: {},        // cache: { ar: Array, focos: Array, saude: Array }
  activeLayers: new Set(),
  lastUpdate: null,
};

// ── Bootstrap ──────────────────────────────────────────────
async function bootstrap() {
  // 1. HUD
  initHUD();

  // 2. Efeitos CRT
  initCRT();

  // 3. Mapa
  STATE.map = await initMap('map');

  // 4. DuckDB
  toast('Inicializando banco de dados...');
  STATE.db = await initDuckDB();
  toast('DuckDB pronto ✓');

  // 5. Bind de camadas
  bindLayerToggles();

  // 6. Rastro do Impacto
  bindImpact(STATE);

  // 7. Sliders CRT
  bindSliders();

  // 8. Botão sync
  document.getElementById('btn-sync').addEventListener('click', () => syncAll());
  document.getElementById('btn-demo').addEventListener('click', runDemoImpact);

  // 9. Intro
  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('intro-overlay').style.display = 'none';
    // Carrega camada de AR por padrão após 500ms
    setTimeout(() => activateLayer('ar'), 500);
  });

  // 10. Auto-sync ao carregar
  await syncAll();
}

// ── Ativa/desativa camada ──────────────────────────────────
async function activateLayer(key) {
  const el = document.querySelector(`[data-layer="${key}"]`);
  if (!el) return;

  if (STATE.activeLayers.has(key)) {
    // Desativar
    STATE.activeLayers.delete(key);
    el.classList.remove('active');
    removeLayer(STATE.map, key);
    return;
  }

  // Ativar — carrega dados se necessário
  STATE.activeLayers.add(key);
  el.classList.add('active');

  if (!STATE.datasets[key]) {
    setSync('active');
    toast(`Carregando ${key.toUpperCase()}...`);
    try {
      STATE.datasets[key] = await loadParquet(STATE.db, key);
      updateStats(key, STATE.datasets[key].length);
      toast(`${key.toUpperCase()}: ${STATE.datasets[key].length} registros carregados`);
    } catch (e) {
      toast(`Erro ao carregar ${key}: ${e.message}`);
      STATE.activeLayers.delete(key);
      el.classList.remove('active');
      setSync('idle');
      return;
    }
    setSync('done');
    setTimeout(() => setSync('idle'), 2000);
  }

  addLayer(STATE.map, key, STATE.datasets[key]);
  flashLayer(STATE.map, key);
}

// ── Bind de toggles de camadas ─────────────────────────────
function bindLayerToggles() {
  document.querySelectorAll('.layer-toggle').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.layer;
      activateLayer(key);
    });
  });
}

// ── Sincronização manual de todas as camadas ativas ────────
async function syncAll() {
  setSync('active');
  STATE.lastUpdate = new Date();
  document.getElementById('last-update').textContent =
    `ÚLTIMA ATUALIZAÇÃO: ${STATE.lastUpdate.toLocaleTimeString('pt-BR')}`;

  // Limpa cache para forçar re-download
  for (const key of STATE.activeLayers) {
    delete STATE.datasets[key];
  }

  // Recarrega camadas ativas
  const toReload = [...STATE.activeLayers];
  STATE.activeLayers.clear();
  for (const key of toReload) {
    removeLayer(STATE.map, key);
  }
  for (const key of toReload) {
    await activateLayer(key);
  }

  setSync('done');
  toast('Sincronização concluída ✓');
  setTimeout(() => setSync('idle'), 3000);
}

// ── Demo do Rastro do Impacto ──────────────────────────────
function runDemoImpact() {
  // Simula clique em hospital no centro de SP
  const demoEvent = {
    lngLat: { lng: -46.6333, lat: -23.5505 },
    _demo: true,
    _label: 'Hospital das Clínicas (DEMO)',
  };
  window.dispatchEvent(new CustomEvent('impact:trigger', { detail: demoEvent }));
}

// ── Bind sliders CRT ───────────────────────────────────────
function bindSliders() {
  const sDistortion = document.getElementById('slider-distortion');
  const sScanlines  = document.getElementById('slider-scanlines');

  sDistortion.addEventListener('input', () => {
    document.getElementById('val-distortion').textContent = sDistortion.value;
    setCRTDistortion(sDistortion.value / 100);
  });

  sScanlines.addEventListener('input', () => {
    document.getElementById('val-scanlines').textContent = sScanlines.value;
    setCRTScanlines(sScanlines.value / 100);
  });
}

// ── Inicia ─────────────────────────────────────────────────
bootstrap().catch(err => {
  console.error('[MAPA SOCIAL] Erro crítico:', err);
  toast('ERRO CRÍTICO — Ver console');
});

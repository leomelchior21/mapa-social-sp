/**
 * map.js — Motor GIS (MapLibre GL)
 * 
 * Responsabilidade única: renderizar âncoras como blobs amorfos pulsantes.
 * Sem dependência de chart.js ou UI DOM externa.
 * 
 * API:
 *   initMap(container) → Promise
 *   renderLayer(layerId, anchors, state, layerCfg)
 *   clearLayer(layerId)
 *   clearAll()
 */

import { ANCHOR_MAP } from './anchors.js';

let _map = null;
let _activeSources = new Set(); // source ids atualmente no mapa
let _activeLayers  = new Set(); // layer ids atualmente no mapa
let _popups        = new Map(); // anchorId → maplibregl.Popup

// Estilos de mapa (fallback chain)
const STYLES = [
  'https://tiles.openfreemap.org/styles/dark',
  'https://tiles.openfreemap.org/styles/positron',
  'https://demotiles.maplibre.org/style.json',
];

export function getMap() { return _map; }

// ── Inicializa ────────────────────────────────────────────
export function initMap(container) {
  return new Promise((resolve, reject) => {
    let styleIdx = 0;

    function tryStyle() {
      if (styleIdx >= STYLES.length) { reject(new Error('All map styles failed')); return; }

      if (_map) { try { _map.remove(); } catch(e) {} }

      _map = new maplibregl.Map({
        container,
        style: STYLES[styleIdx],
        center: [-46.636, -23.548],
        zoom: 10.5,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: false,
        pitchWithRotate: false,
      });

      _map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );
      _map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'bottom-left'
      );

      _map.on('error', () => { styleIdx++; tryStyle(); });
      _map.on('load',  () => resolve(_map));
    }

    tryStyle();
  });
}

// ── Renderiza uma camada de âncoras ───────────────────────
/**
 * @param {string} layerId - id da camada (ex: 'ar')
 * @param {Array} anchors  - âncoras filtradas para essa camada
 * @param {Object} state   - STATE da simulação
 * @param {Object} layerCfg - config da camada (cor, nome, etc.)
 */
export function renderLayer(layerId, anchors, state, layerCfg) {
  if (!_map) return;

  clearLayer(layerId);

  anchors.forEach(anchor => {
    const val      = anchor.value(state);
    const sev      = anchor.severity(state);
    const color    = sevColor(sev, layerCfg.color);
    const srcId    = `src-${anchor.id}`;
    const blobId   = `blob-${anchor.id}`;
    const haloId   = `halo-${anchor.id}`;
    const dotId    = `dot-${anchor.id}`;
    const labelId  = `lbl-${anchor.id}`;

    // Raio do blob proporcional ao valor (normalizado)
    const baseRadius = normalizeRadius(val, layerId);

    // ── GeoJSON ponto ──────────────────────────────────
    safeAddSource(srcId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [anchor.lng, anchor.lat] },
        properties: {
          val, sev, color,
          label: anchor.label(state),
          nome:  anchor.nome,
          bairro:anchor.bairro,
          layerId,
        },
      },
    });

    // ── Halo externo (anel difuso) ─────────────────────
    safeAddLayer({
      id: haloId, type: 'circle', source: srcId,
      paint: {
        'circle-radius': ['interpolate',['linear'],['zoom'], 9, baseRadius*2.5, 14, baseRadius*5],
        'circle-color':  color,
        'circle-opacity': sev === 'crit' ? 0.12 : 0.07,
        'circle-blur':    1.2,
        'circle-pitch-alignment': 'map',
      },
    });

    // ── Blob central (forma amorfa via blur) ──────────
    safeAddLayer({
      id: blobId, type: 'circle', source: srcId,
      paint: {
        'circle-radius': ['interpolate',['linear'],['zoom'], 9, baseRadius*1.3, 14, baseRadius*3],
        'circle-color':  color,
        'circle-opacity': sev === 'crit' ? 0.55 : sev === 'warn' ? 0.42 : 0.28,
        'circle-blur':    0.65,
        'circle-pitch-alignment': 'map',
      },
    });

    // ── Ponto central sólido ──────────────────────────
    safeAddLayer({
      id: dotId, type: 'circle', source: srcId,
      paint: {
        'circle-radius': ['interpolate',['linear'],['zoom'], 9, 3.5, 14, 8],
        'circle-color':  color,
        'circle-opacity': 1,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': sev === 'ok' ? 'rgba(0,0,0,0.6)' : '#fff',
        'circle-stroke-opacity': 0.8,
        'circle-pitch-alignment': 'map',
      },
    });

    // ── Label flutuante ──────────────────────────────
    safeAddLayer({
      id: labelId, type: 'symbol', source: srcId,
      layout: {
        'text-field': anchor.nome,
        'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
        'text-size': ['interpolate',['linear'],['zoom'], 10,0, 11,10, 14,12],
        'text-offset': [0, -1.8],
        'text-anchor': 'bottom',
        'text-max-width': 12,
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': 'rgba(0,0,0,0.85)',
        'text-halo-width': 1.5,
        'text-opacity': ['interpolate',['linear'],['zoom'], 10,0, 11,0.7, 14,1],
      },
    });

    // ── Click → popup ─────────────────────────────────
    _map.on('click', dotId, e => {
      const p = e.features[0].properties;
      closeAllPopups();
      const pop = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 14,
        className: 'hud-popup',
      })
        .setLngLat([anchor.lng, anchor.lat])
        .setHTML(buildPopupHTML(anchor, state, layerCfg))
        .addTo(_map);
      _popups.set(anchor.id, pop);
      pop.on('close', () => _popups.delete(anchor.id));
    });

    _map.on('mouseenter', dotId, () => { _map.getCanvas().style.cursor = 'crosshair'; });
    _map.on('mouseleave', dotId, () => { _map.getCanvas().style.cursor = ''; });

    // Registra para cleanup
    _activeSources.add(srcId);
    _activeLayers.add(haloId);
    _activeLayers.add(blobId);
    _activeLayers.add(dotId);
    _activeLayers.add(labelId);
  });
}

// ── Animação de pulso (intervalo externo) ─────────────────
// Não usamos CSS animation no GL — alternamos opacidade via setPaintProperty
let _pulseTimer   = null;
let _pulseState   = 0;
const PULSE_MS    = 1200;

export function startPulse() {
  if (_pulseTimer) return;
  _pulseTimer = setInterval(() => {
    if (!_map) return;
    _pulseState = (_pulseState + 1) % 4;
    const t  = _pulseState / 3;                         // 0→1
    const op = 0.42 + 0.25 * Math.sin(t * Math.PI);    // 0.42…0.67

    _activeLayers.forEach(id => {
      if (!id.startsWith('blob-') && !id.startsWith('halo-')) return;
      try {
        const isCrit = id.startsWith('blob-')
          ? _map.getPaintProperty(id, 'circle-opacity') > 0.45
          : false;
        const base = id.startsWith('halo-') ? 0.06 : isCrit ? 0.45 : 0.30;
        _map.setPaintProperty(id, 'circle-opacity', base + 0.18 * Math.sin(t * Math.PI));
      } catch(e) {}
    });
  }, PULSE_MS);
}

export function stopPulse() {
  clearInterval(_pulseTimer);
  _pulseTimer = null;
}

// ── Limpa camada específica ───────────────────────────────
export function clearLayer(layerId) {
  closeAllPopups();

  const toRemove = [];
  _activeLayers.forEach(id => {
    const anchorId = id.replace(/^(blob|halo|dot|lbl)-/, '');
    const anchor   = ANCHOR_MAP[anchorId];
    if (anchor && anchor.layer === layerId) toRemove.push(id);
  });

  toRemove.forEach(id => {
    try { if (_map.getLayer(id)) _map.removeLayer(id); } catch(e) {}
    _activeLayers.delete(id);
  });

  const srcToRemove = [];
  _activeSources.forEach(id => {
    const anchorId = id.replace('src-', '');
    const anchor   = ANCHOR_MAP[anchorId];
    if (anchor && anchor.layer === layerId) srcToRemove.push(id);
  });

  srcToRemove.forEach(id => {
    try { if (_map.getSource(id)) _map.removeSource(id); } catch(e) {}
    _activeSources.delete(id);
  });
}

// ── Limpa tudo ────────────────────────────────────────────
export function clearAll() {
  closeAllPopups();
  _activeLayers.forEach(id => { try { if(_map?.getLayer(id)) _map.removeLayer(id); } catch(e){} });
  _activeSources.forEach(id => { try { if(_map?.getSource(id)) _map.removeSource(id); } catch(e){} });
  _activeLayers.clear();
  _activeSources.clear();
}

// ── Helpers internos ─────────────────────────────────────
function safeAddSource(id, spec) {
  try { if (!_map.getSource(id)) _map.addSource(id, spec); } catch(e) {}
}
function safeAddLayer(spec) {
  try { if (!_map.getLayer(spec.id)) _map.addLayer(spec); } catch(e) {}
}
function closeAllPopups() {
  _popups.forEach(p => { try { p.remove(); } catch(e) {} });
  _popups.clear();
}

function sevColor(sev, defaultColor) {
  if (sev === 'crit') return '#ef4444';
  if (sev === 'warn') return '#f59e0b';
  return defaultColor;
}

/** Normaliza valor para raio de blob (9–22px em zoom 10) */
function normalizeRadius(val, layerId) {
  const ranges = {
    ar:       [4, 45],
    agua:     [0, 20],
    trafego:  [5, 99],
    energia:  [5, 45],
    residuos: [40, 2200],
    solo:     [0, 50],
    saude:    [80, 400],
  };
  const [lo, hi] = ranges[layerId] || [0, 100];
  const t = Math.min(1, Math.max(0, (val - lo) / (hi - lo)));
  return 9 + t * 22; // 9…31 px base
}

/** HTML do popup HUD */
function buildPopupHTML(anchor, state, layerCfg) {
  const sev   = anchor.severity(state);
  const val   = anchor.value(state);
  const sevClass = sev === 'crit' ? 'sev-crit' : sev === 'warn' ? 'sev-warn' : 'sev-ok';
  const sevLabel = sev === 'crit' ? 'CRÍTICO' : sev === 'warn' ? 'ATENÇÃO' : 'NORMAL';

  // Âncoras influenciadas
  const affecting = (anchor.affects || [])
    .map(id => ANCHOR_MAP[id])
    .filter(Boolean)
    .map(a => `<span class="pop-affect-tag">${a.nome}</span>`)
    .join('');

  return `
    <div class="hud-pop-inner">
      <div class="hud-pop-header">
        <span class="hud-pop-icon">${layerCfg.icon}</span>
        <div>
          <div class="hud-pop-name">${anchor.nome}</div>
          <div class="hud-pop-bairro">${anchor.bairro}</div>
        </div>
        <span class="hud-pop-sev ${sevClass}">${sevLabel}</span>
      </div>
      <div class="hud-pop-label">${anchor.label(state)}</div>
      ${affecting ? `<div class="hud-pop-affects">
        <span class="hud-pop-affects-lbl">Afeta:</span>
        ${affecting}
      </div>` : ''}
      <div class="hud-pop-footer">${layerCfg.nome}</div>
    </div>`;
}

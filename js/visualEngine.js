/**
 * visualEngine.js — Motor de Visualização Dinâmica
 *
 * Cada camada tem identidade geométrica própria no mapa:
 * - Atmosfera   → grid de micro-pontos com densidade variável
 * - Hidrosfera  → hachuras diagonais animadas em zonas de chuva
 * - Resíduos    → glifos X/losango piscantes
 * - Tráfego     → linhas de fluxo com espessura e velocidade variável
 * - Saúde       → circles com gradiente radial (heatmap minimalista)
 * - Energia/Solo→ polígonos de zona com opacidade variável
 *
 * Todas as geometrias vivem em sources GeoJSON próprias.
 * Atualizadas a cada tick sem recriar as layers (setData).
 */

import { STATE, ZONES } from './simulation.js';

// ── Cores por camada ───────────────────────────────────
export const LAYER_COLORS = {
  ar:       '#f97316',
  agua:     '#0ea5e9',
  energia:  '#a855f7',
  residuos: '#22c55e',
  solo:     '#84cc16',
  trafego:  '#f43f5e',
  saude:    '#ec4899',
};

// ── IDs de sources e layers criados ───────────────────
const MANAGED = {};  // { layer: { sources: [], layers: [] } }

// ── Referência ao mapa ─────────────────────────────────
let _map = null;
let _animFrame = null;
let _animT = 0;  // tempo global de animação (ms)

export function initVisualEngine(map) {
  _map = map;
  // Loop de animação para efeitos contínuos
  function animLoop(ts) {
    _animT = ts;
    animateFlowLines(ts);
    animateHachuras(ts);
    _animFrame = requestAnimationFrame(animLoop);
  }
  _animFrame = requestAnimationFrame(animLoop);
}

// ══════════════════════════════════════════════════════
// RENDERIZAÇÃO POR CAMADA
// ══════════════════════════════════════════════════════

/**
 * Renderiza ou atualiza uma camada no mapa.
 * @param {string} layer - 'ar'|'agua'|'trafego'|'residuos'|'saude'|'energia'|'solo'
 */
export function renderLayer(layer) {
  if (!_map || !_map.isStyleLoaded()) return;
  switch (layer) {
    case 'ar':       renderAr();       break;
    case 'agua':     renderAgua();     break;
    case 'trafego':  renderTrafego();  break;
    case 'residuos': renderResiduos(); break;
    case 'saude':    renderSaude();    break;
    case 'energia':  renderEnergia();  break;
    case 'solo':     renderSolo();     break;
  }
}

export function removeLayer(layer) {
  if (!_map || !MANAGED[layer]) return;
  const m = MANAGED[layer];
  (m.layers || []).forEach(id => { try { if (_map.getLayer(id))  _map.removeLayer(id);  } catch(e){} });
  (m.sources || []).forEach(id => { try { if (_map.getSource(id)) _map.removeSource(id); } catch(e){} });
  delete MANAGED[layer];
}

/** Atualiza dados de uma camada existente (sem recriar layers) */
export function updateLayerData(layer) {
  if (!_map || !MANAGED[layer]) { renderLayer(layer); return; }
  switch (layer) {
    case 'ar':       updateArData();       break;
    case 'agua':     updateAguaData();     break;
    case 'trafego':  updateTrafegoData();  break;
    case 'residuos': updateResiduosData(); break;
    case 'saude':    updateSaudeData();    break;
    case 'energia':  updateEnergiaData();  break;
    case 'solo':     updateSoloData();     break;
  }
}

// ──────────────────────────────────────────────────────
// AR — Grid de micro-pontos com densidade por poluição
// ──────────────────────────────────────────────────────
function renderAr() {
  const src = 'src-ar-dots';
  const lyr = 'lyr-ar-dots';
  const lyrHalo = 'lyr-ar-halo';

  if (!_map.getSource(src)) {
    _map.addSource(src, { type: 'geojson', data: buildArDots() });

    // Halo de zona de poluição (círculos grandes, semitransparentes)
    _map.addLayer({
      id: lyrHalo, type: 'circle', source: src,
      filter: ['==', ['get', 'type'], 'zone'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 20, 1, 80],
        'circle-color':  LAYER_COLORS.ar,
        'circle-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.04, 1, 0.18],
        'circle-blur': 1.0,
      },
    });

    // Micro-pontos (1-3px)
    _map.addLayer({
      id: lyr, type: 'circle', source: src,
      filter: ['==', ['get', 'type'], 'dot'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 1, 1, 2.5],
        'circle-color':  LAYER_COLORS.ar,
        'circle-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.3, 1, 0.85],
      },
    });

    MANAGED.ar = { sources: [src], layers: [lyrHalo, lyr] };
  } else {
    updateArData();
  }
}

function buildArDots() {
  const features = [];
  const iqa = STATE.ar.iqa;
  const intensity = Math.min(1, iqa / 150);

  ZONES.ar.forEach(zone => {
    const zIntensity = Math.min(1, intensity * zone.factor);
    // Zona de fundo
    features.push({ type:'Feature', geometry:{ type:'Point', coordinates:[zone.lng, zone.lat] },
      properties: { type:'zone', intensity: zIntensity, zone: zone.id } });

    // Grid de micro-pontos proporcional à intensidade
    const dotCount = Math.round(12 + zIntensity * 40);
    for (let i = 0; i < dotCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * zone.radius;
      features.push({ type:'Feature', geometry: {
        type:'Point',
        coordinates: [zone.lng + Math.cos(angle)*dist, zone.lat + Math.sin(angle)*dist*0.7]
      }, properties: { type:'dot', intensity: zIntensity * (0.5 + Math.random()*0.5) } });
    }
  });
  return { type:'FeatureCollection', features };
}

function updateArData() {
  const src = _map.getSource('src-ar-dots');
  if (src) src.setData(buildArDots());
}

// ──────────────────────────────────────────────────────
// ÁGUA — Hachuras em zonas de chuva/alagamento
// ──────────────────────────────────────────────────────
// Implementação: linhas curtas diagonais animadas sobre zonas de risco
let _aguaHachuraOffset = 0;

function renderAgua() {
  const src = 'src-agua';
  const lyrZone  = 'lyr-agua-zone';
  const lyrLines = 'lyr-agua-lines';

  if (!_map.getSource(src)) {
    _map.addSource(src, { type:'geojson', data: buildAguaGeo() });

    // Zona de risco (polígono preenchido)
    _map.addLayer({
      id: lyrZone, type: 'circle', source: src,
      filter: ['==', ['get', 'type'], 'zone'],
      paint: {
        'circle-radius': ['interpolate',['linear'],['get','intensity'], 0,30, 1,100],
        'circle-color': LAYER_COLORS.agua,
        'circle-opacity': ['interpolate',['linear'],['get','intensity'], 0,0.05, 1,0.20],
        'circle-blur': 0.8,
      },
    });

    // Linhas de hachura (série de segmentos curtos)
    _map.addLayer({
      id: lyrLines, type: 'line', source: src,
      filter: ['==', ['get', 'type'], 'hachura'],
      paint: {
        'line-color': LAYER_COLORS.agua,
        'line-width': 1,
        'line-opacity': ['interpolate',['linear'],['get','intensity'], 0,0.2, 1,0.75],
        'line-dasharray': [2, 4],
      },
    });

    MANAGED.agua = { sources: [src], layers: [lyrZone, lyrLines] };
  } else {
    updateAguaData();
  }
}

function buildAguaGeo() {
  const features = [];
  const turbidez  = STATE.agua.turbidez;
  const chuva     = STATE.clima?.chuva ?? 0;
  const intensity = Math.min(1, (turbidez / 12) + (chuva / 20));

  ZONES.agua.forEach(zone => {
    const zi = Math.min(1, intensity * zone.factor);
    features.push({ type:'Feature', geometry:{ type:'Point', coordinates:[zone.lng, zone.lat] },
      properties: { type:'zone', intensity: zi } });

    // Hachuras diagonais: linhas curtas paralelas
    const lineCount = Math.round(6 + zi * 18);
    for (let i = 0; i < lineCount; i++) {
      const ox = (Math.random() - 0.5) * zone.radius * 2;
      const oy = (Math.random() - 0.5) * zone.radius * 1.5;
      const len = 0.003 + Math.random() * 0.005;
      features.push({ type:'Feature',
        geometry: { type:'LineString', coordinates: [
          [zone.lng + ox,       zone.lat + oy],
          [zone.lng + ox + len, zone.lat + oy - len * 0.7],
        ]},
        properties: { type:'hachura', intensity: zi } });
    }
  });
  return { type:'FeatureCollection', features };
}

function updateAguaData() {
  const src = _map.getSource('src-agua');
  if (src) src.setData(buildAguaGeo());
}

function animateHachuras(ts) {
  // Desloca o dasharray das hachuras para simular movimento
  if (!_map || !MANAGED.agua) return;
  const offset = (ts / 120) % 6;
  try {
    _map.setPaintProperty('lyr-agua-lines', 'line-dasharray', [2, 4]);
    _map.setPaintProperty('lyr-agua-lines', 'line-dasharray-offset', -offset);
  } catch (e) {}
}

// ──────────────────────────────────────────────────────
// TRÁFEGO — Linhas de fluxo com espessura e opacidade
// ──────────────────────────────────────────────────────
let _flowOffset = 0;

function renderTrafego() {
  const src    = 'src-trafego';
  const lyrFlw = 'lyr-trafego-flow';
  const lyrZn  = 'lyr-trafego-zone';

  if (!_map.getSource(src)) {
    _map.addSource(src, { type:'geojson', data: buildTrafegoGeo() });

    _map.addLayer({
      id: lyrZn, type: 'circle', source: src,
      filter: ['==',['get','type'],'zone'],
      paint: {
        'circle-radius': ['interpolate',['linear'],['get','intensity'],0,30,1,70],
        'circle-color': LAYER_COLORS.trafego,
        'circle-opacity': ['interpolate',['linear'],['get','intensity'],0,0.04,1,0.18],
        'circle-blur': 1,
      },
    });

    _map.addLayer({
      id: lyrFlw, type: 'line', source: src,
      filter: ['==',['get','type'],'flow'],
      layout: { 'line-cap':'round', 'line-join':'round' },
      paint: {
        'line-color': ['interpolate',['linear'],['get','intensity'],
          0, '#22c55e', 0.5, '#f97316', 1, '#f43f5e'],
        'line-width': ['interpolate',['linear'],['get','intensity'],0,2,1,6],
        'line-opacity': 0.75,
        'line-dasharray': [2, 3],
      },
    });

    MANAGED.trafego = { sources:[src], layers:[lyrZn, lyrFlw] };
  } else {
    updateTrafegoData();
  }
}

function buildTrafegoGeo() {
  const features = [];
  const cong = STATE.trafego.congestionamento / 100;

  ZONES.trafego.forEach(zone => {
    const zi = Math.min(1, cong * zone.factor);
    features.push({ type:'Feature', geometry:{ type:'Point', coordinates:[zone.lng, zone.lat] },
      properties:{ type:'zone', intensity: zi } });

    if (zone.vias) {
      features.push({ type:'Feature',
        geometry:{ type:'LineString', coordinates: zone.vias },
        properties:{ type:'flow', intensity: zi } });
    }
  });
  return { type:'FeatureCollection', features };
}

function updateTrafegoData() {
  const src = _map.getSource('src-trafego');
  if (src) src.setData(buildTrafegoGeo());
}

function animateFlowLines(ts) {
  if (!_map || !MANAGED.trafego) return;
  const speed = 1 + (STATE.trafego.congestionamento / 100) * 2;
  const offset = -(ts / (300 / speed)) % 5;
  try {
    _map.setPaintProperty('lyr-trafego-flow', 'line-dasharray-offset', offset);
  } catch (e) {}
}

// ──────────────────────────────────────────────────────
// RESÍDUOS — Glifos (círculo + X) nos pontos de acúmulo
// ──────────────────────────────────────────────────────
function renderResiduos() {
  const src    = 'src-residuos';
  const lyrDot = 'lyr-res-dot';
  const lyrRng = 'lyr-res-ring';

  if (!_map.getSource(src)) {
    _map.addSource(src, { type:'geojson', data: buildResiduosGeo() });

    // Anel externo pulsante
    _map.addLayer({
      id: lyrRng, type:'circle', source: src,
      filter:['==',['get','type'],'glyph'],
      paint: {
        'circle-radius': ['interpolate',['linear'],['get','intensity'],0,10,1,22],
        'circle-color': 'transparent',
        'circle-stroke-color': LAYER_COLORS.residuos,
        'circle-stroke-width': 1.5,
        'circle-opacity': ['interpolate',['linear'],['get','intensity'],0,0.4,1,0.9],
      },
    });

    // Ponto central
    _map.addLayer({
      id: lyrDot, type:'circle', source: src,
      filter:['==',['get','type'],'glyph'],
      paint: {
        'circle-radius': 4,
        'circle-color': LAYER_COLORS.residuos,
        'circle-opacity': ['interpolate',['linear'],['get','intensity'],0,0.6,1,1.0],
      },
    });

    MANAGED.residuos = { sources:[src], layers:[lyrRng, lyrDot] };
  } else {
    updateResiduosData();
  }
}

function buildResiduosGeo() {
  const features = [];
  const irreg = STATE.residuos.pts_irreg / 2500;

  ZONES.residuos.forEach(zone => {
    const zi = Math.min(1, irreg * zone.factor);
    features.push({ type:'Feature',
      geometry:{ type:'Point', coordinates:[zone.lng, zone.lat] },
      properties:{ type:'glyph', intensity: zi, name: zone.name } });
  });
  return { type:'FeatureCollection', features };
}

function updateResiduosData() {
  const src = _map.getSource('src-residuos');
  if (src) src.setData(buildResiduosGeo());
}

// ──────────────────────────────────────────────────────
// SAÚDE — Circles com gradiente radial (heatmap minimalista)
// ──────────────────────────────────────────────────────
function renderSaude() {
  const src    = 'src-saude';
  const lyrH   = 'lyr-saude-halo';
  const lyrC   = 'lyr-saude-core';

  if (!_map.getSource(src)) {
    _map.addSource(src, { type:'geojson', data: buildSaudeGeo() });

    _map.addLayer({
      id: lyrH, type:'circle', source: src,
      paint: {
        'circle-radius': ['interpolate',['linear'],['zoom'],10,30,14,80],
        'circle-color': LAYER_COLORS.saude,
        'circle-opacity': ['interpolate',['linear'],['get','intensity'],0,0.04,1,0.18],
        'circle-blur': 0.9,
      },
    });

    _map.addLayer({
      id: lyrC, type:'circle', source: src,
      paint: {
        'circle-radius': 7,
        'circle-color': LAYER_COLORS.saude,
        'circle-opacity': 0.9,
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1.5,
      },
    });

    MANAGED.saude = { sources:[src], layers:[lyrH, lyrC] };
  } else {
    updateSaudeData();
  }
}

function buildSaudeGeo() {
  const features = [];
  const resp = STATE.saude.respirat / 250;

  ZONES.saude.forEach(zone => {
    const zi = Math.min(1, resp * zone.factor);
    features.push({ type:'Feature',
      geometry:{ type:'Point', coordinates:[zone.lng, zone.lat] },
      properties:{ type:'hospital', intensity: zi, name: zone.name } });
  });
  return { type:'FeatureCollection', features };
}

function updateSaudeData() {
  const src = _map.getSource('src-saude');
  if (src) src.setData(buildSaudeGeo());
}

// ──────────────────────────────────────────────────────
// ENERGIA — Zonas de carga com polígono suave
// ──────────────────────────────────────────────────────
const ENERGIA_ZONES = [
  { lat:-23.552, lng:-46.638, name:'Centro', carga: 0.85 },
  { lat:-23.610, lng:-46.700, name:'Zona Sul', carga: 0.72 },
  { lat:-23.500, lng:-46.560, name:'Zona Leste', carga: 0.68 },
  { lat:-23.520, lng:-46.780, name:'Osasco', carga: 0.78 },
];

function renderEnergia() {
  const src = 'src-energia';
  const lyr = 'lyr-energia-zone';

  if (!_map.getSource(src)) {
    _map.addSource(src, { type:'geojson', data: buildEnergiaGeo() });
    _map.addLayer({
      id: lyr, type:'circle', source: src,
      paint: {
        'circle-radius': ['interpolate',['linear'],['zoom'],9,25,13,70],
        'circle-color': LAYER_COLORS.energia,
        'circle-opacity': ['interpolate',['linear'],['get','intensity'],0,0.06,1,0.25],
        'circle-blur': 0.7,
      },
    });
    MANAGED.energia = { sources:[src], layers:[lyr] };
  } else {
    updateEnergiaData();
  }
}

function buildEnergiaGeo() {
  const termica = STATE.energia.termica / 100;
  return { type:'FeatureCollection', features: ENERGIA_ZONES.map(z => ({
    type:'Feature',
    geometry:{ type:'Point', coordinates:[z.lng, z.lat] },
    properties:{ intensity: Math.min(1, z.carga * (1 + termica)), name: z.name },
  }))};
}

function updateEnergiaData() {
  const src = _map.getSource('src-energia');
  if (src) src.setData(buildEnergiaGeo());
}

// ──────────────────────────────────────────────────────
// SOLO — Polígonos de risco agrícola
// ──────────────────────────────────────────────────────
const SOLO_ZONES = [
  { lat:-23.689, lng:-47.120, name:'Cotia', factor:1.8 },
  { lat:-23.745, lng:-46.712, name:'Parelheiros', factor:2.1 },
  { lat:-23.720, lng:-46.680, name:'Grajaú', factor:1.5 },
];

function renderSolo() {
  const src = 'src-solo';
  const lyr = 'lyr-solo-zone';

  if (!_map.getSource(src)) {
    _map.addSource(src, { type:'geojson', data: buildSoloGeo() });
    _map.addLayer({
      id: lyr, type:'circle', source: src,
      paint: {
        'circle-radius': ['interpolate',['linear'],['zoom'],9,35,13,90],
        'circle-color': LAYER_COLORS.solo,
        'circle-opacity': ['interpolate',['linear'],['get','intensity'],0,0.06,1,0.28],
        'circle-blur': 0.8,
      },
    });
    MANAGED.solo = { sources:[src], layers:[lyr] };
  } else {
    updateSoloData();
  }
}

function buildSoloGeo() {
  const agro = STATE.solo.agrotox / 20;
  return { type:'FeatureCollection', features: SOLO_ZONES.map(z => ({
    type:'Feature',
    geometry:{ type:'Point', coordinates:[z.lng, z.lat] },
    properties:{ intensity: Math.min(1, agro * z.factor), name: z.name },
  }))};
}

function updateSoloData() {
  const src = _map.getSource('src-solo');
  if (src) src.setData(buildSoloGeo());
}

// ══════════════════════════════════════════════════════
// LINHA DO IMPACTO — Rastro vetorial
// ══════════════════════════════════════════════════════
const IMPACT_SRC = 'src-impact-line';
const IMPACT_LYR = 'lyr-impact-line';
const IMPACT_PTS = 'lyr-impact-points';

export function drawImpactLine(from, to, color = '#a855f7') {
  removeImpactLine();

  const geo = { type:'FeatureCollection', features: [
    // Linha principal
    { type:'Feature', geometry:{ type:'LineString', coordinates:[[from.lng,from.lat],[to.lng,to.lat]] },
      properties:{ type:'line' } },
    // Ponto origem
    { type:'Feature', geometry:{ type:'Point', coordinates:[from.lng,from.lat] },
      properties:{ type:'origin' } },
    // Ponto destino
    { type:'Feature', geometry:{ type:'Point', coordinates:[to.lng,to.lat] },
      properties:{ type:'dest' } },
  ]};

  _map.addSource(IMPACT_SRC, { type:'geojson', data: geo });

  // Glow exterior
  _map.addLayer({ id:'lyr-impact-glow', type:'line', source:IMPACT_SRC,
    filter:['==',['get','type'],'line'],
    paint:{ 'line-color':color, 'line-width':6, 'line-blur':4, 'line-opacity':0.4 },
    layout:{ 'line-cap':'round' },
  });

  // Linha nítida
  _map.addLayer({ id:IMPACT_LYR, type:'line', source:IMPACT_SRC,
    filter:['==',['get','type'],'line'],
    paint:{ 'line-color':color, 'line-width':2, 'line-opacity':0.95, 'line-dasharray':[4,2] },
    layout:{ 'line-cap':'round' },
  });

  // Pontos
  _map.addLayer({ id:IMPACT_PTS, type:'circle', source:IMPACT_SRC,
    filter:['==',['get','type'],'dest'],
    paint:{
      'circle-radius':8, 'circle-color':color, 'circle-opacity':0.9,
      'circle-stroke-color':'white', 'circle-stroke-width':2,
    },
  });
}

export function removeImpactLine() {
  ['lyr-impact-glow', IMPACT_LYR, IMPACT_PTS].forEach(id => {
    try { if (_map?.getLayer(id)) _map.removeLayer(id); } catch(e){}
  });
  try { if (_map?.getSource(IMPACT_SRC)) _map.removeSource(IMPACT_SRC); } catch(e){}
}

// ══════════════════════════════════════════════════════
// PULSO NO MAPA — Flash de zona ao atualizar
// ══════════════════════════════════════════════════════
export function pulseMapZone(layer, isGood) {
  const zones = ZONES[layer];
  if (!zones || !_map) return;

  const color  = isGood ? '#22c55e' : '#f43f5e';
  const pulseId = `pulse-${layer}-${Date.now()}`;

  // Adiciona círculos pulsantes temporários
  const geo = { type:'FeatureCollection', features: zones.map(z => ({
    type:'Feature', geometry:{ type:'Point', coordinates:[z.lng, z.lat] },
    properties:{},
  }))};

  try {
    _map.addSource(pulseId, { type:'geojson', data: geo });
    _map.addLayer({ id: pulseId, type:'circle', source: pulseId,
      paint:{
        'circle-radius':40, 'circle-color':color,
        'circle-opacity':0.3, 'circle-blur':0.8,
      },
    });

    // Remove após 900ms
    setTimeout(() => {
      try {
        if (_map.getLayer(pulseId))  _map.removeLayer(pulseId);
        if (_map.getSource(pulseId)) _map.removeSource(pulseId);
      } catch(e){}
    }, 900);
  } catch(e){}
}

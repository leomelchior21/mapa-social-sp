/**
 * visualEngine.js — Motor de Visualização v3
 *
 * Sistema de marcadores interativos:
 * - Hover  → popup flutuante aparece
 * - Mouse sai → popup some
 * - Click  → popup fica fixo (fecha com X)
 *
 * Identidade geométrica por camada:
 * - Ar       → círculos pulsantes por zona (raio proporcional ao IQA)
 * - Água     → ícones de ponto com cor de qualidade + aura de risco
 * - Tráfego  → linhas coloridas por corredor (verde→vermelho)
 * - Resíduos → marcadores por risco com pulse nos críticos
 * - Saúde    → halos radiais por hospital/UPA
 * - Energia  → pontos de carga
 * - Solo     → manchas verdes/amarelas
 */

import { STATE } from './simulation.js';
import {
  AR_PONTOS, AR_ZONAS, AGUA_PONTOS, RESIDUOS_PONTOS,
  TRAFEGO_CORREDORES, SAUDE_PONTOS, ENERGIA_PONTOS, SOLO_PONTOS,
  calcCongestionamento, congColor, riscoColor
} from './geodata.js';

export const LAYER_COLORS = {
  ar:'#f97316', agua:'#0ea5e9', energia:'#a855f7',
  residuos:'#22c55e', solo:'#84cc16', trafego:'#f43f5e', saude:'#ec4899',
};

let _map = null;
let _animFrame = null;
let _animT = 0;

// Estado de popups fixos
const _fixedPopups = {};  // id → maplibre Popup

// Marcadores DOM ativos por camada
const _markers = {};  // layer → []
const _mapLayers = {}; // layer → [layer ids]
const _mapSources = {}; // layer → [source ids]

export function initVisualEngine(map) {
  _map = map;
  requestAnimationFrame(function loop(ts) {
    _animT = ts;
    animatePulse(ts);
    _animFrame = requestAnimationFrame(loop);
  });
}

// ══════════════════════════════════════════════════════
// API PÚBLICA
// ══════════════════════════════════════════════════════
export function renderLayer(layer) {
  if (!_map || !_map.isStyleLoaded()) return;
  removeLayer(layer);
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
  // Remove marcadores DOM
  (_markers[layer] || []).forEach(m => m.remove());
  _markers[layer] = [];
  // Remove GL layers
  (_mapLayers[layer] || []).forEach(id => {
    try { if (_map.getLayer(id)) _map.removeLayer(id); } catch(e){}
  });
  // Remove GL sources
  (_mapSources[layer] || []).forEach(id => {
    try { if (_map.getSource(id)) _map.removeSource(id); } catch(e){}
  });
  _mapLayers[layer] = [];
  _mapSources[layer] = [];
}

export function updateLayerData(layer) {
  if (!_map || !(_mapSources[layer]?.length)) { renderLayer(layer); return; }
  switch (layer) {
    case 'ar':       updateAr();       break;
    case 'agua':     updateAgua();     break;
    case 'trafego':  updateTrafego();  break;
    case 'residuos': updateResiduos(); break;
    case 'saude':    updateSaude();    break;
    case 'energia':  updateEnergia();  break;
    case 'solo':     updateSolo();     break;
  }
}

// ══════════════════════════════════════════════════════
// AR — Pontos de estação + zonas circulares pulsantes
// ══════════════════════════════════════════════════════
function renderAr() {
  const iqa = STATE.ar.iqa;
  const pm25 = STATE.ar.pm25;

  // 1. Zonas de névoa (GL circles — pulsam via CSS animation em SVG)
  const zonaGeo = {
    type:'FeatureCollection',
    features: AR_ZONAS.map(z => ({
      type:'Feature',
      geometry:{ type:'Point', coordinates:[z.lng, z.lat] },
      properties:{ intensity: Math.min(1, (iqa/120) * z.intensidade_base), nome:z.nome, raio:z.raio_km },
    }))
  };
  _map.addSource('src-ar-zonas', { type:'geojson', data: zonaGeo });
  _map.addLayer({
    id:'lyr-ar-zona-halo', type:'circle', source:'src-ar-zonas',
    paint:{
      'circle-radius':['interpolate',['linear'],['zoom'], 9,['*',['get','raio'],8], 13,['*',['get','raio'],25]],
      'circle-color':'#f97316',
      'circle-opacity':['interpolate',['linear'],['get','intensity'],0,0.03,1,0.14],
      'circle-blur':0.7,
    }
  });
  _mapSources.ar = ['src-ar-zonas'];
  _mapLayers.ar = ['lyr-ar-zona-halo'];

  // 2. Marcadores de estação (DOM interativos)
  _markers.ar = AR_PONTOS.map(pt => {
    const pm = pt.pm25_base * (STATE.ar.pm25 / 18.4);
    const color = pm > 35 ? '#f43f5e' : pm > 20 ? '#f97316' : '#22c55e';
    const el = buildDotMarker(color, pt.tipo === 'industrial' ? 12 : 9, pt.tipo === 'industrial');

    const popup = buildPopup(`
      <div class="pp-tag" style="color:${LAYER_COLORS.ar}">💨 ${pt.tipo.toUpperCase()} · ${pt.fonte}</div>
      <div class="pp-name">${pt.nome}</div>
      <div class="pp-sub">${pt.bairro}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>PM₂.₅</span><strong style="color:${color}">${pm.toFixed(1)}</strong><em>µg/m³</em></div>
        <div class="pp-metric"><span>NO₂</span><strong style="color:#fb923c">${(pt.no2_base*(STATE.ar.no2/42.1)).toFixed(1)}</strong><em>µg/m³</em></div>
        <div class="pp-metric"><span>IQA</span><strong style="color:${color}">${STATE.ar.iqa}</strong><em></em></div>
        <div class="pp-metric"><span>OMS ref.</span><strong>≤15</strong><em>µg/m³</em></div>
      </div>
      <div class="pp-cause">Causa principal: ${pt.tipo==='industrial'?'Emissões industriais':pt.tipo==='viario'?'Emissões veiculares':'Monitoramento geral'}</div>
    `);

    attachHoverClick(el, popup, pt.id, [pt.lng, pt.lat]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(_map);
  });
}

function updateAr() {
  const geo = {
    type:'FeatureCollection',
    features: AR_ZONAS.map(z => ({
      type:'Feature',
      geometry:{ type:'Point', coordinates:[z.lng, z.lat] },
      properties:{ intensity: Math.min(1,(STATE.ar.iqa/120)*z.intensidade_base), nome:z.nome, raio:z.raio_km },
    }))
  };
  _map.getSource('src-ar-zonas')?.setData(geo);
  // Atualiza cores dos dots (remove e recria)
  (_markers.ar||[]).forEach(m=>m.remove());
  _markers.ar = AR_PONTOS.map(pt => {
    const pm = pt.pm25_base * (STATE.ar.pm25 / 18.4);
    const color = pm > 35 ? '#f43f5e' : pm > 20 ? '#f97316' : '#22c55e';
    const el = buildDotMarker(color, pt.tipo === 'industrial' ? 12 : 9, pt.tipo === 'industrial');
    const popup = buildPopup(`
      <div class="pp-tag" style="color:${LAYER_COLORS.ar}">💨 ${pt.tipo.toUpperCase()} · ${pt.fonte}</div>
      <div class="pp-name">${pt.nome}</div>
      <div class="pp-sub">${pt.bairro}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>PM₂.₅</span><strong style="color:${color}">${pm.toFixed(1)}</strong><em>µg/m³</em></div>
        <div class="pp-metric"><span>NO₂</span><strong style="color:#fb923c">${(pt.no2_base*(STATE.ar.no2/42.1)).toFixed(1)}</strong><em>µg/m³</em></div>
      </div>`);
    attachHoverClick(el, popup, pt.id, [pt.lng,pt.lat]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(_map);
  });
}

// ══════════════════════════════════════════════════════
// ÁGUA — Pontos hídricos com cor de qualidade
// ══════════════════════════════════════════════════════
function renderAgua() {
  const turb = STATE.agua.turbidez;
  _markers.agua = AGUA_PONTOS.map(pt => {
    const t = pt.turbidez_base * (turb / 2.8);
    const color = pt.balneab === 'PRÓPRIA' ? '#22c55e' : pt.balneab === 'REGULAR' ? '#eab308' : '#f43f5e';
    const el = buildDotMarker(color, pt.balneab === 'IMPRÓPRIA' ? 11 : 8, pt.balneab === 'IMPRÓPRIA');

    const popup = buildPopup(`
      <div class="pp-tag" style="color:${LAYER_COLORS.agua}">💧 ${pt.rio.toUpperCase()} · ${pt.fonte}</div>
      <div class="pp-name">${pt.nome}</div>
      <div class="pp-sub">${pt.bairro}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>Turbidez</span><strong style="color:${color}">${t.toFixed(1)}</strong><em>NTU</em></div>
        <div class="pp-metric"><span>pH</span><strong style="color:${t>15?'#f43f5e':'#22c55e'}">${pt.ph_base.toFixed(1)}</strong><em></em></div>
        <div class="pp-metric"><span>IQA</span><strong style="color:${color}">${Math.round(pt.iqua*(2.8/Math.max(turb,0.5)))}</strong><em>/100</em></div>
        <div class="pp-metric"><span>Balneab.</span><strong style="color:${color}">${pt.balneab}</strong><em></em></div>
      </div>
      <div class="pp-cause">${pt.balneab==='IMPRÓPRIA'?'⚠ Risco à saúde — contato com água proibido':'✓ Dentro dos parâmetros CONAMA'}</div>
    `);
    attachHoverClick(el, popup, pt.id, [pt.lng,pt.lat]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(_map);
  });
  _markers.agua = _markers.agua; // já atribuído acima
  _mapSources.agua = [];
  _mapLayers.agua = [];
}

function updateAgua() {
  (_markers.agua||[]).forEach(m=>m.remove());
  renderAgua();
}

// ══════════════════════════════════════════════════════
// TRÁFEGO — Linhas por corredor, coloridas por congestionamento
// ══════════════════════════════════════════════════════
function renderTrafego() {
  const hora = new Date().getHours();
  const chuva = STATE.clima?.chuva > 0;

  // Constrói GeoJSON de linhas
  const features = TRAFEGO_CORREDORES.map(c => {
    const cong = calcCongestionamento(c, hora, chuva);
    return {
      type:'Feature',
      geometry:{ type:'LineString', coordinates: c.coords },
      properties:{
        id: c.id, nome: c.nome, bairros: c.bairros,
        cong, color: congColor(cong), tipo: c.tipo,
        width: cong > 70 ? 4 : cong > 50 ? 3 : 2,
      }
    };
  });
  const geo = { type:'FeatureCollection', features };

  _map.addSource('src-trafego-linhas', { type:'geojson', data: geo });

  // Glow exterior
  _map.addLayer({
    id:'lyr-tr-glow', type:'line', source:'src-trafego-linhas',
    layout:{ 'line-cap':'round', 'line-join':'round' },
    paint:{
      'line-color':['get','color'],
      'line-width':['*',['get','width'],3],
      'line-blur':4,
      'line-opacity':0.2,
    }
  });

  // Linha principal
  _map.addLayer({
    id:'lyr-tr-main', type:'line', source:'src-trafego-linhas',
    layout:{ 'line-cap':'round', 'line-join':'round' },
    paint:{
      'line-color':['get','color'],
      'line-width':['get','width'],
      'line-opacity':0.85,
    }
  });

  _mapSources.trafego = ['src-trafego-linhas'];
  _mapLayers.trafego  = ['lyr-tr-glow','lyr-tr-main'];

  // Marcadores interativos no centro de cada corredor
  _markers.trafego = TRAFEGO_CORREDORES.map(c => {
    const cong = calcCongestionamento(c, hora, chuva);
    const color = congColor(cong);
    // Ponto médio do corredor
    const mid = c.coords[Math.floor(c.coords.length/2)];
    const el = buildLineMarker(cong, color);

    const popup = buildPopup(`
      <div class="pp-tag" style="color:${color}">🚦 ${c.tipo.toUpperCase()} · CET-SP</div>
      <div class="pp-name">${c.nome}</div>
      <div class="pp-sub">${c.bairros}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>Congestion.</span><strong style="color:${color}">${cong}%</strong><em></em></div>
        <div class="pp-metric"><span>Pico manhã</span><strong>${c.peak_am}%</strong><em></em></div>
        <div class="pp-metric"><span>Pico tarde</span><strong>${c.peak_pm}%</strong><em></em></div>
        <div class="pp-metric"><span>Off-peak</span><strong style="color:#22c55e">${c.offpeak}%</strong><em></em></div>
      </div>
      <div class="pp-cause">${cong>80?'⚠ Congestionamento crítico — evite a região':'Fluxo '+congLabel(cong)}</div>
    `);
    attachHoverClick(el, popup, c.id, [mid[0], mid[1]]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([mid[0],mid[1]]).addTo(_map);
  });
}

function updateTrafego() {
  const hora = new Date().getHours();
  const chuva = STATE.clima?.chuva > 0;
  const features = TRAFEGO_CORREDORES.map(c => {
    const cong = calcCongestionamento(c, hora, chuva);
    return {
      type:'Feature',
      geometry:{ type:'LineString', coordinates: c.coords },
      properties:{ id:c.id, nome:c.nome, bairros:c.bairros, cong, color:congColor(cong), tipo:c.tipo, width:cong>70?4:cong>50?3:2 }
    };
  });
  _map.getSource('src-trafego-linhas')?.setData({ type:'FeatureCollection', features });
  // Atualiza labels dos marcadores
  (_markers.trafego||[]).forEach(m=>m.remove());
  _markers.trafego = TRAFEGO_CORREDORES.map(c => {
    const cong = calcCongestionamento(c, hora, chuva);
    const color = congColor(cong);
    const mid = c.coords[Math.floor(c.coords.length/2)];
    const el = buildLineMarker(cong, color);
    const popup = buildPopup(`
      <div class="pp-tag" style="color:${color}">🚦 ${c.tipo.toUpperCase()}</div>
      <div class="pp-name">${c.nome}</div>
      <div class="pp-sub">${c.bairros}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>Agora</span><strong style="color:${color}">${cong}%</strong><em></em></div>
        <div class="pp-metric"><span>Pico PM</span><strong>${c.peak_pm}%</strong><em></em></div>
      </div>`);
    attachHoverClick(el, popup, c.id, [mid[0],mid[1]]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([mid[0],mid[1]]).addTo(_map);
  });
}

// ══════════════════════════════════════════════════════
// RESÍDUOS — Marcadores por risco, críticos pulsam
// ══════════════════════════════════════════════════════
function renderResiduos() {
  _markers.residuos = RESIDUOS_PONTOS.map(pt => {
    const vol = pt.volume_ton * (1 + (Math.random()-0.5)*0.15);
    const color = riscoColor(pt.risco);
    const isCrit = pt.risco === 'CRÍTICO';
    const isAterro = pt.risco === 'MONITORADO';

    const el = buildGlyphMarker(color, isCrit, isAterro);

    const popup = buildPopup(`
      <div class="pp-tag" style="color:${color}">♻ ${pt.tipo.toUpperCase()} · ${pt.fonte}</div>
      <div class="pp-name">${pt.nome}</div>
      <div class="pp-sub">${pt.bairro}</div>
      <div class="pp-grid">
        ${isAterro ? `
          <div class="pp-metric"><span>Cap. usada</span><strong style="color:${pt.cap_pct>85?'#f43f5e':'#22c55e'}">${pt.cap_pct}%</strong><em></em></div>
          <div class="pp-metric"><span>Status</span><strong style="color:#0ea5e9">ATIVO</strong><em></em></div>
        ` : `
          <div class="pp-metric"><span>Volume</span><strong style="color:${color}">${vol.toFixed(1)}</strong><em>ton</em></div>
          <div class="pp-metric"><span>Risco</span><strong style="color:${color}">${pt.risco}</strong><em></em></div>
        `}
      </div>
      ${!isAterro ? `<div class="pp-cause">${pt.risco==='CRÍTICO'?'⚠ Risco à saúde e contaminação do solo/água':pt.risco==='ALTO'?'⚠ Vetor de doenças e assoreamento':'Monitoramento regular'}</div>` : ''}
    `);
    attachHoverClick(el, popup, pt.id, [pt.lng,pt.lat]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(_map);
  });
  _mapSources.residuos = [];
  _mapLayers.residuos = [];
}

function updateResiduos() {
  (_markers.residuos||[]).forEach(m=>m.remove());
  renderResiduos();
}

// ══════════════════════════════════════════════════════
// SAÚDE — Halos radiais por hospital/UPA
// ══════════════════════════════════════════════════════
function renderSaude() {
  const resp = STATE.saude.respirat;

  const geo = {
    type:'FeatureCollection',
    features: SAUDE_PONTOS.map(pt => ({
      type:'Feature',
      geometry:{ type:'Point', coordinates:[pt.lng, pt.lat] },
      properties:{ intensity: Math.min(1, (pt.resp_base*(resp/184)) / 280) }
    }))
  };
  _map.addSource('src-saude-halos', { type:'geojson', data: geo });
  _map.addLayer({
    id:'lyr-saude-halo', type:'circle', source:'src-saude-halos',
    paint:{
      'circle-radius':['interpolate',['linear'],['zoom'], 9,20, 13,60],
      'circle-color':'#ec4899',
      'circle-opacity':['interpolate',['linear'],['get','intensity'],0,0.04,1,0.18],
      'circle-blur':0.85,
    }
  });
  _mapSources.saude = ['src-saude-halos'];
  _mapLayers.saude  = ['lyr-saude-halo'];

  _markers.saude = SAUDE_PONTOS.map(pt => {
    const r = Math.round(pt.resp_base * (resp/184));
    const h = Math.round(pt.hidr_base * (STATE.saude.hidricas/23));
    const color = r > 240 ? '#f43f5e' : r > 200 ? '#f97316' : '#ec4899';
    const el = buildHealthMarker(pt.tipo === 'Hospital', color);

    const popup = buildPopup(`
      <div class="pp-tag" style="color:${LAYER_COLORS.saude}">🏥 ${pt.tipo.toUpperCase()} · ${pt.fonte}</div>
      <div class="pp-name">${pt.nome}</div>
      <div class="pp-sub">${pt.bairro}${pt.leitos>0?` · ${pt.leitos} leitos`:''}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>Resp.</span><strong style="color:${color}">${r}</strong><em>/100k</em></div>
        <div class="pp-metric"><span>Hídricas</span><strong style="color:#0ea5e9">${h}</strong><em>/100k</em></div>
        <div class="pp-metric"><span>Intox.</span><strong style="color:#84cc16">${pt.intox_base.toFixed(1)}</strong><em>/100k</em></div>
        <div class="pp-metric"><span>Região</span><strong>${regionLabel(pt.bairro)}</strong><em></em></div>
      </div>
      <div class="pp-cause">${r>230?'⚠ Pressão alta — correlacionar com IQA e congestionamento':'Demanda dentro da capacidade'}</div>
    `);
    attachHoverClick(el, popup, pt.id, [pt.lng,pt.lat]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(_map);
  });
}

function updateSaude() {
  const geo = {
    type:'FeatureCollection',
    features: SAUDE_PONTOS.map(pt => ({
      type:'Feature',
      geometry:{ type:'Point', coordinates:[pt.lng, pt.lat] },
      properties:{ intensity: Math.min(1,(pt.resp_base*(STATE.saude.respirat/184))/280) }
    }))
  };
  _map.getSource('src-saude-halos')?.setData(geo);
}

// ══════════════════════════════════════════════════════
// ENERGIA
// ══════════════════════════════════════════════════════
function renderEnergia() {
  _markers.energia = ENERGIA_PONTOS.map(pt => {
    const carga = pt.carga_base * (1+(Math.random()-.5)*.1);
    const color = LAYER_COLORS.energia;
    const el = buildDotMarker(color, 9, false);
    const popup = buildPopup(`
      <div class="pp-tag" style="color:${color}">⚡ ${pt.tipo.toUpperCase()} · ${pt.fonte}</div>
      <div class="pp-name">${pt.nome}</div>
      <div class="pp-sub">${pt.bairro}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>Carga</span><strong style="color:${color}">${carga.toFixed(0)}%</strong><em></em></div>
        <div class="pp-metric"><span>Térmica</span><strong style="color:${STATE.energia?.termica>22?'#f43f5e':'#22c55e'}">${STATE.energia?.termica||18}%</strong><em></em></div>
      </div>`);
    attachHoverClick(el, popup, pt.id, [pt.lng,pt.lat]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(_map);
  });
  _mapSources.energia = [];
  _mapLayers.energia = [];
}
function updateEnergia() { (_markers.energia||[]).forEach(m=>m.remove()); renderEnergia(); }

// ══════════════════════════════════════════════════════
// SOLO
// ══════════════════════════════════════════════════════
function renderSolo() {
  const geo = {
    type:'FeatureCollection',
    features: SOLO_PONTOS.map(pt => ({
      type:'Feature', geometry:{ type:'Point', coordinates:[pt.lng,pt.lat] },
      properties:{ intensity: Math.min(1, pt.agrotox_base/30) }
    }))
  };
  _map.addSource('src-solo', { type:'geojson', data: geo });
  _map.addLayer({
    id:'lyr-solo-zone', type:'circle', source:'src-solo',
    paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],8,25,12,70],
      'circle-color':'#84cc16',
      'circle-opacity':['interpolate',['linear'],['get','intensity'],0,0.05,1,0.22],
      'circle-blur':0.8,
    }
  });
  _mapSources.solo = ['src-solo'];
  _mapLayers.solo  = ['lyr-solo-zone'];

  _markers.solo = SOLO_PONTOS.map(pt => {
    const color = LAYER_COLORS.solo;
    const el = buildDotMarker(color, 9, false);
    const popup = buildPopup(`
      <div class="pp-tag" style="color:${color}">🌱 SOLO · ${pt.fonte}</div>
      <div class="pp-name">${pt.nome}</div>
      <div class="pp-sub">${pt.bairro}</div>
      <div class="pp-grid">
        <div class="pp-metric"><span>Agrotóx.</span><strong style="color:${pt.agrotox_base>18?'#f43f5e':'#22c55e'}">${pt.agrotox_base}</strong><em>kg/ha</em></div>
        <div class="pp-metric"><span>Desmat.</span><strong>${pt.desmat_base}</strong><em>ha/mês</em></div>
      </div>`);
    attachHoverClick(el, popup, pt.id, [pt.lng,pt.lat]);
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(_map);
  });
}
function updateSolo() {
  const geo = { type:'FeatureCollection', features: SOLO_PONTOS.map(pt => ({ type:'Feature', geometry:{ type:'Point', coordinates:[pt.lng,pt.lat] }, properties:{ intensity: Math.min(1,pt.agrotox_base/30) } })) };
  _map.getSource('src-solo')?.setData(geo);
}

// ══════════════════════════════════════════════════════
// CONSTRUTORES DE MARCADORES DOM
// ══════════════════════════════════════════════════════

function buildDotMarker(color, size=9, pulse=false) {
  const el = document.createElement('div');
  el.style.cssText = `
    width:${size}px; height:${size}px; border-radius:50%;
    background:${color}; border:2px solid white;
    cursor:pointer;
    box-shadow:0 0 ${pulse?8:4}px ${color}${pulse?'cc':'66'};
    transition:transform .15s, box-shadow .15s;
    ${pulse ? `animation:dot-pulse 2s ease infinite;` : ''}
    position:relative; z-index:2;
  `;
  el.addEventListener('mouseenter', ()=>{ el.style.transform='scale(1.7)'; el.style.zIndex='10'; });
  el.addEventListener('mouseleave', ()=>{ el.style.transform=''; el.style.zIndex='2'; });
  return el;
}

function buildGlyphMarker(color, pulse=false, isAterro=false) {
  const el = document.createElement('div');
  el.style.cssText = `
    width:${isAterro?14:11}px; height:${isAterro?14:11}px;
    border:2px solid ${color}; border-radius:${isAterro?'3px':'50%'};
    background:${color}22; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:7px; color:${color}; font-weight:700;
    box-shadow:0 0 ${pulse?10:5}px ${color}${pulse?'cc':'44'};
    ${pulse?`animation:dot-pulse 1.5s ease infinite;`:''}
    transition:transform .15s; position:relative; z-index:2;
  `;
  el.textContent = isAterro ? '◉' : '✕';
  el.addEventListener('mouseenter', ()=>{ el.style.transform='scale(1.8)'; el.style.zIndex='10'; });
  el.addEventListener('mouseleave', ()=>{ el.style.transform=''; el.style.zIndex='2'; });
  return el;
}

function buildLineMarker(cong, color) {
  const el = document.createElement('div');
  el.style.cssText = `
    background:${color}; color:white; font-family:'DM Mono',monospace;
    font-size:9px; font-weight:500; padding:2px 6px; border-radius:10px;
    cursor:pointer; white-space:nowrap;
    box-shadow:0 2px 8px ${color}66;
    border:1px solid ${color}cc;
    transition:transform .15s; position:relative; z-index:2;
  `;
  el.textContent = `${cong}%`;
  el.addEventListener('mouseenter', ()=>{ el.style.transform='scale(1.15)'; el.style.zIndex='10'; });
  el.addEventListener('mouseleave', ()=>{ el.style.transform=''; el.style.zIndex='2'; });
  return el;
}

function buildHealthMarker(isHospital, color) {
  const el = document.createElement('div');
  el.style.cssText = `
    width:${isHospital?14:11}px; height:${isHospital?14:11}px;
    background:${color}; border-radius:${isHospital?'3px':'50%'};
    border:2px solid white; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:8px; color:white; font-weight:700;
    box-shadow:0 0 8px ${color}88;
    transition:transform .15s; position:relative; z-index:2;
  `;
  el.textContent = isHospital ? '+' : '•';
  el.addEventListener('mouseenter', ()=>{ el.style.transform='scale(1.7)'; el.style.zIndex='10'; });
  el.addEventListener('mouseleave', ()=>{ el.style.transform=''; el.style.zIndex='2'; });
  return el;
}

// ══════════════════════════════════════════════════════
// POPUP — hover/click com fix
// ══════════════════════════════════════════════════════

function buildPopup(html) {
  return new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    maxWidth: '260px',
    offset: 14,
    className: 'ul-popup',
  }).setHTML(`<div class="pp-inner">${html}</div>`);
}

function attachHoverClick(el, popup, id, lngLat) {
  let hovered = false;

  el.addEventListener('mouseenter', () => {
    hovered = true;
    if (!_fixedPopups[id]) {
      popup.setLngLat(lngLat).addTo(_map);
    }
  });

  el.addEventListener('mouseleave', () => {
    hovered = false;
    if (!_fixedPopups[id]) {
      setTimeout(() => { if (!hovered) popup.remove(); }, 80);
    }
  });

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_fixedPopups[id]) {
      // Já está fixo — remove
      _fixedPopups[id].remove();
      delete _fixedPopups[id];
    } else {
      // Fixa o popup com botão X
      popup.remove();
      const fixPopup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '260px',
        offset: 14,
        className: 'ul-popup ul-popup-fixed',
      }).setHTML(`<div class="pp-inner">${popup._content?.innerHTML||''}</div>`)
        .setLngLat(lngLat)
        .addTo(_map);

      fixPopup.on('close', () => { delete _fixedPopups[id]; });
      _fixedPopups[id] = fixPopup;

      // Dispara evento de impacto
      window.dispatchEvent(new CustomEvent('impact:trigger', {
        detail:{ lat:lngLat[1], lng:lngLat[0], id }
      }));
    }
  });
}

// ══════════════════════════════════════════════════════
// LINHA DO IMPACTO
// ══════════════════════════════════════════════════════
const IMPACT_SRC = 'src-impact';

export function drawImpactLine(from, to, color='#a855f7') {
  removeImpactLine();
  try {
    _map.addSource(IMPACT_SRC, { type:'geojson', data:{ type:'FeatureCollection', features:[
      { type:'Feature', geometry:{ type:'LineString', coordinates:[[from.lng,from.lat],[to.lng,to.lat]] }, properties:{ type:'line' } },
      { type:'Feature', geometry:{ type:'Point', coordinates:[from.lng,from.lat] }, properties:{ type:'origin' } },
      { type:'Feature', geometry:{ type:'Point', coordinates:[to.lng,to.lat] },   properties:{ type:'dest' } },
    ]}});
    _map.addLayer({ id:'lyr-impact-glow', type:'line', source:IMPACT_SRC, filter:['==',['get','type'],'line'],
      paint:{ 'line-color':color, 'line-width':8, 'line-blur':5, 'line-opacity':0.3 }, layout:{'line-cap':'round'} });
    _map.addLayer({ id:'lyr-impact-line', type:'line', source:IMPACT_SRC, filter:['==',['get','type'],'line'],
      paint:{ 'line-color':color, 'line-width':2, 'line-opacity':0.9, 'line-dasharray':[4,3] }, layout:{'line-cap':'round'} });
    _map.addLayer({ id:'lyr-impact-pts', type:'circle', source:IMPACT_SRC, filter:['==',['get','type'],'dest'],
      paint:{ 'circle-radius':8, 'circle-color':color, 'circle-stroke-color':'white', 'circle-stroke-width':2 } });
  } catch(e){ console.warn('Impact line error:', e); }
}

export function removeImpactLine() {
  ['lyr-impact-glow','lyr-impact-line','lyr-impact-pts'].forEach(id=>{
    try{ if(_map?.getLayer(id)) _map.removeLayer(id); }catch(e){}
  });
  try{ if(_map?.getSource(IMPACT_SRC)) _map.removeSource(IMPACT_SRC); }catch(e){}
}

// ══════════════════════════════════════════════════════
// PULSO NO MAPA
// ══════════════════════════════════════════════════════
export function pulseMapZone(layer, isGood) {
  if (!_map) return;
  const color = isGood ? '#22c55e' : '#f43f5e';
  const srcId = `pulse-${layer}-${Date.now()}`;
  // Pega coordenadas representativas da camada
  const coords = getPulseCoords(layer);
  if (!coords.length) return;
  try {
    _map.addSource(srcId, { type:'geojson', data:{ type:'FeatureCollection', features:
      coords.map(([lng,lat])=>({ type:'Feature', geometry:{ type:'Point', coordinates:[lng,lat] }, properties:{} }))
    }});
    _map.addLayer({ id:srcId, type:'circle', source:srcId,
      paint:{ 'circle-radius':50, 'circle-color':color, 'circle-opacity':0.2, 'circle-blur':0.9 }
    });
    setTimeout(()=>{
      try{ if(_map.getLayer(srcId)) _map.removeLayer(srcId); if(_map.getSource(srcId)) _map.removeSource(srcId); }catch(e){}
    }, 800);
  } catch(e){}
}

function getPulseCoords(layer) {
  const map = {
    ar:      AR_PONTOS.slice(0,3).map(p=>[p.lng,p.lat]),
    agua:    AGUA_PONTOS.slice(0,3).map(p=>[p.lng,p.lat]),
    trafego: TRAFEGO_CORREDORES.slice(0,3).map(c=>c.coords[0]),
    residuos:RESIDUOS_PONTOS.slice(0,3).map(p=>[p.lng,p.lat]),
    saude:   SAUDE_PONTOS.slice(0,3).map(p=>[p.lng,p.lat]),
    energia: ENERGIA_PONTOS.map(p=>[p.lng,p.lat]),
    solo:    SOLO_PONTOS.map(p=>[p.lng,p.lat]),
  };
  return map[layer] || [];
}

// Animação CSS de pulso injetada no <head>
const style = document.createElement('style');
style.textContent = `
  @keyframes dot-pulse {
    0%,100% { box-shadow: 0 0 4px currentColor, 0 0 0 0 currentColor44; }
    50%      { box-shadow: 0 0 12px currentColor, 0 0 0 6px transparent; }
  }
  /* MapLibre popup overrides */
  .ul-popup .maplibregl-popup-content {
    background: #161b27 !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    padding: 0 !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
    font-family: 'Syne', sans-serif !important;
    min-width: 200px;
  }
  .ul-popup-fixed .maplibregl-popup-content {
    border: 1px solid rgba(255,255,255,0.2) !important;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7) !important;
  }
  .ul-popup .maplibregl-popup-close-button {
    color: #475569 !important; font-size: 18px !important;
    padding: 4px 10px !important; border-radius: 0 10px 0 0 !important;
    transition: color .2s !important;
  }
  .ul-popup .maplibregl-popup-close-button:hover { color: #f1f5f9 !important; }
  .ul-popup .maplibregl-popup-tip { display:none !important; }

  .pp-inner { padding: 12px 14px; }
  .pp-tag   { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:1.5px; margin-bottom:5px; }
  .pp-name  { font-size:13px; font-weight:700; color:#f1f5f9; margin-bottom:2px; line-height:1.3; }
  .pp-sub   { font-family:'DM Mono',monospace; font-size:9px; color:#475569; margin-bottom:10px; }
  .pp-grid  { display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:8px; }
  .pp-metric{ background:rgba(0,0,0,0.3); padding:5px 7px; border-radius:5px; }
  .pp-metric span  { display:block; font-family:'DM Mono',monospace; font-size:8px; color:#475569; }
  .pp-metric strong{ display:block; font-family:'DM Mono',monospace; font-size:13px; font-weight:500; color:#f1f5f9; }
  .pp-metric em    { font-style:normal; font-family:'DM Mono',monospace; font-size:8px; color:#334155; }
  .pp-cause { font-family:'DM Mono',monospace; font-size:9px; color:#94a3b8; border-top:1px solid rgba(255,255,255,0.07); padding-top:7px; line-height:1.5; }
`;
document.head.appendChild(style);

// ── Animação de pulso para dots críticos ──
function animatePulse(ts) {
  // Animado via CSS animation — sem JS necessário aqui
}

// ── Helpers ────────────────────────────────────────────
function congLabel(pct) {
  if (pct < 40) return 'fluindo';
  if (pct < 60) return 'moderado';
  if (pct < 75) return 'lento';
  return 'parado';
}

function regionLabel(bairro) {
  const zl = ['Itaquera','Guaianases','Penha','Tatuapé','São Mateus','Aricanduva','Ermelino Matarazzo','Lajeado','Sapopemba'];
  const zs = ['Campo Limpo','Capão Redondo','Grajaú','Parelheiros','Santo Amaro','Ipiranga','Sacomã'];
  const zn = ['Santana','Brasilândia','Pirituba','Tremembé','Jaraguá','Tucuruvi'];
  if (zl.some(z=>bairro.includes(z))) return 'Z. Leste';
  if (zs.some(z=>bairro.includes(z))) return 'Z. Sul';
  if (zn.some(z=>bairro.includes(z))) return 'Z. Norte';
  return 'Centro/Oeste';
}

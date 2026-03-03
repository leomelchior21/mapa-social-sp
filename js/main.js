/**
 * main.js — Motor principal -X SOCIAL
 * Sistema de simulação narrativa de 10 crises urbanas em SP
 */

import { CRISES, CAMADAS_CONFIG } from './crises.js';

// ══════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ══════════════════════════════════════════════════════════
const APP = {
  crise:        null,   // crise atual
  criseIdx:     0,      // índice 0–9
  fase:         0,      // 0–4 (0=início, 4=colapso)
  timerSeg:     600,    // 600s = 10 min
  timerInterval: null,
  faseInterval:  null,
  map:          null,
  chart:        null,
  markers:      [],     // maplibre Marker[]
  popups:       {},     // id → Popup (fixados)
  layerActive:  null,   // camada selecionada no painel esq.
  glLayers:     [],     // ids de layers GL adicionados
  glSources:    [],     // ids de sources GL adicionados
};

// ══════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  buildLayersPanel();
  initMap();
  document.getElementById('btn-next').addEventListener('click', nextCrise);
  document.getElementById('btn-restart').addEventListener('click', () => loadCrise(APP.criseIdx));
});

// ══════════════════════════════════════════════════════════
// MAPA
// ══════════════════════════════════════════════════════════
function initMap() {
  const STYLES = [
    'https://tiles.openfreemap.org/styles/positron',
    'https://demotiles.maplibre.org/style.json',
  ];

  function tryStyle(idx) {
    if (idx >= STYLES.length) {
      document.getElementById('map-loader').innerHTML =
        '<span style="color:#cc2200;font-size:12px">Erro ao carregar mapa. Verifique conexão.</span>';
      return;
    }
    APP.map = new maplibregl.Map({
      container: 'map',
      style: STYLES[idx],
      center: [-46.636, -23.550],
      zoom: 11,
      pitch: 0,
      attributionControl: false,
    });
    APP.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    APP.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    APP.map.on('error', () => { APP.map.remove(); tryStyle(idx + 1); });
    APP.map.on('load', () => {
      document.getElementById('map-loader').style.display = 'none';
      loadCrise(0);
    });
  }
  tryStyle(0);
}

// ══════════════════════════════════════════════════════════
// CARREGA CRISE
// ══════════════════════════════════════════════════════════
function loadCrise(idx) {
  stopTimers();
  clearMap();
  APP.criseIdx = idx;
  APP.crise    = CRISES[idx];
  APP.fase     = 0;
  APP.timerSeg = 600;
  APP.layerActive = APP.crise.camadasAtivas[0];

  // Foca o mapa
  APP.map.flyTo({
    center: APP.crise.centro,
    zoom:   APP.crise.zoom,
    duration: 1200,
    pitch: 0,
  });

  // UI
  updateBanner();
  updateCrisisPanel();
  buildLayersPanel();
  buildLegend();
  updatePhase();

  // Marcadores
  placeMarkers();

  // Painel direito — seleciona 1ª camada
  selectLayer(APP.crise.camadasAtivas[0]);

  // Inicia timers
  startTimers();
}

// ══════════════════════════════════════════════════════════
// BANNER
// ══════════════════════════════════════════════════════════
function updateBanner() {
  const c = APP.crise;
  document.getElementById('bn-text').textContent = c.banner;
  document.getElementById('crisis-num').textContent =
    `${String(APP.criseIdx + 1).padStart(2,'0')}/10`;

  // Fase → cor do banner
  const banner = document.getElementById('banner');
  banner.className = APP.fase >= 4 ? 'phase-4' : '';
}

// ══════════════════════════════════════════════════════════
// PAINEL ESQUERDO — Crisis block
// ══════════════════════════════════════════════════════════
function updateCrisisPanel() {
  const c = APP.crise;
  document.getElementById('cb-title').textContent = c.titulo;
  document.getElementById('cb-desc').textContent  = c.descricao;
  document.getElementById('cb-pista').textContent = c.pista;
}

// ══════════════════════════════════════════════════════════
// CAMADAS — Painel esquerdo
// ══════════════════════════════════════════════════════════
function buildLayersPanel() {
  const c     = APP.crise;
  const wrap  = document.getElementById('layers');
  if (!wrap || !c) return;
  wrap.innerHTML = '';

  (c?.camadasAtivas || Object.keys(CAMADAS_CONFIG)).forEach(key => {
    const cfg = CAMADAS_CONFIG[key];
    if (!cfg) return;

    // Calcula valor da 1ª série do 1º ponto desta camada, fase atual
    const ptsCamada = (c?.pontos || []).filter(p => p.camada === key);
    const val = ptsCamada.length && ptsCamada[0].dados.length
      ? ptsCamada[0].dados[0].vals[APP.fase] : '—';
    const unit = ptsCamada.length && ptsCamada[0].dados.length
      ? ptsCamada[0].dados[0].unit : '';

    const row = document.createElement('div');
    row.className = 'layer-row' + (APP.layerActive === key ? ' active' : '');
    row.style.setProperty('--lc', cfg.cor);
    row.dataset.key = key;
    row.innerHTML = `
      <div class="lr-icon"><div class="geo-${cfg.geo}" style="--lc:${cfg.cor}"></div></div>
      <div class="lr-info">
        <div class="lr-name">${cfg.nome}</div>
        <div class="lr-val" id="lv-${key}">${val}</div>
        <div class="lr-unit">${unit}</div>
      </div>
      <div class="lr-badge" id="lb-${key}" style="background:${cfg.cor}">${ptsCamada.length} pontos</div>
    `;
    row.addEventListener('click', () => selectLayer(key));
    wrap.appendChild(row);
  });
}

// ══════════════════════════════════════════════════════════
// LEGENDA DO MAPA
// ══════════════════════════════════════════════════════════
function buildLegend() {
  const c = APP.crise;
  const wrap = document.getElementById('legend');
  wrap.innerHTML = '';
  (c?.camadasAtivas || []).forEach(key => {
    const cfg = CAMADAS_CONFIG[key];
    if (!cfg) return;
    const item = document.createElement('div');
    item.className = 'leg-item';
    item.innerHTML = `<div class="leg-swatch" style="background:${cfg.cor}"></div><span>${cfg.nome}</span>`;
    wrap.appendChild(item);
  });
}

// ══════════════════════════════════════════════════════════
// FASE / DEGRADAÇÃO
// ══════════════════════════════════════════════════════════
function updatePhase() {
  const fase = APP.fase;
  // Barra de progresso
  const pct = (fase / 4) * 100;
  document.getElementById('phase-bar').style.width = pct + '%';
  document.getElementById('phase-bar').style.background =
    fase === 4 ? '#ff0000' : fase >= 3 ? '#cc2200' : fase >= 2 ? '#e05000' : '#cc2200';

  // Steps
  document.querySelectorAll('.ph-step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i < fase) el.classList.add('done');
    if (i === fase) el.classList.add('active');
    // Texto da fase
    if (i === fase && APP.crise?.fases?.[fase]) {
      el.querySelector('span') && (el.querySelector('span').textContent = APP.crise.fases[fase]);
    }
  });

  // Atualiza steps com textos da crise
  if (APP.crise?.fases) {
    document.querySelectorAll('.ph-step').forEach((el, i) => {
      const span = el.querySelector('span');
      if (span && APP.crise.fases[i]) span.textContent = APP.crise.fases[i];
    });
  }

  // Banner fase crítica
  const banner = document.getElementById('banner');
  banner.className = fase >= 4 ? 'phase-4' : '';

  // Flash visual no mapa
  if (fase > 0) flashMap();

  // Rebuild layers + markers com novos valores
  buildLayersPanel();
  updateMarkersPhase();

  // Atualiza painel direito se camada selecionada
  if (APP.layerActive) selectLayer(APP.layerActive);
}

function flashMap() {
  const existing = document.querySelector('.phase-flash');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'phase-flash';
  document.getElementById('map-wrap').appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ══════════════════════════════════════════════════════════
// MARCADORES NO MAPA
// ══════════════════════════════════════════════════════════
function placeMarkers() {
  const c = APP.crise;
  if (!c) return;

  c.pontos.forEach(pt => {
    const cfg = CAMADAS_CONFIG[pt.camada];
    if (!cfg) return;

    // Elemento DOM do marcador
    const el = buildMarkerEl(cfg, pt);

    // Popup (hover + click-fix)
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '260px',
      offset: 16,
    }).setHTML(buildPopupHTML(pt, cfg));

    // Hover
    el.addEventListener('mouseenter', () => {
      if (!APP.popups[pt.id]) popup.setLngLat([pt.lng, pt.lat]).addTo(APP.map);
    });
    el.addEventListener('mouseleave', () => {
      if (!APP.popups[pt.id]) setTimeout(() => popup.remove(), 120);
    });
    // Click = fix
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (APP.popups[pt.id]) {
        APP.popups[pt.id].remove();
        delete APP.popups[pt.id];
      } else {
        popup.remove();
        const fixPop = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: '260px',
          offset: 16,
        }).setHTML(buildPopupHTML(pt, cfg))
          .setLngLat([pt.lng, pt.lat])
          .addTo(APP.map);
        fixPop.on('close', () => delete APP.popups[pt.id]);
        APP.popups[pt.id] = fixPop;
      }
      // Seleciona camada no painel
      selectLayer(pt.camada);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([pt.lng, pt.lat])
      .addTo(APP.map);
    APP.markers.push({ marker, pt, el });
  });

  // Adiciona auras GL (círculos suaves)
  addGlAuras();
}

function buildMarkerEl(cfg, pt) {
  const fase = APP.fase;
  const isCrit = fase >= 3;
  const isMax  = fase >= 4;
  const size = 16 + fase * 3; // cresce com a crise

  const wrap = document.createElement('div');
  wrap.className = `mk ${isMax ? 'mk-pulse-fast' : fase >= 2 ? 'mk-pulse' : ''}`;

  switch (cfg.geo) {
    case 'circ': {
      wrap.style.cssText = `width:${size}px;height:${size}px;background:${cfg.cor};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);`;
      break;
    }
    case 'sq': {
      wrap.style.cssText = `width:${size}px;height:${size}px;background:${cfg.cor};border-radius:2px;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);transform:rotate(${isCrit?'45deg':'0deg'});transition:transform .3s;`;
      break;
    }
    case 'hex': {
      wrap.style.cssText = `width:${size}px;height:${size}px;background:${cfg.cor};clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);`;
      break;
    }
    case 'tri': {
      const b = Math.round(size * 0.58);
      wrap.style.cssText = `width:0;height:0;border-left:${b}px solid transparent;border-right:${b}px solid transparent;border-bottom:${size}px solid ${cfg.cor};filter:drop-shadow(0 2px 5px rgba(0,0,0,.35));`;
      break;
    }
    case 'bolt': {
      wrap.style.cssText = `width:${size}px;height:${size}px;background:${cfg.cor};clip-path:polygon(62% 0%,28% 46%,54% 46%,38% 100%,72% 54%,46% 54%);filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));`;
      break;
    }
    case 'diam': {
      wrap.style.cssText = `width:${size}px;height:${size}px;background:${cfg.cor};clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);`;
      break;
    }
    case 'plus': {
      const d = document.createElement('div');
      d.style.cssText = `position:relative;width:${size}px;height:${size}px;`;
      const b1 = document.createElement('div');
      const b2 = document.createElement('div');
      const arm = Math.round(size * 0.35);
      b1.style.cssText = `position:absolute;width:${arm}px;height:${size}px;background:${cfg.cor};left:${(size-arm)/2}px;top:0;`;
      b2.style.cssText = `position:absolute;width:${size}px;height:${arm}px;background:${cfg.cor};top:${(size-arm)/2}px;left:0;`;
      d.appendChild(b1); d.appendChild(b2);
      wrap.appendChild(d);
      break;
    }
    default: {
      wrap.style.cssText = `width:${size}px;height:${size}px;background:${cfg.cor};border-radius:50%;border:3px solid #fff;`;
    }
  }

  // Label pequena com valor atual
  const val = pt.dados[0]?.vals[fase];
  if (val !== undefined) {
    const lbl = document.createElement('div');
    lbl.style.cssText = `
      position:absolute;top:${-22}px;left:50%;transform:translateX(-50%);
      background:white;color:${cfg.cor};
      font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:10px;
      padding:1px 5px;border-radius:2px;border:1.5px solid ${cfg.cor};
      white-space:nowrap;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,.2);
    `;
    lbl.textContent = `${val}${pt.dados[0].unit}`;
    wrap.style.position = 'relative';
    wrap.appendChild(lbl);
  }

  return wrap;
}

function buildPopupHTML(pt, cfg) {
  const fase = APP.fase;
  const metricsHTML = pt.dados.map(d => `
    <div class="pop-m">
      <div class="pop-mk">${d.lbl}</div>
      <div class="pop-mv" style="color:${cfg.cor}">${d.vals[fase]}</div>
      <div class="pop-mu">${d.unit}</div>
    </div>`).join('');

  return `<div class="pop-i">
    <div class="pop-layer" style="color:${cfg.cor}">${cfg.geo === 'circ' ? '●' : cfg.geo === 'sq' ? '■' : cfg.geo === 'tri' ? '▲' : '◆'} ${cfg.nome.toUpperCase()}</div>
    <div class="pop-name">${pt.nome}</div>
    <div class="pop-sub">${pt.bairro} · Fase ${fase + 1}/5</div>
    <div class="pop-grid">${metricsHTML}</div>
    ${pt.alerta ? `<div class="pop-alert">⚠ ${pt.alerta}</div>` : ''}
  </div>`;
}

function updateMarkersPhase() {
  // Remove todos e recria (mais simples e confiável)
  APP.markers.forEach(({ marker }) => marker.remove());
  Object.values(APP.popups).forEach(p => p.remove());
  APP.markers = [];
  APP.popups  = {};
  removeGlAuras();
  placeMarkers();
}

// Auras GL — círculos suaves debaixo dos marcadores
function addGlAuras() {
  const c = APP.crise;
  if (!c || !APP.map.isStyleLoaded()) return;

  const features = c.pontos.map(pt => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
    properties: {
      color: CAMADAS_CONFIG[pt.camada]?.cor || '#cc2200',
      intensity: 0.5 + APP.fase * 0.1,
    }
  }));

  const srcId = 'auras-src';
  const lyrId = 'auras-lyr';

  try {
    if (APP.map.getSource(srcId)) {
      APP.map.getSource(srcId).setData({ type: 'FeatureCollection', features });
    } else {
      APP.map.addSource(srcId, { type: 'geojson', data: { type: 'FeatureCollection', features } });
      APP.map.addLayer({
        id: lyrId, type: 'circle', source: srcId,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 30, 14, 70],
          'circle-color': ['get', 'color'],
          'circle-opacity': ['interpolate', ['linear'], ['get', 'intensity'], 0.5, 0.07, 1, 0.2],
          'circle-blur': 0.8,
        }
      }, APP.map.getLayer('water') ? 'water' : undefined);
      APP.glLayers.push(lyrId);
      APP.glSources.push(srcId);
    }
  } catch (e) {}
}

function removeGlAuras() {
  APP.glLayers.forEach(id => { try { if (APP.map.getLayer(id)) APP.map.removeLayer(id); } catch(e){} });
  APP.glSources.forEach(id => { try { if (APP.map.getSource(id)) APP.map.removeSource(id); } catch(e){} });
  APP.glLayers  = [];
  APP.glSources = [];
}

function clearMap() {
  APP.markers.forEach(({ marker }) => marker.remove());
  Object.values(APP.popups).forEach(p => p.remove());
  APP.markers = [];
  APP.popups  = {};
  removeGlAuras();
}

// ══════════════════════════════════════════════════════════
// PAINEL DIREITO — Seleciona camada
// ══════════════════════════════════════════════════════════
function selectLayer(key) {
  APP.layerActive = key;
  const cfg = CAMADAS_CONFIG[key];
  const c   = APP.crise;
  if (!cfg || !c) return;

  // Destaca row ativa
  document.querySelectorAll('.layer-row').forEach(r => r.classList.remove('active'));
  const row = document.querySelector(`.layer-row[data-key="${key}"]`);
  if (row) row.classList.add('active');

  // Header direito
  document.getElementById('pr-active-layer').textContent = cfg.nome.toUpperCase();
  document.getElementById('pr-title').style.color = '#fff';

  // Pontos desta camada
  const pts = c.pontos.filter(p => p.camada === key);
  const fase = APP.fase;

  // KPIs — usa até 4 métricas do 1º ponto
  const kpiWrap = document.getElementById('kpis');
  kpiWrap.innerHTML = '';
  if (pts.length) {
    pts[0].dados.slice(0, 4).forEach(d => {
      const val  = d.vals[fase];
      const prev = d.vals[Math.max(0, fase - 1)];
      const delta = val - prev;
      const pct   = prev > 0 ? ((delta / prev) * 100).toFixed(0) : 0;
      const kpi   = document.createElement('div');
      kpi.className = 'kpi';
      kpi.style.setProperty('--kc', cfg.cor);
      kpi.innerHTML = `
        <div class="kpi-lbl">${d.lbl}</div>
        <div class="kpi-val">${val}</div>
        <div class="kpi-unit">${d.unit}</div>
        <div class="kpi-delta ${delta > 0 ? 'up' : 'stable'}">
          ${delta >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs fase anterior
        </div>`;
      kpiWrap.appendChild(kpi);
    });
  }

  // Causa / investigação
  document.getElementById('cause-text').textContent    = c.causa;
  document.getElementById('invest-text').textContent   = c.investigacao;

  // Gráfico
  buildChart(pts, cfg);
}

// ══════════════════════════════════════════════════════════
// GRÁFICO — Curva de degradação
// ══════════════════════════════════════════════════════════
function buildChart(pts, cfg) {
  const labels = ['0 min', '2 min', '4 min', '6 min', '8 min', '10 min'];

  const datasets = [];
  (pts.slice(0, 3)).forEach((pt, i) => {
    pt.dados.slice(0, 2).forEach((d, j) => {
      datasets.push({
        label: `${pt.nome.split('—')[0].trim()} · ${d.lbl}`,
        data: d.vals,
        borderColor: cfg.cor,
        backgroundColor: cfg.cor + (i === 0 && j === 0 ? '22' : '08'),
        borderWidth: i === 0 && j === 0 ? 2.5 : 1.5,
        borderDash: j > 0 ? [5, 3] : [],
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fff',
        pointBorderColor: cfg.cor,
        pointBorderWidth: 2,
        fill: i === 0 && j === 0,
        tension: 0.35,
      });
    });
  });

  // Marca a fase atual com linha vertical
  const phasePlugin = {
    id: 'phaseLine',
    afterDraw(chart) {
      const ctx   = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const x     = xAxis.getPixelForValue(APP.fase);
      ctx.save();
      ctx.strokeStyle = '#cc2200';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x, yAxis.top);
      ctx.lineTo(x, yAxis.bottom);
      ctx.stroke();
      ctx.fillStyle = '#cc2200';
      ctx.font = 'bold 9px Barlow Condensed';
      ctx.fillText('AGORA', x + 4, yAxis.top + 12);
      ctx.restore();
    }
  };

  if (APP.chart) { APP.chart.destroy(); APP.chart = null; }
  const ctx = document.getElementById('chart');
  if (!ctx) return;

  APP.chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    plugins: [phasePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          labels: {
            color: '#5a5a5a',
            font: { family: 'Barlow Condensed', size: 10 },
            boxWidth: 10, boxHeight: 2, padding: 8,
          }
        },
        tooltip: {
          backgroundColor: '#fff',
          borderColor: '#0f0f0f',
          borderWidth: 1.5,
          titleColor: '#0f0f0f',
          bodyColor: '#2a2a2a',
          titleFont: { family: 'Barlow Condensed', weight: 'bold', size: 12 },
          bodyFont: { family: 'Barlow', size: 11 },
          padding: 10,
        },
      },
      scales: {
        x: {
          ticks: { color: '#5a5a5a', font: { family: 'Barlow Condensed', size: 10 }, maxRotation: 0 },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: {
          ticks: { color: '#5a5a5a', font: { family: 'Barlow Condensed', size: 10 } },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    },
  });
}

// ══════════════════════════════════════════════════════════
// TIMER — 10 minutos, fases a cada 2 min
// ══════════════════════════════════════════════════════════
function startTimers() {
  // Timer de contagem regressiva (1s)
  APP.timerInterval = setInterval(() => {
    APP.timerSeg = Math.max(0, APP.timerSeg - 1);
    updateTimerUI();
    if (APP.timerSeg === 0) stopTimers();
  }, 1000);

  // Fases a cada 120s (2min)
  APP.faseInterval = setInterval(() => {
    if (APP.fase < 4) {
      APP.fase++;
      updatePhase();
      updateBanner();
    }
  }, 120000);

  // Para demo rápido: 1 fase a cada 30s (comment out se quiser 2min real)
  // APP.faseInterval = setInterval(() => { if (APP.fase < 4) { APP.fase++; updatePhase(); updateBanner(); } }, 30000);
}

function stopTimers() {
  clearInterval(APP.timerInterval);
  clearInterval(APP.faseInterval);
}

function updateTimerUI() {
  const min = Math.floor(APP.timerSeg / 60);
  const sec = APP.timerSeg % 60;
  document.getElementById('timer-clock').textContent =
    `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  // Barra
  const pct = APP.timerSeg / 600;
  document.getElementById('timer-fill').style.width = (pct * 100) + '%';
  // Cor da barra nos últimos 2min
  document.getElementById('timer-fill').style.background =
    APP.timerSeg < 120 ? '#ff6b6b' : '#fff';
}

// ══════════════════════════════════════════════════════════
// PRÓXIMA CRISE
// ══════════════════════════════════════════════════════════
function nextCrise() {
  const next = (APP.criseIdx + 1) % CRISES.length;
  loadCrise(next);
}

// Exporta para debug
window.APP = APP;
window.loadCrise = loadCrise;

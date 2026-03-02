/**
 * app2.js — Orquestrador principal do Urban Lens SP
 * Conecta: simulação → mapa → painel → gráficos → impacto
 */

import { tick, STATE, iqaLabel, bandColor, balnColor, getAlerts, getLayerPoints, generateHistory } from './simulation.js';
import { askClaude } from './claude.js';

// ── Estado da aplicação ────────────────────────────────
const APP = {
  map: null,
  chart: null,
  activeLayers: new Set(),
  markers: {},          // layer → array de MapLibre markers
  updateInterval: null,
  nextUpdateIn: 60,
  currentChartLayer: 'ar',
};

// ── Inicialização ──────────────────────────────────────
async function init() {
  startClock();
  initMap();
  bindUI();
  runTick();  // primeiro tick imediato
  startSimLoop();
  updateTicker();
}

// ── Relógio ────────────────────────────────────────────
function startClock() {
  function t() {
    const n = new Date();
    document.getElementById('tb-clock').textContent =
      n.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('tb-date').textContent =
      n.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  }
  t(); setInterval(t, 1000);
}

// ── Mapa (MapLibre, estilo Waze claro) ─────────────────
function initMap() {
  APP.map = new maplibregl.Map({
    container: 'map',
    // OpenFreeMap Positron = estilo claro e limpo
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [-46.6333, -23.5505],
    zoom: 10.5,
    pitch: 0,
    bearing: 0,
    attributionControl: false,
  });

  APP.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  APP.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  APP.map.on('load', () => {
    console.log('[MAP] Mapa claro carregado');
    // Ativa camada de AR por padrão
    document.querySelector('.layer-chk[data-layer="ar"]').checked = true;
    toggleLayer('ar', true);
  });
}

// ── Loop de simulação (a cada 60s) ────────────────────
function startSimLoop() {
  APP.updateInterval = setInterval(() => {
    runTick();
    APP.nextUpdateIn = 60;
  }, 60000);

  // Countdown
  setInterval(() => {
    APP.nextUpdateIn = Math.max(0, APP.nextUpdateIn - 1);
    document.getElementById('next-update').textContent = `${APP.nextUpdateIn}s`;
  }, 1000);
}

// ── Executa um tick de simulação ──────────────────────
function runTick() {
  tick();
  updateKPIs();
  updateLayerMetrics();
  updateMarkersForActiveLayers();
  updateTicker();
}

// ── Atualiza KPIs da topbar ───────────────────────────
function updateKPIs() {
  const { label, color } = iqaLabel(STATE.ar.iqa);
  const aqiEl = document.getElementById('val-aqi');
  aqiEl.textContent = `${STATE.ar.iqa} ${label}`;
  aqiEl.style.color = color;

  document.getElementById('val-temp').textContent = `${STATE.clima.temp}°C`;
  document.getElementById('val-chuva').textContent =
    STATE.clima.chuva > 0 ? `${STATE.clima.chuva} mm` : `0 mm`;

  // Flash KPI de chuva se ativo
  if (STATE.clima.chuva > 0) {
    document.getElementById('kpi-chuva').style.borderColor = '#0ea5e9';
  } else {
    document.getElementById('kpi-chuva').style.borderColor = '';
  }
}

// ── Atualiza métricas dos cards ───────────────────────
function updateLayerMetrics() {
  const s = STATE;
  const { label: iqaLbl, color: iqaC } = iqaLabel(s.ar.iqa);

  setM('m-ar-pm25', s.ar.pm25.toFixed(1));
  setM('m-ar-no2',  s.ar.no2.toFixed(1));
  setM('m-ar-iqa',  `${s.ar.iqa} ${iqaLbl}`, iqaC);

  setM('m-agua-turb', s.agua.turbidez.toFixed(1));
  setM('m-agua-ph',   s.agua.ph.toFixed(1));
  setM('m-agua-baln', s.agua.balneab, balnColor(s.agua.balneab));

  setM('m-en-hidro', s.energia.hidro);
  setM('m-en-term',  s.energia.termica, s.energia.termica > 22 ? '#f43f5e' : '#22c55e');
  setM('m-en-band',  s.energia.banda, bandColor(s.energia.banda));

  setM('m-res-pts', s.residuos.pts_irreg.toLocaleString('pt-BR'));
  setM('m-res-cap', s.residuos.cap_aterro, s.residuos.cap_aterro > 85 ? '#f43f5e' : '#22c55e');

  setM('m-solo-agro', s.solo.agrotox.toFixed(1));
  setM('m-solo-desm', s.solo.desmat.toLocaleString('pt-BR'));

  setM('m-tr-cong',  s.trafego.congestionamento, s.trafego.congestionamento > 60 ? '#f43f5e' : '#22c55e');
  setM('m-tr-calor', s.trafego.ilha_calor.toFixed(1));
  setM('m-tr-ruido', s.trafego.ruido);

  setM('m-sau-resp',  s.saude.respirat);
  setM('m-sau-hidr',  s.saude.hidricas);
  setM('m-sau-intox', s.saude.intox.toFixed(1));
}

function setM(id, val, color) {
  const el = document.getElementById(id);
  if (!el) return;
  const old = el.textContent;
  el.textContent = val;
  if (color) el.style.color = color;
  if (old !== String(val)) el.classList.add('flashing');
  setTimeout(() => el.classList.remove('flashing'), 500);
}

// ── Ticker de alertas ─────────────────────────────────
function updateTicker() {
  const alerts = getAlerts();
  document.getElementById('ticker-content').textContent = alerts.join('   ·   ');
}

// ── Bind de eventos de UI ─────────────────────────────
function bindUI() {
  // Layer checkboxes
  document.querySelectorAll('.layer-chk').forEach(chk => {
    chk.addEventListener('change', e => {
      const layer = e.target.dataset.layer;
      toggleLayer(layer, e.target.checked);
    });
  });

  // Layer card click → expand metrics
  document.querySelectorAll('.layer-card').forEach(card => {
    card.addEventListener('click', e => {
      // Não interfere no switch
      if (e.target.closest('.lc-switch')) return;
      const layer = card.dataset.layer;
      const chk = card.querySelector('.layer-chk');
      if (chk) { chk.checked = !chk.checked; toggleLayer(layer, chk.checked); }
    });
  });

  // Charts toggle
  document.getElementById('btn-charts-toggle').addEventListener('click', () => {
    const panel = document.getElementById('panel-charts');
    const btn   = document.getElementById('btn-charts-toggle');
    const collapsed = panel.classList.toggle('collapsed');
    btn.classList.toggle('active', !collapsed);
    if (!collapsed) renderChart(APP.currentChartLayer);
    // Fecha impacto se aberto
    if (!collapsed) document.getElementById('panel-impact').classList.add('collapsed');
  });

  document.getElementById('charts-close').addEventListener('click', () => {
    document.getElementById('panel-charts').classList.add('collapsed');
    document.getElementById('btn-charts-toggle').classList.remove('active');
  });

  document.getElementById('impact-close').addEventListener('click', () => {
    document.getElementById('panel-impact').classList.add('collapsed');
  });

  // Chart tabs
  document.querySelectorAll('.ctab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP.currentChartLayer = btn.dataset.chart;
      renderChart(APP.currentChartLayer);
    });
  });

  // Demo impact
  document.getElementById('btn-impact-demo').addEventListener('click', () => {
    triggerImpact({
      lat: -23.5505, lng: -46.6706,
      nome: 'Hospital das Clínicas FMUSP',
      layer: 'saude',
    });
  });

  // Impact trigger from map
  window.addEventListener('impact:trigger', e => triggerImpact(e.detail));
}

// ── Toggle de camada ──────────────────────────────────
function toggleLayer(layer, active) {
  const card = document.querySelector(`.layer-card[data-layer="${layer}"]`);
  if (!card) return;

  if (active) {
    APP.activeLayers.add(layer);
    card.classList.add('active');
    addMarkersForLayer(layer);
    toast(`${layerName(layer)} ativada`);
  } else {
    APP.activeLayers.delete(layer);
    card.classList.remove('active');
    removeMarkers(layer);
  }
}

// ── Adiciona marcadores no mapa ───────────────────────
function addMarkersForLayer(layer) {
  if (!APP.map || !APP.map.isStyleLoaded()) return;
  removeMarkers(layer);

  const points = getLayerPoints(layer);
  const color  = layerColor(layer);

  APP.markers[layer] = points.map(pt => {
    const el = document.createElement('div');
    el.className = 'map-label';
    el.style.borderColor = color;
    el.style.color = color;
    el.textContent = layerIcon(layer);
    el.title = pt.nome;
    el.style.cursor = 'pointer';

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([pt.lng, pt.lat])
      .addTo(APP.map);

    // Popup ao hover
    el.addEventListener('mouseenter', () => showPopup(pt, layer));
    el.addEventListener('click', () => {
      triggerImpact({ lat: pt.lat, lng: pt.lng, nome: pt.nome, layer, point: pt });
    });

    return marker;
  });
}

function showPopup(pt, layer) {
  const color = layerColor(layer);
  const metrics = buildPopupMetrics(pt, layer);

  const html = `
    <div class="popup-layer">${layerIcon(layer)} ${layerName(layer).toUpperCase()}</div>
    <div class="popup-name">${pt.nome}</div>
    <div class="popup-metrics">${metrics}</div>
    <div class="popup-impact" onclick="window.dispatchEvent(new CustomEvent('impact:trigger',{detail:{lat:${pt.lat},lng:${pt.lng},nome:'${pt.nome}',layer:'${layer}'}}))">
      ◈ Analisar Rastro do Impacto →
    </div>
  `;

  new maplibregl.Popup({ closeOnClick: true, maxWidth: '260px', offset: 16 })
    .setLngLat([pt.lng, pt.lat])
    .setHTML(html)
    .addTo(APP.map);
}

function buildPopupMetrics(pt, layer) {
  const color = layerColor(layer);
  const pairs = {
    ar:       [['PM₂.₅', `${pt.pm25?.toFixed(1)} µg/m³`], ['NO₂', `${pt.no2?.toFixed(1)} µg/m³`]],
    agua:     [['Turbidez', `${pt.turbidez?.toFixed(1)} NTU`], ['pH', pt.ph?.toFixed(1)]],
    energia:  [['Tipo', pt.tipo], ['Carga', `${pt.carga?.toFixed(0)}%`]],
    residuos: [['Tipo', pt.tipo], ['Capacidade', pt.cap > 0 ? `${pt.cap}%` : 'N/A']],
    solo:     [['Agrotóx.', `${pt.agrotox?.toFixed(1)} kg/ha`], ['Desmat.', `${pt.desmat?.toFixed(0)} ha/mês`]],
    trafego:  [['Congestion.', `${pt.cong?.toFixed(0)}%`], ['Ilha calor', `+${pt.calor?.toFixed(1)}°C`]],
    saude:    [['Tipo', pt.tipo], ['Resp./100k', pt.resp?.toFixed(0)]],
  };
  return (pairs[layer] || []).map(([k, v]) =>
    `<div class="pm-item"><div class="pm-k">${k}</div><div class="pm-v" style="color:${color}">${v}</div></div>`
  ).join('');
}

function removeMarkers(layer) {
  (APP.markers[layer] || []).forEach(m => m.remove());
  APP.markers[layer] = [];
}

function updateMarkersForActiveLayers() {
  for (const layer of APP.activeLayers) {
    removeMarkers(layer);
    addMarkersForLayer(layer);
  }
}

// ── Gráficos ──────────────────────────────────────────
function renderChart(layer) {
  const { labels, datasets, insight } = generateHistory(layer);

  if (APP.chart) { APP.chart.destroy(); APP.chart = null; }

  const ctx = document.getElementById('main-chart');
  if (!ctx) return;

  APP.chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'DM Mono', size: 10 },
            boxWidth: 10, boxHeight: 2,
          },
        },
        tooltip: {
          backgroundColor: '#1e2535',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          titleFont: { family: 'Syne', size: 11 },
          bodyFont: { family: 'DM Mono', size: 10 },
        },
      },
      scales: {
        x: {
          ticks: { color: '#475569', font: { family: 'DM Mono', size: 9 }, maxRotation: 0, maxTicksLimit: 8 },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: '#475569', font: { family: 'DM Mono', size: 9 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });

  document.getElementById('chart-insight').textContent = insight;
}

// ── Rastro do Impacto ─────────────────────────────────
async function triggerImpact({ lat, lng, nome, layer, point }) {
  const panel = document.getElementById('panel-impact');
  panel.classList.remove('collapsed');
  // Fecha gráficos se aberto
  document.getElementById('panel-charts').classList.add('collapsed');
  document.getElementById('btn-charts-toggle').classList.remove('active');

  // Voa para o ponto
  APP.map.flyTo({ center: [lng, lat], zoom: 13, duration: 900 });

  // Bloco de origem
  document.getElementById('impact-origin-block').innerHTML = `
    <div class="impact-block">
      <div class="ib-label">PONTO DE ANÁLISE</div>
      <div class="ib-name">${nome}</div>
      <div class="ib-sub">${layerIcon(layer)} ${layerName(layer)} · ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
    </div>
  `;

  // Cadeia de causa-efeito baseada no estado atual
  const chain = buildCausalChain(layer, STATE);
  const chainEl = document.getElementById('impact-chain');
  chainEl.innerHTML = '';

  chain.forEach((item, i) => {
    if (i > 0) chainEl.innerHTML += `<div class="chain-arrow">↓</div>`;
    chainEl.innerHTML += `
      <div class="chain-item">
        <div class="chain-dot" style="background:${item.color}"></div>
        <div class="chain-info">
          <div class="chain-type">${item.layer}</div>
          <div class="chain-value" style="color:${item.color}">${item.value}</div>
          <div class="chain-meta">${item.desc}</div>
        </div>
        <span class="ce-badge ${item.isCause ? 'ce-cause' : 'ce-effect'}">${item.isCause ? 'CAUSA' : 'EFEITO'}</span>
      </div>
    `;
  });

  // Análise sumária
  document.getElementById('impact-analysis').innerHTML = buildAnalysisHTML(layer, chain);

  // Interpretação Claude
  const claudeEl = document.getElementById('impact-claude-text');
  const loadEl   = document.getElementById('impact-loading');
  claudeEl.textContent = '';
  loadEl.classList.remove('hidden');

  const payload = {
    ponto: nome, camada: layerName(layer),
    estado_atual: {
      iqa: STATE.ar.iqa, pm25: STATE.ar.pm25,
      congestionamento: STATE.trafego.congestionamento,
      turbidez: STATE.agua.turbidez,
      internacoes_resp: STATE.saude.respirat,
      chuva_ativa: STATE.clima.chuva > 0,
      temp: STATE.clima.temp,
    },
    cadeia_causal: chain.map(c => ({ evento: c.value, tipo: c.isCause ? 'causa' : 'efeito' })),
    instrucao: 'Em 3 parágrafos curtos, explique a cadeia de causa-efeito ambiental observada para estudantes do ensino médio. Use linguagem acessível, cite os dados numéricos fornecidos e termine com uma pergunta de investigação que os alunos possam pesquisar.',
  };

  try {
    const text = await askClaude(payload);
    loadEl.classList.add('hidden');
    await typewriter(claudeEl, text, 15);
  } catch (e) {
    loadEl.classList.add('hidden');
    claudeEl.textContent = generateLocalImpact(layer, chain);
  }
}

/** Constrói cadeia causal baseada na camada e estado atual */
function buildCausalChain(layer, s) {
  const chains = {
    ar: [
      { layer: 'TRÁFEGO', color: '#f43f5e', value: `${s.trafego.congestionamento}% congestionamento`, desc: 'Veículos em marcha lenta emitem 3x mais poluentes', isCause: true },
      { layer: 'ATMOSFERA', color: '#f97316', value: `PM₂.₅ ${s.ar.pm25.toFixed(1)} µg/m³`, desc: `IQA ${s.ar.iqa} — ${iqaLabel(s.ar.iqa).label}`, isCause: false },
      { layer: 'SAÚDE', color: '#ec4899', value: `${s.saude.respirat} intern./100k`, desc: 'Doenças respiratórias correlacionadas (r=0.73)', isCause: false },
    ],
    agua: [
      { layer: 'CHUVA', color: '#0ea5e9', value: s.clima.chuva > 0 ? `${s.clima.chuva} mm/h` : 'Sem chuva', desc: 'Escoamento superficial carrega contaminantes', isCause: true },
      { layer: 'HIDROSFERA', color: '#38bdf8', value: `Turbidez ${s.agua.turbidez.toFixed(1)} NTU`, desc: `Balneabilidade: ${s.agua.balneab}`, isCause: false },
      { layer: 'SAÚDE', color: '#ec4899', value: `${s.saude.hidricas} casos/100k`, desc: 'Doenças de veiculação hídrica', isCause: false },
    ],
    energia: [
      { layer: 'TEMPERATURA', color: '#f97316', value: `${s.clima.temp}°C`, desc: 'Calor aumenta consumo de ar-condicionado', isCause: true },
      { layer: 'MATRIZ ELÉTRICA', color: '#a855f7', value: `Térmica ${s.energia.termica}%`, desc: `Bandeira ${s.energia.banda} — custo elevado`, isCause: false },
      { layer: 'ATMOSFERA', color: '#f97316', value: `CO₂ adicional`, desc: 'Cada 1% térmica = ~1.2 MtCO₂/mês', isCause: false },
    ],
    trafego: [
      { layer: 'URBANIZAÇÃO', color: '#f43f5e', value: 'Alta densidade veicular', desc: `${s.trafego.congestionamento}% das vias`, isCause: true },
      { layer: 'ILHA DE CALOR', color: '#fb923c', value: `+${s.trafego.ilha_calor}°C`, desc: 'Acima da temperatura da periferia', isCause: false },
      { layer: 'SAÚDE', color: '#ec4899', value: 'Estresse térmico', desc: 'Risco cardiovascular aumentado em idosos', isCause: false },
    ],
    residuos: [
      { layer: 'DESCARTE IRREGULAR', color: '#22c55e', value: `${s.residuos.pts_irreg.toLocaleString('pt-BR')} pontos`, desc: 'Acúmulo em áreas periféricas', isCause: true },
      { layer: 'SOLO/ÁGUA', color: '#84cc16', value: 'Lixiviação', desc: 'Metais pesados atingem lençol freático', isCause: false },
      { layer: 'SAÚDE', color: '#ec4899', value: `${s.saude.intox.toFixed(1)} intox./100k`, desc: 'Vetores de doenças + contaminação', isCause: false },
    ],
    solo: [
      { layer: 'AGROTÓXICOS', color: '#84cc16', value: `${s.solo.agrotox.toFixed(1)} kg/ha`, desc: 'Aplicação em cultivos periurbanos', isCause: true },
      { layer: 'HIDROSFERA', color: '#0ea5e9', value: `pH ${s.agua.ph.toFixed(1)}`, desc: 'Acidificação de corpos hídricos', isCause: false },
      { layer: 'SAÚDE', color: '#ec4899', value: `${s.saude.intox.toFixed(1)} intox./100k`, desc: 'Intoxicações em comunidades rurais e periurbanas', isCause: false },
    ],
    saude: [
      { layer: 'ATMOSFERA', color: '#f97316', value: `IQA ${s.ar.iqa}`, desc: `PM₂.₅ ${s.ar.pm25.toFixed(1)} µg/m³`, isCause: true },
      { layer: 'EXPOSIÇÃO', color: '#f43f5e', value: `${s.trafego.congestionamento}% vias`, desc: 'Congestionamento aumenta exposição diária', isCause: true },
      { layer: 'INTERNAÇÕES', color: '#ec4899', value: `${s.saude.respirat} resp./100k`, desc: 'Doenças respiratórias — CID J00-J99', isCause: false },
    ],
  };
  return chains[layer] || chains.saude;
}

function buildAnalysisHTML(layer, chain) {
  const causes  = chain.filter(c => c.isCause).map(c => `<span class="ce-badge ce-cause">${c.layer}</span>`).join(' ');
  const effects = chain.filter(c => !c.isCause).map(c => `<span class="ce-badge ce-effect">${c.layer}</span>`).join(' ');
  return `
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);letter-spacing:1px">CAUSAS IDENTIFICADAS</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${causes}</div>
      <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);letter-spacing:1px;margin-top:4px">EFEITOS OBSERVADOS</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${effects}</div>
    </div>
  `;
}

function generateLocalImpact(layer, chain) {
  const cause = chain.find(c => c.isCause);
  const effect = chain.find(c => !c.isCause);
  return `A análise do ponto selecionado revela uma cadeia de impacto direta entre ${cause?.layer?.toLowerCase() || 'fontes emissoras'} e ${effect?.layer?.toLowerCase() || 'saúde pública'}.

O dado de ${cause?.value || 'emissão elevada'} está acima dos limites recomendados por organismos como a OMS e CONAMA, e os modelos epidemiológicos do DataSUS confirmam correlação com os indicadores de ${effect?.value || 'impacto na saúde'}.

◉ Pergunta de investigação: Como o planejamento urbano poderia reorganizar as fontes emissoras identificadas para reduzir o impacto nas populações mais vulneráveis desta área?

[Configure sua chave Claude API para análises mais aprofundadas]`;
}

// ── Typewriter ────────────────────────────────────────
function typewriter(el, text, delay = 15) {
  return new Promise(resolve => {
    let i = 0;
    const iv = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); resolve(); }
    }, delay);
  });
}

// ── Toast ─────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Helpers ───────────────────────────────────────────
function layerName(l) {
  return { ar:'Atmosfera', agua:'Hidrosfera', energia:'Matriz Elétrica', residuos:'Resíduos', solo:'Solo/Biosfera', trafego:'Tráfego & Clima', saude:'Saúde Pública' }[l] || l;
}
function layerColor(l) {
  return { ar:'#f97316', agua:'#0ea5e9', energia:'#a855f7', residuos:'#22c55e', solo:'#84cc16', trafego:'#f43f5e', saude:'#ec4899' }[l] || '#94a3b8';
}
function layerIcon(l) {
  return { ar:'💨', agua:'💧', energia:'⚡', residuos:'♻', solo:'🌱', trafego:'🚦', saude:'🏥' }[l] || '◉';
}

// ── Start ─────────────────────────────────────────────
init();

/**
 * app2.js — Orquestrador Urban Lens SP v3
 * Integra: simulação → motor visual → pulso de feedback → gráficos → impacto
 */

import { tick, STATE, PREV_STATE, TICK_DIFF, iqaLabel, bandColor, balnColor, getAlerts, generateHistory } from './simulation.js';
import { initVisualEngine, renderLayer, removeLayer, updateLayerData, drawImpactLine, removeImpactLine, pulseMapZone, LAYER_COLORS } from './visualEngine.js';
import { SAUDE_PONTOS, AR_PONTOS, RESIDUOS_PONTOS, TRAFEGO_CORREDORES, calcCongestionamento } from './geodata.js';
import { askClaude } from './claude.js';

const APP = {
  map: null, chart: null,
  activeLayers: new Set(),
  popupMarkers: {},
  nextUpdateIn: 60,
  currentChartLayer: 'ar',
};

async function init() {
  startClock();
  initMap();
  bindUI();
}

function startClock() {
  const t = () => {
    const n = new Date();
    document.getElementById('tb-clock').textContent =
      n.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    document.getElementById('tb-date').textContent =
      n.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
  };
  t(); setInterval(t, 1000);
}

function initMap() {
  // Estilos em ordem de preferência (fallback automático)
  const STYLES = [
    'https://tiles.openfreemap.org/styles/positron',
    'https://demotiles.maplibre.org/style.json',
  ];

  function tryStyle(index) {
    if (index >= STYLES.length) {
      console.error('[MAP] Todos os estilos falharam');
      document.getElementById('map').innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-family:DM Mono,monospace;font-size:12px;background:#0f1117">Mapa indisponível — verifique sua conexão</div>';
      return;
    }

    APP.map = new maplibregl.Map({
      container: 'map',
      style: STYLES[index],
      center: [-46.6333, -23.5505],
      zoom: 10.8, pitch: 0,
      attributionControl: false,
    });

    APP.map.on('error', (e) => {
      console.warn(`[MAP] Estilo ${index} falhou:`, e);
      APP.map.remove();
      tryStyle(index + 1);
    });

    APP.map.addControl(new maplibregl.AttributionControl({ compact:true }), 'bottom-right');
    APP.map.addControl(new maplibregl.NavigationControl({ showCompass:false }), 'bottom-right');

    APP.map.on('load', () => {
      console.log('[MAP] Carregado com estilo:', STYLES[index]);
      // Esconde indicador de loading
      const loadEl = document.getElementById('map-loading');
      if (loadEl) loadEl.classList.add('hidden');
      initVisualEngine(APP.map);
      runTick();
      startSimLoop();
      const arChk = document.querySelector('.layer-chk[data-layer="ar"]');
      if (arChk) { arChk.checked = true; toggleLayer('ar', true); }
    });
  }

  tryStyle(0);
}

function startSimLoop() {
  setInterval(() => { runTick(); APP.nextUpdateIn = 60; }, 60000);
  setInterval(() => {
    APP.nextUpdateIn = Math.max(0, APP.nextUpdateIn - 1);
    const el = document.getElementById('next-update');
    if (el) el.textContent = `${APP.nextUpdateIn}s`;
  }, 1000);
}

function runTick() {
  tick();
  updateKPIs();
  updateLayerMetrics();
  applyPulseFeedback();
  refreshActiveLayerVisuals();
  updateTicker();
}

function updateKPIs() {
  const { label, color } = iqaLabel(STATE.ar.iqa);
  const el = document.getElementById('val-aqi');
  el.textContent = `${STATE.ar.iqa} ${label}`; el.style.color = color;
  document.getElementById('val-temp').textContent  = `${STATE.clima.temp}°C`;
  document.getElementById('val-chuva').textContent = `${STATE.clima.chuva||0} mm`;
  document.getElementById('kpi-chuva').style.borderColor = STATE.clima.chuva > 0 ? '#0ea5e9' : '';
}

function updateLayerMetrics() {
  const s = STATE;
  const { label:iqaLbl, color:iqaC } = iqaLabel(s.ar.iqa);
  setM('m-ar-pm25', s.ar.pm25.toFixed(1));
  setM('m-ar-no2',  s.ar.no2.toFixed(1));
  setM('m-ar-iqa',  `${s.ar.iqa} ${iqaLbl}`, iqaC);
  setM('m-agua-turb',s.agua.turbidez.toFixed(1));
  setM('m-agua-ph',  s.agua.ph.toFixed(1));
  setM('m-agua-baln',s.agua.balneab, balnColor(s.agua.balneab));
  setM('m-en-hidro', s.energia.hidro);
  setM('m-en-term',  s.energia.termica, s.energia.termica>22?'#f43f5e':'#22c55e');
  setM('m-en-band',  s.energia.banda, bandColor(s.energia.banda));
  setM('m-res-pts',  s.residuos.pts_irreg.toLocaleString('pt-BR'));
  setM('m-res-cap',  s.residuos.cap_aterro, s.residuos.cap_aterro>85?'#f43f5e':'#22c55e');
  setM('m-solo-agro',s.solo.agrotox.toFixed(1));
  setM('m-solo-desm',s.solo.desmat.toLocaleString('pt-BR'));
  setM('m-tr-cong',  s.trafego.congestionamento, s.trafego.congestionamento>60?'#f43f5e':'#22c55e');
  setM('m-tr-calor', s.trafego.ilha_calor.toFixed(1));
  setM('m-tr-ruido', s.trafego.ruido);
  setM('m-sau-resp', s.saude.respirat);
  setM('m-sau-hidr', s.saude.hidricas);
  setM('m-sau-intox',s.saude.intox.toFixed(1));
}

function setM(id, val, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = val;
  if (color) el.style.color = color;
}

// ══════════════════════════════════════════════════════
// PULSO DE FEEDBACK — O coração do sistema vivo
// ══════════════════════════════════════════════════════
function applyPulseFeedback() {
  ['ar','agua','energia','residuos','solo','trafego','saude'].forEach(layer => {
    const diff = TICK_DIFF[layer];
    if (!diff || diff.severity === 'ok') return;
    const isGood = diff.direction === 'up';
    const card = document.querySelector(`.layer-card[data-layer="${layer}"]`);
    if (card) pulseCard(card, isGood);
    if (APP.activeLayers.has(layer)) pulseMapZone(layer, isGood);
  });
}

function pulseCard(card, isGood) {
  const color = isGood ? '#22c55e' : '#f43f5e';
  const bg    = isGood ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)';
  let count = 0;
  const iv = setInterval(() => {
    if (count % 2 === 0) { card.style.background = bg; card.style.boxShadow = `0 0 0 1.5px ${color}`; }
    else { card.style.background = ''; card.style.boxShadow = ''; }
    if (++count >= 6) { clearInterval(iv); card.style.background=''; card.style.boxShadow=''; }
  }, 180);
}

function refreshActiveLayerVisuals() {
  for (const layer of APP.activeLayers) updateLayerData(layer);
}

function updateTicker() {
  const el = document.getElementById('ticker-content');
  if (el) el.textContent = getAlerts().join('   ·   ');
}

// ── UI ─────────────────────────────────────────────────
function bindUI() {
  document.querySelectorAll('.layer-chk').forEach(chk => {
    chk.addEventListener('change', e => toggleLayer(e.target.dataset.layer, e.target.checked));
  });
  document.querySelectorAll('.layer-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.lc-switch')) return;
      const chk = card.querySelector('.layer-chk');
      if (chk) { chk.checked = !chk.checked; toggleLayer(card.dataset.layer, chk.checked); }
    });
  });

  document.getElementById('btn-charts-toggle').addEventListener('click', () => {
    const panel = document.getElementById('panel-charts');
    const open  = panel.classList.toggle('collapsed') === false;
    document.getElementById('btn-charts-toggle').classList.toggle('active', open);
    if (open) { renderChart(APP.currentChartLayer); document.getElementById('panel-impact').classList.add('collapsed'); }
  });
  document.getElementById('charts-close').addEventListener('click', () => {
    document.getElementById('panel-charts').classList.add('collapsed');
    document.getElementById('btn-charts-toggle').classList.remove('active');
  });
  document.getElementById('impact-close').addEventListener('click', () => {
    document.getElementById('panel-impact').classList.add('collapsed');
    removeImpactLine();
  });
  document.querySelectorAll('.ctab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP.currentChartLayer = btn.dataset.chart;
      renderChart(APP.currentChartLayer);
    });
  });
  document.getElementById('btn-impact-demo').addEventListener('click', () => {
    triggerImpact({ lat:-23.5505, lng:-46.6706, nome:'Hospital das Clínicas FMUSP', layer:'saude' });
  });
  window.addEventListener('impact:trigger', e => triggerImpact(e.detail));
}

function toggleLayer(layer, active) {
  const card = document.querySelector(`.layer-card[data-layer="${layer}"]`);
  if (!card) return;
  if (active) {
    APP.activeLayers.add(layer); card.classList.add('active');
    renderLayer(layer); addPopupMarkers(layer);
    toast(`${layerName(layer)} ativada`);
  } else {
    APP.activeLayers.delete(layer); card.classList.remove('active');
    removeLayer(layer); removePopupMarkers(layer);
  }
}

function addPopupMarkers(layer) {
  if (!APP.map || !APP.map.isStyleLoaded()) return;
  removePopupMarkers(layer);
  const pts = getLayerPoints(layer);
  const color = LAYER_COLORS[layer];
  APP.popupMarkers[layer] = pts.map(pt => {
    const el = document.createElement('div');
    el.style.cssText = `width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;cursor:pointer;box-shadow:0 0 6px ${color}88;transition:transform .15s;`;
    el.title = pt.nome;
    el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.8)');
    el.addEventListener('mouseleave', () => el.style.transform = '');
    el.addEventListener('click', () => {
      showMapPopup(pt, layer);
      window.dispatchEvent(new CustomEvent('impact:trigger',{detail:{lat:pt.lat,lng:pt.lng,nome:pt.nome,layer,point:pt}}));
    });
    return new maplibregl.Marker({ element:el, anchor:'center' }).setLngLat([pt.lng,pt.lat]).addTo(APP.map);
  });
}

function removePopupMarkers(layer) {
  (APP.popupMarkers[layer]||[]).forEach(m=>m.remove());
  APP.popupMarkers[layer]=[];
}

function showMapPopup(pt, layer) {
  const color = LAYER_COLORS[layer];
  const m = buildMetrics(pt, layer, color);
  new maplibregl.Popup({ closeOnClick:true, maxWidth:'240px', offset:14 })
    .setLngLat([pt.lng,pt.lat])
    .setHTML(`
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;color:#475569;margin-bottom:4px">${layerIcon(layer)} ${layerName(layer).toUpperCase()}</div>
      <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:8px">${pt.nome}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${m}</div>
      <div onclick="window.dispatchEvent(new CustomEvent('impact:trigger',{detail:{lat:${pt.lat},lng:${pt.lng},nome:'${pt.nome.replace(/'/g,"\\'")}',layer:'${layer}'}}))"
        style="margin-top:10px;padding:6px;border-radius:5px;background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.25);color:#c084fc;font-size:10px;cursor:pointer;text-align:center;font-family:'DM Mono',monospace">
        ◈ Ver rastro do impacto →
      </div>`)
    .addTo(APP.map);
}

function buildMetrics(pt, layer, color) {
  const pairs = {
    ar:[['PM₂.₅',`${(pt.pm25??0).toFixed(1)} µg/m³`],['NO₂',`${(pt.no2??0).toFixed(1)} µg/m³`]],
    agua:[['Turbidez',`${(pt.turbidez??0).toFixed(1)} NTU`],['pH',(pt.ph??0).toFixed(1)]],
    energia:[['Tipo',pt.tipo??'—'],['Carga',`${(pt.carga??0).toFixed(0)}%`]],
    residuos:[['Tipo',pt.tipo??'—'],['Cap.',pt.cap>0?`${pt.cap}%`:'—']],
    solo:[['Agrotóx.',`${(pt.agrotox??0).toFixed(1)}`],['Desmat.',`${(pt.desmat??0).toFixed(0)} ha`]],
    trafego:[['Cong.',`${(pt.cong??0).toFixed(0)}%`],['Ilha calor',`+${(pt.calor??0).toFixed(1)}°C`]],
    saude:[['Tipo',pt.tipo??'—'],['Resp./100k',(pt.resp??0).toFixed(0)]],
  };
  return (pairs[layer]||[]).map(([k,v])=>`
    <div style="background:rgba(0,0,0,.25);padding:5px 7px;border-radius:5px">
      <div style="font-family:'DM Mono',monospace;font-size:8px;color:#475569">${k}</div>
      <div style="font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:${color}">${v}</div>
    </div>`).join('');
}

// ── Gráficos ───────────────────────────────────────────
function renderChart(layer) {
  const { labels, datasets, insight } = generateHistory(layer);
  if (APP.chart) { APP.chart.destroy(); APP.chart = null; }
  const ctx = document.getElementById('main-chart');
  if (!ctx) return;
  APP.chart = new Chart(ctx, {
    type:'line', data:{ labels, datasets },
    options:{
      responsive:true, maintainAspectRatio:false, animation:{ duration:350 },
      interaction:{ intersect:false, mode:'index' },
      plugins:{
        legend:{ labels:{ color:'#94a3b8', font:{ family:'DM Mono', size:10 }, boxWidth:10, boxHeight:2 } },
        tooltip:{ backgroundColor:'#1e2535', borderColor:'#334155', borderWidth:1, titleColor:'#f1f5f9', bodyColor:'#94a3b8', titleFont:{ family:'Syne',size:11 }, bodyFont:{ family:'DM Mono',size:10 } },
      },
      scales:{
        x:{ ticks:{ color:'#475569', font:{ family:'DM Mono',size:9 }, maxTicksLimit:8, maxRotation:0 }, grid:{ color:'rgba(255,255,255,0.04)' } },
        y:{ ticks:{ color:'#475569', font:{ family:'DM Mono',size:9 } }, grid:{ color:'rgba(255,255,255,0.04)' } },
      },
    },
  });
  document.getElementById('chart-insight').textContent = insight;
}

// ── Rastro do Impacto v2 ───────────────────────────────
async function triggerImpact({ lat, lng, nome, layer, id }) {
  // Detecta camada automaticamente pelo id se não fornecida
  if (!layer && id) {
    if (id.startsWith('sa')) layer = 'saude';
    else if (id.startsWith('ar')) layer = 'ar';
    else if (id.startsWith('ag')) layer = 'agua';
    else if (id.startsWith('re')) layer = 'residuos';
    else if (id.startsWith('tr')) layer = 'trafego';
    else if (id.startsWith('en')) layer = 'energia';
    else if (id.startsWith('so')) layer = 'solo';
    else layer = 'saude';
  }
  if (!layer) layer = 'saude';
  if (!nome)  nome  = id || 'Ponto analisado';
  document.getElementById('panel-impact').classList.remove('collapsed');
  document.getElementById('panel-charts').classList.add('collapsed');
  document.getElementById('btn-charts-toggle').classList.remove('active');
  APP.map.flyTo({ center:[lng,lat], zoom:12.5, duration:800 });

  const chain = buildCausalChain(layer, STATE);
  const causeGeo = chain.find(c => c.isCause && c.geo)?.geo;
  drawImpactLine({ lat, lng }, causeGeo||{ lat:lat+0.018, lng:lng+0.022 }, LAYER_COLORS[layer]||'#a855f7');

  document.getElementById('impact-origin-block').innerHTML = `
    <div class="impact-block">
      <div class="ib-label">SINTOMA DETECTADO</div>
      <div class="ib-name">${nome}</div>
      <div class="ib-sub">${layerIcon(layer)} ${layerName(layer)}</div>
    </div>`;

  const chainEl = document.getElementById('impact-chain');
  chainEl.innerHTML = '';
  chain.forEach((item, i) => {
    if (i>0) chainEl.innerHTML += `<div class="chain-arrow">↓</div>`;
    chainEl.innerHTML += `
      <div class="chain-item">
        <div class="chain-dot" style="background:${item.color}"></div>
        <div class="chain-info">
          <div class="chain-type">${item.layer}</div>
          <div class="chain-value" style="color:${item.color}">${item.value}</div>
          <div class="chain-meta">${item.desc}</div>
        </div>
        <span class="ce-badge ${item.isCause?'ce-cause':'ce-effect'}">${item.isCause?'CAUSA':'EFEITO'}</span>
      </div>`;
  });

  document.getElementById('impact-analysis').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);letter-spacing:1px">CAUSAS</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${chain.filter(c=>c.isCause).map(c=>`<span class="ce-badge ce-cause">${c.layer}</span>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);letter-spacing:1px;margin-top:4px">EFEITOS</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${chain.filter(c=>!c.isCause).map(c=>`<span class="ce-badge ce-effect">${c.layer}</span>`).join('')}
      </div>
    </div>`;

  const claudeEl = document.getElementById('impact-claude-text');
  const loadEl   = document.getElementById('impact-loading');
  claudeEl.textContent = ''; loadEl.classList.remove('hidden');

  try {
    const text = await askClaude({
      ponto: nome, camada: layerName(layer),
      dados: { iqa: STATE.ar.iqa, pm25: STATE.ar.pm25.toFixed(1), congestionamento:`${STATE.trafego.congestionamento}%`, turbidez:`${STATE.agua.turbidez.toFixed(1)} NTU`, internacoes:`${STATE.saude.respirat}/100k`, chuva: STATE.clima.chuva>0?`${STATE.clima.chuva}mm/h`:'sem chuva' },
      cadeia: chain.map(c=>`${c.isCause?'CAUSA':'EFEITO'}: ${c.layer} — ${c.value}`).join('\n'),
      instrucao: '3 parágrafos curtos. Linguagem simples para aluno do ensino médio. Use os dados. Termine com uma pergunta de investigação.',
    });
    loadEl.classList.add('hidden');
    await typewriter(claudeEl, text, 12);
  } catch(e) {
    loadEl.classList.add('hidden');
    const cause = chain.find(c=>c.isCause);
    const effect = chain.find(c=>!c.isCause);
    claudeEl.textContent = `O ponto analisado recebe impacto de ${cause?.layer?.toLowerCase()||'fontes identificadas'} com ${cause?.value||'—'}.\n\n${effect?.layer||'O efeito'} registra ${effect?.value||'—'}. Esse padrão é documentado pelo DataSUS e CETESB para esta região.\n\n◉ Para investigar: compare estes dados com uma área verde de SP. O que muda?\n\n[Configure sua chave Claude API para análise aprofundada]`;
  }
}

function buildCausalChain(layer, s) {
  return ({
    ar:[
      { layer:'TRÁFEGO',     color:'#f43f5e', value:`${s.trafego.congestionamento}% das vias`,    desc:'Emissões por combustão',              isCause:true,  geo:{lat:-23.562,lng:-46.655} },
      { layer:'ATMOSFERA',   color:'#f97316', value:`PM₂.₅ ${s.ar.pm25.toFixed(1)} µg/m³`,      desc:`IQA ${s.ar.iqa}`,                     isCause:false, geo:null },
      { layer:'SAÚDE',       color:'#ec4899', value:`${s.saude.respirat} intern./100k`,           desc:'Doenças respiratórias (CID J00-J99)', isCause:false, geo:null },
    ],
    agua:[
      { layer:'CHUVA',       color:'#0ea5e9', value:s.clima.chuva>0?`${s.clima.chuva}mm/h`:'Escoamento crônico', desc:'Arrasta contaminantes', isCause:true, geo:{lat:-23.503,lng:-46.605} },
      { layer:'RESÍDUOS',    color:'#22c55e', value:`${s.residuos.pts_irreg.toLocaleString('pt-BR')} pontos irreg.`, desc:'Entulho nos bueiros', isCause:true, geo:{lat:-23.535,lng:-46.455} },
      { layer:'HIDROSFERA',  color:'#0ea5e9', value:`Turbidez ${s.agua.turbidez.toFixed(1)} NTU`, desc:s.agua.balneab, isCause:false, geo:null },
    ],
    energia:[
      { layer:'TEMPERATURA', color:'#f97316', value:`${s.clima.temp}°C`,                         desc:'Demanda de ar-condicionado',          isCause:true,  geo:{lat:-23.552,lng:-46.638} },
      { layer:'MATRIZ',      color:'#a855f7', value:`Térmica ${s.energia.termica}%`,              desc:`Bandeira ${s.energia.banda}`,         isCause:false, geo:null },
      { layer:'ATMOSFERA',   color:'#f97316', value:'CO₂ adicional',                             desc:'+1.2 MtCO₂ por 1% de térmica',       isCause:false, geo:null },
    ],
    trafego:[
      { layer:'DENSIDADE',   color:'#f43f5e', value:`${s.trafego.congestionamento}% das vias`,   desc:'Hora pico + chuva',                   isCause:true,  geo:{lat:-23.562,lng:-46.720} },
      { layer:'ILHA DE CALOR',color:'#fb923c',value:`+${s.trafego.ilha_calor}°C`,                desc:'Acima da periferia verde',            isCause:false, geo:null },
      { layer:'SAÚDE',       color:'#ec4899', value:'Estresse cardiovascular',                   desc:'Risco em idosos e crianças',          isCause:false, geo:null },
    ],
    residuos:[
      { layer:'DESCARTE IRREG.',color:'#22c55e',value:`${s.residuos.pts_irreg.toLocaleString('pt-BR')} pontos`, desc:'Periferia e fundos de vale', isCause:true, geo:{lat:-23.535,lng:-46.455} },
      { layer:'SOLO/ÁGUA',   color:'#84cc16', value:'Lixiviação',                                desc:'Metais no lençol freático',           isCause:false, geo:null },
      { layer:'VETORES',     color:'#ec4899', value:`${s.saude.intox.toFixed(1)} intox./100k`,   desc:'Dengue, leptospirose',               isCause:false, geo:null },
    ],
    solo:[
      { layer:'AGROTÓXICOS', color:'#84cc16', value:`${s.solo.agrotox.toFixed(1)} kg/ha`,        desc:'Cultivos periurbanos',                isCause:true,  geo:{lat:-23.689,lng:-47.120} },
      { layer:'HIDROSFERA',  color:'#0ea5e9', value:`pH ${s.agua.ph.toFixed(1)}`,                desc:'Acidificação de rios',                isCause:false, geo:null },
      { layer:'SAÚDE',       color:'#ec4899', value:`${s.saude.intox.toFixed(1)} intox./100k`,   desc:'Intoxicações rurais e periurbanas',  isCause:false, geo:null },
    ],
    saude:[
      { layer:'AR',          color:'#f97316', value:`IQA ${s.ar.iqa} — PM₂.₅ ${s.ar.pm25.toFixed(1)}`, desc:'Principal vetor respiratório', isCause:true, geo:{lat:-23.548,lng:-46.638} },
      { layer:'TRÁFEGO',     color:'#f43f5e', value:`${s.trafego.congestionamento}% congestionado`, desc:'Exposição diária prolongada',      isCause:true,  geo:null },
      { layer:'INTERNAÇÕES', color:'#ec4899', value:`${s.saude.respirat}/100k`,                  desc:'CID J00-J99 DataSUS',                isCause:false, geo:null },
    ],
  })[layer] || [];
}

function typewriter(el, text, delay=12) {
  return new Promise(resolve => {
    let i=0;
    const iv = setInterval(()=>{ el.textContent+=text[i++]; if(i>=text.length){clearInterval(iv);resolve();} }, delay);
  });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 2000);
}

function layerName(l) { return {ar:'Atmosfera',agua:'Hidrosfera',energia:'Matriz Elétrica',residuos:'Resíduos',solo:'Solo/Biosfera',trafego:'Tráfego & Clima',saude:'Saúde Pública'}[l]||l; }
function layerIcon(l) { return {ar:'💨',agua:'💧',energia:'⚡',residuos:'♻',solo:'🌱',trafego:'🚦',saude:'🏥'}[l]||'◉'; }

init();

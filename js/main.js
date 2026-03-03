/**
 * Urban Lens — main.js
 * Motor GIS de simulação urbana · SP
 * Arquitetura limpa: boot único, sem duplicações
 */

import { CRISES, CAMADAS, ZONAS_GEOJSON, VERDE_GEOJSON } from './geodata.js';

// ─── Estado global ────────────────────────────────────────
const S = {
  crise:    null,
  idx:      0,
  fase:     0,         // 0–5
  seg:      600,
  timerID:  null,
  faseID:   null,
  chatID:   null,
  chatIdx:  0,
  map:      null,
  chart:    null,
  anchors:  [],        // {marker, el, popup}
  camadas:  new Set(['ar','agua','temp','trafego','energia','residuos','solo','saude']),
  glL:      [],        // gl layer ids
  glS:      [],        // gl source ids
};

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', boot);

function boot() {
  buildLayersPanel();
  initMap();
  document.getElementById('btn-next').onclick    = () => load((S.idx+1) % CRISES.length);
  document.getElementById('btn-restart').onclick = () => load(S.idx);
}

// ─── Mapa ─────────────────────────────────────────────────
function initMap() {
  const STYLES = [
    'https://tiles.openfreemap.org/styles/positron',
    'https://demotiles.maplibre.org/style.json',
  ];
  (function try_(i) {
    if (i >= STYLES.length) {
      document.getElementById('map-loader').textContent = 'Erro ao carregar mapa.';
      return;
    }
    S.map = new maplibregl.Map({
      container:'map', style:STYLES[i],
      center:[-46.636,-23.550], zoom:11,
      attributionControl:false,
    });
    S.map.addControl(new maplibregl.AttributionControl({compact:true}), 'bottom-right');
    S.map.addControl(new maplibregl.NavigationControl({showCompass:false}), 'bottom-right');
    S.map.on('error', () => { S.map.remove(); try_(i+1); });
    S.map.on('load',  () => {
      document.getElementById('map-loader').style.display = 'none';
      load(0);
    });
  })(0);
}

// ─── Carrega Crise ────────────────────────────────────────
function load(idx) {
  // Stop timers
  clearInterval(S.timerID);
  clearInterval(S.faseID);
  clearInterval(S.chatID);

  // Reset estado
  S.idx   = idx;
  S.crise = CRISES[idx];
  S.fase  = 0;
  S.seg   = 600;
  S.chatIdx = 0;

  // Limpa mapa
  S.anchors.forEach(({marker, popup}) => { marker.remove(); try{popup.remove();}catch(e){} });
  S.anchors = [];
  clearGL();

  // Voa para âncora
  S.map.flyTo({ center:S.crise.mapCentro, zoom:S.crise.mapZoom, duration:1300 });

  // Renderiza GeoJSON
  renderGeo();

  // Planta âncora
  plantAnchor();

  // UI
  renderBanner();
  renderBrief();
  buildPhaseList();
  renderPhase();
  buildLayersPanel();
  buildLegend();
  renderKPIs();
  buildChart();
  renderChat();

  // Timers
  S.timerID = setInterval(tickTimer,  1000);
  S.faseID  = setInterval(tickFase, 120000); // 2min reais por fase
  // Para demo rápido, troque 120000 → 20000 (20s)
}

// ─── GeoJSON Layers ───────────────────────────────────────
function renderGeo() {
  clearGL();
  if (S.camadas.has('zoneamento')) addZoneLayer();
  if (S.camadas.has('solo'))       addVerdeLayer();
}

function addZoneLayer() {
  addSrc('z-src', { type:'geojson', data: ZONAS_GEOJSON });
  addLyr({ id:'z-fill', type:'fill', source:'z-src',
    paint:{ 'fill-color':['get','cor'], 'fill-opacity':['get','opac'] }
  });
  addLyr({ id:'z-line', type:'line', source:'z-src',
    paint:{ 'line-color':['get','cor'], 'line-width':1.5, 'line-opacity':0.5 }
  });
  S.map.on('click','z-fill', e => {
    const p = e.features[0]?.properties;
    if (!p) return;
    const labels = { central:'Centro Histórico', comercial:'Área Comercial', industrial:'Industrial', 'residencial-alto':'Residencial Alto Padrão', periferia:'Periferia' };
    popup(e.lngLat, `<div class="pop-wrap">
      <div class="pop-tag">🗺️ Zoneamento</div>
      <div class="pop-name">${p.nome}</div>
      <div class="pop-loc">${labels[p.tipo]||p.tipo}</div>
    </div>`);
  });
  cursor('z-fill');
}

function addVerdeLayer() {
  addSrc('v-src', { type:'geojson', data: VERDE_GEOJSON });
  addLyr({ id:'v-fill', type:'fill', source:'v-src',
    paint:{ 'fill-color':'#15803d', 'fill-opacity':0.28 }
  });
  addLyr({ id:'v-line', type:'line', source:'v-src',
    paint:{ 'line-color':'#14532d', 'line-width':1.5, 'line-opacity':0.6, 'line-dasharray':[4,2] }
  });
  S.map.on('click','v-fill', e => {
    const p = e.features[0]?.properties;
    if (!p) return;
    popup(e.lngLat, `<div class="pop-wrap">
      <div class="pop-tag" style="color:#15803d">🌳 Área Verde</div>
      <div class="pop-name">${p.nome}</div>
      <div class="pop-loc">${p.area_ha ? p.area_ha.toLocaleString('pt-BR')+' ha' : ''}</div>
    </div>`);
  });
  cursor('v-fill');
}

function addSrc(id, spec) {
  try { if (!S.map.getSource(id)) { S.map.addSource(id, spec); S.glS.push(id); } } catch(e){}
}
function addLyr(spec) {
  try { if (!S.map.getLayer(spec.id)) { S.map.addLayer(spec); S.glL.push(spec.id); } } catch(e){}
}
function cursor(layer) {
  S.map.on('mouseenter', layer, () => S.map.getCanvas().style.cursor='pointer');
  S.map.on('mouseleave', layer, () => S.map.getCanvas().style.cursor='');
}
function clearGL() {
  S.glL.forEach(id => { try{ if(S.map?.getLayer(id)) S.map.removeLayer(id); }catch(e){} });
  S.glS.forEach(id => { try{ if(S.map?.getSource(id)) S.map.removeSource(id); }catch(e){} });
  S.glL=[]; S.glS=[];
}
function popup(lngLat, html) {
  new maplibregl.Popup({ closeButton:true, offset:4 }).setLngLat(lngLat).setHTML(html).addTo(S.map);
}

// ─── Âncora ───────────────────────────────────────────────
function plantAnchor() {
  const c   = S.crise;
  const cfg = CAMADAS.find(x => x.id === c.camadaDestaque) || CAMADAS[0];
  const el  = makeAnchorEl(cfg, 0);

  const pop = makeAnchorPopup(c, cfg);

  el.addEventListener('mouseenter', () => { if (!el._fx) pop.setLngLat([c.ancora.lng, c.ancora.lat]).addTo(S.map); });
  el.addEventListener('mouseleave', () => { if (!el._fx) setTimeout(()=>pop.remove(), 120); });
  el.addEventListener('click', e => {
    e.stopPropagation();
    el._fx = !el._fx;
    if (el._fx) pop.setLngLat([c.ancora.lng, c.ancora.lat]).addTo(S.map);
    else        pop.remove();
  });

  const marker = new maplibregl.Marker({ element:el, anchor:'center' })
    .setLngLat([c.ancora.lng, c.ancora.lat]).addTo(S.map);
  S.anchors.push({ marker, el, popup:pop, cfg });
}

function makeAnchorEl(cfg, fase) {
  const SIZES = [44,50,58,66,74,82];
  const OPACS = [0.75,0.82,0.88,0.93,0.97,1.0];
  const sz = SIZES[fase], op = OPACS[fase];
  const wrap = document.createElement('div');
  wrap.className = 'anchor-marker';
  const bg = document.createElement('div');
  bg.className = `anchor-bg pulse-${fase}`;
  bg.style.cssText = `width:${sz}px;height:${sz}px;background:${cfg.cor};opacity:${op};font-size:${Math.round(sz*.44)}px;`;
  bg.textContent = cfg.emoji;
  const lbl = document.createElement('div');
  lbl.className = 'anchor-label';
  lbl.textContent = cfg.nome.toUpperCase();
  wrap.appendChild(bg); wrap.appendChild(lbl);
  wrap._bg = bg; return wrap;
}

function makeAnchorPopup(c, cfg) {
  const fase = S.fase;
  const metricas = c.kpis.slice(0,4).map(k => {
    const v = k.vals[fase], alrt = v > k.alerta;
    return `<div class="pop-m" style="--pm-c:${alrt?'var(--red)':cfg.cor}">
      <div class="pop-mk">${k.lbl}</div>
      <div class="pop-mv">${v}</div>
      <div class="pop-mu">${k.unit}</div>
    </div>`;
  }).join('');
  const alrt = c.kpis[0] && c.kpis[0].vals[fase] > c.kpis[0].alerta;
  return new maplibregl.Popup({ closeButton:true, closeOnClick:false, maxWidth:'260px', offset:22 })
    .setHTML(`<div class="pop-wrap">
      <div class="pop-tag" style="color:${cfg.cor}">${cfg.emoji} ${cfg.nome.toUpperCase()}</div>
      <div class="pop-name">${c.ancora.nome}</div>
      <div class="pop-loc">📍 Fase ${fase+1}/6</div>
      <div class="pop-grid">${metricas}</div>
      ${alrt?`<div class="pop-alert">⚠ Nível crítico atingido</div>`:''}
    </div>`);
}

function updateAnchor() {
  const SIZES=[44,50,58,66,74,82], OPACS=[0.75,0.82,0.88,0.93,0.97,1.0];
  S.anchors.forEach(({el, cfg}) => {
    const bg=el._bg; if(!bg) return;
    const sz=SIZES[S.fase]; const op=OPACS[S.fase];
    bg.style.width=sz+'px'; bg.style.height=sz+'px';
    bg.style.opacity=op; bg.style.fontSize=Math.round(sz*.44)+'px';
    bg.className=`anchor-bg pulse-${S.fase}`;
  });
}

// ─── Banner Live News ─────────────────────────────────────
function renderBanner() {
  document.getElementById('bn-text').textContent = S.crise.banner;
  document.getElementById('crisis-n').textContent = String(S.idx+1).padStart(2,'0');
  document.getElementById('crisis-of').textContent = 'DE 10 CRISES';
  document.getElementById('banner').className = S.fase >= 4 ? 'critical' : '';
}

// ─── Brief da Crise ───────────────────────────────────────
function renderBrief() {
  document.getElementById('cb-titulo').textContent = S.crise.titulo;
  const fase = S.crise.fases[S.fase];
  const el   = document.getElementById('cb-fase');
  el.textContent = fase ? `T=${fase.minuto}min — ${fase.descricao}` : '';
}

// ─── Lista de Fases ───────────────────────────────────────
function buildPhaseList() {
  const wrap = document.getElementById('phase-list');
  if (!wrap) return;
  wrap.innerHTML = '';
  S.crise.fases.forEach((f, i) => {
    const cls = i===0 ? 'active' : '';
    const txt = f.descricao.length>55 ? f.descricao.slice(0,55)+'…' : f.descricao;
    wrap.insertAdjacentHTML('beforeend',
      `<div class="ph-item ${cls}" data-i="${i}">
        <div class="ph-num">${i+1}</div>
        <div class="ph-txt">${txt}</div>
      </div>`);
  });
}

function renderPhase() {
  const pct = (S.fase / 5) * 100;
  const bar = document.getElementById('phase-bar');
  bar.style.width      = pct + '%';
  bar.style.background = S.fase >= 4 ? '#cc1100' : '#cc1100';
  document.querySelectorAll('.ph-item').forEach((el,i) => {
    el.classList.remove('active','done');
    if (i < S.fase)  el.classList.add('done');
    if (i === S.fase) el.classList.add('active');
    const txt = el.querySelector('.ph-txt');
    if (txt && S.crise.fases[i]) {
      const d = S.crise.fases[i].descricao;
      txt.textContent = d.length>55 ? d.slice(0,55)+'…' : d;
    }
  });
}

// ─── Painel de Camadas ────────────────────────────────────
function buildLayersPanel() {
  const wrap = document.getElementById('layers');
  if (!wrap) return;
  wrap.innerHTML = '';
  CAMADAS.forEach(cfg => {
    const on  = S.camadas.has(cfg.id);
    const row = document.createElement('div');
    row.className = `layer-row ${on?'active':'off'}`;
    row.style.setProperty('--lc', cfg.cor);
    row.dataset.id = cfg.id;
    row.innerHTML = `
      <span class="lr-emoji">${cfg.emoji}</span>
      <div class="lr-info">
        <div class="lr-name">${cfg.nome}</div>
        <div class="lr-descr">${cfg.descr}</div>
      </div>
      <div class="lr-toggle"></div>`;
    row.addEventListener('click', () => {
      if (S.camadas.has(cfg.id)) S.camadas.delete(cfg.id);
      else                       S.camadas.add(cfg.id);
      document.querySelectorAll('.layer-row').forEach(r => {
        const on2 = S.camadas.has(r.dataset.id);
        r.className = `layer-row ${on2?'active':'off'}`;
        r.style.setProperty('--lc', CAMADAS.find(c=>c.id===r.dataset.id)?.cor||'#111');
      });
      clearGL();
      renderGeo();
      buildLegend();
    });
    wrap.appendChild(row);
  });
}

function buildLegend() {
  const wrap = document.getElementById('map-legend');
  if (!wrap) return;
  const ativas = CAMADAS.filter(c => S.camadas.has(c.id));
  wrap.innerHTML = '';
  wrap.style.display = ativas.length ? 'block' : 'none';
  ativas.forEach(c => {
    wrap.insertAdjacentHTML('beforeend',
      `<div class="leg-row">
        <div class="leg-sw" style="background:${c.cor}"></div>
        <span class="leg-nm">${c.emoji} ${c.nome}</span>
      </div>`);
  });
}

// ─── KPIs (painel direito) ────────────────────────────────
function renderKPIs() {
  const c   = S.crise;
  const cfg = CAMADAS.find(x=>x.id===c.camadaDestaque) || CAMADAS[0];
  document.getElementById('pr-layer').textContent = `${cfg.emoji} ${cfg.nome}`;
  const wrap = document.getElementById('kpis-grid');
  if (!wrap) return;
  wrap.innerHTML = '';
  c.kpis.forEach(kpi => {
    const v    = kpi.vals[S.fase];
    const prev = kpi.vals[Math.max(0,S.fase-1)];
    const d    = v - prev;
    const pct  = prev>0 ? Math.abs((d/prev)*100).toFixed(0) : 0;
    const alrt = v > kpi.alerta;
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.style.setProperty('--kc', alrt ? 'var(--red)' : cfg.cor);
    card.innerHTML = `
      <div class="kpi-label">${kpi.lbl}</div>
      <div class="kpi-value ${alrt?'alert':''}">${v}</div>
      <div class="kpi-unit">${kpi.unit}</div>
      <div class="kpi-delta ${d>0?'up':d<0?'ok':'same'}">
        ${d>0?'▲':d<0?'▼':'—'} ${Math.abs(d)} (${pct}%)
      </div>`;
    wrap.appendChild(card);
  });
}

// ─── Gráfico ─────────────────────────────────────────────
function buildChart() {
  const c   = S.crise;
  const cfg = CAMADAS.find(x=>x.id===c.camadaDestaque)||CAMADAS[0];
  const lbl = c.fases.map(f=>`${f.minuto}min`);
  const datasets = c.kpis.slice(0,3).map((kpi,i) => ({
    label: `${kpi.lbl}${kpi.unit?' ('+kpi.unit+')':''}`,
    data:  kpi.vals,
    borderColor: cfg.cor,
    backgroundColor: i===0 ? cfg.cor+'18' : 'transparent',
    borderWidth: i===0 ? 2.5 : 1.5,
    borderDash: i>0 ? [5,3] : [],
    pointRadius: 5, pointHoverRadius: 8,
    pointBackgroundColor:'#fff', pointBorderColor:cfg.cor, pointBorderWidth:2,
    fill: i===0, tension:0.32,
  }));

  const nowLine = {
    id:'nl',
    afterDraw(ch) {
      const {ctx,scales:{x,y}} = ch;
      const px = x.getPixelForValue(S.fase);
      ctx.save();
      ctx.strokeStyle='#cc1100'; ctx.lineWidth=2; ctx.setLineDash([5,3]); ctx.globalAlpha=.75;
      ctx.beginPath(); ctx.moveTo(px,y.top); ctx.lineTo(px,y.bottom); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha=1; ctx.fillStyle='#cc1100';
      ctx.font='bold 10px Barlow Condensed,sans-serif';
      ctx.fillText('AGORA',px+4,y.top+13);
      ctx.restore();
    }
  };

  if (S.chart) { S.chart.destroy(); S.chart=null; }
  const canvas = document.getElementById('chart');
  if (!canvas) return;
  S.chart = new Chart(canvas, {
    type:'line', data:{labels:lbl, datasets}, plugins:[nowLine],
    options:{
      responsive:true, maintainAspectRatio:false, animation:{duration:450},
      interaction:{intersect:false, mode:'index'},
      plugins:{
        legend:{ labels:{ color:'#333', font:{family:'Barlow Condensed',size:11}, boxWidth:12, boxHeight:2, padding:10 } },
        tooltip:{ backgroundColor:'#fff', borderColor:'#111', borderWidth:2, titleColor:'#111', bodyColor:'#333',
          titleFont:{family:'Barlow Condensed',weight:'bold',size:13}, bodyFont:{family:'Barlow',size:12}, padding:10, cornerRadius:3 },
      },
      scales:{
        x:{ ticks:{color:'#555',font:{family:'Barlow Condensed',size:12},maxRotation:0}, grid:{color:'rgba(0,0,0,.06)'} },
        y:{ ticks:{color:'#555',font:{family:'Barlow Condensed',size:12}},               grid:{color:'rgba(0,0,0,.06)'} },
      },
    },
  });
}

// ─── Chat de Investigação ────────────────────────────────
function renderChat() {
  const wrap = document.getElementById('chat-messages');
  if (!wrap) return;
  wrap.innerHTML='';
  S.chatIdx=0;
  showNextChatMsg();
  S.chatID = setInterval(showNextChatMsg, 90000); // 90s entre msgs
  // Demo rápido: troque 90000 → 18000 (18s)
}

function showNextChatMsg() {
  const msgs = S.crise?.chat;
  if (!msgs || S.chatIdx >= msgs.length) { clearInterval(S.chatID); return; }
  const msg  = msgs[S.chatIdx++];
  const wrap = document.getElementById('chat-messages');
  if (!wrap) return;
  const isQ  = msg.msg.includes('?');
  const initials = msg.de.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
  const div = document.createElement('div');
  div.className='chat-msg';
  div.innerHTML=`
    <div class="chat-who">
      <span class="chat-who-badge">${initials}</span>
      <strong>${msg.de}</strong>
      <span class="chat-time">${msg.t}</span>
    </div>
    <div class="chat-bubble ${isQ?'question':''}">${msg.msg}</div>`;
  wrap.appendChild(div);
  wrap.scrollTop=wrap.scrollHeight;
}

// ─── Timer ────────────────────────────────────────────────
function tickTimer() {
  S.seg = Math.max(0, S.seg-1);
  const m=Math.floor(S.seg/60), s=S.seg%60;
  document.getElementById('timer-clock').textContent =
    `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const pct=S.seg/600;
  document.getElementById('timer-fill').style.width   = (pct*100)+'%';
  document.getElementById('timer-fill').style.background = S.seg<120?'#ff6b6b':'#fff';
  if (S.seg===0) clearInterval(S.timerID);
}

// ─── Avanço de Fase ──────────────────────────────────────
function tickFase() {
  if (S.fase>=5) { clearInterval(S.faseID); return; }
  S.fase++;
  renderBanner();
  renderBrief();
  renderPhase();
  renderKPIs();
  if (S.chart) S.chart.update('active');
  updateAnchor();
  showNextChatMsg();
  // Flash de fase no mapa
  const f = document.createElement('div');
  f.id='map-phase-flash';
  document.getElementById('map-wrap').appendChild(f);
  setTimeout(()=>f.remove(), 2600);
}

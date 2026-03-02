/**
 * impact.js — Sistema "Rastro do Impacto"
 *
 * Ao clicar em um ponto crítico:
 *  1. Filtra emissores próximos (≤ 5km) via dados em cache
 *  2. Identifica o de maior intensidade
 *  3. Desenha linha 3D brilhante no mapa
 *  4. Monta JSON estruturado
 *  5. Envia para claude.js → exibe resposta no HUD
 *
 * Claude NÃO faz cálculo geográfico — recebe tudo pronto.
 */

import { haversineKm } from './data.js';
import { askClaude } from './claude.js';

const IMPACT_LINE_SOURCE = 'impact-line-source';
const IMPACT_LINE_LAYER  = 'impact-line-layer';
const IMPACT_POINT_LAYER = 'impact-point-layer';
const IMPACT_RADIUS_KM   = 5;

let _state = null;  // referência ao estado global do app

/**
 * Inicializa o sistema de Rastro do Impacto.
 * Escuta o evento global 'impact:trigger' disparado pelo layers.js ou demo.
 *
 * @param {Object} appState - estado global da aplicação
 */
export function bindImpact(appState) {
  _state = appState;

  window.addEventListener('impact:trigger', async (e) => {
    await handleImpact(e.detail);
  });

  // Botão fechar
  document.getElementById('btn-close-impact').addEventListener('click', () => {
    closeImpactPanel();
    removeImpactLine(_state.map);
  });
}

/**
 * Processa um evento de impacto.
 * @param {Object} detail - dados do evento (lngLat, _label, etc.)
 */
async function handleImpact(detail) {
  const { lngLat, _label, _tipo, _intensidade, _demo } = detail;
  const center = { lat: lngLat.lat, lng: lngLat.lng };

  // Coleta todos os dados disponíveis nas camadas ativas
  const allData = getAllCachedData();

  if (allData.length === 0 && !_demo) {
    showToastFallback('Ative ao menos uma camada para analisar proximidades.');
    return;
  }

  // Filtro por proximidade
  const nearby = filterNearby(allData, center, IMPACT_RADIUS_KM);

  // Seleciona o emissor de maior intensidade
  const topEmitter = nearby.length > 0
    ? nearby[0]
    : _demo ? generateDemoEmitter(center) : null;

  if (!topEmitter && !_demo) {
    showToastFallback('Nenhum emissor encontrado no raio de 5km.');
    return;
  }

  const emitter = topEmitter || generateDemoEmitter(center);

  // Abre painel de impacto
  openImpactPanel({
    origin:   { lat: center.lat, lng: center.lng, nome: _label || 'Ponto selecionado' },
    emitter,
    nearby:   nearby.length,
  });

  // Desenha linha no mapa
  drawImpactLine(_state.map, center, {
    lat: emitter.latitude,
    lng: emitter.longitude,
  });

  // Voa para mostrar a linha
  _state.map.flyTo({
    center: [
      (center.lng + emitter.longitude) / 2,
      (center.lat + emitter.latitude) / 2,
    ],
    zoom: 13,
    pitch: 60,
    duration: 1200,
  });

  // Monta payload para Claude
  const payload = buildClaudePayload({
    origin:  { lat: center.lat, lng: center.lng, nome: _label || 'Local selecionado' },
    emitter,
    nearby:  nearby.length,
    radius:  IMPACT_RADIUS_KM,
  });

  // Solicita análise ao Claude
  await requestClaudeAnalysis(payload);
}

/**
 * Filtra registros dentro do raio de impacto, ordenados por intensidade desc.
 */
function filterNearby(data, center, radiusKm) {
  return data
    .map(r => ({
      ...r,
      _distKm: haversineKm(center.lat, center.lng, r.latitude, r.longitude),
    }))
    .filter(r => r._distKm <= radiusKm)
    .sort((a, b) => b.intensidade - a.intensidade);
}

/**
 * Agrega todos os datasets carregados em cache.
 */
function getAllCachedData() {
  const all = [];
  for (const key of Object.keys(_state.datasets)) {
    if (_state.datasets[key]) {
      all.push(..._state.datasets[key]);
    }
  }
  return all;
}

/**
 * Emitter de demonstração quando não há dados reais.
 */
function generateDemoEmitter(center) {
  // Offset ~2km
  return {
    latitude:   center.lat + 0.018,
    longitude:  center.lng + 0.015,
    tipo:       'Estação CETESB',
    nome:       'Estação Pinheiros (CETESB) [DEMO]',
    intensidade: 0.78,
    fonte:       'CETESB',
    data:        new Date().toISOString().slice(0, 10),
    _distKm:     haversineKm(center.lat, center.lng, center.lat + 0.018, center.lng + 0.015),
  };
}

/**
 * Monta JSON estruturado para envio ao Claude.
 * Claude não recebe coordenadas brutas — recebe contexto interpretável.
 */
function buildClaudePayload({ origin, emitter, nearby, radius }) {
  return {
    sistema: 'Mapa Social — São Paulo',
    timestamp: new Date().toISOString(),
    analise: 'rastro_do_impacto',
    ponto_de_referencia: {
      nome:     origin.nome,
      latitude: origin.lat.toFixed(5),
      longitude: origin.lng.toFixed(5),
    },
    emissor_proximo: {
      nome:        emitter.nome || emitter.tipo,
      tipo:        emitter.tipo,
      fonte:       emitter.fonte,
      intensidade: Math.round(emitter.intensidade * 100) + '%',
      distancia_km: emitter._distKm.toFixed(2),
      ultima_leitura: emitter.data,
    },
    contexto: {
      raio_analisado_km: radius,
      total_emissores_encontrados: nearby,
    },
    instrucao:
      'Analise a relação socioambiental entre o ponto de referência (equipamento de saúde ou local urbano) e o emissor mais próximo. Explique em linguagem acessível para estudantes do ensino médio quais são os possíveis impactos na saúde pública, considerando a distância e a intensidade do emissor. Seja direto, didático e termine com uma pergunta reflexiva.',
  };
}

/**
 * Solicita análise ao Claude e exibe no painel HUD.
 */
async function requestClaudeAnalysis(payload) {
  const loadingEl = document.getElementById('impact-claude-loading');
  const textEl    = document.getElementById('impact-claude-text');

  loadingEl.classList.remove('hidden');
  textEl.textContent = '';

  try {
    const response = await askClaude(payload);
    loadingEl.classList.add('hidden');
    // Efeito de "digitação" caractere por caractere
    await typewriterEffect(textEl, response, 18);
  } catch (err) {
    loadingEl.classList.add('hidden');
    textEl.style.color = '#ff4444';
    textEl.textContent = `[ERRO] ${err.message}\n\nInsira sua chave Claude API nas configurações para análise automática.`;
  }
}

/**
 * Abre e preenche o painel de impacto lateral.
 */
function openImpactPanel({ origin, emitter, nearby }) {
  document.getElementById('impact-origin').innerHTML = `
    <strong>PONTO DE REFERÊNCIA</strong>
    ${origin.nome}
    <div style="color:#666;font-size:9px">${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}</div>
  `;
  document.getElementById('impact-emitter').innerHTML = `
    <strong>EMISSOR MAIS PRÓXIMO</strong>
    ${emitter.nome || emitter.tipo}
    <div style="color:#666;font-size:9px">Fonte: ${emitter.fonte}</div>
  `;
  document.getElementById('impact-distance').innerHTML =
    `<span style="color:#ffb300">DISTÂNCIA:</span> ${emitter._distKm.toFixed(2)} km`;
  document.getElementById('impact-intensity').innerHTML =
    `<span style="color:#ffb300">INTENSIDADE:</span> ${Math.round(emitter.intensidade * 100)}% — ${nearby} emissores no raio de 5km`;

  document.getElementById('panel-impact').classList.remove('panel-hidden');
}

/**
 * Fecha o painel de impacto.
 */
function closeImpactPanel() {
  document.getElementById('panel-impact').classList.add('panel-hidden');
  document.getElementById('impact-claude-text').textContent = '';
  document.getElementById('impact-claude-loading').classList.add('hidden');
}

/**
 * Desenha linha brilhante entre origem e emissor no mapa.
 * Usa layer GeoJSON com propriedades de animação via CSS/MapLibre.
 *
 * @param {maplibregl.Map} map
 * @param {{lat, lng}} from
 * @param {{lat, lng}} to
 */
function drawImpactLine(map, from, to) {
  removeImpactLine(map);

  const lineData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [from.lng, from.lat],
            [to.lng,   to.lat],
          ],
        },
      },
      // Ponto de destino (emissor)
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [to.lng, to.lat],
        },
        properties: { isEmitter: true },
      },
    ],
  };

  map.addSource(IMPACT_LINE_SOURCE, { type: 'geojson', data: lineData });

  // Linha de impacto — stroke âmbar brilhante
  map.addLayer({
    id:     IMPACT_LINE_LAYER,
    type:   'line',
    source: IMPACT_LINE_SOURCE,
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {
      'line-color':   '#c084fc',
      'line-width':   2.5,
      'line-blur':    1,
      'line-opacity': 0.9,
    },
    layout: {
      'line-cap':  'round',
      'line-join': 'round',
    },
  });

  // Ponto do emissor — círculo pulsante
  map.addLayer({
    id:     IMPACT_POINT_LAYER,
    type:   'circle',
    source: IMPACT_LINE_SOURCE,
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius':       12,
      'circle-color':        'transparent',
      'circle-stroke-color': '#c084fc',
      'circle-stroke-width': 2,
      'circle-blur':         0.5,
    },
  });
}

/**
 * Remove a linha de impacto do mapa.
 * @param {maplibregl.Map} map
 */
export function removeImpactLine(map) {
  [IMPACT_LINE_LAYER, IMPACT_POINT_LAYER].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(IMPACT_LINE_SOURCE)) map.removeSource(IMPACT_LINE_SOURCE);
}

/**
 * Efeito de máquina de escrever para o texto do Claude.
 * @param {HTMLElement} el
 * @param {string}      text
 * @param {number}      delay - ms por caractere
 */
function typewriterEffect(el, text, delay = 20) {
  return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, delay);
  });
}

/**
 * Toast simples quando impacto não pode ser calculado.
 */
function showToastFallback(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 3000);
}

/**
 * layers.js — Gerenciamento de camadas MapLibre
 *
 * Cada camada socioambiental tem:
 *  - Cor e símbolo próprio
 *  - Escala por intensidade
 *  - Popup informativo ao clicar
 *  - Evento para acionar o Rastro do Impacto
 */

// ── Configuração visual de cada camada ────────────────────
export const LAYER_CONFIGS = {
  ar: {
    id:         'layer-ar',
    sourceId:   'source-ar',
    color:      '#ffb300',   // âmbar — qualidade do ar
    glowColor:  'rgba(255,179,0,0.3)',
    minRadius:  4,
    maxRadius:  18,
    label:      'Qualidade do Ar',
    icon:       '◈',
  },
  focos: {
    id:         'layer-focos',
    sourceId:   'source-focos',
    color:      '#ff4444',   // vermelho — focos de calor
    glowColor:  'rgba(255,68,68,0.3)',
    minRadius:  5,
    maxRadius:  22,
    label:      'Foco de Calor',
    icon:       '◉',
  },
  saude: {
    id:         'layer-saude',
    sourceId:   'source-saude',
    color:      '#c084fc',   // roxo — saúde
    glowColor:  'rgba(192,132,252,0.25)',
    minRadius:  4,
    maxRadius:  14,
    label:      'Equipamento de Saúde',
    icon:       '◇',
  },
};

/**
 * Converte array de registros para GeoJSON FeatureCollection.
 * @param {Array} records
 * @returns {GeoJSON.FeatureCollection}
 */
function recordsToGeoJSON(records) {
  return {
    type: 'FeatureCollection',
    features: records.map(r => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [r.longitude, r.latitude],
      },
      properties: {
        tipo:       r.tipo,
        intensidade: r.intensidade,
        data:       r.data,
        fonte:      r.fonte,
        nome:       r.nome || r.tipo,
        latitude:   r.latitude,
        longitude:  r.longitude,
      },
    })),
  };
}

/**
 * Adiciona uma camada de dados ao mapa.
 * Cria source + duas layers (halo de brilho + ponto central).
 *
 * @param {maplibregl.Map} map
 * @param {string}         key   - 'ar' | 'focos' | 'saude'
 * @param {Array}          data  - registros carregados
 */
export function addLayer(map, key, data) {
  const cfg = LAYER_CONFIGS[key];
  if (!cfg) return;

  const geojson = recordsToGeoJSON(data);

  // Remove se já existia
  removeLayer(map, key);

  // Adiciona source
  map.addSource(cfg.sourceId, {
    type: 'geojson',
    data: geojson,
    cluster: false,  // sem clustering para manter pontos individuais visíveis
  });

  // Layer 1: Halo de brilho (círculo maior, semitransparente)
  map.addLayer({
    id:     `${cfg.id}-halo`,
    type:   'circle',
    source: cfg.sourceId,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'intensidade'],
        0, cfg.minRadius * 2,
        1, cfg.maxRadius * 3,
      ],
      'circle-color':   cfg.glowColor,
      'circle-blur':    1.2,
      'circle-opacity': 0.6,
    },
  });

  // Layer 2: Ponto central sólido — escala por intensidade
  map.addLayer({
    id:     cfg.id,
    type:   'circle',
    source: cfg.sourceId,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'intensidade'],
        0, cfg.minRadius,
        1, cfg.maxRadius,
      ],
      'circle-color': cfg.color,
      'circle-stroke-width': 1,
      'circle-stroke-color': 'rgba(255,255,255,0.3)',
      'circle-opacity': [
        'interpolate', ['linear'], ['get', 'intensidade'],
        0, 0.6,
        1, 1.0,
      ],
    },
  });

  // Bind popup ao clicar
  bindPopup(map, cfg);

  console.log(`[LAYERS] Camada "${key}" adicionada: ${data.length} pontos`);
}

/**
 * Remove uma camada e sua source do mapa.
 * @param {maplibregl.Map} map
 * @param {string}         key
 */
export function removeLayer(map, key) {
  const cfg = LAYER_CONFIGS[key];
  if (!cfg) return;

  const layersToRemove = [cfg.id, `${cfg.id}-halo`];
  layersToRemove.forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(cfg.sourceId)) map.removeSource(cfg.sourceId);
}

/**
 * Cria popup informativo ao clicar em um ponto.
 * Também dispara o evento global para o Rastro do Impacto.
 *
 * @param {maplibregl.Map} map
 * @param {Object}         cfg
 */
function bindPopup(map, cfg) {
  // Cursor pointer
  map.on('mouseenter', cfg.id, () => { map.getCanvas().style.cursor = 'crosshair'; });
  map.on('mouseleave', cfg.id, () => { map.getCanvas().style.cursor = ''; });

  map.on('click', cfg.id, (e) => {
    const feature = e.features[0];
    const props   = feature.properties;
    const lngLat  = e.lngLat;

    // Popup CRT
    const html = `
      <div style="min-width:180px">
        <div style="color:#ffb300;font-size:9px;letter-spacing:2px;margin-bottom:6px">
          ${cfg.icon} ${cfg.label.toUpperCase()}
        </div>
        <div style="margin-bottom:4px"><strong>${props.nome}</strong></div>
        <div style="color:#888;font-size:9px">TIPO: ${props.tipo}</div>
        <div style="font-size:10px;margin-top:4px">
          INTENSIDADE: <span style="color:${cfg.color}">${Math.round(props.intensidade * 100)}%</span>
        </div>
        <div style="color:#888;font-size:9px">DATA: ${props.data}</div>
        <div style="color:#888;font-size:9px">FONTE: ${props.fonte}</div>
        <div style="margin-top:8px;color:#9b59b6;font-size:9px;letter-spacing:1px;cursor:pointer"
             onclick="window.dispatchEvent(new CustomEvent('impact:trigger',{detail:{lngLat:{lng:${lngLat.lng},lat:${lngLat.lat}},_label:'${props.nome}',_tipo:'${props.tipo}',_intensidade:${props.intensidade}}}))">
          ◈ ANALISAR RASTRO DO IMPACTO →
        </div>
      </div>
    `;

    new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map);

    // Dispara evento global (capturado pelo impact.js)
    window.dispatchEvent(new CustomEvent('impact:trigger', {
      detail: {
        lngLat:      { lng: lngLat.lng, lat: lngLat.lat },
        _label:      props.nome,
        _tipo:       props.tipo,
        _intensidade: props.intensidade,
        _fonte:      props.fonte,
        _data:       props.data,
      },
    }));
  });
}

/**
 * Animação de flash visual ao sincronizar uma camada.
 * Altera opacidade brevemente para feedback visual.
 * @param {maplibregl.Map} map
 * @param {string}         key
 */
export function flashLayer(map, key) {
  const cfg = LAYER_CONFIGS[key];
  if (!cfg || !map.getLayer(cfg.id)) return;

  // Flash: opacidade 0 → 1 → 0 → 1 em 800ms
  let step = 0;
  const steps = [0.1, 1, 0.3, 1, 0.6, 1];
  const interval = setInterval(() => {
    if (step >= steps.length) {
      clearInterval(interval);
      return;
    }
    map.setPaintProperty(cfg.id, 'circle-opacity', steps[step]);
    step++;
  }, 130);
}

/**
 * Alias para toggle — verifica e chama add ou remove.
 * @param {maplibregl.Map} map
 * @param {string}         key
 * @param {Array}          data
 */
export function toggleLayer(map, key, data) {
  const cfg = LAYER_CONFIGS[key];
  if (!cfg) return;

  if (map.getLayer(cfg.id)) {
    removeLayer(map, key);
  } else {
    addLayer(map, key, data);
  }
}

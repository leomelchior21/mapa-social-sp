/**
 * map.js — Inicialização do MapLibre GL JS
 * - Mapa base dark com estilo Protomaps (gratuito, sem chave)
 * - Extrusão de prédios 3D no zoom > 14
 * - Configurações de câmera táticas
 */

// Estilo alternativo: Stadia Alidade Dark (sem chave necessária para uso educacional)
// Fallback: vector tiles da OpenMapTiles via demotiles.org

const MAP_STYLE_URL =
  'https://tiles.openfreemap.org/styles/dark';

// Coordenadas centrais de São Paulo
const SP_CENTER = [-46.6333, -23.5505];
const SP_ZOOM   = 11;
const SP_PITCH  = 45;
const SP_BEARING = -15;

/**
 * Inicializa o mapa MapLibre em modo 3D tático.
 * @param {string} containerId - ID do elemento DOM
 * @returns {maplibregl.Map}
 */
export async function initMap(containerId) {
  const map = new maplibregl.Map({
    container: containerId,
    style: MAP_STYLE_URL,
    center: SP_CENTER,
    zoom: SP_ZOOM,
    pitch: SP_PITCH,
    bearing: SP_BEARING,
    antialias: true,
    // Reduz consumo de memória em dispositivos fracos
    maxParallelImageRequests: 4,
    preserveDrawingBuffer: false,
  });

  return new Promise((resolve) => {
    map.on('load', () => {
      setupBuildings(map);
      setupFog(map);
      setupZoomBehavior(map);
      console.log('[MAP] MapLibre carregado — São Paulo centrado');
      resolve(map);
    });

    map.on('error', (e) => {
      // Fallback para estilo simples se o dark não carregar
      console.warn('[MAP] Erro no estilo, tentando fallback:', e);
    });
  });
}

/**
 * Extrusão 3D de prédios — ativa apenas em zoom > 14 por performance.
 * Os prédios são renderizados com cor âmbar escura para manter estética.
 */
function setupBuildings(map) {
  // Aguarda layers do mapa carregarem
  const layers = map.getStyle().layers;

  // Procura camada de prédios no estilo
  const buildingLayer = layers?.find(
    l => l.id === 'building' || l.id === 'buildings' || l['source-layer'] === 'building'
  );

  if (buildingLayer) {
    // Modifica cor para estética CRT
    map.setPaintProperty(buildingLayer.id, 'fill-color', '#1a1208');
    map.setPaintProperty(buildingLayer.id, 'fill-outline-color', '#3d2d00');
  }

  // Adiciona layer de extrusão 3D se disponível
  if (!map.getLayer('3d-buildings')) {
    try {
      map.addLayer({
        id: '3d-buildings',
        source: buildingLayer?.source || 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,  // Performance: apenas em zoom > 14
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'render_height'],
            0,   '#0a0800',
            50,  '#1a1208',
            100, '#2a1e0a',
            200, '#3d2d00',
          ],
          'fill-extrusion-height': ['get', 'render_height'],
          'fill-extrusion-base':   ['get', 'render_min_height'],
          'fill-extrusion-opacity': 0.85,
        },
      });
    } catch (e) {
      console.warn('[MAP] Extrusão 3D não disponível neste estilo');
    }
  }
}

/**
 * Névoa atmosférica — efeito de profundidade tático.
 */
function setupFog(map) {
  try {
    map.setFog({
      color: 'rgba(0, 0, 0, 0.8)',
      'high-color': 'rgba(10, 8, 0, 0.5)',
      'horizon-blend': 0.02,
      'space-color': '#000000',
      'star-intensity': 0,
    });
  } catch (e) {
    // Fog não disponível em todos os estilos
  }
}

/**
 * Comportamento adaptativo por zoom.
 * - Zoom > 14: extrude prédios
 * - Zoom < 12: reduz pitch para visão mais ampla
 */
function setupZoomBehavior(map) {
  map.on('zoom', () => {
    const z = map.getZoom();

    // Controla visibilidade da extrusão 3D (já gerenciado pelo minzoom)
    // Aqui podemos adicionar lógica adicional se necessário

    if (z < 10 && map.getPitch() > 30) {
      map.easeTo({ pitch: 0, duration: 600 });
    }
  });
}

/**
 * Retorna o mapa para a posição inicial de São Paulo.
 * @param {maplibregl.Map} map
 */
export function resetCamera(map) {
  map.flyTo({
    center: SP_CENTER,
    zoom: SP_ZOOM,
    pitch: SP_PITCH,
    bearing: SP_BEARING,
    duration: 1500,
    easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  });
}

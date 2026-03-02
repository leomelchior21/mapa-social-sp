/**
 * data.js — Carregamento e consulta de dados com DuckDB-WASM
 *
 * Fonte dos Parquets: GitHub raw (gratuito, sem backend)
 * Dados fictícios/sintéticos para demo educacional.
 * Em produção: substitua REPO_BASE pela URL real do repositório.
 *
 * Estrutura mínima de cada Parquet:
 *   latitude   DOUBLE
 *   longitude  DOUBLE
 *   tipo       VARCHAR
 *   intensidade DOUBLE  (0..1)
 *   data       VARCHAR  (ISO 8601)
 *   fonte      VARCHAR
 *   nome       VARCHAR  (opcional, para labels)
 */

// URL base do repositório GitHub (altere para o seu fork)
const REPO_BASE =
  'https://raw.githubusercontent.com/leomelchior21/mapa-social-sp/main/data';

// Nomes dos arquivos Parquet
const PARQUET_FILES = {
  ar:    `${REPO_BASE}/ar_sp.parquet`,
  focos: `${REPO_BASE}/focos_sp.parquet`,
  saude: `${REPO_BASE}/saude_sp.parquet`,
};

let _db = null;  // Instância singleton do DuckDB

/**
 * Inicializa o DuckDB-WASM.
 * Usa bundle MVP (menor, ideal para edge/gratuito).
 * @returns {Promise<duckdb.AsyncDuckDB>}
 */
export async function initDuckDB() {
  if (_db) return _db;

  try {
    // Carrega o bundle WASM do DuckDB
    const DUCKDB_CONFIG = {
      query: { castBigIntToDouble: true },
    };

    // Bundle MVP — compatível com todos os browsers modernos
    const bundle = await duckdb.selectBundle({
      mvp: {
        mainModule:  'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev106.0/dist/duckdb-mvp.wasm',
        mainWorker:  'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev106.0/dist/duckdb-browser-mvp.worker.js',
      },
      eh: {
        mainModule:  'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev106.0/dist/duckdb-eh.wasm',
        mainWorker:  'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev106.0/dist/duckdb-browser-eh.worker.js',
      },
    });

    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    _db = new duckdb.AsyncDuckDB(logger, worker);
    await _db.instantiate(bundle.mainModule);

    console.log('[DATA] DuckDB-WASM inicializado com sucesso');
    return _db;

  } catch (err) {
    console.error('[DATA] Falha ao inicializar DuckDB:', err);
    // Fallback: retorna um "mock DB" que gera dados sintéticos
    return createMockDB();
  }
}

/**
 * Carrega um arquivo Parquet do GitHub e retorna array de registros.
 * Se o arquivo remoto falhar, gera dados sintéticos para demo.
 *
 * @param {duckdb.AsyncDuckDB} db  - instância DuckDB
 * @param {string}             key - 'ar' | 'focos' | 'saude'
 * @returns {Promise<Array>}
 */
export async function loadParquet(db, key) {
  const url = PARQUET_FILES[key];

  try {
    // Tenta carregar do GitHub
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const buffer = await resp.arrayBuffer();
    return await queryParquetBuffer(db, key, buffer);

  } catch (err) {
    console.warn(`[DATA] Parquet ${key} indisponível (${err.message}), usando dados sintéticos`);
    return generateSyntheticData(key);
  }
}

/**
 * Consulta um buffer Parquet via DuckDB-WASM.
 * Registra o arquivo na memória virtual do DuckDB.
 * @param {duckdb.AsyncDuckDB} db
 * @param {string} key
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Array>}
 */
async function queryParquetBuffer(db, key, buffer) {
  const filename = `/${key}.parquet`;
  await db.registerFileBuffer(filename, new Uint8Array(buffer));

  const conn = await db.connect();
  try {
    const result = await conn.query(`
      SELECT
        latitude,
        longitude,
        tipo,
        CAST(intensidade AS DOUBLE) AS intensidade,
        data,
        fonte,
        COALESCE(nome, tipo) AS nome
      FROM read_parquet('${filename}')
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude BETWEEN -24.0 AND -23.0
        AND longitude BETWEEN -47.0 AND -46.0
      LIMIT 5000
    `);

    // Converte Arrow Table para array JS simples
    return arrowTableToArray(result);
  } finally {
    await conn.close();
  }
}

/**
 * Converte Arrow Table (retorno do DuckDB) em Array de objetos JS.
 * @param {arrow.Table} table
 * @returns {Array<Object>}
 */
function arrowTableToArray(table) {
  const rows = [];
  for (let i = 0; i < table.numRows; i++) {
    const row = {};
    for (const field of table.schema.fields) {
      row[field.name] = table.getChildAt(table.schema.indexOf(field)).get(i);
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Consulta DuckDB em memória para o Rastro do Impacto.
 * Retorna emissores num raio de `radiusKm` km do ponto dado.
 *
 * @param {duckdb.AsyncDuckDB} db
 * @param {{lat: number, lng: number}} center
 * @param {Array} allData  - dados já carregados em cache
 * @param {number} radiusKm
 * @returns {Promise<Array>}
 */
export async function queryNearby(db, center, allData, radiusKm = 5) {
  if (!allData || allData.length === 0) return [];

  // Para demo/fallback: filtro JS simples por distância
  return allData
    .map(row => ({
      ...row,
      dist: haversineKm(center.lat, center.lng, row.latitude, row.longitude),
    }))
    .filter(row => row.dist <= radiusKm)
    .sort((a, b) => b.intensidade - a.intensidade)
    .slice(0, 10);
}

/**
 * Distância Haversine em km entre dois pontos geográficos.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} km
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Gerador de dados sintéticos (fallback educacional) ─────
/**
 * Gera pontos aleatórios dentro dos limites de SP
 * para demonstração quando os Parquets não estão disponíveis.
 */
function generateSyntheticData(key) {
  const configs = {
    ar: {
      tipos: ['Estação CETESB', 'Via expressa', 'Indústria', 'Terminal de ônibus'],
      fonte: 'CETESB',
      count: 80,
    },
    focos: {
      tipos: ['Queimada urbana', 'Foco de calor', 'Incêndio vegetação'],
      fonte: 'INPE',
      count: 40,
    },
    saude: {
      tipos: ['Hospital', 'UBS', 'AMA', 'CAPS', 'Pronto-socorro'],
      fonte: 'SMS-SP',
      count: 120,
    },
  };

  const cfg = configs[key];
  const records = [];

  // Bounding box aproximado de SP
  const latMin = -23.80, latMax = -23.40;
  const lonMin = -46.85, lonMax = -46.35;

  for (let i = 0; i < cfg.count; i++) {
    const tipo = cfg.tipos[Math.floor(Math.random() * cfg.tipos.length)];
    records.push({
      latitude:   latMin + Math.random() * (latMax - latMin),
      longitude:  lonMin + Math.random() * (lonMax - lonMin),
      tipo,
      intensidade: Math.random(),
      data:        new Date(Date.now() - Math.random() * 7 * 86400000).toISOString().slice(0, 10),
      fonte:       cfg.fonte,
      nome:        `${tipo} ${String(i + 1).padStart(3, '0')}`,
    });
  }

  console.log(`[DATA] Dados sintéticos gerados: ${records.length} registros para "${key}"`);
  return records;
}

/**
 * Mock DB para quando DuckDB-WASM falha completamente.
 * Implementa apenas a interface usada pelo app.
 */
function createMockDB() {
  return { _mock: true };
}

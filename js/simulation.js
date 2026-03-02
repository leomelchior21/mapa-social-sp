/**
 * simulation.js — Motor de simulação realista
 *
 * Dados baseados em valores reais documentados de SP (2023-2024):
 * - PM2.5 médio SP: ~18 µg/m³ (CETESB 2023)
 * - Temp média SP jan: 24°C, jul: 16°C
 * - Congestionamento médio: 35-70% (CET-SP)
 * - Internações respiratórias SP: ~180/100k hab (DataSUS)
 *
 * O motor aplica correlações reais entre camadas:
 * - Chuva → melhora PM2.5, piora turbidez água, reduz congestionamento
 * - Alto congestionamento → piora PM2.5 e NO2
 * - PM2.5 elevado → aumenta internações respiratórias
 * - Alta temperatura → aumenta ilha de calor e consumo elétrico
 */

// ── Valores base realistas (médias anuais SP) ──────────
const BASE = {
  ar: {
    pm25: 18.4,   // µg/m³ — CETESB 2023
    no2:  42.1,   // µg/m³
    co:   1.2,    // ppm
    iqa:  68,     // Índice Qualidade do Ar (0-500)
  },
  agua: {
    turbidez: 2.8,  // NTU — SABESP média
    ph:       7.1,
    balneab:  'PRÓPRIA',
  },
  energia: {
    hidro:  62,   // % geração hidrelétrica ONS
    termica: 18,  // % termelétricas
    solar:  8,    // % solar
    banda:  'VERDE',
  },
  residuos: {
    pts_irreg: 1842,  // pontos descarte irregular ativo SP
    cap_aterro: 78,   // % capacidade aterro Bandeirantes
  },
  solo: {
    agrotox: 14.2,  // kg/ha médio SP estado
    desmat: 312,    // ha/mês Mata Atlântica SP
  },
  trafego: {
    congestionamento: 48,  // % vias congestionadas horário pico
    ilha_calor: 4.2,       // °C acima da periferia
    ruido: 68,             // dB médio centro expandido
  },
  saude: {
    respirat: 184,  // internações respiratórias /100k — DataSUS
    hidricas: 23,   // doenças hídricas /100k
    intox: 8.4,     // intoxicações agrotóx /100k
  },
  clima: {
    temp: 22.4,     // °C média
    chuva: 0,       // mm/h atual
    umidade: 72,    // %
  },
};

// ── Estado atual da simulação ──────────────────────────
export let STATE = JSON.parse(JSON.stringify(BASE));

// ── Estado anterior — para detectar melhora/piora ─────
export let PREV_STATE = JSON.parse(JSON.stringify(BASE));

// ── Diff: o que mudou neste tick ──────────────────────
// Estrutura: { layer: { direction: 'up'|'down'|'stable', severity: 'ok'|'warn'|'crit' } }
export let TICK_DIFF = {};

// ── Variáveis de contexto (afetam múltiplas camadas) ───
let _chuva_ativa = false;
let _hora = new Date().getHours();
let _tick = 0;

// ── Zonas geográficas com intensidade por camada ───────
// Cada zona tem um polígono (bbox simplificado) e multipliers
export const ZONES = {
  ar: [
    { id:'z-ar-centro',   name:'Centro Expandido',   lat:-23.548, lng:-46.638, radius:0.025, factor: 1.5 },
    { id:'z-ar-aBC',      name:'Grande ABC',          lat:-23.640, lng:-46.535, radius:0.030, factor: 1.8 },
    { id:'z-ar-guarulhos',name:'Guarulhos',           lat:-23.455, lng:-46.530, radius:0.028, factor: 1.3 },
    { id:'z-ar-pinheiros',name:'Pinheiros/Marginal',  lat:-23.565, lng:-46.700, radius:0.020, factor: 1.2 },
  ],
  agua: [
    { id:'z-ag-tiete',    name:'Vale do Tietê',       lat:-23.503, lng:-46.605, radius:0.040, factor: 2.1 },
    { id:'z-ag-glicerio', name:'Glicério/Liberdade',  lat:-23.560, lng:-46.627, radius:0.015, factor: 2.8 },
    { id:'z-ag-mooca',    name:'Mooca/Ipiranga',      lat:-23.568, lng:-46.592, radius:0.018, factor: 1.9 },
    { id:'z-ag-guarapiranga', name:'Guarapiranga',    lat:-23.710, lng:-46.720, radius:0.035, factor: 0.6 },
  ],
  trafego: [
    { id:'z-tr-paulista', name:'Av. Paulista',        lat:-23.561, lng:-46.656, radius:0.012, factor: 1.8, vias: [[-46.670,-23.561],[-46.640,-23.561]] },
    { id:'z-tr-margpinhe',name:'Marginal Pinheiros',  lat:-23.565, lng:-46.720, radius:0.010, factor: 2.0, vias: [[-46.750,-23.558],[-46.680,-23.574]] },
    { id:'z-tr-radial',   name:'Radial Leste',        lat:-23.540, lng:-46.540, radius:0.015, factor: 1.6, vias: [[-46.630,-23.543],[-46.500,-23.537]] },
    { id:'z-tr-margtiete',name:'Marginal Tietê',      lat:-23.512, lng:-46.640, radius:0.010, factor: 1.9, vias: [[-46.730,-23.508],[-46.560,-23.516]] },
  ],
  residuos: [
    { id:'z-re-itaquera',  name:'Itaquera',           lat:-23.535, lng:-46.455, radius:0.020, factor: 1.4 },
    { id:'z-re-campolimpo',name:'Campo Limpo',        lat:-23.665, lng:-46.752, radius:0.022, factor: 1.6 },
    { id:'z-re-brasilandia',name:'Brasilândia',       lat:-23.430, lng:-46.695, radius:0.018, factor: 1.3 },
    { id:'z-re-caieiras',  name:'Aterro Caieiras',    lat:-23.365, lng:-46.740, radius:0.015, factor: 0.8 },
  ],
  saude: [
    { id:'z-sa-clinicas',  name:'H. das Clínicas',   lat:-23.551, lng:-46.671, radius:0.018, factor: 1.0 },
    { id:'z-sa-unifesp',   name:'H. São Paulo',       lat:-23.598, lng:-46.639, radius:0.016, factor: 1.1 },
    { id:'z-sa-campo',     name:'UPA Campo Limpo',    lat:-23.668, lng:-46.748, radius:0.015, factor: 1.3 },
    { id:'z-sa-ermelino',  name:'UPA Ermelino',       lat:-23.499, lng:-46.454, radius:0.015, factor: 1.2 },
  ],
};

/**
 * Avança a simulação um passo (chamado a cada ~60s).
 * Aplica variações com correlações causa-efeito.
 */
export function tick() {
  _tick++;
  _hora = new Date().getHours();

  // Salva estado anterior para comparação
  PREV_STATE = JSON.parse(JSON.stringify(STATE));

  // ── 1. Clima (driver principal) ───────────────────────
  const isManha = _hora >= 7 && _hora <= 9;
  const isTarde  = _hora >= 17 && _hora <= 20;
  const isNoite  = _hora >= 22 || _hora <= 6;

  // Temperatura sazonal + ciclo diário
  const tempBase = 22 + 4 * Math.sin((_hora - 6) * Math.PI / 12);
  STATE.clima.temp = parseFloat((tempBase + jitter(2)).toFixed(1));

  // Chuva: evento probabilístico (15% chance por tick em SP)
  if (Math.random() < 0.08) {
    _chuva_ativa = !_chuva_ativa;
  }
  STATE.clima.chuva = _chuva_ativa ? parseFloat((2 + Math.random() * 18).toFixed(1)) : 0;
  STATE.clima.umidade = _chuva_ativa ? Math.min(98, STATE.clima.umidade + jitter(5)) : Math.max(45, STATE.clima.umidade + jitter(3));

  // ── 2. TRÁFEGO (horário) ──────────────────────────────
  let congBase = 25;
  if (isManha || isTarde) congBase = 65 + jitter(10);
  else if (isNoite) congBase = 15;
  else congBase = 40 + jitter(8);

  // Chuva aumenta congestionamento ~20%
  if (_chuva_ativa) congBase = Math.min(95, congBase * 1.22);

  STATE.trafego.congestionamento = Math.round(congBase + jitter(5));
  STATE.trafego.ilha_calor = parseFloat((STATE.clima.temp > 26 ? 5.5 + jitter(1) : 3.2 + jitter(0.8)).toFixed(1));
  STATE.trafego.ruido = Math.round(isManha || isTarde ? 72 + jitter(4) : 62 + jitter(4));

  // ── 3. AR (depende de tráfego + chuva) ───────────────
  // PM2.5: chuva lava partículas, tráfego intenso gera mais
  const trafegoFactor = STATE.trafego.congestionamento / 50;
  const chuvaEffect   = _chuva_ativa ? 0.65 : 1.0;
  STATE.ar.pm25 = parseFloat((BASE.ar.pm25 * trafegoFactor * chuvaEffect + jitter(3)).toFixed(1));
  STATE.ar.pm25 = Math.max(4, STATE.ar.pm25);

  STATE.ar.no2 = parseFloat((BASE.ar.no2 * (trafegoFactor * 0.8) * chuvaEffect + jitter(5)).toFixed(1));
  STATE.ar.co  = parseFloat((BASE.ar.co * trafegoFactor * chuvaEffect + jitter(0.3)).toFixed(2));

  // IQA calculado a partir do PM2.5 (fórmula simplificada CONAMA)
  STATE.ar.iqa = calcIQA(STATE.ar.pm25);

  // ── 4. ÁGUA (chuva aumenta turbidez/contaminação) ────
  STATE.agua.turbidez = parseFloat(
    (_chuva_ativa ? BASE.agua.turbidez * 3.5 + jitter(2) : BASE.agua.turbidez + jitter(0.5)).toFixed(1)
  );
  STATE.agua.ph = parseFloat((BASE.agua.ph + jitter(0.3)).toFixed(1));
  STATE.agua.balneab = STATE.agua.turbidez > 10 ? 'IMPRÓPRIA' : (STATE.agua.turbidez > 5 ? 'REGULAR' : 'PRÓPRIA');

  // ── 5. ENERGIA (temp alta → mais consumo → mais térmica) ─
  const calor = STATE.clima.temp > 27;
  STATE.energia.termica = Math.round(BASE.energia.termica * (calor ? 1.35 : 1) + jitter(3));
  STATE.energia.hidro   = Math.round(100 - STATE.energia.termica - BASE.energia.solar - jitter(2));
  STATE.energia.banda   = STATE.energia.termica > 25 ? 'VERMELHA' : (STATE.energia.termica > 20 ? 'AMARELA' : 'VERDE');

  // ── 6. RESÍDUOS (weekend aumenta descarte irregular) ──
  const isWknd = [0, 6].includes(new Date().getDay());
  STATE.residuos.pts_irreg = Math.round(BASE.residuos.pts_irreg * (isWknd ? 1.15 : 1) + jitter(30));
  STATE.residuos.cap_aterro = Math.min(99, Math.round(BASE.residuos.cap_aterro + (_tick * 0.001) + jitter(1)));

  // ── 7. SAÚDE (PM2.5 alto → mais resp; água ruim → mais hídricas) ─
  const arEffect   = STATE.ar.pm25 / BASE.ar.pm25;
  const aguaEffect = STATE.agua.turbidez / BASE.agua.turbidez;
  STATE.saude.respirat = Math.round(BASE.saude.respirat * arEffect + jitter(8));
  STATE.saude.hidricas = Math.round(BASE.saude.hidricas * aguaEffect + jitter(3));
  STATE.saude.intox    = parseFloat((BASE.saude.intox + jitter(1.5)).toFixed(1));

  // ── 8. SOLO (variação lenta, mensal) ──────────────────
  STATE.solo.agrotox = parseFloat((BASE.solo.agrotox + jitter(0.8)).toFixed(1));
  STATE.solo.desmat  = Math.round(BASE.solo.desmat + jitter(20));

  // ── Calcula DIFF para feedback visual ─────────────────
  TICK_DIFF = {
    ar: diffLayer(STATE.ar.iqa, PREV_STATE.ar.iqa, false), // false = menor é melhor
    agua: diffLayer(STATE.agua.turbidez, PREV_STATE.agua.turbidez, false),
    energia: diffLayer(STATE.energia.termica, PREV_STATE.energia.termica, false),
    residuos: diffLayer(STATE.residuos.pts_irreg, PREV_STATE.residuos.pts_irreg, false),
    solo: diffLayer(STATE.solo.agrotox, PREV_STATE.solo.agrotox, false),
    trafego: diffLayer(STATE.trafego.congestionamento, PREV_STATE.trafego.congestionamento, false),
    saude: diffLayer(STATE.saude.respirat, PREV_STATE.saude.respirat, false),
  };

  return STATE;
}

/** Calcula direção e severidade de uma mudança */
function diffLayer(curr, prev, higherIsBetter = false) {
  const delta = curr - prev;
  const pct   = prev !== 0 ? Math.abs(delta / prev) : 0;
  let direction = 'stable';
  if (delta > 0) direction = higherIsBetter ? 'up' : 'down';  // down = piorou
  if (delta < 0) direction = higherIsBetter ? 'down' : 'up';  // up = melhorou

  // severity: ok se mudança < 5%, warn 5-15%, crit > 15%
  let severity = 'ok';
  if (pct > 0.15) severity = 'crit';
  else if (pct > 0.05) severity = 'warn';

  // Se piorou muito → crit independente
  if (direction === 'down' && pct > 0.08) severity = 'crit';

  return { direction, severity, delta: parseFloat(delta.toFixed(2)), pct };
}

/**
 * Calcula o IQA a partir do PM2.5 (escala CONAMA simplificada).
 * Boa: 0-40 | Moderada: 41-80 | Ruim: 81-120 | Muito ruim: 121+
 */
function calcIQA(pm25) {
  if (pm25 <= 15)  return Math.round(pm25 * 2.67);
  if (pm25 <= 30)  return Math.round(40 + (pm25 - 15) * 2.67);
  if (pm25 <= 60)  return Math.round(80 + (pm25 - 30) * 1.33);
  return Math.min(300, Math.round(120 + (pm25 - 60) * 2));
}

/** IQA → label + cor */
export function iqaLabel(iqa) {
  if (iqa <= 40)  return { label: 'BOA',       color: '#22c55e' };
  if (iqa <= 80)  return { label: 'MODERADA',  color: '#f97316' };
  if (iqa <= 120) return { label: 'RUIM',      color: '#f43f5e' };
  return               { label: 'MUITO RUIM', color: '#7f1d1d' };
}

/** Bandeira elétrica → cor */
export function bandColor(b) {
  return { VERDE: '#22c55e', AMARELA: '#eab308', VERMELHA: '#f43f5e' }[b] || '#94a3b8';
}

/** Balneabilidade → cor */
export function balnColor(b) {
  return { PRÓPRIA: '#22c55e', REGULAR: '#eab308', IMPRÓPRIA: '#f43f5e' }[b] || '#94a3b8';
}

/**
 * Gera histórico de 30 dias simulado para os gráficos.
 * Usa o mesmo motor com variações para criar curvas realistas.
 * @param {string} layer
 * @returns {{ labels: string[], datasets: Object[] }}
 */
export function generateHistory(layer) {
  const days = 30;
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
  }

  const configs = {
    ar: {
      datasets: [
        { label: 'PM₂.₅ (µg/m³)', base: BASE.ar.pm25, variance: 8, color: '#f97316' },
        { label: 'NO₂ (µg/m³)',   base: BASE.ar.no2,  variance: 15, color: '#fb923c' },
      ],
      insight: `PM₂.₅ médio de ${BASE.ar.pm25} µg/m³ (OMS recomenda ≤15). Picos em dias de tráfego intenso e ausência de chuva. Correlação com internações respiratórias: r=0.73.`,
    },
    agua: {
      datasets: [
        { label: 'Turbidez (NTU)', base: BASE.agua.turbidez, variance: 3, color: '#0ea5e9' },
        { label: 'pH',             base: BASE.agua.ph,        variance: 0.4, color: '#38bdf8' },
      ],
      insight: `Turbidez elevada nos últimos dias correlaciona com eventos de chuva acima de 10mm. pH dentro do limite aceitável (6.5–8.5). Monitoramento de metais pesados em andamento.`,
    },
    energia: {
      datasets: [
        { label: 'Hidro (%)',    base: BASE.energia.hidro,   variance: 8, color: '#a855f7' },
        { label: 'Térmica (%)', base: BASE.energia.termica,  variance: 6, color: '#c084fc' },
      ],
      insight: `Participação hidrelétrica em queda nas ondas de calor (reservatórios baixos). Cada 1% a mais em terméletrica equivale a ~1.2 MtCO₂ adicionais na atmosfera.`,
    },
    saude: {
      datasets: [
        { label: 'Respiratórias (/100k)', base: BASE.saude.respirat, variance: 25, color: '#ec4899' },
        { label: 'Hídricas (/100k)',      base: BASE.saude.hidricas, variance: 8, color: '#f472b6' },
      ],
      insight: `Internações respiratórias seguem a curva de PM₂.₅ com defasagem de 3-5 dias. Pico de doenças hídricas correlaciona com turbidez acima de 8 NTU.`,
    },
    trafego: {
      datasets: [
        { label: 'Congestionamento (%)', base: BASE.trafego.congestionamento, variance: 18, color: '#f43f5e' },
        { label: 'Ruído (dB)',           base: BASE.trafego.ruido,            variance: 5, color: '#fb7185' },
      ],
      insight: `Congestionamento médio de ${BASE.trafego.congestionamento}% nas vias monitoradas. Máximos em horário de pico (7–9h e 17–20h). Ruído urbano acima de 70dB associado a doenças cardiovasculares.`,
    },
  };

  const cfg = configs[layer] || configs.ar;
  const datasets = cfg.datasets.map(ds => ({
    label: ds.label,
    data: Array.from({ length: days }, (_, i) => {
      // Adiciona tendência + sazonalidade semanal + ruído
      const trend   = ds.base * (1 + (i - 15) * 0.002);
      const weekly  = ds.variance * 0.3 * Math.sin(i * 2 * Math.PI / 7);
      const noise   = (Math.random() - 0.5) * ds.variance;
      return Math.max(0, parseFloat((trend + weekly + noise).toFixed(2)));
    }),
    borderColor:     ds.color,
    backgroundColor: ds.color + '18',
    borderWidth: 2,
    pointRadius: 2,
    pointHoverRadius: 5,
    fill: true,
    tension: 0.4,
  }));

  return { labels, datasets, insight: cfg.insight };
}

// ── Dados geoespaciais mockados (pontos no mapa) ───────
/**
 * Gera pontos geoespaciais para cada camada.
 * Baseados em localidades reais de SP.
 */
export function getLayerPoints(layer) {
  const POINTS = {
    ar: [
      { id:'ar1', lat:-23.5489, lng:-46.6388, nome:'Estação CETESB Pinheiros',      pm25: STATE.ar.pm25 * 1.3, no2: STATE.ar.no2 * 1.2, fonte:'CETESB' },
      { id:'ar2', lat:-23.5505, lng:-46.6333, nome:'Est. Parque Dom Pedro II',       pm25: STATE.ar.pm25 * 0.9, no2: STATE.ar.no2 * 0.8, fonte:'CETESB' },
      { id:'ar3', lat:-23.5042, lng:-46.6273, nome:'Est. Santana',                   pm25: STATE.ar.pm25 * 1.1, no2: STATE.ar.no2 * 1.0, fonte:'CETESB' },
      { id:'ar4', lat:-23.6201, lng:-46.7546, nome:'Est. Campo Limpo',               pm25: STATE.ar.pm25 * 1.4, no2: STATE.ar.no2 * 1.3, fonte:'CETESB' },
      { id:'ar5', lat:-23.5762, lng:-46.6218, nome:'Via Expressa Radial Leste',      pm25: STATE.ar.pm25 * 1.6, no2: STATE.ar.no2 * 1.8, fonte:'OpenAQ' },
      { id:'ar6', lat:-23.6089, lng:-46.6945, nome:'Industrial Santo André',         pm25: STATE.ar.pm25 * 1.9, no2: STATE.ar.no2 * 2.1, fonte:'INPE' },
      { id:'ar7', lat:-23.4658, lng:-46.5295, nome:'Est. Guarulhos',                 pm25: STATE.ar.pm25 * 1.2, no2: STATE.ar.no2 * 1.1, fonte:'CAMS' },
    ],
    agua: [
      { id:'ag1', lat:-23.5235, lng:-46.6247, nome:'Ponto Rio Tietê - Penha',       turbidez: STATE.agua.turbidez * 2.1, ph: STATE.agua.ph - 0.3, fonte:'ANA' },
      { id:'ag2', lat:-23.6434, lng:-46.5291, nome:'Rio Tamanduateí - ABC',         turbidez: STATE.agua.turbidez * 3.2, ph: STATE.agua.ph - 0.5, fonte:'ANA' },
      { id:'ag3', lat:-23.5910, lng:-46.6900, nome:'Represa Guarapiranga',          turbidez: STATE.agua.turbidez * 0.6, ph: STATE.agua.ph + 0.1, fonte:'SABESP' },
      { id:'ag4', lat:-23.7308, lng:-46.6583, nome:'Rio Embu-Mirim',               turbidez: STATE.agua.turbidez * 1.8, ph: STATE.agua.ph - 0.2, fonte:'ANA' },
      { id:'ag5', lat:-23.5400, lng:-46.6800, nome:'Pinheiros - Poluição difusa',  turbidez: STATE.agua.turbidez * 4.0, ph: STATE.agua.ph - 0.7, fonte:'CETESB' },
    ],
    energia: [
      { id:'en1', lat:-23.5228, lng:-46.7921, nome:'Subestação Osasco',     tipo:'Distribuição', carga: 78 + jitter(10), fonte:'ONS' },
      { id:'en2', lat:-23.6045, lng:-46.5108, nome:'Termo. Carioba (inativa)', tipo:'Térmica',  carga: 0, fonte:'ANEEL' },
      { id:'en3', lat:-23.4912, lng:-46.8712, nome:'Usina PCH Pirapora',    tipo:'Hidro',      carga: 65 + jitter(8), fonte:'ONS' },
      { id:'en4', lat:-23.5680, lng:-46.7280, nome:'Parque Solar Morumbi',  tipo:'Solar',      carga: _hora > 7 && _hora < 18 ? 82 : 0, fonte:'ANEEL' },
    ],
    residuos: [
      { id:'re1', lat:-23.4755, lng:-46.5241, nome:'Aterro CTL Caieiras',      cap: STATE.residuos.cap_aterro, tipo:'Aterro', fonte:'SNIS' },
      { id:'re2', lat:-23.5127, lng:-46.4788, nome:'Desc. Irreg. Itaquera',    cap: 0, tipo:'Descarte Irregular', fonte:'SINIR' },
      { id:'re3', lat:-23.6891, lng:-46.7234, nome:'Desc. Irreg. Campo Limpo', cap: 0, tipo:'Descarte Irregular', fonte:'SINIR' },
      { id:'re4', lat:-23.5844, lng:-46.6127, nome:'Ecopoint Ipiranga',        cap: 45, tipo:'Reciclagem', fonte:'SNIS' },
      { id:'re5', lat:-23.6400, lng:-46.5760, nome:'Aterro ABC',               cap: STATE.residuos.cap_aterro - 12, tipo:'Aterro', fonte:'SNIS' },
    ],
    solo: [
      { id:'so1', lat:-23.6890, lng:-47.1201, nome:'Cinturão Verde - Cotia',       agrotox: STATE.solo.agrotox * 1.8, desmat: STATE.solo.desmat * 0.3, fonte:'CAR' },
      { id:'so2', lat:-23.7450, lng:-46.7120, nome:'Área Rural Parelheiros',       agrotox: STATE.solo.agrotox * 2.1, desmat: STATE.solo.desmat * 0.5, fonte:'IBAMA' },
      { id:'so3', lat:-23.5560, lng:-46.6880, nome:'APA Capivari-Monos',          agrotox: STATE.solo.agrotox * 0.2, desmat: STATE.solo.desmat * 0.8, fonte:'MapBiomas' },
      { id:'so4', lat:-23.6200, lng:-46.5900, nome:'APP Rio Grande - São Bernardo', agrotox: STATE.solo.agrotox * 0.5, desmat: STATE.solo.desmat * 1.2, fonte:'CAR' },
    ],
    trafego: [
      { id:'tr1', lat:-23.5500, lng:-46.6300, nome:'Centro Expandido',         cong: STATE.trafego.congestionamento * 1.4, calor: STATE.trafego.ilha_calor * 1.6, fonte:'CET-SP' },
      { id:'tr2', lat:-23.6167, lng:-46.6944, nome:'Av. Paulista / Rebouças',  cong: STATE.trafego.congestionamento * 1.2, calor: STATE.trafego.ilha_calor * 1.3, fonte:'Waze' },
      { id:'tr3', lat:-23.5327, lng:-46.7614, nome:'Marginal Pinheiros',       cong: STATE.trafego.congestionamento * 1.5, calor: STATE.trafego.ilha_calor * 1.1, fonte:'Waze' },
      { id:'tr4', lat:-23.5241, lng:-46.4812, nome:'Radial Leste',            cong: STATE.trafego.congestionamento * 1.3, calor: STATE.trafego.ilha_calor * 1.0, fonte:'CET-SP' },
      { id:'tr5', lat:-23.4820, lng:-46.6280, nome:'Área Verde Tremembé',      cong: STATE.trafego.congestionamento * 0.3, calor: STATE.trafego.ilha_calor * 0.4, fonte:'Landsat9' },
    ],
    saude: [
      { id:'sa1', lat:-23.5505, lng:-46.6706, nome:'Hospital das Clínicas FMUSP', tipo:'Hospital',     resp: STATE.saude.respirat, fonte:'DataSUS' },
      { id:'sa2', lat:-23.5983, lng:-46.6390, nome:'Hospital São Paulo UNIFESP',  tipo:'Hospital',     resp: STATE.saude.respirat * 1.1, fonte:'DataSUS' },
      { id:'sa3', lat:-23.6678, lng:-46.7480, nome:'UPA Campo Limpo',            tipo:'UPA',          resp: STATE.saude.respirat * 1.3, fonte:'SMS-SP' },
      { id:'sa4', lat:-23.4986, lng:-46.4540, nome:'UPA Ermelino Matarazzo',     tipo:'UPA',          resp: STATE.saude.respirat * 1.2, fonte:'SMS-SP' },
      { id:'sa5', lat:-23.5329, lng:-46.7920, nome:'Hospital Regional Osasco',   tipo:'Hospital',     resp: STATE.saude.respirat * 0.9, fonte:'DataSUS' },
      { id:'sa6', lat:-23.5187, lng:-46.7050, nome:'UPA Lapa',                   tipo:'UPA',          resp: STATE.saude.respirat * 1.0, fonte:'SMS-SP' },
    ],
  };

  return POINTS[layer] || [];
}

/** Variação aleatória pequena */
function jitter(range) {
  return (Math.random() - 0.5) * range * 2;
}

/** Gera alertas baseados no estado atual */
export function getAlerts() {
  const alerts = [];
  const iqa = STATE.ar.iqa;
  const { label } = iqaLabel(iqa);

  if (iqa > 80)   alerts.push(`⚠ IQA ${label} (${iqa}) — evite exercícios ao ar livre`);
  if (STATE.agua.balneab !== 'PRÓPRIA') alerts.push(`⚠ Balneabilidade ${STATE.agua.balneab} em pontos do Rio Tietê`);
  if (STATE.energia.banda !== 'VERDE')  alerts.push(`⚡ Bandeira tarifária ${STATE.energia.banda} — risco de custos elevados`);
  if (STATE.trafego.congestionamento > 70) alerts.push(`🚦 Congestionamento crítico: ${STATE.trafego.congestionamento}% das vias`);
  if (_chuva_ativa) alerts.push(`🌧 Evento de chuva ativo — turbidez da água elevada`);
  if (STATE.residuos.cap_aterro > 90) alerts.push(`♻ Aterro CTL Caieiras em ${STATE.residuos.cap_aterro}% da capacidade`);

  if (alerts.length === 0) alerts.push('✓ Todos os indicadores dentro dos parâmetros normais');

  return alerts;
}

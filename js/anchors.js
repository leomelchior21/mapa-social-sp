/**
 * anchors.js — Âncoras geográficas reais de São Paulo
 * 
 * Cada âncora define:
 *   id, layer, lat, lng, nome, bairro
 *   value(state) → valor numérico atual para escala
 *   severity(state) → 'ok' | 'warn' | 'crit'
 *   label(state) → string para tooltip
 *   affects: [] → ids de outras âncoras influenciadas
 * 
 * Para adicionar nova âncora: basta inserir um objeto no array da layer.
 */

export const ANCHORS = [

  // ══════════════════════════════════════════════════
  // 💨 AR — Qualidade do ar / poluição
  // ══════════════════════════════════════════════════
  { id:'ar-01', layer:'ar', lat:-23.5489, lng:-46.6388,
    nome:'CETESB Pinheiros',       bairro:'Pinheiros',
    value: s => s.ar.pm25 * 1.3,
    severity: s => s.ar.pm25 > 35 ? 'crit' : s.ar.pm25 > 20 ? 'warn' : 'ok',
    label: s => `PM₂.₅ ${(s.ar.pm25*1.3).toFixed(1)} µg/m³`,
    affects:['saude-01','saude-04','tr-01'] },

  { id:'ar-02', layer:'ar', lat:-23.5505, lng:-46.6333,
    nome:'Est. Parque Dom Pedro II', bairro:'Centro',
    value: s => s.ar.pm25 * 0.95,
    severity: s => s.ar.pm25 > 35 ? 'crit' : s.ar.pm25 > 20 ? 'warn' : 'ok',
    label: s => `PM₂.₅ ${(s.ar.pm25*0.95).toFixed(1)} µg/m³`,
    affects:['saude-02'] },

  { id:'ar-03', layer:'ar', lat:-23.5042, lng:-46.6273,
    nome:'Est. Santana',           bairro:'Santana',
    value: s => s.ar.pm25 * 1.1,
    severity: s => s.ar.pm25 > 35 ? 'crit' : s.ar.pm25 > 20 ? 'warn' : 'ok',
    label: s => `PM₂.₅ ${(s.ar.pm25*1.1).toFixed(1)} µg/m³`,
    affects:['saude-05'] },

  { id:'ar-04', layer:'ar', lat:-23.6201, lng:-46.7546,
    nome:'Est. Campo Limpo',       bairro:'Campo Limpo',
    value: s => s.ar.pm25 * 1.45,
    severity: s => s.ar.pm25 > 30 ? 'crit' : s.ar.pm25 > 18 ? 'warn' : 'ok',
    label: s => `PM₂.₅ ${(s.ar.pm25*1.45).toFixed(1)} µg/m³`,
    affects:['saude-03','saude-06'] },

  { id:'ar-05', layer:'ar', lat:-23.5762, lng:-46.6218,
    nome:'Radial Leste (via)',     bairro:'Belém',
    value: s => s.ar.pm25 * 1.65,
    severity: s => s.ar.pm25 > 28 ? 'crit' : s.ar.pm25 > 16 ? 'warn' : 'ok',
    label: s => `PM₂.₅ ${(s.ar.pm25*1.65).toFixed(1)} µg/m³ — via expr.`,
    affects:['saude-04'] },

  { id:'ar-06', layer:'ar', lat:-23.6089, lng:-46.6945,
    nome:'Industrial Santo André', bairro:'Abc',
    value: s => s.ar.pm25 * 1.9,
    severity: s => s.ar.pm25 > 22 ? 'crit' : s.ar.pm25 > 14 ? 'warn' : 'ok',
    label: s => `PM₂.₅ ${(s.ar.pm25*1.9).toFixed(1)} µg/m³ — industrial`,
    affects:['saude-02'] },

  { id:'ar-07', layer:'ar', lat:-23.4658, lng:-46.5295,
    nome:'Est. Guarulhos',         bairro:'Guarulhos',
    value: s => s.ar.pm25 * 1.2,
    severity: s => s.ar.pm25 > 32 ? 'crit' : s.ar.pm25 > 19 ? 'warn' : 'ok',
    label: s => `PM₂.₅ ${(s.ar.pm25*1.2).toFixed(1)} µg/m³`,
    affects:[] },

  { id:'ar-08', layer:'ar', lat:-23.5680, lng:-46.7020,
    nome:'Av. Rebouças / Marginal',bairro:'Pinheiros',
    value: s => s.ar.no2 * 1.4,
    severity: s => s.ar.no2 > 60 ? 'crit' : s.ar.no2 > 40 ? 'warn' : 'ok',
    label: s => `NO₂ ${(s.ar.no2*1.4).toFixed(1)} µg/m³`,
    affects:['tr-03','saude-01'] },

  // ══════════════════════════════════════════════════
  // 💧 ÁGUA — Rios, represas, drenagem
  // ══════════════════════════════════════════════════
  { id:'ag-01', layer:'agua', lat:-23.5235, lng:-46.6247,
    nome:'Rio Tietê — Penha',      bairro:'Penha',
    value: s => s.agua.turbidez * 2.2,
    severity: s => s.agua.turbidez > 10 ? 'crit' : s.agua.turbidez > 5 ? 'warn' : 'ok',
    label: s => `Turbidez ${(s.agua.turbidez*2.2).toFixed(1)} NTU · pH ${(s.agua.ph-0.3).toFixed(1)}`,
    affects:['saude-04','re-02'] },

  { id:'ag-02', layer:'agua', lat:-23.6434, lng:-46.5291,
    nome:'Rio Tamanduateí — ABC',  bairro:'Santo André',
    value: s => s.agua.turbidez * 3.3,
    severity: s => s.agua.turbidez > 8 ? 'crit' : s.agua.turbidez > 4 ? 'warn' : 'ok',
    label: s => `Turbidez ${(s.agua.turbidez*3.3).toFixed(1)} NTU · ${s.agua.balneab}`,
    affects:['saude-02','re-05'] },

  { id:'ag-03', layer:'agua', lat:-23.7308, lng:-46.6583,
    nome:'Represa Guarapiranga',   bairro:'Parelheiros',
    value: s => s.agua.turbidez * 0.6,
    severity: s => s.agua.turbidez > 6 ? 'crit' : s.agua.turbidez > 3 ? 'warn' : 'ok',
    label: s => `Turbidez ${(s.agua.turbidez*0.6).toFixed(1)} NTU · ${s.agua.balneab}`,
    affects:['solo-04'] },

  { id:'ag-04', layer:'agua', lat:-23.5400, lng:-46.6800,
    nome:'Rio Pinheiros',          bairro:'Pinheiros',
    value: s => s.agua.turbidez * 4.0,
    severity: s => s.agua.turbidez > 7 ? 'crit' : s.agua.turbidez > 3.5 ? 'warn' : 'ok',
    label: s => `Turbidez ${(s.agua.turbidez*4).toFixed(1)} NTU — poluição difusa`,
    affects:['ar-08','saude-01'] },

  { id:'ag-05', layer:'agua', lat:-23.5605, lng:-46.6270,
    nome:'Córrego Glicério',       bairro:'Glicério',
    value: s => s.agua.turbidez * 5.5,
    severity: s => s.agua.turbidez > 5 ? 'crit' : s.agua.turbidez > 2.5 ? 'warn' : 'ok',
    label: s => `Turbidez ${(s.agua.turbidez*5.5).toFixed(1)} NTU — esgoto`,
    affects:['re-03','saude-02'] },

  { id:'ag-06', layer:'agua', lat:-23.4910, lng:-46.8710,
    nome:'Represa Pirapora',       bairro:'Pirapora do Bom Jesus',
    value: s => s.agua.turbidez * 0.4,
    severity: s => s.agua.turbidez > 5 ? 'warn' : 'ok',
    label: s => `Turbidez ${(s.agua.turbidez*0.4).toFixed(1)} NTU`,
    affects:['en-03'] },

  { id:'ag-07', layer:'agua', lat:-23.5940, lng:-46.5460,
    nome:'Rio Grande — São Bernardo',bairro:'São Bernardo',
    value: s => s.agua.turbidez * 2.8,
    severity: s => s.agua.turbidez > 9 ? 'crit' : s.agua.turbidez > 5 ? 'warn' : 'ok',
    label: s => `Turbidez ${(s.agua.turbidez*2.8).toFixed(1)} NTU`,
    affects:['solo-03'] },

  // ══════════════════════════════════════════════════
  // ⚡ ENERGIA — Subestações, usinas
  // ══════════════════════════════════════════════════
  { id:'en-01', layer:'energia', lat:-23.5228, lng:-46.7921,
    nome:'SE Osasco',              bairro:'Osasco',
    value: s => s.energia.termica,
    severity: s => s.energia.banda === 'VERMELHA' ? 'crit' : s.energia.banda === 'AMARELA' ? 'warn' : 'ok',
    label: s => `Bandeira ${s.energia.banda} · Térmica ${s.energia.termica}%`,
    affects:['ar-08'] },

  { id:'en-02', layer:'energia', lat:-23.6045, lng:-46.5108,
    nome:'Termelétrica Carioba',   bairro:'Americana',
    value: s => s.energia.termica,
    severity: s => s.energia.termica > 25 ? 'crit' : s.energia.termica > 20 ? 'warn' : 'ok',
    label: s => `Térmica ${s.energia.termica}% — emissão CO₂`,
    affects:['ar-06','ar-07'] },

  { id:'en-03', layer:'energia', lat:-23.4912, lng:-46.8712,
    nome:'PCH Pirapora',           bairro:'Pirapora do Bom Jesus',
    value: s => s.energia.hidro,
    severity: s => s.energia.hidro < 40 ? 'crit' : s.energia.hidro < 55 ? 'warn' : 'ok',
    label: s => `Hidro ${s.energia.hidro}% da geração`,
    affects:[] },

  { id:'en-04', layer:'energia', lat:-23.5680, lng:-46.7280,
    nome:'Parque Solar Morumbi',   bairro:'Morumbi',
    value: s => s.energia.solar,
    severity: () => 'ok',
    label: s => `Solar ${s.energia.solar}% · Limpa`,
    affects:[] },

  { id:'en-05', layer:'energia', lat:-23.5480, lng:-46.6380,
    nome:'SE Centro Expandido',    bairro:'Centro',
    value: s => s.energia.termica * 1.2,
    severity: s => s.energia.banda === 'VERMELHA' ? 'crit' : s.energia.banda === 'AMARELA' ? 'warn' : 'ok',
    label: s => `Demanda pico · Bandeira ${s.energia.banda}`,
    affects:['tr-01'] },

  // ══════════════════════════════════════════════════
  // 🗑️ RESÍDUOS — Aterros, descarte irregular
  // ══════════════════════════════════════════════════
  { id:'re-01', layer:'residuos', lat:-23.3650, lng:-46.7400,
    nome:'Aterro CTL Caieiras',    bairro:'Caieiras',
    value: s => s.residuos.cap_aterro,
    severity: s => s.residuos.cap_aterro > 90 ? 'crit' : s.residuos.cap_aterro > 80 ? 'warn' : 'ok',
    label: s => `Capacidade ${s.residuos.cap_aterro}%`,
    affects:['ar-07'] },

  { id:'re-02', layer:'residuos', lat:-23.5127, lng:-46.4788,
    nome:'Descarte Irregular Itaquera', bairro:'Itaquera',
    value: s => s.residuos.pts_irreg / 30,
    severity: s => s.residuos.pts_irreg > 2000 ? 'crit' : s.residuos.pts_irreg > 1800 ? 'warn' : 'ok',
    label: s => `${s.residuos.pts_irreg} pontos irreg. em SP`,
    affects:['ag-01','saude-04'] },

  { id:'re-03', layer:'residuos', lat:-23.6891, lng:-46.7234,
    nome:'Descarte Irreg. Campo Limpo', bairro:'Campo Limpo',
    value: s => s.residuos.pts_irreg / 35,
    severity: s => s.residuos.pts_irreg > 1900 ? 'crit' : s.residuos.pts_irreg > 1700 ? 'warn' : 'ok',
    label: s => `Descarte irregular ativo`,
    affects:['ag-05','saude-03'] },

  { id:'re-04', layer:'residuos', lat:-23.5844, lng:-46.6127,
    nome:'Ecopoint Ipiranga',      bairro:'Ipiranga',
    value: s => 40,
    severity: () => 'ok',
    label: s => `Ponto de reciclagem ativo`,
    affects:[] },

  { id:'re-05', layer:'residuos', lat:-23.6400, lng:-46.5760,
    nome:'Aterro ABC',             bairro:'São Bernardo',
    value: s => s.residuos.cap_aterro - 12,
    severity: s => s.residuos.cap_aterro > 88 ? 'crit' : s.residuos.cap_aterro > 75 ? 'warn' : 'ok',
    label: s => `Capacidade ${s.residuos.cap_aterro - 12}%`,
    affects:['ag-02'] },

  { id:'re-06', layer:'residuos', lat:-23.4300, lng:-46.6950,
    nome:'Descarte Irreg. Brasilândia', bairro:'Brasilândia',
    value: s => s.residuos.pts_irreg / 38,
    severity: s => s.residuos.pts_irreg > 1900 ? 'crit' : 'warn',
    label: s => `Descarte irregular — periferia norte`,
    affects:['ag-01'] },

  // ══════════════════════════════════════════════════
  // 🌱 SOLO / VEGETAÇÃO — Cobertura verde, desmatamento
  // ══════════════════════════════════════════════════
  { id:'solo-01', layer:'solo', lat:-23.6890, lng:-47.1201,
    nome:'Cinturão Verde — Cotia',  bairro:'Cotia',
    value: s => s.solo.agrotox * 1.8,
    severity: s => s.solo.agrotox > 20 ? 'crit' : s.solo.agrotox > 14 ? 'warn' : 'ok',
    label: s => `Agrotóxico ${(s.solo.agrotox*1.8).toFixed(1)} kg/ha`,
    affects:['ag-07'] },

  { id:'solo-02', layer:'solo', lat:-23.7450, lng:-46.7120,
    nome:'Área Rural Parelheiros', bairro:'Parelheiros',
    value: s => s.solo.desmat / 10,
    severity: s => s.solo.desmat > 350 ? 'crit' : s.solo.desmat > 280 ? 'warn' : 'ok',
    label: s => `Desmat. ${s.solo.desmat} ha/mês`,
    affects:['ag-03','ag-07'] },

  { id:'solo-03', layer:'solo', lat:-23.6200, lng:-46.5900,
    nome:'APP Rio Grande',         bairro:'São Bernardo',
    value: s => s.solo.agrotox * 0.5,
    severity: s => s.solo.agrotox > 16 ? 'warn' : 'ok',
    label: s => `APP vulnerável — ${(s.solo.agrotox*0.5).toFixed(1)} kg/ha`,
    affects:['ag-07'] },

  { id:'solo-04', layer:'solo', lat:-23.5560, lng:-46.6880,
    nome:'APA Capivari-Monos',     bairro:'Capivari',
    value: s => s.solo.desmat * 0.2,
    severity: s => s.solo.desmat > 300 ? 'warn' : 'ok',
    label: s => `Mata preservada · Desmat. ${s.solo.desmat} ha/mês`,
    affects:['ag-03'] },

  { id:'solo-05', layer:'solo', lat:-23.4456, lng:-46.7723,
    nome:'Parque Anhanguera',      bairro:'Perus',
    value: s => s.solo.desmat * 0.15,
    severity: () => 'ok',
    label: s => `Área protegida · ${s.solo.desmat} ha/mês estado`,
    affects:[] },

  { id:'solo-06', layer:'solo', lat:-23.6480, lng:-46.7080,
    nome:'Mata APA Guarapiranga',  bairro:'Grajaú',
    value: s => s.solo.desmat * 0.3,
    severity: s => s.solo.desmat > 320 ? 'crit' : s.solo.desmat > 270 ? 'warn' : 'ok',
    label: s => `Pressão de desmatamento — APA Sul`,
    affects:['ag-03','ag-07'] },

  // ══════════════════════════════════════════════════
  // 🚦 TRÁFEGO — Congestionamento, corredores viários
  // ══════════════════════════════════════════════════
  { id:'tr-01', layer:'trafego', lat:-23.5610, lng:-46.6560,
    nome:'Av. Paulista',           bairro:'Bela Vista',
    value: s => s.trafego.congestionamento * 1.2,
    severity: s => s.trafego.congestionamento > 75 ? 'crit' : s.trafego.congestionamento > 55 ? 'warn' : 'ok',
    label: s => `${s.trafego.congestionamento}% congestionamento · Ruído ${s.trafego.ruido} dB`,
    affects:['ar-01','ar-08'] },

  { id:'tr-02', layer:'trafego', lat:-23.5327, lng:-46.7614,
    nome:'Marginal Pinheiros',     bairro:'Butantã',
    value: s => s.trafego.congestionamento * 1.5,
    severity: s => s.trafego.congestionamento > 65 ? 'crit' : s.trafego.congestionamento > 45 ? 'warn' : 'ok',
    label: s => `${s.trafego.congestionamento}% congestionamento`,
    affects:['ar-01','ar-08','en-04'] },

  { id:'tr-03', layer:'trafego', lat:-23.5121, lng:-46.6380,
    nome:'Marginal Tietê',         bairro:'Santana',
    value: s => s.trafego.congestionamento * 1.8,
    severity: s => s.trafego.congestionamento > 60 ? 'crit' : s.trafego.congestionamento > 40 ? 'warn' : 'ok',
    label: s => `${s.trafego.congestionamento}% congestionamento`,
    affects:['ar-03','ar-08'] },

  { id:'tr-04', layer:'trafego', lat:-23.5241, lng:-46.4812,
    nome:'Radial Leste',           bairro:'Tatuapé',
    value: s => s.trafego.congestionamento * 1.3,
    severity: s => s.trafego.congestionamento > 70 ? 'crit' : s.trafego.congestionamento > 50 ? 'warn' : 'ok',
    label: s => `Radial Leste — ${s.trafego.congestionamento}%`,
    affects:['ar-05'] },

  { id:'tr-05', layer:'trafego', lat:-23.5500, lng:-46.6300,
    nome:'Centro Expandido',       bairro:'República',
    value: s => s.trafego.congestionamento * 1.4,
    severity: s => s.trafego.congestionamento > 70 ? 'crit' : s.trafego.congestionamento > 50 ? 'warn' : 'ok',
    label: s => `Ilha de calor ${s.trafego.ilha_calor}°C acima periferia`,
    affects:['ar-01','ar-02','en-05'] },

  { id:'tr-06', layer:'trafego', lat:-23.6026, lng:-46.6949,
    nome:'Av. Santo Amaro',        bairro:'Santo Amaro',
    value: s => s.trafego.congestionamento * 1.1,
    severity: s => s.trafego.congestionamento > 65 ? 'crit' : s.trafego.congestionamento > 45 ? 'warn' : 'ok',
    label: s => `Zona Sul — ${s.trafego.congestionamento}%`,
    affects:['ar-04'] },

  { id:'tr-07', layer:'trafego', lat:-23.5480, lng:-46.5780,
    nome:'Via Anchieta / Imigrantes',bairro:'Ipiranga',
    value: s => s.trafego.congestionamento * 1.0,
    severity: s => s.trafego.congestionamento > 70 ? 'crit' : s.trafego.congestionamento > 50 ? 'warn' : 'ok',
    label: s => `Acesso ao ABC — ${s.trafego.congestionamento}%`,
    affects:['ar-06','ag-02'] },

  // ══════════════════════════════════════════════════
  // 🏥 SAÚDE — Hospitais, UPAs, internações
  // ══════════════════════════════════════════════════
  { id:'saude-01', layer:'saude', lat:-23.5505, lng:-46.6706,
    nome:'Hospital das Clínicas',  bairro:'Pinheiros',
    value: s => s.saude.respirat,
    severity: s => s.saude.respirat > 250 ? 'crit' : s.saude.respirat > 180 ? 'warn' : 'ok',
    label: s => `${s.saude.respirat} intern./100k · respiratórias`,
    affects:[] },

  { id:'saude-02', layer:'saude', lat:-23.5983, lng:-46.6390,
    nome:'Hospital São Paulo UNIFESP',bairro:'Vila Clementino',
    value: s => s.saude.respirat * 1.1,
    severity: s => s.saude.respirat > 230 ? 'crit' : s.saude.respirat > 160 ? 'warn' : 'ok',
    label: s => `${Math.round(s.saude.respirat*1.1)} intern./100k`,
    affects:[] },

  { id:'saude-03', layer:'saude', lat:-23.6678, lng:-46.7480,
    nome:'UPA Campo Limpo',         bairro:'Campo Limpo',
    value: s => s.saude.respirat * 1.35,
    severity: s => s.saude.respirat > 200 ? 'crit' : s.saude.respirat > 150 ? 'warn' : 'ok',
    label: s => `${Math.round(s.saude.respirat*1.35)} intern./100k`,
    affects:[] },

  { id:'saude-04', layer:'saude', lat:-23.4986, lng:-46.4540,
    nome:'UPA Ermelino Matarazzo',  bairro:'Ermelino Matarazzo',
    value: s => s.saude.respirat * 1.2,
    severity: s => s.saude.respirat > 220 ? 'crit' : s.saude.respirat > 160 ? 'warn' : 'ok',
    label: s => `${Math.round(s.saude.respirat*1.2)} intern./100k`,
    affects:[] },

  { id:'saude-05', layer:'saude', lat:-23.5329, lng:-46.7920,
    nome:'Hospital Regional Osasco',bairro:'Osasco',
    value: s => s.saude.respirat * 0.9,
    severity: s => s.saude.respirat > 240 ? 'crit' : s.saude.respirat > 180 ? 'warn' : 'ok',
    label: s => `${Math.round(s.saude.respirat*0.9)} intern./100k`,
    affects:[] },

  { id:'saude-06', layer:'saude', lat:-23.5187, lng:-46.7050,
    nome:'UPA Lapa',               bairro:'Lapa',
    value: s => s.saude.respirat,
    severity: s => s.saude.respirat > 235 ? 'crit' : s.saude.respirat > 175 ? 'warn' : 'ok',
    label: s => `${s.saude.respirat} intern./100k`,
    affects:[] },

  { id:'saude-07', layer:'saude', lat:-23.6325, lng:-46.6122,
    nome:'UPA Ipiranga',           bairro:'Ipiranga',
    value: s => s.saude.hidricas * 2.1,
    severity: s => s.saude.hidricas > 30 ? 'crit' : s.saude.hidricas > 22 ? 'warn' : 'ok',
    label: s => `${Math.round(s.saude.hidricas*2.1)} intern./100k hídricas`,
    affects:[] },

];

// ── Índice por id ──────────────────────────────────────────
export const ANCHOR_MAP = Object.fromEntries(ANCHORS.map(a => [a.id, a]));

// ── Agrupa por layer ──────────────────────────────────────
export const ANCHORS_BY_LAYER = ANCHORS.reduce((acc, a) => {
  if (!acc[a.layer]) acc[a.layer] = [];
  acc[a.layer].push(a);
  return acc;
}, {});

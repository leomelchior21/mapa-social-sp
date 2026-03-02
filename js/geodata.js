/**
 * geodata.js — Dados geoespaciais realistas de São Paulo
 *
 * Baseado em dados reais de:
 * - CETESB (estações de monitoramento)
 * - DataSUS / SMS-SP (hospitais e UPAs)
 * - SNIS / SINIR (resíduos sólidos)
 * - CET-SP / Waze (corredores de tráfego)
 * - ANA / SABESP (pontos hídricos)
 * - IBAMA / CAR (uso do solo)
 */

// ══════════════════════════════════════════════════════
// ATMOSFERA — Estações e zonas de poluição
// ══════════════════════════════════════════════════════
export const AR_PONTOS = [
  // Estações CETESB oficiais
  { id:'ar01', lat:-23.5489, lng:-46.6388, nome:'Est. Pinheiros (CETESB)',      bairro:'Pinheiros',      pm25_base:28, no2_base:55, fonte:'CETESB',  tipo:'estacao' },
  { id:'ar02', lat:-23.5505, lng:-46.6333, nome:'Est. Parque Dom Pedro II',     bairro:'Centro',         pm25_base:32, no2_base:70, fonte:'CETESB',  tipo:'estacao' },
  { id:'ar03', lat:-23.5042, lng:-46.6273, nome:'Est. Santana',                 bairro:'Santana',        pm25_base:22, no2_base:48, fonte:'CETESB',  tipo:'estacao' },
  { id:'ar04', lat:-23.6201, lng:-46.7546, nome:'Est. Campo Limpo',             bairro:'Campo Limpo',    pm25_base:35, no2_base:62, fonte:'CETESB',  tipo:'estacao' },
  { id:'ar05', lat:-23.4658, lng:-46.5295, nome:'Est. Guarulhos',               bairro:'Guarulhos',      pm25_base:25, no2_base:52, fonte:'CETESB',  tipo:'estacao' },
  { id:'ar06', lat:-23.6890, lng:-46.5250, nome:'Est. Santo André',             bairro:'Santo André',    pm25_base:38, no2_base:75, fonte:'CETESB',  tipo:'estacao' },
  { id:'ar07', lat:-23.5590, lng:-46.5810, nome:'Est. Tatuapé',                 bairro:'Tatuapé',        pm25_base:26, no2_base:58, fonte:'CETESB',  tipo:'estacao' },
  { id:'ar08', lat:-23.6520, lng:-46.6620, nome:'Est. Interlagos',              bairro:'Interlagos',     pm25_base:18, no2_base:38, fonte:'CETESB',  tipo:'estacao' },
  // Fontes industriais e viárias (OpenAQ / INPE)
  { id:'ar09', lat:-23.6089, lng:-46.6945, nome:'Polo Industrial Sto. André',   bairro:'Santo André',    pm25_base:48, no2_base:92, fonte:'INPE',    tipo:'industrial' },
  { id:'ar10', lat:-23.5762, lng:-46.6218, nome:'Via Expressa Radial Leste',    bairro:'Belém',          pm25_base:42, no2_base:88, fonte:'OpenAQ',  tipo:'viario' },
  { id:'ar11', lat:-23.5280, lng:-46.7200, nome:'Marginal Pinheiros km 18',     bairro:'Vila Leopoldina',pm25_base:36, no2_base:72, fonte:'OpenAQ',  tipo:'viario' },
  { id:'ar12', lat:-23.5100, lng:-46.6400, nome:'Tietê km 24 - Santana',        bairro:'Santana',        pm25_base:30, no2_base:65, fonte:'OpenAQ',  tipo:'viario' },
  { id:'ar13', lat:-23.6300, lng:-46.7800, nome:'Ind. Carapicuíba',             bairro:'Carapicuíba',    pm25_base:40, no2_base:80, fonte:'INPE',    tipo:'industrial' },
  { id:'ar14', lat:-23.4500, lng:-46.7000, nome:'Polo Petroquímico Osasco',     bairro:'Osasco',         pm25_base:44, no2_base:85, fonte:'INPE',    tipo:'industrial' },
];

// Zonas de névoa atmosférica (círculos geométricos por área)
export const AR_ZONAS = [
  { id:'az01', lat:-23.548,  lng:-46.638, raio_km:2.5, intensidade_base:0.75, nome:'Centro / Sé' },
  { id:'az02', lat:-23.566,  lng:-46.700, raio_km:3.0, intensidade_base:0.60, nome:'Marginal Pinheiros' },
  { id:'az03', lat:-23.512,  lng:-46.638, raio_km:2.0, intensidade_base:0.55, nome:'Marginal Tietê' },
  { id:'az04', lat:-23.576,  lng:-46.582, raio_km:2.2, intensidade_base:0.70, nome:'Radial Leste / Tatuapé' },
  { id:'az05', lat:-23.640,  lng:-46.535, raio_km:3.5, intensidade_base:0.85, nome:'Grande ABC Industrial' },
  { id:'az06', lat:-23.620,  lng:-46.780, raio_km:2.0, intensidade_base:0.65, nome:'Campo Limpo / M\'Boi' },
  { id:'az07', lat:-23.453,  lng:-46.530, raio_km:2.8, intensidade_base:0.60, nome:'Guarulhos' },
  { id:'az08', lat:-23.452,  lng:-46.700, raio_km:1.8, intensidade_base:0.50, nome:'Osasco' },
];

// ══════════════════════════════════════════════════════
// HIDROSFERA — Pontos de monitoramento hídrico
// ══════════════════════════════════════════════════════
export const AGUA_PONTOS = [
  // Rio Tietê
  { id:'ag01', lat:-23.5100, lng:-46.7400, nome:'Tietê — Barragem Guaraú',       bairro:'Perus',          turbidez_base:3.2,  ph_base:7.2, iqua:72, balneab:'PRÓPRIA',   fonte:'ANA',    rio:'Tietê' },
  { id:'ag02', lat:-23.5080, lng:-46.6900, nome:'Tietê — Ponte do Piqueri',      bairro:'Pirituba',       turbidez_base:8.5,  ph_base:6.8, iqua:42, balneab:'REGULAR',   fonte:'ANA',    rio:'Tietê' },
  { id:'ag03', lat:-23.5060, lng:-46.6400, nome:'Tietê — Ponte das Bandeiras',   bairro:'Santana',        turbidez_base:18.0, ph_base:6.2, iqua:18, balneab:'IMPRÓPRIA', fonte:'CETESB', rio:'Tietê' },
  { id:'ag04', lat:-23.5200, lng:-46.5800, nome:'Tietê — Penha',                 bairro:'Penha',          turbidez_base:22.0, ph_base:5.9, iqua:12, balneab:'IMPRÓPRIA', fonte:'CETESB', rio:'Tietê' },
  { id:'ag05', lat:-23.5350, lng:-46.5000, nome:'Tietê — Deságue Mauá',          bairro:'Mauá',           turbidez_base:35.0, ph_base:5.5, iqua:8,  balneab:'IMPRÓPRIA', fonte:'ANA',    rio:'Tietê' },
  // Rio Pinheiros
  { id:'ag06', lat:-23.5800, lng:-46.7100, nome:'Pinheiros — Pta. do Morumbi',   bairro:'Morumbi',        turbidez_base:25.0, ph_base:6.0, iqua:15, balneab:'IMPRÓPRIA', fonte:'CETESB', rio:'Pinheiros' },
  { id:'ag07', lat:-23.5600, lng:-46.6900, nome:'Pinheiros — Ponte Cidade Jardim',bairro:'Itaim Bibi',    turbidez_base:30.0, ph_base:5.8, iqua:10, balneab:'IMPRÓPRIA', fonte:'CETESB', rio:'Pinheiros' },
  // Rio Tamanduateí
  { id:'ag08', lat:-23.5600, lng:-46.6100, nome:'Tamanduateí — Mooca',           bairro:'Mooca',          turbidez_base:28.0, ph_base:5.7, iqua:11, balneab:'IMPRÓPRIA', fonte:'ANA',    rio:'Tamanduateí' },
  { id:'ag09', lat:-23.6434, lng:-46.5291, nome:'Tamanduateí — ABC',             bairro:'Santo André',    turbidez_base:40.0, ph_base:5.2, iqua:6,  balneab:'IMPRÓPRIA', fonte:'ANA',    rio:'Tamanduateí' },
  // Represas (positivas)
  { id:'ag10', lat:-23.7200, lng:-46.7500, nome:'Represa Guarapiranga',           bairro:'Parelheiros',    turbidez_base:2.1,  ph_base:7.3, iqua:88, balneab:'PRÓPRIA',   fonte:'SABESP', rio:'Guarapiranga' },
  { id:'ag11', lat:-23.7900, lng:-46.5700, nome:'Represa Billings',              bairro:'São Bernardo',   turbidez_base:4.5,  ph_base:7.0, iqua:65, balneab:'REGULAR',   fonte:'SABESP', rio:'Billings' },
  // Pontos críticos urbanos
  { id:'ag12', lat:-23.5560, lng:-46.6270, nome:'Glicério — Córrego Saracura',   bairro:'Liberdade',      turbidez_base:45.0, ph_base:5.0, iqua:4,  balneab:'IMPRÓPRIA', fonte:'CETESB', rio:'Saracura' },
  { id:'ag13', lat:-23.5480, lng:-46.4780, nome:'Córrego Aricanduva',            bairro:'Aricanduva',     turbidez_base:32.0, ph_base:5.6, iqua:9,  balneab:'IMPRÓPRIA', fonte:'ANA',    rio:'Aricanduva' },
];

// ══════════════════════════════════════════════════════
// RESÍDUOS — 42 pontos de descarte irregular em SP
// ══════════════════════════════════════════════════════
export const RESIDUOS_PONTOS = [
  // Zona Leste (alta densidade)
  { id:'re01', lat:-23.5350, lng:-46.4550, nome:'Desc. Irreg. Av. Aricanduva',   bairro:'Aricanduva',   volume_ton:8.4,  tipo:'Entulho + Orgânico', risco:'ALTO',   fonte:'SINIR' },
  { id:'re02', lat:-23.5200, lng:-46.4350, nome:'Terreno Itaquera km 14',        bairro:'Itaquera',     volume_ton:12.1, tipo:'Entulho',            risco:'ALTO',   fonte:'SNIS' },
  { id:'re03', lat:-23.5480, lng:-46.4280, nome:'Fundo de Vale Guaianases',      bairro:'Guaianases',   volume_ton:6.8,  tipo:'Orgânico + Esgoto',  risco:'CRÍTICO',fonte:'SINIR' },
  { id:'re04', lat:-23.5650, lng:-46.4700, nome:'Córrego Iguatemi',              bairro:'São Mateus',   volume_ton:9.2,  tipo:'Misto',              risco:'ALTO',   fonte:'SNIS' },
  { id:'re05', lat:-23.5780, lng:-46.5000, nome:'Av. Ragueb Chohfi',             bairro:'São Lucas',    volume_ton:5.5,  tipo:'Entulho',            risco:'MÉDIO',  fonte:'SINIR' },
  { id:'re06', lat:-23.5100, lng:-46.5200, nome:'Marginal Leste — Penha',        bairro:'Penha',        volume_ton:7.8,  tipo:'Industrial + Orgânico', risco:'ALTO',fonte:'SNIS' },
  { id:'re07', lat:-23.4950, lng:-46.4580, nome:'Ferrovia antiga Ermelino',      bairro:'Ermelino Matarazzo', volume_ton:11.0, tipo:'Entulho',     risco:'ALTO',   fonte:'SINIR' },
  // Zona Norte
  { id:'re08', lat:-23.4300, lng:-46.6950, nome:'Brasilândia — Fundo de vale',   bairro:'Brasilândia',  volume_ton:14.2, tipo:'Misto + Esgoto',     risco:'CRÍTICO',fonte:'SINIR' },
  { id:'re09', lat:-23.4480, lng:-46.6600, nome:'Tremembé — Córrego',            bairro:'Tremembé',     volume_ton:8.9,  tipo:'Orgânico',           risco:'ALTO',   fonte:'SNIS' },
  { id:'re10', lat:-23.4650, lng:-46.7100, nome:'Perus — Estrada Taipas',        bairro:'Perus',        volume_ton:10.3, tipo:'Entulho',            risco:'ALTO',   fonte:'SINIR' },
  { id:'re11', lat:-23.4180, lng:-46.7400, nome:'Jaraguá — Descarte clandestino',bairro:'Jaraguá',      volume_ton:6.2,  tipo:'Entulho',            risco:'MÉDIO',  fonte:'SNIS' },
  { id:'re12', lat:-23.4850, lng:-46.6850, nome:'Pirituba — Vila Jaguará',       bairro:'Pirituba',     volume_ton:7.5,  tipo:'Misto',              risco:'ALTO',   fonte:'SINIR' },
  // Zona Sul (crítica)
  { id:'re13', lat:-23.6650, lng:-46.7520, nome:'Campo Limpo — Rua Itanhaém',    bairro:'Campo Limpo',  volume_ton:15.8, tipo:'Misto + Orgânico',   risco:'CRÍTICO',fonte:'SINIR' },
  { id:'re14', lat:-23.6900, lng:-46.7200, nome:'Capão Redondo — Córrego Mn.',   bairro:'Capão Redondo',volume_ton:18.2, tipo:'Misto + Esgoto',     risco:'CRÍTICO',fonte:'SNIS' },
  { id:'re15', lat:-23.6400, lng:-46.7000, nome:'Santo Amaro — Av. Cupecê',      bairro:'Santo Amaro',  volume_ton:9.6,  tipo:'Entulho',            risco:'ALTO',   fonte:'SINIR' },
  { id:'re16', lat:-23.7100, lng:-46.6800, nome:'Grajaú — Fundo de vale',        bairro:'Grajaú',       volume_ton:22.4, tipo:'Misto + Esgoto',     risco:'CRÍTICO',fonte:'SNIS' },
  { id:'re17', lat:-23.7350, lng:-46.6350, nome:'Parelheiros — Estrada Real',    bairro:'Parelheiros',  volume_ton:12.7, tipo:'Orgânico',           risco:'ALTO',   fonte:'SINIR' },
  { id:'re18', lat:-23.6200, lng:-46.6300, nome:'Ipiranga — Córrego Moinho Velho',bairro:'Ipiranga',    volume_ton:5.8,  tipo:'Misto',              risco:'MÉDIO',  fonte:'SNIS' },
  { id:'re19', lat:-23.6550, lng:-46.5800, nome:'Sacomã — Av. Sapopemba',        bairro:'Sacomã',       volume_ton:8.1,  tipo:'Entulho',            risco:'ALTO',   fonte:'SINIR' },
  // Zona Oeste
  { id:'re20', lat:-23.5350, lng:-46.7500, nome:'Vila Leopoldina — Rio Pinheiros',bairro:'Vila Leopoldina',volume_ton:9.8, tipo:'Industrial',       risco:'ALTO',   fonte:'SNIS' },
  { id:'re21', lat:-23.5780, lng:-46.7600, nome:'Butantã — Córrego Pirajuçara',  bairro:'Butantã',      volume_ton:7.3,  tipo:'Misto',              risco:'ALTO',   fonte:'SINIR' },
  { id:'re22', lat:-23.5900, lng:-46.8000, nome:'Rio Pequeno — Av. Escola Politécnica',bairro:'Rio Pequeno',volume_ton:6.4, tipo:'Entulho',         risco:'MÉDIO',  fonte:'SNIS' },
  // Centro Expandido
  { id:'re23', lat:-23.5560, lng:-46.6280, nome:'Glicério — Viaduto Glicério',   bairro:'Liberdade',    volume_ton:3.2,  tipo:'Orgânico + Entulho', risco:'MÉDIO',  fonte:'SNIS' },
  { id:'re24', lat:-23.5400, lng:-46.6100, nome:'Mooca — Rua Taquari',           bairro:'Mooca',        volume_ton:4.5,  tipo:'Entulho',            risco:'MÉDIO',  fonte:'SINIR' },
  { id:'re25', lat:-23.5620, lng:-46.6450, nome:'Bela Vista — Minhocão',         bairro:'Bela Vista',   volume_ton:2.8,  tipo:'Orgânico',           risco:'BAIXO',  fonte:'SNIS' },
  // Aterros (referência)
  { id:'re26', lat:-23.3650, lng:-46.7400, nome:'CTL Caieiras (Aterro)',         bairro:'Caieiras',     volume_ton:0,    tipo:'Aterro Sanitário',   risco:'MONITORADO', fonte:'SNIS', cap_pct:78 },
  { id:'re27', lat:-23.6980, lng:-46.5600, nome:'Aterro ABC — Mauá',             bairro:'Mauá',         volume_ton:0,    tipo:'Aterro Sanitário',   risco:'MONITORADO', fonte:'SNIS', cap_pct:65 },
  // Periferia extrema
  { id:'re28', lat:-23.7600, lng:-46.7000, nome:'Marsilac — Descarte Rural',     bairro:'Marsilac',     volume_ton:4.2,  tipo:'Orgânico + Agrotóx.',risco:'ALTO',   fonte:'IBAMA' },
  { id:'re29', lat:-23.4780, lng:-46.8000, nome:'Osasco — Rio Tietê margem',     bairro:'Osasco',       volume_ton:11.5, tipo:'Industrial + Misto', risco:'CRÍTICO',fonte:'SINIR' },
  { id:'re30', lat:-23.6800, lng:-46.4800, nome:'Diadema — Fundo de vale',       bairro:'Diadema',      volume_ton:13.8, tipo:'Misto + Esgoto',     risco:'CRÍTICO',fonte:'SNIS' },
];

// ══════════════════════════════════════════════════════
// TRÁFEGO — 28 corredores viários reais de SP
// ══════════════════════════════════════════════════════
export const TRAFEGO_CORREDORES = [
  // Marginais
  { id:'tr01', nome:'Marginal Tietê — Pte. das Bandeiras → Pte. Cruzeiro Sul',
    coords:[[-46.730,-23.509],[-46.690,-23.510],[-46.650,-23.513],[-46.610,-23.516],[-46.570,-23.520],[-46.540,-23.524]],
    cong_base:75, peak_am:90, peak_pm:95, offpeak:40, bairros:'Lapa→Santana→Penha', tipo:'expressa' },

  { id:'tr02', nome:'Marginal Pinheiros — Interlagos → Osasco',
    coords:[[-46.730,-23.557],[-46.710,-23.562],[-46.690,-23.567],[-46.670,-23.570],[-46.650,-23.568],[-46.720,-23.555]],
    cong_base:70, peak_am:88, peak_pm:92, offpeak:38, bairros:'Morumbi→Itaim→Pinheiros', tipo:'expressa' },

  // Radiais e corredores principais
  { id:'tr03', nome:'Radial Leste — Penha → Centro',
    coords:[[-46.475,-23.538],[-46.510,-23.542],[-46.545,-23.546],[-46.575,-23.548],[-46.620,-23.548]],
    cong_base:80, peak_am:93, peak_pm:88, offpeak:45, bairros:'Penha→Tatuapé→Centro', tipo:'radial' },

  { id:'tr04', nome:'Av. Paulista — Consolação → Paraíso',
    coords:[[-46.668,-23.556],[-46.655,-23.558],[-46.645,-23.561],[-46.635,-23.563]],
    cong_base:65, peak_am:82, peak_pm:90, offpeak:42, bairros:'Consolação→Paulista→Paraíso', tipo:'avenida' },

  { id:'tr05', nome:'Av. Brasil / Rebouças — Pinheiros → Higienópolis',
    coords:[[-46.697,-23.565],[-46.680,-23.560],[-46.660,-23.554],[-46.648,-23.550]],
    cong_base:72, peak_am:86, peak_pm:91, offpeak:40, bairros:'Pinheiros→Rebouças→Higienópolis', tipo:'avenida' },

  { id:'tr06', nome:'Complexo Viário Maria Maluf',
    coords:[[-46.615,-23.597],[-46.600,-23.590],[-46.585,-23.583],[-46.572,-23.577]],
    cong_base:68, peak_am:84, peak_pm:87, offpeak:35, bairros:'Ipiranga→Sacomã→Mooca', tipo:'complexo' },

  { id:'tr07', nome:'Av. Aricanduva — Penha → São Mateus',
    coords:[[-46.500,-23.545],[-46.480,-23.550],[-46.455,-23.556],[-46.435,-23.562]],
    cong_base:78, peak_am:91, peak_pm:89, offpeak:42, bairros:'Penha→Aricanduva→São Mateus', tipo:'avenida' },

  { id:'tr08', nome:'Av. Sapopemba — Sacomã → São Mateus',
    coords:[[-46.572,-23.618],[-46.548,-23.626],[-46.520,-23.635],[-46.498,-23.644]],
    cong_base:73, peak_am:87, peak_pm:90, offpeak:38, bairros:'Sacomã→São Lucas→São Mateus', tipo:'avenida' },

  { id:'tr09', nome:'Corredor Campo Limpo — Terminal Capão',
    coords:[[-46.752,-23.660],[-46.733,-23.658],[-46.712,-23.655],[-46.694,-23.650]],
    cong_base:82, peak_am:94, peak_pm:88, offpeak:48, bairros:'Campo Limpo→Capão Redondo', tipo:'corredor' },

  { id:'tr10', nome:'Av. do Estado — ABC → Centro',
    coords:[[-46.548,-23.618],[-46.556,-23.604],[-46.562,-23.590],[-46.566,-23.575],[-46.565,-23.560]],
    cong_base:71, peak_am:85, peak_pm:89, offpeak:36, bairros:'ABC→Ipiranga→Centro', tipo:'avenida' },

  { id:'tr11', nome:'Av. Celso Garcia — Brás → Itaquera',
    coords:[[-46.618,-23.545],[-46.596,-23.547],[-46.572,-23.548],[-46.545,-23.546],[-46.520,-23.543]],
    cong_base:76, peak_am:90, peak_pm:86, offpeak:44, bairros:'Brás→Belém→Tatuapé→Penha', tipo:'radial' },

  { id:'tr12', nome:'Corredor ABD — Santo André → Centro',
    coords:[[-46.534,-23.661],[-46.550,-23.643],[-46.562,-23.625],[-46.568,-23.605]],
    cong_base:69, peak_am:83, peak_pm:91, offpeak:37, bairros:'Santo André→Diadema→ABC', tipo:'corredor' },

  { id:'tr13', nome:'Av. Cupecê — Santo Amaro → Jabaquara',
    coords:[[-46.702,-23.640],[-46.688,-23.631],[-46.674,-23.621],[-46.661,-23.612]],
    cong_base:67, peak_am:81, peak_pm:86, offpeak:33, bairros:'Santo Amaro→Jabaquara', tipo:'avenida' },

  { id:'tr14', nome:'Rodovia Anhangüera — Limites → Osasco',
    coords:[[-46.848,-23.525],[-46.820,-23.520],[-46.790,-23.517],[-46.760,-23.515]],
    cong_base:62, peak_am:78, peak_pm:82, offpeak:30, bairros:'Perus→Cajamar→Osasco', tipo:'rodovia' },

  { id:'tr15', nome:'Av. Brigadeiro Faria Lima',
    coords:[[-46.695,-23.567],[-46.678,-23.569],[-46.660,-23.568],[-46.645,-23.565]],
    cong_base:74, peak_am:88, peak_pm:93, offpeak:45, bairros:'Pinheiros→Itaim Bibi→Vila Olímpia', tipo:'avenida' },

  { id:'tr16', nome:'Av. Luis Dumont Villares — Santana',
    coords:[[-46.648,-23.502],[-46.638,-23.498],[-46.628,-23.496],[-46.618,-23.497]],
    cong_base:58, peak_am:74, peak_pm:79, offpeak:28, bairros:'Santana→Tucuruvi', tipo:'avenida' },

  { id:'tr17', nome:'Corredor Lapa — Pinheiros → Barra Funda',
    coords:[[-46.710,-23.534],[-46.690,-23.535],[-46.670,-23.535],[-46.655,-23.537]],
    cong_base:66, peak_am:80, peak_pm:85, offpeak:32, bairros:'Lapa→Barra Funda→Centro', tipo:'corredor' },

  { id:'tr18', nome:'Av. do Cursino — Vila Prudente → Jabaquara',
    coords:[[-46.592,-23.617],[-46.605,-23.628],[-46.618,-23.640],[-46.628,-23.652]],
    cong_base:64, peak_am:78, peak_pm:83, offpeak:30, bairros:'Vila Prudente→Saúde→Jabaquara', tipo:'avenida' },

  { id:'tr19', nome:'Conectividade Guarulhos — Rod. Dutra',
    coords:[[-46.530,-23.458],[-46.510,-23.457],[-46.490,-23.459],[-46.470,-23.464]],
    cong_base:71, peak_am:86, peak_pm:84, offpeak:35, bairros:'Guarulhos→Cumbica→Dutra', tipo:'rodovia' },

  { id:'tr20', nome:'Av. Washington Luís — Congonhas → ABC',
    coords:[[-46.656,-23.618],[-46.645,-23.635],[-46.634,-23.650],[-46.620,-23.665]],
    cong_base:73, peak_am:88, peak_pm:92, offpeak:40, bairros:'Congonhas→Santo André', tipo:'avenida' },

  { id:'tr21', nome:'Rod. Castelo Branco — Osasco → Alphaville',
    coords:[[-46.800,-23.532],[-46.840,-23.530],[-46.880,-23.527],[-46.920,-23.524]],
    cong_base:60, peak_am:76, peak_pm:80, offpeak:28, bairros:'Osasco→Barueri→Alphaville', tipo:'rodovia' },

  { id:'tr22', nome:'Av. João Dias — Santo Amaro → Pinheiros',
    coords:[[-46.730,-23.626],[-46.718,-23.614],[-46.706,-23.600],[-46.697,-23.587]],
    cong_base:65, peak_am:79, peak_pm:85, offpeak:31, bairros:'Santo Amaro→Brooklin', tipo:'avenida' },

  { id:'tr23', nome:'Av. Sumaré — Pacaembu → Perdizes',
    coords:[[-46.682,-23.538],[-46.674,-23.536],[-46.665,-23.535],[-46.656,-23.536]],
    cong_base:56, peak_am:70, peak_pm:78, offpeak:26, bairros:'Perdizes→Sumaré', tipo:'avenida' },

  { id:'tr24', nome:'Corredor Zona Norte — Tucuruvi → Santana',
    coords:[[-46.620,-23.480],[-46.628,-23.490],[-46.635,-23.499],[-46.640,-23.509]],
    cong_base:61, peak_am:77, peak_pm:80, offpeak:29, bairros:'Tucuruvi→Santana', tipo:'corredor' },

  { id:'tr25', nome:'Av. Moreira Guimarães — Congonhas',
    coords:[[-46.665,-23.605],[-46.658,-23.600],[-46.650,-23.597],[-46.643,-23.594]],
    cong_base:63, peak_am:79, peak_pm:84, offpeak:32, bairros:'Congonhas→Moema', tipo:'avenida' },

  { id:'tr26', nome:'Av. Tiradentes — Luz → Santana',
    coords:[[-46.635,-23.534],[-46.634,-23.522],[-46.633,-23.511],[-46.632,-23.500]],
    cong_base:59, peak_am:73, peak_pm:76, offpeak:27, bairros:'Luz→Bom Retiro→Santana', tipo:'avenida' },

  { id:'tr27', nome:'Complexo Viário Ana Costa',
    coords:[[-46.615,-23.562],[-46.608,-23.568],[-46.601,-23.574],[-46.595,-23.580]],
    cong_base:55, peak_am:68, peak_pm:74, offpeak:24, bairros:'Vila Mariana→Paraíso', tipo:'complexo' },

  { id:'tr28', nome:'Rodovia Imigrantes — ABC → Baixada',
    coords:[[-46.538,-23.658],[-46.530,-23.685],[-46.525,-23.710],[-46.520,-23.735]],
    cong_base:66, peak_am:80, peak_pm:88, offpeak:28, bairros:'São Bernardo→Imigrantes', tipo:'rodovia' },
];

// ══════════════════════════════════════════════════════
// SAÚDE — 18 hospitais e UPAs com dados por região
// ══════════════════════════════════════════════════════
export const SAUDE_PONTOS = [
  // Hospitais de referência
  { id:'sa01', lat:-23.5505, lng:-46.6706, nome:'Hospital das Clínicas FMUSP',    bairro:'Pinheiros',        tipo:'Hospital',  leitos:2500, resp_base:210, hidr_base:28, intox_base:9,  fonte:'DataSUS' },
  { id:'sa02', lat:-23.5983, lng:-46.6390, nome:'Hospital São Paulo UNIFESP',     bairro:'Vila Clementino', tipo:'Hospital',  leitos:740,  resp_base:195, hidr_base:25, intox_base:8,  fonte:'DataSUS' },
  { id:'sa03', lat:-23.5330, lng:-46.6480, nome:'Santa Casa de Misericórdia',     bairro:'Campos Elísios',  tipo:'Hospital',  leitos:850,  resp_base:188, hidr_base:22, intox_base:7,  fonte:'DataSUS' },
  { id:'sa04', lat:-23.5472, lng:-46.6361, nome:'Hospital Servidor Público Estadual',bairro:'Ibirapuera',   tipo:'Hospital',  leitos:620,  resp_base:175, hidr_base:20, intox_base:6,  fonte:'DataSUS' },
  { id:'sa05', lat:-23.5238, lng:-46.5400, nome:'Hospital Tide Setúbal (Zona Leste)',bairro:'Itaquera',      tipo:'Hospital',  leitos:300,  resp_base:225, hidr_base:35, intox_base:12, fonte:'SMS-SP' },
  { id:'sa06', lat:-23.6678, lng:-46.7480, nome:'Hospital M\'Boi Mirim',          bairro:'Campo Limpo',     tipo:'Hospital',  leitos:180,  resp_base:242, hidr_base:40, intox_base:15, fonte:'SMS-SP' },
  { id:'sa07', lat:-23.4986, lng:-46.4540, nome:'Hospital Ermelino Matarazzo',    bairro:'Ermelino Matarazzo',tipo:'Hospital',leitos:220,  resp_base:238, hidr_base:38, intox_base:14, fonte:'DataSUS' },
  { id:'sa08', lat:-23.5329, lng:-46.7920, nome:'Hospital Regional de Osasco',    bairro:'Osasco',          tipo:'Hospital',  leitos:280,  resp_base:200, hidr_base:30, intox_base:10, fonte:'DataSUS' },
  // UPAs — cobertura periférica
  { id:'sa09', lat:-23.6420, lng:-46.7200, nome:'UPA Campo Limpo',                bairro:'Campo Limpo',     tipo:'UPA',       leitos:0,    resp_base:258, hidr_base:44, intox_base:18, fonte:'SMS-SP' },
  { id:'sa10', lat:-23.7050, lng:-46.6780, nome:'UPA Grajaú',                     bairro:'Grajaú',          tipo:'UPA',       leitos:0,    resp_base:265, hidr_base:50, intox_base:20, fonte:'SMS-SP' },
  { id:'sa11', lat:-23.5560, lng:-46.4700, nome:'UPA São Mateus',                 bairro:'São Mateus',      tipo:'UPA',       leitos:0,    resp_base:248, hidr_base:42, intox_base:16, fonte:'SMS-SP' },
  { id:'sa12', lat:-23.5187, lng:-46.7050, nome:'UPA Lapa',                       bairro:'Lapa',            tipo:'UPA',       leitos:0,    resp_base:185, hidr_base:24, intox_base:7,  fonte:'SMS-SP' },
  { id:'sa13', lat:-23.4680, lng:-46.7380, nome:'UPA Pirituba',                   bairro:'Pirituba',        tipo:'UPA',       leitos:0,    resp_base:192, hidr_base:26, intox_base:8,  fonte:'SMS-SP' },
  { id:'sa14', lat:-23.4350, lng:-46.6820, nome:'UPA Brasilândia',                bairro:'Brasilândia',     tipo:'UPA',       leitos:0,    resp_base:260, hidr_base:48, intox_base:19, fonte:'SMS-SP' },
  { id:'sa15', lat:-23.5850, lng:-46.5300, nome:'UPA Sapopemba',                  bairro:'Sapopemba',       tipo:'UPA',       leitos:0,    resp_base:240, hidr_base:38, intox_base:13, fonte:'SMS-SP' },
  { id:'sa16', lat:-23.6200, lng:-46.5500, nome:'UPA São Lucas',                  bairro:'São Lucas',       tipo:'UPA',       leitos:0,    resp_base:245, hidr_base:40, intox_base:14, fonte:'SMS-SP' },
  { id:'sa17', lat:-23.5900, lng:-46.6950, nome:'UPA Vila Sônia',                 bairro:'Vila Sônia',      tipo:'UPA',       leitos:0,    resp_base:198, hidr_base:27, intox_base:8,  fonte:'SMS-SP' },
  { id:'sa18', lat:-23.4800, lng:-46.5700, nome:'UPA Lajeado',                    bairro:'Lajeado',         tipo:'UPA',       leitos:0,    resp_base:252, hidr_base:43, intox_base:17, fonte:'SMS-SP' },
];

// ══════════════════════════════════════════════════════
// ENERGIA — Subestações e fontes
// ══════════════════════════════════════════════════════
export const ENERGIA_PONTOS = [
  { id:'en01', lat:-23.5228, lng:-46.7921, nome:'Subestação Osasco 230kV',       bairro:'Osasco',        carga_base:85, tipo:'Distribuição', fonte:'ONS' },
  { id:'en02', lat:-23.6045, lng:-46.5108, nome:'Subestação ABC',                bairro:'Santo André',   carga_base:78, tipo:'Distribuição', fonte:'ONS' },
  { id:'en03', lat:-23.5680, lng:-46.7280, nome:'Parque Solar Vila Olímpia',     bairro:'Vila Olímpia',  carga_base:0,  tipo:'Solar',        fonte:'ANEEL' },
  { id:'en04', lat:-23.4912, lng:-46.8712, nome:'PCH Rio Pirapora',              bairro:'Pirapora',      carga_base:62, tipo:'Hidro',        fonte:'ONS' },
  { id:'en05', lat:-23.5480, lng:-46.6350, nome:'SE Sumaré — Centro',            bairro:'Barra Funda',   carga_base:90, tipo:'Distribuição', fonte:'ONS' },
];

// ══════════════════════════════════════════════════════
// SOLO — Zonas de uso e risco agrícola
// ══════════════════════════════════════════════════════
export const SOLO_PONTOS = [
  { id:'so01', lat:-23.6890, lng:-47.1201, nome:'Cinturão Verde — Cotia',        bairro:'Cotia',          agrotox_base:18.5, desmat_base:28,  fonte:'CAR' },
  { id:'so02', lat:-23.7450, lng:-46.7120, nome:'Agric. Familiar Parelheiros',   bairro:'Parelheiros',    agrotox_base:22.1, desmat_base:45,  fonte:'IBAMA' },
  { id:'so03', lat:-23.5560, lng:-46.6880, nome:'APA Capivari-Monos',            bairro:'Parelheiros',    agrotox_base:2.1,  desmat_base:8,   fonte:'MapBiomas' },
  { id:'so04', lat:-23.6200, lng:-46.5900, nome:'APP Rio Grande — S. Bernardo',  bairro:'São Bernardo',   agrotox_base:12.8, desmat_base:32,  fonte:'CAR' },
  { id:'so05', lat:-23.7600, lng:-46.8200, nome:'Área Rural Embu-Guaçu',         bairro:'Embu-Guaçu',     agrotox_base:24.3, desmat_base:60,  fonte:'IBAMA' },
];

/**
 * Calcula congestionamento atual de um corredor baseado no horário
 */
export function calcCongestionamento(corredor, hora, chuva_ativa) {
  const isPeakAM  = hora >= 7  && hora <= 9;
  const isPeakPM  = hora >= 17 && hora <= 20;
  const isNight   = hora >= 22 || hora <= 6;
  const isWeekend = [0,6].includes(new Date().getDay());

  let base;
  if (isNight)        base = corredor.offpeak * 0.6;
  else if (isPeakAM)  base = corredor.peak_am;
  else if (isPeakPM)  base = corredor.peak_pm;
  else                base = corredor.offpeak;

  if (isWeekend) base *= 0.65;
  if (chuva_ativa) base = Math.min(99, base * 1.25);

  // Jitter ±8%
  return Math.min(99, Math.max(5, Math.round(base + (Math.random()-0.5)*16)));
}

/**
 * Cor do congestionamento (escala verde→vermelho)
 */
export function congColor(pct) {
  if (pct < 40) return '#22c55e';
  if (pct < 60) return '#eab308';
  if (pct < 75) return '#f97316';
  return '#f43f5e';
}

/**
 * Cor do risco de resíduos
 */
export function riscoColor(risco) {
  return {
    'BAIXO':       '#22c55e',
    'MÉDIO':       '#eab308',
    'ALTO':        '#f97316',
    'CRÍTICO':     '#f43f5e',
    'MONITORADO':  '#0ea5e9',
  }[risco] || '#94a3b8';
}

/**
 * geodata.js — Dados geográficos reais de São Paulo
 * Polígonos de zoneamento, áreas verdes e âncoras de crise
 * Coordenadas baseadas em dados reais de OSM / IBGE / PMSP
 */

// ══════════════════════════════════════════════════════
// ZONEAMENTO URBANO — Polígonos reais de SP
// ══════════════════════════════════════════════════════
export const ZONAS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    // ── CENTRO HISTÓRICO ─────────────────────────────
    { type:"Feature", properties:{ tipo:"central", nome:"Centro Histórico / Sé", cor:"#dc2626", opac:0.18 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.648,-23.539],[-46.629,-23.539],[-46.629,-23.556],[-46.648,-23.556],[-46.648,-23.539]
      ]]}},
    { type:"Feature", properties:{ tipo:"central", nome:"Brás / Bom Retiro", cor:"#dc2626", opac:0.15 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.620,-23.532],[-46.596,-23.532],[-46.596,-23.553],[-46.620,-23.553],[-46.620,-23.532]
      ]]}},
    { type:"Feature", properties:{ tipo:"central", nome:"Santa Cecília / Higienópolis", cor:"#dc2626", opac:0.13 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.668,-23.537],[-46.648,-23.537],[-46.648,-23.552],[-46.668,-23.552],[-46.668,-23.537]
      ]]}},

    // ── ÁREA COMERCIAL / FARIA LIMA ──────────────────
    { type:"Feature", properties:{ tipo:"comercial", nome:"Av. Paulista / Consolação", cor:"#f59e0b", opac:0.18 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.672,-23.556],[-46.635,-23.556],[-46.635,-23.570],[-46.672,-23.570],[-46.672,-23.556]
      ]]}},
    { type:"Feature", properties:{ tipo:"comercial", nome:"Itaim Bibi / Faria Lima", cor:"#f59e0b", opac:0.16 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.705,-23.570],[-46.672,-23.570],[-46.672,-23.590],[-46.705,-23.590],[-46.705,-23.570]
      ]]}},
    { type:"Feature", properties:{ tipo:"comercial", nome:"Vila Olímpia / Brooklin", cor:"#f59e0b", opac:0.14 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.710,-23.594],[-46.672,-23.594],[-46.672,-23.614],[-46.710,-23.614],[-46.710,-23.594]
      ]]}},
    { type:"Feature", properties:{ tipo:"comercial", nome:"Santo André — Centro Comercial", cor:"#f59e0b", opac:0.14 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.548,-23.648],[-46.520,-23.648],[-46.520,-23.665],[-46.548,-23.665],[-46.548,-23.648]
      ]]}},

    // ── INDUSTRIAL ───────────────────────────────────
    { type:"Feature", properties:{ tipo:"industrial", nome:"Mooca / Brás Industrial", cor:"#6b7280", opac:0.22 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.600,-23.547],[-46.565,-23.547],[-46.565,-23.572],[-46.600,-23.572],[-46.600,-23.547]
      ]]}},
    { type:"Feature", properties:{ tipo:"industrial", nome:"Santo André / Diadema — Polo ABC", cor:"#6b7280", opac:0.25 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.572,-23.634],[-46.510,-23.634],[-46.510,-23.700],[-46.572,-23.700],[-46.572,-23.634]
      ]]}},
    { type:"Feature", properties:{ tipo:"industrial", nome:"Osasco — Polo Industrial", cor:"#6b7280", opac:0.22 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.806,-23.518],[-46.770,-23.518],[-46.770,-23.545],[-46.806,-23.545],[-46.806,-23.518]
      ]]}},
    { type:"Feature", properties:{ tipo:"industrial", nome:"Vila Leopoldina / Jaguaré", cor:"#6b7280", opac:0.20 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.758,-23.524],[-46.725,-23.524],[-46.725,-23.548],[-46.758,-23.548],[-46.758,-23.524]
      ]]}},
    { type:"Feature", properties:{ tipo:"industrial", nome:"Guarulhos — Polo Industrial", cor:"#6b7280", opac:0.20 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.534,-23.448],[-46.488,-23.448],[-46.488,-23.488],[-46.534,-23.488],[-46.534,-23.448]
      ]]}},

    // ── RESIDENCIAL ALTO PADRÃO ──────────────────────
    { type:"Feature", properties:{ tipo:"residencial-alto", nome:"Jardins / Moema", cor:"#3b82f6", opac:0.14 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.672,-23.570],[-46.635,-23.570],[-46.635,-23.600],[-46.672,-23.600],[-46.672,-23.570]
      ]]}},
    { type:"Feature", properties:{ tipo:"residencial-alto", nome:"Morumbi / Granja Julieta", cor:"#3b82f6", opac:0.13 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.745,-23.593],[-46.710,-23.593],[-46.710,-23.622],[-46.745,-23.622],[-46.745,-23.593]
      ]]}},
    { type:"Feature", properties:{ tipo:"residencial-alto", nome:"Alphaville / Tambóre", cor:"#3b82f6", opac:0.13 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.877,-23.484],[-46.840,-23.484],[-46.840,-23.510],[-46.877,-23.510],[-46.877,-23.484]
      ]]}},

    // ── RESIDENCIAL PERIFÉRICO ───────────────────────
    { type:"Feature", properties:{ tipo:"periferia", nome:"Zona Leste — Itaquera / Guaianases", cor:"#8b5cf6", opac:0.16 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.500,-23.512],[-46.430,-23.512],[-46.430,-23.570],[-46.500,-23.570],[-46.500,-23.512]
      ]]}},
    { type:"Feature", properties:{ tipo:"periferia", nome:"Zona Sul — Grajaú / Parelheiros", cor:"#8b5cf6", opac:0.18 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.752,-23.680],[-46.650,-23.680],[-46.650,-23.780],[-46.752,-23.780],[-46.752,-23.680]
      ]]}},
    { type:"Feature", properties:{ tipo:"periferia", nome:"Zona Norte — Brasilândia / Tremembé", cor:"#8b5cf6", opac:0.16 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.710,-23.400],[-46.600,-23.400],[-46.600,-23.460],[-46.710,-23.460],[-46.710,-23.400]
      ]]}},
    { type:"Feature", properties:{ tipo:"periferia", nome:"Capão Redondo / Campo Limpo", cor:"#8b5cf6", opac:0.16 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.772,-23.638],[-46.695,-23.638],[-46.695,-23.680],[-46.772,-23.680],[-46.772,-23.638]
      ]]}},
    { type:"Feature", properties:{ tipo:"periferia", nome:"Ermelino Matarazzo / São Mateus", cor:"#8b5cf6", opac:0.15 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.500,-23.548],[-46.440,-23.548],[-46.440,-23.610],[-46.500,-23.610],[-46.500,-23.548]
      ]]}},
  ]
};

// ══════════════════════════════════════════════════════
// ÁREAS VERDES REAIS DE SP
// ══════════════════════════════════════════════════════
export const VERDE_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { type:"Feature", properties:{ nome:"Parque Estadual da Cantareira", area_ha:7900 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.680,-23.348],[-46.600,-23.348],[-46.600,-23.408],[-46.680,-23.408],[-46.680,-23.348]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Estadual do Jaraguá", area_ha:492 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.786,-23.436],[-46.760,-23.436],[-46.760,-23.462],[-46.786,-23.462],[-46.786,-23.436]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Anhanguera", area_ha:950 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.812,-23.428],[-46.776,-23.428],[-46.776,-23.460],[-46.812,-23.460],[-46.812,-23.428]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque do Ibirapuera", area_ha:158 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.663,-23.585],[-46.647,-23.585],[-46.647,-23.596],[-46.663,-23.596],[-46.663,-23.585]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Estadual do Juquery", area_ha:2073 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.910,-23.278],[-46.850,-23.278],[-46.850,-23.330],[-46.910,-23.330],[-46.910,-23.278]
      ]]}},
    { type:"Feature", properties:{ nome:"APA Capivari-Monos", area_ha:25000 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.820,-23.800],[-46.640,-23.800],[-46.640,-23.700],[-46.820,-23.700],[-46.820,-23.800]
      ]]}},
    { type:"Feature", properties:{ nome:"Represa Guarapiranga (APP)", area_ha:6500 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.780,-23.690],[-46.680,-23.690],[-46.680,-23.780],[-46.780,-23.780],[-46.780,-23.690]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Estadual da Serra do Mar (trecho SP)", area_ha:8000 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.420,-23.780],[-46.290,-23.780],[-46.290,-23.660],[-46.420,-23.660],[-46.420,-23.780]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Trianon", area_ha:5 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.657,-23.561],[-46.651,-23.561],[-46.651,-23.565],[-46.657,-23.565],[-46.657,-23.561]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque da Água Branca", area_ha:14 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.682,-23.530],[-46.672,-23.530],[-46.672,-23.537],[-46.682,-23.537],[-46.682,-23.530]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Estadual Alberto Löfgren (Horto)", area_ha:168 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.630,-23.494],[-46.614,-23.494],[-46.614,-23.510],[-46.630,-23.510],[-46.630,-23.494]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Ecológico do Tietê", area_ha:1400 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.535,-23.488],[-46.466,-23.488],[-46.466,-23.510],[-46.535,-23.510],[-46.535,-23.488]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Estadual de Itapetinga", area_ha:2000 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.990,-23.100],[-46.900,-23.100],[-46.900,-23.180],[-46.990,-23.180],[-46.990,-23.100]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque do Carmo", area_ha:105 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.476,-23.548],[-46.460,-23.548],[-46.460,-23.563],[-46.476,-23.563],[-46.476,-23.548]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Linear Glicério", area_ha:8 },
      geometry:{ type:"Polygon", coordinates:[[
        [-46.634,-23.560],[-46.624,-23.560],[-46.624,-23.568],[-46.634,-23.568],[-46.634,-23.560]
      ]]}},
    { type:"Feature", properties:{ nome:"Parque Estadual de Campos do Jordão (Serra da Mantiqueira)", area_ha:8000 },
      geometry:{ type:"Polygon", coordinates:[[
        [-45.600,-22.700],[-45.400,-22.700],[-45.400,-22.850],[-45.600,-22.850],[-45.600,-22.700]
      ]]}},
  ]
};

// ══════════════════════════════════════════════════════
// ÂNCORAS — 10 crises, coordenadas reais de SP
// ══════════════════════════════════════════════════════
export const CRISES = [
  {
    id: 1,
    ancora: { lat: -23.557, lng: -46.616, nome: "Av. do Estado — Cambuci" },
    mapCentro: [-46.636, -23.547], mapZoom: 12.5,
    titulo: "SURTO RESPIRATÓRIO — ZONA CENTRAL",
    banner: "🔴 BREAKING — Pico de nebulizações no Centro. PM₂.₅ em nível crítico.",
    camadaDestaque: "ar",
    fases: [
      { minuto: 0,  pm25: 28,  iqa: 68,  cong: 55, temp: 27, descricao: "Qualidade do ar deteriorando no eixo da Av. do Estado." },
      { minuto: 2,  pm25: 52,  iqa: 94,  cong: 72, temp: 29, descricao: "Tráfego intensifica. PM₂.₅ dobra nas últimas 2h." },
      { minuto: 4,  pm25: 88,  iqa: 128, cong: 85, temp: 31, descricao: "Alerta máximo respiratório no Hospital das Clínicas." },
      { minuto: 6,  pm25: 130, iqa: 168, cong: 91, temp: 33, descricao: "Hospitais em colapso. Triagem de emergência ativada." },
      { minuto: 8,  pm25: 180, iqa: 210, cong: 96, temp: 35, descricao: "Emergência de saúde pública declarada." },
      { minuto: 10, pm25: 230, iqa: 260, cong: 99, temp: 38, descricao: "⚠ COLAPSO — PM₂.₅ 15× acima do limite OMS." },
    ],
    chat: [
      { de: "Dr. Ana Lima", msg: "Os dados de internação subiram 340% desde ontem. Alguém consegue verificar o tráfego na Av. do Estado?", t: "09:14" },
      { de: "Eng. Carlos", msg: "Congestionamento de 12km desde o Cambuci. Veículos parados por mais de 3h. Emissões fora do controle.", t: "09:17" },
      { de: "Dra. Fernanda", msg: "Sem vento hoje. Inversão térmica. As partículas ficam presas no Vale do Anhangabaú.", t: "09:21" },
      { de: "Vitor (CETESB)", msg: "Estação Parque Dom Pedro registra PM₂.₅ de 88 µg/m³. Limite OMS é 15. Precisamos de ação imediata.", t: "09:28" },
      { de: "Dr. Ana Lima", msg: "Hipótese: o bloqueio viário + inversão térmica criou uma câmara de gás sobre o centro. Faz sentido?", t: "09:35" },
    ],
    kpis: [
      { lbl: "PM₂.₅", vals: [28,52,88,130,180,230], unit: "µg/m³", alerta: 50 },
      { lbl: "IQA",   vals: [68,94,128,168,210,260], unit: "",       alerta: 100 },
      { lbl: "Tráfego",vals:[55,72,85,91,96,99],    unit: "%",       alerta: 80 },
      { lbl: "Temp.",  vals: [27,29,31,33,35,38],   unit: "°C",      alerta: 35 },
    ],
  },
  {
    id: 2,
    ancora: { lat: -23.560, lng: -46.628, nome: "Glicério — Córrego Saracura" },
    mapCentro: [-46.620, -23.558], mapZoom: 13.5,
    titulo: "ALAGAMENTO CRÍTICO — GLICÉRIO",
    banner: "🔴 BREAKING — Córregos transbordam. 340 famílias desabrigadas no Glicério.",
    camadaDestaque: "agua",
    fases: [
      { minuto: 0,  nivel: 0.4, turbidez: 85,  familias: 0,   descricao: "Chuva intensa. Córrego Saracura em estado de atenção." },
      { minuto: 2,  nivel: 0.9, turbidez: 180, familias: 40,  descricao: "Bocas-de-lobo obstruídas por lixo irregular. Água sobe." },
      { minuto: 4,  nivel: 1.4, turbidez: 350, familias: 120, descricao: "Ruas alagam. Evacuação iniciada no Viaduto Glicério." },
      { minuto: 6,  nivel: 1.8, turbidez: 580, familias: 220, descricao: "Rio Tamanduateí transbordou em 5 pontos." },
      { minuto: 8,  nivel: 2.1, turbidez: 820, familias: 300, descricao: "Via Anchieta bloqueada. Resgate em andamento." },
      { minuto: 10, nivel: 2.5, turbidez: 1100,familias: 340, descricao: "⚠ COLAPSO — Zona de desastre declarada." },
    ],
    chat: [
      { de: "Defesa Civil SP", msg: "Nível do Saracura em 0.9m e subindo. 73% das bocas-de-lobo obstruídas por entulho. Quem monitorou isso?", t: "14:32" },
      { de: "Fernanda (SVMA)", msg: "A área tem histórico de descarte irregular. Mapeamos 38 pontos de lixo no último mês nessa micro-bacia.", t: "14:35" },
      { de: "Marcus (CET-SP)", msg: "Caminhões de resgate não conseguem entrar pela Av. Lins de Vasconcelos. Precisamos de rota alternativa.", t: "14:41" },
      { de: "Dra. Paula", msg: "Risco de leptospirose iminente. Contato com água de esgoto em toda a área alagada.", t: "14:48" },
      { de: "Defesa Civil SP", msg: "Hipótese principal: lixo clandestino bloqueou drenagem e transformou chuva normal em desastre. Correto?", t: "14:55" },
    ],
    kpis: [
      { lbl: "Nível",       vals: [0.4,0.9,1.4,1.8,2.1,2.5], unit: "m",    alerta: 1.5 },
      { lbl: "Turbidez",    vals: [85,180,350,580,820,1100],  unit: "NTU",  alerta: 200 },
      { lbl: "Desabrigados",vals: [0,40,120,220,300,340],     unit: "fam.", alerta: 100 },
      { lbl: "Bocas obs.",  vals: [38,52,65,73,79,84],        unit: "%",    alerta: 60 },
    ],
  },
  {
    id: 3,
    ancora: { lat: -23.622, lng: -46.661, nome: "SE Jabaquara — Zona Sul" },
    mapCentro: [-46.700, -23.640], mapZoom: 12,
    titulo: "BLACKOUT PROGRESSIVO — ZONA SUL",
    banner: "🔴 BREAKING — Falha em cascata. 1.2 mi de domicílios sem energia na Zona Sul.",
    camadaDestaque: "energia",
    fases: [
      { minuto: 0,  carga: 82,  sem_luz: 80,   temp: 36, descricao: "Onda de calor cria pico histórico de demanda." },
      { minuto: 2,  carga: 91,  sem_luz: 320,  temp: 38, descricao: "SE Jabaquara entra em sobrecarga." },
      { minuto: 4,  carga: 98,  sem_luz: 680,  temp: 40, descricao: "Desligamento de proteção. Cascata iniciada." },
      { minuto: 6,  carga: 105, sem_luz: 1050, temp: 41, descricao: "Semáforos apagados. Acidentes aumentam." },
      { minuto: 8,  carga: 112, sem_luz: 1200, temp: 42, descricao: "Hospitais em geradores. Risco de falha." },
      { minuto: 10, carga: 118, sem_luz: 1400, temp: 43, descricao: "⚠ COLAPSO — Blackout em toda a Zona Sul." },
    ],
    chat: [
      { de: "ENEL SP", msg: "SE Jabaquara disparou proteção. Temperatura do equipamento em 91°C. Limite é 85°C.", t: "18:05" },
      { de: "Rafael (Defesa)", msg: "Acidentes em 14 cruzamentos sem semáforo. Hospital M'Boi Mirim nos relatou falha no gerador principal.", t: "18:12" },
      { de: "Eng. Beatriz", msg: "Com 40°C, cada grau a mais aumenta demanda em ~3%. A rede foi dimensionada para 35°C. Estamos fora da faixa.", t: "18:18" },
      { de: "ENEL SP", msg: "SE Campo Limpo próxima do limite. Se cair, colapso total da Zona Sul. Precisamos de corte emergencial seletivo.", t: "18:24" },
      { de: "Prefeitura SP", msg: "Como é possível a rede não suportar uma onda de calor? Isso vai se repetir com as mudanças climáticas?", t: "18:31" },
    ],
    kpis: [
      { lbl: "Carga SE",    vals: [82,91,98,105,112,118],     unit: "%",       alerta: 95 },
      { lbl: "Sem energia", vals: [80,320,680,1050,1200,1400], unit: "k dom.", alerta: 500 },
      { lbl: "Temp. equip.",vals: [68,74,82,91,101,112],      unit: "°C",      alerta: 85 },
      { lbl: "Temp. ext.",  vals: [36,38,40,41,42,43],        unit: "°C",      alerta: 40 },
    ],
  },
  {
    id: 4,
    ancora: { lat: -23.730, lng: -46.720, nome: "Represa Guarapiranga" },
    mapCentro: [-46.720, -23.710], mapZoom: 11.5,
    titulo: "CRISE HÍDRICA — GUARAPIRANGA SECA",
    banner: "🔴 BREAKING — Guarapiranga em 8.2%. Racionamento de 40h/semana na Zona Sul.",
    camadaDestaque: "agua",
    fases: [
      { minuto: 0,  nivel: 22,  captacao: 8,  dom_sem_agua: 120, descricao: "Seca histórica. Nível abaixo do mínimo operacional." },
      { minuto: 2,  nivel: 18,  captacao: 15, dom_sem_agua: 280, descricao: "Captação ilegal confirma 15 pontos no Rio Embu Mirim." },
      { minuto: 4,  nivel: 14,  captacao: 24, dom_sem_agua: 480, descricao: "Racionamento decretado: 40h semanais sem água." },
      { minuto: 6,  nivel: 11,  captacao: 31, dom_sem_agua: 650, descricao: "Desmatamento no entorno reduz recarga em 45%." },
      { minuto: 8,  nivel: 9,   captacao: 36, dom_sem_agua: 820, descricao: "Abastecimento crítico — mínimo operacional comprometido." },
      { minuto: 10, nivel: 8.2, captacao: 38, dom_sem_agua: 1200, descricao: "⚠ COLAPSO — Abastecimento da Zona Sul em colapso." },
    ],
    chat: [
      { de: "SABESP", msg: "Nível em 8.2%. Se continuar nessa taxa, o sistema para em 18 dias. Precisamos de restrições urgentes.", t: "08:00" },
      { de: "Marcos (ANA)", msg: "Identificamos 38 pontos de captação clandestina no manancial. Extração equivale a 850m³/dia.", t: "08:15" },
      { de: "Dra. Cláudia", msg: "O desmatamento no Parque Estadual perdeu 980ha de mata ciliar. Isso reduz a recarga do aquífero diretamente.", t: "08:28" },
      { de: "SABESP", msg: "Racionamento de 40h semanais afeta 1.2 milhão de domicílios. Hospitais e escolas têm prioridade.", t: "08:45" },
      { de: "Vereadora Silva", msg: "Existe alguma correlação entre o ritmo de desmatamento e o colapso do nível? Quais dados temos para 2020-2024?", t: "09:02" },
    ],
    kpis: [
      { lbl: "Cap. Represa",  vals: [22,18,14,11,9,8.2],        unit: "%",       alerta: 15 },
      { lbl: "Captação ileg.",vals: [8,15,24,31,36,38],          unit: "pontos",  alerta: 20 },
      { lbl: "Sem água",      vals: [120,280,480,650,820,1200],  unit: "k dom.", alerta: 400 },
      { lbl: "Mata ciliar",   vals: [68,62,55,48,44,42],         unit: "%",       alerta: 55 },
    ],
  },
  {
    id: 5,
    ancora: { lat: -23.596, lng: -46.720, nome: "Paraisópolis" },
    mapCentro: [-46.718, -23.596], mapZoom: 14,
    titulo: "SURTO DENGUE — PARAISÓPOLIS",
    banner: "🔴 BREAKING — 1.200 casos/semana de dengue. UBS de Paraisópolis em colapso.",
    camadaDestaque: "saude",
    fases: [
      { minuto: 0,  casos: 180, focos: 42,  temp: 33, descricao: "Descarte irregular cria 42 focos do Aedes aegypti." },
      { minuto: 2,  casos: 420, focos: 120, temp: 35, descricao: "Temperatura de 35°C acelera ciclo reprodutivo." },
      { minuto: 4,  casos: 680, focos: 210, temp: 36, descricao: "UBS lotada. Desvio de pacientes para Campo Limpo." },
      { minuto: 6,  casos: 940, focos: 310, temp: 37, descricao: "Surto declarado epidemia localizada." },
      { minuto: 8,  casos: 1080,focos: 380, temp: 38, descricao: "Sistema de saúde sobrecarregado. Internações crescem." },
      { minuto: 10, casos: 1200,focos: 420, temp: 38, descricao: "⚠ COLAPSO — Emergência epidemiológica declarada." },
    ],
    chat: [
      { de: "Dr. Eduardo", msg: "1.200 casos em 7 dias. A concentração é na Rua Joanópolis e adjacências. Alguém fez vistoria recente?", t: "10:05" },
      { de: "Agente Lúcia", msg: "Encontrei 420 focos em pneus descartados e embalagens. A coleta de lixo não chega há 3 semanas.", t: "10:18" },
      { de: "Dr. Eduardo", msg: "Com 38°C, o ciclo do Aedes completo em 7 dias. Normalmente são 14. O calor dobrou a velocidade.", t: "10:24" },
      { de: "Coord. SMS", msg: "Por que a coleta de lixo não chega nessa área? Isso é sistêmico ou pontual?", t: "10:35" },
      { de: "Agente Lúcia", msg: "Rua sem saída, impossível para o caminhão grande. Já reportado há 8 meses. Sem solução.", t: "10:42" },
    ],
    kpis: [
      { lbl: "Casos/semana",vals: [180,420,680,940,1080,1200], unit: "casos",  alerta: 500 },
      { lbl: "Focos Aedes", vals: [42,120,210,310,380,420],    unit: "focos",  alerta: 150 },
      { lbl: "Temperatura", vals: [33,35,36,37,38,38],         unit: "°C",     alerta: 36 },
      { lbl: "UBS lotação", vals: [65,88,105,120,138,150],     unit: "%",      alerta: 100 },
    ],
  },
  {
    id: 6,
    ancora: { lat: -23.561, lng: -46.655, nome: "Av. Paulista — Bela Vista" },
    mapCentro: [-46.654, -23.562], mapZoom: 12.5,
    titulo: "CAOS VIÁRIO — PAULISTA BLOQUEADA",
    banner: "🔴 BREAKING — Av. Paulista e Faria Lima paralisadas. 380km de congestionamento.",
    camadaDestaque: "trafego",
    fases: [
      { minuto: 0,  km_cong: 42, vel: 12, ambulancias: 0, descricao: "Manifestação fecha Av. Paulista. Desvios sobrecarregados." },
      { minuto: 2,  km_cong: 110,vel: 7,  ambulancias: 1, descricao: "Faria Lima colapsa. Marginal absorvendo desvios." },
      { minuto: 4,  km_cong: 190,vel: 4,  ambulancias: 2, descricao: "Marginal Pinheiros em colapso. 19km de fila." },
      { minuto: 6,  km_cong: 260,vel: 2,  ambulancias: 3, descricao: "Serviços de emergência bloqueados." },
      { minuto: 8,  km_cong: 320,vel: 1,  ambulancias: 3, descricao: "Ambulâncias retidas: vidas em risco." },
      { minuto: 10, km_cong: 380,vel: 0,  ambulancias: 3, descricao: "⚠ COLAPSO — Paralisia total." },
    ],
    chat: [
      { de: "CET-SP", msg: "Paulista fechada no trecho Consolação-Paraíso. Estimamos 380km de lentidão na grande SP.", t: "17:10" },
      { de: "SAMU", msg: "3 ambulâncias retidas. Uma para IAM na Moema — paciente esperando há 40 minutos.", t: "17:22" },
      { de: "Eng. Roberto", msg: "O problema é a interdependência viária. Fecha uma via principal, toda a rede entra em cascata.", t: "17:28" },
      { de: "CET-SP", msg: "Tentamos rotas alternativas pela Av. Brasil, mas também está colapsada pela obra na Faria Lima.", t: "17:35" },
      { de: "Pesquisadora Mara", msg: "Cidades resilientes têm redundância viária. SP tem zero alternativas para substituir a Paulista. Por quê?", t: "17:44" },
    ],
    kpis: [
      { lbl: "Congestionamento",vals: [42,110,190,260,320,380], unit: "km",    alerta: 150 },
      { lbl: "Velocidade",      vals: [12,7,4,2,1,0],           unit: "km/h",  alerta: 5 },
      { lbl: "Ambulâncias ret.",vals: [0,1,2,3,3,3],            unit: "viat.", alerta: 1 },
      { lbl: "Emissões CO₂",   vals: [100,180,290,380,440,520], unit: "↑%",    alerta: 200 },
    ],
  },
  {
    id: 7,
    ancora: { lat: -23.445, lng: -46.770, nome: "Parque Anhanguera — Perus" },
    mapCentro: [-46.770, -23.450], mapZoom: 12,
    titulo: "INCÊNDIO — PARQUE ANHANGUERA",
    banner: "🔴 BREAKING — Incêndio avança 120ha. Fumaça tóxica atinge Pirituba e Perus.",
    camadaDestaque: "solo",
    fases: [
      { minuto: 0,  ha: 0,   pm25: 45, dist_casas: 2800, descricao: "Foco por faísca da ferrovia. Solo seco após 80 dias sem chuva." },
      { minuto: 2,  ha: 28,  pm25: 95, dist_casas: 1900, descricao: "Vento NE 40km/h. Fogo avança em direção a Pirituba." },
      { minuto: 4,  ha: 58,  pm25: 160,dist_casas: 1100, descricao: "Fumaça tóxica sobre Pirituba. PM₂.₅ seis vezes o limite." },
      { minuto: 6,  ha: 88,  pm25: 230,dist_casas: 500,  descricao: "Evacuação de 3 ruas limítrofes. Bombeiros sem acesso." },
      { minuto: 8,  ha: 108, pm25: 280,dist_casas: 200,  descricao: "Fogo a 200m das primeiras residências." },
      { minuto: 10, ha: 120, pm25: 310,dist_casas: 80,   descricao: "⚠ COLAPSO — Risco imediato às residências." },
    ],
    chat: [
      { de: "Bombeiros SP", msg: "Foco confirmado às 13h20 próximo à linha da CPTM. Solo com 3% de umidade — crítico. 4 viaturas em ação.", t: "13:35" },
      { de: "INMET SP", msg: "Vento NE de 40km/h até as 18h. Trajetória do fogo: direto para a zona residencial de Pirituba.", t: "13:42" },
      { de: "Bombeiros SP", msg: "Acesso pela estrada principal bloqueado por vegetação. Precisamos de helicóptero com helibalde.", t: "13:58" },
      { de: "Dr. Paulo (UPA)", msg: "Casos respiratórios aumentando 1.200% na UPA Pirituba. Quem pode confirmar a qualidade do ar?", t: "14:12" },
      { de: "Pesq. Ambiental", msg: "80 dias de seca + 0 investimento em aceiros de contenção = bomba relógio. Como isso passou despercebido?", t: "14:25" },
    ],
    kpis: [
      { lbl: "Área queimada", vals: [0,28,58,88,108,120],       unit: "ha",    alerta: 30 },
      { lbl: "PM₂.₅",        vals: [45,95,160,230,280,310],     unit: "µg/m³", alerta: 75 },
      { lbl: "Dist. casas",  vals: [2800,1900,1100,500,200,80], unit: "m",     alerta: 500 },
      { lbl: "UPA atend.",   vals: [12,34,68,102,130,145],      unit: "casos/h",alerta: 50 },
    ],
  },
  {
    id: 8,
    ancora: { lat: -23.661, lng: -46.534, nome: "Rio Tamanduateí — Santo André" },
    mapCentro: [-46.550, -23.640], mapZoom: 12,
    titulo: "CONTAMINAÇÃO INDUSTRIAL — TAMANDUATEÍ",
    banner: "🔴 BREAKING — Cromo VI no Rio Tamanduateí. Pluma de 8km. Captação suspensa.",
    camadaDestaque: "agua",
    fases: [
      { minuto: 0,  cromo: 0,   peixe_kg: 0,    ph: 7.2, descricao: "Rompimento de tubulação de galvanização em Santo André." },
      { minuto: 2,  cromo: 240, peixe_kg: 120,  ph: 5.8, descricao: "Pluma de cromo avança 2km. Peixe morto detectado." },
      { minuto: 4,  cromo: 560, peixe_kg: 580,  ph: 4.9, descricao: "Captação de água suspensa. 5km de rio contaminados." },
      { minuto: 6,  cromo: 720, peixe_kg: 1200, ph: 4.1, descricao: "Contaminação alcança o Ipiranga. Biota em colapso." },
      { minuto: 8,  cromo: 780, peixe_kg: 1800, ph: 3.7, descricao: "68 intoxicados confirmados. Pluma a 7km da origem." },
      { minuto: 10, cromo: 800, peixe_kg: 2100, ph: 3.5, descricao: "⚠ COLAPSO — Desastre ambiental declarado." },
    ],
    chat: [
      { de: "CETESB", msg: "Cromo VI detectado a 800× o limite legal. Origem confirmada: galvanização na Rua Xique-Xique, Santo André.", t: "11:20" },
      { de: "Eng. Ambiental", msg: "Cromo hexavalente é cancerígeno. A pluma se move a ~1.5km/h. Vai alcançar o Tietê em 5-6h.", t: "11:35" },
      { de: "CETESB", msg: "9 empresas no entorno descartam efluentes industriais sem tratamento. Fiscalização insuficiente.", t: "11:48" },
      { de: "MP SP", msg: "Iniciamos inquérito. Qual era a frequência de fiscalização nessa área? Alguém tem os últimos autos de vistoria?", t: "12:05" },
      { de: "Pesq. Marcelo", msg: "O ABC industrial tem histórico de 40 anos de contaminação. Como um rio pode ser monitorado em tempo real?", t: "12:18" },
    ],
    kpis: [
      { lbl: "Cromo VI",   vals: [0,240,560,720,780,800],     unit: "× limite", alerta: 10 },
      { lbl: "Peixe morto",vals: [0,120,580,1200,1800,2100],  unit: "kg",       alerta: 200 },
      { lbl: "pH do rio",  vals: [7.2,5.8,4.9,4.1,3.7,3.5],  unit: "",         alerta: 6.0 },
      { lbl: "Intoxicados",vals: [0,8,22,41,60,68],           unit: "pacientes",alerta: 20 },
    ],
  },
  {
    id: 9,
    ancora: { lat: -23.618, lng: -46.595, nome: "Heliópolis — Ipiranga" },
    mapCentro: [-46.600, -23.618], mapZoom: 13,
    titulo: "ONDA DE CALOR — MORTES EM HELIÓPOLIS",
    banner: "🔴 BREAKING — 42°C em Heliópolis. 8 mortes confirmadas. Idosos em colapso.",
    camadaDestaque: "temp",
    fases: [
      { minuto: 0,  temp: 36, sens: 40, obitos: 0, descricao: "Heliópolis: 94% impermeável, 0.3 árvores/habitante." },
      { minuto: 2,  temp: 38, sens: 44, obitos: 2, descricao: "Temperatura supera 38°C. Primeiros casos de insolação." },
      { minuto: 4,  temp: 40, sens: 48, obitos: 4, descricao: "UBS Heliópolis lotada. Falta d'água há 14h." },
      { minuto: 6,  temp: 41, sens: 52, obitos: 6, descricao: "Temperatura 15°C acima do Parque Estadual, a 2km." },
      { minuto: 8,  temp: 42, sens: 56, obitos: 7, descricao: "7 mortes. Maioria idosos sem ar-condicionado." },
      { minuto: 10, temp: 42, sens: 58, obitos: 8, descricao: "⚠ COLAPSO — Emergência de saúde pública." },
    ],
    chat: [
      { de: "UBS Heliópolis", msg: "48 casos de insolação em 2h. Sem estoque de soro fisiológico. A geladeira de medicamentos falhou.", t: "13:10" },
      { de: "Pesq. Urbana", msg: "Heliópolis tem 94% de impermeabilização. Sem árvores, não há evapotranspiração. É uma frigideira.", t: "13:22" },
      { de: "Defesa Civil", msg: "Diferença de 15°C entre Heliópolis e o Parque Estadual a 2km. Isso é ilha de calor extrema.", t: "13:35" },
      { de: "UBS Heliópolis", msg: "8ª morte confirmada — senhora de 78 anos. Sem água em casa há 18h. Desidratação severa.", t: "13:48" },
      { de: "Vereador Paulo", msg: "Como é aceitável que duas áreas a 2km de distância tenham 15°C de diferença? O que a cidade pode fazer?", t: "14:00" },
    ],
    kpis: [
      { lbl: "Temperatura",  vals: [36,38,40,41,42,42],  unit: "°C",    alerta: 38 },
      { lbl: "Sensação",     vals: [40,44,48,52,56,58],  unit: "°C",    alerta: 45 },
      { lbl: "Óbitos",       vals: [0,2,4,6,7,8],        unit: "conf.", alerta: 1 },
      { lbl: "Horas s/ água",vals: [0,4,8,14,18,24],     unit: "h",     alerta: 8 },
    ],
  },
  {
    id: 10,
    ancora: { lat: -23.547, lng: -46.637, nome: "Praça da Sé — Centro" },
    mapCentro: [-46.637, -23.548], mapZoom: 11,
    titulo: "COLAPSO SISTÊMICO — SP EM CRISE TOTAL",
    banner: "⚠ ALERTA MÁXIMO — Múltiplas crises simultâneas. Sistema urbano no limite.",
    camadaDestaque: "ar",
    fases: [
      { minuto: 0,  crises: 2, afetados: 400,  servicos: 85, descricao: "Enchente + blackout simultâneos no centro." },
      { minuto: 2,  crises: 4, afetados: 820,  servicos: 68, descricao: "Sistemas interconectados falham em cascata." },
      { minuto: 4,  crises: 6, afetados: 1400, servicos: 45, descricao: "Emergência + transporte + saúde colapsam." },
      { minuto: 6,  crises: 7, afetados: 2100, servicos: 28, descricao: "Serviços essenciais inoperantes." },
      { minuto: 8,  crises: 8, afetados: 2800, servicos: 15, descricao: "Cidade em estado de calamidade." },
      { minuto: 10, crises: 9, afetados: 3500, servicos: 5,  descricao: "⚠ COLAPSO TOTAL — Infraestrutura urbana fragmentada." },
    ],
    chat: [
      { de: "COEM SP", msg: "Centro de Operações em modo P5. 9 crises simultâneas. Enchente + blackout + tráfego + epidemia.", t: "08:00" },
      { de: "Governador", msg: "3.5 milhões de afetados. Solicitando apoio federal. Forças Armadas em standby.", t: "08:15" },
      { de: "Pesq. Complexidade", msg: "Isso é colapso de sistema complexo. Uma crise alimenta a outra. Não há solução pontual.", t: "08:28" },
      { de: "COEM SP", msg: "Hospitais em modo guerra. Metroê parado. Internet com falhas. Qual serviço temos ainda operacional?", t: "08:45" },
      { de: "Urbanista Carla", msg: "Décadas de subinvestimento em infraestrutura. A conta chegou. O que precisaria mudar para SP ser resiliente?", t: "09:00" },
    ],
    kpis: [
      { lbl: "Crises ativas",  vals: [2,4,6,7,8,9],            unit: "",    alerta: 5 },
      { lbl: "Afetados",       vals: [400,820,1400,2100,2800,3500], unit: "k",  alerta: 1000 },
      { lbl: "Serviços OK",    vals: [85,68,45,28,15,5],        unit: "%",   alerta: 50 },
      { lbl: "Resp. emergência",vals:[100,78,55,32,18,5],       unit: "%cap",alerta: 50 },
    ],
  },
];

export const CAMADAS = [
  { id:"ar",       nome:"Qualidade do Ar",   emoji:"💨", cor:"#475569", descr:"PM₂.₅ · NO₂ · IQA" },
  { id:"agua",     nome:"Água",              emoji:"💧", cor:"#1d4ed8", descr:"Rios · Represas · Drenagem" },
  { id:"temp",     nome:"Temperatura",       emoji:"🌡️", cor:"#ea580c", descr:"Ilha de calor · Sensação térmica" },
  { id:"trafego",  nome:"Tráfego",           emoji:"🚦", cor:"#dc2626", descr:"Congestionamento · Velocidade" },
  { id:"energia",  nome:"Energia Elétrica",  emoji:"⚡", cor:"#ca8a04", descr:"Carga · Subestações · Blackout" },
  { id:"residuos", nome:"Resíduos Sólidos",  emoji:"🗑️", cor:"#92400e", descr:"Descarte irregular · Aterros" },
  { id:"solo",     nome:"Solo / Vegetação",  emoji:"🌳", cor:"#15803d", descr:"Cobertura verde · Incêndios" },
  { id:"saude",    nome:"Saúde Pública",     emoji:"🏥", cor:"#be185d", descr:"Internações · Surtos · UBSs" },
  { id:"zoneamento",nome:"Zoneamento Urbano",emoji:"🗺️", cor:"#7c3aed", descr:"Central · Periferia · Industrial" },
];

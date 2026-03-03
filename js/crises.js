/**
 * crises.js — 10 Situações-Problema de São Paulo
 * Cada crise tem: narrativa + camadas ativas + pontos geográficos reais
 * + 5 fases de degradação (0=início → 4=colapso)
 */

export const CRISES = [
  {
    id: 1,
    titulo: "PICO DE NEBULIZAÇÕES NA ZONA CENTRO",
    banner: "SURTO RESPIRATÓRIO DETECTADO — ALTO NÍVEL DE PM₂.₅",
    descricao: "Internações por crises respiratórias sobem 340% no Hospital das Clínicas. A causa ainda é desconhecida.",
    pista: "Verifique o tráfego na Av. do Estado e o índice de qualidade do ar no Centro Expandido.",
    causa: "Tráfego completamente parado na Av. do Estado e Radial Leste durante 4h gera coluna de poluição. Sem vento, PM₂.₅ acumula sobre o Vale do Anhangabaú.",
    investigacao: "Por que o ar piora mais no inverno seco? Como o traçado viário do centro concentra poluentes?",
    camadasAtivas: ["ar", "trafego", "temp", "saude"],
    centro: [-46.636, -23.547],
    zoom: 12.5,
    pontos: [
      // TRÁFEGO — Av. do Estado
      { id:"t1", camada:"trafego", lat:-23.557, lng:-46.616, nome:"Av. do Estado — Congestionamento total", bairro:"Cambuci", dados:[
        { lbl:"Velocidade",vals:[22,14,7,3,1], unit:"km/h" },
        { lbl:"Fila",      vals:[1.2,3.5,6.8,9.2,12], unit:"km" }
      ], alerta:"Via paralisada — emissões 8× acima do normal" },
      { id:"t2", camada:"trafego", lat:-23.548, lng:-46.630, nome:"Radial Leste — Lentidão severa", bairro:"Brás", dados:[
        { lbl:"Velocidade",vals:[18,11,5,2,0], unit:"km/h" },
        { lbl:"Fila",      vals:[0.8,2.1,4.5,7,10], unit:"km" }
      ], alerta:"Lentidão km 0 ao km 8" },
      // AR — Estações
      { id:"a1", camada:"ar", lat:-23.547, lng:-46.636, nome:"Praça da Sé — Est. CETESB", bairro:"Sé", dados:[
        { lbl:"PM₂.₅", vals:[28,42,67,95,148], unit:"µg/m³" },
        { lbl:"NO₂",   vals:[45,68,102,145,198], unit:"µg/m³" }
      ], alerta:"PM₂.₅ 10× acima do limite OMS" },
      { id:"a2", camada:"ar", lat:-23.539, lng:-46.621, nome:"Luz — Monitoramento AR", bairro:"Santa Cecília", dados:[
        { lbl:"PM₂.₅", vals:[22,36,58,82,120], unit:"µg/m³" },
        { lbl:"IQA",   vals:[55,72,96,120,160], unit:"" }
      ], alerta:"Qualidade do ar: RUIM → PÉSSIMA" },
      // TEMP
      { id:"tp1", camada:"temp", lat:-23.548, lng:-46.641, nome:"Ilha de Calor — Centro", bairro:"República", dados:[
        { lbl:"Temperatura",vals:[28,30,33,36,39], unit:"°C" },
        { lbl:"Δ Periferia",vals:[+3,+4.5,+6,+7.5,+9], unit:"°C" }
      ], alerta:"Ilha de calor urbana: +9°C acima da periferia" },
      // SAÚDE
      { id:"s1", camada:"saude", lat:-23.550, lng:-46.671, nome:"HC FMUSP — Internações", bairro:"Pinheiros", dados:[
        { lbl:"Resp./dia",  vals:[42,89,156,220,310], unit:"casos" },
        { lbl:"Espera UPA", vals:[40,110,180,240,300], unit:"min" }
      ], alerta:"Capacidade esgotada — desvio para Hospital Central" },
    ],
    fases: ["Qualidade do ar deteriorando", "PM₂.₅ dobra nas últimas 2h", "Alerta máximo respiratório", "Hospitais em colapso", "EMERGÊNCIA DE SAÚDE PÚBLICA"],
  },

  {
    id: 2,
    titulo: "INUNDAÇÃO ALAGAMENTO GLICÉRIO",
    banner: "ALAGAMENTO CRÍTICO — GLICÉRIO, LIBERDADE E CAMBUCI",
    descricao: "Córregos transbordam após 80mm de chuva em 2h. Ruas sob 1.8m de água. 340 famílias desabrigadas.",
    pista: "Analise os pontos de descarte irregular no Glicério e a capacidade de drenagem do Rio Tamanduateí.",
    causa: "Pontos de descarte irregular obstruíram 73% das bocas-de-lobo no Glicério. Chuva intensa encontrou sistema de drenagem colapsado.",
    investigacao: "Como o descarte irregular conecta-se diretamente aos eventos de alagamento? Quais bairros são mais vulneráveis e por quê?",
    camadasAtivas: ["agua", "residuos", "saude"],
    centro: [-46.627, -23.558],
    zoom: 13,
    pontos: [
      { id:"ag1", camada:"agua", lat:-23.560, lng:-46.627, nome:"Córrego Saracura — transbordamento", bairro:"Glicério", dados:[
        { lbl:"Nível",      vals:[0.4,0.9,1.4,1.8,2.1], unit:"m" },
        { lbl:"Vazão",      vals:[12,28,55,82,110], unit:"m³/s" }
      ], alerta:"Nível crítico — evacuação em curso" },
      { id:"ag2", camada:"agua", lat:-23.570, lng:-46.612, nome:"Tamanduateí — medição Ipiranga", bairro:"Mooca", dados:[
        { lbl:"Nível",      vals:[1.2,2.0,3.1,4.2,5.0], unit:"m" },
        { lbl:"Turbidez",   vals:[85,180,350,580,820], unit:"NTU" }
      ], alerta:"Rio acima da cota de alerta" },
      { id:"r1", camada:"residuos", lat:-23.558, lng:-46.630, nome:"Desc. irregular Viaduto Glicério", bairro:"Glicério", dados:[
        { lbl:"Vol. lixo",  vals:[4.2,4.8,5.5,6.1,7.2], unit:"ton" },
        { lbl:"Bocas obs.", vals:[38,52,65,73,81], unit:"%" }
      ], alerta:"73% das bocas-de-lobo obstruídas" },
      { id:"r2", camada:"residuos", lat:-23.563, lng:-46.618, nome:"Descarte Av. Lins de Vasconcelos", bairro:"Cambuci", dados:[
        { lbl:"Pontos irreg.",vals:[12,18,24,31,38], unit:"pts" }
      ], alerta:"Acúmulo crescente pós-chuva" },
      { id:"s2", camada:"saude", lat:-23.555, lng:-46.624, nome:"UBS Glicério — Atendimento", bairro:"Glicério", dados:[
        { lbl:"Desabrigados",vals:[40,120,210,280,340], unit:"fam." },
        { lbl:"Leptospirose",vals:[0,2,5,9,14], unit:"suspeitos" }
      ], alerta:"Risco leptospirose e doenças hídricas" },
    ],
    fases: ["Chuva intensa — atenção", "Córregos em alerta", "Alagamento confirmado", "Evacuação em massa", "ZONA DE DESASTRE"],
  },

  {
    id: 3,
    titulo: "COLAPSO ENERGÉTICO ZONA SUL",
    banner: "BLACKOUT PROGRESSIVO — SUL DE SÃO PAULO SEM ENERGIA",
    descricao: "Falha em cascata nas subestações da Zona Sul. 1.2 milhão de residências sem luz. Semáforos apagados.",
    pista: "Observe a carga nas subestações de Campo Limpo e Jabaquara e o pico de demanda das 18h.",
    causa: "Onda de calor de 40°C criou pico histórico de demanda (ar-condicionado). Subestação Jabaquara entrou em sobrecarga e desligou por proteção, sobrecarregando as vizinhas.",
    investigacao: "Por que a Zona Sul é mais vulnerável a blackouts? Como a densidade habitacional afeta a demanda de energia?",
    camadasAtivas: ["energia", "temp", "trafego", "saude"],
    centro: [-46.680, -23.640],
    zoom: 12,
    pontos: [
      { id:"en1", camada:"energia", lat:-23.622, lng:-46.661, nome:"SE Jabaquara — Sobrecarga", bairro:"Jabaquara", dados:[
        { lbl:"Carga",       vals:[82,91,98,105,112], unit:"%" },
        { lbl:"Temperatura", vals:[68,74,82,91,102], unit:"°C equip." }
      ], alerta:"Sobrecarga — risco de dano permanente" },
      { id:"en2", camada:"energia", lat:-23.663, lng:-46.752, nome:"SE Campo Limpo — Sobrecarga", bairro:"Campo Limpo", dados:[
        { lbl:"Carga",       vals:[78,88,95,103,109], unit:"%" },
        { lbl:"Falhas/h",    vals:[0,2,5,9,14], unit:"eventos" }
      ], alerta:"Falhas em cascata detectadas" },
      { id:"en3", camada:"energia", lat:-23.701, lng:-46.680, nome:"SE Grajaú — Limite operação", bairro:"Grajaú", dados:[
        { lbl:"Carga",       vals:[71,80,88,95,99], unit:"%" }
      ], alerta:"Próxima da capacidade máxima" },
      { id:"tp2", camada:"temp", lat:-23.640, lng:-46.700, nome:"Ilha de calor — Zona Sul", bairro:"Santo Amaro", dados:[
        { lbl:"Temperatura", vals:[36,38,40,41,42], unit:"°C" },
        { lbl:"Índice calor",vals:[40,44,48,52,58], unit:"°C sens." }
      ], alerta:"Temperatura extrema — risco à saúde" },
      { id:"t3", camada:"trafego", lat:-23.651, lng:-46.693, nome:"Av. Cupecê — Semáforos apagados", bairro:"Campo Limpo", dados:[
        { lbl:"Acidentes/h", vals:[0,3,8,14,22], unit:"ocorr." }
      ], alerta:"Sem semáforos — acidentes crescentes" },
    ],
    fases: ["Pico de demanda", "Sobrecarga nas subestações", "Primeiro desligamento", "Cascata de blackouts", "COLAPSO TOTAL DA REDE"],
  },

  {
    id: 4,
    titulo: "CRISE HÍDRICA — GUARAPIRANGA SECA",
    banner: "NÍVEL CRÍTICO — REPRESA GUARAPIRANGA EM COLAPSO",
    descricao: "Represa Guarapiranga atinge 8.2% da capacidade. Racionamento de 40h semanais no abastecimento da Zona Sul.",
    pista: "Observe a curva de nível da represa e os pontos de captação ilegal ao longo do Rio Embu Mirim.",
    causa: "Combinação de seca histórica com captação ilegal em 38 pontos no manancial. Desmatamento na APA reduziu recarga em 45%.",
    investigacao: "Como o desmatamento no entorno afeta o volume do reservatório? Qual a relação entre urbanização irregular e seca?",
    camadasAtivas: ["agua", "solo", "residuos"],
    centro: [-46.720, -23.730],
    zoom: 11.5,
    pontos: [
      { id:"ag3", camada:"agua", lat:-23.730, lng:-46.720, nome:"Represa Guarapiranga — nível", bairro:"Parelheiros", dados:[
        { lbl:"Capacidade",  vals:[22,18,14,11,8.2], unit:"%" },
        { lbl:"Cota",        vals:[735.2,734.8,734.1,733.5,732.9], unit:"m" }
      ], alerta:"CRÍTICO: Mínimo operacional em 3 semanas" },
      { id:"ag4", camada:"agua", lat:-23.750, lng:-46.690, nome:"Rio Embu Mirim — captação ilegal", bairro:"M'Boi Mirim", dados:[
        { lbl:"Pontos ilegais",vals:[8,15,24,31,38], unit:"pts" },
        { lbl:"Vol. captado", vals:[180,340,520,680,850], unit:"m³/dia" }
      ], alerta:"38 pontos de captação clandestina" },
      { id:"sl1", camada:"solo", lat:-23.700, lng:-46.750, nome:"APA Capivari-Monos — desmatamento", bairro:"Parelheiros", dados:[
        { lbl:"Cobertura",   vals:[68,62,55,48,42], unit:"%" },
        { lbl:"Área perdida",vals:[0,240,480,720,980], unit:"ha" }
      ], alerta:"980ha de mata ciliar perdida este ano" },
      { id:"r3", camada:"residuos", lat:-23.720, lng:-46.700, nome:"Loteamento irregular — manancial", bairro:"Grajaú", dados:[
        { lbl:"Dom. irregulares",vals:[820,1100,1400,1680,1950], unit:"dom." }
      ], alerta:"1.950 domicílios sem saneamento no manancial" },
    ],
    fases: ["Atenção — nível baixo", "Alerta de escassez", "Racionamento decretado", "Abastecimento crítico", "COLAPSO DO ABASTECIMENTO"],
  },

  {
    id: 5,
    titulo: "DENGUE — EXPLOSÃO EM PARAISÓPOLIS",
    banner: "SURTO DE DENGUE — 1.200 CASOS/SEMANA EM PARAISÓPOLIS",
    descricao: "Favela de Paraisópolis registra 1.200 novos casos de dengue por semana. UBS lotadas. Focos d'água em 78% dos pontos vistoriados.",
    pista: "Cruze os dados de resíduos sólidos, qualidade da água estagnada e temperatura para encontrar os focos de reprodução.",
    causa: "Descarte irregular de pneus e embalagens cria 400+ pontos de água parada. Temperatura de 36°C acelera ciclo do Aedes. Acesso limitado de equipes de saúde.",
    investigacao: "Por que desigualdade social e infraestrutura deficiente amplificam surtos de dengue? Como priorizar ações de saúde pública?",
    camadasAtivas: ["saude", "residuos", "agua", "temp"],
    centro: [-46.720, -23.596],
    zoom: 14,
    pontos: [
      { id:"s3", camada:"saude", lat:-23.596, lng:-46.720, nome:"UBS Paraisópolis — Atendimento dengue", bairro:"Paraisópolis", dados:[
        { lbl:"Casos/semana", vals:[180,420,680,940,1200], unit:"casos" },
        { lbl:"Internações",  vals:[8,22,41,65,92], unit:"intern." }
      ], alerta:"UBS em colapso — desvio para Campo Limpo" },
      { id:"r4", camada:"residuos", lat:-23.594, lng:-46.718, nome:"Pontos de pneus descartados — Paraisópolis", bairro:"Paraisópolis", dados:[
        { lbl:"Focos Aedes",  vals:[42,120,210,310,420], unit:"focos" },
        { lbl:"Pontos irreg.",vals:[28,65,110,155,210], unit:"pontos" }
      ], alerta:"420 focos de reprodução do Aedes aegypti" },
      { id:"r5", camada:"residuos", lat:-23.598, lng:-46.722, nome:"Acúmulo lixo — Rua Joanopolis", bairro:"Paraisópolis", dados:[
        { lbl:"Vol. lixo",    vals:[2.1,4.8,8.2,12,16], unit:"ton" }
      ], alerta:"Coleta não chega — 16 toneladas acumuladas" },
      { id:"ag5", camada:"agua", lat:-23.597, lng:-46.715, nome:"Córrego Água Podre — Paraisópolis", bairro:"Paraisópolis", dados:[
        { lbl:"Turbidez",     vals:[120,280,480,680,920], unit:"NTU" },
        { lbl:"E.coli",       vals:[850,2400,5200,8800,14000], unit:"UFC/100ml" }
      ], alerta:"Água imprópria — E.coli 140× acima do limite" },
      { id:"tp3", camada:"temp", lat:-23.595, lng:-46.719, nome:"Temperatura Paraisópolis", bairro:"Paraisópolis", dados:[
        { lbl:"Temperatura",  vals:[33,35,36,37,38], unit:"°C" }
      ], alerta:"Calor acelera ciclo reprodutivo do Aedes" },
    ],
    fases: ["Casos elevados", "Surto confirmado", "Epidemia localizada", "Sistema de saúde sobrecarregado", "EMERGÊNCIA EPIDEMIOLÓGICA"],
  },

  {
    id: 6,
    titulo: "CAOS NO TRÂNSITO — PAULISTA BLOQUEADA",
    banner: "BLOQUEIO TOTAL — AV. PAULISTA E FARIA LIMA PARALISADAS",
    descricao: "Manifestação simultânea na Av. Paulista e obra emergencial na Faria Lima criam colapso total. 380km de congestionamento. Ambulâncias bloqueadas.",
    pista: "Rastreie como o bloqueio da Paulista propaga o congestionamento pelas marginais até bairros distantes.",
    causa: "Efeito dominó: Paulista bloqueada desvia tráfego para Rebouças → Rebouças para Marginal → Marginal para vias locais. 3 ambulâncias retidas por 40 minutos.",
    investigacao: "Como uma única via bloqueada pode paralisar toda uma metrópole? O que é 'resiliência viária'?",
    camadasAtivas: ["trafego", "temp", "ar", "saude"],
    centro: [-46.654, -23.562],
    zoom: 12.5,
    pontos: [
      { id:"t4", camada:"trafego", lat:-23.561, lng:-46.655, nome:"Av. Paulista — Bloqueio total", bairro:"Bela Vista", dados:[
        { lbl:"Velocidade", vals:[12,5,2,0,0], unit:"km/h" },
        { lbl:"Extensão",   vals:[0.8,2.1,3.5,4.2,4.2], unit:"km bloq." }
      ], alerta:"Via bloqueada — desvio impossível" },
      { id:"t5", camada:"trafego", lat:-23.569, lng:-46.697, nome:"Av. Faria Lima — Obra emergencial", bairro:"Itaim Bibi", dados:[
        { lbl:"Velocidade", vals:[15,8,3,1,0], unit:"km/h" },
        { lbl:"Fila",       vals:[2,5,9,14,18], unit:"km" }
      ], alerta:"Obra fecha 2 faixas em horário de pico" },
      { id:"t6", camada:"trafego", lat:-23.565, lng:-46.720, nome:"Marginal Pinheiros — Saturação", bairro:"Vila Leopoldina", dados:[
        { lbl:"Velocidade", vals:[25,15,8,4,2], unit:"km/h" },
        { lbl:"Fila",       vals:[4,11,19,28,38], unit:"km" }
      ], alerta:"Marginal absorvendo desvios: saturação total" },
      { id:"t7", camada:"trafego", lat:-23.509, lng:-46.680, nome:"Marginal Tietê — Travada", bairro:"Santana", dados:[
        { lbl:"Velocidade", vals:[20,12,6,2,1], unit:"km/h" }
      ], alerta:"Congestionamento propagado" },
      { id:"a3", camada:"ar", lat:-23.558, lng:-46.660, nome:"PM₂.₅ — Centro Expandido", bairro:"Consolação", dados:[
        { lbl:"PM₂.₅", vals:[25,42,68,95,130], unit:"µg/m³" }
      ], alerta:"Veículos parados: emissões 6× mais altas" },
      { id:"s4", camada:"saude", lat:-23.555, lng:-46.670, nome:"Ambulâncias retidas", bairro:"Jardins", dados:[
        { lbl:"Retidas",    vals:[0,1,2,3,3], unit:"viaturas" },
        { lbl:"Tempo extra",vals:[0,12,25,40,40], unit:"min" }
      ], alerta:"3 ambulâncias retidas — vidas em risco" },
    ],
    fases: ["Bloqueio inicial", "Desvios sobrecarregados", "Colapso da rede viária", "Serviços de emergência bloqueados", "PARALISIA TOTAL DA CIDADE"],
  },

  {
    id: 7,
    titulo: "INCÊNDIO EM VEGETAÇÃO — PARQUE ANHANGUERA",
    banner: "INCÊNDIO ATIVO — PARQUE ESTADUAL DO ANHANGUERA",
    descricao: "Incêndio avança 120ha no Parque Anhanguera. Fumaça atinge Pirituba e Perus. 3 casas em área limítrofe evacuadas.",
    pista: "Correlacione a seca do solo, a velocidade do vento (NE 40km/h) e os focos de calor para prever a direção do incêndio.",
    causa: "80 dias sem chuva secaram a vegetação. Foco iniciado próximo à ferrovia por faísca elétrica. Vento NE empurra o fogo em direção à zona habitada.",
    investigacao: "Como o desmatamento ao redor de parques urbanos cria 'ilhas de incêndio'? Qual o papel do corredor verde na contenção?",
    camadasAtivas: ["solo", "temp", "ar", "saude"],
    centro: [-46.770, -23.445],
    zoom: 12.5,
    pontos: [
      { id:"sl2", camada:"solo", lat:-23.445, lng:-46.770, nome:"Parque Anhanguera — Foco principal", bairro:"Perus", dados:[
        { lbl:"Área queimada",vals:[0,28,58,88,120], unit:"ha" },
        { lbl:"Umid. solo",   vals:[18,12,8,5,3], unit:"%" }
      ], alerta:"120ha destruídos — avanço em direção ao bairro" },
      { id:"sl3", camada:"solo", lat:-23.440, lng:-46.752, nome:"Limite Parque — Zona habitada", bairro:"Pirituba", dados:[
        { lbl:"Distância fogo",vals:[2800,1900,1100,500,180], unit:"m" }
      ], alerta:"Fogo a 180m das primeiras casas" },
      { id:"tp4", camada:"temp", lat:-23.448, lng:-46.765, nome:"Temperatura do foco — Anhanguera", bairro:"Perus", dados:[
        { lbl:"Temperatura",  vals:[38,52,68,85,95], unit:"°C local" },
        { lbl:"Focos calor",  vals:[1,4,9,15,23], unit:"focos" }
      ], alerta:"23 focos de calor identificados por satélite" },
      { id:"a4", camada:"ar", lat:-23.460, lng:-46.755, nome:"PM₂.₅ Fumaça — Pirituba/Perus", bairro:"Pirituba", dados:[
        { lbl:"PM₂.₅", vals:[45,95,160,230,310], unit:"µg/m³" },
        { lbl:"CO",    vals:[4,12,24,38,55], unit:"ppm" }
      ], alerta:"Fumaça tóxica — fechar janelas e evitar área" },
      { id:"s5", camada:"saude", lat:-23.463, lng:-46.740, nome:"UPA Pirituba — Atendimentos", bairro:"Pirituba", dados:[
        { lbl:"Resp./turno", vals:[12,34,68,102,145], unit:"casos" }
      ], alerta:"Atendimentos respiratórios +1.200%" },
    ],
    fases: ["Foco detectado", "Incêndio se expande", "Fumaça atinge bairros", "Evacuação preventiva", "EMERGÊNCIA — RISCO RESIDENCIAL"],
  },

  {
    id: 8,
    titulo: "CONTAMINAÇÃO INDUSTRIAL — RIO TAMANDUATEÍ",
    banner: "VAZAMENTO QUÍMICO — RIO TAMANDUATEÍ CONTAMINADO",
    descricao: "Empresa de galvanização despeja cromo hexavalente no Tamanduateí. Peixe morto ao longo de 8km. Captação de água suspensa.",
    pista: "Rastreie a pluma de contaminação do ponto de descarte em Santo André até a confluência com o Tietê.",
    causa: "Rompimento de tubulação de efluentes industriais em Santo André. Cromo hexavalente (cancerígeno) detectado em concentração 800× acima do limite.",
    investigacao: "Por que rios urbanos são especialmente vulneráveis à contaminação industrial? Quem fiscaliza e como?",
    camadasAtivas: ["agua", "saude", "residuos"],
    centro: [-46.536, -23.650],
    zoom: 12,
    pontos: [
      { id:"ag6", camada:"agua", lat:-23.661, lng:-46.534, nome:"Origem — Galvanização ABC", bairro:"Santo André", dados:[
        { lbl:"Cromo VI",    vals:[0,240,560,720,800], unit:"× limite" },
        { lbl:"pH",          vals:[7.2,5.8,4.9,4.1,3.5], unit:"" }
      ], alerta:"800× acima do limite — contaminação extrema" },
      { id:"ag7", camada:"agua", lat:-23.640, lng:-46.548, nome:"Tamanduateí — Km 4", bairro:"Diadema", dados:[
        { lbl:"Cromo VI",    vals:[0,80,180,290,410], unit:"µg/L" },
        { lbl:"Peixe morto", vals:[0,120,580,1200,2100], unit:"kg" }
      ], alerta:"Pluma avançando — biota em colapso" },
      { id:"ag8", camada:"agua", lat:-23.600, lng:-46.565, nome:"Tamanduateí — Confluência Mooca", bairro:"Mooca", dados:[
        { lbl:"Cromo VI",    vals:[0,20,55,110,185], unit:"µg/L" }
      ], alerta:"Contaminação chegando ao Tietê" },
      { id:"s6", camada:"saude", lat:-23.650, lng:-46.530, nome:"Hospital Estadual Mario Covas", bairro:"Santo André", dados:[
        { lbl:"Intoxicados",  vals:[0,8,22,41,68], unit:"pacientes" }
      ], alerta:"68 casos de intoxicação confirmados" },
      { id:"r6", camada:"residuos", lat:-23.658, lng:-46.540, nome:"Descarte ilegal — Industrial ABC", bairro:"Santo André", dados:[
        { lbl:"Empresas",     vals:[1,3,5,7,9], unit:"autuadas" }
      ], alerta:"9 empresas com descarte irregular identificadas" },
    ],
    fases: ["Vazamento detectado", "Pluma se expande", "Captação suspensa", "Biota em colapso", "DESASTRE AMBIENTAL DECLARADO"],
  },

  {
    id: 9,
    titulo: "ONDA DE CALOR — MORTES EM HELIÓPOLIS",
    banner: "ONDA DE CALOR EXTREMA — 42°C — IDOSOS EM RISCO",
    descricao: "Onda de calor de 42°C castiga Heliópolis e Ipiranga. 8 mortes de idosos confirmadas. UBSs sem insumos para hidratação.",
    pista: "Compare a temperatura entre Heliópolis (asfalto, sem árvores) e o Parque Estadual (15°C mais fresco). Qual é o papel da vegetação?",
    causa: "Heliópolis tem 94% de impermeabilização do solo e 0.3 árvores por habitante. Isso cria ilha de calor extrema: 42°C versus 27°C no Parque do Estado.",
    investigacao: "O que é impermeabilização do solo e como ela amplifica ondas de calor? Por que afeta mais a população de baixa renda?",
    camadasAtivas: ["temp", "saude", "solo", "agua"],
    centro: [-46.595, -23.618],
    zoom: 13,
    pontos: [
      { id:"tp5", camada:"temp", lat:-23.618, lng:-46.595, nome:"Ilha de calor — Heliópolis", bairro:"Heliópolis", dados:[
        { lbl:"Temperatura",  vals:[36,38,40,41,42], unit:"°C" },
        { lbl:"Sensação",     vals:[40,44,48,52,58], unit:"°C" }
      ], alerta:"42°C — 15°C acima de áreas arborizadas" },
      { id:"tp6", camada:"temp", lat:-23.630, lng:-46.615, nome:"Parque Estadual SP — contraste", bairro:"Água Funda", dados:[
        { lbl:"Temperatura",  vals:[27,27,27,27,27], unit:"°C" },
        { lbl:"Δ Heliópolis", vals:[9,11,13,14,15], unit:"°C diff" }
      ], alerta:"Apenas 2km de distância — diferença de 15°C" },
      { id:"s7", camada:"saude", lat:-23.612, lng:-46.590, nome:"UBS Heliópolis — Emergências calor", bairro:"Heliópolis", dados:[
        { lbl:"Insolação/dia",vals:[4,12,22,34,48], unit:"casos" },
        { lbl:"Óbitos",       vals:[0,2,4,6,8], unit:"confirmados" }
      ], alerta:"8 mortes confirmadas — maioria idosos" },
      { id:"sl4", camada:"solo", lat:-23.615, lng:-46.598, nome:"Impermeabilização — Heliópolis", bairro:"Heliópolis", dados:[
        { lbl:"Impermeável",  vals:[94,94,94,94,94], unit:"%" },
        { lbl:"Árvores/hab.", vals:[0.3,0.3,0.3,0.3,0.3], unit:"árv." }
      ], alerta:"94% impermeável — ausência de sombra e resfriamento" },
      { id:"ag9", camada:"agua", lat:-23.620, lng:-46.600, nome:"Falta d'água — Heliópolis", bairro:"Heliópolis", dados:[
        { lbl:"Horas sem água",vals:[4,8,14,18,24], unit:"h/dia" }
      ], alerta:"24h sem água — impossível se hidratar" },
    ],
    fases: ["Calor elevado", "Temperatura extrema", "Primeiros óbitos", "Sistema de saúde colapsado", "EMERGÊNCIA DE SAÚDE PÚBLICA"],
  },

  {
    id: 10,
    titulo: "COLAPSO SISTÊMICO — SP EM CRISE TOTAL",
    banner: "⚠ ALERTA MÁXIMO — MÚLTIPLAS CRISES SIMULTÂNEAS EM SP",
    descricao: "Tempestade perfeita: enchentes, blackout, colapso viário e surto respiratório simultaneamente. Sistema urbano no limite.",
    pista: "Identifique quais crises se retroalimentam. Por que o colapso de uma área agrava as outras?",
    causa: "Décadas de subinvestimento em infraestrutura urbana: drenagem inadequada + rede elétrica obsoleta + planejamento viário fragmentado = colapso em sinergia.",
    investigacao: "Cidades resilientes investem em quais pilares? Como transformar São Paulo em uma cidade mais preparada para crises?",
    camadasAtivas: ["agua", "energia", "trafego", "ar", "saude", "temp", "residuos"],
    centro: [-46.640, -23.560],
    zoom: 11,
    pontos: [
      { id:"t8", camada:"trafego", lat:-23.509, lng:-46.635, nome:"Marginal Tietê — Alagada", bairro:"Lapa", dados:[
        { lbl:"Velocidade",  vals:[20,8,2,0,0], unit:"km/h" }
      ], alerta:"Marginal submersa — fechamento total" },
      { id:"ag10", camada:"agua", lat:-23.530, lng:-46.615, nome:"Rio Tietê — Transbordamento", bairro:"Penha", dados:[
        { lbl:"Nível",       vals:[2.1,3.5,5.2,7.0,8.8], unit:"m" }
      ], alerta:"Tietê transbordando em 12 pontos" },
      { id:"en4", camada:"energia", lat:-23.560, lng:-46.665, nome:"Rede Elétrica — Falhas múltiplas", bairro:"Pinheiros", dados:[
        { lbl:"Sem energia",  vals:[80,320,680,1050,1400], unit:"mil dom." }
      ], alerta:"1.4 milhão de domicílios sem luz" },
      { id:"a5", camada:"ar", lat:-23.548, lng:-46.640, nome:"IQA Centro — Colapso geral", bairro:"Sé", dados:[
        { lbl:"IQA",          vals:[75,110,145,185,220], unit:"" }
      ], alerta:"Qualidade do ar PÉSSIMA em todo o centro" },
      { id:"s8", camada:"saude", lat:-23.553, lng:-46.658, nome:"Hospital Central — Lotado", bairro:"Santa Cecília", dados:[
        { lbl:"Lotação",      vals:[90,105,120,135,150], unit:"%" }
      ], alerta:"150% da capacidade — triagem de guerra" },
      { id:"tp7", camada:"temp", lat:-23.555, lng:-46.645, nome:"Temperatura global SP", bairro:"Centro", dados:[
        { lbl:"Temperatura",  vals:[32,35,37,39,41], unit:"°C" }
      ], alerta:"Ilha de calor amplifica todas as crises" },
      { id:"r7", camada:"residuos", lat:-23.570, lng:-46.625, nome:"Lixo disperso pós-chuva", bairro:"Ipiranga", dados:[
        { lbl:"Volume",       vals:[450,820,1200,1650,2100], unit:"ton" }
      ], alerta:"2.100 toneladas de lixo nas ruas" },
    ],
    fases: ["Múltiplas ocorrências", "Sistemas interconectados falhando", "Colapso em cascata", "Serviços essenciais inoperantes", "⚠ COLAPSO SISTÊMICO TOTAL"],
  },
];

export const CAMADAS_CONFIG = {
  ar:       { nome:"Qualidade do Ar",    cor:"#4a5568", geo:"circ",  unidade:"IQA"  },
  agua:     { nome:"Hidrosfera",         cor:"#1a44cc", geo:"tri",   unidade:"NTU"  },
  temp:     { nome:"Temperatura",        cor:"#e07b00", geo:"hex",   unidade:"°C"   },
  trafego:  { nome:"Tráfego",            cor:"#cc2200", geo:"sq",    unidade:"km/h" },
  residuos: { nome:"Resíduos Sólidos",   cor:"#7a4520", geo:"circ",  unidade:"ton"  },
  energia:  { nome:"Matriz Elétrica",    cor:"#c8960a", geo:"bolt",  unidade:"%"    },
  solo:     { nome:"Solo / Vegetação",   cor:"#1a7a3a", geo:"diam",  unidade:"%"    },
  saude:    { nome:"Saúde Pública",      cor:"#b01060", geo:"plus",  unidade:"casos"},
};

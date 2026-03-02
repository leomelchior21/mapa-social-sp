/**
 * claude.js — Integração com a API Claude (Anthropic)
 *
 * Responsabilidade ÚNICA:
 *   Enviar um payload JSON estruturado → receber texto interpretativo.
 *
 * Claude NÃO faz:
 *   - Cálculos geográficos
 *   - Consultas de banco de dados
 *   - Acesso a dados em tempo real
 *
 * Claude FAZ:
 *   - Interpretar dados fornecidos
 *   - Gerar análise educacional
 *   - Sugerir reflexões para estudantes
 *
 * Configuração da chave API:
 *   Adicione sua chave em localStorage['CLAUDE_API_KEY']
 *   ou defina window.CLAUDE_API_KEY antes de iniciar.
 *
 *   IMPORTANTE: Em produção nunca exponha chaves de API no frontend!
 *   Use um proxy serverless (ex: Vercel Edge Function gratuita) para
 *   proteger sua chave. Ver README.md para instruções.
 */

const CLAUDE_API_URL  = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL    = 'claude-opus-4-5';
const MAX_TOKENS      = 400;

/**
 * Obtém a chave API da forma mais segura possível no frontend.
 * Ordem de prioridade:
 *  1. window.CLAUDE_API_KEY (injetada pelo proxy)
 *  2. localStorage (configurada pelo usuário)
 *
 * @returns {string|null}
 */
function getApiKey() {
  return window.CLAUDE_API_KEY || localStorage.getItem('CLAUDE_API_KEY') || null;
}

/**
 * Envia um payload de impacto ao Claude e retorna a análise.
 *
 * @param {Object} payload - JSON estruturado do Rastro do Impacto
 * @returns {Promise<string>} - Texto interpretativo gerado
 */
export async function askClaude(payload) {
  const apiKey = getApiKey();

  // Se não há chave, gera análise educacional local (fallback)
  if (!apiKey) {
    console.warn('[CLAUDE] Chave API não encontrada — usando análise local');
    return generateLocalAnalysis(payload);
  }

  const systemPrompt = `Você é um assistente educacional especializado em saúde ambiental urbana.
Analisa dados socioambientais de São Paulo e explica impactos para estudantes do ensino médio.
Seja direto, use linguagem acessível, e sempre termine com uma pergunta reflexiva.
Limite a resposta a 3 parágrafos curtos.`;

  const userMessage = `Analise estes dados socioambientais e interprete o impacto:

${JSON.stringify(payload, null, 2)}

Forneça uma análise educacional clara sobre a relação entre o ponto de referência e o emissor mais próximo.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01',
        // Necessário para chamadas browser-side (CORS)
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system:     systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extrai texto da resposta
    const text = data.content
      ?.filter(block => block.type === 'text')
      ?.map(block => block.text)
      ?.join('\n') || '';

    if (!text) throw new Error('Resposta vazia da API');

    return text;

  } catch (err) {
    console.error('[CLAUDE] Erro na API:', err);

    // Fallback com análise local se a API falhar
    return `[API indisponível] ${generateLocalAnalysis(payload)}\n\n[Erro: ${err.message}]`;
  }
}

/**
 * Análise educacional local — usada quando não há chave API.
 * Gera texto baseado nos dados do payload sem chamar a API.
 *
 * @param {Object} payload
 * @returns {string}
 */
function generateLocalAnalysis(payload) {
  const { ponto_de_referencia, emissor_proximo, contexto } = payload;

  const intensidadeNum = parseInt(emissor_proximo.intensidade);
  const distancia      = parseFloat(emissor_proximo.distancia_km);

  let nivelRisco = 'moderado';
  if (intensidadeNum > 70) nivelRisco = 'elevado';
  if (intensidadeNum < 30) nivelRisco = 'baixo';

  let impactoSaude = '';
  if (emissor_proximo.tipo.toLowerCase().includes('ar') ||
      emissor_proximo.tipo.toLowerCase().includes('cetesb')) {
    impactoSaude = 'A qualidade do ar na região pode afetar diretamente pacientes com doenças respiratórias, como asma e bronquite. Estudos do CETESB mostram correlação entre poluição do ar e internações hospitalares em São Paulo.';
  } else if (emissor_proximo.tipo.toLowerCase().includes('calor') ||
             emissor_proximo.tipo.toLowerCase().includes('foco')) {
    impactoSaude = 'Focos de calor urbano elevam a temperatura local, criando ilhas de calor que aumentam o estresse térmico da população. Isso é especialmente crítico para idosos e crianças.';
  } else {
    impactoSaude = 'A proximidade de fontes de emissão com equipamentos de saúde exige atenção especial ao planejamento urbano e às políticas de saúde pública.';
  }

  return `▶ ANÁLISE SOCIOAMBIENTAL GERADA LOCALMENTE

O emissor "${emissor_proximo.nome}" está a ${distancia} km do ponto "${ponto_de_referencia.nome}", com intensidade ${emissor_proximo.intensidade}. Nível de risco estimado: ${nivelRisco.toUpperCase()}.

${impactoSaude}

Há ${contexto.total_emissores_encontrados} fontes emissoras no raio de ${contexto.raio_analisado_km}km. Quanto maior a concentração de emissores próximos a equipamentos de saúde, maior o desafio para os profissionais e usuários desses serviços.

◉ PERGUNTA REFLEXIVA: Se você morasse a ${distancia} km de uma fonte com intensidade ${emissor_proximo.intensidade}, quais medidas de proteção tomaria no dia a dia?

[Configure sua chave Claude API para análises mais aprofundadas]`;
}

/**
 * Abre o diálogo de configuração da chave API.
 * Chamado pelo botão "⚙ API Key" (se implementado na UI).
 */
export function promptApiKey() {
  const key = prompt(
    'Cole sua chave da API Claude (sk-ant-...):\n\n' +
    'Nota: Armazenada apenas no seu navegador (localStorage).\n' +
    'Para produção, use um proxy serverless (ver README).'
  );
  if (key && key.startsWith('sk-ant-')) {
    localStorage.setItem('CLAUDE_API_KEY', key);
    return true;
  }
  return false;
}

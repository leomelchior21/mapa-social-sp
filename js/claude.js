/**
 * claude.js — Integração Claude API
 * Claude recebe dados já processados e gera interpretação educacional.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-opus-4-5';

function getKey() {
  return window.CLAUDE_API_KEY || localStorage.getItem('CLAUDE_API_KEY') || null;
}

export async function askClaude(payload) {
  const key = getKey();
  if (!key) throw new Error('Chave API não configurada');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: 'Você é um educador ambiental. Analisa dados socioambientais urbanos para estudantes do ensino médio. Seja direto, use os dados fornecidos, linguagem acessível e termine com uma pergunta de investigação.',
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    }),
  });

  if (!resp.ok) throw new Error(`API ${resp.status}`);
  const data = await resp.json();
  return data.content?.map(b => b.text).join('') || '';
}

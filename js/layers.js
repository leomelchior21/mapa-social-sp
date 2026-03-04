/**
 * layers.js — Definição das camadas de dados
 * 
 * Cada camada define:
 *   id, nome, icon (emoji), color (hex HUD), glowColor
 *   statSummary(state) → string para o painel lateral
 *   active: boolean (estado inicial)
 * 
 * Para adicionar nova camada: insira objeto em LAYERS + âncoras em anchors.js.
 */

export const LAYERS = [
  {
    id: 'ar',
    nome: 'QUALIDADE DO AR',
    icon: '💨',
    color: '#f97316',
    glowColor: 'rgba(249,115,22,',
    statSummary: s => `PM₂.₅ ${s.ar.pm25} µg/m³  ·  IQA ${s.ar.iqa}`,
    active: true,
  },
  {
    id: 'agua',
    nome: 'RECURSOS HÍDRICOS',
    icon: '💧',
    color: '#38bdf8',
    glowColor: 'rgba(56,189,248,',
    statSummary: s => `Turbidez ${s.agua.turbidez} NTU  ·  ${s.agua.balneab}`,
    active: true,
  },
  {
    id: 'trafego',
    nome: 'TRÁFEGO URBANO',
    icon: '🚦',
    color: '#f43f5e',
    glowColor: 'rgba(244,63,94,',
    statSummary: s => `Congest. ${s.trafego.congestionamento}%  ·  ${s.trafego.ruido} dB`,
    active: true,
  },
  {
    id: 'energia',
    nome: 'ENERGIA ELÉTRICA',
    icon: '⚡',
    color: '#facc15',
    glowColor: 'rgba(250,204,21,',
    statSummary: s => `Bandeira ${s.energia.banda}  ·  Térmica ${s.energia.termica}%`,
    active: true,
  },
  {
    id: 'residuos',
    nome: 'RESÍDUOS SÓLIDOS',
    icon: '🗑️',
    color: '#a78bfa',
    glowColor: 'rgba(167,139,250,',
    statSummary: s => `${s.residuos.pts_irreg} pts irreg.  ·  Aterro ${s.residuos.cap_aterro}%`,
    active: true,
  },
  {
    id: 'solo',
    nome: 'SOLO & VEGETAÇÃO',
    icon: '🌱',
    color: '#4ade80',
    glowColor: 'rgba(74,222,128,',
    statSummary: s => `Desmat. ${s.solo.desmat} ha/mês  ·  Agrotóx. ${s.solo.agrotox} kg/ha`,
    active: true,
  },
  {
    id: 'saude',
    nome: 'SAÚDE PÚBLICA',
    icon: '🏥',
    color: '#f472b6',
    glowColor: 'rgba(244,114,182,',
    statSummary: s => `Respiratórias ${s.saude.respirat}/100k  ·  Hídricas ${s.saude.hidricas}/100k`,
    active: true,
  },
];

export const LAYER_MAP = Object.fromEntries(LAYERS.map(l => [l.id, l]));

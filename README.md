# 🗺️ MAPA SOCIAL — SÃO PAULO
### Plataforma Educacional de Monitoramento Socioambiental Urbano

```
╔══════════════════════════════════════════════════════╗
║  SISTEMA VIVO v1.0 // OPEN SOURCE // EDUCACIONAL    ║
║  Dados: CETESB · INPE · SMS-SP                      ║
║  Stack: MapLibre GL · DuckDB-WASM · ES6 Modular     ║
╚══════════════════════════════════════════════════════╝
```

---

## 🎯 O que é este projeto

O **Mapa Social SP** é uma Single Page Application educacional que visualiza dados socioambientais reais de São Paulo em tempo quase-real. Projetada para uso em sala de aula, demonstra como dados públicos abertos podem ser combinados para revelar padrões de impacto urbano.

**Para professores:** O código é altamente comentado e a arquitetura modular serve como exemplo prático de desenvolvimento web com dados abertos.

---

## 🏗️ Arquitetura

```
mapa-social-sp/
├── index.html              # SPA — estrutura HTML do HUD
├── style.css               # Estética CRT (variáveis CSS, animações)
├── js/
│   ├── app.js              # Ponto de entrada — orquestra módulos
│   ├── map.js              # MapLibre GL JS — mapa 3D de SP
│   ├── layers.js           # Camadas socioambientais (add/remove/flash)
│   ├── data.js             # DuckDB-WASM — carregamento de Parquets
│   ├── impact.js           # Rastro do Impacto — análise geográfica
│   ├── hud.js              # Interface HUD — relógio, sync, toast
│   ├── effects.js          # Efeitos CRT via Canvas 2D
│   └── claude.js           # Integração Claude API — análise interpretativa
├── data/
│   ├── ar_sp.parquet       # Qualidade do ar (CETESB/OpenAQ)
│   ├── focos_sp.parquet    # Focos de calor (INPE)
│   └── saude_sp.parquet    # Equipamentos de saúde (SMS-SP)
├── scripts/
│   ├── fetch_ar.py         # Coleta CETESB → Parquet
│   ├── fetch_focos.py      # Coleta INPE → Parquet
│   └── fetch_saude.py      # Coleta SMS-SP → Parquet
└── .github/
    └── workflows/
        └── update-data.yml # GitHub Actions — atualização diária
```

### Separação de Responsabilidades

| Módulo | Responsabilidade | Padrão |
|--------|-----------------|--------|
| `map.js` | Renderização 3D, câmera, névoa | Módulo isolado |
| `layers.js` | GeoJSON, estilos, popups | Factory functions |
| `data.js` | DuckDB-WASM, Parquet, fallback sintético | Singleton DB |
| `impact.js` | Rastro de impacto, linha no mapa | Event-driven |
| `hud.js` | UI: relógio, sync, toast, stats | DOM puro |
| `effects.js` | Canvas CRT: scanlines, vignette, grain | requestAnimationFrame |
| `claude.js` | API call + fallback local | Async/await |

---

## 🚀 Deploy (Gratuito)

### Opção 1: GitHub Pages
```bash
# No repositório → Settings → Pages → Branch: main / root
# Acesso em: https://SEU_USUARIO.github.io/mapa-social-sp
```

### Opção 2: Vercel
```bash
npm install -g vercel
vercel --prod
# Acesso em: https://mapa-social-sp.vercel.app
```

Nenhuma configuração de servidor necessária — é HTML estático puro.

---

## 🔄 Atualização Automática de Dados

O **GitHub Actions** executa diariamente às 05:00 UTC (02:00 Brasília):

```yaml
# .github/workflows/update-data.yml
on:
  schedule:
    - cron: '0 5 * * *'
```

**Fontes reais utilizadas:**
- `fetch_ar.py` → OpenAQ API (gratuita, sem chave) → CETESB
- `fetch_focos.py` → INPE BDQueimadas API (pública)
- `fetch_saude.py` → GeoSampa WFS (Prefeitura SP, pública)

**Fallback automático:** Se a API real estiver indisponível, os scripts geram dados sintéticos representativos para garantir que a plataforma funcione em sala de aula.

---

## 🔬 Rastro do Impacto — Como Funciona

```
Clique em ponto → DuckDB filtra raio 5km → emissor de maior intensidade
     ↓
Monta JSON estruturado:
  { ponto_de_referência, emissor_próximo, distância, intensidade }
     ↓
Envia para Claude API → análise educacional
     ↓
Exibe no HUD com efeito de "digitação"
```

**Divisão de responsabilidades:**
- **JavaScript/DuckDB:** Faz todo o cálculo geográfico (Haversine, filtros)
- **Claude:** Recebe apenas dados prontos e interpreta em linguagem educacional

---

## 🤖 Configuração da Claude API

### Desenvolvimento (sem backend)
```javascript
// No console do navegador:
localStorage.setItem('CLAUDE_API_KEY', 'sk-ant-SUA-CHAVE-AQUI');
```

⚠️ **Atenção:** Expor chaves no frontend é inseguro para produção.

### Produção (recomendado) — Vercel Edge Function
```javascript
// api/claude.js (Vercel serverless function)
export default async function handler(req, res) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,  // variável de ambiente segura
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: req.body,
  });
  res.json(await response.json());
}
```

```bash
# Configure no Vercel Dashboard → Settings → Environment Variables
CLAUDE_API_KEY=sk-ant-SUA-CHAVE-AQUI
```

Então em `claude.js`, altere `CLAUDE_API_URL` para `/api/claude`.

---

## 📊 Formato dos Parquets

Estrutura mínima obrigatória (colunas requeridas pelo frontend):

```
latitude    DOUBLE    # -24.0 a -23.4 (SP)
longitude   DOUBLE    # -47.0 a -46.3 (SP)
tipo        VARCHAR   # Tipo do equipamento/ocorrência
intensidade DOUBLE    # 0.0 a 1.0 (normalizado)
data        VARCHAR   # ISO 8601: YYYY-MM-DD
fonte       VARCHAR   # Órgão de origem dos dados
nome        VARCHAR   # Nome descritivo (opcional)
```

### Gerar Parquets manualmente
```bash
pip install pandas pyarrow requests
python scripts/fetch_ar.py
python scripts/fetch_focos.py
python scripts/fetch_saude.py
```

---

## 🎨 Customização da Estética

Todas as variáveis visuais estão em `:root` no `style.css`:

```css
:root {
  --amber:        #ffb300;  /* cor primária */
  --purple:       #9b59b6;  /* destaque de impacto */
  --scanlines:    0.60;     /* intensidade padrão */
  --distortion:   0.30;     /* distorção barrel */
}
```

Os sliders no painel esquerdo controlam os efeitos CRT em tempo real.

---

## 📚 Uso Educacional

### Atividades sugeridas

1. **Análise de proximidade:** "Qual hospital de SP tem mais focos de calor a menos de 5km?"
2. **Evolução temporal:** Compare dados de diferentes dias (botão Sync Now)
3. **Camadas sobrepostas:** Ative ar + saúde e observe correlações espaciais
4. **Código aberto:** Alunos podem inspecionar o código no DevTools e propor melhorias

### Competências BNCC abordadas
- EM13CHS207: Análise de impactos ambientais e saúde pública
- EM13MAT407: Leitura e interpretação de dados estatísticos
- EM13CNT301: Fenômenos físicos e químicos no ambiente urbano

---

## 🛠️ Desenvolvido com

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| MapLibre GL JS | 4.1.0 | Mapa 3D vetorial |
| DuckDB-WASM | 1.28.1 | SQL no navegador |
| OpenFreeMaps | — | Tiles dark gratuitos |
| GitHub Actions | — | CI/CD de dados |
| Vercel/GH Pages | — | Hosting gratuito |
| Claude API | claude-opus-4-5 | Análise educacional |

Nenhum framework frontend. Nenhum backend pago. Zero custo de operação.

---

## 📄 Licença

MIT — Use, modifique e distribua livremente, inclusive em contexto comercial e educacional.

---

*Construído para demonstrar que dados públicos abertos + tecnologia gratuita = ferramenta educacional poderosa.*
# mapa-social-sp

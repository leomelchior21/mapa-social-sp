/**
 * effects.js — Efeitos visuais CRT via Canvas 2D + WebGL simulado
 *
 * Implementa:
 *  - Scanlines reais (linhas horizontais semitransparentes)
 *  - Distorção barrel/vignette
 *  - Flicker sutil
 *  - Ruído de grão (CRT grain)
 *
 * Usa Canvas 2D para máxima compatibilidade.
 * Para efeito WebGL puro: ver comentários inline.
 */

let _canvas, _ctx;
let _distortion = 0.30;  // 0..1
let _scanlines  = 0.60;  // 0..1
let _animId     = null;

/**
 * Inicializa o canvas CRT e inicia o loop de renderização.
 */
export function initCRT() {
  _canvas = document.getElementById('crt-overlay');
  if (!_canvas) return;

  _ctx = _canvas.getContext('2d');

  // Ajusta canvas ao viewport
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Inicia loop de animação
  _animId = requestAnimationFrame(renderCRT);

  console.log('[CRT] Overlay inicializado');
}

/**
 * Define intensidade da distorção (0..1).
 * @param {number} val
 */
export function setCRTDistortion(val) {
  _distortion = Math.max(0, Math.min(1, val));
}

/**
 * Define intensidade das scanlines (0..1).
 * @param {number} val
 */
export function setCRTScanlines(val) {
  _scanlines = Math.max(0, Math.min(1, val));
}

/**
 * Ajusta canvas ao tamanho da janela.
 */
function resizeCanvas() {
  _canvas.width  = window.innerWidth;
  _canvas.height = window.innerHeight;
}

/**
 * Loop de renderização CRT principal.
 * Chamado a cada frame via requestAnimationFrame.
 *
 * @param {number} timestamp - ms desde início da animação
 */
function renderCRT(timestamp) {
  _animId = requestAnimationFrame(renderCRT);

  const w = _canvas.width;
  const h = _canvas.height;

  // Limpa
  _ctx.clearRect(0, 0, w, h);

  // 1. Scanlines — linhas horizontais com espaçamento variável
  drawScanlines(w, h, timestamp);

  // 2. Vignette — escurecimento nas bordas
  drawVignette(w, h);

  // 3. Grain — ruído de alta frequência (suave)
  drawGrain(w, h, timestamp);

  // 4. Flickering sutil — variação de opacidade do canvas inteiro
  const flicker = 1 - (_distortion * 0.05 * Math.sin(timestamp * 0.003 + Math.random() * 0.1));
  _canvas.style.opacity = String(Math.max(0.2, Math.min(0.5, 0.4 * flicker)));
}

/**
 * Desenha scanlines horizontais CRT.
 * Espaçamento de 2-3px, opacidade controlada pelo slider.
 */
function drawScanlines(w, h, timestamp) {
  if (_scanlines < 0.02) return;

  const lineHeight = 2;
  const opacity    = _scanlines * 0.55;
  const scroll     = (_distortion > 0.1) ? (timestamp * 0.02 * _distortion) % h : 0;

  _ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;

  for (let y = -scroll; y < h; y += lineHeight * 2) {
    _ctx.fillRect(0, y, w, lineHeight);
  }
}

/**
 * Vignette: gradiente radial que escurece as bordas.
 * Intensidade aumenta com a distorção.
 */
function drawVignette(w, h) {
  const strength = 0.3 + _distortion * 0.5;
  if (strength < 0.05) return;

  const grad = _ctx.createRadialGradient(
    w / 2, h / 2, h * 0.3,    // círculo interno
    w / 2, h / 2, h * 0.85,   // círculo externo
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);

  _ctx.fillStyle = grad;
  _ctx.fillRect(0, 0, w, h);
}

/**
 * Grain: ruído aleatório de grão CRT.
 * Gerado como pixels dispersos de baixa opacidade.
 * Limitado a 20% do canvas para performance.
 */
function drawGrain(w, h, timestamp) {
  const grainIntensity = _distortion * 0.04;
  if (grainIntensity < 0.005) return;

  // Usa imageData para grão pixel-perfect
  // Limitamos a área para manter 60fps
  const sampleW = Math.floor(w * 0.4);
  const sampleH = Math.floor(h * 0.4);
  const imgData = _ctx.createImageData(sampleW, sampleH);
  const data    = imgData.data;

  const seed = Math.floor(timestamp / 50);  // muda a cada 50ms
  for (let i = 0; i < data.length; i += 4) {
    const rand = Math.abs(Math.sin(i * 0.1 + seed)) * grainIntensity;
    if (rand > 0.01) {
      data[i]     = 255;  // R
      data[i + 1] = 179;  // G (tom âmbar do grain)
      data[i + 2] = 0;    // B
      data[i + 3] = Math.floor(rand * 255);
    }
  }

  _ctx.putImageData(imgData, Math.floor(w * 0.3), Math.floor(h * 0.3));
}

/* ═══════════════════════════════════════════════════════════
   OPCIONAL: Implementação WebGL com shader barrel distortion
   (descomentar para efeito mais intenso — maior custo GPU)

   Vertex shader:
     attribute vec2 a_position;
     varying vec2 v_uv;
     void main() {
       v_uv = a_position * 0.5 + 0.5;
       gl_Position = vec4(a_position, 0, 1);
     }

   Fragment shader (barrel + chromatic aberration):
     precision mediump float;
     uniform sampler2D u_texture;
     uniform float u_distortion;
     varying vec2 v_uv;
     void main() {
       vec2 uv = v_uv - 0.5;
       float r2 = dot(uv, uv);
       uv *= 1.0 + u_distortion * r2;
       uv += 0.5;
       if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
         gl_FragColor = vec4(0.0);
         return;
       }
       vec4 col;
       col.r = texture2D(u_texture, uv + vec2(u_distortion*0.002, 0)).r;
       col.g = texture2D(u_texture, uv).g;
       col.b = texture2D(u_texture, uv - vec2(u_distortion*0.002, 0)).b;
       col.a = 1.0;
       gl_FragColor = col;
     }
   ═══════════════════════════════════════════════════════════ */

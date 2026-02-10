// ============================================
// RENDERER — all canvas drawing, zero game logic
// ============================================

import { GAME_CONFIG } from './config';
import type {
  GameState,
  Star,
  CityBuilding,
  Particle,
  ScorePop,
  Collectible,
} from './types';

// ---- Color palette ----
const C = {
  bg: '#060a14',
  birdHighlight: '#99ffff',
  birdCore: '#00e5ff',
  birdDark: '#004455',
  thrustStart: 'rgba(0,229,255,0.7)',
  thrustMid: 'rgba(255,0,255,0.3)',
  thrustEnd: 'rgba(0,0,0,0)',
  pipeHighlight: 'rgba(0,240,255,0.22)',
  pipeMid: 'rgba(0,180,210,0.10)',
  pipeShadow: 'rgba(0,60,80,0.18)',
  pipeEdge: 'rgba(0,255,255,0.35)',
  pipeCapHighlight: 'rgba(0,255,255,0.30)',
  pipeCapShadow: 'rgba(0,120,140,0.22)',
  pipeCapEdge: 'rgba(0,255,255,0.50)',
  pipeGlowLine: 'rgba(0,255,255,0.12)',
  gridLine: 'rgba(0,255,255,0.03)',
  groundGlow: 'rgba(0,255,255,0.12)',
  groundLine: 'rgba(0,255,255,0.25)',
  scoreColor: '#00ffff',
  scoreShadow: '#ff00ff',
  popColor: '#ff00ff',
  starColor: '#aaeeff',
  cityGlow: 'rgba(0,255,255,0.06)',
  cityFill: 'rgba(0,180,210,0.08)',
  cityEdge: 'rgba(0,255,255,0.12)',
};

// ---- Pre-generated scene data ----
let _stars: Star[] = [];
let _buildings: CityBuilding[] = [];
let _bgCanvas: OffscreenCanvas | null = null;
let _bgW = 0;
let _bgH = 0;

export function regenerateScene(w: number, h: number): void {
  // Stars
  _stars = [];
  const starCount = Math.floor((w * h) / 4000);
  for (let i = 0; i < starCount; i++) {
    _stars.push({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
    });
  }

  // City skyline
  _buildings = [];
  const buildingCount = Math.floor(w / 30);
  for (let i = 0; i < buildingCount; i++) {
    _buildings.push({
      x: i / buildingCount,
      width: 12 + Math.random() * 20,
      height: 20 + Math.random() * 80,
      brightness: 0.4 + Math.random() * 0.6,
    });
  }

  // Pre-render static background to offscreen canvas
  _bgW = w;
  _bgH = h;
  try {
    _bgCanvas = new OffscreenCanvas(w, h);
    const bctx = _bgCanvas.getContext('2d');
    if (bctx) {
      drawStaticBackground(bctx as unknown as CanvasRenderingContext2D, w, h);
    }
  } catch {
    _bgCanvas = null; // OffscreenCanvas not supported
  }
}

function drawStaticBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  // Gradient sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#030610');
  skyGrad.addColorStop(0.5, '#060a14');
  skyGrad.addColorStop(1, '#0a1020');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // City glow (radial at bottom center)
  const glowGrad = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.6);
  glowGrad.addColorStop(0, C.cityGlow);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);
}

// ---- Drawing functions ----

export function drawFrame(ctx: CanvasRenderingContext2D, s: GameState): void {
  const { w, h, frame } = s;

  ctx.save();

  // Static background
  if (_bgCanvas && _bgW === w && _bgH === h) {
    ctx.drawImage(_bgCanvas, 0, 0);
  } else {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
  }

  drawStars(ctx, w, h, frame);
  drawCity(ctx, w, h, frame);
  drawGrid(ctx, w, h, frame);
  drawGround(ctx, w, h);

  // Pipes behind bird
  for (const pipe of s.pipes) {
    drawPipe(ctx, pipe.x, pipe.topHeight, pipe.gap, h);
  }

  drawCollectibles(ctx, s.collectibles.activeCollectibles, frame);
  drawParticles(ctx, s.particles);
  drawBird(ctx, s.birdX, s.birdY, s.birdVelocity, frame);
  drawScorePops(ctx, s.scorePops);

  // if (s.phase === 'playing') {
  //   drawLiveScore(ctx, s.score, w);
  // }

  ctx.restore();
}

// ---- Collectibles ----

function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  collectibles: Collectible[],
  frame: number,
): void {
  for (const c of collectibles) {
    if (c.collected) continue;

    const bob = Math.sin(frame * 0.1) * 3;
    const y = c.y + bob;

    ctx.save();
    ctx.translate(c.x, y);

    // Glow background (Stronger)
    const glowSize = 35 + Math.sin(frame * 0.15) * 5;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    grad.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Diamond shape - Solid Background
    ctx.fillStyle = '#0a1525'; // Dark blueish black
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(22, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner rim
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.stroke();

    // Text char (Larger, bold)
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 24px 'Orbitron', monospace"; // Larger font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillText(c.char, 0, 2); 

    ctx.restore();
  }
}

// ---- Star field ----

function drawStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
): void {
  for (const star of _stars) {
    const sx = ((star.x * w + frame * GAME_CONFIG.starSpeed) % (w + 10)) - 5;
    const sy = star.y * h;
    const twinkle =
      star.brightness * (0.6 + 0.4 * Math.sin(frame * star.twinkleSpeed));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = C.starColor;
    ctx.fillRect(sx, sy, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

// ---- City skyline ----

function drawCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
): void {
  const baseY = h - 4;
  for (const b of _buildings) {
    const bx =
      ((b.x * w * 1.5 + frame * GAME_CONFIG.citySpeed) % (w * 1.5 + 40)) - 20;
    const by = baseY - b.height;

    // Building body
    const grad = ctx.createLinearGradient(bx, by, bx + b.width, by);
    grad.addColorStop(0, C.cityFill);
    grad.addColorStop(1, 'rgba(0,80,100,0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, b.width, b.height);

    // Edge highlight
    ctx.globalAlpha = b.brightness * 0.15;
    ctx.strokeStyle = C.cityEdge;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, b.width, b.height);
    ctx.globalAlpha = 1;
  }
}

// ---- Grid ----

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
): void {
  ctx.strokeStyle = C.gridLine;
  ctx.lineWidth = 1;
  const gs = 45;
  const off = (frame * GAME_CONFIG.gridSpeed) % gs;

  for (let x = -off; x < w; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -off; y < h; y += gs) {
    // Fade grid near top
    const opacity = Math.min(1, (y / h) * 2);
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---- Ground ----

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const gy = h - 2;

  // Glow reflection above line
  const reflGrad = ctx.createLinearGradient(0, gy - 30, 0, gy);
  reflGrad.addColorStop(0, 'transparent');
  reflGrad.addColorStop(1, C.groundGlow);
  ctx.fillStyle = reflGrad;
  ctx.fillRect(0, gy - 30, w, 30);

  // Ground line
  ctx.strokeStyle = C.groundLine;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(w, gy);
  ctx.stroke();
}

// ---- Pipe (3D metallic style) ----

function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  topH: number,
  gap: number,
  canvasH: number,
): void {
  const pw = GAME_CONFIG.pipeWidth;
  const capH = GAME_CONFIG.pipeCapHeight;
  const capO = GAME_CONFIG.pipeCapOverhang;
  const bottomY = topH + gap;

  // Body gradient (left-to-right for 3D cylinder effect)
  const bodyGrad = ctx.createLinearGradient(x, 0, x + pw, 0);
  bodyGrad.addColorStop(0, C.pipeShadow);
  bodyGrad.addColorStop(0.2, C.pipeHighlight);
  bodyGrad.addColorStop(0.5, C.pipeMid);
  bodyGrad.addColorStop(0.8, C.pipeHighlight);
  bodyGrad.addColorStop(1, C.pipeShadow);

  // Cap gradient
  const capGrad = ctx.createLinearGradient(x - capO, 0, x + pw + capO, 0);
  capGrad.addColorStop(0, C.pipeCapShadow);
  capGrad.addColorStop(0.3, C.pipeCapHighlight);
  capGrad.addColorStop(0.5, 'rgba(0,255,255,0.18)');
  capGrad.addColorStop(0.7, C.pipeCapHighlight);
  capGrad.addColorStop(1, C.pipeCapShadow);

  // ---- TOP PIPE ----
  // Body
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, 0, pw, topH - capH);

  // Edge lines
  ctx.strokeStyle = C.pipeEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, topH - capH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + pw, 0);
  ctx.lineTo(x + pw, topH - capH);
  ctx.stroke();

  // Center glow line
  ctx.strokeStyle = C.pipeGlowLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + pw / 2, 0);
  ctx.lineTo(x + pw / 2, topH - capH);
  ctx.stroke();

  // Cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - capO, topH - capH, pw + capO * 2, capH);
  ctx.strokeStyle = C.pipeCapEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - capO, topH - capH, pw + capO * 2, capH);

  // ---- BOTTOM PIPE ----
  // Body
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, bottomY + capH, pw, canvasH - bottomY - capH);

  // Edge lines
  ctx.strokeStyle = C.pipeEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, bottomY + capH);
  ctx.lineTo(x, canvasH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + pw, bottomY + capH);
  ctx.lineTo(x + pw, canvasH);
  ctx.stroke();

  // Center glow line
  ctx.strokeStyle = C.pipeGlowLine;
  ctx.beginPath();
  ctx.moveTo(x + pw / 2, bottomY + capH);
  ctx.lineTo(x + pw / 2, canvasH);
  ctx.stroke();

  // Cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - capO, bottomY, pw + capO * 2, capH);
  ctx.strokeStyle = C.pipeCapEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - capO, bottomY, pw + capO * 2, capH);
}

// ---- Bird (3D glowing drone) ----

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vel: number,
  frame: number,
): void {
  ctx.save();
  ctx.translate(x, y);

  const angle = Math.min(Math.max(vel * 3, -22), 55) * (Math.PI / 180);
  ctx.rotate(angle);

  const s = GAME_CONFIG.birdSize;

  // ---- Engine thruster ----
  const thrustLen = 12 + Math.sin(frame * 0.4) * 4;
  const thrustGrad = ctx.createLinearGradient(-s, 0, -s - thrustLen, 0);
  thrustGrad.addColorStop(0, C.thrustStart);
  thrustGrad.addColorStop(0.5, C.thrustMid);
  thrustGrad.addColorStop(1, C.thrustEnd);
  ctx.fillStyle = thrustGrad;
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, -s * 0.25);
  ctx.lineTo(-s - thrustLen, 0);
  ctx.lineTo(-s * 0.6, s * 0.25);
  ctx.closePath();
  ctx.fill();

  // ---- Outer glow ----
  const glowR = s + 4 + Math.sin(frame * 0.12) * 1.5;
  const glowGrad = ctx.createRadialGradient(
    -s * 0.15,
    -s * 0.15,
    0,
    0,
    0,
    glowR,
  );
  glowGrad.addColorStop(0, 'rgba(0,255,255,0.12)');
  glowGrad.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Body (3D sphere via radial gradient) ----
  const bodyGrad = ctx.createRadialGradient(
    -s * 0.25,
    -s * 0.25,
    s * 0.1,
    0,
    0,
    s,
  );
  bodyGrad.addColorStop(0, C.birdHighlight);
  bodyGrad.addColorStop(0.45, C.birdCore);
  bodyGrad.addColorStop(1, C.birdDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();

  // ---- Border ring ----
  ctx.strokeStyle = 'rgba(0,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.stroke();

  // ---- Inner dark core ----
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // ---- Eye glow ----
  const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.22);
  eyeGrad.addColorStop(0, '#ffffff');
  eyeGrad.addColorStop(0.5, C.birdCore);
  eyeGrad.addColorStop(1, 'rgba(0,229,255,0)');
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---- Particles ----

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
): void {
  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color || C.birdCore;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// ---- Score pop "+1" ----

function drawScorePops(ctx: CanvasRenderingContext2D, pops: ScorePop[]): void {
  for (const sp of pops) {
    const progress = sp.frame / GAME_CONFIG.scorePopDuration;
    const alpha = 1 - progress;
    const yOff = -progress * 25;
    const scale = 1 + progress * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(14 * scale)}px 'Orbitron', monospace`;
    ctx.fillStyle = C.popColor;
    ctx.textAlign = 'center';
    ctx.fillText('+1', sp.x, sp.y + yOff);
    ctx.restore();
  }
}

// ---- Live score HUD ----

function drawLiveScore(
  ctx: CanvasRenderingContext2D,
  score: number,
  w: number,
): void {
  ctx.save();
  ctx.font = "bold 28px 'Orbitron', monospace";
  ctx.textAlign = 'center';
  ctx.fillStyle = C.scoreColor;
  ctx.shadowColor = C.scoreShadow;
  ctx.shadowBlur = 10;
  ctx.fillText(String(score), w / 2, 36);
  ctx.shadowBlur = 0;
  ctx.restore();
}

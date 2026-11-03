// Mini games shown in the features section's game demo (src/scripts/GameDemo.ts). Each one is a procedural canvas
// animation: `draw` paints frame `time` (seconds) into a w × h area, so the same function serves the big view and thumbnails.

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => void;

export interface DemoGame {
  name: string;
  draw: Draw;
}

/** Triangle wave 0..1..0 with period 2 */
const triangle = (x: number) => Math.abs((((x % 2) + 2) % 2) - 1);
/** Deterministic pseudo-random 0..1 for an integer seed */
const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};
/** Positive modulo, for things that scroll off one edge and wrap back in */
const wrap = (x: number, size: number) => ((x % size) + size) % size;

const openWorld: Draw = (c, w, h, t) => {
  // Dusk sky and sun
  const horizon = h * 0.58;
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#0b1a3a");
  sky.addColorStop(0.6, "#3a4f8f");
  sky.addColorStop(1, "#f0a37a");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#ffe3b8";
  c.beginPath();
  c.arc(w * 0.7, horizon - h * 0.12, h * 0.07, 0, 7);
  c.fill();
  // Three parallax mountain ranges
  const ranges: [string, number, number][] = [
    ["#2a3a66", 0.3, 0.12],
    ["#1d2a52", 0.22, 0.28],
    ["#121c3a", 0.16, 0.5],
  ];
  ranges.forEach(([color, amp, speed], k) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      const u = (x / w) * 6 + t * speed * 0.6 + k * 3;
      const ridge = 0.5 + 0.5 * Math.sin(u) * 0.6 + 0.25 * Math.sin(u * 2.3 + 1) + 0.15 * Math.sin(u * 5.1);
      c.lineTo(x, horizon - h * amp * ridge * 0.9 + k * h * 0.04);
    }
    c.lineTo(w, h);
    c.fill();
  });
  // Forest floor with drifting pines
  c.fillStyle = "#070c1a";
  c.fillRect(0, horizon + h * 0.08, w, h);
  c.fillStyle = "#0d1a2a";
  for (let i = 0; i < 26; i++) {
    const x = wrap(i * 83.7 - t * h * 0.5, w + 80) - 40;
    const size = h * (0.06 + 0.07 * hash(i));
    const y = horizon + h * 0.1 + h * 0.3 * hash(i + 9);
    c.beginPath();
    c.moveTo(x, y - size * 1.6);
    c.lineTo(x - size * 0.5, y);
    c.lineTo(x + size * 0.5, y);
    c.fill();
  }
  // Falling snow
  c.fillStyle = "rgba(255,255,255,.8)";
  for (let i = 0; i < 60; i++) {
    c.fillRect((hash(i) * w + t * 30 * (0.5 + hash(i + 3))) % w, (hash(i + 5) * h + t * 50 * (0.5 + hash(i + 7))) % h, 2, 2);
  }
};

const breakout: Draw = (c, w, h, t) => {
  c.fillStyle = "#0a0f1e";
  c.fillRect(0, 0, w, h);
  // Bricks disappear one by one, then the wall resets
  const colors = ["#ff5e9c", "#ff9a62", "#f5d142", "#6fe08a", "#5e9bff"];
  const brickW = w / 12;
  const brickH = h * 0.06;
  const broken = Math.floor((t * 3) % 40);
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 12; col++) {
      if (row * 12 + col < broken) continue;
      c.fillStyle = colors[row];
      c.fillRect(col * brickW + 3, h * 0.1 + row * (brickH + 4), brickW - 6, brickH);
    }
  // Ball bounces on two triangle waves; the paddle follows it
  const ballX = triangle(t * 0.42) * w * 0.92 + w * 0.04;
  const ballY = h * 0.2 + triangle(t * 0.67) * h * 0.7;
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(ballX, ballY, h * 0.02, 0, 7);
  c.fill();
  const paddleX = ballX * 0.9 + w * 0.05;
  c.fillStyle = "#e8e8ec";
  c.fillRect(paddleX - w * 0.07, h * 0.94, w * 0.14, h * 0.025);
};

const neonRacer: Draw = (c, w, h, t) => {
  // Synth sky and half sun
  const horizon = h * 0.45;
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#1a0b3a");
  sky.addColorStop(1, "#ff5e9c");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizon);
  c.fillStyle = "#ffd27a";
  c.beginPath();
  c.arc(w / 2, horizon, h * 0.14, Math.PI, 0);
  c.fill();
  c.fillStyle = "#0a0a14";
  c.fillRect(0, horizon, w, h);
  // Pseudo-3D road, one 2px scanline at a time
  for (let y = horizon; y < h; y += 2) {
    const z = (y - horizon) / (h - horizon) + 0.001;
    const depth = 1 / z;
    const curve = Math.sin(t * 0.6 + depth * 0.05) * 60 * (1 - z) * (1 - z);
    const roadW = w * 0.04 + z * w * 0.5;
    const center = w / 2 + curve;
    const stripe = Math.floor(depth * 2 + t * 14) % 2;
    c.fillStyle = stripe ? "#2a1a4a" : "#1d1238";
    c.fillRect(0, y, w, 2);
    c.fillStyle = stripe ? "#3b3b52" : "#32324a";
    c.fillRect(center - roadW, y, roadW * 2, 2);
    c.fillStyle = stripe ? "#ff5e9c" : "#fff";
    c.fillRect(center - roadW, y, roadW * 0.05 + 1, 2);
    c.fillRect(center + roadW - roadW * 0.05, y, roadW * 0.05 + 1, 2);
  }
  // Car
  const carX = w / 2 + Math.sin(t * 1.1) * w * 0.04;
  c.fillStyle = "#ff3d6e";
  c.fillRect(carX - w * 0.05, h * 0.82, w * 0.1, h * 0.07);
  c.fillStyle = "#1a1a24";
  c.fillRect(carX - w * 0.04, h * 0.79, w * 0.08, h * 0.04);
};

const starDefender: Draw = (c, w, h, t) => {
  c.fillStyle = "#04060f";
  c.fillRect(0, 0, w, h);
  // Star field scrolling down
  c.fillStyle = "#9fb4ff";
  for (let i = 0; i < 70; i++) {
    const speed = 0.3 + hash(i + 2);
    c.fillRect(hash(i) * w, (hash(i + 1) * h + t * h * 0.25 * speed) % h, 1 + speed, 1 + speed);
  }
  // Invader formation swaying side to side
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 8; col++) {
      const x = w * 0.15 + col * w * 0.1 + Math.sin(t * 0.9) * w * 0.05;
      const y = h * 0.12 + row * h * 0.1 + Math.abs(Math.sin(t * 0.5 + col)) * 6;
      c.fillStyle = ["#ff5e9c", "#b678ff", "#4fe3d4"][row];
      c.fillRect(x, y, w * 0.05, h * 0.045);
      c.fillStyle = "#04060f";
      c.fillRect(x + w * 0.01, y + h * 0.012, w * 0.008, h * 0.012);
      c.fillRect(x + w * 0.032, y + h * 0.012, w * 0.008, h * 0.012);
    }
  // Ship and its bullets
  const shipX = w / 2 + Math.sin(t * 0.8) * w * 0.3;
  c.fillStyle = "#fff";
  c.beginPath();
  c.moveTo(shipX, h * 0.8);
  c.lineTo(shipX - w * 0.03, h * 0.9);
  c.lineTo(shipX + w * 0.03, h * 0.9);
  c.fill();
  c.fillStyle = "#ffd27a";
  for (let i = 0; i < 4; i++) {
    const bulletY = h * 0.8 - ((t * h * 0.9 + i * h * 0.2) % (h * 0.7));
    c.fillRect(shipX - 1.5, bulletY, 3, h * 0.03);
  }
};

const platformer: Draw = (c, w, h, t) => {
  // Sky with drifting clouds
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#5ec8ff");
  sky.addColorStop(1, "#cdeeff");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(255,255,255,.9)";
  for (let i = 0; i < 5; i++) {
    const x = wrap(i * w * 0.3 - t * 20, w * 1.3) - w * 0.15;
    c.fillRect(x, h * 0.15 + hash(i) * h * 0.2, w * 0.1, h * 0.04);
  }
  // Ground with scrolling dirt blocks
  const ground = h * 0.78;
  c.fillStyle = "#6b4a2b";
  c.fillRect(0, ground, w, h);
  c.fillStyle = "#4abe18";
  c.fillRect(0, ground, w, h * 0.03);
  c.fillStyle = "#8a5e38";
  for (let i = 0; i < 30; i++) {
    if (i % 7 === 3) continue;
    const x = wrap(i * w * 0.09 - t * h * 0.4, w * 1.1) - 20;
    c.fillRect(x, ground + h * 0.06, w * 0.04, h * 0.04);
  }
  // Jumping player
  const playerY = ground - h * 0.07 - Math.max(0, Math.sin(t * 2.4)) * h * 0.18;
  c.fillStyle = "#ff5e9c";
  c.fillRect(w * 0.3, playerY, h * 0.07, h * 0.07);
  c.fillStyle = "#fff";
  c.fillRect(w * 0.3 + h * 0.045, playerY + h * 0.015, h * 0.014, h * 0.014);
  // Bobbing coins
  c.fillStyle = "#f5d142";
  for (let i = 0; i < 4; i++) {
    const x = wrap(i * w * 0.22 - t * h * 0.4 + w, w * 1.1);
    c.beginPath();
    c.arc(x, ground - h * 0.22 - Math.sin(t * 3 + i) * 5, h * 0.02, 0, 7);
    c.fill();
  }
};

const snake: Draw = (c, w, h, t) => {
  // Checkerboard grid of 24 × 14 cells
  c.fillStyle = "#08130f";
  c.fillRect(0, 0, w, h);
  const cellW = w / 24;
  const cellH = h / 14;
  c.fillStyle = "rgba(255,255,255,.04)";
  for (let x = 0; x < 24; x++) for (let y = 0; y < 14; y++) if ((x + y) % 2) c.fillRect(x * cellW, y * cellH, cellW, cellH);
  // The snake loops around a fixed 76-cell rectangle; step k gives its cell
  const cellAt = (k: number): [number, number] => {
    const u = wrap(k, 76);
    if (u < 19) return [2 + u, 2];
    if (u < 28) return [21, 2 + (u - 19)];
    if (u < 47) return [21 - (u - 28), 11];
    return [2, 11 - (u - 47)];
  };
  const head = Math.floor(t * 7);
  for (let i = 0; i < 14; i++) {
    const [x, y] = cellAt(head - i);
    c.fillStyle = i ? `rgba(111,224,138,${1 - i * 0.05})` : "#c8f58a";
    c.fillRect(x * cellW + 2, y * cellH + 2, cellW - 4, cellH - 4);
  }
  // Pulsing food, moved every 3 seconds
  const foodX = 4 + Math.floor(hash(Math.floor(t / 3)) * 16);
  const foodY = 3 + Math.floor(hash(Math.floor(t / 3) + 4) * 8);
  c.fillStyle = "#ff5e9c";
  c.beginPath();
  c.arc(foodX * cellW + cellW / 2, foodY * cellH + cellH / 2, cellW * 0.3 * (1 + 0.15 * Math.sin(t * 6)), 0, 7);
  c.fill();
};

export const GAMES: DemoGame[] = [
  { name: "3D Open World", draw: openWorld },
  { name: "Breakout", draw: breakout },
  { name: "Neon Racer", draw: neonRacer },
  { name: "Star Defender", draw: starDefender },
  { name: "Pixel Platformer", draw: platformer },
  { name: "Snake", draw: snake },
];

/** Backing-store sizes of the big view and the thumbnails (the draw functions work in these units) */
export const GAME_VIEW = { width: 1120, height: 630 };
export const GAME_THUMB = { width: 320, height: 180 };

// src/scenes/PreloaderScene.js
//
// Genera TODOS los assets de forma procedimental usando Phaser.Graphics
// y los convierte en texturas reutilizables con generateTexture().
// No se carga ningún archivo externo.
//

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  init() {}

  preload() {}

  create() {
    this._generateGrassTexture();
    this._generateAsphaltTexture();
    this._generateCarTexture();
    this._generateTreeTexture();
    this._generateGoalTexture();
    this._generateButtonTextures();
    this._generateMapTexture();

    // Brief pause then go to menu
    this.time.delayedCall(200, () => {
      this.scene.start('MenuScene');
    });
  }

  update() {}

  // ─── Asset generators ────────────────────────────────────────────────────────

  /** 32×32 grass tile */
  _generateGrassTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3a7d44, 1);
    g.fillRect(0, 0, 32, 32);
    // Variation blades
    g.fillStyle(0x2e6636, 1);
    g.fillRect(4, 6, 2, 8);
    g.fillRect(12, 2, 2, 10);
    g.fillRect(22, 8, 2, 6);
    g.fillRect(28, 3, 2, 9);
    g.generateTexture('grass', 32, 32);
    g.destroy();
  }

  /** 64×64 asphalt tile */
  _generateAsphaltTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Dark road surface
    g.fillStyle(0x2c2c2c, 1);
    g.fillRect(0, 0, 64, 64);
    // Subtle texture lines
    g.fillStyle(0x383838, 1);
    g.fillRect(0, 15, 64, 1);
    g.fillRect(0, 40, 64, 1);
    g.generateTexture('asphalt', 64, 64);
    g.destroy();
  }

  /** 40×70 top-down car (red) */
  _generateCarTexture() {
    const W = 40, H = 70;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Car body
    g.fillStyle(0xcc2200, 1);
    g.fillRoundedRect(4, 4, W - 8, H - 8, 8);

    // Windshield (front = top in texture)
    g.fillStyle(0x88ccff, 0.85);
    g.fillRoundedRect(8, 8, W - 16, 16, 4);

    // Rear window
    g.fillStyle(0x88ccff, 0.6);
    g.fillRoundedRect(8, H - 24, W - 16, 12, 3);

    // Left wheel
    g.fillStyle(0x111111, 1);
    g.fillRect(0, 10, 6, 14);
    g.fillRect(0, H - 24, 6, 14);

    // Right wheel
    g.fillRect(W - 6, 10, 6, 14);
    g.fillRect(W - 6, H - 24, 6, 14);

    // Headlights
    g.fillStyle(0xffee88, 1);
    g.fillRect(8, 4, 8, 4);
    g.fillRect(W - 16, 4, 8, 4);

    // Taillights
    g.fillStyle(0xff2200, 1);
    g.fillRect(8, H - 8, 8, 4);
    g.fillRect(W - 16, H - 8, 8, 4);

    // Roof stripe
    g.fillStyle(0xaa1100, 1);
    g.fillRect(W / 2 - 2, 26, 4, 16);

    g.generateTexture('car', W, H);
    g.destroy();
  }

  /** 28×28 tree sprite (overhead view) */
  _generateTreeTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(16, 17, 22, 14);
    // Trunk
    g.fillStyle(0x6b4226, 1);
    g.fillRect(12, 13, 4, 6);
    // Canopy
    g.fillStyle(0x1e7a1e, 1);
    g.fillCircle(14, 11, 12);
    g.fillStyle(0x145214, 1);
    g.fillCircle(14, 10, 8);
    g.fillStyle(0x28a428, 1);
    g.fillCircle(10, 8, 5);
    g.fillCircle(18, 9, 4);
    g.generateTexture('tree', 28, 28);
    g.destroy();
  }

  /** 200×40 finish-line banner */
  _generateGoalTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const cols = 10, rows = 2, cw = 20, ch = 20;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dark = (r + c) % 2 === 0;
        g.fillStyle(dark ? 0x000000 : 0xffffff, 1);
        g.fillRect(c * cw, r * ch, cw, ch);
      }
    }
    g.generateTexture('goal', cols * cw, rows * ch);
    g.destroy();
  }

  /** HUD touch button textures */
  _generateButtonTextures() {
    const SIZE = 64;

    const _btn = (key, drawFn) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Base circle
      g.fillStyle(0x000000, 0.45);
      g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2);
      g.lineStyle(2, 0xffffff, 0.6);
      g.strokeCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 1);
      drawFn(g, SIZE);
      g.generateTexture(key, SIZE, SIZE);
      g.destroy();
    };

    const arrow = (g, size, dir) => {
      const cx = size / 2, cy = size / 2, as = 14;
      g.fillStyle(0xffffff, 0.9);
      g.beginPath();
      if (dir === 'up') {
        g.moveTo(cx, cy - as); g.lineTo(cx - as, cy + as * 0.5); g.lineTo(cx + as, cy + as * 0.5);
      } else if (dir === 'down') {
        g.moveTo(cx, cy + as); g.lineTo(cx - as, cy - as * 0.5); g.lineTo(cx + as, cy - as * 0.5);
      } else if (dir === 'left') {
        g.moveTo(cx - as, cy); g.lineTo(cx + as * 0.5, cy - as); g.lineTo(cx + as * 0.5, cy + as);
      } else if (dir === 'right') {
        g.moveTo(cx + as, cy); g.lineTo(cx - as * 0.5, cy - as); g.lineTo(cx - as * 0.5, cy + as);
      }
      g.closePath();
      g.fillPath();
    };

    _btn('btn_up',    (g, s) => arrow(g, s, 'up'));
    _btn('btn_down',  (g, s) => arrow(g, s, 'down'));
    _btn('btn_left',  (g, s) => arrow(g, s, 'left'));
    _btn('btn_right', (g, s) => arrow(g, s, 'right'));
  }

  /**
   * Full world map texture (1600 × 4600).
   * Drawn on a RenderTexture so we can paint the road layout,
   * grass areas, trees and start/finish lines all procedurally.
   */
  _generateMapTexture() {
    const WW = 1600, WH = 4600;
    const rt = this.add.renderTexture(0, 0, WW, WH).setVisible(false);

    // ── 1. Grass background ───────────────────────────────────────────────────
    const grass = this.make.graphics({ x: 0, y: 0, add: false });
    grass.fillStyle(0x3a7d44, 1);
    grass.fillRect(0, 0, WW, WH);
    rt.draw(grass, 0, 0);
    grass.destroy();

    // ── 2. Road path (curvy track from north to south) ────────────────────────
    //
    // The track is a serpentine path defined as a series of horizontal road
    // segments. We draw asphalt rectangles and curved corner fills to connect
    // them.  Road width = 220 px.
    //
    // Segment definitions: { x, y, w, h }  (in world coords)
    // The car starts near the top (y ≈ 80) and finishes at the bottom (y ≈ 4500)
    //
    const ROAD_W = 220;
    const road = this.make.graphics({ x: 0, y: 0, add: false });
    road.fillStyle(0x2c2c2c, 1);

    // Straight A – top section (centered around x=800)
    const CX = 800;
    // We build the track as a sequence of rectangles + rounded corners
    // Vertical straights with horizontal shifts to create an S-curve layout

    const segments = [
      // id, x1 center, y1 top, y2 bottom
      { cx: CX,       y1:    0, y2:  900 },   // A – center straight down
      { cx: CX - 350, y1:  820, y2: 1600 },   // B – left straight
      { cx: CX,       y1: 1520, y2: 2300 },   // C – center again
      { cx: CX + 350, y1: 2220, y2: 3000 },   // D – right straight
      { cx: CX,       y1: 2920, y2: 3700 },   // E – center
      { cx: CX - 300, y1: 3620, y2: 4600 },   // F – left to finish
    ];

    // Draw all vertical straights
    for (const s of segments) {
      road.fillRect(s.cx - ROAD_W / 2, s.y1, ROAD_W, s.y2 - s.y1);
    }

    // Draw horizontal connectors between segments
    const connections = [
      { fromCX: segments[0].cx, toCX: segments[1].cx, y: 860 },
      { fromCX: segments[1].cx, toCX: segments[2].cx, y: 1560 },
      { fromCX: segments[2].cx, toCX: segments[3].cx, y: 2260 },
      { fromCX: segments[3].cx, toCX: segments[4].cx, y: 2960 },
      { fromCX: segments[4].cx, toCX: segments[5].cx, y: 3660 },
    ];

    for (const c of connections) {
      const x1 = Math.min(c.fromCX, c.toCX) - ROAD_W / 2;
      const x2 = Math.max(c.fromCX, c.toCX) + ROAD_W / 2;
      road.fillRect(x1, c.y - ROAD_W / 2, x2 - x1, ROAD_W);
    }

    rt.draw(road, 0, 0);
    road.destroy();

    // ── 3. Road markings (dashed center line) ─────────────────────────────────
    const marks = this.make.graphics({ x: 0, y: 0, add: false });
    marks.fillStyle(0xffff00, 0.6);
    const DASH = 40, GAP = 30;

    for (const s of segments) {
      let y = s.y1 + DASH;
      while (y < s.y2 - DASH) {
        marks.fillRect(s.cx - 3, y, 6, DASH);
        y += DASH + GAP;
      }
    }
    rt.draw(marks, 0, 0);
    marks.destroy();

    // ── 4. Kerb / road edge stripes ───────────────────────────────────────────
    const kerb = this.make.graphics({ x: 0, y: 0, add: false });
    const KERB = 10;
    const STRIPE_H = 20;
    for (const s of segments) {
      let y = s.y1;
      let toggle = false;
      while (y < s.y2) {
        kerb.fillStyle(toggle ? 0xff0000 : 0xffffff, 1);
        // Left kerb
        kerb.fillRect(s.cx - ROAD_W / 2, y, KERB, Math.min(STRIPE_H, s.y2 - y));
        // Right kerb
        kerb.fillRect(s.cx + ROAD_W / 2 - KERB, y, KERB, Math.min(STRIPE_H, s.y2 - y));
        y += STRIPE_H;
        toggle = !toggle;
      }
    }
    rt.draw(kerb, 0, 0);
    kerb.destroy();

    // ── 5. Trees scattered on grass ───────────────────────────────────────────
    // Pre-generate tree graphics and stamp at fixed positions
    const treeG = this.make.graphics({ x: 0, y: 0, add: false });
    const treePositions = this._getTreePositions(segments, ROAD_W, WW, WH);
    for (const tp of treePositions) {
      this._drawTreeAt(treeG, tp.x - 14, tp.y - 14);
    }
    rt.draw(treeG, 0, 0);
    treeG.destroy();

    // ── 6. Start banner ───────────────────────────────────────────────────────
    const startG = this.make.graphics({ x: 0, y: 0, add: false });
    startG.fillStyle(0xffffff, 1);
    startG.fillRect(segments[0].cx - ROAD_W / 2, 140, ROAD_W, 8);
    startG.fillStyle(0x00cc44, 1);
    startG.fillRect(segments[0].cx - ROAD_W / 2, 148, ROAD_W, 8);
    rt.draw(startG, 0, 0);
    startG.destroy();

    // ── 7. Finish checkerboard ────────────────────────────────────────────────
    const finishG = this.make.graphics({ x: 0, y: 0, add: false });
    const fx = segments[5].cx - ROAD_W / 2;
    const fy = 4460;
    const cw = 20, ch = 20;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < Math.floor(ROAD_W / cw); c++) {
        finishG.fillStyle((r + c) % 2 === 0 ? 0x000000 : 0xffffff, 1);
        finishG.fillRect(fx + c * cw, fy + r * ch, cw, ch);
      }
    }
    rt.draw(finishG, 0, 0);
    finishG.destroy();

    // Save the render texture as a named texture for use in GameScene
    rt.saveTexture('worldMap');
    // We keep the render texture hidden; it will be added as an image in GameScene
  }

  /** Generate safe tree positions that avoid the road */
  _getTreePositions(segments, roadW, ww, wh) {
    const positions = [];
    const MARGIN = 60; // extra margin beyond road edge
    const MIN_SPACING = 80;
    const CANDIDATES = 300;

    const onRoad = (x, y) => {
      for (const s of segments) {
        const inX = x > s.cx - roadW / 2 - MARGIN && x < s.cx + roadW / 2 + MARGIN;
        const inY = y > s.y1 - MARGIN && y < s.y2 + MARGIN;
        if (inX && inY) return true;
      }
      return false;
    };

    const tooClose = (x, y) => {
      for (const p of positions) {
        if (Math.hypot(p.x - x, p.y - y) < MIN_SPACING) return true;
      }
      return false;
    };

    // Use a seeded-like deterministic sequence
    let sx = 123456789;
    const rand = () => {
      sx ^= sx << 13; sx ^= sx >> 17; sx ^= sx << 5;
      return Math.abs(sx) / 2147483647;
    };

    for (let i = 0; i < CANDIDATES; i++) {
      const x = 20 + rand() * (ww - 40);
      const y = 20 + rand() * (wh - 40);
      if (!onRoad(x, y) && !tooClose(x, y)) {
        positions.push({ x, y });
      }
    }
    return positions;
  }

  /** Draw a tree procedurally at position (ox, oy) into graphics object g */
  _drawTreeAt(g, ox, oy) {
    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 16, oy + 18, 22, 12);
    // Trunk
    g.fillStyle(0x6b4226, 1);
    g.fillRect(ox + 12, oy + 14, 4, 6);
    // Canopy layers
    g.fillStyle(0x1e7a1e, 1);
    g.fillCircle(ox + 14, oy + 11, 12);
    g.fillStyle(0x145214, 1);
    g.fillCircle(ox + 14, oy + 10, 8);
    g.fillStyle(0x2ea82e, 1);
    g.fillCircle(ox + 10, oy + 8, 5);
    g.fillCircle(ox + 18, oy + 9, 4);
  }
}

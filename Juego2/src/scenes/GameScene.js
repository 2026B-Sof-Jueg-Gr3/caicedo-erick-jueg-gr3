// src/scenes/GameScene.js
//
// Main gameplay scene.
//  • World: 1600 × 4600 px  |  Viewport: 1024 × 768 px
//  • Physics: Arcade (no gravity)
//  • Controls: WASD, Arrow keys, on-screen HUD buttons
//  • Speed: 320 px/s on asphalt | 160 px/s on grass
//  • Victory: overlap with invisible goal zone → GameOverScene
//

const WORLD_W = 1600;
const WORLD_H = 4600;
const ROAD_W  = 220;        // must match PreloaderScene
const SPEED_ROAD  = 320;
const SPEED_GRASS = 160;

// Road segment definitions (must match PreloaderScene exactly)
const CX = 800;
const SEGMENTS = [
  { cx: CX,       y1:    0, y2:  900 },
  { cx: CX - 350, y1:  820, y2: 1600 },
  { cx: CX,       y1: 1520, y2: 2300 },
  { cx: CX + 350, y1: 2220, y2: 3000 },
  { cx: CX,       y1: 2920, y2: 3700 },
  { cx: CX - 300, y1: 3620, y2: 4600 },
];

// Horizontal connectors between consecutive segments
const CONNECTIONS = [
  { fromCX: SEGMENTS[0].cx, toCX: SEGMENTS[1].cx, y: 860 },
  { fromCX: SEGMENTS[1].cx, toCX: SEGMENTS[2].cx, y: 1560 },
  { fromCX: SEGMENTS[2].cx, toCX: SEGMENTS[3].cx, y: 2260 },
  { fromCX: SEGMENTS[3].cx, toCX: SEGMENTS[4].cx, y: 2960 },
  { fromCX: SEGMENTS[4].cx, toCX: SEGMENTS[5].cx, y: 3660 },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  init() {
    this._started      = false;
    this._finished     = false;
    this._elapsedMs    = 0;
    this._controlsActive = true;

    // Touch button state
    this._touchDir = { up: false, down: false, left: false, right: false };
  }

  preload() {}

  create() {
    // ── World map ─────────────────────────────────────────────────────────────
    this.add.image(0, 0, 'worldMap').setOrigin(0, 0);

    // ── Physics world bounds ──────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── Player (car) ──────────────────────────────────────────────────────────
    const startX = SEGMENTS[0].cx;
    const startY = 200; // near top, on starting straight

    this.player = this.physics.add.image(startX, startY, 'car')
      .setCollideWorldBounds(true)
      .setDepth(10);

    // Phaser rotation: 0° = right, car texture points UP → offset by -90°
    // We store the logical angle in _angle (degrees, 0 = up = north)
    this._angle = 180; // facing down (south) = direction of travel

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── Input (keyboard) ─────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // ── Goal zone (invisible overlap trigger) ─────────────────────────────────
    // At the bottom of the last segment
    const lastSeg = SEGMENTS[SEGMENTS.length - 1];
    this._goalZone = this.add.zone(lastSeg.cx, 4470, ROAD_W - 20, 60)
      .setOrigin(0.5, 0.5);
    this.physics.world.enable(this._goalZone);
    this._goalZone.body.setAllowGravity(false);
    this._goalZone.body.immovable = true;

    this.physics.add.overlap(
      this.player,
      this._goalZone,
      this._onGoal,
      null,
      this
    );

    // ── HUD ───────────────────────────────────────────────────────────────────
    this._createHUD();

    // ── Start countdown ───────────────────────────────────────────────────────
    this._showCountdown();
  }

  update(time, delta) {
    if (this._finished) return;

    // Tick stopwatch only after race started
    if (this._started) {
      this._elapsedMs += delta;
      this._updateTimerText();
    }

    if (!this._controlsActive) return;

    // ── Gather input ──────────────────────────────────────────────────────────
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown    || this._touchDir.up;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown  || this._touchDir.down;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown  || this._touchDir.left;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this._touchDir.right;

    // ── Direction vector (8-way normalised) ───────────────────────────────────
    let dx = 0, dy = 0;
    if (up)    dy -= 1;
    if (down)  dy += 1;
    if (left)  dx -= 1;
    if (right) dx += 1;

    const moving = dx !== 0 || dy !== 0;

    if (moving) {
      // Normalise diagonal movement
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;

      // Update logical angle (degrees, 0 = up)
      this._angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90;

      // Determine speed based on terrain
      const speed = this._isOnRoad(this.player.x, this.player.y)
        ? SPEED_ROAD
        : SPEED_GRASS;

      this.player.setVelocity(dx * speed, dy * speed);
    } else {
      // Dry braking — stop immediately
      this.player.setVelocity(0, 0);
    }

    // Rotate sprite to match movement direction
    // Phaser image angle: 0 = right, so texture (which points up) needs -90 offset
    this.player.setAngle(this._angle - 90);
  }

  // ─── Terrain detection ───────────────────────────────────────────────────────

  /**
   * Returns true if the position (x, y) is on an asphalt segment or connector.
   */
  _isOnRoad(x, y) {
    // Check vertical straights
    for (const s of SEGMENTS) {
      if (
        x >= s.cx - ROAD_W / 2 &&
        x <= s.cx + ROAD_W / 2 &&
        y >= s.y1 &&
        y <= s.y2
      ) return true;
    }
    // Check horizontal connectors
    for (const c of CONNECTIONS) {
      const x1 = Math.min(c.fromCX, c.toCX) - ROAD_W / 2;
      const x2 = Math.max(c.fromCX, c.toCX) + ROAD_W / 2;
      if (
        x >= x1 && x <= x2 &&
        y >= c.y - ROAD_W / 2 &&
        y <= c.y + ROAD_W / 2
      ) return true;
    }
    return false;
  }

  // ─── Victory ─────────────────────────────────────────────────────────────────

  _onGoal() {
    if (this._finished) return;
    this._finished = true;
    this._controlsActive = false;

    // Freeze player
    this.player.setVelocity(0, 0);

    // Flash effect
    this.cameras.main.flash(600, 255, 255, 255);

    this.time.delayedCall(700, () => {
      this.scene.start('GameOverScene', { time: this._elapsedMs });
    });
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────

  _createHUD() {
    const { width, height } = this.scale;

    // Semi-transparent timer panel
    const panelBg = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
    panelBg.fillStyle(0x000000, 0.55);
    panelBg.fillRoundedRect(12, 12, 220, 52, 10);

    // Timer label
    this.add.text(20, 20, '⏱ Tiempo:', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaffaa',
    }).setScrollFactor(0).setDepth(101);

    this._timerText = this.add.text(20, 38, '00:00:00', {
      fontSize: '22px',
      fontFamily: '"Courier New", monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(101);

    // Speed indicator
    this._speedText = this.add.text(width - 16, 20, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcc44',
      align: 'right',
    }).setScrollFactor(0).setDepth(101).setOrigin(1, 0);

    // Terrain indicator
    this._terrainText = this.add.text(width - 16, 40, '', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
      align: 'right',
    }).setScrollFactor(0).setDepth(101).setOrigin(1, 0);

    // Countdown overlay text (shown during countdown)
    this._countdownText = this.add.text(width / 2, height / 2, '', {
      fontSize: '96px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff4400',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5);

    // Touch controls
    this._createTouchButtons();
  }

  _updateTimerText() {
    const total = Math.floor(this._elapsedMs);
    const ms    = total % 1000;
    const sec   = Math.floor(total / 1000) % 60;
    const min   = Math.floor(total / 60000);

    this._timerText.setText(
      `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(Math.floor(ms / 10)).padStart(2, '0')}`
    );

    // Speed indicator update
    const onRoad = this._isOnRoad(this.player.x, this.player.y);
    const speed  = onRoad ? SPEED_ROAD : SPEED_GRASS;
    this._speedText.setText(`${speed} px/s`);
    this._terrainText.setText(onRoad ? '🛣 Asfalto' : '🌿 Pasto');
  }

  // ─── Countdown ───────────────────────────────────────────────────────────────

  _showCountdown() {
    this._controlsActive = false;
    const { width, height } = this.scale;

    const steps = ['3', '2', '1', '¡YA!'];
    let i = 0;

    const show = () => {
      if (i >= steps.length) {
        this._countdownText.setText('');
        this._controlsActive = true;
        this._started = true;
        return;
      }

      const label = steps[i];
      this._countdownText.setText(label);
      this._countdownText.setScale(0.5).setAlpha(1);

      this.tweens.add({
        targets: this._countdownText,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 900,
        ease: 'Power2',
        onComplete: () => {
          i++;
          this.time.delayedCall(50, show);
        },
      });
    };

    show();
  }

  // ─── Touch / HUD buttons ─────────────────────────────────────────────────────

  _createTouchButtons() {
    const { width, height } = this.scale;
    const SIZE   = 64;
    const MARGIN = 14;
    const PAD    = SIZE + MARGIN;

    // Layout centre for the D-pad cluster
    const cx = width  - PAD - MARGIN - SIZE / 2;
    const cy = height - PAD - MARGIN - SIZE / 2;

    const positions = {
      up:    { x: cx,        y: cy - PAD,   dir: 'up'    },
      down:  { x: cx,        y: cy + PAD,   dir: 'down'  },
      left:  { x: cx - PAD,  y: cy,         dir: 'left'  },
      right: { x: cx + PAD,  y: cy,         dir: 'right' },
    };

    for (const [, cfg] of Object.entries(positions)) {
      const btn = this.add.image(cfg.x, cfg.y, `btn_${cfg.dir}`)
        .setScrollFactor(0)
        .setDepth(150)
        .setAlpha(0.75)
        .setInteractive();

      btn.on('pointerdown',  () => { this._touchDir[cfg.dir] = true;  btn.setAlpha(1); });
      btn.on('pointerup',    () => { this._touchDir[cfg.dir] = false; btn.setAlpha(0.75); });
      btn.on('pointerout',   () => { this._touchDir[cfg.dir] = false; btn.setAlpha(0.75); });
    }

    // Enable multi-touch
    this.input.addPointer(3);
  }
}

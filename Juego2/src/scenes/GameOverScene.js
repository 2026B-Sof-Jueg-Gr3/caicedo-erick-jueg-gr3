// src/scenes/GameOverScene.js
//
// Receives `{ time: elapsedMs }` from GameScene.
// Displays the race time and offers Restart / Menu buttons.
//

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this._elapsedMs = data?.time ?? 0;
  }

  preload() {}

  create() {
    const { width, height } = this.scale;

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000000, 0x000000, 0x0a2a0a, 0x0a2a0a, 1);
    bg.fillRect(0, 0, width, height);

    // Checkerboard strip at top
    const cw = 40;
    for (let i = 0; i < Math.ceil(width / cw); i++) {
      this.add.graphics()
        .fillStyle(i % 2 === 0 ? 0x000000 : 0xffffff, 1)
        .fillRect(i * cw, 0, cw, 30);
    }
    for (let i = 0; i < Math.ceil(width / cw); i++) {
      this.add.graphics()
        .fillStyle(i % 2 !== 0 ? 0x000000 : 0xffffff, 1)
        .fillRect(i * cw, 30, cw, 30);
    }

    // ── Trophy emoji / icon ───────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.18, '🏆', {
      fontSize: '80px',
    }).setOrigin(0.5);

    // ── "META!" banner ────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.33, '¡META!', {
      fontSize: '78px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ffd700',
      stroke: '#cc7700',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // ── Time display ──────────────────────────────────────────────────────────
    const total = Math.floor(this._elapsedMs);
    const ms    = total % 1000;
    const sec   = Math.floor(total / 1000) % 60;
    const min   = Math.floor(total / 60000);
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(Math.floor(ms / 10)).padStart(2, '0')}`;

    this.add.text(width / 2, height * 0.47, 'Tu tiempo:', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaffaa',
    }).setOrigin(0.5);

    const timeText = this.add.text(width / 2, height * 0.56, timeStr, {
      fontSize: '56px',
      fontFamily: '"Courier New", monospace',
      color: '#00ff88',
      fontStyle: 'bold',
      stroke: '#003322',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Pulsing animation on the time display
    this.tweens.add({
      targets: timeText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Rating ────────────────────────────────────────────────────────────────
    const rating = this._getRating(total);
    this.add.text(width / 2, height * 0.67, rating.label, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: rating.color,
    }).setOrigin(0.5);

    // ── Buttons ───────────────────────────────────────────────────────────────
    this._addButton(width / 2 - 140, height * 0.82, '🔄 REINTENTAR', 0x226622, 0x44aa44, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    this._addButton(width / 2 + 140, height * 0.82, '🏠 MENÚ',       0x224466, 0x4488cc, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    // Keyboard shortcut – Enter = restart
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-R',     () => this.scene.start('GameScene'));

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update() {}

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _getRating(ms) {
    if (ms < 45000)  return { label: '⭐⭐⭐ ¡Increíble!',  color: '#ffd700' };
    if (ms < 70000)  return { label: '⭐⭐  ¡Muy bien!',   color: '#00ff88' };
    if (ms < 100000) return { label: '⭐   Buen intento', color: '#88ccff' };
    return                 { label: '💪  ¡Sigue practicando!', color: '#ffaa44' };
  }

  _addButton(x, y, label, colorNormal, colorHover, callback) {
    const btnW = 240, btnH = 58, btnR = 12;

    const bg = this.add.graphics();
    const txt = this.add.text(x, y, label, {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    const draw = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? colorHover : colorNormal, 1);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnR);
      bg.lineStyle(2, hover ? 0xffffff : 0x88ffaa, 0.8);
      bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnR);
    };
    draw(false);

    const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => { draw(true);  txt.setScale(1.05); });
    zone.on('pointerout',   () => { draw(false); txt.setScale(1); });
    zone.on('pointerdown',  callback);
  }
}

// src/scenes/MenuScene.js
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  init() {}
  preload() {}

  create() {
    const { width, height } = this.scale;

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x1a3a1a, 0x1a3a1a, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative road stripe
    const stripe = this.add.graphics();
    stripe.fillStyle(0xffff00, 0.15);
    stripe.fillRect(width / 2 - 3, 0, 6, height);

    // ── Title ─────────────────────────────────────────────────────────────────
    const titleShadow = this.add.text(width / 2 + 4, height * 0.22 + 4, 'CARRERA\nTOP-DOWN', {
      fontSize: '72px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#000000',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(width / 2, height * 0.22, 'CARRERA\nTOP-DOWN', {
      fontSize: '72px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff4400',
      stroke: '#ffffff',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // ── Subtitle ──────────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.42, '¡Llega a la meta lo más rápido posible!', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ccddcc',
    }).setOrigin(0.5);

    // ── Controls hint ─────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.52, 'Controles: WASD  /  Flechas  /  Botones táctiles', {
      fontSize: '17px',
      fontFamily: 'Arial, sans-serif',
      color: '#aabbaa',
    }).setOrigin(0.5);

    // ── Mini car preview ──────────────────────────────────────────────────────
    const carPreview = this.add.image(width / 2, height * 0.64, 'car')
      .setScale(1.4)
      .setAngle(-90); // pointing right for cosmetic display

    this.tweens.add({
      targets: carPreview,
      x: width / 2 + 30,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Start button ──────────────────────────────────────────────────────────
    const btnBg = this.add.graphics();
    const btnX = width / 2, btnY = height * 0.83;
    const btnW = 260, btnH = 62, btnR = 14;

    const drawBtn = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xff6600 : 0xcc3300, 1);
      btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, btnR);
      btnBg.lineStyle(3, hover ? 0xffffff : 0xff9966, 1);
      btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, btnR);
    };
    drawBtn(false);

    const btnText = this.add.text(btnX, btnY, '▶  EMPEZAR', {
      fontSize: '30px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Invisible hit area
    const btnZone = this.add.zone(btnX, btnY, btnW, btnH)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => { drawBtn(true); btnText.setScale(1.05); });
    btnZone.on('pointerout',  () => { drawBtn(false); btnText.setScale(1); });
    btnZone.on('pointerdown', () => this._startGame());

    // Keyboard shortcut
    this.input.keyboard.once('keydown-ENTER', () => this._startGame());
    this.input.keyboard.once('keydown-SPACE', () => this._startGame());

    // ── Pulse animation on button ─────────────────────────────────────────────
    this.tweens.add({
      targets: btnText,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Title bounce ──────────────────────────────────────────────────────────
    this.tweens.add({
      targets: [title, titleShadow],
      y: '-=8',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _startGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  update() {}
}

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
    const titleShadow = this.add.text(width / 2 + 4, height * 0.20 + 4, 'NEED FOR SPEED\nTEMU´S EDITION', {
      fontSize: '56px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#000000',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5).setAlpha(0.6);

    const title = this.add.text(width / 2, height * 0.20, 'NEED FOR SPEED\nTEMU´S EDITION', {
      fontSize: '56px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff5500',
      stroke: '#ffffff',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // ── Subtitle & Lore ────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.38, '¡Escapa de la patrulla Temu a toda velocidad y cruza la meta!', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffeedd',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Controls hint ─────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.46, 'Controles: WASD  /  Flechas  /  Botones táctiles', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#aabbaa',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.51, '⚠️ ¡Si el auto Temu te embiste 5 veces, serás interceptado!', {
      fontSize: '15px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff9966',
    }).setOrigin(0.5);

    // ── Mini car chase preview ────────────────────────────────────────────────
    // Chased player car
    const carPreview = this.add.image(width / 2 + 65, height * 0.64, 'car')
      .setScale(1.3)
      .setAngle(-90);

    // Chasing Temu orange patrol car
    const temuPreview = this.add.image(width / 2 - 65, height * 0.64, 'temuCar')
      .setScale(1.3)
      .setAngle(-90);

    // Flashing siren light effects on Temu preview
    const sirenGlow = this.add.graphics();
    let sirenToggle = false;
    this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        sirenToggle = !sirenToggle;
        sirenGlow.clear();
        sirenGlow.fillStyle(sirenToggle ? 0x0088ff : 0xff1100, 0.45);
        sirenGlow.fillCircle(temuPreview.x, temuPreview.y, 24);
      },
    });

    // Chase swaying animation
    this.tweens.add({
      targets: [carPreview, temuPreview],
      x: '+=35',
      duration: 850,
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

    // ── Historia button (debajo del botón principal) ───────────────────────────
    const histBg = this.add.graphics();
    const histX = width / 2, histY = height * 0.83 + 70;
    const histW = 290, histH = 46, histR = 10;

    const drawHist = (hover) => {
      histBg.clear();
      histBg.fillStyle(hover ? 0x661111 : 0x3d0a0a, 1);
      histBg.fillRoundedRect(histX - histW / 2, histY - histH / 2, histW, histH, histR);
      histBg.lineStyle(2, hover ? 0xff6666 : 0xaa3333, 1);
      histBg.strokeRoundedRect(histX - histW / 2, histY - histH / 2, histW, histH, histR);
    };
    drawHist(false);

    const histText = this.add.text(histX, histY, '💔  HISTORIA: El Precio de una Vida', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcccc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const histZone = this.add.zone(histX, histY, histW, histH)
      .setInteractive({ useHandCursor: true });

    histZone.on('pointerover', () => { drawHist(true); histText.setScale(1.04); });
    histZone.on('pointerout',  () => { drawHist(false); histText.setScale(1); });
    histZone.on('pointerdown', () => this._goToStory());

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

  _goToStory() {
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('StoryScene');
    });
  }

  update() {}
}

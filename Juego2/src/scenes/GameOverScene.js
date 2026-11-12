// src/scenes/GameOverScene.js
//
// Handles:
//  1. Defeat: Busted by Temu or rocks/bombs (Retry level).
//  2. Level Clear: Beat Level 1 or 2 (Advance to next level).
//  3. Grand Finale: Beat Level 3 -> El Sufrimiento del Sr. Temu & La Salvación de Sofía.
//

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this._elapsedMs      = data?.time ?? 0;
    this._totalTime      = data?.totalTime ?? this._elapsedMs;
    this._busted         = Boolean(data?.busted);
    this._progress       = data?.progress ?? 0;
    this._level          = data?.level ?? 1;
    this._nextLevel      = data?.nextLevel ?? 2;
    this._levelCompleted = Boolean(data?.levelCompleted);
    this._finalVictory   = Boolean(data?.finalVictory);
  }

  preload() {}

  create() {
    const { width, height } = this.scale;

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    if (this._busted) {
      bg.fillGradientStyle(0x1a0505, 0x1a0505, 0x3d0c0c, 0x3d0c0c, 1);
    } else if (this._finalVictory) {
      bg.fillGradientStyle(0x0a1f0a, 0x0a1f0a, 0x050f1a, 0x050f1a, 1);
    } else {
      bg.fillGradientStyle(0x0d1f14, 0x0d1f14, 0x142838, 0x142838, 1);
    }
    bg.fillRect(0, 0, width, height);

    // Decorative top strip
    const cw = 40;
    for (let i = 0; i < Math.ceil(width / cw); i++) {
      let color = 0xffffff;
      if (this._busted) color = i % 2 === 0 ? 0xff2200 : 0x0066ff;
      else if (this._finalVictory) color = i % 2 === 0 ? 0xffdd00 : 0x00ff88;
      else color = i % 2 === 0 ? 0x00ccff : 0x00ff88;

      this.add.graphics().fillStyle(color, 1).fillRect(i * cw, 0, cw, 22);
    }

    if (this._busted) {
      this._createBustedView(width, height);
    } else if (this._finalVictory) {
      this._createFinalVictoryView(width, height);
    } else {
      this._createLevelCompletedView(width, height);
    }

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // ─── 1. Busted / Defeat View ─────────────────────────────────────────────────

  _createBustedView(width, height) {
    const sirenText = this.add.text(width / 2, height * 0.16, '🚨', {
      fontSize: '76px',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: sirenText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.add.text(width / 2, height * 0.28, '💔 NO LLEGASTE A TIEMPO...', {
      fontSize: '52px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff3333',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.39, `El convoy de Temu interceptó tu vehículo en el Nivel ${this._level}.`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcccc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, 'El suero vital de Sofía fue confiscado. El monitor cardíaco se apagó...', {
      fontSize: '17px',
      fontFamily: 'Georgia, serif',
      color: '#ff9999',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.58, '🌧️ ¡No te rindas! Tu hija todavía cuenta contigo. Vuelve a intentarlo.', {
      fontSize: '17px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffaa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Buttons
    this._addButton(width / 2 - 150, height * 0.82, `🔄 REINTENTAR NIVEL ${this._level}`, 0x991100, 0xcc2200, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: this._level, totalTime: this._totalTime });
      });
    });

    this._addButton(width / 2 + 150, height * 0.82, '🏠 MENÚ', 0x224466, 0x4488cc, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  // ─── 2. Intermediate Level Completed View ────────────────────────────────────

  _createLevelCompletedView(width, height) {
    this.add.text(width / 2, height * 0.16, '🏁', { fontSize: '72px' }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.28, `¡NIVEL ${this._level} SUPERADO!`, {
      fontSize: '56px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#00ffcc',
      stroke: '#003322',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.39, '¡Dejaste atrás el cerco policial de Temu en este sector!', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Time
    const total = Math.floor(this._elapsedMs);
    const ms    = total % 1000;
    const sec   = Math.floor(total / 1000) % 60;
    const min   = Math.floor(total / 60000);
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(Math.floor(ms / 10)).padStart(2, '0')}`;

    this.add.text(width / 2, height * 0.48, `Tiempo en este tramo: ${timeStr}`, {
      fontSize: '22px',
      fontFamily: '"Courier New", monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const nextNames = ['', '', '2: Desfiladero Rocoso con Bombas', '3: Asedio Final al Hospital'];
    this.add.text(width / 2, height * 0.58, `⚠️ Prepárate: Próximo tramo: ${nextNames[this._nextLevel]}`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcc66',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Next Level Button
    this._addButton(width / 2 - 160, height * 0.82, `▶️ IR AL NIVEL ${this._nextLevel}`, 0x008844, 0x00bb66, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: this._nextLevel, totalTime: this._totalTime });
      });
    });

    this._addButton(width / 2 + 160, height * 0.82, '🏠 MENÚ', 0x224466, 0x4488cc, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  // ─── 3. GRAND FINALE: EL SUFRIMIENTO DEL SR. TEMU ───────────────────────────

  _createFinalVictoryView(width, height) {
    // Confetti / celebratory particles
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * width;
      const y = Math.random() * (height * 0.6);
      const conf = this.add.text(x, y, ['🎉', '✨', '⭐', '🎊', '💚'][Math.floor(Math.random() * 5)], {
        fontSize: `${Phaser.Math.Between(16, 26)}px`,
      }).setAlpha(0.85);

      this.tweens.add({
        targets: conf,
        y: y + Phaser.Math.Between(40, 100),
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Main Victory Banner
    this.add.text(width / 2, 42, '🏆 ¡VICTORIA TOTAL: SALVASTE A SOFÍA! 🏆', {
      fontSize: '40px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ffd700',
      stroke: '#995500',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // ── CAJA 1: EL SUFRIMIENTO DEL SR. TEMU (HUMILLACIÓN & BANCARROTA) ────────
    const temuBoxY = 85;
    const temuBoxW = width - 80;
    const temuBoxH = 260;

    const temuBg = this.add.graphics();
    temuBg.fillStyle(0x220505, 0.9);
    temuBg.fillRoundedRect(40, temuBoxY, temuBoxW, temuBoxH, 12);
    temuBg.lineStyle(3, 0xff3300, 1);
    temuBg.strokeRoundedRect(40, temuBoxY, temuBoxW, temuBoxH, 12);

    this.add.text(60, temuBoxY + 16, '😭  EL PATÉTICO SUFRIMIENTO DEL SR. TEMU  📉', {
      fontSize: '20px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff4422',
      stroke: '#000000',
      strokeThickness: 3,
    });

    const temuCryingText =
      'SR. TEMU (ARRODILLADO EN EL PISO, LLORANDO DE RABIA):\n' +
      '"¡¡¡NOOOOOOOOOOOOO!!! ¡MIS ACCIONES EN WALL STREET CAYERON UN 99.8%! ¡MIS CUPONES DE DESCUENTO SE ESTÁN QUEMANDO!\n\n' +
      '¡Un padre solitario en un auto chatarra destruyó toda mi flota de patrullas y me humilló en televisión mundial! ' +
      '¡Mis inversionistas me abandonaron! ¡Estoy en la bancarrota absoluta! ¡Voy a tener que trabajar de repartidor en mi propia empresa! ' +
      '¡MALDITO SEAS, PAPÁ DEL AÑO! ¡¡¡BUAAAAAAA!!!" 💸🔥😭';

    this.add.text(60, temuBoxY + 48, temuCryingText, {
      fontSize: '15px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffddbb',
      lineSpacing: 6,
      wordWrap: { width: temuBoxW - 40 },
    });

    // ── CAJA 2: EL MILAGRO EN EL HOSPITAL (HABITACIÓN 4) ──────────────────────
    const hospBoxY = 360;
    const hospBoxW = width - 80;
    const hospBoxH = 240;

    const hospBg = this.add.graphics();
    hospBg.fillStyle(0x051d10, 0.9);
    hospBg.fillRoundedRect(40, hospBoxY, hospBoxW, hospBoxH, 12);
    hospBg.lineStyle(3, 0x00ff88, 1);
    hospBg.strokeRoundedRect(40, hospBoxY, hospBoxW, hospBoxH, 12);

    this.add.text(60, hospBoxY + 16, '🏥  05:42 AM — HOSPITAL CENTRAL: LA VIDA TRIUNFÓ  💚', {
      fontSize: '20px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#00ff88',
      stroke: '#003311',
      strokeThickness: 3,
    });

    const hospText =
      'Entraste corriendo al hospital con el suero en la mano. Los médicos lo inyectaron en el respirador de Sofía. ' +
      'Segundos después, el monitor cardíaco pitó con fuerza y un ritmo verde perfecto: 72 BPM.\n\n' +
      'Sofía abrió sus ojitos, la fiebre había desaparecido. Te tomó la mano con su pequeña palma y te dijo con una tierna sonrisa:\n' +
      '— "Papá... sentí el rugido de tu motor en mis sueños. Sabía que jamás me ibas a dejar sola."\n\n' +
      'Cumpliste tu promesa a su madre. El amor de un padre fue más rápido que cualquier corporación.';

    this.add.text(60, hospBoxY + 48, hospText, {
      fontSize: '15px',
      fontFamily: 'Georgia, serif',
      color: '#ddffea',
      lineSpacing: 6,
      wordWrap: { width: hospBoxW - 40 },
    });

    // Total Time
    const total = Math.floor(this._totalTime);
    const ms    = total % 1000;
    const sec   = Math.floor(total / 1000) % 60;
    const min   = Math.floor(total / 60000);
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(Math.floor(ms / 10)).padStart(2, '0')}`;

    this.add.text(width / 2, height * 0.81, `⏱ Tiempo Total de Campaña: ${timeStr}  |  ⭐⭐⭐ ¡HÉROE LEGENDARIO!`, {
      fontSize: '20px',
      fontFamily: '"Courier New", monospace',
      color: '#ffff00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Buttons
    this._addButton(width / 2 - 160, height * 0.90, '🔄 JUGAR DE NUEVO', 0x008844, 0x00bb66, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: 1, totalTime: 0 });
      });
    });

    this._addButton(width / 2 + 160, height * 0.90, '🏠 MENÚ PRINCIPAL', 0x224466, 0x4488cc, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  // ─── Button Helper ───────────────────────────────────────────────────────────

  _addButton(x, y, label, colorNormal, colorHover, callback) {
    const btnW = 270, btnH = 50, btnR = 10;

    const bg = this.add.graphics();
    const txt = this.add.text(x, y, label, {
      fontSize: '18px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ffffff',
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

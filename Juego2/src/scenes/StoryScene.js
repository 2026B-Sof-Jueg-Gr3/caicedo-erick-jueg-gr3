// src/scenes/StoryScene.js
//
// Escena de historia dramática y desgarradora:
// Una carrera desesperada por la vida de una hija enferma.
// Incluye lluvia cinematográfica, latidos de corazón (heartbeat audio),
// efecto typewriter y dilema moral desgarrador.
//

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StoryScene' });
  }

  init() {
    this._slideIndex  = 0;
    this._typing      = false;
    this._typeTimer   = null;
    this._heartCtx    = null;
    this._heartTimer  = null;
  }

  preload() {}

  create() {
    const { width, height } = this.scale;

    // ── Fondo de tormenta nocturna ─────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x02040a, 0x02040a, 0x0a1420, 0x0a1420, 1);
    bg.fillRect(0, 0, width, height);

    // Relámpago ambiental ocasional
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        if (Math.random() < 0.6) {
          this.cameras.main.flash(180, 140, 180, 220);
        }
      },
    });

    // ── Gotas de lluvia cinematográfica ────────────────────────────────────────
    this._rainGfx = this.add.graphics().setDepth(25);
    this._rainDrops = [];
    for (let i = 0; i < 110; i++) {
      this._rainDrops.push({
        x: Math.random() * (width + 100),
        y: Math.random() * height,
        speed: 14 + Math.random() * 9,
        len: 16 + Math.random() * 12,
      });
    }

    // ── Auto del jugador (humilde, desgastado) ──────────────────────────────────
    this._playerCar = this.add.image(170, height * 0.60, 'car')
      .setScale(1.9)
      .setAngle(-90)
      .setDepth(5);

    // ── Auto Temu (la implacable corporación) ─────────────────────────────────
    this._temuCar = this.add.image(width + 120, height * 0.60, 'temuCar')
      .setScale(1.6)
      .setAngle(-90)
      .setDepth(5);

    // Sirena policial agresiva de Temu
    this._sirenGfx = this.add.graphics().setDepth(6);
    let sirenTgl = false;
    this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        sirenTgl = !sirenTgl;
        this._sirenGfx.clear();
        this._sirenGfx.fillStyle(sirenTgl ? 0x0077ff : 0xff1100, 0.45);
        this._sirenGfx.fillCircle(this._temuCar.x, this._temuCar.y, 35);
      },
    });

    // ── Título dramático ──────────────────────────────────────────────────────
    this.add.text(width / 2, 24, '🌧️  EL PRECIO DE UNA VIDA  💔', {
      fontSize: '22px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(11).setOrigin(0.5, 0);

    this.add.text(width / 2, 54, 'La última esperanza de un padre en la oscuridad', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#8899aa',
      fontStyle: 'italic',
    }).setDepth(11).setOrigin(0.5, 0);

    // ── Panel de diálogo ─────────────────────────────────────────────────────
    const panelY = height * 0.70;
    const panelH = height * 0.24;

    const panelBg = this.add.graphics().setDepth(10);
    panelBg.fillStyle(0x030710, 0.88);
    panelBg.fillRoundedRect(28, panelY, width - 56, panelH, 14);
    panelBg.lineStyle(2, 0x446688, 0.8);
    panelBg.strokeRoundedRect(28, panelY, width - 56, panelH, 14);

    // Nombre del personaje
    this._speakerText = this.add.text(54, panelY + 12, '', {
      fontSize: '18px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff6644',
    }).setDepth(11);

    // Texto del diálogo
    this._dialogText = this.add.text(54, panelY + 38, '', {
      fontSize: '17px',
      fontFamily: 'Georgia, Arial, sans-serif',
      color: '#e6edf5',
      wordWrap: { width: width - 110 },
      lineSpacing: 5,
    }).setDepth(11);

    // Indicador de avance
    this._continueHint = this.add.text(width - 50, panelY + panelH - 22, '▼ presiona ESPACIO o clic', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#778899',
    }).setDepth(11).setOrigin(1, 0).setAlpha(0);

    this.tweens.add({
      targets: this._continueHint,
      alpha: 0.8,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    // ── Guion de la historia (Dolor, Realismo y Tensión Emocional) ───────────────
    this._slides = [
      {
        speaker: 'HOSPITAL CENTRAL — SALA DE TERAPIA INTENSIVA (02:14 AM)',
        text: 'El monitor cardíaco apenas dibuja una línea débil. Tu pequeña Sofía, de tan solo 6 años, arde en fiebre consumida por una rara infección pulmonar. Sus labios están morados y apenas puede respirar.',
        action: null,
      },
      {
        speaker: 'MÉDICO DE GUARDIA (con frialdad burocrática)',
        text: '"El suero pediátrico bio-sintético cuesta $45,000 dólares. El seguro rechazó la cobertura por considerarla no prioritaria. Si no entrega el dinero antes del amanecer... tendremos que desconectarla para ceder la cama."',
        action: null,
      },
      {
        speaker: 'TÚ (llorando solo en la lluvia)',
        text: '"Hace seis meses el cáncer me arrebató a mi esposa... en su último suspiro le prometí que cuidaría a nuestra niña. Vendí la casa, los muebles, mi anillo de bodas... Ya no me queda nada en este mundo, Dios mío. ¡¿Por qué a ella también?!"',
        action: null,
      },
      {
        speaker: 'NARRADOR',
        text: 'Desesperado en el callejón logístico, viste el camión blindado del magnate Sr. Temu. En la bodega abierta brillaba una caja de titanio sellada: el lote exclusivo de la medicina de Sofía, confiscado para ser subastado a un jeque en el extranjero.',
        action: 'showMedicine',
      },
      {
        speaker: 'TÚ (las manos temblando en el volante)',
        text: '"No soy un criminal... jamás he lastimado a nadie. Pero miré la foto de mi niña en el tablero y supe que un padre arrodillado jamás salva vidas. Tomé la caja y encendí este viejo motor."',
        action: 'revealTemu',
      },
      {
        speaker: 'SR. TEMU (por la radio intervenida de tu auto, voz gélida)',
        text: '🔊 "¿Crees que la miseria de tu hija te da derecho a tocar mi inventario? Para ti es la vida de tu niña. Para nosotros es un número en el balance financiero. ¡Patrulla, hagan pedazos ese auto! Que no quede nada."',
        action: 'temuRage',
      },
      {
        speaker: 'TÚ (apretando el volante con rabia y lágrimas de impotencia)',
        text: '"¡Escúchame bien, Temu! Podrás tener todo el dinero de este podrido mundo, pero esta noche tendrás que matarme en el asfalto para quitarme esta medicina. ¡HIJA, PAPÁ VA EN CAMINO!"',
        action: null,
      },
      {
        speaker: 'NARRADOR',
        text: 'La patrulla de Temu ruge tras tus espaldas con sus luces de muerte. La lluvia borra el camino y el reloj de Sofía corre hacia el cero absoluto. ¿Acelerarás hasta el límite por su vida?',
        action: 'choice',
      },
    ];

    // Iniciar latido de corazón
    this._startHeartbeat();

    // Mostrar primer slide
    this._showSlide(0);

    // Controles para avanzar
    this.input.on('pointerdown', () => this._advance());
    this.input.keyboard.on('keydown-SPACE', () => this._advance());
    this.input.keyboard.on('keydown-ENTER', () => this._advance());
  }

  update(time, delta) {
    // Animación de lluvia cinematográfica
    if (this._rainGfx && this._rainDrops) {
      this._rainGfx.clear();
      this._rainGfx.lineStyle(1.4, 0x7799bb, 0.45);
      const h = this.scale.height;
      const w = this.scale.width;
      for (const d of this._rainDrops) {
        this._rainGfx.lineBetween(d.x, d.y, d.x - 3.5, d.y + d.len);
        d.y += d.speed;
        d.x -= 2;
        if (d.y > h) {
          d.y = -15;
          d.x = Math.random() * (w + 120);
        }
      }
    }
  }

  // ─── Latido de corazón procedimental (Audio Emocional) ───────────────────────

  _startHeartbeat() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this._heartCtx = new AudioCtx();
      const ctx = this._heartCtx;

      this._heartTimer = this.time.addEvent({
        delay: 1100,
        loop: true,
        callback: () => {
          if (!this._heartCtx || this._heartCtx.state === 'closed') return;
          const playPulse = (delay, freq, volume) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.17);
          };
          // Doble pulso cardíaco: Lub-Dub... Lub-Dub...
          playPulse(0, 58, 0.22);
          playPulse(0.18, 48, 0.16);
        },
      });
    } catch (e) {
      console.warn('Audio heartbeat no disponible:', e);
    }
  }

  _stopHeartbeat() {
    if (this._heartTimer) this._heartTimer.remove();
    if (this._heartCtx) {
      try {
        this._heartCtx.close();
      } catch (e) {}
      this._heartCtx = null;
    }
  }

  // ─── Control de diapositivas ─────────────────────────────────────────────────

  _showSlide(index) {
    if (index >= this._slides.length) return;
    this._slideIndex = index;
    const slide = this._slides[index];

    this._speakerText.setText(slide.speaker);
    this._dialogText.setText('');
    this._continueHint.setAlpha(0);

    this._runAction(slide.action);

    // Efecto máquina de escribir
    this._typing = true;
    this._typewriterText(this._dialogText, slide.text, 26, () => {
      this._typing = false;
      if (slide.action !== 'choice') {
        this._continueHint.setAlpha(1);
      }
    });
  }

  _typewriterText(textObj, fullText, msPerChar, onComplete) {
    let i = 0;
    if (this._typeTimer) this._typeTimer.remove();
    this._typeTimer = this.time.addEvent({
      delay: msPerChar,
      repeat: fullText.length - 1,
      callback: () => {
        i++;
        textObj.setText(fullText.substring(0, i));
        if (i >= fullText.length && onComplete) onComplete();
      },
    });
  }

  _advance() {
    if (this._typing) {
      if (this._typeTimer) this._typeTimer.remove();
      this._dialogText.setText(this._slides[this._slideIndex].text);
      this._typing = false;
      if (this._slides[this._slideIndex].action !== 'choice') {
        this._continueHint.setAlpha(1);
      }
      return;
    }

    const next = this._slideIndex + 1;
    if (next < this._slides.length) {
      this._showSlide(next);
    }
  }

  // ─── Acciones especiales ─────────────────────────────────────────────────────

  _runAction(action) {
    const { width, height } = this.scale;

    if (action === 'showMedicine') {
      if (!this._medBox) {
        this._medBox = this.add.container(230, height * 0.50).setDepth(8);

        const vialGfx = this.add.graphics();
        vialGfx.fillStyle(0x00ffcc, 0.85);
        vialGfx.fillRoundedRect(-14, -14, 28, 28, 6);
        vialGfx.lineStyle(2, 0xffffff, 1);
        vialGfx.strokeRoundedRect(-14, -14, 28, 28, 6);

        const icon = this.add.text(0, 0, '💉', { fontSize: '26px' }).setOrigin(0.5);
        const tag = this.add.text(0, 24, 'SUERO VITAL SOFÍA', {
          fontSize: '11px',
          fontFamily: 'Arial, sans-serif',
          color: '#aaffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5);

        this._medBox.add([vialGfx, icon, tag]);

        this.tweens.add({
          targets: this._medBox,
          y: '-=10',
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    if (action === 'revealTemu') {
      this.tweens.add({
        targets: this._temuCar,
        x: width - 180,
        duration: 1300,
        ease: 'Cubic.easeOut',
      });
      this.tweens.add({
        targets: this._playerCar,
        x: 210,
        duration: 800,
        ease: 'Sine.easeOut',
      });
    }

    if (action === 'temuRage') {
      // Temu ruge con vibración violenta
      this.cameras.main.shake(200, 0.008);
      this.tweens.add({
        targets: this._temuCar,
        x: '+=10',
        duration: 50,
        yoyo: true,
        repeat: 9,
      });
    }

    if (action === 'choice') {
      this.input.off('pointerdown');
      this.input.keyboard.off('keydown-SPACE');
      this.input.keyboard.off('keydown-ENTER');

      if (this._typeTimer) this._typeTimer.remove();
      this._typing = false;
      this._continueHint.setAlpha(0);

      this.time.delayedCall(300, () => this._showChoiceButtons());
    }
  }

  // ─── Botones de Decisión ──────────────────────────────────────────────────────

  _showChoiceButtons() {
    const { width, height } = this.scale;
    const btnY = height * 0.90;

    // Opción Heroica / Desesperada: ¡Acelerar por Sofía!
    this._addChoiceBtn(
      width / 2 - 165, btnY,
      '❤️  ¡ACELERAR HASTA EL FIN POR SOFÍA!',
      0xcc1100, 0xff2200,
      () => {
        this._stopHeartbeat();
        this.cameras.main.flash(400, 255, 60, 0);
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene');
        });
      }
    );

    // Opción Trágica: Rendirse
    this._addChoiceBtn(
      width / 2 + 165, btnY,
      '🌧️  Rendirse... (Verla morir)',
      0x223344, 0x3d4f66,
      () => {
        this._stopHeartbeat();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MenuScene');
        });
      }
    );
  }

  _addChoiceBtn(x, y, label, colorNormal, colorHover, callback) {
    const btnW = 310, btnH = 54, btnR = 10;

    const bg = this.add.graphics().setDepth(12);
    const txt = this.add.text(x, y, label, {
      fontSize: '17px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setDepth(13);

    const draw = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? colorHover : colorNormal, 1);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnR);
      bg.lineStyle(2, hover ? 0xffffff : 0xff7755, 0.9);
      bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnR);
    };
    draw(false);

    const zone = this.add.zone(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setDepth(14);

    zone.on('pointerover',  () => { draw(true);  txt.setScale(1.04); });
    zone.on('pointerout',   () => { draw(false); txt.setScale(1); });
    zone.on('pointerdown',  callback);

    txt.setScale(0).setAlpha(0);
    this.tweens.add({
      targets: [txt],
      scale: 1,
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
    });
  }
}

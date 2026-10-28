// src/scenes/BootScene.js
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  init() {}

  preload() {}

  create() {
    // Draw a simple dark background with a loading hint
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0d1b2a');

    const text = this.add.text(width / 2, height / 2, 'Cargando...', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      alpha: 0,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 400,
      onComplete: () => {
        this.time.delayedCall(300, () => {
          this.scene.start('PreloaderScene');
        });
      },
    });
  }

  update() {}
}

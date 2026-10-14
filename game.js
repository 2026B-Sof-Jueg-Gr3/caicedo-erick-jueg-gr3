const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
let player;
let cursors;
let wasd;
let infoText;

function preload() {
  // Intenta cargar la imagen local por si existe
  this.load.image("block", "block.png");
}

function create() {
  // Asegurar que el navegador mantenga el foco en el juego
  window.focus();
  this.input.on("pointerdown", () => window.focus());

  // Cuadrícula de fondo visual
  this.add.grid(400, 300, 800, 600, 40, 40, 0x1e1e24, 1, 0x2e2e38, 1);

  // Respaldo de seguridad: si block.png no carga, dibuja el cuadro verde por código al instante
  if (!this.textures.exists("block")) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x00d26a, 1);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.generateTexture("block", 50, 50);
    g.destroy();
  }

  player = this.physics.add.image(400, 300, "block");
  player.setCollideWorldBounds(true);
  this.cameras.main.setBounds(0, 0, 800, 600);

  // Configuración de controles (Flechas y WASD)
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });

  // Nuevo texto personalizado en pantalla
  infoText = this.add.text(16, 16, " Laboratorio de Phaser - Erick Caicedo", {
    fontFamily: "sans-serif",
    fontSize: "16px",
    fill: "#ffffff",
    backgroundColor: "#000000aa",
    padding: { x: 10, y: 6 },
  });
}

function update() {
  if (!player || !player.body || !cursors) {
    return;
  }

  player.setVelocity(0);

  const speed = 300;

  // Lógica de movimiento horizontal
  if (cursors.left.isDown || wasd.left.isDown) {
    player.setVelocityX(-speed);
  } else if (cursors.right.isDown || wasd.right.isDown) {
    player.setVelocityX(speed);
  }

  // Lógica de movimiento vertical
  if (cursors.up.isDown || wasd.up.isDown) {
    player.setVelocityY(-speed);
  } else if (cursors.down.isDown || wasd.down.isDown) {
    player.setVelocityY(speed);
  }

  // Actualizar texto en pantalla con el nuevo título y las coordenadas en tiempo real
  infoText.setText(
    `🎮 Lab Phaser | Posición: (${Math.round(player.x)}, ${Math.round(player.y)}) | Velocidad: (${Math.round(player.body.velocity.x)}, ${Math.round(player.body.velocity.y)})`
  );
}
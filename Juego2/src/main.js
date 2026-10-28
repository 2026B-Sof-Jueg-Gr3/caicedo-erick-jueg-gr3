// src/main.js — Entry point
import Phaser from 'phaser';
import BootScene      from './scenes/BootScene.js';
import PreloaderScene from './scenes/PreloaderScene.js';
import MenuScene      from './scenes/MenuScene.js';
import GameScene      from './scenes/GameScene.js';
import GameOverScene  from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#1a472a',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, PreloaderScene, MenuScene, GameScene, GameOverScene],
};

new Phaser.Game(config);

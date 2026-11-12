// src/scenes/GameScene.js
//
// Main gameplay scene: "Need for Speed Temu´s Edition"
//  • Multi-Level Campaign (Level 1: City Escape, Level 2: Rocky Canyon, Level 3: Hospital Siege)
//  • Obstacles: Rocks / boulders that damage integrity and spin cars
//  • Comodines / Pickups: Turbo Boost (⚡), Repair Kit (🔧), Oil Trap (🐌)
//  • Don Temu Boss Mechanics: Bomb drops (💣) & Super Turbo Ramming Charge (🚀)
//  • Final Victory: Total defeat and suffering of Sr. Temu
//

import Phaser from 'phaser';

const WORLD_W = 1600;
const WORLD_H = 4600;
const ROAD_W  = 220;
const BASE_SPEED_ROAD  = 320;
const BASE_SPEED_GRASS = 160;

const CX = 800;
const SEGMENTS = [
  { cx: CX,       y1:    0, y2:  900 },
  { cx: CX - 350, y1:  820, y2: 1600 },
  { cx: CX,       y1: 1520, y2: 2300 },
  { cx: CX + 350, y1: 2220, y2: 3000 },
  { cx: CX,       y1: 2920, y2: 3700 },
  { cx: CX - 300, y1: 3620, y2: 4600 },
];

const CONNECTIONS = [
  { fromCX: SEGMENTS[0].cx, toCX: SEGMENTS[1].cx, y: 860 },
  { fromCX: SEGMENTS[1].cx, toCX: SEGMENTS[2].cx, y: 1560 },
  { fromCX: SEGMENTS[2].cx, toCX: SEGMENTS[3].cx, y: 2260 },
  { fromCX: SEGMENTS[3].cx, toCX: SEGMENTS[4].cx, y: 2960 },
  { fromCX: SEGMENTS[4].cx, toCX: SEGMENTS[5].cx, y: 3660 },
];

const TRACK_WAYPOINTS = [
  { x: 800,  y: 100 },
  { x: 800,  y: 860 },
  { x: 450,  y: 860 },
  { x: 450,  y: 1560 },
  { x: 800,  y: 1560 },
  { x: 800,  y: 2260 },
  { x: 1150, y: 2260 },
  { x: 1150, y: 2960 },
  { x: 800,  y: 2960 },
  { x: 800,  y: 3660 },
  { x: 500,  y: 3660 },
  { x: 500,  y: 4520 },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this._level           = data?.level ?? 1;
    this._totalTime       = data?.totalTime ?? 0;
    this._started         = false;
    this._finished        = false;
    this._elapsedMs       = 0;
    this._controlsActive  = false;
    this._integrity       = 100;
    this._isInvulnerable  = false;
    this._temuWaypointIdx = 0;
    this._sirenTimer      = 0;
    this._sirenToggle     = false;
    this._temuStunned     = false;

    // Power-ups and comodines
    this._speedMultiplier = 1.0;
    this._turboTimer      = 0;
    this._slowTimer       = 0;

    // Temu special attacks
    this._temuBombTimer      = 0;
    this._temuChargeTimer    = 0;
    this._temuCharging       = false;
    this._temuChargeDuration = 0;

    // Physics & rotation
    this._playerVx    = 0;
    this._playerVy    = 0;
    this._playerAngle = 90;
    this._temuVx      = 0;
    this._temuVy      = 0;
    this._temuAngle   = 90;

    this._touchDir = { up: false, down: false, left: false, right: false };
  }

  preload() {}

  create() {
    // ── World map ─────────────────────────────────────────────────────────────
    this.add.image(0, 0, 'worldMap').setOrigin(0, 0);

    // Weather effects depending on level
    if (this._level >= 2) {
      this._createRainEffect();
    }

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── Player car ────────────────────────────────────────────────────────────
    const startX = SEGMENTS[0].cx;
    const startY = 220;

    this.player = this.physics.add.image(startX, startY, 'car')
      .setCollideWorldBounds(true)
      .setDepth(10);
    this.player.body.setSize(34, 64);
    this._playerAngle = 90;
    this.player.setAngle(this._playerAngle);

    // ── Temu Patrol Car ───────────────────────────────────────────────────────
    this.temuCar = this.physics.add.image(startX, 70, 'temuCar')
      .setCollideWorldBounds(true)
      .setDepth(10);
    this.temuCar.body.setSize(36, 68);
    this._temuAngle = 90;
    this.temuCar.setAngle(this._temuAngle);

    this._sirenLight = this.add.graphics().setDepth(11);

    // Collisions: Player vs Temu
    this.physics.add.collider(this.player, this.temuCar, this._onCarCollision, null, this);

    // ── Obstacles: Rocks / Boulders ───────────────────────────────────────────
    this.rocks = this.physics.add.staticGroup();
    this._spawnRocks();
    this.physics.add.collider(this.player, this.rocks, this._onHitRock, null, this);
    this.physics.add.collider(this.temuCar, this.rocks, this._onTemuHitRock, null, this);

    // ── Comodines / Pickups ───────────────────────────────────────────────────
    this.pickups = this.physics.add.group();
    this._spawnPickups();
    this.physics.add.overlap(this.player, this.pickups, this._onGetPickup, null, this);

    // ── Bombs dropped by Temu ─────────────────────────────────────────────────
    this.bombs = this.physics.add.group();
    this.physics.add.overlap(this.player, this.bombs, this._onHitBomb, null, this);

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── Inputs ────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // ── Goal zone ─────────────────────────────────────────────────────────────
    const lastSeg = SEGMENTS[SEGMENTS.length - 1];
    this._goalZone = this.add.zone(lastSeg.cx, 4470, ROAD_W - 20, 60).setOrigin(0.5, 0.5);
    this.physics.world.enable(this._goalZone);
    this._goalZone.body.setAllowGravity(false);
    this._goalZone.body.immovable = true;

    this.physics.add.overlap(this.player, this._goalZone, this._onGoal, null, this);

    // ── HUD ───────────────────────────────────────────────────────────────────
    this._createHUD();
    this._showCountdown();
  }

  update(time, delta) {
    if (this._finished) return;

    if (this._started) {
      this._elapsedMs += delta;
      this._updateTimerText();
      this._updatePowerupTimers(delta);
      this._updateTemuAI(delta);
      this._updateTemuBossMechanics(delta);
      this._updateSiren(delta);
      this._updateHUDIndicators();
      this._updateSirenVolume();
    }

    if (this._rainDrops && this._rainGfx) {
      this._updateRain();
    }

    if (!this._controlsActive) return;

    // ── Gather inputs ─────────────────────────────────────────────────────────
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown    || this._touchDir.up;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown  || this._touchDir.down;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown  || this._touchDir.left;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this._touchDir.right;

    let inputX = 0, inputY = 0;
    if (up)    inputY -= 1;
    if (down)  inputY += 1;
    if (left)  inputX -= 1;
    if (right) inputX += 1;

    const moving = inputX !== 0 || inputY !== 0;

    // Drunk sway oscillation ("borracho")
    const drunkFreq = this._elapsedMs * 0.007;
    const drunkSwayAngle = moving ? Math.sin(drunkFreq) * 14 + Math.cos(drunkFreq * 1.6) * 7 : 0;
    const drunkLateralPush = moving ? Math.cos(drunkFreq) * 32 : 0;

    const baseSpeed = this._isOnRoad(this.player.x, this.player.y)
      ? BASE_SPEED_ROAD
      : BASE_SPEED_GRASS;

    const currentMaxSpeed = baseSpeed * this._speedMultiplier;

    if (moving) {
      const len = Math.hypot(inputX, inputY);
      const nx = inputX / len;
      const ny = inputY / len;

      const perpX = -ny;
      const perpY = nx;

      const targetVx = nx * currentMaxSpeed + perpX * drunkLateralPush;
      const targetVy = ny * currentMaxSpeed + perpY * drunkLateralPush;

      const traction = 0.12;
      this._playerVx = Phaser.Math.Linear(this._playerVx, targetVx, traction);
      this._playerVy = Phaser.Math.Linear(this._playerVy, targetVy, traction);

      const inputAngle = Phaser.Math.RadToDeg(Math.atan2(ny, nx)) + 90;

      const currentMoveAngle = Phaser.Math.RadToDeg(Math.atan2(this._playerVy, this._playerVx)) + 90;
      let turnDiff = Phaser.Math.Angle.WrapDegrees(inputAngle - currentMoveAngle);
      const driftOversteer = Phaser.Math.Clamp(turnDiff * 1.5, -35, 35);

      const desiredAngle = inputAngle + driftOversteer + drunkSwayAngle;

      let diff = Phaser.Math.Angle.WrapDegrees(desiredAngle - this._playerAngle);
      const turnSpeed = 950;
      const step = Math.min(Math.abs(diff), (turnSpeed * delta) / 1000);
      this._playerAngle += Math.sign(diff) * step;

    } else {
      this._playerVx = Phaser.Math.Linear(this._playerVx, 0, 0.07);
      this._playerVy = Phaser.Math.Linear(this._playerVy, 0, 0.07);
      if (Math.hypot(this._playerVx, this._playerVy) < 8) {
        this._playerVx = 0;
        this._playerVy = 0;
      }
    }

    this.player.setVelocity(this._playerVx, this._playerVy);
    this.player.setAngle(this._playerAngle);

    // Drift smoke particles
    const speed = Math.hypot(this._playerVx, this._playerVy);
    if (speed > 85) {
      const moveHeading = Phaser.Math.RadToDeg(Math.atan2(this._playerVy, this._playerVx)) + 90;
      const slipAngle = Math.abs(Phaser.Math.Angle.WrapDegrees(this._playerAngle - moveHeading));
      if (slipAngle > 16) {
        this._spawnDriftSmoke(this.player, this._playerAngle);
      }
    }

    // Nitro flame particles when turbo active
    if (this._turboTimer > 0 && Math.random() < 0.6) {
      this._spawnNitroFlames();
    }
  }

  // ─── Obstacles Spawning (Piedras) ─────────────────────────────────────────────

  _spawnRocks() {
    // Number of rocks depends on level
    const count = this._level === 1 ? 8 : (this._level === 2 ? 18 : 26);

    let seed = 42 + this._level * 99;
    const rand = () => {
      seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
      return Math.abs(seed) / 2147483647;
    };

    for (let i = 0; i < count; i++) {
      const seg = SEGMENTS[Math.floor(rand() * SEGMENTS.length)];
      const rx = seg.cx + (rand() - 0.5) * (ROAD_W - 65);
      const ry = seg.y1 + 140 + rand() * (seg.y2 - seg.y1 - 240);

      const rock = this.rocks.create(rx, ry, 'rock');
      rock.setDepth(9);
      rock.body.setSize(26, 26);
      rock.setScale(Phaser.Math.FloatBetween(0.85, 1.25));
    }
  }

  _onHitRock(player, rock) {
    if (this._isInvulnerable || this._finished) return;
    this._isInvulnerable = true;
    this._integrity = Math.max(0, this._integrity - 15);

    this.cameras.main.shake(220, 0.016);
    this._spawnSparks(rock.x, rock.y);

    // Sharp spin & speed loss
    this._playerVx *= 0.15;
    this._playerVy *= 0.15;
    this.player.setVelocity(this._playerVx, this._playerVy);

    this._showNoticeBanner('💥 ¡CHOCASTE CON UNA ROCA! -15%', '#ff7700');

    this.tweens.add({
      targets: rock,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 250,
      onComplete: () => rock.destroy(),
    });

    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.player.setAlpha(1);
        this._isInvulnerable = false;
      },
    });

    if (this._integrity <= 0) {
      this._onBusted();
    }
  }

  _onTemuHitRock(temu, rock) {
    this._temuStunned = true;
    this._spawnSparks(rock.x, rock.y);
    rock.destroy();
    this.time.delayedCall(550, () => {
      this._temuStunned = false;
    });
  }

  // ─── Comodines / Pickups Spawning ─────────────────────────────────────────────

  _spawnPickups() {
    const types = ['turbo', 'slow', 'repair'];
    const count = this._level === 1 ? 8 : (this._level === 2 ? 11 : 14);

    let seed = 123 + this._level * 55;
    const rand = () => {
      seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
      return Math.abs(seed) / 2147483647;
    };

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(rand() * types.length)];
      const seg = SEGMENTS[Math.floor(rand() * SEGMENTS.length)];
      const px = seg.cx + (rand() - 0.5) * (ROAD_W - 70);
      const py = seg.y1 + 180 + rand() * (seg.y2 - seg.y1 - 280);

      const pickup = this.pickups.create(px, py, `pickup_${type}`);
      pickup.setData('type', type);
      pickup.setDepth(9);

      // Gentle floating animation
      this.tweens.add({
        targets: pickup,
        y: '-=8',
        duration: 650 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  _onGetPickup(player, pickup) {
    const type = pickup.getData('type');
    pickup.destroy();

    if (type === 'turbo') {
      this._speedMultiplier = 1.48; // ~475 px/s!
      this._turboTimer = 3500;
      this.cameras.main.flash(200, 0, 220, 255);
      this._showNoticeBanner('⚡ ¡TURBO BOOST! 470+ px/s', '#00ffff');
    } else if (type === 'slow') {
      this._speedMultiplier = 0.45; // ~145 px/s
      this._slowTimer = 2600;
      this.cameras.main.flash(200, 160, 0, 200);
      this._showNoticeBanner('🐌 ¡TRAMPA DE ACEITE! -55% VELOCIDAD', '#ff44aa');
    } else if (type === 'repair') {
      this._integrity = Math.min(100, this._integrity + 25);
      this._drawIntegrityBar();
      this.cameras.main.flash(180, 0, 255, 100);
      this._showNoticeBanner('🔧 ¡REPARACIÓN DE EMERGENCIA! +25%', '#00ff88');
    }
  }

  _updatePowerupTimers(delta) {
    if (this._turboTimer > 0) {
      this._turboTimer -= delta;
      if (this._turboTimer <= 0) {
        this._turboTimer = 0;
        if (this._slowTimer <= 0) this._speedMultiplier = 1.0;
      }
    }

    if (this._slowTimer > 0) {
      this._slowTimer -= delta;
      if (this._slowTimer <= 0) {
        this._slowTimer = 0;
        if (this._turboTimer <= 0) this._speedMultiplier = 1.0;
      }
    }
  }

  // ─── Temu AI & Special Attacks ───────────────────────────────────────────────

  _updateTemuAI(delta) {
    if (!this._started || this._finished || !this.temuCar) return;

    if (this._temuStunned) {
      const vx = this.temuCar.body.velocity.x;
      const vy = this.temuCar.body.velocity.y;
      if (Math.hypot(vx, vy) > 10) {
        const targetAngle = Phaser.Math.RadToDeg(Math.atan2(vy, vx)) + 90;
        let diff = Phaser.Math.Angle.WrapDegrees(targetAngle - this._temuAngle);
        const step = Math.min(Math.abs(diff), (600 * delta) / 1000);
        this._temuAngle += Math.sign(diff) * step;
        this.temuCar.setAngle(this._temuAngle);
      }
      return;
    }

    const temu = this.temuCar;
    const player = this.player;

    const distToPlayer = Phaser.Math.Distance.Between(temu.x, temu.y, player.x, player.y);
    const playerAhead = player.y > temu.y - 50;

    let targetX, targetY;

    if (this._temuCharging) {
      // Direct ramming target
      targetX = player.x;
      targetY = player.y;
    } else if (distToPlayer < 400 && playerAhead) {
      targetX = player.x;
      targetY = player.y;
    } else {
      let wp = TRACK_WAYPOINTS[this._temuWaypointIdx];
      const distToWp = Phaser.Math.Distance.Between(temu.x, temu.y, wp.x, wp.y);

      if (distToWp < 85 || (temu.y > wp.y + 40 && this._temuWaypointIdx < TRACK_WAYPOINTS.length - 1)) {
        if (this._temuWaypointIdx < TRACK_WAYPOINTS.length - 1) {
          this._temuWaypointIdx++;
          wp = TRACK_WAYPOINTS[this._temuWaypointIdx];
        }
      }
      targetX = wp.x;
      targetY = wp.y;
    }

    // Drunk zig-zag weaving
    const temuDrunkFreq = this._elapsedMs * 0.008;
    const temuSwerve = this._temuCharging ? 0 : Math.sin(temuDrunkFreq) * 50;

    const rawDx = targetX - temu.x;
    const rawDy = targetY - temu.y;
    const rawLen = Math.hypot(rawDx, rawDy) || 1;
    const perpX = -rawDy / rawLen;
    const perpY = rawDx / rawLen;

    const steerTargetX = targetX + perpX * temuSwerve;
    const steerTargetY = targetY + perpY * temuSwerve;

    const dx = steerTargetX - temu.x;
    const dy = steerTargetY - temu.y;
    const len = Math.hypot(dx, dy);

    if (len > 8) {
      const nx = dx / len;
      const ny = dy / len;

      const onRoad = this._isOnRoad(temu.x, temu.y);
      let desiredSpeed = 315;

      // Base speeds scale with level
      if (this._level === 2) desiredSpeed = 330;
      if (this._level === 3) desiredSpeed = 345;

      if (this._temuCharging) {
        desiredSpeed = 485; // Super Ramming Charge!
      } else if (distToPlayer > 480) {
        desiredSpeed += 40;
      }

      if (!onRoad && !this._temuCharging) {
        desiredSpeed = Math.min(desiredSpeed, 225);
      }

      const temuTraction = 0.14;
      this._temuVx = Phaser.Math.Linear(this._temuVx, nx * desiredSpeed, temuTraction);
      this._temuVy = Phaser.Math.Linear(this._temuVy, ny * desiredSpeed, temuTraction);

      temu.setVelocity(this._temuVx, this._temuVy);

      const moveAngle = Phaser.Math.RadToDeg(Math.atan2(this._temuVy, this._temuVx)) + 90;
      const aimAngle  = Phaser.Math.RadToDeg(Math.atan2(ny, nx)) + 90;
      const temuTurnDiff = Phaser.Math.Angle.WrapDegrees(aimAngle - moveAngle);
      const temuFishtail = Phaser.Math.Clamp(temuTurnDiff * 1.6, -40, 40);
      const temuDrunkWobble = this._temuCharging ? 0 : Math.cos(temuDrunkFreq * 1.3) * 10;

      const targetTemuAngle = aimAngle + temuFishtail + temuDrunkWobble;

      let diff = Phaser.Math.Angle.WrapDegrees(targetTemuAngle - this._temuAngle);
      const temuTurnRate = this._temuCharging ? 450 : 880;
      const step = Math.min(Math.abs(diff), (temuTurnRate * delta) / 1000);
      this._temuAngle += Math.sign(diff) * step;
      temu.setAngle(this._temuAngle);

      const temuSpeed = Math.hypot(this._temuVx, this._temuVy);
      if (temuSpeed > 95) {
        const temuMoveHeading = Phaser.Math.RadToDeg(Math.atan2(this._temuVy, this._temuVx)) + 90;
        const slip = Math.abs(Phaser.Math.Angle.WrapDegrees(this._temuAngle - temuMoveHeading));
        if (slip > 16) {
          this._spawnDriftSmoke(temu, this._temuAngle);
        }
      }
    }
  }

  _updateTemuBossMechanics(delta) {
    if (!this.temuCar) return;

    // 1. Bomb dropping (Levels 2 & 3)
    if (this._level >= 2) {
      this._temuBombTimer += delta;
      const bombInterval = this._level === 3 ? 5500 : 7500;
      if (this._temuBombTimer >= bombInterval) {
        this._temuBombTimer = 0;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.temuCar.x, this.temuCar.y);
        if (dist < 460) {
          this._temuDropBomb();
        }
      }
    }

    // 2. Super Turbo Ramming Charge (Levels 2 & 3)
    if (this._level >= 2) {
      if (!this._temuCharging) {
        this._temuChargeTimer += delta;
        const chargeCooldown = this._level === 3 ? 9500 : 13000;
        if (this._temuChargeTimer >= chargeCooldown) {
          this._temuChargeTimer = 0;
          this._startTemuCharge();
        }
      } else {
        this._temuChargeDuration -= delta;
        if (this._temuChargeDuration <= 0) {
          this._temuCharging = false;
        }
      }
    }
  }

  _temuDropBomb() {
    const bomb = this.bombs.create(this.temuCar.x, this.temuCar.y, 'temu_bomb');
    bomb.setDepth(9);

    this.tweens.add({
      targets: bomb,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 350,
      yoyo: true,
      repeat: -1,
    });

    this._showNoticeBanner('⚠️ ¡DON TEMU SOLTÓ UN PAQUETE BOMBA!', '#ff3300');
  }

  _onHitBomb(player, bomb) {
    bomb.destroy();
    this._integrity = Math.max(0, this._integrity - 20);

    this.cameras.main.shake(320, 0.024);
    this.cameras.main.flash(250, 255, 60, 0);

    this._spawnSparks(player.x, player.y);
    this._showNoticeBanner('💥 ¡EXPLOSIÓN DE PAQUETE TEMU! -20%', '#ff0000');

    this._playerVx *= 0.2;
    this._playerVy *= 0.2;
    this.player.setVelocity(this._playerVx, this._playerVy);

    if (this._integrity <= 0) {
      this._onBusted();
    }
  }

  _startTemuCharge() {
    this._temuCharging = true;
    this._temuChargeDuration = 2200;

    this.cameras.main.flash(200, 255, 30, 0);
    this._showNoticeBanner('🚀 ¡ALERTA: DON TEMU CARGANDO EMBESTIDA TURBO!', '#ff0033');
  }

  // ─── Collisions & Damage ─────────────────────────────────────────────────────

  _onCarCollision() {
    if (this._finished || this._isInvulnerable) return;

    this._isInvulnerable = true;
    const damage = this._temuCharging ? 28 : 20;
    this._integrity = Math.max(0, this._integrity - damage);

    this.cameras.main.shake(240, 0.018);

    const midX = (this.player.x + this.temuCar.x) / 2;
    const midY = (this.player.y + this.temuCar.y) / 2;
    this._spawnSparks(midX, midY);

    const angle = Phaser.Math.Angle.Between(this.temuCar.x, this.temuCar.y, this.player.x, this.player.y);

    const knockback = this._temuCharging ? 340 : 220;
    this.player.body.velocity.x = Math.cos(angle) * knockback;
    this.player.body.velocity.y = Math.sin(angle) * knockback;

    this.temuCar.body.velocity.x = -Math.cos(angle) * 300;
    this.temuCar.body.velocity.y = -Math.sin(angle) * 300;

    this._playerVx = this.player.body.velocity.x;
    this._playerVy = this.player.body.velocity.y;
    this._temuVx   = this.temuCar.body.velocity.x;
    this._temuVy   = this.temuCar.body.velocity.y;

    this._temuStunned = true;
    this._temuCharging = false;
    this.time.delayedCall(600, () => {
      this._temuStunned = false;
    });

    this._showHitWarning(damage);

    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.player.setAlpha(1);
        this._isInvulnerable = false;
      },
    });

    if (this._integrity <= 0) {
      this._onBusted();
    }
  }

  _spawnSparks(x, y) {
    for (let i = 0; i < 9; i++) {
      const sp = this.add.image(x, y, 'spark').setDepth(15);
      const speed = Phaser.Math.Between(90, 220);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(angle) * speed * 0.28,
        y: y + Math.sin(angle) * speed * 0.28,
        alpha: 0,
        scale: 0.2,
        duration: 380,
        onComplete: () => sp.destroy(),
      });
    }
  }

  _spawnDriftSmoke(car, carAngleDeg) {
    const now = this.time.now;
    if (now - (car._lastSmokeTime || 0) < 50) return;
    car._lastSmokeTime = now;

    const rad = Phaser.Math.DegToRad(carAngleDeg - 90);
    const rearDist = 26;
    const perpRad = rad + Math.PI / 2;
    const spread = (Math.random() - 0.5) * 16;

    const sx = car.x - Math.cos(rad) * rearDist + Math.cos(perpRad) * spread;
    const sy = car.y - Math.sin(rad) * rearDist + Math.sin(perpRad) * spread;

    const smoke = this.add.image(sx, sy, 'smoke')
      .setDepth(9)
      .setScale(Phaser.Math.FloatBetween(0.5, 0.9))
      .setAlpha(0.65);

    this.tweens.add({
      targets: smoke,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => smoke.destroy(),
    });
  }

  _spawnNitroFlames() {
    const rad = Phaser.Math.DegToRad(this._playerAngle - 90);
    const sx = this.player.x - Math.cos(rad) * 28;
    const sy = this.player.y - Math.sin(rad) * 28;

    const sp = this.add.image(sx, sy, 'spark').setDepth(9);
    sp.setTint(0x00ffff);
    this.tweens.add({
      targets: sp,
      scale: 0.1,
      alpha: 0,
      duration: 200,
      onComplete: () => sp.destroy(),
    });
  }

  _showHitWarning(dmg = 20) {
    this._showNoticeBanner(`💥 ¡EMBESTIDA DE TEMU! -${dmg}%`, '#ff2200');
  }

  _showNoticeBanner(text, color = '#ffffff') {
    const { width, height } = this.scale;
    const hitTxt = this.add.text(width / 2, height * 0.32, text, {
      fontSize: '22px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    this.tweens.add({
      targets: hitTxt,
      y: '-=35',
      alpha: 0,
      duration: 950,
      onComplete: () => hitTxt.destroy(),
    });
  }

  // ─── Weather Effects (Rain) ──────────────────────────────────────────────────

  _createRainEffect() {
    this._rainGfx = this.add.graphics().setDepth(15).setScrollFactor(0);
    this._rainDrops = [];
    const count = this._level === 3 ? 90 : 50;
    const { width, height } = this.scale;
    for (let i = 0; i < count; i++) {
      this._rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 14 + Math.random() * 8,
        len: 16 + Math.random() * 8,
      });
    }

    if (this._level === 3) {
      // Thunder flash
      this.time.addEvent({
        delay: 6000,
        loop: true,
        callback: () => {
          if (Math.random() < 0.5) this.cameras.main.flash(200, 160, 200, 255);
        },
      });
    }
  }

  _updateRain() {
    this._rainGfx.clear();
    this._rainGfx.lineStyle(1.5, 0x88aacc, 0.45);
    const { width, height } = this.scale;
    for (const d of this._rainDrops) {
      this._rainGfx.lineBetween(d.x, d.y, d.x - 3, d.y + d.len);
      d.y += d.speed;
      d.x -= 2;
      if (d.y > height) {
        d.y = -10;
        d.x = Math.random() * (width + 50);
      }
    }
  }

  // ─── Handlers: Defeat & Victory ──────────────────────────────────────────────

  _onBusted() {
    if (this._finished) return;
    this._finished = true;
    this._controlsActive = false;

    this._stopSiren();

    this.player.setVelocity(0, 0);
    this.temuCar.setVelocity(0, 0);

    this.cameras.main.flash(700, 255, 0, 0);

    this.tweens.add({
      targets: this.player,
      angle: '+=360',
      duration: 850,
      ease: 'Cubic.easeOut',
    });

    const progress = Math.min(100, Math.max(0, ((this.player.y - 200) / (4470 - 200)) * 100));

    this.time.delayedCall(1100, () => {
      this.scene.start('GameOverScene', {
        busted: true,
        level: this._level,
        progress,
        time: this._elapsedMs,
      });
    });
  }

  _onGoal() {
    if (this._finished) return;
    this._finished = true;
    this._controlsActive = false;

    this._stopSiren();

    this.player.setVelocity(0, 0);
    this.temuCar.setVelocity(0, 0);

    this.cameras.main.flash(600, 255, 255, 255);

    const totalTime = this._totalTime + this._elapsedMs;

    this.time.delayedCall(700, () => {
      if (this._level < 3) {
        // Complete current level, move to next!
        this.scene.start('GameOverScene', {
          levelCompleted: true,
          level: this._level,
          nextLevel: this._level + 1,
          time: this._elapsedMs,
          totalTime: totalTime,
        });
      } else {
        // FINAL CAMPAIGN VICTORY!
        this.scene.start('GameOverScene', {
          finalVictory: true,
          time: this._elapsedMs,
          totalTime: totalTime,
        });
      }
    });
  }

  // ─── Siren Audio ─────────────────────────────────────────────────────────────

  _startSiren() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this._audioCtx = new AudioCtx();
      const ctx = this._audioCtx;

      this._masterGain = ctx.createGain();
      this._masterGain.gain.setValueAtTime(0, ctx.currentTime);
      this._masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.2);
      this._masterGain.connect(ctx.destination);

      this._sirenOsc = ctx.createOscillator();
      this._sirenOsc.type = 'sawtooth';
      this._sirenOsc.frequency.setValueAtTime(700, ctx.currentTime);

      this._lfoOsc = ctx.createOscillator();
      this._lfoOsc.type = 'sine';
      this._lfoOsc.frequency.setValueAtTime(0.85, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(220, ctx.currentTime);
      this._lfoOsc.connect(lfoGain);
      lfoGain.connect(this._sirenOsc.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 850;
      filter.Q.value = 1.0;

      this._sirenOsc.connect(filter);
      filter.connect(this._masterGain);

      this._yelp = ctx.createOscillator();
      this._yelp.type = 'square';
      this._yelp.frequency.setValueAtTime(1150, ctx.currentTime);

      const yelpGain = ctx.createGain();
      yelpGain.gain.setValueAtTime(0.03, ctx.currentTime);

      const yelpLfo = ctx.createOscillator();
      yelpLfo.type = 'square';
      yelpLfo.frequency.setValueAtTime(2.2, ctx.currentTime);
      const yelpLfoG = ctx.createGain();
      yelpLfoG.gain.setValueAtTime(0.03, ctx.currentTime);
      yelpLfo.connect(yelpLfoG);
      yelpLfo.connect(yelpGain.gain);

      this._yelp.connect(yelpGain);
      yelpGain.connect(this._masterGain);

      this._sirenOsc.start();
      this._lfoOsc.start();
      this._yelp.start();
      yelpLfo.start();
    } catch (e) {}
  }

  _stopSiren() {
    if (!this._audioCtx) return;
    try {
      this._masterGain.gain.setTargetAtTime(0, this._audioCtx.currentTime, 0.5);
      setTimeout(() => {
        try { this._sirenOsc?.stop(); } catch (_) {}
        try { this._lfoOsc?.stop(); } catch (_) {}
        try { this._yelp?.stop(); } catch (_) {}
        try { this._audioCtx?.close(); } catch (_) {}
      }, 2000);
    } catch (e) {}
  }

  _updateSirenVolume() {
    if (!this._masterGain || !this._audioCtx || !this.temuCar) return;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.temuCar.x, this.temuCar.y);
    const vol = Math.max(0.04, 0.22 - (dist / 1800) * 0.18);
    this._masterGain.gain.setTargetAtTime(vol, this._audioCtx.currentTime, 0.3);
  }

  _updateSiren(delta) {
    if (!this.temuCar || !this._sirenLight) return;

    this._sirenTimer += delta;
    const rate = this._temuCharging ? 70 : 140;
    if (this._sirenTimer >= rate) {
      this._sirenTimer = 0;
      this._sirenToggle = !this._sirenToggle;
    }

    this._sirenLight.clear();
    if (this._started && !this._finished) {
      const x = this.temuCar.x;
      const y = this.temuCar.y;
      const color = this._temuCharging ? 0xff0000 : (this._sirenToggle ? 0x0088ff : 0xff1100);
      this._sirenLight.fillStyle(color, 0.45);
      this._sirenLight.fillCircle(x, y, this._temuCharging ? 42 : 32);
    }
  }

  _isOnRoad(x, y) {
    for (const s of SEGMENTS) {
      if (
        x >= s.cx - ROAD_W / 2 &&
        x <= s.cx + ROAD_W / 2 &&
        y >= s.y1 &&
        y <= s.y2
      ) return true;
    }
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

  // ─── HUD ─────────────────────────────────────────────────────────────────────

  _createHUD() {
    const { width, height } = this.scale;

    // Timer panel
    const panelBg = this.add.graphics().setScrollFactor(0).setDepth(100);
    panelBg.fillStyle(0x000000, 0.65);
    panelBg.fillRoundedRect(12, 12, 210, 50, 8);

    const levelNames = ['', '1: Escape Ciudad', '2: Desfiladero Rocoso', '3: Asedio Hospital'];
    this.add.text(20, 16, `⏱ Nivel ${this._level} - ${levelNames[this._level]}`, {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcc66',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(101);

    this._timerText = this.add.text(20, 32, '00:00:00', {
      fontSize: '20px',
      fontFamily: '"Courier New", monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(101);

    // Integrity Panel
    const intBg = this.add.graphics().setScrollFactor(0).setDepth(100);
    intBg.fillStyle(0x000000, 0.65);
    intBg.fillRoundedRect(230, 12, 210, 50, 8);

    this.add.text(238, 16, '🛡️ Integridad del Auto:', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(101);

    this._integrityBarG = this.add.graphics().setScrollFactor(0).setDepth(101);
    this._integrityText = this.add.text(376, 32, '100%', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(101);

    // Temu Alert Radar (top center)
    this._radarText = this.add.text(width / 2 + 60, 20, '🚔 Don Temu: Esperando salida', {
      fontSize: '17px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ffaa44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0);

    // Speed & Power-up indicator (top right)
    this._speedText = this.add.text(width - 16, 16, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcc44',
      align: 'right',
    }).setScrollFactor(0).setDepth(101).setOrigin(1, 0);

    this._powerupText = this.add.text(width - 16, 36, '', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#00ffff',
      fontStyle: 'bold',
      align: 'right',
    }).setScrollFactor(0).setDepth(101).setOrigin(1, 0);

    this._countdownText = this.add.text(width / 2, height / 2, '', {
      fontSize: '96px',
      fontFamily: 'Impact, Arial Black, sans-serif',
      color: '#ff4400',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5);

    this._createTouchButtons();
    this._drawIntegrityBar();
  }

  _drawIntegrityBar() {
    this._integrityBarG.clear();
    const bx = 238, by = 34, bw = 130, bh = 14;

    this._integrityBarG.fillStyle(0x333333, 1);
    this._integrityBarG.fillRoundedRect(bx, by, bw, bh, 3);

    let color = 0x00ff88;
    if (this._integrity <= 40) color = 0xff2200;
    else if (this._integrity <= 60) color = 0xffbb00;

    const fillW = Math.max(0, (bw * this._integrity) / 100);
    this._integrityBarG.fillStyle(color, 1);
    this._integrityBarG.fillRoundedRect(bx, by, fillW, bh, 3);

    this._integrityText.setText(`${this._integrity}%`);
    this._integrityText.setColor(this._integrity <= 40 ? '#ff4444' : (this._integrity <= 60 ? '#ffcc00' : '#00ff88'));
  }

  _updateHUDIndicators() {
    this._drawIntegrityBar();

    const currentSpeed = Math.round(Math.hypot(this._playerVx, this._playerVy));
    this._speedText.setText(`${currentSpeed} px/s`);

    // Powerup status text
    if (this._turboTimer > 0) {
      this._powerupText.setText(`⚡ TURBO: ${(this._turboTimer / 1000).toFixed(1)}s`);
      this._powerupText.setColor('#00ffff');
    } else if (this._slowTimer > 0) {
      this._powerupText.setText(`🐌 ACEITE: ${(this._slowTimer / 1000).toFixed(1)}s`);
      this._powerupText.setColor('#ff44aa');
    } else {
      const onRoad = this._isOnRoad(this.player.x, this.player.y);
      this._powerupText.setText(onRoad ? '🛣 Asfalto' : '🌿 Pasto (-50%)');
      this._powerupText.setColor(onRoad ? '#aaffaa' : '#aaaaaa');
    }

    if (this.temuCar) {
      const distPx = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.temuCar.x, this.temuCar.y);
      const distM = Math.max(1, Math.round(distPx / 10));

      if (this._temuCharging) {
        this._radarText.setText('🚨 ¡DON TEMU TE EMBISTE CON TURBO! 🚨');
        this._radarText.setColor('#ff0000');
        this._radarText.setScale(1.1);
      } else if (distPx < 250) {
        this._radarText.setText(`🚨 ¡TEMU TE ALCANZA! ${distM}m 🚨`);
        this._radarText.setColor('#ff2200');
        this._radarText.setScale(1.05);
      } else if (distPx < 450) {
        this._radarText.setText(`⚠️ Don Temu detrás: ${distM}m`);
        this._radarText.setColor('#ff7700');
        this._radarText.setScale(1);
      } else {
        this._radarText.setText(`🚔 Patrulla Temu: ${distM}m`);
        this._radarText.setColor('#ffcc00');
        this._radarText.setScale(1);
      }
    }
  }

  _updateTimerText() {
    const total = Math.floor(this._elapsedMs);
    const ms    = total % 1000;
    const sec   = Math.floor(total / 1000) % 60;
    const min   = Math.floor(total / 60000);

    this._timerText.setText(
      `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(Math.floor(ms / 10)).padStart(2, '0')}`
    );
  }

  _showCountdown() {
    this._controlsActive = false;
    const { width, height } = this.scale;

    const steps = ['3', '2', '1', `¡NIVEL ${this._level}!`];
    let i = 0;

    const show = () => {
      if (i >= steps.length) {
        this._countdownText.setText('');
        this._controlsActive = true;
        this._started = true;
        this._startSiren();
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

  _createTouchButtons() {
    const { width, height } = this.scale;
    const SIZE   = 64;
    const MARGIN = 14;
    const PAD    = SIZE + MARGIN;

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

    this.input.addPointer(3);
  }
}

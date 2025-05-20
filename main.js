import "./style.css";
import Phaser from "phaser";

const sizes = {
  width: 1000,
  height: 700,
};

const speedDown = 300
const jumpVelocity = -400;

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player
    this.cursor
    this.playerSpeed=speedDown+50
    this.target
    this.points = 0
    this.platforms

  }

  preload() {
    this.load.image("bg","/assets/background.png");
    this.load.image("player","/assets/player_1.png");
    this.load.image("step","/assets/step.png").si
  }

  create() {
  //we use two bg elements to alternate between them so we can scroll down
  this.bg1 = this.add.image(0, 0, "bg").setOrigin(0, 0).setDisplaySize(sizes.width, sizes.height);
  this.bg2 = this.add.image(0, -sizes.height, "bg").setOrigin(0, 0).setDisplaySize(sizes.width, sizes.height);

  this.platforms = this.physics.add.staticGroup();

  const floor = this.platforms.create(sizes.width / 2, sizes.height - 65, "step");
  floor.setDisplaySize(sizes.width, 35).refreshBody(); // make it wide like the screen

  this.platforms.create(200, 400, "step").setDisplaySize(150, 40).refreshBody();
  this.platforms.create(500, 400, "step").setDisplaySize(150, 40).refreshBody();
  this.platforms.create(800, 400, "step").setDisplaySize(150, 40).refreshBody();
  
  // Player in center above the floor
  this.player = this.physics.add.sprite(sizes.width / 2, sizes.height - 150, "player");
  this.player.setScale(0.5); 
  this.player.setBounce(0.5);

  this.physics.add.collider(this.player, this.platforms);

  this.cursor = this.input.keyboard.createCursorKeys();

}


  update() {
  const { left, right, up } = this.cursor;
  const bgScrollSpeed = 2;

  this.bg1.y += bgScrollSpeed;
  this.bg2.y += bgScrollSpeed;
  if (this.bg1.y >= sizes.height) {
  this.bg1.y = this.bg2.y - sizes.height;
}
if (this.bg2.y >= sizes.height) {
  this.bg2.y = this.bg1.y - sizes.height;
}
  

  if (left.isDown) {
    this.player.setVelocityX(-200);
  } else if (right.isDown) {
    this.player.setVelocityX(200);
  } else {
    this.player.setVelocityX(0);
  }

  // Only allow jump if player is touching the ground
  if (up.isDown && this.player.body.touching.down) {
    this.player.setVelocityY(jumpVelocity);
  }
}

  
 

}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: speedDown },
      debug: true,
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

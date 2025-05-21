import "./style.css";
import Phaser from "phaser";

const sizes = {
  width: 1000,
  height: 700,
};
const step_sizes = {
  width: 40,
  height: 150,
};
const step_locations = {
  x1: 200,
  x2: 500,
  x3:800
};

  const bgScrollSpeed = 1;
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
    this.floors
    this.floor
    this.step1
    this.step2
    this.step3
    this.isPaused = true;
  }

  preload() {
    this.load.image("bg","/assets/background.png");
    this.load.image("player","/assets/player_1.png");
    this.load.image("step","/assets/step.png").si
  }

  create() {

this.pauseBtn = document.getElementById("pauseBtn");
this.playBtn = document.getElementById("playBtn");
this.restartBtn = document.getElementById("restartBtn");
this.countdownText = document.getElementById("countdown");

// Button events
this.pauseBtn.addEventListener("click", () => this.pauseGame());
this.playBtn.addEventListener("click", () => this.startCountdown());
this.restartBtn.addEventListener("click", () => this.restartGame());

this.pauseBtn.style.display = "none";
this.playBtn.style.display = "inline"; 

  
  //we use two bg elements to alternate between them so we can scroll down
  this.bg1 = this.add.image(0, 0, "bg").setOrigin(0, 0).setDisplaySize(sizes.width, sizes.height);
  this.bg2 = this.add.image(0, -sizes.height, "bg").setOrigin(0, 0).setDisplaySize(sizes.width, sizes.height);

  this.platforms = this.physics.add.staticGroup();
  this.floors  = this.physics.add.staticGroup();
  this.floor = this.floors.create(sizes.width / 2, sizes.height - 150, "step");
  this.floor.setDisplaySize(sizes.width, 35).refreshBody(); // make it wide like the screen

  this.step1 = this.platforms.create(step_locations.x1, 300, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
  this.step2 = this.platforms.create(step_locations.x2, 300, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
  this.step3 = this.platforms.create(step_locations.x3, 300, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
  
  // Player in center above the floor
  this.player = this.physics.add.sprite(sizes.width / 2, sizes.height - 250, "player");
  this.player.setScale(0.5); 
  this.player.setBounce(0.5);

  this.physics.add.collider(this.player, this.platforms, this.handleStepLanding, null, this);
  this.physics.add.collider(this.player, this.floors);

  this.cursor = this.input.keyboard.createCursorKeys();

}

startCountdown() {
  this.playBtn.style.display = "none";
  this.countdownText.style.display = "block";
  let count = 3;

  this.countdownText.innerText = count;
  this.time.addEvent({
    delay: 1000,
    repeat: 2,
    callback: () => {
      count--;
      this.countdownText.innerText = count > 0 ? count : "GO!";
      if (count === 0) {
        this.time.delayedCall(500, () => {
          this.countdownText.style.display = "none";
          this.startGame();
        });
      }
    }
  });
}

startGame() {
  this.isPaused = false;
  this.physics.resume();
  this.pauseBtn.style.display = "inline";
  this.restartBtn.style.display = "inline";
}

pauseGame() {
  this.isPaused = true;
  this.physics.pause();
  this.pauseBtn.style.display = "none";
  this.playBtn.style.display = "inline";
}

restartGame() {
  this.scene.restart(); // reload the whole scene
}

  update() {
  if (this.isPaused) return;
  const { left, right, up } = this.cursor;
  this.bg1.y += bgScrollSpeed;
  this.bg2.y += bgScrollSpeed;
  this.player.y += bgScrollSpeed;
  this.platforms.children.iterate((child) => {
  child.y += bgScrollSpeed;
  child.body.y += bgScrollSpeed;
  })

  this.floors.children.iterate((child) => {
  child.y += bgScrollSpeed;
  child.body.y += bgScrollSpeed;
  })

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
    this.physics.add.collider(this.player, this.platforms, this.handleStepLanding, null, this);

}

handleStepLanding = (player, step) => {
  if(player.body.touching.down && step.body.touching.up ){
    step.setDisplaySize(sizes.width,35).refreshBody()
    this.floor=step
    this.platforms.remove(step,false);
    this.floors.add(step)
    step.x=sizes.width/2
    
    const toRemove = [];

    this.platforms.children.iterate((child) => {
      if (child !== this.floor) {
        toRemove.push(child);
      }
    });

    toRemove.forEach((child) => {
    child.destroy(); // safely destroy after collection
    });

    this.platforms.clear(false); // clean up group reference
    this.physics.world.step(0); 
    [step_locations.x1, step_locations.x2, step_locations.x3].forEach(x => {
    this.platforms.create(x, step.y-200, "step").setDisplaySize(150, 40).refreshBody();
    });
  }
    

};


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

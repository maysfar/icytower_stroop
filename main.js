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

const bgScrollSpeed = 1.2;
const speedDown = 300
const jumpVelocity = -400;

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.sessionIndex = 0;       // Current session number (starts at 0)
    this.trialIndex = 0;         // Current trial number within the session
    this.trialsPerSession = 2;   // How many trials in each session
    this.totalSessions = 6;      // How many sessions in total
    this.players
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
    this.stroopWords = ["apple", "bike", "Red", "Blue", "Green", "Yellow", "House"];
    this.colors = ["red", "green", "blue"];
    this.colorMap = {
      red: "R",
      green: "G",
      blue: "B"
    };
    this.rtStartTime = null;
    this.reacted = false;
    this.sessionLabelOrder = ["R", "G", "B"]; // default order
    this.nonResponseHandled = false;
    this.permutations = [["R", "G", "B"], ["R", "B", "G"], ["G", "R", "B"],
    ["G", "B", "R"],["B", "R", "G"],["B", "G", "R"]];
    this.BgMusic;
    this.stepSound;
    this.superSound;
    this.hurryupSound;
  }

  preload() {
    this.load.image("bg","/assets/background.png");
    this.load.image("player","/assets/player_1.png");
    this.load.image("step","/assets/step.png");
    this.load.audio("BgMusic", "/assets/BgMusic.mp3");
    this.load.audio("stepSound", "/assets/step.mp3");
    this.load.audio("superSound", "/assets/super.mp3");
    this.load.audio("hurryupSound", "/assets/hurryup.mp3");
  }

  create() {

    this.BgMusic = this.sound.add("BgMusic");
    this.stepSound = this.sound.add("stepSound");
    this.superSound = this.sound.add("superSound");
    this.hurryupSound = this.sound.add("hurryupSound");
    this.BgMusic.play();

    this.pauseBtn = document.getElementById("pauseBtn");
    this.playBtn = document.getElementById("playBtn");
    this.restartBtn = document.getElementById("restartBtn");
    this.countdownText = document.getElementById("countdown");
    this.breakScreen = document.getElementById("breakScreen");


    // Button events
    this.pauseBtn.addEventListener("click", () => this.pauseGame());
    this.playBtn.addEventListener("click", () => this.startCountdown());
    this.restartBtn.addEventListener("click", () => this.restartGame());
    this.nextSessionBtn = document.getElementById("nextSessionBtn");


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

    this.stroopText = this.add.text(sizes.width / 2, 50, "", {
    fontSize: "48px",
    fontStyle: "bold",
    color: "#fff"
    }).setOrigin(0.5);

    this.score = 0;
  this.scoreText = this.add.text(sizes.width - 20, 20, "Score: 0", {
    fontSize: "24px",
    color: "#fff"
  }).setOrigin(1, 0);

    this.cursor = this.input.keyboard.createCursorKeys();
    this.rtText = this.add.text(sizes.width - 20, 50, "RT: -", {
    fontSize: "20px",
    color: "#fff"
  }).setOrigin(1, 0);

  this.feedbackText = this.add.text(sizes.width / 2, sizes.height / 2, "", {
  fontSize: "36px",
  color: "#ff0000",
  fontStyle: "bold"
}).setOrigin(0.5);
    
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

  this.setNewStroopTrial();
}

pauseGame() {
  this.isPaused = true;
  this.physics.pause();
  this.pauseBtn.style.display = "none";
  this.playBtn.style.display = "inline";
}

restartGame() {
  this.isPaused = true;
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
 if (child.labelText) {
    child.labelText.y += bgScrollSpeed;
  }
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
  if (!this.reacted && (left.isDown || right.isDown || up.isDown)) {
  this.reacted = true;
  const rt = this.time.now - this.rtStartTime;
  this.rtText.setText("RT: " + rt.toFixed(0) + " ms");
}
  const firstPlatform = this.platforms.getChildren()[0];
  if (
    this.player.y - this.player.displayHeight / 2 > sizes.height ||
    (firstPlatform && firstPlatform.y > sizes.height)
  ) {
    this.isPaused = true;
    this.handleNonResponse();
  }

}

handleStepLanding = (player, step) => {
  if(player.body.touching.down && step.body.touching.up ){
    this.stepSound.play();
    step.setDisplaySize(sizes.width,35).refreshBody()
    step.labelText.destroy()
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
      if (child.labelText) {
      child.labelText.destroy()
    }
    child.destroy();
    
    });

    this.platforms.clear(false); // clean up group reference
    this.physics.world.step(0); 
    [step_locations.x1, step_locations.x2, step_locations.x3].forEach(x => {
    this.platforms.create(x, step.y-200, "step").setDisplaySize(150, 40).refreshBody();
    });

        const jumpedLabel = step.label;
if (jumpedLabel === this.currentCorrectLetter) {
  this.score += 1;
  this.scoreText.setText("Score: " + this.score);
}

// Move to the next trial or session
this.trialIndex += 1;

if (this.trialIndex >= this.trialsPerSession) {
  this.sessionIndex += 1;
  this.trialIndex = 0;

  if (this.sessionIndex >= this.totalSessions) {
    this.endGamePhase(); // End game if all sessions done
    return;
  }

  this.showSessionBreak(); // <-- Now this works because we built it
  return;
}

this.setNewStroopTrial();
  }


};

setNewStroopTrial() {
  this.rtStartTime = this.time.now;
  this.reacted = false;
  const word = Phaser.Utils.Array.GetRandom(this.stroopWords);
  const color = Phaser.Utils.Array.GetRandom(this.colors);
  this.currentColor = color;
  this.currentCorrectLetter = this.colorMap[color];

  this.stroopText.setText(word).setColor(color);

  const labels = this.sessionLabelOrder;

  let i = 0;
  this.platforms.children.iterate(step => {
    if (step !== this.floor) {
      if (!step.labelText) {
        step.labelText = this.add.text(0, 0, "", {
          fontSize: "32px",
          color: "#fff"
        }).setOrigin(0.5);
      }

      step.label = labels[i];
      step.labelText.setText(step.label);
      step.labelText.setPosition(step.x, step.y - 30); // above the step
      i++;
    }
  });
}


 showSessionBreak() {
  this.isPaused = true;
  this.breakScreen.style.display = "block";
  this.superSound.play();

  this.nextSessionBtn.onclick = () => {
    this.breakScreen.style.display = "none";
    this.sessionLabelOrder = this.permutations[this.sessionIndex];
    this.startCountdown(); // <- same countdown you use at the beginning

  };
}

endGamePhase() {
  this.isPaused = true;

  this.add.text(sizes.width / 2, sizes.height / 2, "Task Complete!", {
    fontSize: "48px",
    color: "#ffffff"
  }).setOrigin(0.5);

  this.time.delayedCall(2000, () => {
    window.location.href = "qualtrics.html";
  });
}

handleNonResponse() {
  console.log("⛔ Non-response detected first time");
  if (this.nonResponseHandled) return;
  this.nonResponseHandled = true;

  console.log("⛔ Non-response detected");
  this.feedbackText.setText("Try to respond faster!");
  this.hurryupSound.play();



  this.time.delayedCall(500, () => {
    this.trialIndex++;

    if (this.trialIndex >= this.trialsPerSession) {
      this.sessionIndex++;
      this.trialIndex = 0;

      if (this.sessionIndex >= this.totalSessions) {
        this.feedbackText.setText("");
        this.cleanup();
        this.CreateNewFloors();
        this.endGamePhase();

        return;
      }

      this.cleanup();
      this.CreateNewFloors();
      this.feedbackText.setText("");
      this.showSessionBreak();
      this.nonResponseHandled = false;
  
      return;
    }

    this.cleanup();
    this.CreateNewFloors();
    // 🧠 Reset trial
    this.time.delayedCall(500, () => {
      this.feedbackText.setText("");
      this.setNewStroopTrial();
    });

    this.isPaused = false;
    this.nonResponseHandled = false;
  });
}

cleanup(){ // come back here to remove the blue border line .
    // 🧹 Clean up all current platforms
    this.platforms.children.iterate(step => {
      if (step && step.labelText) {
        step.labelText.destroy();
      }
      if (step) step.destroy();
    });
    this.platforms.clear(true);

    // 🧹 Clean up the floor if it exists
    if (this.floor) {
      this.floors.remove(this.floor, true, true);
    }

}

CreateNewFloors(){
  
    // 🧱 Create new floor
    this.floor = this.floors.create(sizes.width / 2, sizes.height - 150, "step");
    this.floor.setDisplaySize(sizes.width, 35).refreshBody();

    // 🧱 Create new steps
    this.step1 = this.platforms.create(step_locations.x1, 300, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step2 = this.platforms.create(step_locations.x2, 300, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step3 = this.platforms.create(step_locations.x3, 300, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();

    // 👤 Reset player
    this.player.y = sizes.height - 250;

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

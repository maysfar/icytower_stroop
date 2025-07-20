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


    //we use two bg elements to alternate between them so we can scroll down
    this.bg1 = this.add.image(0, 0, "bg").setOrigin(0, 0).setDisplaySize(sizes.width, sizes.height);
    this.bg2 = this.add.image(0, -sizes.height, "bg").setOrigin(0, 0).setDisplaySize(sizes.width, sizes.height);

    this.platforms = this.physics.add.staticGroup();
    this.floors  = this.physics.add.staticGroup();
    this.floor = this.floors.create(sizes.width / 2, sizes.height - 150, "step");
    this.floor.setDisplaySize(sizes.width, step_sizes.width).refreshBody(); // make it wide like the screen

    const firstStepY = this.floor.y - 200;
    this.step1 = this.platforms.create(step_locations.x1, firstStepY, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step2 = this.platforms.create(step_locations.x2, firstStepY, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step3 = this.platforms.create(step_locations.x3, firstStepY, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    // Player in center above the floor
    this.player = this.physics.add.sprite(sizes.width / 2, sizes.height - 250, "player");
    this.player.setScale(0.5); 
    this.player.setBounce(0.5);
    this.player.setCollideWorldBounds(true);
    this.player.body.world.bounds.bottom = Infinity; 

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
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.rtText = this.add.text(sizes.width - 20, 50, "RT: -", {
    fontSize: "20px",
    color: "#fff"
  }).setOrigin(1, 0);

  this.feedbackText = this.add.text(sizes.width / 2, sizes.height / 2, "", {
  fontSize: "36px",
  color: "#ff0000",
  fontStyle: "bold"
}).setOrigin(0.5);

this.stroopText.setText("Press Space to start").setColor("#ffffffff");
this.stroopText.setVisible(true);
}



startGame() {
  this.isPaused = false;
  this.physics.resume();

  this.setNewStroopTrial();
}

pauseGame() {
  this.isPaused = true;
  this.physics.pause();

}

restartGame() {
  this.isPaused = true;
  this.scene.restart(); // reload the whole scene
}

update() {
if (this.isPaused && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
  const text = this.stroopText.text;

  if (text.includes("Session Complete")) {
    // End of session → start next
    this.sessionLabelOrder = this.permutations[this.sessionIndex];
    this.startGame();
  } else if (text.includes("Press Space to start")) {
    // First trial or restart → start game
    this.startGame();  
  }
}
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
  
if (!this.reacted && !this.isPaused) {
  if (Phaser.Input.Keyboard.JustDown(this.cursor.left)) {
    this.handleResponse(this.step1);
  } else if (Phaser.Input.Keyboard.JustDown(this.cursor.up)) {
    this.handleResponse(this.step2);
  } else if (Phaser.Input.Keyboard.JustDown(this.cursor.right)) {
    this.handleResponse(this.step3);
  }
}
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
handleResponse(step) {
  this.reacted = true;
  const rt = this.time.now - this.rtStartTime;
  this.rtText.setText("RT: " + rt.toFixed(0) + " ms");

  // Play jump sound if you like
  this.stepSound.play();

  // Animate arc jump
  this.arcJumpToStep(step);
}

arcJumpToStep(step) {
  const startX = this.player.x;
  const startY = this.player.y;

  //capture step's position at jump start
  const endX = step.x;
  const endY = step.y - 100; // fixed offset above platform

  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 150;

  // Freeze physics
  this.player.body.allowGravity = false;
  this.player.body.setVelocity(0, 0);

  //Lock step in place for this jump
  const stepTarget = { x: endX, y: endY };

  this.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 400,
    ease: 'Sine.easeInOut',
    onUpdate: (tween) => {
      const t = tween.getValue();
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * stepTarget.x;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * stepTarget.y;
      this.player.setPosition(x, y);
    },
    onComplete: () => {
      this.player.body.allowGravity = true;

      // Force snap to final position
      this.player.setPosition(stepTarget.x, stepTarget.y);

      this.handleStepLanding(this.player, step);
    }
  });
}

handleStepLanding = (player, step) => {
  if(player.body.touching.down && step.body.touching.up ){
    this.stepSound.play();
    step.setDisplaySize(sizes.width,step_sizes.width).refreshBody()
    step.labelText.destroy()
    this.floor=step
    this.platforms.remove(step,false);
    this.floors.add(step)
    step.x=sizes.width/2
    step.refreshBody()
    
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
    this.step1 = this.platforms.create(step_locations.x1, step.y-200, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step2 = this.platforms.create(step_locations.x2, step.y-200, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step3 = this.platforms.create(step_locations.x3, step.y-200, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
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
  this.reacted = false;
  this.rtStartTime = null;

  // Show fixation cross "+"
  this.stroopText.setText("+").setColor("#ffffff").setFontSize("64px");
  this.stroopText.setVisible(true);

  // Delay before showing Stroop stimulus
  this.time.delayedCall(500, () => {
    const word = Phaser.Utils.Array.GetRandom(this.stroopWords);
    const color = Phaser.Utils.Array.GetRandom(this.colors);
    this.currentColor = color;
    this.currentCorrectLetter = this.colorMap[color];

    this.stroopText.setText(word).setColor(color);

    const labels = this.sessionLabelOrder;
    let i = 0;
    this.platforms.children.iterate((step) => {
      if (step !== this.floor) {
        if (!step.labelText) {
          step.labelText = this.add.text(0, 0, "", {
            fontSize: "32px",
            color: "#fff"
          }).setOrigin(0.5);
        }
        step.label = labels[i];
        step.labelText.setText(step.label);
        step.labelText.setPosition(step.x, step.y - 30);
        i++;
      }
    });
    // Now we start measuring RT
    this.rtStartTime = this.time.now;
  });
}


 showSessionBreak() {
  this.isPaused = true;
  this.stroopText.setText("Session Complete\nPress Space to continue").setColor("#ffffffff");
  this.stroopText.setVisible(true);
  this.superSound.play();

}

endGamePhase() {
  this.isPaused = true;

  this.stroopText.setText("Task Complete!").setColor("#ffffffff");
  this.stroopText.setVisible(true);


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
    const platformsArray = []
    this.platforms.children.iterate(step => {
     platformsArray.push(step);
    });
    platformsArray.forEach((step)=>{
      if(step.labelText){
        step.labelText.destroy()
      }
      step.destroy();
    })    
    this.platforms.clear(true);

    // 🧹 Clean up the floor if it exists
    if (this.floor) {
      this.floors.remove(this.floor, true, true);
    }

}

CreateNewFloors(){
  
    // 🧱 Create new floor
    this.floor = this.floors.create(sizes.width / 2, sizes.height - 150, "step");
    this.floor.setDisplaySize(sizes.width, step_sizes.width).refreshBody();

    // 🧱 Create new steps
    const firstStepY = this.floor.y - 200;
    this.step1 = this.platforms.create(step_locations.x1,firstStepY , "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step2 = this.platforms.create(step_locations.x2, firstStepY, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();
    this.step3 = this.platforms.create(step_locations.x3, firstStepY, "step").setDisplaySize(step_sizes.height, step_sizes.width).refreshBody();

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

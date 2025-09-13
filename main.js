import "./style.css";
import Phaser from "phaser";
import { exportCSV } from "./exportCSV.js";

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
const TRIAL_MS = 2000; //trial length
const FAST_TARGET_Y =200 ;   // stroop text is on 50 so this is 150 bellow we good
const FAST_DURATION = 500;   // the same delay between + and stim
const COLORS = ["red", "green", "blue"];        // ink colors
const COLOR_HEX_MAP = {
  red:   "#FF0000",
  green: "#00FF00",
  blue:  "#0000FF"
};
const COLOR_WORDS = ["RED", "GREEN", "BLUE"];   // text for congruent/incongruent
const NEUTRAL_WORDS = ["APPLE", "BIKE", "HOUSE", "BOOK", "TREE", "CAR", "DOG", "CAT"];

const colors = ["#FF0000", "#00FF00", "#0000FF"];
const demoTrials = [
  { word: "RED",  color: colors[0] },
  { word: "BLUE", color: colors[1] },
  { word: "TREE", color: colors[2] },
  { word: "GREEN",color: colors[0] },
  { word: "BOOK", color: colors[1] },
  { word: "BLUE", color: colors[2] },
];



class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.sessionIndex = 0;       // Current session number (starts at 0)
    this.trialIndex = 0;         // Current trial number within the session
    this.trialsPerSession = 2;   // How many trials in each session
    this.totalSessions = 2;      // How many sessions in total
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
    this.colorMap = {
      red: "R",
      green: "G",
      blue: "B"
    };
    this.rtStartTime = null;
    this.reacted = false;
    this.sessionLabelOrder = ["R", "G", "B"]; // default order
    this.nonResponseHandled = false;

    this.BgMusic;
    this.stepSound;
    this.superSound;
    this.hurryupSound;
    this.trialDeadline = null;   
    this.timeoutActive = false; 
    // --- DEMO (Step 1) ---
    this.inDemo = true;               // start in demo mode
    this.demoIndex = 0;               // single demo trial
    this.demoTimeoutMs = 15000;       // longer read time
    this.demoCurrent = null;
    this.demoTrials = demoTrials
 

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

    //storing data
    this.trialData = [];
    this.currentTrial = null;
    this.rtStartHR = null;

    this.stroopText = this.add.text(sizes.width / 2, 50, "", {
    fontSize: "48px",
    fontStyle: "bold",
    color: "#fff"
    }).setOrigin(0.5).setDepth(1000);
    this.stroopText.setBackgroundColor("#000000")
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
}).setOrigin(0.5)
.setDepth(9999); ;

// existing stroopText...
this.stroopText.setText("Press Space to start").setFontSize(48).setColor("#ffffffff");
this.stroopText.setVisible(true);

// NEW: introText (wrapped, anchored to top)
this.introText = this.add.text(sizes.width / 2, 8, "", {
  fontFamily: "Arial",
  fontSize: "28px",
  fontStyle: "bold",
  color: "#ffffff",
  align: "center",
  wordWrap: { width: sizes.width * 0.9 }
})
.setOrigin(0.5, 0)          // top-center, so it won’t get clipped
.setDepth(1001)
.setBackgroundColor("#000000")
.setPadding(8, 8, 8, 8)
.setVisible(false);

this.demoHintText = this.add.text(sizes.width / 2, sizes.height / 2 - 140, "", {
  fontFamily: "Arial",
  fontSize: "28px",
  fontStyle: "bold",
  color: "#ffffff",
  align: "center",
  wordWrap: { width: sizes.width * 0.9 }
})
.setOrigin(0.5)
.setDepth(1002)
.setBackgroundColor("#000000")
.setPadding(8, 8, 8, 8)
.setVisible(false);

// show the intro now
this.showDemoIntro();

}



startGame() {
  this.inDemo = false;
  this.rtText.setVisible(true).setText("RT: -");
  this.introText?.setVisible(false);   // NEW
    this.stroopText
    .setVisible(true)
    .setText("")
    .setOrigin(0.5, 0.5)
    .setPosition(sizes.width / 2, 50)
    .setBackgroundColor("#000000")
    .setFontSize(48)
    .setColor("#ffffffff")
    .setStyle({ wordWrap: { width: 0 } });
  this.feedbackText.setText("").setVisible(true);
  this.rtText.setText("RT: -");
  this.resetTrialState();
  this.isPaused = false;
  this.physics.resume();
  this.cleanup();
  this.CreateNewFloors();

  this.setNewStroopTrial();
}



update() {
    // --- handle Space while paused ---
  if (this.isPaused && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
    const text = this.stroopText.text;

    if (text.includes("Session Complete")) {
      // End of session → start next
      this.resetTrialState({ forNewSession: true });
      this.startGame();

    } else if (text.includes("Press Space to start")) {
      // First screen → demo first, then game
      this.time.delayedCall(300, () => {  if (this.inDemo) this.startDemo();
      else this.startGame();});
     
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
  
if (!this.reacted && !this.isPaused && this.stroopText.text != "+") {
  if (Phaser.Input.Keyboard.JustDown(this.cursor.left)) {
    this.handleResponse(this.step1);
  } else if (Phaser.Input.Keyboard.JustDown(this.cursor.up)) {
    this.handleResponse(this.step2);
  } else if (Phaser.Input.Keyboard.JustDown(this.cursor.right)) {
    this.handleResponse(this.step3);
  }
}

const firstPlatform = this.platforms.getChildren()[0];
if (
  this.player.y - this.player.displayHeight / 2 > sizes.height ||
  (firstPlatform && firstPlatform.y > sizes.height)
) {
  if (this.inDemo) {
    // Demo: retry same item; don't advance real flow
    if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; }
    this.cleanup();
    this.CreateNewFloors();
    this.reacted = false;
    this.isPaused = false;

    this.feedbackText.setText("Try again.").setStyle({ color: "#ffffff" }).setVisible(true);
    this.time.delayedCall(600, () => {
      this.feedbackText.setVisible(false);
      this.runDemoTrial();   // replay same demo item
    });
  } else {
    // Real task behavior
    this.isPaused = true;
    this.handleNonResponse();
  }
}


}

handleResponse(step) {
  if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; }
  if (this.reacted) return;
  this.reacted = true;
  if (this.demoHintText) this.demoHintText.setVisible(false);

  //  Only show/record RT in the real task
  if (!this.inDemo && this.rtStartHR != null) {
    const rt = performance.now() - this.rtStartHR;
    this.rtText.setText("RT: " + Math.round(rt) + " ms");
    if (this.currentTrial && this.currentTrial.outcome === "pending") {
      this.currentTrial.response_label = step.label;
      this.currentTrial.rt_ms = Math.round(rt);
    }
  } else if (this.currentTrial && this.currentTrial.outcome === "pending") {
    // Demo: record choice only, no RT
    this.currentTrial.response_label = step.label;
  }

  this.stepSound.play();
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
    if (step.labelText) {
      step.labelText.destroy();
    }
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
    const correct = (jumpedLabel === this.currentCorrectLetter) ? 1:0;
    // --- DEMO branch: finish or retry, don't advance real game ---
    if (this.inDemo) {
    // if you ever add a demo timer later, clear it
      if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; }

        if (correct) {
          this.feedbackText.setText("Right!").setStyle({ color: "#ffffff" }).setVisible(true);
          this.time.delayedCall(800, () => {
          this.feedbackText.setVisible(false);
          this.demoIndex += 1; // only one demo trial for now
          if (this.demoIndex >= this.demoTrials.length) {
              this.cleanup();
              this.CreateNewFloors();
            this.inDemo = false;              // demo is over
            this.isPaused = true;             // pause and show continue prompt
            this.stroopText
            .setText("Demo complete\nPress Space to start")
            .setFontSize(44)
            .setColor("#ffffffff")
            .setVisible(true);
          } else { if (this.demoHintText) this.demoHintText.setVisible(false);
                      this.runDemoTrial(); } // show next demo trial (if you add more later)

            });
          } else {
          this.feedbackText.setText("Wrong! Try again.").setStyle({ color: "#ffffff" }).setVisible(true);
          if(this.hurryupSound.isPlaying == false){
            this.hurryupSound.play();}
          this.time.delayedCall(1000, () => {
          this.feedbackText.setVisible(false);
          if (this.demoHintText) this.demoHintText.setVisible(false);
          this.runDemoTrial();              // show the same demo stimulus again
          });
          }
          return; 
          }

    if (correct) {
      this.score += 1;
      this.scoreText.setText("Score: " + this.score);
    }

    if( this.currentTrial){
      this.currentTrial.accuracy = correct;
      this.currentTrial.final_grade = correct ? 1 : 0; 
      this.currentTrial.outcome = "response";
      this.currentTrial.response_label ??= jumpedLabel;// if not null fill this value
      this.trialData.push(this.currentTrial);
      this.currentTrial = null;
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
  this.stroopText.setText("+").setFontSize(48).setColor("#ffffff").setFontSize("64px");
  this.stroopText.setVisible(true);
  this.fastForwardDownTo(FAST_TARGET_Y); 

  // Delay before showing Stroop stimulus
  this.time.delayedCall(500, () => {
  const stim = this.pickStroopStimulus();
  this.currentColor = stim.inkColor;
  this.currentCorrectLetter = this.colorMap[stim.inkColor];
  this.currentCondition = stim.condition; // handy if you log data
  this.stroopText.setText(stim.wordText).setColor(COLOR_HEX_MAP[stim.inkColor]);

  this.currentTrial = {
    session: this.sessionIndex +1,
    trial: this.trialIndex +1,
    condition: stim.condition,
    word: stim.wordText,
    ink_color: stim.inkColor,
    labels_order: this.sessionLabelOrder.join(""),
    correct_label: this.currentCorrectLetter,
    response_label: null,
    rt_ms: null,
    accuracy: 0,
    final_grade: null,                  // +1 correct, 0 wrong, -1 no response
    outcome: "pending",
    timestamp: new Date().toISOString()
  }
    
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
    this.rtStartTime = this.time.now;// phaser time 
    this.rtStartHR = performance.now();// web time - higher resolotion

    if (this.trialDeadline) { this.trialDeadline.remove(false); }
    this.timeoutActive = false;
    this.trialDeadline = this.time.delayedCall(TRIAL_MS, () => this.onTrialTimeout());
  });
}


 showSessionBreak() {
  if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; } // 
  this.isPaused = true;
  this.stroopText.setText("")
  this.time.delayedCall(1000, () => {
  this.stroopText.setText("Session Complete\nPress Space to continue").setFontSize(44).setColor("#ffffffff");
  this.stroopText.setVisible(true);})
  this.superSound.play();

}

endGamePhase() {
  this.isPaused = true;

  this.stroopText.setText("Task Complete!").setFontSize(48).setColor("#ffffffff");
  this.stroopText.setVisible(true);
  var participantId = localStorage.getItem("participantId") || "anon";
  const params = new URLSearchParams(window.location.search);
  const pidFromUrl   = params.get("pid");
  const classicFromUrl = params.get("classic");
  const gameFromUrl    = params.get("game");
  const taskVersionFromUrl     = params.get("Task_Version");

  if (pidFromUrl)     {localStorage.setItem("participantId", pidFromUrl); participantId = pidFromUrl; } 
  //if this is the first version the user completing we dont hace pidfromUr; we have the PI we set in the index thats why we need to keep these two

  if (classicFromUrl) localStorage.setItem("classicDone", classicFromUrl);
  if (gameFromUrl)    localStorage.setItem("gameDone", gameFromUrl);
  if (taskVersionFromUrl)     localStorage.setItem("taskVersion", taskVersionFromUrl);
  
  const filename = `gamified_stroop_${participantId}.csv`;
  localStorage.setItem("gameDone", "1");
  localStorage.setItem("taskVersion", "game");
  exportCSV(this.trialData, filename).finally(() => {
    // tiny buffer so the browser settles
    this.time.delayedCall(300, () => { window.location.href = "qualtrics.html"; });
  });

}

handleNonResponse() {
  if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; }
  console.log("⛔ Non-response detected first time");
  if (this.nonResponseHandled) return;
  this.nonResponseHandled = true;

  console.log("⛔ Non-response detected");
  this.feedbackText.setText("Try to respond faster!");
  if(this.hurryupSound.isPlaying == false){
    this.hurryupSound.play();}


  if(this.currentTrial && this.currentTrial.outcome === "pending"){
    this.currentTrial.accuracy = 0;
    this.currentTrial.final_grade = -1;
    this.currentTrial.outcome = this.timeoutActive ? "no_response_timeout":"no_response";
    this.currentTrial.rt_ms = this.timeoutActive ? TRIAL_MS : null;
    this.currentTrial.response_label = "NR";
    this.trialData.push(this.currentTrial);
    this.currentTrial = null;
  }
  this.time.delayedCall(1000, () => {
    this.trialIndex++;
    this.feedbackText.setText("");
    if (this.trialIndex >= this.trialsPerSession) {
      this.sessionIndex++;
      this.trialIndex = 0;

      if (this.sessionIndex >= this.totalSessions) {
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

cleanup(){ 
    const toKill = []
    this.platforms.children.iterate(platform => {
     toKill.push(platform);
    });
    this.floors.children.iterate((floor) => { toKill.push(floor); });
    toKill.forEach((step)=>{
      if(step.labelText){
        step.labelText.destroy()
      }
      step.destroy();
    })    
    this.platforms.clear(true);
    this.floors.clear(true);
    this.stroopText.setText("");
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

onTrialTimeout() {
  // If already responded or we’re paused (session break etc.), do nothing.
  if (this.reacted || this.isPaused || this.nonResponseHandled) return;

  this.timeoutActive = true;
  this.reacted = true; // lock input after timeout
  this.feedbackText.setText("Too slow!");
  if(this.hurryupSound.isPlaying == false){
    this.hurryupSound.play();}

  // Remove all collision surfaces so gravity + scroll make the player fall
  this.cleanup();

  // Do NOT advance trial here; let update() detect off-screen and call handleNonResponse()
}



// put inside GameScene
resetTrialState({ forNewSession = false } = {}) {
  if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; }
  this.timeoutActive = false;
  this.nonResponseHandled = false;
  this.reacted = false;
  this.rtStartTime = null;
  this.feedbackText.setText("");

  if (forNewSession) {
    // start from clean geometry
    this.cleanup();
    this.CreateNewFloors();
  }
}
fastForwardDownTo(yTarget, duration = FAST_DURATION) {
  const first = this.platforms.getChildren()[0];
  if (!first) return;

  const dyTotal = yTarget - first.y;  // only push DOWN
  if (dyTotal <= 0) return;// so if its under the upper limit we're good we dont need to do anything

  let last = 0;
  this.tweens.addCounter({
    from: 0,
    to: dyTotal,
    duration,
    ease: 'Sine.easeOut',
    onUpdate: (tw) => {
      const v = tw.getValue();// current tween val
      const d = v - last;    // the amount to move since the last frame
      last = v;//last tw val

      // move everything down
      this.bg1.y += d;
      this.bg2.y += d;
      this.player.y += d;

      this.platforms.children.iterate((s) => {
        s.y += d;
        s.body.y += d;
        if (s.labelText) s.labelText.y += d;
      });

      this.floors.children.iterate((f) => {
        f.y += d;
        f.body.y += d;
      });

      // bg safety
      if (this.bg1.y >= sizes.height) this.bg1.y = this.bg2.y - sizes.height;
      if (this.bg2.y >= sizes.height) this.bg2.y = this.bg1.y - sizes.height;
    }
  });
}

randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

randomChoiceExcluding(arr, exclude) {
  const filtered = arr.filter(x => x !== exclude);
  return this.randomChoice(filtered);
}

//equal 1/3 probability
pickStroopStimulus() {
  const r = Math.random();
  if (r < 1/3) {
    //CONGRUENT
    const ink = this.randomChoice(COLORS);
    const word = ink.toUpperCase(); 
    return {wordText: word, inkColor: ink, condition: "congruent"};
  } else if (r < 2/3) {
    //INCONGRUENT
    const ink = this.randomChoice(COLORS);
    const word = this.randomChoiceExcluding(COLOR_WORDS, ink.toUpperCase());
    return { wordText: word, inkColor: ink, condition:"incongruent" };
  } else {
    //NEUTRAL
    const word = this.randomChoice(NEUTRAL_WORDS);
    const ink = this.randomChoice(COLORS);
    return { wordText: word,inkColor: ink,condition:"neutral"};
  }
}

showDemoIntro() {
if (!this.introText) return;
  this.physics.pause();
  this.isPaused = true;
this.introText.setText(

  "• Left Arrow  = Left platform\n" +
  "• Up Arrow    = Middle platform\n" +
  "• Right Arrow = Right platform\n\n" +
  "Color mapping: R = Red, G = Green, B = Blue.\n\n" +
  "You'll first do a short demo (6 trials)\n\n" +
  "Press Space to start the demo."
).setVisible(true);

}

startDemo() {
  this.rtText.setVisible(false);
  this.introText?.setVisible(false);   // hide intro
  this.inDemo = true;                   // we are in demo mode
  this.resetTrialState({ forNewSession: true });
  this.isPaused = false;
  this.physics.resume();
  this.runDemoTrial();                  // show a single demo stimulus
}

runDemoTrial() {
  this.reacted = false;      // allow input for this demo trial
  this.rtStartTime = null;
  this.cleanup();
  this.CreateNewFloors();
  // fixation
  this.stroopText
    .setOrigin(0.5, 0.5)
    .setPosition(sizes.width / 2, 50)
    .setText("+")
    .setColor("#ffffff")
    .setFontSize(64)
    .setVisible(true);

  this.fastForwardDownTo(FAST_TARGET_Y);

  // after 500ms show the current classic demo item
  this.time.delayedCall(500, () => {
    const t = demoTrials[this.demoIndex] || demoTrials[0];  // use current index

    // hex -> name -> expected label "R/G/B" (no extra maps needed)
    const nameFromHex = Object.keys(COLOR_HEX_MAP)
      .find(n => COLOR_HEX_MAP[n] === t.color);
    this.currentCorrectLetter = this.colorMap[nameFromHex];

    // draw the word in its hex ink color
    this.stroopText
      .setText(t.word.toUpperCase())
      .setColor(t.color)
      .setFontSize(48);

    // put labels on steps using current order (RGB)
    const labels = this.sessionLabelOrder;
    let i = 0;
    this.platforms.children.iterate((step) => {
      if (step !== this.floor) {
        if (!step.labelText) {
          step.labelText = this.add.text(0, 0, "", { fontSize: "32px", color: "#fff" }).setOrigin(0.5);
        }
        step.label = labels[i];
        step.labelText.setText(step.label);
        step.labelText.setPosition(step.x, step.y - 30);
        i++;
      }
    });
    // Guided hint for the first 3 demo items
    if (this.demoIndex < 3) {
      const key = this.currentCorrectLetter === "R" ? "Left Arrow" :
                  this.currentCorrectLetter === "G" ? "Up Arrow" : "Right Arrow";
      this.demoHintText
        .setText(`Example: ink is ${nameFromHex}. Press ${key}.`)
        .setVisible(true);
          this.physics.pause();
          this.isPaused = true;
          this.time.delayedCall(1200, () => {
          this.physics.resume();
          this.isPaused = false;
    // keep the hint visible until they respond (do NOT hide here)
          });
          if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; }
              this.timeoutActive = false;
          }else{
        // regular demo items: keep the existing timeout
              if (this.trialDeadline) { this.trialDeadline.remove(false); this.trialDeadline = null; }
                  this.timeoutActive = false;
                  this.trialDeadline = this.time.delayedCall(
                  this.demoTimeoutMs,
                  () => this.onDemoTimeoutDemo && this.onDemoTimeoutDemo()
            );
          }

    // start demo timeout AFTER stimulus appears
  });
}


onDemoTimeoutDemo() {
  if (!this.inDemo || this.isPaused) return;     // ignore if demo ended/paused
  this.feedbackText.setText("Try again.").setStyle({ color: "#ffffff" }).setVisible(true);
  this.time.delayedCall(800, () => {
    this.feedbackText.setVisible(false);
    this.runDemoTrial();                          // replay the same demo stimulus
  });
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
